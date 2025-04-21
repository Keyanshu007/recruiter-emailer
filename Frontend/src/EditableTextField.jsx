import React, { useEffect, useRef } from 'react';

const EditableTextField = ({ content, onChange }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
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
    />
  );
};

export default EditableTextField;