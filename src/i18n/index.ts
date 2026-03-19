import { AppLanguage, SupportedLanguage } from '../types';

export interface LocaleStrings {
  // App header / toolbar
  historyTooltip: string;
  settingsTooltip: string;
  translateButton: string;
  translatingButton: string;
  captureTooltip: string;
  restartButton: string;
  downloadingUpdate: string;

  // Tray context menu
  trayCapture: string;
  trayOpen: string;
  trayQuit: string;

  // SettingsModal
  welcome: string;
  welcomeSubtitle: string;
  settings: string;
  apiKeyRequired: string;
  geminiApiKey: string;
  apiKeyPlaceholder: string;
  getApiKeyLink: string;
  globalHotkey: string;
  hotkeyPlaceholder: string;
  hotkeyHelp: string;
  model: string;
  loadingModel: string;
  appLanguageLabel: string;
  cancel: string;
  save: string;
  getStarted: string;

  // PermissionModal — screen recording
  permissionTitle: string;
  permissionDescription: string;
  permissionMacStep1: string;
  permissionMacStep2: string;
  permissionMacStep3: string;
  permissionMacStep4: string;
  permissionWinStep1: string;
  permissionWinStep2: string;
  permissionWinStep3: string;
  permissionGeneric: string;
  close: string;
  openSettings: string;

  // PermissionModal — accessibility (macOS hotkey)
  accessibilityPermissionTitle: string;
  accessibilityPermissionDescription: string;
  accessibilityPermissionStep1: string;
  accessibilityPermissionStep2: string;
  accessibilityPermissionStep3: string;
  accessibilityWarningTooltip: string;

  // HistoryPanel
  recentHistory: string;
  noHistory: string;
  clearHistory: string;
  today: string;
  yesterday: string;

  // TextDisplay
  sourceText: string;
  paste: string;
  typePlaceholder: string;

  // TranslationDisplay
  translation: string;
  altToggleLabel: string;
  contextToggleLabel: string;
  alternatives: string;
  contextOfUse: string;

  // AppContext errors
  apiKeyNotSet: string;

  // DualLanguageSelector
  languageNames: Record<SupportedLanguage, string>;
}

import en from './locales/en';
import ru from './locales/ru';
import uk from './locales/uk';
import es from './locales/es';
import fr from './locales/fr';
import de from './locales/de';
import it from './locales/it';
import pt from './locales/pt';
import zh from './locales/zh';
import ja from './locales/ja';
import ko from './locales/ko';
import pl from './locales/pl';

const localeMap: Record<AppLanguage, LocaleStrings> = {
  English: en,
  Russian: ru,
  Ukrainian: uk,
  Spanish: es,
  French: fr,
  German: de,
  Italian: it,
  Portuguese: pt,
  'Chinese (Simplified)': zh,
  Japanese: ja,
  Korean: ko,
  Polish: pl,
};

export const APP_LANGUAGES = Object.keys(localeMap) as AppLanguage[];

export const NATIVE_LANGUAGE_NAMES: Record<AppLanguage, string> = {
  'English': '🇬🇧 English',
  'Russian': '🇷🇺 Русский',
  'Ukrainian': '🇺🇦 Українська',
  'Spanish': '🇪🇸 Español',
  'French': '🇫🇷 Français',
  'German': '🇩🇪 Deutsch',
  'Italian': '🇮🇹 Italiano',
  'Portuguese': '🇵🇹 Português',
  'Chinese (Simplified)': '🇨🇳 中文（简体）',
  'Japanese': '🇯🇵 日本語',
  'Korean': '🇰🇷 한국어',
  'Polish': '🇵🇱 Polski',
};

export function getLocale(lang: AppLanguage): LocaleStrings {
  return localeMap[lang] ?? en;
}
