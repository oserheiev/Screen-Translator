import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { SupportedLanguage } from '../types';
import { useLocale } from '../i18n/useLocale';

interface CustomSelectProps {
  value: SupportedLanguage;
  options: SupportedLanguage[];
  onChange: (value: SupportedLanguage) => void;
  getLabel: (lang: SupportedLanguage) => string;
  disabled?: boolean;
  ariaLabel?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, options, onChange, getLabel, disabled, ariaLabel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, options.indexOf(value)));
  const ref = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!isOpen) return;
    setActiveIndex(Math.max(0, options.indexOf(value)));
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, options, value]);

  const handleListboxKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(options[activeIndex]);
      setIsOpen(false);
    }
  };

  return (
    <div className="custom-select" ref={ref} aria-label={ariaLabel}>
      <button
        className="lang-pill custom-select-trigger"
        onClick={() => !disabled && setIsOpen(o => !o)}
        disabled={disabled}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
      >
        {getLabel(value)}
      </button>
      {isOpen && (
        <div
          className="custom-select-dropdown"
          role="listbox"
          id={listboxId}
          tabIndex={-1}
          onKeyDown={handleListboxKeyDown}
          ref={el => el?.focus()}
        >
          {options.map((option, i) => (
            <button
              key={option}
              className={`custom-select-option${option === value ? ' selected' : ''}${i === activeIndex ? ' active' : ''}`}
              role="option"
              aria-selected={option === value}
              onClick={() => { onChange(option); setIsOpen(false); }}
              onMouseEnter={() => setActiveIndex(i)}
              type="button"
            >
              {getLabel(option)}
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
  const t = useLocale();
  const getLabel = useCallback((lang: SupportedLanguage) => t.languageNames[lang] ?? lang, [t]);

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
    'Korean',
    'Polish'
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
        getLabel={getLabel}
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
        getLabel={getLabel}
        disabled={disabled}
        ariaLabel="Target language"
      />
    </div>
  );
};

export default DualLanguageSelector;
