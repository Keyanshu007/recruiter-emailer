import os
import json
import sys
import requests
import google.generativeai as genai
from google.oauth2 import service_account
from googleapiclient.discovery import build
import dotenv

# Load environment variables
dotenv.load_dotenv()

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

Write a professional and brief introduction, introducing yourself with your name and graduation details. I have already graduated in August 2025.

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
    I hope you’re doing well. My name is Hitesh Soneta, and I recently graduated with a Master’s in Computer Software Engineering from Northeastern University. I bring four years of experience in software engineering, where I’ve built full-stack applications, optimized databases, and developed data visualization solutions to drive insights.

I’d love to explore any suitable opportunities at your company. My resume is attached, and I’d be happy to discuss how my skills can add value to your team.

Looking forward to your thoughts.
    """

def main():
    # Check if arguments are provided
    if len(sys.argv) < 3:
        print("Usage: python Email_Tailor_single.py <temp_data_path> <email>")
        return
    
    temp_data_path = sys.argv[1]
    target_email = sys.argv[2]
    
    # Read the temporary data file
    try:
        with open(temp_data_path, 'r') as f:
            recruiters = json.load(f)
    except Exception as e:
        print(f"Error reading temp recruiter data: {str(e)}")
        return
    
    if not recruiters:
        print("Error: No recruiter data found.")
        return
    
    # Load existing email mapping if available
    email_mapping = {}
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'email_content_mapping.json')
    
    try:
        if os.path.exists(output_path):
            with open(output_path, 'r') as f:
                email_mapping = json.load(f)
    except Exception as e:
        print(f"Error reading existing email mapping: {str(e)}")
    
    # Generate email for the specific recruiter
    recruiter = next((r for r in recruiters if r['Email'] == target_email), recruiters[0])
    print(f"Processing email for {recruiter['Name']} ({recruiter['Email']})")
    
    email_content = generate_tailored_email(recruiter)
    if email_content:
        email_mapping[recruiter['Email']] = email_content
        print(f"[SUCCESS] Generated email for {recruiter['Email']}")
    else:
        print(f"[FAILED] Could not generate email for {recruiter['Email']}")
    
    # Save the updated mapping
    with open(output_path, 'w') as f:
        json.dump(email_mapping, f)
    
    print(f"Email content updated in: {output_path}")

if __name__ == "__main__":
    main()