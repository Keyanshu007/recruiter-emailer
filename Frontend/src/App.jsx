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
  const [savedEmails, setSavedEmails] = useState(new Set());
  const [saving, setSaving] = useState({});

  // Function to process email content - remove greeting and signature
  const processEmailContent = (content) => {
    if (!content) return '';
    
    let processedContent = content;
    
    // Remove "Dear [Name]," at the beginning if present
    processedContent = processedContent.replace(/^\s*Dear\s+[^,<]*[,<][^<]*(<br>|<br\s*\/?>)?/i, '');
    
    // Remove everything from "Regards" (or variations) to the end
    const regardsVariations = ['Regards', 'Best regards', 'Sincerely', 'Best'];
    for (const variant of regardsVariations) {
      const regardsRegex = new RegExp(`${variant}[^<]*(<br>|<br\\s*\/?>|$).*$`, 'i');
      processedContent = processedContent.replace(regardsRegex, '');
    }
    
    // Clean up any extra spaces or line breaks at the beginning or end
    processedContent = processedContent.trim();
    
    return processedContent;
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const descResponse = await fetch('http://localhost:3001/api/job-descriptions');
        if (!descResponse.ok) {
          throw new Error('Failed to fetch job descriptions');
        }
        const jobDescs = await descResponse.json();
        setJobDescriptions(jobDescs);

        const sheetEmails = Object.keys(jobDescs);

        let emailTemplates = {};
        try {
          const response = await fetch('../email_content_mapping_updated.json');
          emailTemplates = await response.json();

          if (!emailTemplates || Object.keys(emailTemplates).length === 0) {
            throw new Error('Updated content is empty');
          }
        } catch (error) {
          console.log('Using original content due to:', error.message);
          emailTemplates = originalEmailContent;
        }

        const templateEmails = Object.keys(emailTemplates);
        const allEmails = [...new Set([...sheetEmails, ...templateEmails])];

        console.log(`Total emails found: ${allEmails.length} (Sheet: ${sheetEmails.length}, Templates: ${templateEmails.length})`);

        const formattedRows = allEmails.map((email, index) => {
          // Get the raw email content
          let rawEmailContent = emailTemplates[email] || emailTemplates[Object.keys(emailTemplates)[0]] || '';
          
          // Process the email content to remove greeting and signature
          const processedContent = processEmailContent(rawEmailContent);
          
          return {
            id: index + 1,
            email,
            text: processedContent,
            jobDescription: jobDescs[email] || ''
          };
        });

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

    setRows(prevRows => {
      const row = prevRows.find(r => r.id === id);
      if (row) {
        const newSavedEmails = new Set(savedEmails);
        newSavedEmails.delete(row.email);
        setSavedEmails(newSavedEmails);
      }
      return prevRows;
    });
  };

  const handleSaveEmail = async (id, email, content) => {
    setSaving(prev => ({ ...prev, [email]: true }));
    const jsonData = { [email]: content };

    try {
      let existingContent = {};
      try {
        const response = await fetch('../email_content_mapping_updated.json');
        existingContent = await response.json();
      } catch (error) {
        console.log('No existing content or error reading file:', error.message);
      }

      const mergedContent = { ...existingContent, ...jsonData };

      const saveResponse = await fetch('http://localhost:3001/api/save-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mergedContent),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save content');
      }

      const result = await saveResponse.json();
      console.log(`Email content saved for ${email}:`, result);

      const newSavedEmails = new Set(savedEmails);
      newSavedEmails.add(email);
      setSavedEmails(newSavedEmails);

      setSaveStatus(`${email} saved successfully!`);

      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error(`Error saving email ${email}:`, error);
      setSaveStatus(`Error saving ${email}`);

      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setSaving(prev => ({ ...prev, [email]: false }));
    }
  };

  const handleTextChange = (id, newText) => {
    setRows((prevRows) =>
      prevRows.map((row) => (row.id === id ? { ...row, text: newText } : row))
    );

    setRows(prevRows => {
      const row = prevRows.find(r => r.id === id);
      if (row && savedEmails.has(row.email)) {
        const newSavedEmails = new Set(savedEmails);
        newSavedEmails.delete(row.email);
        setSavedEmails(newSavedEmails);
      }
      return prevRows;
    });
  };

  const handleRegenerate = async (id, email) => {
    try {
      setRegenerating(prev => ({ ...prev, [email]: true }));

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

      setRows((prevRows) =>
        prevRows.map((row) => (row.id === id ? { ...row, text: result.content } : row))
      );

      setSaveStatus('Email regenerated successfully!');

      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error regenerating email:', error);
      setSaveStatus('Error regenerating email');

      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      const newSavedEmails = new Set(savedEmails);
      newSavedEmails.delete(email);
      setSavedEmails(newSavedEmails);

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
              {savedEmails.has(row.email) ? (
                <div className="text-field saved-content">
                  <p className="saved-message">Content saved successfully!</p>
                  <button
                    className="edit-again-button"
                    onClick={() => {
                      const newSavedEmails = new Set(savedEmails);
                      newSavedEmails.delete(row.email);
                      setSavedEmails(newSavedEmails);
                    }}
                  >
                    Edit Again
                  </button>
                </div>
              ) : (
                <EditableTextField
                  content={row.text}
                  onChange={(newText) => handleTextChange(row.id, newText)}
                />
              )}
              <textarea
                className="text-field job-description"
                value={jobDescriptions[row.email] || ""}
                placeholder="Job description will appear here..."
                readOnly
              />
            </div>
            <div className="button-container">
              <button onClick={() => handleUndo(row.id)}>Undo</button>
              <button 
                onClick={() => handleSaveEmail(row.id, row.email, row.text)}
                disabled={saving[row.email]}
              >
                {saving[row.email] ? 'Saving...' : 'Save'}
              </button>
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
