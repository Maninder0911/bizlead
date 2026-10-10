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

def generate_enquiry_reply(enquiry) -> str:
    response = client.responses.create(
        model="gpt-4o-mini",
        input=[
            {
                "role": "system",
                "content": (
                    "You generate professional and helpful replies "
                    "to customer business enquiries."
                )
            },
            {
                "role": "user",
                "content": f"""
Generate a professional reply to the following customer enquiry.

Customer name:
{enquiry.customer_name}

Customer enquiry:
{enquiry.raw_message}

Extracted information:
Intent: {enquiry.intent}
Action: {enquiry.action}
Location: {enquiry.location}
Requirement: {enquiry.requirement}
Budget: {enquiry.budget}
Enquiry date: {enquiry.enquiry_date}
Number of people: {enquiry.number_of_people}
Additional details: {enquiry.additional_details}

Instructions:

Instructions:

- Generate only the reply message.
- Do not include a subject line.
- Do not include placeholders such as [Your Name],
  [Company Name], [Phone Number], etc.
- Do not include a signature unless business information
  is explicitly provided.
- Address the customer by name when available.
- Acknowledge the customer's enquiry and summarize the
  important requirements they have already provided.
- Include relevant details such as location, requirement,
  budget, date, number of people, and preferences when
  they are available and useful to the reply.
- Do not omit an important preference or requirement that
  was explicitly stated by the customer.
- Do not ask the customer to provide information that is
  already present in the enquiry.
- Only ask for additional information when it is genuinely
  necessary and has not already been provided.
- Do not invent properties, prices, availability, dates,
  services, or other business information.
- Do not make promises on behalf of the business.
- Do not claim that anything is available unless this has
  been explicitly provided as business information.
- Keep the reply concise, natural and professional.
- Make the reply suitable for WhatsApp, SMS, or email.
"""
            }
        ]
    )

    return response.output_text