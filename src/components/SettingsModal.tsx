import React, { useState } from 'react';
import { AppLanguage, Theme } from '../types';
import { APP_LANGUAGES, NATIVE_LANGUAGE_NAMES } from '../i18n';
import { useLocale } from '../i18n/useLocale';
import Modal from './Modal';

interface SettingsModalProps {
  apiKey: string;
  hotkey: string;
  availableModels: string[];
  selectedModel: string;
  appLanguage: AppLanguage;
  theme: Theme;
  alwaysOnTop: boolean;
  launchAtStartup: boolean;
  onApiKeyChange: (key: string) => void;
  onHotkeyChange: (hotkey: string) => void;
  onModelChange: (model: string) => void;
  onAppLanguageChange: (language: AppLanguage) => void;
  onThemeChange: (theme: Theme) => void;
  onAlwaysOnTopChange: (value: boolean) => void;
  onLaunchAtStartupChange: (value: boolean) => void;
  onClose: () => void;
  isFirstRun?: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  apiKey,
  hotkey,
  availableModels,
  selectedModel,
  appLanguage,
  theme,
  alwaysOnTop,
  launchAtStartup,
  onApiKeyChange,
  onHotkeyChange,
  onModelChange,
  onAppLanguageChange,
  onThemeChange,
  onAlwaysOnTopChange,
  onLaunchAtStartupChange,
  onClose,
  isFirstRun = false
}) => {
  const t = useLocale();
  const [key, setKey] = useState(apiKey);
  const [currentHotkey, setCurrentHotkey] = useState(hotkey);
  const [currentModel, setCurrentModel] = useState(selectedModel);
  const [currentLanguage, setCurrentLanguage] = useState<AppLanguage>(appLanguage);
  const [currentTheme, setCurrentTheme] = useState<Theme>(theme);
  const [currentAlwaysOnTop, setCurrentAlwaysOnTop] = useState(alwaysOnTop);
  const [currentLaunchAtStartup, setCurrentLaunchAtStartup] = useState(launchAtStartup);
  const [error, setError] = useState('');
  const [showKey, setShowKey] = useState(false);

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
    onThemeChange(currentTheme);
    onAlwaysOnTopChange(currentAlwaysOnTop);
    onLaunchAtStartupChange(currentLaunchAtStartup);
    onClose();
  };

  return (
    <Modal
      title={isFirstRun ? t.welcome : t.settings}
      onClose={onClose}
      closeLabel={t.close}
      showCloseButton={!isFirstRun}
      footer={
        <>
          {!isFirstRun && (
            <button type="button" className="cancel-button" onClick={onClose}>
              {t.cancel}
            </button>
          )}
          <button type="submit" form="settings-form" className="save-button">
            {isFirstRun ? t.getStarted : t.save}
          </button>
        </>
      }
    >
      {isFirstRun && (
        <p className="modal-subtitle">{t.welcomeSubtitle}</p>
      )}

      {error && <div className="error-message">{error}</div>}

      <form id="settings-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="api-key">{t.geminiApiKey}</label>
          <div className="input-with-toggle">
            <input
              id="api-key"
              type={showKey ? 'text' : 'password'}
              value={key}
              onChange={e => { setKey(e.target.value); setError(''); }}
              placeholder={t.apiKeyPlaceholder}
            />
            <button
              type="button"
              className="toggle-visibility-btn"
              onClick={() => setShowKey(v => !v)}
            >
              {showKey ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
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

            <div className="form-group">
              <label>{t.themeLabel}</label>
              <div className="theme-option-group" role="radiogroup" aria-label={t.themeLabel}>
                {(['light', 'dark', 'system'] as Theme[]).map(option => (
                  <button
                    key={option}
                    type="button"
                    className={`theme-option-btn${currentTheme === option ? ' selected' : ''}`}
                    aria-pressed={currentTheme === option}
                    onClick={() => setCurrentTheme(option)}
                  >
                    {option === 'light' ? t.themeLight : option === 'dark' ? t.themeDark : t.themeSystem}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <div className="form-checkbox-row">
                <input
                  id="always-on-top"
                  type="checkbox"
                  checked={currentAlwaysOnTop}
                  onChange={e => setCurrentAlwaysOnTop(e.target.checked)}
                />
                <label htmlFor="always-on-top">{t.alwaysOnTopLabel}</label>
              </div>
            </div>

            <div className="form-group">
              <div className="form-checkbox-row">
                <input
                  id="launch-at-startup"
                  type="checkbox"
                  checked={currentLaunchAtStartup}
                  onChange={e => setCurrentLaunchAtStartup(e.target.checked)}
                />
                <label htmlFor="launch-at-startup">{t.launchAtStartupLabel}</label>
              </div>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};

export default SettingsModal;
