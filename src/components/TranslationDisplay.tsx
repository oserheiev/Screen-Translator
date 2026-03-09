import React, { useState } from 'react';
import ClipboardService from '../services/clipboard.service';
import Markdown from 'markdown-to-jsx';

interface TranslationDisplayProps {
  text: string;
  isLoading?: boolean;
}

const CopyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const TranslationDisplay: React.FC<TranslationDisplayProps> = ({ text, isLoading = false }) => {
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
    <div className="translation-panel">
      <div className="panel-header">
        <span className="panel-label">Translation</span>
        <button className="copy-icon-btn-dark" onClick={handleCopy} disabled={!text || isLoading}>
          {isCopied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
      <div className="translation-content">
        {text && <Markdown>{text}</Markdown>}
      </div>
      {isLoading && (
        <div className="translation-skeleton-overlay">
          <div className="skeleton-line" />
          <div className="skeleton-line" />
          <div className="skeleton-line" />
        </div>
      )}
    </div>
  );
};

export default TranslationDisplay;
