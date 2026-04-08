from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SUPABASE_URL: str = "http://localhost:54321" # Local dev by default
    SUPABASE_KEY: str = "eyJh..." # Mock key for local dev
    CLAUDE_API_KEY: str | None = None
    WHATSAPP_VERIFY_TOKEN: str = "local_dev_token"
    WHATSAPP_API_TOKEN: str | None = None
    WHATSAPP_PHONE_ID: str | None = None

    
    class Config:
        env_file = ".env"

settings = Settings()
