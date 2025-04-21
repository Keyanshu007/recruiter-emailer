import express from 'express';
import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import { getAllJobDescriptions, getJobDescriptionForEmail } from './modules/sheetMapping.js';

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

// New endpoint to fetch all job descriptions from Google Sheet
app.get('/api/job-descriptions', async (req, res) => {
  try {
    const jobDescriptions = await getAllJobDescriptions();
    res.json(jobDescriptions);
  } catch (error) {
    console.error('Error fetching job descriptions:', error);
    res.status(500).json({ error: 'Failed to fetch job descriptions' });
  }
});

// New endpoint to fetch a specific job description by email
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

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});