export const WINDOW_CONFIG = {
    WIDTH: 800,
    HEIGHT: 600,
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
    CAPTURE_READY: 'capture-ready',
    SHOW_ALERT: 'show-alert',
    CLOSE_WINDOW: 'close-window',
    RESIZE_WINDOW: 'resize-window',
    PERMISSION_ERROR: 'permission-error',
    OPEN_EXTERNAL: 'open-external',
} as const;
