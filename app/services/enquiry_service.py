from sqlalchemy.orm import Session

from app.models.enquiry import Enquiry
from app.schemas.enquiry import EnquiryCreate, EnquiryUpdate

def create_enquiry(
    db: Session,
    enquiry_data: EnquiryCreate
):
    new_enquiry = Enquiry(
        customer_name=enquiry_data.customer_name,
        phone=enquiry_data.phone,
        email=enquiry_data.email,
        raw_message=enquiry_data.raw_message
    )

    db.add(new_enquiry)
    db.commit()
    db.refresh(new_enquiry)

    return new_enquiry

def get_all_enquiries(
    db: Session
):
    return (
        db.query(Enquiry)
        .order_by(Enquiry.created_at.desc())
        .all()
    )

def get_enquiry_by_id(
    db: Session,
    enquiry_id: int
):
    return (
        db.query(Enquiry)
        .filter(Enquiry.id == enquiry_id)
        .first()
    )

def update_enquiry(
    db: Session,
      enquiry: Enquiry,
    enquiry_data: EnquiryUpdate
):
    if enquiry_data.status is not None:
        enquiry.status = enquiry_data.status

    if enquiry_data.follow_up_date is not None:
        enquiry.follow_up_date = enquiry_data.follow_up_date

    db.commit()
    db.refresh(enquiry)

    return enquiry

def apply_ai_extraction(
    db: Session,
    enquiry: Enquiry,
    extracted_data
):
    enquiry.intent = extracted_data.intent
    enquiry.location = extracted_data.location
    enquiry.action = extracted_data.action
    enquiry.requirement = extracted_data.requirement
    enquiry.budget = extracted_data.budget
    enquiry.enquiry_date = extracted_data.enquiry_date
    enquiry.number_of_people = extracted_data.number_of_people
    enquiry.additional_details = extracted_data.additional_details

    db.commit()
    db.refresh(enquiry)

    return enquiry