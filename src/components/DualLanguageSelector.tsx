import React from 'react';
import { SupportedLanguage } from '../types';

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
      <div className="lang-pill">
        <select
          value={sourceLanguage}
          onChange={e => onSourceLanguageChange(e.target.value as SupportedLanguage)}
          disabled={disabled}
          aria-label="Source language"
        >
          {supportedLanguages.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>

      <button
        className="lang-swap"
        onClick={swapLanguages}
        disabled={disabled || sourceLanguage === 'Auto'}
        title="Swap languages"
      >
        ⇄
      </button>

      <div className="lang-pill">
        <select
          value={targetLanguage}
          onChange={e => onTargetLanguageChange(e.target.value as SupportedLanguage)}
          disabled={disabled}
          aria-label="Target language"
        >
          {targetLanguages.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default DualLanguageSelector;
