import React from 'react';
import { SupportedLanguage } from '../types';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  selectedLanguage, 
  onLanguageChange 
}) => {
  const supportedLanguages: SupportedLanguage[] = [
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

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onLanguageChange(e.target.value);
  };

  return (
    <div className="language-selector">
      <label htmlFor="language-select">Translate to:</label>
      <select 
        id="language-select"
        value={selectedLanguage}
        onChange={handleChange}
      >
        {supportedLanguages.map(language => (
          <option key={language} value={language}>
            {language}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;