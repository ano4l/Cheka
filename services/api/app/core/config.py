from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SUPABASE_URL: str = "http://localhost:54321" # Local dev by default
    SUPABASE_KEY: str = "eyJh..." # Mock key for local dev
    JOB_STORE_BACKEND: str = "auto"
    CLAUDE_API_KEY: str | None = None
    PAYSTACK_SECRET_KEY: str | None = None
    PAYSTACK_CALLBACK_URL: str | None = None
    PAYSTACK_DEFAULT_AMOUNT_KOBO: int = 2500
    WHATSAPP_VERIFY_TOKEN: str = "local_dev_token"
    WHATSAPP_API_TOKEN: str | None = None
    WHATSAPP_PHONE_ID: str | None = None
    ENABLE_STORAGE_UPLOADS: bool = False
    URL_FETCH_TIMEOUT_SECONDS: float = 15.0

    
    class Config:
        env_file = ".env"

settings = Settings()
