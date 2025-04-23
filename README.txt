## Recruiter Emailer

A tool to automate sending personalized emails to recruiters with resume attachments.

## Usage

1. Add recruiter information to your Google Sheet
2. Run the application to generate personalized emails
3. Review and edit emails as needed
4. Send emails to recruiters

## Files and Their Purposes

- **Email_Tailor.py**: Generates personalized emails based on job descriptions
- **Email_Tailor_single.py**: Generates a single email for one recruiter
- **sendEmails.js**: Sends emails to recruiters and updates Google Sheets
- **Frontend/server.js**: Backend API server handling requests from the frontend
- **Frontend/src/App.jsx**: Main frontend interface for reviewing and editing emails

## Project Structure

```
recruiter-emailer/
├── Frontend/               # Frontend React application
│   ├── server.js           # Express server handling API requests
│   ├── modules/            # Server utility modules
│   │   └── sheetMapping.js # Google Sheets integration
│   ├── src/                # React frontend code
│   │   ├── App.jsx         # Main application component
│   │   └── ...             # Other frontend components
│   └── ...                 # Frontend configuration files
│
├── server/                 # Server-side scripts and utilities
│   └── ...                 # Server-side code
│
├── data/                   # Data storage
│   ├── email_templates/    # Email templates
│   └── ...                 # Other data files
│
├── assets/                 # Static assets
│   └── KeyanshuGariba_Resume.pdf  # Resume file
│
├── Email_Tailor.py         # Python script for generating emails
├── Email_Tailor_single.py  # Python script for single email generation
├── sendEmails.js           # JavaScript email sender
├── run-sequence.js         # Script runner
│
├── email_content_mapping.json        # Email content mappings
├── temp_recruiter.json               # Temporary recruiter data
│
├── requirements.txt        # Python dependencies
├── package.json            # Node.js dependencies
└── README.md               # This file

# Setup Instructions 

1. Clone or Copy the Project

- **Option A: Clone the Repository**  
  If the code is in a Git repository, open a terminal and run:  
  ```bash
  git clone <repository_url>
  cd recruiter-emailer
  ```

- **Option B: Manual Setup**  
  If you received the project files directly, place them in a folder on your device.

2. Install Node.js dependencies:
   ```
   npm install
   ```

3. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up environment variables in a `.env` file:
   ```
   a. EMAIL_USER=your.email@gmail.com
    --> This is your actual gmail which you are going to use the emailer for.
   b. EMAIL_PASS=your-app-password
    --> Creating an App Password for Gmail
        Gmail doesn't allow direct password authentication for most apps. Instead, you need to create an App        Password:

        1. Enable 2-Step Verification first:
        --> Go to your Google Account
        -->  Select "Security" from the left menu
        --> Under "Signing in to Google," find "2-Step Verification" and turn it on
        -->  Follow the prompts to set up 2FA

        2. Create an App Password:
        -->  Go back to Security settings
        -->  Find "App passwords" (usually under 2-Step Verification section)
        -->  Select "App passwords" (you may need to sign in again)
        -->  At the bottom, choose:
             -->  Select app: "Other (Custom name)"
             -->  Enter a name like "Recruiter Emailer"
        -->  Click "Generate"
        -->  Google will display a 16-character password

   c. GOOGLE_SHEET_ID=your-google-sheet-id
    --> Extract the sheet ID from your Google Sheet URL. For example, in  
        `https://docs.google.com/spreadsheets/d/1ee3OlrmXVZibzal9naZRRa7CLaFDtqzpU6faNea0oBQ/edit#gid=1838986825`  
        the sheet ID is `1ee3OlrmXVZibzal9naZRRa7CLaFDtqzpU6faNea0oBQ`.

    
   d. GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@example.com
   e.GOOGLE_PRIVATE_KEY=your-private-key
    --> Create a Service Account:
        Go to the Google Cloud Console.
        Create a new project or select an existing one.
        Navigate to APIs & Services > Credentials.
        Click on Create Credentials and choose Service Account.
        Follow the prompts to create your service account.

    --> Generate a Key:
        Once your service account is created, click on it, then go to the Keys section.
        Click Add Key > Create New Key, choose JSON, and download the JSON file.
        --> Extract the Credentials:
        Open the downloaded JSON file. You will see keys like "client_email" and "private_key".
        The "client_email" value is your GOOGLE_SERVICE_ACCOUNT_EMAIL.
        The "private_key" value is your GOOGLE_PRIVATE_KEY.

   f. DEEPSEEK_API_KEY=your-deepseek-api-key
    --> To get a DeepSeek API key:
        Go to DeepSeek's website - https://platform.deepseek.com
        Sign up for an account if you don't have one
        Generate an API key:

        Navigate to your account settings or API section
        Look for "API Keys" or "Developer" section
        Click on "Create new API key" or similar option
        Name your key (optional, but helpful)
        Copy the generated key immediately (it typically starts with "sk-")

   g. GOOGLE_API_KEY=your-key
    --> Go to https://console.cloud.google.com/
        Enable the required APIs:

        - Navigate to "APIs & Services" > "Library"
        Search for and enable the specific Google APIs you need (e.g., Google Sheets API)
        Create credentials:

        - Go to "APIs & Services" > "Credentials"
        Click "Create Credentials" > "API key"
        Your new API key will be displayed - copy it immediately
        Consider restricting the key to specific APIs for security
        Set restrictions (recommended):

        In the API key details, add API restrictions to limit which Google services can use this key
        Add application restrictions to limit where the key can be used from


5. To run the front-end and the python script together type this in your terminal 'npm run python-then-frontend'

6. Troubleshooting Tips

- **API Errors:**  
  If you receive errors about the Google Sheets API not being enabled, double-check your Google Cloud Console settings.

- **Environment Variables:**  
  If the script can’t find your credentials, verify that the `.env` file is in the correct location and properly formatted.

- **Email Issues:**  
  If emails fail to send, ensure your Gmail account permits SMTP access. You might need to set up an [App Password](https://support.google.com/accounts/answer/185833).

- **Duplicate Check:**  
  Verify that the tab name in your Google Sheet (used in the script as `"Done"`) matches your actual sheet name. Adjust the range if necessary.
