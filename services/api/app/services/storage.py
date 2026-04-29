from fastapi import UploadFile
from app.core.supabase import supabase

class StorageService:
    def __init__(self, bucket_name: str = "contracts"):
        self.bucket = bucket_name

    async def upload_file(self, file: UploadFile, user_id: str, job_id: str) -> str:
        """Uploads a file to Supabase storage and returns the generated path."""
        file_bytes = await file.read()
        return self.upload_bytes(
            file_bytes,
            filename=file.filename or "upload.bin",
            content_type=file.content_type,
            user_id=user_id,
            job_id=job_id,
        )

    def upload_bytes(
        self,
        file_bytes: bytes,
        *,
        filename: str,
        content_type: str | None,
        user_id: str,
        job_id: str,
    ) -> str:
        """Uploads raw bytes to Supabase storage and returns the generated path."""
        file_path = f"{user_id}/{job_id}/{filename}"

        # In a real environment, you might need to check if bucket exists or ensure RLS policies
        supabase.storage.from_(self.bucket).upload(
            path=file_path,
            file=file_bytes,
            file_options={"content-type": content_type or "application/octet-stream"}
        )
        return file_path
    
    def get_file_url(self, file_path: str) -> str:
        """Get public url for a file."""
        return supabase.storage.from_(self.bucket).get_public_url(file_path)

storage_service = StorageService()
