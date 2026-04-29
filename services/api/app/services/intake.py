from __future__ import annotations

import re
from html import unescape

import httpx
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings
from app.schemas.jobs import InputType, PreviewIntakeRequest, UrlIntakeRequest
from app.services.document_extractor import process_document

_SCRIPT_STYLE_PATTERN = re.compile(r"<(script|style)\b[^>]*>.*?</\1>", re.IGNORECASE | re.DOTALL)
_TAG_PATTERN = re.compile(r"<[^>]+>")


def infer_input_type(filename: str | None, content_type: str | None) -> InputType:
    normalized_name = (filename or "").lower()
    normalized_type = (content_type or "").lower()

    if "pdf" in normalized_type or normalized_name.endswith(".pdf"):
        return InputType.pdf
    if "word" in normalized_type or normalized_name.endswith(".docx"):
        return InputType.docx
    if "image" in normalized_type or normalized_name.endswith((".png", ".jpg", ".jpeg")):
        return InputType.image
    return InputType.pdf


async def extract_uploaded_text(file: UploadFile) -> tuple[bytes, str, InputType]:
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file was empty.",
        )

    input_type = infer_input_type(file.filename, file.content_type)
    extracted_text = process_document(
        file_bytes,
        file.filename or "upload.bin",
        file.content_type or "application/octet-stream",
    )
    normalized_text = " ".join(extracted_text.split())
    if len(normalized_text) < 40:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="We could not extract enough readable contract text from that file yet.",
        )

    return file_bytes, normalized_text, input_type


def _html_to_text(html: str) -> str:
    without_scripts = _SCRIPT_STYLE_PATTERN.sub(" ", html)
    without_tags = _TAG_PATTERN.sub(" ", without_scripts)
    return " ".join(unescape(without_tags).split())


async def fetch_url_text(url: str) -> str:
    timeout = httpx.Timeout(settings.URL_FETCH_TIMEOUT_SECONDS)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        response = await client.get(url)
        response.raise_for_status()

    content_type = response.headers.get("content-type", "").lower()
    if "text/html" in content_type:
        text = _html_to_text(response.text)
    else:
        text = " ".join(response.text.split())

    if len(text) < 40:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="We fetched the URL, but there was not enough readable contract text to analyze.",
        )
    return text


async def build_url_preview_request(payload: UrlIntakeRequest) -> PreviewIntakeRequest:
    text = await fetch_url_text(str(payload.url))
    return PreviewIntakeRequest(
        input_type=InputType.url,
        market=payload.market,
        text=text,
        source_name=payload.source_name or str(payload.url),
        customer_email=payload.customer_email,
        disclaimer_accepted=payload.disclaimer_accepted,
    )
