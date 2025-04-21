import { useState, useEffect } from 'react';
import './App.css';
import EditableTextField from './EditableTextField';
import originalEmailContent from '../../email_content_mapping.json';

function App() {
  const [rows, setRows] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [jobDescriptions, setJobDescriptions] = useState({});

  useEffect(() => {
    const initializeContent = async () => {
      try {
        // Try to fetch the updated content first
        const response = await fetch('../email_content_mapping_updated.json');
        const updatedContent = await response.json();
        
        // Check if the updated content is empty or invalid
        if (!updatedContent || Object.keys(updatedContent).length === 0) {
          throw new Error('Updated content is empty');
        }

        initializeRows(updatedContent);
      } catch (error) {
        // If there's any error reading the updated file, use the original content
        console.log('Using original content due to:', error.message);
        initializeRows(originalEmailContent);
      }
    };

    const initializeRows = (content) => {
      const emails = Object.keys(content);
      setRows(
        emails.map((email, index) => ({ 
          id: index + 1, 
          email, 
          text: content[email],
          jobDescription: '' // Initialize with empty job description
        }))
      );
    };

    // Fetch job descriptions from the server
    const fetchJobDescriptions = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/job-descriptions');
        if (!response.ok) {
          throw new Error('Failed to fetch job descriptions');
        }
        const data = await response.json();
        setJobDescriptions(data);
      } catch (error) {
        console.error('Error fetching job descriptions:', error);
      }
    };

    initializeContent();
    fetchJobDescriptions();
  }, []);

  const handleUndo = (id) => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === id ? { ...row, text: originalEmailContent[row.email] } : row
      )
    );
  };

  const handleSave = async () => {
    setSaveStatus('Saving...');
    const jsonData = rows.reduce((acc, row) => {
      acc[row.email] = row.text;
      return acc;
    }, {});

    try {
      const response = await fetch('http://localhost:3001/api/save-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save content');
      }
      
      const result = await response.json();
      console.log('Content saved to updated JSON file:', result);
      setSaveStatus('Saved successfully!');

      // Clear the success message after 3 seconds
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving content:', error);
      setSaveStatus('Error saving content');
      
      // Clear the error message after 3 seconds
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleTextChange = (id, newText) => {
    setRows((prevRows) =>
      prevRows.map((row) => (row.id === id ? { ...row, text: newText } : row))
    );
  };

  return (
    <div className="app-container">
      {saveStatus && (
        <div className={`save-status ${saveStatus.includes('Error') ? 'error' : 'success'}`}>
          {saveStatus}
        </div>
      )}
      {rows.map((row) => (
        <div key={row.id} className="row">
          <p>{row.email}</p>
          <div className="text-field-container">
            <EditableTextField 
              content={row.text}
              onChange={(newText) => handleTextChange(row.id, newText)}
            />
            <textarea
              className="text-field job-description"
              value={jobDescriptions[row.email] || ""}
              placeholder="Job description will appear here..."
              readOnly
            />
          </div>
          <div className="button-container">
            <button onClick={() => handleUndo(row.id)}>Undo</button>
            <button onClick={handleSave}>Save</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;
