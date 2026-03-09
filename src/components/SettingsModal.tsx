import React, { useState } from 'react';

interface SettingsModalProps {
  apiKey: string;
  hotkey: string;
  availableModels: string[];
  selectedModel: string;
  onApiKeyChange: (key: string) => void;
  onHotkeyChange: (hotkey: string) => void;
  onModelChange: (model: string) => void;
  onClose: () => void;
  isFirstRun?: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  apiKey,
  hotkey,
  availableModels,
  selectedModel,
  onApiKeyChange,
  onHotkeyChange,
  onModelChange,
  onClose,
  isFirstRun = false
}) => {
  const [key, setKey] = useState(apiKey);
  const [currentHotkey, setCurrentHotkey] = useState(hotkey);
  const [currentModel, setCurrentModel] = useState(selectedModel);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      setError('API key is required');
      return;
    }
    onApiKeyChange(key.trim());
    onHotkeyChange(currentHotkey);
    onModelChange(currentModel);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{isFirstRun ? 'Welcome to Screen Translator' : 'Settings'}</h2>
          {!isFirstRun && (
            <button className="close-button" onClick={onClose}>×</button>
          )}
        </div>

        {isFirstRun && (
          <p className="modal-subtitle">
            To get started, enter your Gemini API key below. It's used for text recognition and translation.
          </p>
        )}

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="api-key">Gemini API Key</label>
            <input
              id="api-key"
              type="text"
              value={key}
              onChange={e => { setKey(e.target.value); setError(''); }}
              placeholder="Enter your Gemini API key"
            />
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get a Gemini API key →
            </a>
          </div>

          {!isFirstRun && (
            <>
              <div className="form-group">
                <label htmlFor="hotkey">Global Hotkey</label>
                <input
                  id="hotkey"
                  type="text"
                  value={currentHotkey}
                  onChange={e => setCurrentHotkey(e.target.value)}
                  placeholder="e.g., Ctrl+Alt+T"
                />
                <small className="form-help">Use format like Ctrl+Alt+T or Command+Shift+S</small>
              </div>

              <div className="form-group">
                <label htmlFor="model">Model</label>
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
                    <option value={currentModel}>{currentModel} (Loading or Unavailable)</option>
                  )}
                </select>
              </div>
            </>
          )}

          <div className="modal-footer">
            {!isFirstRun && (
              <button type="button" className="cancel-button" onClick={onClose}>
                Cancel
              </button>
            )}
            <button type="submit" className="save-button">
              {isFirstRun ? 'Get Started' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
