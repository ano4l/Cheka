import httpx

from app.core.config import settings

class WhatsAppService:
    def __init__(self, api_token: str | None, phone_id: str | None):
        self.api_token = api_token
        self.phone_id = phone_id
        if self.api_token:
            self.headers = {
                "Authorization": f"Bearer {self.api_token}",
                "Content-Type": "application/json",
            }
        else:
            self.headers = {}
        
        self.base_url = "https://graph.facebook.com/v19.0"

    async def send_message(self, to_phone_number: str, message_text: str) -> dict:
        """Sends a text message back to the WhatsApp user."""
        if not self.api_token or not self.phone_id:
            print(f"[Mock WhatsApp] To: {to_phone_number} | Message: {message_text}")
            return {"mock": True, "message": message_text}
            
        payload = {
            "messaging_product": "whatsapp",
            "to": to_phone_number,
            "type": "text",
            "text": {"body": message_text}
        }
        
        url = f"{self.base_url}/{self.phone_id}/messages"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()

    async def download_media(self, media_id: str) -> bytes:
        """Downloads a media file sent via the WhatsApp chat."""
        if not self.api_token:
            print(f"[Mock WhatsApp] Skipping media download for media_id: {media_id}")
            return b"mock file bytes content"
            
        # First query for the media URL
        url = f"{self.base_url}/{media_id}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            media_url = data.get("url")
            
            # Now download the actual file
            # Meta returns the URL, we must pull it using Auth headers as well
            download_response = await client.get(media_url, headers=self.headers)
            download_response.raise_for_status()
            return download_response.content

whatsapp_service = WhatsAppService(settings.WHATSAPP_API_TOKEN, settings.WHATSAPP_PHONE_ID)
