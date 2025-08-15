import os
import json
import requests
import google.generativeai as genai
from google.oauth2 import service_account
from googleapiclient.discovery import build
import dotenv
import time

# Load environment variables
dotenv.load_dotenv()

# Google Sheets Setup
def get_google_sheet_data():
    # Get credentials from .env
    GOOGLE_SHEET_ID = os.getenv("GOOGLE_SHEET_ID")
    GOOGLE_SERVICE_ACCOUNT_EMAIL = os.getenv("GOOGLE_SERVICE_ACCOUNT_EMAIL")
    GOOGLE_PRIVATE_KEY = os.getenv("GOOGLE_PRIVATE_KEY", "").replace("\\n", "\n")

    if not GOOGLE_SHEET_ID or not GOOGLE_SERVICE_ACCOUNT_EMAIL or not GOOGLE_PRIVATE_KEY:
        print("Error: Missing Google Sheets credentials in .env file.")
        return []

    # Set up credentials
    credentials = service_account.Credentials.from_service_account_info({
        "type": "service_account",
        "project_id": "project-id",
        "private_key_id": "key-id",
        "private_key": GOOGLE_PRIVATE_KEY,
        "client_email": GOOGLE_SERVICE_ACCOUNT_EMAIL,
        "client_id": "client-id",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{GOOGLE_SERVICE_ACCOUNT_EMAIL}"
    }, scopes=["https://www.googleapis.com/auth/spreadsheets.readonly"])

    # Connect to Sheets API
    try:
        service = build('sheets', 'v4', credentials=credentials)
        sheet = service.spreadsheets()
        result = sheet.values().get(
            spreadsheetId=GOOGLE_SHEET_ID,
            range="Sheet1!A2:D"  # Include column D for job description
        ).execute()
        rows = result.get('values', [])
        if not rows:
            print("No data found in Google Sheet.")
            return []

        # Parse data into dictionaries
        recruiters = []
        for row in rows:
            while len(row) < 4:
                row.append("")
            recruiters.append({
                "Name": row[0],
                "Email": row[1],
                "Company": row[2],
                "JobDescription": row[3]
            })
        return recruiters
    except Exception as e:
        print(f"Error accessing Google Sheets: {str(e)}")
        return []

# Generate tailored email content using Gemini API
def generate_tailored_email(recruiter):
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        print(f"Warning: GEMINI_API_KEY not found in .env file, using generic email for {recruiter['Email']}")
        return generate_fallback_email(recruiter)

    job_description = recruiter['JobDescription']
    if not job_description:
        print(f"No job description for {recruiter['Email']}, using generic email")
        return generate_fallback_email(recruiter)

    # Read resume contents
    resume_text = ""
    try:
        import pdfplumber
        with pdfplumber.open("Hitesh Soneta.pdf") as pdf:
            for page in pdf.pages:
                resume_text += page.extract_text() + "\n"
    except Exception as e:
        print(f"Error reading resume: {str(e)}")
        resume_text = "Resume content unavailable"

    # Configure Gemini
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')

    prompt = f"""
    You are an expert career advisor writing a highly personalized and professional cold email to a recruiter.

    Your task is to generate a concise and impactful email body using the following information:

    Recruiter's name: {recruiter['Name']}
    Company: {recruiter['Company']}
    Job description: {job_description}
    Candidate's resume:{resume_text}

    Instructions:

Write the email from a first-person perspective, using "I," "my," and "me."

Write a professional and brief introduction, introducing yourself with your name and graduation details.

Analyze the provided job description and my resume.

From my resume, identify and highlight 1-2 specific skills and experiences that directly match the "Preferred Qualification" section of the job description. Do not simply list them; integrate them naturally into the email body.

Express enthusiasm for the company and the opportunity. If company name is not present in JD, just say Your organisation.

Include a clear and polite call to action, referencing the attached resume.

The entire email body must be strictly under 100 words.
Strictly bbreak it into paragraphs for readability.
Format the output as raw HTML, using <br><br> for paragraph breaks. Do not use hyphens.

Do not include a salutation like Dear <Recruiters Name>, a subject line, a signature (Regards,), or any other conversational text.

Start the output directly with the first line of the email's HTML."""
    
    try:
        response = model.generate_content(prompt)
        email_content = response.text
        return email_content
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "quota" in error_msg.lower():
            print(f"Gemini API quota exceeded for {recruiter['Email']}, using fallback email")
        elif "timeout" in error_msg.lower():
            print(f"Gemini API timeout for {recruiter['Email']}, using fallback email")
        else:
            print(f"Error generating tailored email for {recruiter['Email']}: {error_msg}")
        return generate_fallback_email(recruiter)

# Generate fallback email
def generate_fallback_email(recruiter):
    return f"""
    Dear {recruiter['Name']},<br>
    I hope you're doing well. My name is Hitesh Soneta, and I’m pursuing my Master’s in Computer Software Engineering at Northeastern University, graduating in August 2025. With four years of experience in software engineering, I’ve built full-stack applications, optimized databases, and developed data visualization solutions to drive insights.
  
  I’d love to explore any suitable opportunities at your company. My resume is attached, and I’d be happy to discuss how my skills can add value to your team.
  
  Looking forward to your thoughts!.
    """

def main():
    # Get recruiters data
    recruiters = get_google_sheet_data()

    if not recruiters:
        print("Error: No recruiters found in Google Sheet.")
        return

    print(f"Found {len(recruiters)} recruiters in Google Sheet.")

    # Generate email content mapping
    email_mapping = {}
    success_count = 0
    failure_count = 0

    for recruiter in recruiters:
        print(f"Processing email for {recruiter['Name']} ({recruiter['Email']})")
        email_content = generate_tailored_email(recruiter)
        if email_content:
            email_mapping[recruiter['Email']] = email_content
            success_count += 1
            print(f"[SUCCESS] Generated email for {recruiter['Email']}")
        else:
            failure_count += 1
            print(f"[FAILED] Could not generate email for {recruiter['Email']}")
        # Add a small delay to avoid rate limiting
        time.sleep(1)

    # Save the mapping to a JSON file for sendEmails.js to use
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'email_content_mapping.json')
    with open(output_path, 'w') as f:
        json.dump(email_mapping, f)

    print(f"Generated {success_count} custom email templates (failed: {failure_count}).")
    print(f"Email content saved to: {output_path}")

    # Debug: Verify file contents
    try:
        if os.path.exists(output_path):
            file_size = os.path.getsize(output_path)
            with open(output_path, 'r') as f:
                data = json.load(f)
                print(f"File size: {file_size} bytes")
                print(f"Email mapping contains {len(data)} entries")
        else:
            print("Warning: File not found after writing!")
    except Exception as e:
        print(f"Error verifying file: {str(e)}")

if __name__ == "__main__":
    main()
