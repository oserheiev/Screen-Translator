import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { TranslationResult, AlternativeGroup, ContextData } from '../types';
import { CONFIG } from '../config';

export interface TranslationExtras {
  alternatives?: AlternativeGroup[];
  context?: ContextData;
}

export interface ExtrasOptions {
  showAlternatives: boolean;
  showContext: boolean;
}

export class GeminiService {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await this.ai.models.list();
      const models: string[] = [];

      // @ts-ignore - The SDK types might be slightly mismatched or require specific iteration
      for await (const model of response) {
        const m = model as any;
        if (m.name && m.supportedActions?.includes('generateContent')) {
          models.push(m.name.replace('models/', ''));
        }
      }
      return models;
    } catch (error) {
      console.error('GeminiService.listModels error:', error);
      throw this.handleError(error);
    }
  }

  async processImage(
    imageData: string,
    sourceLanguage: string,
    targetLanguage: string,
    modelName: string,
    extras?: ExtrasOptions
  ): Promise<TranslationResult & TranslationExtras> {
    try {
      const base64Image = this.extractBase64Image(imageData);
      const prompt = this.createImagePrompt(sourceLanguage, targetLanguage, extras);

      const responseText = await this.executeWithRetry(async () => {
        const result = await this.ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: base64Image
                  }
                }
              ]
            }
          ]
        });
        return this.extractTextFromResponse(result);
      });

      return this.parseImageResponse(responseText, extras);
    } catch (error) {
      console.error('GeminiService.processImage error:', error);
      throw this.handleError(error);
    }
  }

  async translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    modelName: string,
    extras?: ExtrasOptions
  ): Promise<string & { extras?: TranslationExtras }> {
    try {
      const needsExtras = extras && (extras.showAlternatives || extras.showContext);
      const prompt = needsExtras
        ? this.createTranslationPromptWithExtras(text, sourceLanguage, targetLanguage, extras!)
        : this.createTranslationPrompt(text, sourceLanguage, targetLanguage);

      const responseText = await this.executeWithRetry(async () => {
        const result = await this.ai.models.generateContent({
          model: modelName,
          contents: needsExtras
            ? [{ role: 'user', parts: [{ text: prompt }] }]
            : prompt
        });
        return this.extractTextFromResponse(result);
      });

      if (needsExtras) {
        return this.parseTranslationWithExtras(responseText, extras!);
      }

      return responseText as string & { extras?: TranslationExtras };
    } catch (error) {
      console.error('GeminiService.translateText error:', error);
      throw this.handleError(error);
    }
  }

  private extractBase64Image(imageData: string): string {
    const base64Image = imageData.split(',')[1];
    if (!base64Image) {
      throw new Error('Invalid image data format');
    }
    return base64Image;
  }

  private createImagePrompt(sourceLanguage: string, targetLanguage: string, extras?: ExtrasOptions): string {
    const sourceLangText = sourceLanguage === 'Auto' ? 'any language' : sourceLanguage;
    let prompt = `Extract text from this image (source language: ${sourceLangText}) and translate it to ${targetLanguage}. ` +
      'Return output in strict JSON format: {"originalText": "detected original text", "translatedText": "translated text"';

    if (extras?.showAlternatives) {
      prompt += ', "alternatives": [{"category": "<POS e.g. Nouns/Verbs/Adjectives/Idioms>", "items": [{"word": "<alternative>", "backTranslations": ["<back-translation>"]}]}]';
    }
    if (extras?.showContext) {
      prompt += ', "context": {"explanation": "<2-3 sentences on when/how this is used>", "tags": [{"label": "<situation>", "applicable": true}]}';
    }

    prompt += '}. ';

    if (extras?.showAlternatives) {
      prompt += 'For "alternatives": group by part of speech (Nouns, Verbs, Adjectives, Idioms etc.), include only relevant categories, dictionary style with back-translations. ';
    }
    if (extras?.showContext) {
      prompt += 'For "context": explain in 2-3 sentences when/how this word or phrase is used, then provide tags covering formality, register, and common situations (set applicable: true/false). ';
    }

    prompt += 'Use Markdown formatting for the text content to preserve structure (lists, indentation, paragraphs). ' +
      'Do not include markdown formatting for the JSON itself (like ```json).';

    return prompt;
  }

  private createTranslationPrompt(text: string, sourceLanguage: string, targetLanguage: string): string {
    const sourceLangText = sourceLanguage === 'Auto' ? 'detected language' : sourceLanguage;
    return `Translate the following text "${text}" from ${sourceLangText} to ${targetLanguage}. ` +
      'Return only the translated text string. Use Markdown to preserve any existing structure (lists, indentation).';
  }

  private createTranslationPromptWithExtras(text: string, sourceLanguage: string, targetLanguage: string, extras: ExtrasOptions): string {
    const sourceLangText = sourceLanguage === 'Auto' ? 'detected language' : sourceLanguage;
    let prompt = `Translate the following text "${text}" from ${sourceLangText} to ${targetLanguage}. ` +
      'Return output in strict JSON format: {"translatedText": "translated text"';

    if (extras.showAlternatives) {
      prompt += ', "alternatives": [{"category": "<POS e.g. Nouns/Verbs/Adjectives/Idioms>", "items": [{"word": "<alternative>", "backTranslations": ["<back-translation>"]}]}]';
    }
    if (extras.showContext) {
      prompt += ', "context": {"explanation": "<2-3 sentences on when/how this is used>", "tags": [{"label": "<situation>", "applicable": true}]}';
    }

    prompt += '}. ';

    if (extras.showAlternatives) {
      prompt += 'For "alternatives": group by part of speech (Nouns, Verbs, Adjectives, Idioms etc.), include only relevant categories, dictionary style with back-translations. ';
    }
    if (extras.showContext) {
      prompt += 'For "context": explain in 2-3 sentences when/how this word or phrase is used, then provide tags covering formality, register, and common situations (set applicable: true/false). ';
    }

    prompt += 'Do not include markdown formatting for the JSON itself (like ```json).';
    return prompt;
  }

  private parseImageResponse(text: string, extras?: ExtrasOptions): TranslationResult & TranslationExtras {
    const parsed = this.parseJSONResponse<any>(text);
    const result: TranslationResult & TranslationExtras = {
      originalText: parsed.originalText ?? '',
      translatedText: parsed.translatedText ?? '',
    };
    if (extras?.showAlternatives && Array.isArray(parsed.alternatives)) {
      result.alternatives = parsed.alternatives;
    }
    if (extras?.showContext && parsed.context) {
      result.context = parsed.context;
    }
    return result;
  }

  private parseTranslationWithExtras(text: string, extras: ExtrasOptions): string & { extras?: TranslationExtras } {
    try {
      const parsed = this.parseJSONResponse<any>(text);
      const translatedText: string & { extras?: TranslationExtras } = parsed.translatedText ?? text;
      const translationExtras: TranslationExtras = {};
      if (extras.showAlternatives && Array.isArray(parsed.alternatives)) {
        translationExtras.alternatives = parsed.alternatives;
      }
      if (extras.showContext && parsed.context) {
        translationExtras.context = parsed.context;
      }
      (translatedText as any).extras = translationExtras;
      return translatedText;
    } catch {
      // If parsing fails, return raw text with no extras
      return text as string & { extras?: TranslationExtras };
    }
  }

  private extractTextFromResponse(result: GenerateContentResponse): string {
    const text = result.text;
    if (!text) {
      throw new Error('No response text received from Gemini API');
    }
    return text;
  }

  private parseJSONResponse<T>(text: string): T {
    try {
      // Clean potential markdown code blocks
      const cleanedText = text.replace(/```json\n?|```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      throw new Error('Failed to parse (JSON) response from Gemini API');
    }
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;
    for (let attempt = 1; attempt <= CONFIG.GEMINI.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        if (!this.isRetryable(error) || attempt === CONFIG.GEMINI.MAX_RETRIES) {
          throw error;
        }

        const delay = CONFIG.GEMINI.BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.warn(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }

  private isRetryable(error: any): boolean {
    const msg = error?.message || '';
    return msg.includes('429') || msg.includes('503') || msg.includes('500');
  }

  private handleError(error: any): Error {
    const msg = error?.message || '';
    if (msg.includes('429')) return new Error('Rate limit exceeded. Please try again later.');
    if (msg.includes('403')) return new Error('Invalid API key or permissions.');
    if (msg.includes('404')) return new Error('Gemini API not found.');

    return error instanceof Error ? error : new Error(String(error));
  }
}

export default GeminiService;
