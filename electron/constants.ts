export const WINDOW_CONFIG = {
    WIDTH: 800,
    HEIGHT: 600,
    MIN_WIDTH: 400,
    MIN_HEIGHT: 600,
    ICON_PATH: '../../assets/icons/icon.png',
    INDEX_HTML_PATH: '../index.html',
    CAPTURE_HTML_PATH: '../capture.html',
    PRELOAD_PATH: 'preload.js',
} as const;

export const TRAY_ICONS = {
    MACOS: '../../assets/icons/icon-mac.png',
    WINDOWS: '../../assets/icons/icon.png',
    LINUX: '../../assets/icons/icon.png',
} as const;

// PostHog Project API Key is a write-only client token (safe to embed — see
// https://posthog.com/docs — it cannot read data back), not a secret.
// Replace PROJECT_API_KEY with your real key from your PostHog project settings
// before packaging a release build.
export const ANALYTICS_CONFIG = {
    PROJECT_API_KEY: 'REPLACE_WITH_YOUR_POSTHOG_PROJECT_API_KEY',
    HOST: 'https://eu.i.posthog.com',
} as const;

export const IPC_CHANNELS = {
    START_CAPTURE: 'start-screen-capture',
    GET_SETTINGS: 'get-settings',
    SAVE_SETTINGS: 'save-settings',
    CLIPBOARD_WRITE: 'clipboard-write-text',
    GET_SCREENS: 'get-screens',
    GET_SOURCES: 'get-sources',
    CAPTURE_COMPLETED: 'capture-completed',
    LOG_MESSAGE: 'log-message',
    GET_PLATFORM: 'get-platform',
    SHOW_WINDOW: 'show-window',
    IMAGE_CAPTURED: 'image-captured',
    CAPTURE_ERROR: 'capture-error',
    SHOW_ALERT: 'show-alert',
    CLOSE_WINDOW: 'close-window',
    RESIZE_WINDOW: 'resize-window',
    PERMISSION_ERROR: 'permission-error',
    OPEN_EXTERNAL: 'open-external',
    GET_HISTORY: 'get-history',
    SAVE_HISTORY: 'save-history',
    CHECK_FOR_UPDATES: 'check-for-updates',
    DOWNLOAD_UPDATE: 'download-update',
    INSTALL_UPDATE: 'install-update',
    UPDATE_AVAILABLE: 'update-available',
    UPDATE_PROGRESS: 'update-progress',
    UPDATE_ERROR: 'update-error',
    GET_VERSION: 'get-version',
    ACCESSIBILITY_ERROR: 'accessibility-error',
    SCREENSHOT_READY: 'screenshot-ready',
    CAPTURE_RESET: 'capture-reset',
    TRACK_TRANSLATION_COMPLETED: 'track-translation-completed',
} as const;
