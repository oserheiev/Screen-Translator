import Store from 'electron-store';

// Define supported languages
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

// Define theme type
export type Theme = 'light' | 'dark' | 'system';

// Define app UI language type (all supported languages except 'Auto')
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

// Define the settings interface
export interface Settings {
  apiKey: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  hotkey: string;
  theme: Theme;
  model: string;
  appLanguage?: AppLanguage;
  history?: any[];
  showAlternatives?: boolean;
  showContext?: boolean;
}

// Create a type for the store with proper methods
export type SettingsStore = {
  get: <K extends keyof Settings>(key: K) => Settings[K];
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
} & Store<Settings>;