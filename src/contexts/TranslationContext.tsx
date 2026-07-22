import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { HistoryEntry, AlternativeGroup, ContextData } from '../types';
import { useElectronIpc } from '../hooks/useElectronIpc';
import { getLocale } from '../i18n';
import { useSettingsContext } from './SettingsContext';

interface TranslationContextType {
  originalText: string;
  translatedText: string;
  isProcessing: boolean;
  isCaptureProcessing: boolean;
  error: string | null;
  history: HistoryEntry[];
  alternatives: AlternativeGroup[] | null;
  contextData: ContextData | null;
  setOriginalText: (text: string) => void;
  processImage: (imageData: string) => Promise<void>;
  translateText: (text: string) => Promise<void>;
  clearError: () => void;
  reportError: (message: string) => void;
  clearHistory: () => void;
  restoreHistoryEntry: (entry: HistoryEntry) => void;
  deleteHistoryEntry: (id: string) => void;
}

const defaultContext: TranslationContextType = {
  originalText: '',
  translatedText: '',
  isProcessing: false,
  isCaptureProcessing: false,
  error: null,
  history: [],
  alternatives: null,
  contextData: null,
  setOriginalText: () => {},
  processImage: async () => {},
  translateText: async () => {},
  clearError: () => {},
  reportError: () => {},
  clearHistory: () => {},
  restoreHistoryEntry: () => {},
  deleteHistoryEntry: () => {},
};

const TranslationContext = createContext<TranslationContextType>(defaultContext);

export const useTranslationContext = () => useContext(TranslationContext);

interface TranslationProviderProps {
  children: React.ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCaptureProcessing, setIsCaptureProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [alternatives, setAlternatives] = useState<AlternativeGroup[] | null>(null);
  const [contextData, setContextData] = useState<ContextData | null>(null);
  const historyLoadedRef = useRef(false);

  const { showWindow, isElectronAvailable } = useElectronIpc();
  const {
    geminiService,
    sourceLanguage,
    targetLanguage,
    setSourceLanguage,
    setTargetLanguage,
    selectedModel,
    showAlternatives,
    showContext,
    appLanguage,
  } = useSettingsContext();

  useEffect(() => {
    const loadHistory = async () => {
      try {
        if (isElectronAvailable) {
          const savedHistory = await window.electron.history.get();
          setHistory(savedHistory || []);
        }
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        historyLoadedRef.current = true;
      }
    };

    loadHistory();
  }, [isElectronAvailable]);

  useEffect(() => {
    if (!historyLoadedRef.current || !isElectronAvailable) return;
    window.electron.history.save(history).catch(console.error);
  }, [history, isElectronAvailable]);

  const appendHistory = useCallback((entry: HistoryEntry) => {
    setHistory((prev: HistoryEntry[]) => [entry, ...prev].slice(0, 30));
  }, []);

  const processImage = useCallback(async (imageData: string) => {
    if (!geminiService) {
      setError(getLocale(appLanguage).apiKeyNotSet);
      return;
    }

    await showWindow();

    setIsProcessing(true);
    setIsCaptureProcessing(true);
    setError(null);
    setOriginalText('');
    setTranslatedText('');
    setAlternatives(null);
    setContextData(null);

    try {
      const result = await geminiService.processImage(
        imageData,
        sourceLanguage,
        targetLanguage,
        selectedModel,
        { showAlternatives, showContext, appLanguage }
      );
      setOriginalText(result.originalText);
      setTranslatedText(result.translatedText);
      setAlternatives(result.alternatives ?? null);
      setContextData(result.context ?? null);
      appendHistory({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        originalText: result.originalText,
        translatedText: result.translatedText,
        sourceLanguage,
        targetLanguage,
        timestamp: Date.now(),
        alternatives: result.alternatives,
        context: result.context,
      });
      if (isElectronAvailable) {
        window.electron.analytics.trackTranslationCompleted({
          languagePair: `${sourceLanguage} -> ${targetLanguage}`,
          trigger: 'capture',
        }).catch(console.error);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsProcessing(false);
      setIsCaptureProcessing(false);
    }
  }, [geminiService, sourceLanguage, targetLanguage, selectedModel, showAlternatives, showContext, showWindow, appendHistory, appLanguage, isElectronAvailable]);

  const translateText = useCallback(async (text: string) => {
    if (!geminiService) {
      setError(getLocale(appLanguage).apiKeyNotSet);
      return;
    }

    if (!text.trim()) {
      setTranslatedText('');
      return;
    }

    await showWindow();

    setIsProcessing(true);
    setError(null);
    setTranslatedText('');
    setAlternatives(null);
    setContextData(null);

    try {
      const result = await geminiService.translateText(
        text,
        sourceLanguage,
        targetLanguage,
        selectedModel,
        { showAlternatives, showContext, appLanguage }
      );
      setTranslatedText(result.translatedText);
      setAlternatives(result.alternatives ?? null);
      setContextData(result.context ?? null);
      appendHistory({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        originalText: text,
        translatedText: result.translatedText,
        sourceLanguage,
        targetLanguage,
        timestamp: Date.now(),
        alternatives: result.alternatives,
        context: result.context,
      });
      if (isElectronAvailable) {
        window.electron.analytics.trackTranslationCompleted({
          languagePair: `${sourceLanguage} -> ${targetLanguage}`,
          trigger: 'manual',
        }).catch(console.error);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  }, [geminiService, sourceLanguage, targetLanguage, showWindow, selectedModel, showAlternatives, showContext, appendHistory, appLanguage, isElectronAvailable]);

  const clearError = () => {
    setError(null);
  };

  const reportError = useCallback((message: string) => {
    setError(message);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const deleteHistoryEntry = useCallback((id: string) => {
    setHistory((prev: HistoryEntry[]) => prev.filter(entry => entry.id !== id));
  }, []);

  const restoreHistoryEntry = useCallback((entry: HistoryEntry) => {
    setOriginalText(entry.originalText);
    setTranslatedText(entry.translatedText);
    setSourceLanguage(entry.sourceLanguage);
    setTargetLanguage(entry.targetLanguage);
    setAlternatives(entry.alternatives ?? null);
    setContextData(entry.context ?? null);
  }, [setSourceLanguage, setTargetLanguage]);

  const value: TranslationContextType = {
    originalText,
    translatedText,
    isProcessing,
    isCaptureProcessing,
    error,
    history,
    alternatives,
    contextData,
    setOriginalText,
    processImage,
    translateText,
    clearError,
    reportError,
    clearHistory,
    restoreHistoryEntry,
    deleteHistoryEntry,
  };

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
};
