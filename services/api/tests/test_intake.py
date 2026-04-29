import pytest

from app.schemas.jobs import InputType, UrlIntakeRequest
from app.services.intake import build_url_preview_request, infer_input_type


def test_infer_input_type_maps_common_file_types() -> None:
    assert infer_input_type("contract.pdf", "application/pdf") == InputType.pdf
    assert infer_input_type("offer.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document") == InputType.docx
    assert infer_input_type("scan.jpg", "image/jpeg") == InputType.image


@pytest.mark.anyio
async def test_build_url_preview_request_uses_fetched_text(monkeypatch) -> None:
    async def fake_fetch(url: str) -> str:
        assert url == "https://example.com/contract"
        return "This agreement renews automatically unless cancelled in writing after twelve months."

    monkeypatch.setattr("app.services.intake.fetch_url_text", fake_fetch)

    payload = UrlIntakeRequest(
        url="https://example.com/contract",
        disclaimer_accepted=True,
    )

    request = await build_url_preview_request(payload)

    assert request.input_type == InputType.url
    assert request.source_name == "https://example.com/contract"
    assert "renews automatically" in request.text
