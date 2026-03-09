import React, { useState, useRef, useEffect } from 'react';
import { SupportedLanguage } from '../types';

interface CustomSelectProps {
  value: SupportedLanguage;
  options: SupportedLanguage[];
  onChange: (value: SupportedLanguage) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, options, onChange, disabled, ariaLabel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="custom-select" ref={ref} aria-label={ariaLabel}>
      <button
        className="lang-pill custom-select-trigger"
        onClick={() => !disabled && setIsOpen(o => !o)}
        disabled={disabled}
        type="button"
      >
        {value}
      </button>
      {isOpen && (
        <div className="custom-select-dropdown">
          {options.map(option => (
            <button
              key={option}
              className={`custom-select-option${option === value ? ' selected' : ''}`}
              onClick={() => { onChange(option); setIsOpen(false); }}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface DualLanguageSelectorProps {
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  onSourceLanguageChange: (language: SupportedLanguage) => void;
  onTargetLanguageChange: (language: SupportedLanguage) => void;
  disabled?: boolean;
}

const DualLanguageSelector: React.FC<DualLanguageSelectorProps> = ({
  sourceLanguage,
  targetLanguage,
  onSourceLanguageChange,
  onTargetLanguageChange,
  disabled = false
}) => {
  const supportedLanguages: SupportedLanguage[] = [
    'Auto',
    'English',
    'Russian',
    'Ukrainian',
    'Spanish',
    'French',
    'German',
    'Italian',
    'Portuguese',
    'Chinese (Simplified)',
    'Japanese',
    'Korean'
  ];

  const targetLanguages = supportedLanguages.filter(lang => lang !== 'Auto');

  const swapLanguages = () => {
    if (sourceLanguage !== 'Auto') {
      onSourceLanguageChange(targetLanguage as SupportedLanguage);
      onTargetLanguageChange(sourceLanguage);
    }
  };

  return (
    <div className="lang-selector-group">
      <CustomSelect
        value={sourceLanguage}
        options={supportedLanguages}
        onChange={onSourceLanguageChange}
        disabled={disabled}
        ariaLabel="Source language"
      />

      <button
        className="lang-swap"
        onClick={swapLanguages}
        disabled={disabled || sourceLanguage === 'Auto'}
        title="Swap languages"
      >
        ⇄
      </button>

      <CustomSelect
        value={targetLanguage}
        options={targetLanguages}
        onChange={onTargetLanguageChange}
        disabled={disabled}
        ariaLabel="Target language"
      />
    </div>
  );
};

export default DualLanguageSelector;
