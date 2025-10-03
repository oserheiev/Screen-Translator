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
      const prompt = `Extract text from this image (source language: ${sourceLanguageText}) and translate it to ${targetLanguage}. Return a JSON object with "originalText" and "translatedText" fields.`;
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

      console.log('Gemini API response received');

      // Get the response text
      let responseText = '';
      try {
        // Use the correct API method to extract text
        if (result.candidates && result.candidates[0]) {
          const candidate = result.candidates[0];
          if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
            responseText = candidate.content.parts[0].text || '';
          }
        } else if (result.text) {
          responseText = result.text;
        } else {
          console.log('Full result object:', JSON.stringify(result, null, 2));
          throw new Error('Unable to extract text from response');
        }
        console.log('Response text:', responseText);
      } catch (error) {
        console.error('Error extracting text from response:', error);
        console.log('Full result object:', JSON.stringify(result, null, 2));
        throw new Error('Failed to extract text from API response');
      }

      try {
        console.log('Raw response text before parsing:', responseText);
        console.log('Response text type:', typeof responseText);
        console.log('Response text length:', responseText.length);

        // Check if response is wrapped in markdown code blocks
        let cleanedResponse = responseText.trim();
        if (cleanedResponse.startsWith('```json') && cleanedResponse.endsWith('```')) {
          console.log('Response is wrapped in markdown code blocks, extracting JSON...');
          cleanedResponse = cleanedResponse.slice(7, -3).trim(); // Remove ```json and ```
          console.log('Cleaned response:', cleanedResponse);
        } else if (cleanedResponse.startsWith('```') && cleanedResponse.endsWith('```')) {
          console.log('Response is wrapped in generic code blocks, extracting content...');
          cleanedResponse = cleanedResponse.slice(3, -3).trim(); // Remove ``` and ```
          console.log('Cleaned response:', cleanedResponse);
        }

        // Try to parse the JSON response
        const parsed = JSON.parse(cleanedResponse);
        console.log('Successfully parsed JSON response:', parsed);
        console.log('Parsed response type:', typeof parsed);
        console.log('originalText:', parsed.originalText);
        console.log('translatedText:', parsed.translatedText);

        // Validate and clean the extracted text
        const result = this.validateAndCleanTranslationResult(parsed);
        return result;
      } catch (parseError) {
        console.log('JSON parsing failed with error:', parseError);
        console.log('Raw response that failed to parse:', responseText);
        console.log('Attempting to extract text manually...');

        // Try to extract JSON from the response manually
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            console.log('Found JSON pattern, attempting to parse:', jsonMatch[0]);
            const parsed = JSON.parse(jsonMatch[0]);
            console.log('Successfully parsed extracted JSON:', parsed);
            const result = this.validateAndCleanTranslationResult(parsed);
            return result;
          } catch (secondParseError) {
            console.log('Second JSON parse attempt failed:', secondParseError);
          }
        }

        console.log('All JSON parsing attempts failed, attempting to extract text from natural language response');
        // Try to extract meaningful text from natural language response
        const extractedResult = this.extractTextFromNaturalResponse(responseText, targetLanguage);
        return extractedResult;
      }
    } catch (error) {
      console.error('GeminiService error:', error);
      throw this.handleError(error);
    }
  }

  async translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
    try {
      // Generate content
      const sourceLanguageText = sourceLanguage === 'Auto' ? 'detected language' : `from ${sourceLanguage}`;
      const result = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents: `Translate the following text ${sourceLanguageText} to ${targetLanguage}: "${text}"`
      });

      // Get the response text
      let responseText = '';
      try {
        // Use the correct API method to extract text
        if (result.candidates && result.candidates[0]) {
          const candidate = result.candidates[0];
          if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
            responseText = candidate.content.parts[0].text || '';
          }
        } else if (result.text) {
          responseText = result.text;
        } else {
          console.log('Full result object:', JSON.stringify(result, null, 2));
          throw new Error('Unable to extract text from response');
        }
      } catch (error) {
        console.error('Error extracting text from response:', error);
        console.log('Full result object:', JSON.stringify(result, null, 2));
        throw new Error('Failed to extract text from API response');
      }

      // Clean the response text to ensure it's user-friendly
      const cleanedText = this.cleanText(responseText);
      console.log('Original response:', responseText);
      console.log('Cleaned response:', cleanedText);

      return cleanedText;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private validateAndCleanTranslationResult(parsed: any): TranslationResult {
    console.log('Validating and cleaning translation result:', parsed);

    // Ensure we have the required fields
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid response format: not an object');
    }

    // Extract and clean the text fields
    let originalText = '';
    let translatedText = '';

    // Handle various possible field names and formats
    if (parsed.originalText !== undefined) {
      originalText = this.cleanText(String(parsed.originalText));
    } else if (parsed.original !== undefined) {
      originalText = this.cleanText(String(parsed.original));
    } else if (parsed.source !== undefined) {
      originalText = this.cleanText(String(parsed.source));
    }

    if (parsed.translatedText !== undefined) {
      translatedText = this.cleanText(String(parsed.translatedText));
    } else if (parsed.translated !== undefined) {
      translatedText = this.cleanText(String(parsed.translated));
    } else if (parsed.target !== undefined) {
      translatedText = this.cleanText(String(parsed.target));
    } else if (parsed.translation !== undefined) {
      translatedText = this.cleanText(String(parsed.translation));
    }

    console.log('Cleaned originalText:', originalText);
    console.log('Cleaned translatedText:', translatedText);

    return {
      originalText,
      translatedText
    };
  }

  private cleanText(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Remove common unwanted patterns
    let cleaned = text
      .trim()
      // Remove quotes if the entire text is wrapped in them
      .replace(/^["'](.*)["']$/, '$1')
      // Remove markdown formatting
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      .trim();

    // If the text looks like JSON or contains JSON-like patterns, try to extract meaningful content
    if (cleaned.includes('{') && cleaned.includes('}')) {
      // Try to extract text from JSON-like strings
      const textMatch = cleaned.match(/"(?:originalText|translatedText|text|content)"\s*:\s*"([^"]+)"/);
      if (textMatch) {
        cleaned = textMatch[1];
      }
    }

    return cleaned;
  }

  private extractTextFromNaturalResponse(responseText: string, targetLanguage: string): TranslationResult {
    console.log('Extracting text from natural language response');

    // Clean the response text
    const cleanedResponse = this.cleanText(responseText);

    // Try to identify if this is a translation response with both original and translated text
    const patterns = [
      // Pattern: "Original: ... Translation: ..." (with newline)
      /(?:original|source):\s*(.+?)(?:\n|\r\n).*?(?:translation|translated|target):\s*(.+?)(?:\n|$)/is,
      // Pattern: "Original: ... Translation: ..." (same line)
      /(?:original|source):\s*(.+?)\s+(?:translation|translated|target):\s*(.+)/i,
      // Pattern: "... -> ..." or "... → ..."
      /(.+?)\s*(?:->|→|translates to|means)\s*(.+)/i
    ];

    for (const pattern of patterns) {
      const match = cleanedResponse.match(pattern);
      if (match) {
        if (match.length >= 3) {
          // Found both original and translated text
          return {
            originalText: this.cleanText(match[1]),
            translatedText: this.cleanText(match[2])
          };
        }
      }
    }

    // If we can't parse it properly, return the cleaned response as original text
    // and indicate that translation failed
    console.log('Could not parse natural language response, using as original text');
    return {
      originalText: cleanedResponse,
      translatedText: `[Translation failed - please try again]`
    };
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