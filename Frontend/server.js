import express from 'express';
import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';

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

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});