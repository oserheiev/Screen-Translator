import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import GeminiService from '../services/gemini.service';
import { SupportedLanguage, TranslationResult, Theme, HistoryEntry, AppLanguage, AlternativeGroup, ContextData } from '../types';
import { useElectronIpc } from '../hooks/useElectronIpc';
import { getLocale } from '../i18n';
import { WhatsNewEntry, WhatsNewBullet, WHATS_NEW, getUnseenEntries, compareVersions } from '../whatsnew';

export type UpdateStatus = 'idle' | 'available' | 'downloading' | 'ready' | 'error';

interface AppContextType {
  originalText: string;
  translatedText: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  apiKey: string;
  hotkey: string;
  theme: Theme;
  isProcessing: boolean;
  isCaptureProcessing: boolean;
  error: string | null;
  history: HistoryEntry[];
  setOriginalText: (text: string) => void;
  setSourceLanguage: (language: SupportedLanguage) => void;
  setTargetLanguage: (language: SupportedLanguage) => void;
  setApiKey: (key: string) => void;
  setHotkey: (hotkey: string) => void;
  setTheme: (theme: Theme) => void;
  processImage: (imageData: string) => Promise<void>;
  translateText: (text: string) => Promise<void>;
  clearError: () => void;
  clearHistory: () => void;
  restoreHistoryEntry: (entry: HistoryEntry) => void;
  selectedModel: string;
  availableModels: string[];
  setModel: (model: string) => void;
  appLanguage: AppLanguage;
  setAppLanguage: (language: AppLanguage) => void;
  updateStatus: UpdateStatus;
  updateVersion: string | null;
  updateProgress: number;
  handleDownloadUpdate: () => void;
  handleInstallUpdate: () => void;
  appVersion: string;
  whatsNewEntries: WhatsNewEntry[];
  dismissWhatsNew: () => void;
  updatePromptVersion: string | null;
  dismissUpdatePrompt: () => void;
  ignoreUpdateVersion: () => void;
  updatePreviewBullets: WhatsNewBullet[] | null;
  showAlternatives: boolean;
  showContext: boolean;
  alternatives: AlternativeGroup[] | null;
  contextData: ContextData | null;
  toggleAlternatives: () => void;
  toggleContext: () => void;
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
  isCaptureProcessing: false,
  error: null,
  history: [],
  setOriginalText: () => { },
  setSourceLanguage: () => { },
  setTargetLanguage: () => { },
  setApiKey: () => { },
  setHotkey: () => { },
  setTheme: () => { },
  processImage: async () => { },
  translateText: async () => { },
  clearError: () => { },
  clearHistory: () => { },
  restoreHistoryEntry: () => { },
  selectedModel: 'gemini-2.5-flash',
  availableModels: [],
  setModel: () => { },
  appLanguage: 'English',
  setAppLanguage: () => { },
  updateStatus: 'idle',
  updateVersion: null,
  updateProgress: 0,
  handleDownloadUpdate: () => { },
  handleInstallUpdate: () => { },
  appVersion: '1.0.0',
  whatsNewEntries: [],
  dismissWhatsNew: () => { },
  updatePromptVersion: null,
  dismissUpdatePrompt: () => { },
  ignoreUpdateVersion: () => { },
  updatePreviewBullets: null,
  showAlternatives: false,
  showContext: false,
  alternatives: null,
  contextData: null,
  toggleAlternatives: () => { },
  toggleContext: () => { },
};

export const AppContext = createContext<AppContextType>(defaultContext);

export const useAppContext = () => useContext(AppContext);

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }: AppProviderProps) => {
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState<SupportedLanguage>('Auto');
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguage>('English');
  const [apiKey, setApiKey] = useState('');
  const [hotkey, setHotkey] = useState('Ctrl+Alt+T');
  const [theme, setTheme] = useState<Theme>('system');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCaptureProcessing, setIsCaptureProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const historyLoadedRef = useRef(false);

  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [appLanguage, setAppLanguage] = useState<AppLanguage>('English');

  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [whatsNewEntries, setWhatsNewEntries] = useState<WhatsNewEntry[]>([]);

  // undefined = settings not loaded yet (suppresses the prompt until we know what's ignored)
  const [ignoredUpdateVersion, setIgnoredUpdateVersion] = useState<string | null | undefined>(undefined);
  const [updatePromptDismissed, setUpdatePromptDismissed] = useState<string | null>(null);
  const [updatePreviewBullets, setUpdatePreviewBullets] = useState<WhatsNewBullet[] | null>(null);

  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [alternatives, setAlternatives] = useState<AlternativeGroup[] | null>(null);
  const [contextData, setContextData] = useState<ContextData | null>(null);

  const { getSettings, saveSettings, showWindow, getPlatform, isElectronAvailable } = useElectronIpc();

  useEffect(() => {
    // Load settings and history from Electron store
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
            if (settings.model) setSelectedModel(settings.model);
            if (settings.appLanguage) setAppLanguage(settings.appLanguage as AppLanguage);
            setShowAlternatives(settings.showAlternatives ?? false);
            setShowContext(settings.showContext ?? false);
          }

          setIgnoredUpdateVersion(settings?.ignoredUpdateVersion ?? null);

          const savedHistory = await window.electron.history.get();
          setHistory(savedHistory || []);

          const version = await window.electron.app.getVersion();
          if (version) {
            setAppVersion(version);

            const lastSeen: string | null = settings?.lastSeenVersion ?? null;
            const isFreshInstall = !settings?.apiKey && (savedHistory ?? []).length === 0;
            if (lastSeen === null && isFreshInstall) {
              window.electron.settings.save({ lastSeenVersion: version }).catch(console.error);
            } else if (lastSeen === null || compareVersions(lastSeen, version) < 0) {
              const unseen = getUnseenEntries(lastSeen, version, WHATS_NEW);
              if (unseen.length > 0) {
                setWhatsNewEntries(unseen);
              } else {
                window.electron.settings.save({ lastSeenVersion: version }).catch(console.error);
              }
            }
          }

          historyLoadedRef.current = true;
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        setIgnoredUpdateVersion(null);
        historyLoadedRef.current = true;
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
            theme,
            model: selectedModel,
            appLanguage,
            showAlternatives,
            showContext,
          });
        }
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    };

    save();
  }, [apiKey, sourceLanguage, targetLanguage, hotkey, theme, selectedModel, appLanguage, showAlternatives, showContext, saveSettings, isElectronAvailable]);

  // Persist history whenever it changes (after initial load)
  useEffect(() => {
    if (!historyLoadedRef.current || !isElectronAvailable) return;
    window.electron.history.save(history).catch(console.error);
  }, [history, isElectronAvailable]);

  // Separate useEffect for GeminiService creation - only when apiKey changes
  useEffect(() => {
    if (apiKey) {
      console.log('Creating new GeminiService with API key');
      setGeminiService(new GeminiService(apiKey));
    } else {
      setGeminiService(null);
      setAvailableModels([]);
    }
  }, [apiKey]);

  // Fetch models when service is ready
  useEffect(() => {
    const fetchModels = async () => {
      if (geminiService && apiKey) {
        try {
          const models = await geminiService.listModels();
          setAvailableModels(models);

          // Check if selected model is available
          if (models.length > 0 && !models.includes(selectedModel)) {
            const newModel = models[0];
            // Use the custom alert window
            window.electron.alert.show(
              'Model Unavailable',
              `Model ${selectedModel} is not available. Switched to ${newModel}`
            );

            setSelectedModel(newModel);
          }
        } catch (e) {
          console.error('Failed to fetch models:', e);
        }
      }
    };

    fetchModels();
  }, [geminiService, apiKey, selectedModel]);

  useEffect(() => {
    if (!isElectronAvailable) return;

    const removeUpdateAvailable = window.electron.on('update-available', (info: { version: string; downloaded?: boolean; previewBullets?: WhatsNewBullet[] | null }) => {
      setUpdateVersion(info.version);
      setUpdateStatus(info.downloaded ? 'ready' : 'available');
      setUpdatePreviewBullets(info.previewBullets ?? null);
    });

    const removeUpdateProgress = window.electron.on('update-progress', (percent: number) => {
      setUpdateProgress(percent);
      setUpdateStatus('downloading');
    });

    const removeUpdateError = window.electron.on('update-error', () => {
      setUpdateStatus('error');
    });

    return () => {
      removeUpdateAvailable();
      removeUpdateProgress();
      removeUpdateError();
    };
  }, [isElectronAvailable]);

  const handleDownloadUpdate = useCallback(() => {
    window.electron.updater.download();
    setUpdateStatus('downloading');
  }, []);

  const handleInstallUpdate = useCallback(() => {
    window.electron.updater.install();
  }, []);

  const dismissWhatsNew = useCallback(() => {
    setWhatsNewEntries([]);
    window.electron.settings.save({ lastSeenVersion: appVersion }).catch(console.error);
  }, [appVersion]);

  const updatePromptVersion =
    updateStatus === 'available' &&
    updateVersion !== null &&
    ignoredUpdateVersion !== undefined &&
    updateVersion !== ignoredUpdateVersion &&
    updateVersion !== updatePromptDismissed
      ? updateVersion
      : null;

  const dismissUpdatePrompt = useCallback(() => {
    setUpdatePromptDismissed(updateVersion);
  }, [updateVersion]);

  const ignoreUpdateVersion = useCallback(() => {
    if (!updateVersion) return;
    setIgnoredUpdateVersion(updateVersion);
    window.electron.settings.save({ ignoredUpdateVersion: updateVersion }).catch(console.error);
  }, [updateVersion]);

  const appendHistory = useCallback((entry: HistoryEntry) => {
    setHistory((prev: HistoryEntry[]) => [entry, ...prev].slice(0, 30));
  }, []);

  const toggleAlternatives = useCallback(() => {
    setShowAlternatives(prev => !prev);
  }, []);

  const toggleContext = useCallback(() => {
    setShowContext(prev => !prev);
  }, []);

  const processImage = useCallback(async (imageData: string) => {
    console.log('processImage called with imageData length:', imageData.length);

    if (!geminiService) {
      console.error('No geminiService available');
      setError(getLocale(appLanguage).apiKeyNotSet);
      return;
    }

    // Show and focus the main window when translation starts
    await showWindow();

    setIsProcessing(true);
    setIsCaptureProcessing(true);
    setError(null);
    setOriginalText('');
    setTranslatedText('');
    setAlternatives(null);
    setContextData(null);
    console.log('Starting image processing...');

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
      console.log('Text set successfully');
    } catch (error) {
      console.error('Error processing image:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsProcessing(false);
      setIsCaptureProcessing(false);
      console.log('Image processing completed');
    }
  }, [geminiService, sourceLanguage, targetLanguage, selectedModel, showAlternatives, showContext, showWindow, appendHistory, appLanguage]);

  const translateText = useCallback(async (text: string) => {
    if (!geminiService) {
      setError(getLocale(appLanguage).apiKeyNotSet);
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
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  }, [geminiService, sourceLanguage, targetLanguage, showWindow, selectedModel, showAlternatives, showContext, appendHistory, appLanguage]);

  const clearError = () => {
    setError(null);
  };

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const restoreHistoryEntry = useCallback((entry: HistoryEntry) => {
    setOriginalText(entry.originalText);
    setTranslatedText(entry.translatedText);
    setSourceLanguage(entry.sourceLanguage);
    setTargetLanguage(entry.targetLanguage);
    setAlternatives(entry.alternatives ?? null);
    setContextData(entry.context ?? null);
  }, []);

  const value: AppContextType = {
    originalText,
    translatedText,
    sourceLanguage,
    targetLanguage,
    apiKey,
    hotkey,
    theme,
    isProcessing,
    isCaptureProcessing,
    error,
    history,
    setOriginalText,
    setSourceLanguage,
    setTargetLanguage,
    setApiKey,
    setHotkey,
    setTheme,
    processImage,
    translateText,
    clearError,
    clearHistory,
    restoreHistoryEntry,
    selectedModel,
    availableModels,
    setModel: setSelectedModel,
    appLanguage,
    setAppLanguage,
    updateStatus,
    updateVersion,
    updateProgress,
    handleDownloadUpdate,
    handleInstallUpdate,
    appVersion,
    whatsNewEntries,
    dismissWhatsNew,
    updatePromptVersion,
    dismissUpdatePrompt,
    ignoreUpdateVersion,
    updatePreviewBullets,
    showAlternatives,
    showContext,
    alternatives,
    contextData,
    toggleAlternatives,
    toggleContext,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
