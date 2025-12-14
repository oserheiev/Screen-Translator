export const CONFIG = {
    GEMINI: {
        MODEL_NAME: 'gemini-2.5-flash',
        MAX_RETRIES: 3,
        BASE_DELAY_MS: 2000,
    },
    DEFAULTS: {
        SOURCE_LANGUAGE: 'Auto',
        TARGET_LANGUAGE: 'English',
        THEME: 'system',
        // Platform specific defaults will be handled in main process
        HOTKEY: 'Ctrl+Alt+T',
    }
} as const;
