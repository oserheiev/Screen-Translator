import { GoogleGenAI } from '@google/genai';
import { TranslationResult } from '../types';

export class GeminiService {
  private ai: GoogleGenAI;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private baseDelay: number = 2000;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async processImage(imageData: string, sourceLanguage: string, targetLanguage: string): Promise<TranslationResult> {
    console.log('GeminiService.processImage called');
    console.log('Source language:', sourceLanguage);
    console.log('Target language:', targetLanguage);
    console.log('Image data length:', imageData.length);

    try {
      // Remove the data URL prefix
      const base64Image = imageData.split(',')[1];
      console.log('Base64 image length:', base64Image?.length || 0);

      if (!base64Image) {
        throw new Error('Invalid image data format');
      }

      // Create the prompt
      const sourceLanguageText = sourceLanguage === 'Auto' ? 'any language' : sourceLanguage;
      const prompt = `Extract text from this image (source language: ${sourceLanguageText}) and translate it to ${targetLanguage}. ` +
        'Return output: {"originalText": "some text", "translatedText": "some text"}. Do not include any additional text or formatting.';
      console.log('Prompt:', prompt);

      // Generate content
      console.log('Calling Gemini API...');
      const result = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
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

      const responseText = result.text;

      if (!responseText) {
        throw new Error('No response text received');
      }

      console.log('Response text:', responseText);
      var cleanedText = responseText.replace(/json|`/g, '');
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error('GeminiService error:', error);
      throw this.handleError(error);
    }
  }

  async translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
    try {
      // Generate content
      const sourceLanguageText = sourceLanguage === 'Auto' ? 'detected language' : sourceLanguage;
      const result = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents: `Translate the following text "${text}" from ${sourceLanguageText} to ${targetLanguage}.` +
          'Return only a string with the translated text.'
      });

      const responseText = result.text || '';
      console.log('Original response:', responseText);

      return responseText;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async handleRateLimit(): Promise<void> {
    this.retryCount++;

    if (this.retryCount > this.maxRetries) {
      throw new Error('Maximum retry attempts reached. Please try again later.');
    }

    const delay = this.baseDelay * Math.pow(2, this.retryCount - 1);
    console.log(`Rate limit hit. Retrying in ${Math.ceil(delay / 1000)} seconds... (Attempt ${this.retryCount}/${this.maxRetries})`);

    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private handleError(error: any): Error {
    console.error("Gemini API error:", error);

    if (error.message?.includes('429')) {
      return new Error('Rate limit exceeded. Please try again later.');
    }
    if (error.message?.includes('403')) {
      return new Error('Invalid API key or insufficient permissions.');
    }
    if (error.message?.includes('404')) {
      return new Error('API endpoint not found. Please check if the Gemini API is available.');
    }

    return error instanceof Error ? error : new Error(String(error));
  }

  reset(): void {
    this.retryCount = 0;
  }
}

export default GeminiService;