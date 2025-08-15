import os
import dotenv
import google.generativeai as genai

# Load environment variables
dotenv.load_dotenv()

print("1. Loading environment...")
api_key = os.getenv("GEMINI_API_KEY", "")
print(f"2. API Key found: {bool(api_key)}")

print("3. Configuring Gemini...")
genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-1.5-flash')
print("4. Model configured successfully")

print("5. Testing PDF reading...")
try:
    import pdfplumber
    with pdfplumber.open("Hitesh Soneta.pdf") as pdf:
        resume_text = ""
        for page in pdf.pages:
            resume_text += page.extract_text() + "\n"
    print(f"6. PDF read successfully. Length: {len(resume_text)} characters")
except Exception as e:
    print(f"6. PDF reading failed: {str(e)}")
    resume_text = "Resume content unavailable"

print("7. Testing simple Gemini call...")
try:
    simple_response = model.generate_content("Write a short hello message")
    print(f"8. Simple call successful: {simple_response.text[:50]}...")
except Exception as e:
    print(f"8. Simple call failed: {str(e)}")

print("9. Testing with full prompt...")
recruiter = {
    'Name': 'Test Recruiter',
    'Company': 'Test Company',
    'Email': 'test@example.com',
    'JobDescription': 'Looking for a software engineer with Python experience.'
}

prompt = f"""
You are creating a personalized job application email to a recruiter.

Recruiter's name: {recruiter['Name']}
Company: {recruiter['Company']}
Job description: {recruiter['JobDescription']}

Here is the candidate's resume:
{resume_text[:1000]}  # Truncated for testing

Write a professional, personalized email highlighting relevant skills from the resume that specifically match the job description. Keep it concise and under 120 words.
"""

try:
    response = model.generate_content(prompt)
    print(f"10. Full prompt successful: {response.text[:100]}...")
except Exception as e:
    print(f"10. Full prompt failed: {str(e)}")

print("Debug test completed!")
