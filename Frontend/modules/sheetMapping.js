// Google Sheets data mapping module
import { google } from 'googleapis';
import dotenv from 'dotenv';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../..', '.env') });

// Google Sheets configuration
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

// Initialize Google Sheets API
const auth = new google.auth.JWT(
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  null,
  GOOGLE_PRIVATE_KEY,
  ["https://www.googleapis.com/auth/spreadsheets"]
);
const sheets = google.sheets({ version: "v4", auth });

// Cache for job descriptions to avoid frequent API calls
let descriptionCache = {};
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute cache

/**
 * Fetches all data from Google Sheets and ensures proper alignment
 * @returns {Object} - Mapping of email addresses to job descriptions
 */
export async function getAllJobDescriptions() {
  const currentTime = Date.now();
  
  // Return cached data if it's still fresh
  if (currentTime - lastFetchTime < CACHE_DURATION && Object.keys(descriptionCache).length > 0) {
    return descriptionCache;
  }
  
  try {
    // First, get the headers to identify the correct columns
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: "Sheet1!A1:Z1" // Get the first row to identify column positions
    });
    
    const headers = headerResponse.data.values[0] || [];
    
    // Find the indices of email and job description columns
    let emailColIndex = -1;
    let jobDescColIndex = -1;
    
    headers.forEach((header, index) => {
      const headerText = String(header).toLowerCase();
      if (headerText.includes('email')) {
        emailColIndex = index;
      } else if (headerText.includes('job') && (headerText.includes('description') || headerText.includes('desc'))) {
        jobDescColIndex = index;
      }
    });
    
    // If we couldn't find the right columns, fall back to default indices
    if (emailColIndex === -1) emailColIndex = 1; // Column B
    if (jobDescColIndex === -1) jobDescColIndex = 3; // Column D
    
    // Now get all data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: "Sheet1!A2:Z" // Get all columns from row 2 onwards
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return {};
    }

    console.log(`Using email column: ${emailColIndex + 1}, job description column: ${jobDescColIndex + 1}`);
    
    // Create a mapping of email addresses to job descriptions
    const jobDescriptions = {};
    rows.forEach((row, rowIndex) => {
      if (row.length > Math.max(emailColIndex, jobDescColIndex)) {
        const email = row[emailColIndex]?.trim();
        const jobDescription = row[jobDescColIndex] || "";
        
        // Only add if email is valid
        if (email && email.includes('@')) {
          // Log for debugging
          console.log(`Row ${rowIndex + 2}: Mapping ${email} to job description`);
          
          jobDescriptions[email] = jobDescription;
        }
      }
    });
    
    // Update cache
    descriptionCache = jobDescriptions;
    lastFetchTime = currentTime;
    
    return jobDescriptions;
  } catch (error) {
    console.error('Error fetching job descriptions:', error);
    return {};
  }
}

/**
 * Gets a job description for a specific email
 * @param {string} email - Email address to look up
 * @returns {string} - Job description for the email or empty string if not found
 */
export async function getJobDescriptionForEmail(email) {
  const descriptions = await getAllJobDescriptions();
  return descriptions[email] || "";
}