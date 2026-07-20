import React, { useState } from 'react';
import ClipboardService from '../services/clipboard.service';
import { useLocale } from '../i18n/useLocale';

interface TextDisplayProps {
  text: string;
  onTextEdit?: (text: string) => void;
  onPasteError?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const PasteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <line x1="12" y1="11" x2="12" y2="17" />
    <polyline points="9 14 12 17 15 14" />
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const TextDisplay: React.FC<TextDisplayProps> = ({ text, onTextEdit, onPasteError, disabled = false, isLoading = false }) => {
  const t = useLocale();
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

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText && onTextEdit) {
        onTextEdit(clipText);
      }
    } catch {
      onPasteError?.();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onTextEdit) {
      onTextEdit(e.target.value);
    }
  };

  return (
    <div className={`source-panel${disabled ? ' disabled' : ''}`}>
      <div className="panel-header">
        <span className="panel-label">{t.sourceText}</span>
        <div className="panel-actions">
          <button className="paste-btn" onClick={handlePaste} disabled={disabled} title={t.paste}>
            <PasteIcon />
            <span className="paste-btn-label">{t.paste}</span>
          </button>
          <button className="copy-icon-btn" onClick={handleCopy} disabled={!text || disabled}>
            {isCopied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>
      </div>
      <div className="source-content">
        <textarea
          className="source-textarea"
          value={text}
          onChange={handleTextChange}
          disabled={disabled}
        />
        {!text && !isLoading && (
          <span className="source-placeholder">{t.typePlaceholder}</span>
        )}
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

export default TextDisplay;
