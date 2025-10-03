import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import GeminiService from '../services/gemini.service';
import { SupportedLanguage, TranslationResult, Theme } from '../types';

interface AppContextType {
  originalText: string;
  translatedText: string;
  targetLanguage: SupportedLanguage;
  apiKey: string;
  hotkey: string;
  theme: Theme;
  isProcessing: boolean;
  error: string | null;
  setOriginalText: (text: string) => void;
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
  targetLanguage: 'English',
  apiKey: '',
  hotkey: 'Ctrl+Alt+T', // Default, will be updated based on platform
  theme: 'system',
  isProcessing: false,
  error: null,
  setOriginalText: () => {},
  setTargetLanguage: () => {},
  setApiKey: () => {},
  setHotkey: () => {},
  setTheme: () => {},
  processImage: async () => {},
  translateText: async () => {},
  clearError: () => {}
};

export const AppContext = createContext<AppContextType>(defaultContext);

export const useAppContext = () => useContext(AppContext);

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguage>('English');
  const [apiKey, setApiKey] = useState('');
  const [hotkey, setHotkey] = useState('Ctrl+Alt+T'); // Default, will be updated based on platform
  const [theme, setTheme] = useState<Theme>('system');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);

  useEffect(() => {
    // Load settings from Electron store
    const loadSettings = async () => {
      try {
        if (window.electron) {
          const settings = await window.electron.settings.get();
          const platform = await window.electron.platform.getPlatform();
          
          if (settings.apiKey) {
            setApiKey(settings.apiKey);
          }
          if (settings.targetLanguage) {
            setTargetLanguage(settings.targetLanguage as SupportedLanguage);
          }
          if (settings.hotkey) {
            setHotkey(settings.hotkey);
          } else {
            // Set default hotkey based on platform
            const defaultHotkey = platform === 'darwin' ? 'Command+Alt+T' : 'Ctrl+Alt+T';
            setHotkey(defaultHotkey);
          }
          if (settings.theme) {
            setTheme(settings.theme as Theme);
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Separate useEffect for saving settings
  useEffect(() => {
    const saveSettings = async () => {
      try {
        if (window.electron) {
          await window.electron.settings.save({
            apiKey,
            targetLanguage,
            hotkey,
            theme
          });
        }
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    };

    // Only save if we have an apiKey to avoid unnecessary saves
    if (apiKey) {
      saveSettings();
    }
  }, [apiKey, targetLanguage, hotkey, theme]);

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
    console.log('geminiService available:', !!geminiService);
    console.log('apiKey set:', !!apiKey);
    
    if (!geminiService) {
      console.error('No geminiService available');
      setError('API key not set. Please set your Gemini API key in settings.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    console.log('Starting image processing...');

    try {
      const result: TranslationResult = await geminiService.processImage(imageData, targetLanguage);
      console.log('Image processing result:', result);
      console.log('Result type:', typeof result);
      console.log('originalText type:', typeof result.originalText);
      console.log('translatedText type:', typeof result.translatedText);
      console.log('originalText value:', result.originalText);
      console.log('translatedText value:', result.translatedText);
      
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
  }, [geminiService, targetLanguage, apiKey]);

  const translateText = useCallback(async (text: string) => {
    if (!geminiService) {
      setError('API key not set. Please set your Gemini API key in settings.');
      return;
    }

    if (!text.trim()) {
      setTranslatedText('');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await geminiService.translateText(text, targetLanguage);
      setTranslatedText(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  }, [geminiService, targetLanguage]);

  const clearError = () => {
    setError(null);
  };

  const value: AppContextType = {
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
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};