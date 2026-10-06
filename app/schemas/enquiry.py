from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime


class EnquiryCreate(BaseModel):
    customer_name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    raw_message: str

class EnquiryResponse(BaseModel):
    id: int
    customer_name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    raw_message: str
    source: Optional[str] = None
    intent: Optional[str] = None
    location: Optional[str] = None
    requirement: Optional[str] = None
    budget: Optional[str] = None
    enquiry_date: Optional[date] = None
    number_of_people: Optional[int] = None
    additional_details: Optional[str] = None
    status: Optional[str] = None
    follow_up_date: Optional[date] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }

class EnquiryUpdate(BaseModel):
    status: Optional[str] = None,
    follow_up_date: Optional[date] = None