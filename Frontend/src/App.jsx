import { useState, useEffect } from 'react';
import './App.css';
import EditableTextField from './EditableTextField';
import originalEmailContent from '../../email_content_mapping.json';

function App() {
  const [rows, setRows] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [jobDescriptions, setJobDescriptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState({});

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Fetch job descriptions from the server
        const descResponse = await fetch('http://localhost:3001/api/job-descriptions');
        if (!descResponse.ok) {
          throw new Error('Failed to fetch job descriptions');
        }
        const jobDescs = await descResponse.json();
        setJobDescriptions(jobDescs);
        
        // Get all email addresses from the job descriptions
        const sheetEmails = Object.keys(jobDescs);
        
        // Try to fetch the updated content for email templates
        let emailTemplates = {};
        try {
          const response = await fetch('../email_content_mapping_updated.json');
          emailTemplates = await response.json();
          
          // Check if the updated content is empty or invalid
          if (!emailTemplates || Object.keys(emailTemplates).length === 0) {
            throw new Error('Updated content is empty');
          }
        } catch (error) {
          // If there's any error reading the updated file, use the original content
          console.log('Using original content due to:', error.message);
          emailTemplates = originalEmailContent;
        }
        
        // Create rows based on all emails from the sheet
        const formattedRows = sheetEmails.map((email, index) => ({
          id: index + 1,
          email,
          // Use template if available, otherwise use a default template or empty string
          text: emailTemplates[email] || emailTemplates[Object.keys(emailTemplates)[0]] || '',
          // Include job description
          jobDescription: jobDescs[email] || ''
        }));
        
        setRows(formattedRows);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
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

  const handleRegenerate = async (id, email) => {
    try {
      // Set regenerating status for this email
      setRegenerating(prev => ({ ...prev, [email]: true }));
      
      // Call the backend API to regenerate the content
      const response = await fetch('http://localhost:3001/api/regenerate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          jobDescription: jobDescriptions[email] || '' 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to regenerate email content');
      }
      
      const result = await response.json();
      
      // Update the row with the regenerated content
      setRows((prevRows) =>
        prevRows.map((row) => (row.id === id ? { ...row, text: result.content } : row))
      );
      
      setSaveStatus('Email regenerated successfully!');
      
      // Clear the success message after 3 seconds
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error regenerating email:', error);
      setSaveStatus('Error regenerating email');
      
      // Clear the error message after 3 seconds
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      // Clear regenerating status
      setRegenerating(prev => ({ ...prev, [email]: false }));
    }
  };

  return (
    <div className="app-container">
      {saveStatus && (
        <div className={`save-status ${saveStatus.includes('Error') ? 'error' : 'success'}`}>
          {saveStatus}
        </div>
      )}
      {loading ? (
        <div className="loading">Loading email data...</div>
      ) : rows.length > 0 ? (
        rows.map((row) => (
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
              <button 
                className="regenerate-button" 
                onClick={() => handleRegenerate(row.id, row.email)}
                disabled={regenerating[row.email]}
              >
                {regenerating[row.email] ? 'Regenerating...' : 'Regenerate Email'}
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="no-data">No emails found. Please check your Google Sheet.</div>
      )}
    </div>
  );
}

export default App;
