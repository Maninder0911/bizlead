from openai import OpenAI

from app.config import OPENAI_API_KEY
from app.schemas.enquiry import EnquiryExtraction


client = OpenAI(api_key=OPENAI_API_KEY)


def extract_enquiry_details(raw_message: str) -> EnquiryExtraction:
    response = client.responses.parse(
        model="gpt-4o-mini",
        input=[
            {
                "role": "system",
                "content": (
                    "You extract structured business information "
                    "from customer enquiries."
                )
            },
            {
                "role": "user",
                "content": f"""
Analyze the following customer enquiry and extract useful
business information.

Field definitions:

- intent:
  Identify the customer's main business intention.
  Use a short, normalized description such as:
  "property purchase", "property rental",
  "quotation request", "booking enquiry",
  "service enquiry", or similar.
  Do not simply copy the customer's sentence.

- action:
  Identify the specific action the customer is requesting
  from the business, such as "information request",
  "quotation request", "booking request", "availability
  request", "callback request", or "purchase request".
  Choose the most appropriate short description based on
  the customer's message.
  Do not confuse the action with the customer's main intent.

 - location:
  Extract the location explicitly mentioned by the customer.

- requirement:
  Describe exactly what the customer is looking for.
  Preserve important qualifiers such as property type,
  number of bedrooms, quantity, size, model, service type,
  etc.
  For example, if the customer says "2BHK flat",
  the requirement should be "2BHK flat", not just "flat".

- budget:
  Extract the customer's stated budget.
  Preserve the amount and currency/unit when available.

- enquiry_date:
  Extract the date related to the requested service,
  booking, purchase, event, travel, or other requirement.
  Use null if no relevant date is mentioned.

- number_of_people:
  Extract the number of people when relevant and explicitly
  stated. Use null when unavailable.

- additional_details:
  Include other useful information that does not fit into
  the above fields, especially preferences, urgency,
  special requirements, or relevant context.

General rules:

- Extract only information present or reasonably clear
  from the enquiry.
- Do not invent information.
- Use null when information is unavailable.
- Keep every field concise and useful for a business owner.
- Preserve important details instead of unnecessarily
  shortening them.

Customer enquiry:

{raw_message}
"""
            }
        ],
        text_format=EnquiryExtraction
    )

    return response.output_parsed