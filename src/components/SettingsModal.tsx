import React, { useState } from 'react';
import { AppLanguage } from '../types';
import { APP_LANGUAGES, NATIVE_LANGUAGE_NAMES } from '../i18n';
import { useLocale } from '../i18n/useLocale';

interface SettingsModalProps {
  apiKey: string;
  hotkey: string;
  availableModels: string[];
  selectedModel: string;
  appLanguage: AppLanguage;
  onApiKeyChange: (key: string) => void;
  onHotkeyChange: (hotkey: string) => void;
  onModelChange: (model: string) => void;
  onAppLanguageChange: (language: AppLanguage) => void;
  onClose: () => void;
  isFirstRun?: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  apiKey,
  hotkey,
  availableModels,
  selectedModel,
  appLanguage,
  onApiKeyChange,
  onHotkeyChange,
  onModelChange,
  onAppLanguageChange,
  onClose,
  isFirstRun = false
}) => {
  const t = useLocale();
  const [key, setKey] = useState(apiKey);
  const [currentHotkey, setCurrentHotkey] = useState(hotkey);
  const [currentModel, setCurrentModel] = useState(selectedModel);
  const [currentLanguage, setCurrentLanguage] = useState<AppLanguage>(appLanguage);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      setError(t.apiKeyRequired);
      return;
    }
    onApiKeyChange(key.trim());
    onHotkeyChange(currentHotkey);
    onModelChange(currentModel);
    onAppLanguageChange(currentLanguage);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{isFirstRun ? t.welcome : t.settings}</h2>
          {!isFirstRun && (
            <button className="close-button" onClick={onClose}>×</button>
          )}
        </div>

        {isFirstRun && (
          <p className="modal-subtitle">{t.welcomeSubtitle}</p>
        )}

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="api-key">{t.geminiApiKey}</label>
            <input
              id="api-key"
              type="text"
              value={key}
              onChange={e => { setKey(e.target.value); setError(''); }}
              placeholder={t.apiKeyPlaceholder}
            />
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.getApiKeyLink}
            </a>
          </div>

          {!isFirstRun && (
            <>
              <div className="form-group">
                <label htmlFor="hotkey">{t.globalHotkey}</label>
                <input
                  id="hotkey"
                  type="text"
                  value={currentHotkey}
                  readOnly
                  placeholder={t.hotkeyPlaceholder}
                  onKeyDown={e => {
                    e.preventDefault();
                    const parts: string[] = [];
                    if (e.metaKey) parts.push('Command');
                    if (e.ctrlKey) parts.push('Ctrl');
                    if (e.altKey) parts.push('Alt');
                    if (e.shiftKey) parts.push('Shift');
                    const key = e.key;
                    if (!['Meta', 'Control', 'Alt', 'Shift'].includes(key)) {
                      parts.push(key.length === 1 ? key.toUpperCase() : key);
                    }
                    if (parts.length > 1) setCurrentHotkey(parts.join('+'));
                  }}
                />
                <small className="form-help">{t.hotkeyHelp}</small>
              </div>

              <div className="form-group">
                <label htmlFor="app-language">{t.appLanguageLabel}</label>
                <select
                  id="app-language"
                  value={currentLanguage}
                  onChange={e => setCurrentLanguage(e.target.value as AppLanguage)}
                >
                  {APP_LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{NATIVE_LANGUAGE_NAMES[lang]}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="model">{t.model}</label>
                <select
                  id="model"
                  value={currentModel}
                  onChange={e => setCurrentModel(e.target.value)}
                  disabled={availableModels.length === 0}
                >
                  {availableModels.length > 0 ? (
                    availableModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))
                  ) : (
                    <option value={currentModel}>{currentModel} ({t.loadingModel})</option>
                  )}
                </select>
              </div>
            </>
          )}

          <div className="modal-footer">
            {!isFirstRun && (
              <button type="button" className="cancel-button" onClick={onClose}>
                {t.cancel}
              </button>
            )}
            <button type="submit" className="save-button">
              {isFirstRun ? t.getStarted : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
