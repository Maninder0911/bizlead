from sqlalchemy import Column, Integer, String, Text, Date, TIMESTAMP
from sqlalchemy.sql import func
from app.database.connection import Base
    
class Enquiry(Base):
    __tablename__ = "enquiries"
    id = Column(Integer, primary_key=True,index=True)
    customer_name = Column(String,nullable=False)
    customer_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    email = Column(String(150))

    raw_message = Column(Text, nullable=False)

    source = Column(String(50), default="manual")

    intent = Column(String(100))
    action = Column(String(100))
    location = Column(String(150))
    requirement = Column(Text)
    budget = Column(String(100))

    enquiry_date = Column(String(100))
    number_of_people = Column(Integer)

    additional_details = Column(Text)

    status = Column(String(30), default="new")
    follow_up_date = Column(Date)

    created_at = Column(
    TIMESTAMP,
    server_default=func.now()
    )

    updated_at = Column(
    TIMESTAMP,
    server_default=func.now(),
    onupdate=func.now()
)
