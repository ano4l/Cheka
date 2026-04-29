import hmac
import hashlib
import httpx

from app.core.config import settings

PAYSTACK_API_URL = "https://api.paystack.co"

class PaystackService:
    def __init__(self, secret_key: str):
        self.secret_key = secret_key or "sk_test_mock"
        self.headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }

    @property
    def is_live(self) -> bool:
        return self.secret_key != "sk_test_mock"

    async def initialize_transaction(self, email: str, amount_cents: int, reference: str, callback_url: str) -> dict:
        """Initializes a Paystack transaction and returns the checkout URL and access code."""
        if not self.is_live:
            return {
                "authorization_url": f"https://paystack.example/checkout/{reference}",
                "access_code": f"mock_{reference}",
                "reference": reference,
            }

        payload = {
            "email": email,
            "amount": amount_cents,
            "reference": reference,
            "callback_url": callback_url
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{PAYSTACK_API_URL}/transaction/initialize",
                json=payload,
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()["data"]

    def verify_webhook_signature(self, signature: str, request_body: bytes) -> bool:
        """Verifies the Paystack webhook signature."""
        if not self.is_live:
            return False

        mac = hmac.new(
            self.secret_key.encode('utf-8'),
            request_body,
            hashlib.sha512
        ).hexdigest()
        
        return hmac.compare_digest(mac, signature)

# Assuming settings has PAYSTACK_SECRET_KEY as per .env.example
paystack_service = PaystackService(settings.PAYSTACK_SECRET_KEY or "sk_test_mock")
