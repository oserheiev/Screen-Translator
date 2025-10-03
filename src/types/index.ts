export type Theme = 'light' | 'dark' | 'system';

export interface ElectronAPI {
  settings: {
    get: () => Promise<{
      apiKey: string;
      targetLanguage: SupportedLanguage;
      hotkey: string;
      theme: Theme;
    }>;
    save: (settings: {
      apiKey?: string;
      targetLanguage?: SupportedLanguage;
      hotkey?: string;
      theme?: Theme;
    }) => Promise<boolean>;
  };
  capture: {
    start: () => Promise<boolean>;
    getScreens: () => Promise<Electron.Display[]>;
    getSources: () => Promise<Electron.DesktopCapturerSource[]>;
    complete: (imageData: string) => Promise<void>;
    log: (message: string, ...args: any[]) => Promise<void>;
  };
  clipboard: {
    writeText: (text: string) => Promise<void>;
  };
  platform: {
    getPlatform: () => Promise<string>;
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
  | 'Korean';

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}