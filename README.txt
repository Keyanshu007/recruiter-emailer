# Frontend

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


## How To Run

This command runs frontend (PORT: 5173) and backend (PORT: 3001) together.

```
npm run dev
```

## How To Use

Open Google Chrome and visit the below URL to interact.

```
http://localhost:5173/
```

# Recruiter Emailer Bot Setup Documentation

This guide will walk you through setting up and running the Recruiter Emailer Bot on your device. The bot reads recruiter details from an Excel file, checks a Google Sheet for duplicate email addresses (using the Google Sheets API), and then sends emails via Nodemailer.

---

## 1. Prerequisites
#How to get the google api key

Create a Google Cloud Project:

Go to the Google Cloud Console
Sign in with your Google account
Click on "New Project" at the top right
Enter a project name and click "Create"
Enable the Google Sheets API:

In your new project, go to the left sidebar and select "APIs & Services" > "Library"
Search for "Google Sheets API"
Click on it and then click "Enable"
Create API Credentials:

In the APIs & Services section, go to "Credentials"
Click "Create Credentials" at the top of the page
Select "API key" from the dropdown menu
Your new API key will be displayed in a popup window
Restrict Your API Key (recommended for security):

In the API key details page, click "Restrict key"
Under "Application restrictions," you can choose to restrict the key to specific websites, IP addresses, or apps
Under "API restrictions," select "Restrict key" and choose "Google Sheets API" from the dropdown
Click "Save"
Add the API Key to Your Project:

Copy the API key
Update your .env file with the key:

- **Node.js & npm:**  
  Ensure you have Node.js (v14 or higher is recommended) installed on your device.  
  Download from: [nodejs.org](https://nodejs.org/)

- **Git (Optional):**  
  If you plan to clone a repository, install Git from [git-scm.com](https://git-scm.com/).

- **Google Cloud Credentials:**  
  You will need a Google Cloud project with the Google Sheets API enabled and a service account created.

---

## 2. Clone or Copy the Project

- **Option A: Clone the Repository**  
  If the code is in a Git repository, open a terminal and run:  
  ```bash
  git clone <repository_url>
  cd recruiter-emailer
  ```

- **Option B: Manual Setup**  
  If you received the project files directly, place them in a folder on your device.

---

## 3. Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

This installs the required packages:  
- `dotenv` for environment variables  
- `googleapis` for Google Sheets API access  
- `nodemailer` for sending emails  
- `xlsx` for reading the recruiters Excel file

---

## 4. Configure Environment Variables

Create a file named `.env` in the project root with the following contents (replace placeholder values with your actual credentials):

```env
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your_app_or_email_password
GOOGLE_SHEET_ID=your_google_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_CONTENT\n-----END PRIVATE KEY-----\n"
```

### Important:
- **GOOGLE_SHEET_ID:**  
  Extract the sheet ID from your Google Sheet URL. For example, in  
  `https://docs.google.com/spreadsheets/d/1ee3OlrmXVZibzal9naZRRa7CLaFDtqzpU6faNea0oBQ/edit#gid=1838986825`  
  the sheet ID is `1ee3OlrmXVZibzal9naZRRa7CLaFDtqzpU6faNea0oBQ`.

- **GOOGLE_PRIVATE_KEY:**  
  Ensure newlines are preserved by using `\n` in the key. The code replaces `\\n` with `\n`.

---

## 5. Enable Google Sheets API

1. **Go to Google Cloud Console:**  
   Visit: [Google Sheets API Overview](https://console.developers.google.com/apis/api/sheets.googleapis.com/overview)

2. **Select Your Project:**  
   Choose the project associated with your service account.

3. **Enable the API:**  
   Click **Enable** if it isn’t already enabled.

4. **Share Your Sheet:**  
   Open your Google Sheet and share it with your service account email (found in your `.env` file).

---

## 6. Obtaining the Service Account Email and Private Key

To interact with Google Sheets, you must create a service account and download its credentials.

### Steps:

*Important Steps*

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

1. **Create a Google Cloud Project:**  
   - Visit the [Google Cloud Console](https://console.cloud.google.com/).
   - Click on the project dropdown and either select an existing project or create a new one.

2. **Enable the Google Sheets API:**  
* Important
What to Do
--> Enable the API:

Open this URL in your browser:
Google Sheets API Overview
Click Enable (if it’s not already enabled).
If you just enabled it, wait a few minutes for the change to propagate.

--> Verify the Service Account:
Make sure your service account is correctly set up.
Ensure that the Google Sheet is shared with your service account email.

--> Retry Your Code:
After the API is enabled and permissions are correct, re-run your script.
   - In the Cloud Console, navigate to **APIs & Services > Library**.
   - Search for "Google Sheets API" and click **Enable**.

3. **Create a Service Account:**  
   - Go to **APIs & Services > Credentials**.
   - Click **Create Credentials** and select **Service Account**.
   - Follow the prompts to create a new service account. Note the **Service Account Email**; this is the value you will use for `GOOGLE_SERVICE_ACCOUNT_EMAIL`.

4. **Generate a Private Key:**  
   - After creating the service account, click on it in the Credentials page.
   - Navigate to the **Keys** tab.
   - Click **Add Key** and select **Create New Key**.
   - Choose **JSON** as the key type and download the JSON file.
   - Open the downloaded file and copy the values for `"client_email"` and `"private_key"`.
   - Paste these values into your `.env` file for `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY` respectively.

5. **Share Your Google Sheet:**  
   - Open your Google Sheet.
   - Click the **Share** button.
   - Share the sheet with the service account email (e.g., `your-service-account@your-project.iam.gserviceaccount.com`) so that it has access.

---

## 7. Prepare the Recruiters Excel File

- Name the file `recruiters.xlsx` and place it in the project folder.
- The Excel file should have columns like: **Name, Email, Company**.
- Ensure the data is formatted properly, as the script reads the first sheet of the workbook.

---

## 8. Run the Bot

With all configurations in place, run the script from the terminal:

```bash
node sendEmails.js
```

The bot will:
- Read recruiter details from `recruiters.xlsx`
- Access your Google Sheet (specifically the "Done" tab) to load emails that have already been sent
- Check for duplicate emails and skip sending if an email is already present
- Send emails via Nodemailer

---

## 9. Troubleshooting Tips

- **API Errors:**  
  If you receive errors about the Google Sheets API not being enabled, double-check your Google Cloud Console settings.

- **Environment Variables:**  
  If the script can’t find your credentials, verify that the `.env` file is in the correct location and properly formatted.

- **Email Issues:**  
  If emails fail to send, ensure your Gmail account permits SMTP access. You might need to set up an [App Password](https://support.google.com/accounts/answer/185833).

- **Duplicate Check:**  
  Verify that the tab name in your Google Sheet (used in the script as `"Done"`) matches your actual sheet name. Adjust the range if necessary.

---

## 10. Additional Resources

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [XLSX Package Documentation](https://www.npmjs.com/package/xlsx)
- [dotenv Package Documentation](https://www.npmjs.com/package/dotenv)

---

Share these instructions with your friend, and they should be able to set up and run the Recruiter Emailer Bot on their device without issues. Happy coding!