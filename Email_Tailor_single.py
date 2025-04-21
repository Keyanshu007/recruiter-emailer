import os
import json
import sys
import requests
from google.oauth2 import service_account
from googleapiclient.discovery import build
import dotenv

# Load environment variables
dotenv.load_dotenv()

# Generate tailored email content using DeepSeek API
def generate_tailored_email(recruiter):
    api_key = os.getenv("DEEPSEEK_API_KEY", "")
    if not api_key:
        print(f"Warning: DEEPSEEK_API_KEY not found in .env file, using generic email for {recruiter['Email']}")
        return generate_fallback_email(recruiter)

    job_description = recruiter['JobDescription']
    if not job_description:
        print(f"No job description for {recruiter['Email']}, using generic email")
        return generate_fallback_email(recruiter)

    # Read resume contents
    resume_text = ""
    try:
        import pdfplumber
        with pdfplumber.open("KeyanshuGariba_Resume.pdf") as pdf:
            for page in pdf.pages:
                resume_text += page.extract_text() + "\n"
    except Exception as e:
        print(f"Error reading resume: {str(e)}")
        resume_text = "Resume content unavailable"

    # Prepare API request
    url = "https://api.deepseek.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    prompt = f"""
    You are creating a personalized job application email to a recruiter.

    Recruiter's name: {recruiter['Name']}
    Company: {recruiter['Company']}
    Job description: {job_description}

    Here is the candidate's resume:
    {resume_text}

    Write a professional, personalized email highlighting relevant skills from the resume that specifically match the job description. Keep it like this email "I hope this email finds you well. My name is Keyanshu Gariba, and I am a graduate student at Northeastern University (Boston campus), set to graduate this May. With a strong background in software engineering, including Full Stack Development, Database Management, and Generative AI, I am eager to apply my skills and knowledge in a professional setting.<br><br>
      I would greatly appreciate your consideration for any open Software Development or Data Engineering positions within your organization. I have attached my resume for your reference and would be happy to provide any additional information if needed.<br><br>
      Thank you for your time and consideration. I look forward to the opportunity to connect.<br><br>
      Regards,<br>"
    Include a brief introduction, mention specific qualifications which are written under section "Preferred Qualification" and experiences from the resume that match the job requirements, and a polite request to consider for the position.
    Keep the email concise, professional, and under 120 words. Format as HTML, Also dont start email with "'''html/n" or any other way of by writing html directly start with the email in the beginning with line breaks <br><br> between paragraphs.
    Don't include a subject line or signature section as they will be added separately.Dont include the Regards part asawll, Also just give me the body of the email no other extra words from your end are required.
    """
    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 1000
    }
    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))

        if response.status_code == 402:
            print(f"DeepSeek API requires payment for {recruiter['Email']}, using fallback email")
            return generate_fallback_email(recruiter)

        response.raise_for_status()
        result = response.json()
        email_content = result['choices'][0]['message']['content']
        return email_content
    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred for {recruiter['Email']}: {str(http_err)}")
        return generate_fallback_email(recruiter)
    except Exception as e:
        print(f"Error generating tailored email for {recruiter['Email']}: {str(e)}")
        return generate_fallback_email(recruiter)

# Generate fallback email
def generate_fallback_email(recruiter):
    return f"""
    Dear {recruiter['Name']},<br><br>
    I hope this email finds you well. My name is Keyanshu Gariba, and I am a graduate student at Northeastern University (Boston campus), set to graduate this May.<br><br>
    With a strong background in software engineering, including Full Stack Development, Database Management, and Generative AI, I am eager to apply my skills and knowledge in a professional setting at {recruiter['Company']}.<br><br>
    I would greatly appreciate your consideration for any open Software Development or Data Engineering positions within your organization. I have attached my resume for your reference and would be happy to provide any additional information if needed.<br><br>
    Thank you for your time and consideration. I look forward to the opportunity to connect.
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