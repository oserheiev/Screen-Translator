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
  appLanguage?: string;
}

// Model families known to accept image input via generateContent, for this app's
// image-to-text OCR+translate flow. This is an allowlist, not a denylist: the Gemini API's
// ListModels response has no field indicating input modality, so a family that isn't
// recognized here is excluded by default rather than guessed at. That trades convenience
// (a newly released model family needs a pattern added below before it appears in Settings)
// for auditability (nothing unverified silently shows up).
const MULTIMODAL_MODEL_FAMILY_PATTERNS: RegExp[] = [
  // Versioned Gemini flash/pro tiers, e.g. gemini-2.5-flash, gemini-2.5-flash-lite,
  // gemini-2.0-pro — including dated/preview suffixes. Deliberately excludes the older,
  // text-only "gemini-pro" (Gemini 1.0 Pro; image support was a separate "-vision" model).
  /^gemini-\d+(?:\.\d+)?-(?:flash|pro)(?:-|$)/,
  // Unversioned "latest" aliases, e.g. gemini-flash-latest, gemini-pro-latest.
  /^gemini-(?:flash|pro|flash-lite)-latest$/,
  // Gemma 3 multimodal sizes — the 1B size is text-only and intentionally omitted.
  /^gemma-3-(?:4b|12b|27b)-it$/,
  // Gemma 3n multimodal sizes.
  /^gemma-3n-e(?:2b|4b)-it$/,
];

// Suffixes that opt a model out even within an otherwise-allowed family above — these
// variants exist for e.g. flash/pro but don't accept image input the way generateContent
// needs (audio-only I/O, or a different tool-use format entirely).
const NON_MULTIMODAL_SUFFIX_PATTERNS: RegExp[] = [
  /-tts(?:-|$)/i,
  /-live(?:-|$)/i,
  /-native-audio(?:-|$)/i,
  /-image-generation(?:-|$)/i,
];

// "-latest" aliases (e.g. "gemini-flash-latest") always point at whatever is currently the
// newest stable release of their tier, so they're recommended alongside the app's configured
// default model. Exported so Settings UI can reuse the same definition for the "Recommended" tag.
export const isLatestAliasModel = (modelName: string): boolean => /-latest$/.test(modelName);

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
          const modelName = m.name.replace('models/', '');
          if (this.isMultimodalModel(modelName)) {
            models.push(modelName);
          }
        }
      }
      return this.sortModelsByRecency(models);
    } catch (error) {
      console.error('GeminiService.listModels error:', error);
      throw this.handleError(error);
    }
  }

  private isMultimodalModel(modelName: string): boolean {
    const inAllowedFamily = MULTIMODAL_MODEL_FAMILY_PATTERNS.some(pattern => pattern.test(modelName));
    if (!inAllowedFamily) return false;
    return !NON_MULTIMODAL_SUFFIX_PATTERNS.some(pattern => pattern.test(modelName));
  }

  // "-latest" aliases (e.g. "gemini-flash-latest") always point at the newest stable release
  // of their tier, so they sort first. Versioned Gemini models (e.g. "gemini-2.5-flash") come
  // next, by version descending then naturally by name. Everything else — other families like
  // Gemma — sorts naturally after all of the above.
  private sortModelsByRecency(modelNames: string[]): string[] {
    const latestAliases: string[] = [];
    const versioned: { name: string; version: number }[] = [];
    const other: string[] = [];

    for (const name of modelNames) {
      if (isLatestAliasModel(name)) {
        latestAliases.push(name);
        continue;
      }
      const match = name.match(/^gemini-(\d+(?:\.\d+)?)-/);
      if (match) {
        versioned.push({ name, version: parseFloat(match[1]) });
      } else {
        other.push(name);
      }
    }

    latestAliases.sort((a, b) => a.localeCompare(b));
    versioned.sort((a, b) => b.version - a.version || a.name.localeCompare(b.name));
    other.sort((a, b) => a.localeCompare(b));

    return [...latestAliases, ...versioned.map(v => v.name), ...other];
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
  ): Promise<{ translatedText: string } & TranslationExtras> {
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

      return { translatedText: responseText };
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

  private buildExtrasSchema(extras?: ExtrasOptions): string {
    let schema = '';
    if (extras?.showAlternatives) {
      schema += ', "alternatives": [{"category": "<POS e.g. Nouns/Verbs/Adjectives/Idioms>", "items": [{"word": "<alternative translation>", "backTranslations": ["<back-translation>"]}]}]';
    }
    if (extras?.showContext) {
      schema += ', "context": {"explanation": "<2-3 sentences on when/how this is used>", "tags": [{"label": "<situation>", "applicable": true}]}';
    }
    return schema;
  }

  private buildExtrasInstructions(sourceLangText: string, extras?: ExtrasOptions): string {
    let instructions = '';
    if (extras?.showAlternatives) {
      instructions += `For "alternatives": group by part of speech (Nouns, Verbs, Adjectives, Idioms etc.), include only relevant categories, dictionary style with back-translations. Back-translations must be written in the source language (${sourceLangText}). `;
    }
    if (extras?.showContext) {
      const lang = extras.appLanguage ?? 'English';
      instructions += `For "context": explain in 2-3 sentences when/how this word or phrase is used, then provide tags covering formality, register, and common situations (set applicable: true/false). Write the explanation and tag labels in ${lang}. `;
    }
    return instructions;
  }

  private extractExtras(parsed: any, extras?: ExtrasOptions): TranslationExtras {
    const result: TranslationExtras = {};
    if (extras?.showAlternatives && Array.isArray(parsed.alternatives)) {
      result.alternatives = parsed.alternatives;
    }
    if (extras?.showContext && parsed.context) {
      result.context = parsed.context;
    }
    return result;
  }

  private createImagePrompt(sourceLanguage: string, targetLanguage: string, extras?: ExtrasOptions): string {
    const sourceLangText = sourceLanguage === 'Auto' ? 'any language' : sourceLanguage;
    return `Extract text from this image (source language: ${sourceLangText}) and translate it to ${targetLanguage}. ` +
      `Translate the meaning of words accurately — do not transliterate or phonetically transcribe. ` +
      'Return output in strict JSON format: {"originalText": "detected original text", "translatedText": "translated text"' +
      this.buildExtrasSchema(extras) + '}. ' +
      this.buildExtrasInstructions(sourceLangText, extras) +
      'Use Markdown formatting for the text content to preserve structure (lists, indentation, paragraphs). ' +
      'Do not include markdown formatting for the JSON itself (like ```json).';
  }

  private createTranslationPrompt(text: string, sourceLanguage: string, targetLanguage: string): string {
    const sourceLangText = sourceLanguage === 'Auto' ? 'detected language' : sourceLanguage;
    return `Translate the following text "${text}" from ${sourceLangText} to ${targetLanguage}. ` +
      'Return only the translated text string. Use Markdown to preserve any existing structure (lists, indentation).';
  }

  private createTranslationPromptWithExtras(text: string, sourceLanguage: string, targetLanguage: string, extras: ExtrasOptions): string {
    const sourceLangText = sourceLanguage === 'Auto' ? 'detected language' : sourceLanguage;
    return `Translate the following text "${text}" from ${sourceLangText} to ${targetLanguage}. ` +
      'Return output in strict JSON format: {"translatedText": "translated text"' +
      this.buildExtrasSchema(extras) + '}. ' +
      this.buildExtrasInstructions(sourceLangText, extras) +
      'Do not include markdown formatting for the JSON itself (like ```json).';
  }

  private parseImageResponse(text: string, extras?: ExtrasOptions): TranslationResult & TranslationExtras {
    const parsed = this.parseJSONResponse<any>(text);
    return {
      originalText: parsed.originalText ?? '',
      translatedText: parsed.translatedText ?? '',
      ...this.extractExtras(parsed, extras),
    };
  }

  private parseTranslationWithExtras(text: string, extras: ExtrasOptions): { translatedText: string } & TranslationExtras {
    try {
      const parsed = this.parseJSONResponse<any>(text);
      return {
        translatedText: parsed.translatedText ?? '',
        ...this.extractExtras(parsed, extras),
      };
    } catch {
      // If JSON parsing fails, surface the raw text so the user sees something
      return { translatedText: text };
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
