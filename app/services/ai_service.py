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
                    "You are a careful information extraction assistant "
                    "for a business enquiry management system. Extract "
                    "only information supported by the customer's message. "
                    "Accuracy and preservation of important details are "
                    "more important than filling every field."
                ),
            },
            {
                "role": "user",
                "content": f"""
Analyze the customer enquiry below and extract structured
business information using the supplied EnquiryExtraction schema.

FIELD DEFINITIONS AND RULES

1. intent
- Identify the customer's main business need using a short,
  specific, normalized description.
- Choose a specific label when the message supports it, such as:
  "property purchase", "property rental", "tuition enrollment",
  "training enquiry", "AC servicing", "plumbing repair",
  "custom furniture", "catering service", "event planning",
  "venue enquiry", "household relocation", or "packing service".
- These are examples, not a fixed list. Select another specific
  label when it better represents the enquiry.
- Use a generic label such as "service enquiry" only when the
  type of service cannot reasonably be identified.
- Describe the customer's underlying need, not merely the fact
  that they have sent an enquiry.

2. action
- Identify what the customer wants the business to do next.
- Use a concise label such as "information request",
  "quotation request", "availability request",
  "booking request", "callback request", or "purchase request".
- Distinguish an enquiry about availability or pricing from a
  confirmed booking or purchase.
- Do not describe a booking as confirmed unless the customer
  clearly confirms that they want to book.
- If the customer explicitly says not to book yet, preserve
  that instruction in additional_details.
- If the customer asks whether a technician, service provider,
  venue, or other service is available on a particular date,
  use "availability request" unless the customer explicitly
  asks to schedule or confirm an appointment or booking.
- A request for information about services or options is an
  "information request" when availability or booking is not
  the main question.
- Choose the most appropriate action based on the whole message.

3. location
- Extract the location or locations relevant to the enquiry.
- For property or local services, preserve the stated location.
- For relocation, moving, delivery, travel, or other journeys,
  preserve BOTH origin and destination when both are mentioned.
  For example, use "Jammu to Delhi", not just "Delhi".
- Preserve meaningful locality names and their associated city
  when provided, such as "Chhani Himmat, Jammu".
- Do not invent missing locations or infer a destination from
  unrelated context.
- If no location is stated or reasonably clear, use null.

4. requirement
- Describe exactly what the customer needs, keeping the result
  concise but sufficiently detailed to be useful to a business.
- Preserve important specifications, quantities, preferences,
  and restrictions.
- Examples include:
  "furnished 2BHK flat with parking",
  "Class 10 maths tuition focusing on algebra and geometry",
  "servicing for two split ACs",
  "vegetarian catering for 40 guests with lunch, snacks, and
  drinking water",
  "packing only for a small two-bedroom flat".
- Include important exclusions in this field when they define
  the requested service. For example, if the customer wants
  packing only and will arrange transport independently, do not
  describe the requirement as a full packing-and-moving service.
- Do not omit qualifiers such as "not on the ground floor",
  "near a school", "sliding doors", or "no replacement unless
  absolutely necessary" when they materially affect the request.
- If a detail fits better in additional_details, it may be recorded
  there as well. Avoid unnecessary repetition.

5. budget
- Extract a budget only when the customer states an amount or
  a meaningful budget range.
- Preserve the amount, currency or unit, and important qualifiers.
- Retain distinctions such as "approximately", "around",
  "up to", "maximum", "at most", "minimum", "between",
  "total budget", "per person", and "per month".
- Examples:
  "approximately 30,000 rupees",
  "maximum 50,000 rupees",
  "up to 3,000 rupees per month",
  "45 to 55 lakh",
  "total budget approximately 15,000 rupees".
- Do not convert a request for a quotation or estimated price
  into a stated budget.
- If the customer says the cost is unknown, has not decided
  on a budget, or provides no budget amount, use null.
- A request for an estimated cost, approximate quotation, or price
  does not itself constitute a budget. If the customer asks how
  much a service will cost but does not state an amount they can
  spend, set budget to null and classify the action as
  "quotation request" when appropriate.
- Do not calculate, assume, or invent a budget.

6. enquiry_date
- Extract the date or timeframe relevant to the requested
  service, booking, purchase, event, travel, or other requirement.
- This field is a string so that incomplete or relative date
  expressions can be preserved without inventing missing parts.
- If the customer explicitly provides a complete calendar date
  including the year, return it in ISO format YYYY-MM-DD.
  Example: "15 November 2026" becomes "2026-11-15".
- If the customer gives a day and month but no year, preserve
  the incomplete date as text, such as "20 December".
  Do not invent a year.
- If the customer gives only a month or an incomplete timeframe,
  preserve the stated expression as text when it represents a
  meaningful requested period. For example, "from January"
  should not become "2027-01-01".
- For relative expressions such as "today", "tomorrow",
  "this Saturday", or "next week", preserve the expression
  as written unless a reliable reference date is explicitly
  supplied and the intended calendar date can be resolved
  unambiguously.
- Never invent a day, month, or year merely to produce an ISO date.
- If the customer says a date is tentative, not finalized,
  or not yet confirmed, do not present it as a confirmed date.
  If a meaningful tentative timeframe is stated, preserve it in
  additional_details. Use null for enquiry_date when there is
  no definite requested date to record.
- If the customer explicitly says the date is unconfirmed,
  not finalized, or still undecided, set enquiry_date to null,
  even if a broad timeframe such as "next month" is mentioned.
  Preserve that timeframe and its uncertainty in
  additional_details instead.
- Do not treat the date the enquiry message was submitted as
  the requested service date.
- Use null when no relevant date or timeframe is mentioned.

7. number_of_people
- Extract the number of people who will receive or participate
  in the requested service or event when explicitly stated.
- Examples include students receiving tuition, employees
  attending training, guests at an event, or people included
  in a service arrangement.
- For events, include the total number of guests when the
  message gives enough information to determine it.
- If the message gives an approximate count or separate groups,
  preserve the approximation or group breakdown in
  additional_details when useful.
- Do not count the person sending the enquiry merely because
  they are the customer.
- Do not use this field for unrelated quantities such as the
  number of air conditioners, bedrooms, or appliances.
- If the number of relevant people is not stated or applicable,
  use null.

8. additional_details
- Capture other useful information not adequately represented
  by the fields above.
- Preserve important preferences, restrictions, urgency,
  special instructions, tentative dates, and relevant context.
- Examples include preferred class timings, a request for a
  trial class, fragile items requiring careful packing, a
  preference near the main market, or an instruction not to
  book yet.
- For moving or travel enquiries, include any useful route or
  service constraints that are not already clear in the other
  fields.
- Avoid repeating information unnecessarily unless repetition
  is needed to preserve an important qualification or constraint.
- Do not add assumptions, recommendations, or information that
  the customer did not provide.

GENERAL RULES
- Extract information from the customer's message, not from
  assumptions about what customers usually want.
- Do not invent names, locations, prices, dates, quantities,
  preferences, or commitments.
- Use null for information that is absent, unknown, or
  unsupported by the message.
- Keep values concise, clear, and useful to a business owner.
- Preserve meaningful distinctions between confirmed,
  tentative, approximate, requested, and unknown information.
- Do not mistake a request for information or a quotation for
  a confirmed purchase, appointment, or booking.
- Do not place information in a field merely to avoid returning
  null.
- The generated_reply field is not part of this extraction task;
  do not generate a customer-facing reply here.

CUSTOMER ENQUIRY

{raw_message}
""",
            },
        ],
        text_format=EnquiryExtraction,
    )

    return response.output_parsed


def generate_enquiry_reply(enquiry) -> str:
    response = client.responses.create(
        model="gpt-4o-mini",
        input=[
            {
                "role": "system",
                "content": (
                    "You write clear, professional, natural replies "
                    "to customer business enquiries. Your priority is "
                    "to preserve the customer's actual requirements, "
                    "provide a useful next step, and avoid unsupported "
                    "claims or commitments."
                ),
            },
            {
                "role": "user",
                "content": f"""
Generate a professional reply to the customer enquiry below.

CUSTOMER NAME:
{enquiry.customer_name}

ORIGINAL CUSTOMER ENQUIRY:
{enquiry.raw_message}

EXTRACTED INFORMATION:
Intent: {enquiry.intent}
Action: {enquiry.action}
Location: {enquiry.location}
Requirement: {enquiry.requirement}
Budget: {enquiry.budget}
Enquiry date: {enquiry.enquiry_date}
Number of people: {enquiry.number_of_people}
Additional details: {enquiry.additional_details}

INSTRUCTIONS

1. FORMAT AND TONE
- Generate only the reply message. Do not include a subject line,
  explanation, or commentary about the reply.
- Do not include placeholders such as [Your Name], [Company Name],
  or [Phone Number].
- Do not add a signature unless business information is explicitly
  provided.
- Address the customer by name when a name is available.
- Use a warm, respectful, natural, and professional tone.
- Keep the reply concise and suitable for WhatsApp, SMS, or email.
- Avoid unnecessary repetition, excessive formalities, and generic
  filler sentences.

2. UNDERSTAND THE ENQUIRY
- Acknowledge the customer's main request and summarize the most
  important requirements and preferences.
- Include relevant details such as location, specifications,
  budget, date, quantity, number of people, and restrictions when
  they help make the reply specific and useful.
- Do not mechanically repeat every extracted field. Include only
  details relevant to the response.
- Treat the original customer enquiry as the primary source.
  Use extracted information to help interpret it, but do not let
  an incorrect or conflicting extracted value override what the
  customer actually wrote.
- Never omit a significant preference, restriction, or exclusion
  stated by the customer.

3. ASK USEFUL FOLLOW-UP QUESTIONS
- Ask only for information that is genuinely needed to respond
  usefully or prepare the next step.
- Do not ask the customer to repeat information already provided
  in the original enquiry.
- Prefer one or two focused questions over a long list of questions.
- When important information is missing, briefly explain why it
  would help and ask for the most useful missing detail.
- For service or repair enquiries with insufficient information,
  ask what the problem is or what work is required.
- For quotation requests, ask for the details needed to estimate
  the cost, such as quantity, size, scope of work, or volume of
  items, depending on the service.
- Do not ask irrelevant questions simply to make the reply longer.
- Before asking a follow-up question, check whether the answer
  is already stated or whether the information is genuinely
  needed at this stage.
- Prefer the single most useful next question. Do not ask
  optional preference questions merely to extend the conversation.
- When a customer has not finalized a date, you may ask for an
  approximate date or preferred period, but acknowledge that the
  date remains unconfirmed and do not imply that a booking exists.
- When availability needs to be checked, describe it as something
  that needs confirmation. Do not imply that the business has
  already started checking, contacted someone, or arranged a
  service unless this is explicitly confirmed.


4. QUOTATIONS AND BUDGETS
- Distinguish the customer's budget from a request for a price.
- If the customer asks how much a service costs but has not stated
  a budget, do not describe an amount as their budget.
- Do not invent prices, fees, discounts, estimates, price ranges,
  or claims about the business's pricing policy.
- If the information provided is insufficient to calculate a
  reliable quotation, explain briefly what additional information
  is needed and ask for it.
- Do not promise an exact or approximate quotation by a particular
  time unless that commitment is explicitly supported.

5. AVAILABILITY, DATES, AND BOOKINGS
- Never claim that a property, product, appointment, technician,
  venue, or service is available unless this is explicitly
  established by the provided information.
- Do not say that an appointment or booking has been confirmed
  unless confirmation is explicitly provided.
- If the customer asks about a particular date, acknowledge the
  requested date accurately without implying availability.
- Preserve uncertainty when a date or plan is tentative.
- Respect instructions such as "do not book yet" or "date not
  finalized". Do not imply that any booking has been made.
- Do not invent dates or silently turn a tentative plan into a
  confirmed commitment.

6. SERVICES, PREFERENCES, AND RESTRICTIONS
- Respect the exact scope of the requested service.
- Do not add services that the customer did not request or imply
  that the business provides a particular service without support.
- For example, if the customer requests packing only and will
  arrange transport independently, do not offer or imply that
  transport is included.
- Preserve important restrictions, such as avoiding replacement
  unless absolutely necessary.
- Do not claim that the business has started searching, contacted
  a technician, checked availability, or taken any other action
  unless the provided information confirms that this has happened.

7. BUSINESS COMMITMENTS AND ACCURACY
- Do not make promises on behalf of the business.
- Avoid unsupported commitments such as "I will get back to you
  shortly", "we will arrange a technician", or "we will find the
  best option".
- Instead, describe a reasonable next step or ask for the details
  needed to proceed, without claiming that an action has already
  been taken.
- Do not invent company policies, service coverage, credentials,
  guarantees, or other business information.
- If something is unknown, acknowledge the limitation naturally
  rather than guessing.

8. FINAL QUALITY CHECK
Before producing the reply, ensure that:
- The customer's main request and important constraints are
  accurately represented.
- No question asks for information already provided.
- No price, availability, booking, or business action is invented.
- The reply provides a useful next step where appropriate.
- The wording is concise, natural, and ready for the business
  owner to review and send.

Return only the customer-facing reply message.
""",
            },
        ],
    )

    return response.output_text.strip()
