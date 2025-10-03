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