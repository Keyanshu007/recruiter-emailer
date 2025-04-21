import React, { useEffect, useRef } from 'react';

const EditableTextField = ({ content, onChange }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      // Process content to ensure proper HTML formatting
      let processedContent = content;
      
      // Ensure <br> tags are properly rendered
      processedContent = processedContent.replace(/\n/g, '<br>');
      
      // Set the HTML content only if it has changed to avoid cursor position issues
      if (editorRef.current.innerHTML !== processedContent) {
        editorRef.current.innerHTML = processedContent;
      }
    }
  }, [content]);

  const handleInput = (e) => {
    const html = e.currentTarget.innerHTML;
    onChange(html);
  };

  return (
    <div
      ref={editorRef}
      className="text-field"
      contentEditable
      onInput={handleInput}
      suppressContentEditableWarning={true}
      style={{
        textAlign: 'left',
        padding: '10px 15px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        lineHeight: '1.6',
        fontWeight: 'normal',
        color: '#333333'
      }}
    />
  );
};

export default EditableTextField;