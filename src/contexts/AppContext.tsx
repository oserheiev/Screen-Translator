import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import GeminiService from '../services/gemini.service';
import { SupportedLanguage, TranslationResult, Theme } from '../types';
import { useElectronIpc } from '../hooks/useElectronIpc';

interface AppContextType {
  originalText: string;
  translatedText: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  apiKey: string;
  hotkey: string;
  theme: Theme;
  isProcessing: boolean;
  error: string | null;
  setOriginalText: (text: string) => void;
  setSourceLanguage: (language: SupportedLanguage) => void;
  setTargetLanguage: (language: SupportedLanguage) => void;
  setApiKey: (key: string) => void;
  setHotkey: (hotkey: string) => void;
  setTheme: (theme: Theme) => void;
  processImage: (imageData: string) => Promise<void>;
  translateText: (text: string) => Promise<void>;
  clearError: () => void;
}

const defaultContext: AppContextType = {
  originalText: '',
  translatedText: '',
  sourceLanguage: 'Auto',
  targetLanguage: 'English',
  apiKey: '',
  hotkey: 'Ctrl+Alt+T',
  theme: 'system',
  isProcessing: false,
  error: null,
  setOriginalText: () => { },
  setSourceLanguage: () => { },
  setTargetLanguage: () => { },
  setApiKey: () => { },
  setHotkey: () => { },
  setTheme: () => { },
  processImage: async () => { },
  translateText: async () => { },
  clearError: () => { }
};

export const AppContext = createContext<AppContextType>(defaultContext);

export const useAppContext = () => useContext(AppContext);

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState<SupportedLanguage>('Auto');
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguage>('English');
  const [apiKey, setApiKey] = useState('');
  const [hotkey, setHotkey] = useState('Ctrl+Alt+T');
  const [theme, setTheme] = useState<Theme>('system');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);

  const { getSettings, saveSettings, showWindow, getPlatform, isElectronAvailable } = useElectronIpc();

  useEffect(() => {
    // Load settings from Electron store
    const loadSettings = async () => {
      try {
        if (isElectronAvailable) {
          const settings = await getSettings();
          const platform = await getPlatform();

          if (settings) {
            if (settings.apiKey) setApiKey(settings.apiKey);
            if (settings.sourceLanguage) setSourceLanguage(settings.sourceLanguage as SupportedLanguage);
            if (settings.targetLanguage) setTargetLanguage(settings.targetLanguage as SupportedLanguage);
            if (settings.hotkey) {
              setHotkey(settings.hotkey);
            } else {
              const defaultHotkey = platform === 'darwin' ? 'Command+Alt+T' : 'Ctrl+Alt+T';
              setHotkey(defaultHotkey);
            }
            if (settings.theme) setTheme(settings.theme as Theme);
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, [getSettings, getPlatform, isElectronAvailable]);

  // Separate useEffect for saving settings
  useEffect(() => {
    const save = async () => {
      try {
        if (isElectronAvailable && apiKey) {
          await saveSettings({
            apiKey,
            sourceLanguage,
            targetLanguage,
            hotkey,
            theme
          });
        }
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    };

    save();
  }, [apiKey, sourceLanguage, targetLanguage, hotkey, theme, saveSettings, isElectronAvailable]);

  // Separate useEffect for GeminiService creation - only when apiKey changes
  useEffect(() => {
    if (apiKey) {
      console.log('Creating new GeminiService with API key');
      setGeminiService(new GeminiService(apiKey));
    } else {
      setGeminiService(null);
    }
  }, [apiKey]);

  const processImage = useCallback(async (imageData: string) => {
    console.log('processImage called with imageData length:', imageData.length);

    if (!geminiService) {
      console.error('No geminiService available');
      setError('API key not set. Please set your Gemini API key in settings.');
      return;
    }

    // Show and focus the main window when translation starts
    await showWindow();

    setIsProcessing(true);
    setError(null);
    console.log('Starting image processing...');

    try {
      const result: TranslationResult = await geminiService.processImage(imageData, sourceLanguage, targetLanguage);
      setOriginalText(result.originalText);
      setTranslatedText(result.translatedText);
      console.log('Text set successfully');
    } catch (error) {
      console.error('Error processing image:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsProcessing(false);
      console.log('Image processing completed');
    }
  }, [geminiService, sourceLanguage, targetLanguage, showWindow]);

  const translateText = useCallback(async (text: string) => {
    if (!geminiService) {
      setError('API key not set. Please set your Gemini API key in settings.');
      return;
    }

    if (!text.trim()) {
      setTranslatedText('');
      return;
    }

    // Show and focus the main window when translation starts
    await showWindow();

    setIsProcessing(true);
    setError(null);

    try {
      const result = await geminiService.translateText(text, sourceLanguage, targetLanguage);
      setTranslatedText(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  }, [geminiService, sourceLanguage, targetLanguage, showWindow]);

  const clearError = () => {
    setError(null);
  };

  const value: AppContextType = {
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
    clearError
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};