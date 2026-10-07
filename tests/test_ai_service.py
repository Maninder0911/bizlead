from app.services.ai_service import extract_enquiry_details


def main():
    message = """
   I need to shift my 2BHK household from Jammu to Delhi.
Please give me an approximate quotation. We are planning
the move next month.
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


if __name__ == "__main__":
    main()