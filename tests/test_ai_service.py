from app.services.ai_service import extract_enquiry_details
from app.services.ai_service import generate_enquiry_reply
from app.services.enquiry_service import get_enquiry_by_id
from app.database.connection import SessionLocal



def main():
    message = """
   I need to shift my 2BHK household from Jammu to Delhi.
Please give me an approximate quotation. We are planning
the move next month.
    """


    """
    result = extract_enquiry_details(message)

    print("\nAI RESPONSE:")
    print(result)

    print("\nEXTRACTED FIELDS:")
    print("Intent:", result.intent)
    print("Action:", result.action)
    print("Location:", result.location)
    print("Requirement:", result.requirement)
    print("Budget:", result.budget)
    print("Enquiry date:", result.enquiry_date)
    print("Number of people:", result.number_of_people)
    print("Additional details:", result.additional_details)
"""

db = SessionLocal()

try:
    enquiry = get_enquiry_by_id(db, 5)

    if enquiry is None:
        print("Enquiry not found")
    else:
        result = generate_enquiry_reply(enquiry)

        print("\nAI RESPONSE:")
        print(result)

finally:
    db.close()

if __name__ == "__main__":
    main()