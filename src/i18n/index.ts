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
  updateFailed: string;

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
  modelRecommended: string;
  appLanguageLabel: string;
  themeLabel: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  alwaysOnTopLabel: string;
  launchAtStartupLabel: string;
  startMinimizedToTrayLabel: string;
  startMinimizedToTrayHelp: string;
  settingsTabGeneral: string;
  settingsTabAppearance: string;
  settingsTabStartup: string;
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
  deleteHistoryEntry: string;

  // TextDisplay
  sourceText: string;
  paste: string;
  copy: string;
  clearText: string;
  typePlaceholder: string;
  pasteFailed: string;

  // Capture failures
  captureStartFailed: string;

  // TranslationDisplay
  translation: string;
  altToggleLabel: string;
  contextToggleLabel: string;
  alternatives: string;
  contextOfUse: string;

  // TextDisplay / TranslationDisplay — panel expand/collapse
  expandPanelTooltip: string;
  restoreSplitViewTooltip: string;

  // AppContext errors
  apiKeyNotSet: string;

  // WhatsNewModal
  whatsNewTitle: string;
  whatsNewClose: string;

  // UpdateAvailableModal
  updateAvailableTitle: string;
  updateAvailableMessage: string;
  updateNow: string;
  ignoreRelease: string;

  // DualLanguageSelector
  languageNames: Record<SupportedLanguage, string>;

  // Capture overlay window (standalone, non-React renderer)
  capture: {
    instruction: string;
    processing: string;
    initializing: string;
    close: string;
  };

  // AlertWindow (standalone popup window)
  notification: string;
  ok: string;

  // SettingsContext — model-unavailable alert
  modelUnavailableTitle: string;
  modelUnavailableMessage: string;

  // WelcomeModal / analytics consent
  welcomeAnalyticsTitle: string;
  welcomeAnalyticsIntro: string;
  analyticsUpdateTitle: string;
  analyticsUpdateIntro: string;
  legalDocsUpdatedTitle: string;
  legalDocsUpdatedIntro: string;
  analyticsConsentLabel: string;
  analyticsConsentDescription: string;
  privacyPolicyLink: string;
  termsOfUseLink: string;
  welcomeModalContinue: string;
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
