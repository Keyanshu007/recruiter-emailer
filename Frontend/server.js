import express from 'express';
import { writeFile, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import { getAllJobDescriptions, getJobDescriptionForEmail, getAllEmails } from './modules/sheetMapping.js';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

// Serve the JSON file statically
app.use(express.static(__dirname));

app.post('/api/save-content', async (req, res) => {
  try {
    const jsonData = req.body;
    const filePath = join(__dirname, 'email_content_mapping_updated.json');
    await writeFile(filePath, JSON.stringify(jsonData, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ error: 'Failed to save content' });
  }
});

// Endpoint to fetch all job descriptions from Google Sheet
app.get('/api/job-descriptions', async (req, res) => {
  try {
    const jobDescriptions = await getAllJobDescriptions();
    res.json(jobDescriptions);
  } catch (error) {
    console.error('Error fetching job descriptions:', error);
    res.status(500).json({ error: 'Failed to fetch job descriptions' });
  }
});

// Endpoint to fetch a specific job description by email
app.get('/api/job-description/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const jobDescription = await getJobDescriptionForEmail(email);
    res.json({ description: jobDescription });
  } catch (error) {
    console.error('Error fetching job description:', error);
    res.status(500).json({ error: 'Failed to fetch job description' });
  }
});

// New endpoint to regenerate email content using Email_Tailor.py script
app.post('/api/regenerate-email', async (req, res) => {
  try {
    const { email, jobDescription } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }
    
    console.log(`Regenerating email for: ${email}`);
    
    // Create a temporary JSON file with the single recruiter details
    const tempDataPath = join(dirname(__dirname), 'temp_recruiter.json');
    const singleRecruiter = [{
      "Name": email.split('@')[0], // Just use the email username as name if real name isn't available
      "Email": email,
      "Company": "Company", // Placeholder
      "JobDescription": jobDescription
    }];
    
    await writeFile(tempDataPath, JSON.stringify(singleRecruiter));
    
    // Run the Email_Tailor.py script with the temp file path as argument
    const pythonProcess = spawn('python', [
      join(dirname(__dirname), 'Email_Tailor_single.py'),
      tempDataPath,
      email
    ]);
    
    let resultData = '';
    let errorData = '';
    
    pythonProcess.stdout.on('data', (data) => {
      resultData += data.toString();
      console.log(`Python stdout: ${data}`);
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      console.error(`Python stderr: ${data}`);
    });
    
    await new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`Python process exited with code ${code}`);
          if (errorData) {
            console.error(`Error output: ${errorData}`);
          }
          reject(new Error(`Python script exited with code ${code}`));
        } else {
          console.log(`Python process completed successfully`);
          resolve();
        }
      });
    });
    
    // Read the updated content from email_content_mapping.json
    const emailContentPath = join(dirname(__dirname), 'email_content_mapping.json');
    const emailContentRaw = await readFile(emailContentPath, 'utf8');
    const emailContent = JSON.parse(emailContentRaw);
    
    // Get the regenerated content for the specific email
    const regeneratedContent = emailContent[email];
    
    if (!regeneratedContent) {
      throw new Error(`No content generated for email: ${email}`);
    }
    
    // Return the regenerated content
    res.json({ content: regeneratedContent });
    
  } catch (error) {
    console.error('Error regenerating email:', error);
    res.status(500).json({ error: 'Failed to regenerate email content' });
  }
});

// New endpoint to send all emails by running the sendEmails.js script
app.post('/api/send-emails', async (req, res) => {
  try {
    console.log('Starting email sending process...');
    
    // Execute the sendEmails.js script with the absolute path
    const sendEmailsPath = 'C:\\Users\\keyan\\OneDrive\\Documents\\recruiter-emailer\\sendEmails.js';
    console.log(`Attempting to execute: node ${sendEmailsPath}`);
    
    const nodeProcess = spawn('node', [sendEmailsPath]);
    
    let resultData = '';
    let errorData = '';
    
    nodeProcess.stdout.on('data', (data) => {
      resultData += data.toString();
      console.log(`Send emails stdout: ${data}`);
    });
    
    nodeProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      console.error(`Send emails stderr: ${data}`);
    });
    
    // Allow the process to start but don't wait for it to complete
    // since it might run for a long time sending multiple emails
    res.json({ 
      message: 'Email sending process started successfully! This may take some time to complete.',
      success: true 
    });
    
    // Log when the process completes (but don't block the response)
    nodeProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Email sending process exited with code ${code}, Error: ${errorData}`);
      } else {
        console.log('Email sending process completed successfully');
      }
    });
    
  } catch (error) {
    console.error('Error starting email sending process:', error);
    res.status(500).json({ 
      error: 'Failed to start email sending process',
      message: error.message
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});