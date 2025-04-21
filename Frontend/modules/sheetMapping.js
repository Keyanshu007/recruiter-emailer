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
 * Fetches all job descriptions from Google Sheets
 * @returns {Object} - Mapping of email addresses to job descriptions
 */
export async function getAllJobDescriptions() {
  const currentTime = Date.now();
  
  // Return cached data if it's still fresh
  if (currentTime - lastFetchTime < CACHE_DURATION && Object.keys(descriptionCache).length > 0) {
    return descriptionCache;
  }
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: "Sheet1!A:D" // Get columns A through D to include emails and descriptions
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return {};
    }

    // Create a mapping of email addresses (column B, index 1) to job descriptions (column D, index 3)
    const jobDescriptions = {};
    rows.forEach(row => {
      if (row.length >= 4 && row[1]) {
        jobDescriptions[row[1]] = row[3] || ""; // Map email to job description (4th column)
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