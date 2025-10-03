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

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSourceLanguageChange(e.target.value as SupportedLanguage);
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onTargetLanguageChange(e.target.value as SupportedLanguage);
  };

  const swapLanguages = () => {
    if (sourceLanguage !== 'Auto' && targetLanguage !== 'Auto') {
      onSourceLanguageChange(targetLanguage);
      onTargetLanguageChange(sourceLanguage);
    }
  };

  return (
    <div className="dual-language-selector">
      <div className="language-selector-row">
        <div className="language-selector">
          <label htmlFor="source-language-select">From:</label>
          <select 
            id="source-language-select"
            value={sourceLanguage}
            onChange={handleSourceChange}
            disabled={disabled}
          >
            {supportedLanguages.map(language => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </div>

        <button 
          className="swap-languages-button"
          onClick={swapLanguages}
          disabled={disabled || sourceLanguage === 'Auto'}
          title="Swap languages"
        >
          ⇄
        </button>

        <div className="language-selector">
          <label htmlFor="target-language-select">To:</label>
          <select 
            id="target-language-select"
            value={targetLanguage}
            onChange={handleTargetChange}
            disabled={disabled}
          >
            {targetLanguages.map(language => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default DualLanguageSelector;