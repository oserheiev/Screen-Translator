export type Theme = 'light' | 'dark' | 'system';

export type AppLanguage =
  | 'English'
  | 'Russian'
  | 'Ukrainian'
  | 'Spanish'
  | 'French'
  | 'German'
  | 'Italian'
  | 'Portuguese'
  | 'Chinese (Simplified)'
  | 'Japanese'
  | 'Korean'
  | 'Polish';

export interface Alternative {
  word: string;
  backTranslations: string[];
}

export interface AlternativeGroup {
  category: string;
  items: Alternative[];
}

export interface ContextData {
  explanation: string;
  tags: { label: string; applicable: boolean }[];
}

export interface HistoryEntry {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  timestamp: number;
  alternatives?: AlternativeGroup[];
  context?: ContextData;
}

export interface ElectronAPI {
  settings: {
    get: () => Promise<{
      apiKey: string;
      sourceLanguage: SupportedLanguage;
      targetLanguage: SupportedLanguage;
      hotkey: string;
      theme: Theme;
      model: string;
      appLanguage: AppLanguage;
    }>;
    save: (settings: {
      apiKey?: string;
      sourceLanguage?: SupportedLanguage;
      targetLanguage?: SupportedLanguage;
      hotkey?: string;
      theme?: Theme;
      model?: string;
      appLanguage?: AppLanguage;
      showAlternatives?: boolean;
      showContext?: boolean;
    }) => Promise<boolean>;
  };
  history: {
    get: () => Promise<HistoryEntry[]>;
    save: (history: HistoryEntry[]) => Promise<void>;
  };
  capture: {
    start: () => Promise<boolean>;
    getScreens: () => Promise<Electron.Display[]>;
    getSources: () => Promise<Electron.DesktopCapturerSource[]>;
    complete: (imageData: string) => Promise<void>;
    log: (message: string, ...args: any[]) => Promise<void>;
    ready: () => Promise<void>;
  };
  alert: {
    show: (title: string, message: string) => Promise<void>;
    close: () => Promise<void>;
    resize: (width: number, height: number) => Promise<void>;
  };
  clipboard: {
    writeText: (text: string) => Promise<void>;
  };
  platform: {
    getPlatform: () => Promise<string>;
  };
  window: {
    show: () => Promise<void>;
  };
  shell: {
    openExternal: (url: string) => Promise<void>;
  };
  updater: {
    check: () => Promise<void>;
    download: () => Promise<void>;
    install: () => Promise<void>;
  };
  app: {
    getVersion: () => Promise<string>;
  };
  on: (
    channel: string,
    callback: (...args: any[]) => void
  ) => () => void;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
}

export type SupportedLanguage =
  | 'Auto'
  | 'English'
  | 'Russian'
  | 'Ukrainian'
  | 'Spanish'
  | 'French'
  | 'German'
  | 'Italian'
  | 'Portuguese'
  | 'Chinese (Simplified)'
  | 'Japanese'
  | 'Korean'
  | 'Polish';

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}