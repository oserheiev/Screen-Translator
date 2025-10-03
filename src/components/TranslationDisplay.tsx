import React, { useState } from 'react';
import ClipboardService from '../services/clipboard.service';

interface TranslationDisplayProps {
  text: string;
  label: string;
}

const TranslationDisplay: React.FC<TranslationDisplayProps> = ({ text, label }) => {
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
        <div>{text || `${label} will appear here`}</div>
      </div>
    </div>
  );
};

export default TranslationDisplay;