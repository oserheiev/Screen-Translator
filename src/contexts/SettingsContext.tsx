import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import GeminiService from '../services/gemini.service';
import { SupportedLanguage, Theme, AppLanguage } from '../types';
import { useElectronIpc } from '../hooks/useElectronIpc';
import { getLocale } from '../i18n';

interface SettingsContextType {
  settingsLoaded: boolean;
  apiKey: string;
  hotkey: string;
  theme: Theme;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  selectedModel: string;
  availableModels: string[];
  appLanguage: AppLanguage;
  showAlternatives: boolean;
  showContext: boolean;
  alwaysOnTop: boolean;
  launchAtStartup: boolean;
  startMinimizedToTray: boolean;
  geminiService: GeminiService | null;
  setApiKey: (key: string) => void;
  setHotkey: (hotkey: string) => void;
  setTheme: (theme: Theme) => void;
  setSourceLanguage: (language: SupportedLanguage) => void;
  setTargetLanguage: (language: SupportedLanguage) => void;
  setModel: (model: string) => void;
  setAppLanguage: (language: AppLanguage) => void;
  toggleAlternatives: () => void;
  toggleContext: () => void;
  setAlwaysOnTop: (value: boolean) => void;
  setLaunchAtStartup: (value: boolean) => void;
  setStartMinimizedToTray: (value: boolean) => void;
}

const defaultContext: SettingsContextType = {
  settingsLoaded: true,
  apiKey: '',
  hotkey: 'Ctrl+Alt+T',
  theme: 'system',
  sourceLanguage: 'Auto',
  targetLanguage: 'English',
  selectedModel: 'gemini-2.5-flash',
  availableModels: [],
  appLanguage: 'English',
  showAlternatives: false,
  showContext: false,
  alwaysOnTop: false,
  launchAtStartup: false,
  startMinimizedToTray: false,
  geminiService: null,
  setApiKey: () => {},
  setHotkey: () => {},
  setTheme: () => {},
  setSourceLanguage: () => {},
  setTargetLanguage: () => {},
  setModel: () => {},
  setAppLanguage: () => {},
  toggleAlternatives: () => {},
  toggleContext: () => {},
  setAlwaysOnTop: () => {},
  setLaunchAtStartup: () => {},
  setStartMinimizedToTray: () => {},
};

const SettingsContext = createContext<SettingsContextType>(defaultContext);

export const useSettingsContext = () => useContext(SettingsContext);

interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [hotkey, setHotkey] = useState('Ctrl+Alt+T');
  const [theme, setTheme] = useState<Theme>('system');
  const [sourceLanguage, setSourceLanguage] = useState<SupportedLanguage>('Auto');
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguage>('English');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [appLanguage, setAppLanguage] = useState<AppLanguage>('English');
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const [launchAtStartup, setLaunchAtStartup] = useState(false);
  const [startMinimizedToTray, setStartMinimizedToTray] = useState(false);
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);

  const { getSettings, saveSettings, getPlatform, isElectronAvailable } = useElectronIpc();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (!isElectronAvailable) return;

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
          setAlwaysOnTop(settings.alwaysOnTop ?? false);
          setLaunchAtStartup(settings.launchAtStartup ?? false);
          setStartMinimizedToTray(settings.startMinimizedToTray ?? false);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setSettingsLoaded(true);
      }
    };

    loadSettings();
  }, [getSettings, getPlatform, isElectronAvailable]);

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
            alwaysOnTop,
            launchAtStartup,
            startMinimizedToTray,
          });
        }
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    };

    save();
  }, [apiKey, sourceLanguage, targetLanguage, hotkey, theme, selectedModel, appLanguage, showAlternatives, showContext, alwaysOnTop, launchAtStartup, startMinimizedToTray, saveSettings, isElectronAvailable]);

  useEffect(() => {
    if (apiKey) {
      setGeminiService(new GeminiService(apiKey));
    } else {
      setGeminiService(null);
      setAvailableModels([]);
    }
  }, [apiKey]);

  const appLanguageRef = useRef(appLanguage);
  useEffect(() => {
    appLanguageRef.current = appLanguage;
  }, [appLanguage]);

  useEffect(() => {
    const fetchModels = async () => {
      if (geminiService && apiKey) {
        try {
          const models = await geminiService.listModels();
          setAvailableModels(models);

          if (models.length > 0 && !models.includes(selectedModel)) {
            const newModel = models[0];
            const t = getLocale(appLanguageRef.current);
            window.electron.alert.show(
              t.modelUnavailableTitle,
              t.modelUnavailableMessage.replace('{oldModel}', selectedModel).replace('{newModel}', newModel)
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

  const toggleAlternatives = useCallback(() => {
    setShowAlternatives(prev => !prev);
  }, []);

  const toggleContext = useCallback(() => {
    setShowContext(prev => !prev);
  }, []);

  const value: SettingsContextType = {
    settingsLoaded,
    apiKey,
    hotkey,
    theme,
    sourceLanguage,
    targetLanguage,
    selectedModel,
    availableModels,
    appLanguage,
    showAlternatives,
    showContext,
    alwaysOnTop,
    launchAtStartup,
    startMinimizedToTray,
    geminiService,
    setApiKey,
    setHotkey,
    setTheme,
    setSourceLanguage,
    setTargetLanguage,
    setModel: setSelectedModel,
    setAppLanguage,
    toggleAlternatives,
    toggleContext,
    setAlwaysOnTop,
    setLaunchAtStartup,
    setStartMinimizedToTray,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
