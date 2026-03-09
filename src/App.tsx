import React, { useState, useEffect } from 'react';
import { useElectronIpc } from './hooks/useElectronIpc';
import TextDisplay from './components/TextDisplay';
import TranslationDisplay from './components/TranslationDisplay';
import DualLanguageSelector from './components/DualLanguageSelector';
import SettingsModal from './components/SettingsModal';
import PermissionModal from './components/PermissionModal';
import HistoryPanel from './components/HistoryPanel';
import { useAppContext } from './contexts/AppContext';

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const GearIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const CameraIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const App: React.FC = () => {
  const {
    originalText,
    translatedText,
    sourceLanguage,
    targetLanguage,
    apiKey,
    hotkey,
    isProcessing,
    error,
    history,
    setOriginalText,
    setSourceLanguage,
    setTargetLanguage,
    setApiKey,
    setHotkey,
    processImage,
    translateText,
    clearError,
    clearHistory,
    restoreHistoryEntry,
    selectedModel,
    availableModels,
    setModel,
    updateStatus,
    updateVersion,
    updateProgress,
    handleDownloadUpdate,
    handleInstallUpdate
  } = useAppContext();

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isFirstRun, setIsFirstRun] = useState<boolean>(true);
  const [permissionPlatform, setPermissionPlatform] = useState<string | null>(null);

  useEffect(() => {
    if (apiKey) {
      setIsFirstRun(false);
    }
  }, [apiKey]);

  const { startCapture, onImageCaptured } = useElectronIpc();

  useEffect(() => {
    const removeListener = onImageCaptured((imageData: string) => {
      processImage(imageData);
    });
    return () => { removeListener(); };
  }, [processImage, onImageCaptured]);

  useEffect(() => {
    const electron = (window as any).electron;
    if (!electron?.on) return;
    const remove = electron.on('permission-error', ({ platform }: { platform: string }) => {
      setPermissionPlatform(platform);
    });
    return () => { remove(); };
  }, []);

  const handleCapture = async () => { await startCapture(); };

  const handleManualTranslate = () => {
    if (originalText && !isProcessing) {
      translateText(originalText);
    }
  };

  const modelLabel = selectedModel
    ? `⚡ ${selectedModel.replace('models/', '').replace('gemini-', 'Gemini ').replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}`
    : '⚡ Gemini Flash';

  return (
    <div className="app-shell">
      {/* History sidebar */}
      <div className={`history-panel-wrapper${isHistoryOpen ? ' open' : ''}`}>
        <HistoryPanel
          entries={history}
          onSelect={(entry) => { restoreHistoryEntry(entry); }}
          onClear={clearHistory}
        />
      </div>

      {/* Main content */}
      <div className="app-container">
        {/* Header */}
        <header className="app-header">
          <div className="header-left">
            <button
              className={`header-icon-btn${isHistoryOpen ? ' active' : ''}`}
              title="History"
              onClick={() => setIsHistoryOpen(o => !o)}
            >
              <ClockIcon />
            </button>
            <h1 className="header-title">Screen Translator</h1>
          </div>
          <div className="header-right">
            <div className="model-pill">{modelLabel}</div>
            {updateStatus === 'available' && (
              <button className="update-pill" onClick={handleDownloadUpdate} title={`Update to v${updateVersion}`}>
                ↑ v{updateVersion}
              </button>
            )}
            {updateStatus === 'downloading' && (
              <button className="update-pill update-pill--downloading" disabled>
                {updateProgress > 0 ? `${updateProgress}%` : '↓ Downloading…'}
              </button>
            )}
            {updateStatus === 'ready' && (
              <button className="update-pill update-pill--ready" onClick={handleInstallUpdate} title="Restart to install update">
                ↺ Restart
              </button>
            )}
            <button className="settings-icon-btn" onClick={() => setIsSettingsOpen(true)} title="Settings">
              <GearIcon />
            </button>
          </div>
        </header>

        {/* Toolbar */}
        <div className="toolbar-row">
          <div className="toolbar-pill">
            <DualLanguageSelector
              sourceLanguage={sourceLanguage}
              targetLanguage={targetLanguage}
              onSourceLanguageChange={setSourceLanguage}
              onTargetLanguageChange={setTargetLanguage}
              disabled={isProcessing}
            />
            <div className="toolbar-divider" />
            <div className="split-btn">
              <button
                className={`split-btn-translate${isProcessing ? ' loading' : ''}`}
                onClick={handleManualTranslate}
                disabled={!originalText || isProcessing}
              >
                {isProcessing ? (
                  <><div className="btn-spinner" /> Translating...</>
                ) : (
                  <><ChevronIcon /> Translate</>
                )}
              </button>
              <div className="split-btn-divider" />
              <button
                className="split-btn-capture"
                onClick={handleCapture}
                disabled={isProcessing}
                title="Capture screen"
              >
                <CameraIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="error-banner">
            <span className="error-banner-text">{error}</span>
            <button className="error-banner-dismiss" onClick={clearError}>×</button>
          </div>
        )}

        {/* Panels */}
        <div className="panels-row">
          <TextDisplay
            text={originalText}
            onTextEdit={setOriginalText}
            disabled={isProcessing}
          />
          <TranslationDisplay
            text={translatedText}
            isLoading={isProcessing}
          />
        </div>

        {/* Settings modal */}
        {isSettingsOpen && (
          <SettingsModal
            apiKey={apiKey}
            hotkey={hotkey}
            availableModels={availableModels}
            selectedModel={selectedModel}
            onApiKeyChange={setApiKey}
            onHotkeyChange={setHotkey}
            onModelChange={setModel}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}

        {/* Permission modal */}
        {permissionPlatform && (
          <PermissionModal
            platform={permissionPlatform}
            onOpenSettings={() => {
              const electron = (window as any).electron;
              const url = permissionPlatform === 'darwin'
                ? 'x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_ScreenCapture'
                : 'ms-settings:privacy-broadfilesystemaccess';
              electron?.shell?.openExternal(url);
            }}
            onClose={() => setPermissionPlatform(null)}
          />
        )}

        {/* First-run modal */}
        {isFirstRun && !apiKey && (
          <SettingsModal
            apiKey={apiKey}
            hotkey={hotkey}
            availableModels={availableModels}
            selectedModel={selectedModel}
            onApiKeyChange={setApiKey}
            onHotkeyChange={setHotkey}
            onModelChange={setModel}
            onClose={() => setIsFirstRun(false)}
            isFirstRun={true}
          />
        )}
      </div>
    </div>
  );
};

export default App;
