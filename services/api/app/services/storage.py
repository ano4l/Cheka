import io
from fastapi import UploadFile
from app.core.supabase import supabase

class StorageService:
    def __init__(self, bucket_name: str = "contracts"):
        self.bucket = bucket_name

    async def upload_file(self, file: UploadFile, user_id: str, job_id: str) -> str:
        """Uploads a file to Supabase storage and returns the generated path."""
        file_bytes = await file.read()
        file_path = f"{user_id}/{job_id}/{file.filename}"
        
        # In a real environment, you might need to check if bucket exists or ensure RLS policies
        res = supabase.storage.from_(self.bucket).upload(
            path=file_path,
            file=file_bytes,
            file_options={"content-type": file.content_type}
        )
        return file_path
    
    def get_file_url(self, file_path: str) -> str:
        """Get public url for a file."""
        return supabase.storage.from_(self.bucket).get_public_url(file_path)

storage_service = StorageService()
