export interface ElectronAPI {
    settings: {
        get: () => Promise<{
            apiKey: string;
            targetLanguage: string;
            hotkey: string;
        }>;
        save: (settings: {
            apiKey?: string;
            targetLanguage?: string;
            hotkey?: string;
        }) => Promise<boolean>;
    };
    capture: {
        getScreens: () => Promise<Electron.Display[]>;
        complete: (imageData: string) => Promise<void>;
    };
    clipboard: {
        writeText: (text: string) => Promise<void>;
    };
    on: (channel: string, callback: (...args: any[]) => void) => () => void;
}
export interface TranslationResult {
    originalText: string;
    translatedText: string;
}
export type SupportedLanguage = 'English' | 'Russian' | 'Ukrainian' | 'Spanish' | 'French' | 'German' | 'Italian' | 'Portuguese' | 'Chinese (Simplified)' | 'Japanese' | 'Korean';
declare global {
    interface Window {
        electron: ElectronAPI;
    }
}
//# sourceMappingURL=index.d.ts.map