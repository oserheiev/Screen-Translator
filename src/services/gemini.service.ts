import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { TranslationResult } from '../types';
import { CONFIG } from '../config';

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

  async processImage(imageData: string, sourceLanguage: string, targetLanguage: string, modelName: string): Promise<TranslationResult> {
    try {
      const base64Image = this.extractBase64Image(imageData);
      const prompt = this.createImagePrompt(sourceLanguage, targetLanguage);

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

      return this.parseJSONResponse<TranslationResult>(responseText);
    } catch (error) {
      console.error('GeminiService.processImage error:', error);
      throw this.handleError(error);
    }
  }

  async translateText(text: string, sourceLanguage: string, targetLanguage: string, modelName: string): Promise<string> {
    try {
      const prompt = this.createTranslationPrompt(text, sourceLanguage, targetLanguage);

      const responseText = await this.executeWithRetry(async () => {
        const result = await this.ai.models.generateContent({
          model: modelName,
          contents: prompt
        });
        return this.extractTextFromResponse(result);
      });

      return responseText;
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

  private createImagePrompt(sourceLanguage: string, targetLanguage: string): string {
    const sourceLangText = sourceLanguage === 'Auto' ? 'any language' : sourceLanguage;
    return `Extract text from this image (source language: ${sourceLangText}) and translate it to ${targetLanguage}. ` +
      'Return output in strict JSON format: {"originalText": "detected original text", "translatedText": "translated text"}. ' +
      'Do not include markdown formatting (like ```json) or any additional text.';
  }

  private createTranslationPrompt(text: string, sourceLanguage: string, targetLanguage: string): string {
    const sourceLangText = sourceLanguage === 'Auto' ? 'detected language' : sourceLanguage;
    return `Translate the following text "${text}" from ${sourceLangText} to ${targetLanguage}. ` +
      'Return only the translated text string.';
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