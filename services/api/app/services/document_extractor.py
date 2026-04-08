import io
from pypdf import PdfReader
from docx import Document
import pytesseract
from PIL import Image

def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text.strip()

def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    text = "\n".join([para.text for para in doc.paragraphs])
    return text.strip()

def extract_text_from_image(file_bytes: bytes) -> str:
    image = Image.open(io.BytesIO(file_bytes))
    text = pytesseract.image_to_string(image)
    return text.strip()

def process_document(file_bytes: bytes, filename: str, content_type: str) -> str:
    """Routes the file to the correct parser based on extension or mime type."""
    if "pdf" in content_type or filename.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif "word" in content_type or filename.endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    elif "image" in content_type or filename.endswith((".png", ".jpg", ".jpeg")):
        return extract_text_from_image(file_bytes)
    else:
        # Fallback to pure text decoding attempt
        return file_bytes.decode('utf-8', errors='ignore')
