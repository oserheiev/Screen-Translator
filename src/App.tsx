import React, { useState, useEffect, useCallback } from 'react';
import CaptureButton from './components/CaptureButton';
import TextDisplay from './components/TextDisplay';
import TranslationDisplay from './components/TranslationDisplay';
import LanguageSelector from './components/LanguageSelector';
import SettingsModal from './components/SettingsModal';
import ErrorMessage from './components/ErrorMessage';
import { useAppContext } from './contexts/AppContext';
import { SupportedLanguage, Theme } from './types';

const App: React.FC = () => {
  const {
    originalText,
    translatedText,
    targetLanguage,
    apiKey,
    hotkey,
    theme,
    isProcessing,
    error,
    setOriginalText,
    setTargetLanguage,
    setApiKey,
    setHotkey,
    setTheme,
    processImage,
    translateText,
    clearError
  } = useAppContext();

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isFirstRun, setIsFirstRun] = useState<boolean>(true);

  useEffect(() => {
    // Check if this is the first run and if API key is set
    if (apiKey) {
      setIsFirstRun(false);
    }
  }, [apiKey]);

  useEffect(() => {
    // Set up listener for image capture from main process
    if (window.electron) {
      const removeListener = window.electron.on('image-captured', (imageData: string) => {
        console.log('Received image-captured event, image data length:', imageData.length);
        processImage(imageData);
      });

      return () => {
        removeListener();
      };
    }
  }, [processImage]);

  // Removed automatic translation on text changes to prevent continuous translation
  // Translation now only happens:
  // 1. After image processing (handled in processImage)
  // 2. When language changes (handled in handleLanguageChange)
  // 3. When user manually requests translation

  const handleCapture = async () => {
    if (window.electron) {
      try {
        await window.electron.capture.start();
      } catch (error) {
        console.error('Failed to start screen capture:', error);
      }
    }
  };

  const handleTextEdit = (text: string) => {
    setOriginalText(text);
  };

  const handleManualTranslate = () => {
    if (originalText && !isProcessing) {
      translateText(originalText);
    }
  };

  const handleLanguageChange = (language: string) => {
    setTargetLanguage(language as SupportedLanguage);
    if (originalText) {
      translateText(originalText);
    }
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

      <main className="app-content">
        <div className="language-selector-container">
          <LanguageSelector 
            selectedLanguage={targetLanguage} 
            onLanguageChange={handleLanguageChange} 
          />
        </div>

        <div className="text-container">
          <TextDisplay
            text={originalText}
            onTextEdit={handleTextEdit}
            label="Original Text"
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
          onApiKeyChange={handleApiKeyChange}
          onHotkeyChange={handleHotkeyChange}
          onThemeChange={handleThemeChange}
          onClose={handleSettingsClose}
        />
      )}

      {isFirstRun && !apiKey && (
        <SettingsModal
          apiKey={apiKey}
          hotkey={hotkey}
          theme={theme}
          onApiKeyChange={handleApiKeyChange}
          onHotkeyChange={handleHotkeyChange}
          onThemeChange={handleThemeChange}
          onClose={() => setIsFirstRun(false)}
          isFirstRun={true}
        />
      )}

    </div>
  );
};

export default App;