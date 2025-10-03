import { GeminiService } from './gemini.service';
import { GoogleGenAI } from '@google/genai';

// Mock the @google/genai module
jest.mock('@google/genai');

// Unmock the GeminiService to test the real implementation
jest.unmock('./gemini.service');

describe('GeminiService', () => {
  let geminiService: GeminiService;
  let mockGoogleGenAI: jest.Mocked<GoogleGenAI>;
  let mockGenerateContent: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock for generateContent
    mockGenerateContent = jest.fn();
    
    // Mock GoogleGenAI constructor and methods
    mockGoogleGenAI = {
      models: {
        generateContent: mockGenerateContent
      }
    } as any;
    
    (GoogleGenAI as jest.MockedClass<typeof GoogleGenAI>).mockImplementation(() => mockGoogleGenAI);
    
    // Create service instance
    geminiService = new GeminiService('test-api-key');
  });

  describe('constructor', () => {
    it('should create GoogleGenAI instance with provided API key', () => {
      expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
    });
  });

  describe('processImage', () => {
    const mockImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const targetLanguage = 'Spanish';

    it('should successfully process image and return translation result', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: '{"originalText": "Hello", "translatedText": "Hola"}'
            }]
          }
        }]
      };
      
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.processImage(mockImageData, targetLanguage);

      expect(result).toEqual({
        originalText: 'Hello',
        translatedText: 'Hola'
      });

      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.0-flash-lite',
        contents: [{
          role: 'user',
          parts: [
            { text: `Extract text from this image and translate it to ${targetLanguage}. Return a JSON object with "originalText" and "translatedText" fields.` },
            {
              inlineData: {
                mimeType: 'image/png',
                data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
              }
            }
          ]
        }]
      });
    });

    it('should handle non-JSON response by extracting meaningful text', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'Raw text response without JSON format'
            }]
          }
        }]
      };
      
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.processImage(mockImageData, targetLanguage);

      expect(result).toEqual({
        originalText: 'Raw text response without JSON format',
        translatedText: '[Translation failed - please try again]'
      });
    });

    it('should handle response with legacy text property', async () => {
      const mockResponse = {
        text: '{"originalText": "Test", "translatedText": "Prueba"}'
      };
      
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.processImage(mockImageData, targetLanguage);

      expect(result).toEqual({
        originalText: 'Test',
        translatedText: 'Prueba'
      });
    });

    it('should throw error for invalid image data format', async () => {
      const invalidImageData = 'invalid-image-data';

      await expect(geminiService.processImage(invalidImageData, targetLanguage))
        .rejects.toThrow('Invalid image data format');

      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('should throw error when unable to extract text from response', async () => {
      const mockResponse = {
        candidates: null
      };
      
      mockGenerateContent.mockResolvedValue(mockResponse);

      await expect(geminiService.processImage(mockImageData, targetLanguage))
        .rejects.toThrow('Failed to extract text from API response');
    });

    it('should handle API errors with proper error transformation', async () => {
      const apiError = new Error('API Error: 429 Rate limit exceeded');
      mockGenerateContent.mockRejectedValue(apiError);

      await expect(geminiService.processImage(mockImageData, targetLanguage))
        .rejects.toThrow('Rate limit exceeded. Please try again later.');
    });

    it('should handle empty candidates array', async () => {
      const mockResponse = {
        candidates: []
      };
      
      mockGenerateContent.mockResolvedValue(mockResponse);

      await expect(geminiService.processImage(mockImageData, targetLanguage))
        .rejects.toThrow('Failed to extract text from API response');
    });

    it('should handle missing content parts', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: []
          }
        }]
      };
      
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.processImage(mockImageData, targetLanguage);
      
      expect(result).toEqual({
        originalText: '',
        translatedText: '[Translation failed - please try again]'
      });
    });

    it('should handle response with markdown code blocks', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: '```json\n{"originalText": "Hello World", "translatedText": "Hola Mundo"}\n```'
            }]
          }
        }]
      };
      
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.processImage(mockImageData, targetLanguage);

      expect(result).toEqual({
        originalText: 'Hello World',
        translatedText: 'Hola Mundo'
      });
    });

    it('should clean text with quotes and formatting', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: '{"originalText": "\\"Welcome to our app\\"", "translatedText": "**Bienvenido a nuestra aplicación**"}'
            }]
          }
        }]
      };
      
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.processImage(mockImageData, targetLanguage);

      expect(result).toEqual({
        originalText: 'Welcome to our app',
        translatedText: 'Bienvenido a nuestra aplicación'
      });
    });

    it('should handle natural language response with translation pattern', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'Original: Hello there\nTranslation: Hola allí'
            }]
          }
        }]
      };
      
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.processImage(mockImageData, targetLanguage);

      expect(result).toEqual({
        originalText: 'Hello there',
        translatedText: 'Hola allí'
      });
    });
  });

  describe('translateText', () => {
    const inputText = 'Hello world';
    const targetLanguage = 'French';

    it('should successfully translate text', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'Bonjour le monde'
            }]
          }
        }]
      };
      
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.translateText(inputText, targetLanguage);

      expect(result).toBe('Bonjour le monde');
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.0-flash-lite',
        contents: `Translate the following text to ${targetLanguage}: "${inputText}"`
      });
    });

    it('should handle response with legacy text property', async () => {
      const mockResponse = {
        text: 'Bonjour le monde'
      };
      
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.translateText(inputText, targetLanguage);

      expect(result).toBe('Bonjour le monde');
    });

    it('should throw error when unable to extract text from response', async () => {
      const mockResponse = {
        candidates: null
      };
      
      mockGenerateContent.mockResolvedValue(mockResponse);

      await expect(geminiService.translateText(inputText, targetLanguage))
        .rejects.toThrow('Failed to extract text from API response');
    });

    it('should handle API errors with proper error transformation', async () => {
      const apiError = new Error('API Error: 403 Forbidden');
      mockGenerateContent.mockRejectedValue(apiError);

      await expect(geminiService.translateText(inputText, targetLanguage))
        .rejects.toThrow('Invalid API key or insufficient permissions.');
    });
  });

  describe('handleError', () => {
    it('should transform 429 errors to rate limit message', () => {
      const error = new Error('429 Too Many Requests');
      const transformedError = (geminiService as any).handleError(error);
      
      expect(transformedError.message).toBe('Rate limit exceeded. Please try again later.');
    });

    it('should transform 403 errors to API key message', () => {
      const error = new Error('403 Forbidden');
      const transformedError = (geminiService as any).handleError(error);
      
      expect(transformedError.message).toBe('Invalid API key or insufficient permissions.');
    });

    it('should transform 404 errors to endpoint message', () => {
      const error = new Error('404 Not Found');
      const transformedError = (geminiService as any).handleError(error);
      
      expect(transformedError.message).toBe('API endpoint not found. Please check if the Gemini API is available.');
    });

    it('should return original error for other error types', () => {
      const error = new Error('Some other error');
      const transformedError = (geminiService as any).handleError(error);
      
      expect(transformedError).toBe(error);
    });

    it('should convert non-Error objects to Error instances', () => {
      const error = 'String error';
      const transformedError = (geminiService as any).handleError(error);
      
      expect(transformedError).toBeInstanceOf(Error);
      expect(transformedError.message).toBe('String error');
    });
  });

  describe('handleRateLimit', () => {
    beforeEach(() => {
      // Reset retry count
      geminiService.reset();
    });

    it('should increment retry count and wait with exponential backoff', async () => {
      const startTime = Date.now();
      
      // Mock setTimeout to resolve immediately for testing
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });

      await (geminiService as any).handleRateLimit();

      expect((geminiService as any).retryCount).toBe(1);
      
      // Cleanup
      jest.restoreAllMocks();
    });

    it('should throw error when max retries exceeded', async () => {
      // Set retry count to max
      (geminiService as any).retryCount = 3;

      await expect((geminiService as any).handleRateLimit())
        .rejects.toThrow('Maximum retry attempts reached. Please try again later.');
    });

    it('should calculate correct delay for exponential backoff', async () => {
      const mockSetTimeout = jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });

      // First retry
      await (geminiService as any).handleRateLimit();
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);

      // Second retry
      await (geminiService as any).handleRateLimit();
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 4000);

      // Third retry
      await (geminiService as any).handleRateLimit();
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 8000);

      jest.restoreAllMocks();
    });
  });

  describe('reset', () => {
    it('should reset retry count to zero', () => {
      // Set retry count to some value
      (geminiService as any).retryCount = 5;

      geminiService.reset();

      expect((geminiService as any).retryCount).toBe(0);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete image processing workflow', async () => {
      const mockImageData = 'data:image/png;base64,testdata';
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: '{"originalText": "Welcome", "translatedText": "Bienvenido"}'
            }]
          }
        }]
      };
      
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.processImage(mockImageData, 'Spanish');

      expect(result.originalText).toBe('Welcome');
      expect(result.translatedText).toBe('Bienvenido');
    });

    it('should handle complete text translation workflow', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'Guten Tag'
            }]
          }
        }]
      };
      
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.translateText('Good morning', 'German');

      expect(result).toBe('Guten Tag');
    });
  });
});