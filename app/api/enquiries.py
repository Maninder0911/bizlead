from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.enquiry import Enquiry
from app.schemas.enquiry import (
    EnquiryCreate, 
    EnquiryResponse,
    EnquiryUpdate
)
from app.services.enquiry_service import (
    create_enquiry, 
    get_all_enquiries,
    get_enquiry_by_id,
    update_enquiry
)


router = APIRouter(
    prefix="/api/enquiries",
    tags=["Enquiries"]
)


@router.post("/")
def create_new_enquiry(
    enquiry: EnquiryCreate,
    db: Session = Depends(get_db)
):
    new_enquiry = create_enquiry(db,enquiry)

    return {
        "id": new_enquiry.id,
        "message": "Enquiry created successfully"
    }

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
    
