import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.enquiry import Enquiry
from app.schemas.enquiry import (
    EnquiryCreate, 
    EnquiryResponse,
    EnquiryUpdate,
    ReplyGenerationResponse,
    ReplyUpdate
)

from app.services.enquiry_service import (
    create_enquiry, 
    get_all_enquiries,
    get_enquiry_by_id,
    update_enquiry,
    apply_ai_extraction,
    save_generated_reply,
    update_generated_reply
)

from app.services.ai_service import (
    extract_enquiry_details,
    generate_enquiry_reply
)


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/api/enquiries",
    tags=["Enquiries"]
)


@router.post("/",response_model=EnquiryResponse)
def create_new_enquiry(
    enquiry: EnquiryCreate,
    db: Session = Depends(get_db)
):
    new_enquiry = create_enquiry(db, enquiry)

    try:
        extracted_data = extract_enquiry_details(
            new_enquiry.raw_message
        )

        new_enquiry = apply_ai_extraction(
            db,
            new_enquiry,
            extracted_data
        )

    except Exception:
        logger.exception(
            "AI extraction failed for enquiry ID %s",
            new_enquiry.id
        )

    return new_enquiry

@router.get("/", response_model=list[EnquiryResponse])
def get_enquiries(
    db: Session = Depends(get_db)
):

    return get_all_enquiries(db)

@router.get("/{enquiry_id}",response_model=EnquiryResponse)
def get_enquiry(
        enquiry_id: int,
        db: Session = Depends(get_db)
):
    enquiry = get_enquiry_by_id(db,enquiry_id)

    if enquiry is None:
        raise HTTPException(
            status_code=404,
            detail="Enquiry not found"
        )

    return enquiry

@router.patch("/{enquiry_id}")
def update_existing_enquiry(
    enquiry_id: int,
    enquiry_update: EnquiryUpdate,
    db: Session = Depends(get_db)
):
    enquiry = get_enquiry_by_id(
        db,
        enquiry_id,

     )

    if enquiry is None:
        raise HTTPException(
            status_code=404,
            detail="Enquiry not found"
        )

    updated_enquiry = update_enquiry(
        db,
        enquiry,
        enquiry_update

        )

    return updated_enquiry

""" @router.patch("/{enquiry_id}")
async def update_enquiry(
    enquiry_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    json_data = await request.json()

    enquiry = (
        db.query(Enquiry)
        .filter(Enquiry.id == enquiry_id)
        .first()
    )

    if enquiry is None:
        raise HTTPException(
            status_code=404,
            detail="Enquiry not found"
        )

    
    enquiry.status = json_data.get("status","Not found")

    enquiry.follow_up_date = json_data.get("follow_up_date","Not found")

    db.commit()
    db.refresh(enquiry)

    return enquiry """

@router.post("/{enquiry_id}/extract")
def extract_enquiry(
    enquiry_id: int,
    db: Session = Depends(get_db)
):
    enquiry = get_enquiry_by_id(db, enquiry_id)

    if enquiry is None:
        raise HTTPException(
            status_code=404,
            detail="Enquiry not found"
        )

    extracted_data = extract_enquiry_details(
        enquiry.raw_message
    )

    updated_enquiry = apply_ai_extraction(
        db,
        enquiry,
        extracted_data
    )

    return {
        "id": updated_enquiry.id,
        "message": "Enquiry details extracted successfully",
        "extracted_data": extracted_data
    }

@router.post("/{enquiry_id}/reply", response_model=ReplyGenerationResponse)
def generate_reply(
    enquiry_id: int,
    db: Session = Depends(get_db)
):
    enquiry = get_enquiry_by_id(db, enquiry_id)

    if enquiry is None:
        raise HTTPException(
            status_code=404,
            detail="Enquiry not found"
        )

    try:
        reply = generate_enquiry_reply(enquiry)

        save_generated_reply(
            db,
            enquiry,
            reply
        )

    except Exception:
        logger.exception(
            "Reply generation failed for enquiry ID %s",
            enquiry_id
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to generate reply"
        )

    return {
        "enquiry_id": enquiry.id,
        "reply": reply
    }

@router.put("/{enquiry_id}/reply")
def update_reply(
    enquiry_id: int,
    reply_data: ReplyUpdate,
    db: Session = Depends(get_db)
):
    enquiry = get_enquiry_by_id(db, enquiry_id)

    if enquiry is None:
        raise HTTPException(
            status_code=404,
            detail="Enquiry not found"
        )

    if not reply_data.reply.strip():
        raise HTTPException(
            status_code=422,
            detail="Reply cannot be empty"
        )

    updated_enquiry = update_generated_reply(
        db,
        enquiry,
        reply_data.reply
    )

    return {
        "enquiry_id": updated_enquiry.id,
        "reply": updated_enquiry.generated_reply,
        "message": "Reply updated successfully"
    }
    
