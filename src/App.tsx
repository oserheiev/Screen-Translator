import React, { useState, useEffect, useCallback } from 'react';
import { useElectronIpc } from './hooks/useElectronIpc';
import CaptureButton from './components/CaptureButton';
import TextDisplay from './components/TextDisplay';
import TranslationDisplay from './components/TranslationDisplay';
import DualLanguageSelector from './components/DualLanguageSelector';
import SettingsModal from './components/SettingsModal';
import ErrorMessage from './components/ErrorMessage';
import LoadingSpinner from './components/LoadingSpinner';
import { useAppContext } from './contexts/AppContext';
import { SupportedLanguage, Theme } from './types';

const App: React.FC = () => {
  const {
    originalText,
    translatedText,
    sourceLanguage,
    targetLanguage,
    apiKey,
    hotkey,
    theme,
    isProcessing,
    error,
    setOriginalText,
    setSourceLanguage,
    setTargetLanguage,
    setApiKey,
    setHotkey,
    setTheme,
    processImage,
    translateText,
    clearError,
    selectedModel,
    availableModels,
    setModel
  } = useAppContext();

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isFirstRun, setIsFirstRun] = useState<boolean>(true);

  useEffect(() => {
    // Check if this is the first run and if API key is set
    if (apiKey) {
      setIsFirstRun(false);
    }
  }, [apiKey]);

  const { startCapture, onImageCaptured } = useElectronIpc();

  // ... (previous state code)

  useEffect(() => {
    const removeListener = onImageCaptured((imageData: string) => {
      console.log('Received image-captured event, image data length:', imageData.length);
      processImage(imageData);
    });

    return () => {
      removeListener();
    };
  }, [processImage, onImageCaptured]);

  // Removed automatic translation on text changes to prevent continuous translation
  // Translation now only happens:
  // 1. After image processing (handled in processImage)
  // 2. When language changes (handled in handleLanguageChange)
  // 3. When user manually requests translation

  const handleCapture = async () => {
    await startCapture();
  };

  const handleTextEdit = (text: string) => {
    setOriginalText(text);
  };

  const handleManualTranslate = () => {
    if (originalText && !isProcessing) {
      translateText(originalText);
    }
  };

  const handleSourceLanguageChange = (language: SupportedLanguage) => {
    setSourceLanguage(language);
  };

  const handleTargetLanguageChange = (language: SupportedLanguage) => {
    setTargetLanguage(language);
  };

  const handleSettingsOpen = () => {
    setIsSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
  };

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
  };

  const handleHotkeyChange = (newHotkey: string) => {
    setHotkey(newHotkey);
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const handleModelChange = (model: string) => {
    setModel(model);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Screen Translator</h1>
        <div className="header-buttons">
          <CaptureButton
            onCapture={handleCapture}
            disabled={isProcessing}
          />
          <button
            className="settings-button"
            onClick={handleSettingsOpen}
            disabled={isProcessing}
          >
            Settings
          </button>
        </div>
      </header>

      {error && (
        <ErrorMessage
          message={error}
          onRetry={clearError}
        />
      )}

      {isProcessing && (
        <div className="loading-overlay">
          <LoadingSpinner message="Translating..." />
        </div>
      )}

      <main className={`app-content ${isProcessing ? 'processing' : ''}`}>
        <div className="language-selector-container">
          <DualLanguageSelector
            sourceLanguage={sourceLanguage}
            targetLanguage={targetLanguage}
            onSourceLanguageChange={handleSourceLanguageChange}
            onTargetLanguageChange={handleTargetLanguageChange}
            disabled={isProcessing}
          />
        </div>

        <div className="text-container">
          <TextDisplay
            text={originalText}
            onTextEdit={handleTextEdit}
            label="Original Text"
            disabled={isProcessing}
          />

          <div className="translate-button-container">
            <button
              className="translate-button"
              onClick={handleManualTranslate}
              disabled={!originalText || isProcessing}
            >
              {isProcessing ? 'Translating...' : 'Translate'}
            </button>
          </div>

          <TranslationDisplay
            text={translatedText}
            label="Translated Text"
          />
        </div>
      </main>

      {isSettingsOpen && (
        <SettingsModal
          apiKey={apiKey}
          hotkey={hotkey}
          theme={theme}
          availableModels={availableModels}
          selectedModel={selectedModel}
          onApiKeyChange={handleApiKeyChange}
          onHotkeyChange={handleHotkeyChange}
          onThemeChange={handleThemeChange}
          onModelChange={handleModelChange}
          onClose={handleSettingsClose}
        />
      )}

      {isFirstRun && !apiKey && (
        <SettingsModal
          apiKey={apiKey}
          hotkey={hotkey}
          theme={theme}
          availableModels={availableModels}
          selectedModel={selectedModel}
          onApiKeyChange={handleApiKeyChange}
          onHotkeyChange={handleHotkeyChange}
          onThemeChange={handleThemeChange}
          onModelChange={handleModelChange}
          onClose={() => setIsFirstRun(false)}
          isFirstRun={true}
        />
      )}

    </div>
  );
};

export default App;