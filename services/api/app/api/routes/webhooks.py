from fastapi import APIRouter, Request, HTTPException, status, Query, BackgroundTasks
from fastapi.responses import PlainTextResponse
import json

from app.services.paystack import paystack_service
from app.services.whatsapp import whatsapp_service
from app.core.config import settings
from app.core.supabase import supabase
from app.schemas.jobs import JobStatus, PaymentStatus, InputType
from app.services.document_extractor import process_document
from app.schemas.jobs import PreviewIntakeRequest, Market

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

@router.get("/whatsapp")
async def verify_whatsapp_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
):
    """Handles the Meta WhatsApp verify token challenge."""
    if hub_mode == "subscribe" and hub_verify_token == settings.WHATSAPP_VERIFY_TOKEN:
        return PlainTextResponse(content=hub_challenge)
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tokens do not match")

@router.post("/whatsapp")
async def whatsapp_message_received(request: Request, background_tasks: BackgroundTasks):
    """Listens for inbound text questions or documents from the WhatsApp Cloud API."""
    body = await request.json()
    
    # Meta validates body shape usually, but always handle missing elements
    try:
        entries = body.get("entry", [])
        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                value = change.get("value", {})
                messages = value.get("messages", [])
                for message in messages:
                    # Capture sender
                    phone_number = message.get("from")
                    
                    if "text" in message:
                        # Handle conversational follow-up
                        text_body = message["text"]["body"]
                        background_tasks.add_task(whatsapp_service.send_message, phone_number, f"Received your followup format: {text_body}")
                        
                    elif "document" in message or "image" in message:
                        # Handle new Intake creation
                        background_tasks.add_task(whatsapp_service.send_message, phone_number, "We received your document. Working on the payment link now...")
    except Exception as e:
        print(f"Error handling WhatsApp webhook: {str(e)}")
        
    return {"status": "ok"}

@router.post("/paystack")
async def paystack_webhook(request: Request, background_tasks: BackgroundTasks):
    """Webhook for Paystack asynchronous payment updates."""
    body = await request.body()
    signature = request.headers.get("x-paystack-signature")
    
    if not signature or not paystack_service.verify_webhook_signature(signature, body):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid signature"
        )
        
    try:
        event = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON")

    # Handle successful payment event
    if event.get("event") == "charge.success":
        data = event.get("data", {})
        reference = data.get("reference")
        
        if reference:
            # Update the payment record row
            payment_res = supabase.table("payments").update({
                "status": PaymentStatus.paid.value
            }).eq("reference", reference).execute()
            
            if payment_res.data:
                job_id = payment_res.data[0]["job_id"]
                
                # Update the job status
                supabase.table("jobs").update({
                    "status": JobStatus.processing.value
                }).eq("id", job_id).execute()
                
                # NOTE: Trigger background task to process document & analysis here.
                # Find associated whatsapp number if exists, notify them.
                
    return {"status": "ok"}
