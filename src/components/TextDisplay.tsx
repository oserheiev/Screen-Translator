import React, { useState } from 'react';
import ClipboardService from '../services/clipboard.service';

interface TextDisplayProps {
  text: string;
  onTextEdit?: (text: string) => void;
  label: string;
  editable?: boolean;
  disabled?: boolean;
}

const TextDisplay: React.FC<TextDisplayProps> = ({ 
  text, 
  onTextEdit, 
  label, 
  editable = true,
  disabled = false
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const clipboardService = new ClipboardService();

  const handleCopy = async () => {
    if (!text) return;
    
    const success = await clipboardService.copyToClipboard(text);
    
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onTextEdit) {
      onTextEdit(e.target.value);
    }
  };

  return (
    <div className="text-display">
      <div className="text-display-header">
        <span>{label}</span>
        <button 
          className="copy-button" 
          onClick={handleCopy}
          disabled={!text}
        >
          {isCopied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="text-display-content">
        {editable ? (
          <textarea 
            value={text} 
            onChange={handleTextChange}
            placeholder={`${label} will appear here`}
            disabled={disabled}
          />
        ) : (
          <div>{text || `${label} will appear here`}</div>
        )}
      </div>
    </div>
  );
};

export default TextDisplay;