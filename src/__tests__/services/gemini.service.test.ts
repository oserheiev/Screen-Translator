import { GeminiService } from '../../services/gemini.service';

// @google/genai is replaced by __mocks__/@google/genai.ts via moduleNameMapper in jest.config.js
import { GoogleGenAI } from '@google/genai';

// Mock config to eliminate retry delays
jest.mock('../../config', () => ({
  CONFIG: {
    GEMINI: { MODEL_NAME: 'gemini-2.5-flash', MAX_RETRIES: 3, BASE_DELAY_MS: 0 },
    DEFAULTS: { SOURCE_LANGUAGE: 'Auto', TARGET_LANGUAGE: 'English', THEME: 'system', HOTKEY: 'Ctrl+Alt+T' },
  },
}));

describe('GeminiService', () => {
  let service: GeminiService;
  let mockGenerateContent: jest.Mock;
  let mockList: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateContent = jest.fn();
    mockList = jest.fn();

    (GoogleGenAI as jest.Mock).mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
        list: mockList,
      },
    }));

    service = new GeminiService('test-api-key');
  });

  // ── processImage ────────────────────────────────────────────────────────────

  describe('processImage', () => {
    const imageData = 'data:image/png;base64,ABC123base64data';
    const expectedBase64 = 'ABC123base64data';

    it('strips the data URI prefix and sends only base64 to the API', async () => {
      mockGenerateContent.mockResolvedValue({
        text: '{"originalText":"Hello","translatedText":"Hola"}',
      });

      await service.processImage(imageData, 'Auto', 'English', 'gemini-2.5-flash');

      const callArgs = mockGenerateContent.mock.calls[0][0];
      const inlineData = callArgs.contents[0].parts[1].inlineData;
      expect(inlineData.data).toBe(expectedBase64);
      expect(inlineData.mimeType).toBe('image/png');
    });

    it('throws when image data has no base64 segment', async () => {
      await expect(
        service.processImage('nodatauri', 'Auto', 'English', 'model')
      ).rejects.toThrow('Invalid image data format');
    });

    it('includes source and target language in the prompt', async () => {
      mockGenerateContent.mockResolvedValue({
        text: '{"originalText":"Bonjour","translatedText":"Hello"}',
      });

      await service.processImage(imageData, 'French', 'English', 'gemini-2.5-flash');

      const callArgs = mockGenerateContent.mock.calls[0][0];
      const promptText = callArgs.contents[0].parts[0].text as string;
      expect(promptText).toContain('French');
      expect(promptText).toContain('English');
    });

    it('uses "any language" when source is Auto', async () => {
      mockGenerateContent.mockResolvedValue({
        text: '{"originalText":"text","translatedText":"texte"}',
      });

      await service.processImage(imageData, 'Auto', 'French', 'gemini-2.5-flash');

      const callArgs = mockGenerateContent.mock.calls[0][0];
      const promptText = callArgs.contents[0].parts[0].text as string;
      expect(promptText).toContain('any language');
    });

    it('parses a valid JSON response', async () => {
      mockGenerateContent.mockResolvedValue({
        text: '{"originalText":"Hello","translatedText":"Hola"}',
      });

      const result = await service.processImage(imageData, 'Auto', 'Spanish', 'gemini-2.5-flash');

      expect(result).toEqual({ originalText: 'Hello', translatedText: 'Hola' });
    });

    it('strips markdown JSON code fences from the response', async () => {
      mockGenerateContent.mockResolvedValue({
        text: '```json\n{"originalText":"Hi","translatedText":"Hola"}\n```',
      });

      const result = await service.processImage(imageData, 'Auto', 'Spanish', 'gemini-2.5-flash');

      expect(result).toEqual({ originalText: 'Hi', translatedText: 'Hola' });
    });

    it('throws on malformed JSON response', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'not valid json' });

      await expect(
        service.processImage(imageData, 'Auto', 'English', 'model')
      ).rejects.toThrow('Failed to parse (JSON) response from Gemini API');
    });

    it('throws when the API returns no text', async () => {
      mockGenerateContent.mockResolvedValue({ text: undefined });

      await expect(
        service.processImage(imageData, 'Auto', 'English', 'model')
      ).rejects.toThrow('No response text received from Gemini API');
    });
  });

  // ── translateText ────────────────────────────────────────────────────────────

  describe('translateText', () => {
    it('sends text and languages in the prompt', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Bonjour' });

      await service.translateText('Hello', 'English', 'French', 'gemini-2.5-flash');

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents).toContain('Hello');
      expect(callArgs.contents).toContain('English');
      expect(callArgs.contents).toContain('French');
    });

    it('returns the response text directly', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Bonjour le monde' });

      const result = await service.translateText('Hello world', 'English', 'French', 'model');

      expect(result).toBe('Bonjour le monde');
    });

    it('uses "detected language" when source is Auto', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Translated' });

      await service.translateText('text', 'Auto', 'German', 'model');

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents).toContain('detected language');
    });
  });

  // ── retry logic ────────────────────────────────────────────────────────────

  describe('retry logic', () => {
    const imageData = 'data:image/png;base64,ABC';

    it('retries on 429 error and succeeds on third attempt', async () => {
      const rateLimitError = new Error('429 Too Many Requests');
      mockGenerateContent
        .mockRejectedValueOnce(rateLimitError)
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({ text: '{"originalText":"Hi","translatedText":"Hola"}' });

      const result = await service.processImage(imageData, 'Auto', 'Spanish', 'model');

      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ originalText: 'Hi', translatedText: 'Hola' });
    });

    it('retries on 503 error', async () => {
      const serviceError = new Error('503 Service Unavailable');
      mockGenerateContent
        .mockRejectedValueOnce(serviceError)
        .mockResolvedValueOnce({ text: '{"originalText":"Hi","translatedText":"Hi"}' });

      await service.processImage(imageData, 'Auto', 'English', 'model');

      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it('retries on 500 error', async () => {
      const serverError = new Error('500 Internal Server Error');
      mockGenerateContent
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce({ text: '{"originalText":"Hi","translatedText":"Hi"}' });

      await service.processImage(imageData, 'Auto', 'English', 'model');

      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it('does NOT retry on 403 error', async () => {
      const authError = new Error('403 Forbidden');
      mockGenerateContent.mockRejectedValue(authError);

      await expect(
        service.processImage(imageData, 'Auto', 'English', 'model')
      ).rejects.toThrow('Invalid API key or permissions.');
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('throws after exhausting all retries', async () => {
      const rateLimitError = new Error('429 Too Many Requests');
      mockGenerateContent.mockRejectedValue(rateLimitError);

      await expect(
        service.processImage(imageData, 'Auto', 'English', 'model')
      ).rejects.toThrow('Rate limit exceeded');
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });
  });

  // ── error mapping ────────────────────────────────────────────────────────────

  describe('error mapping', () => {
    const imageData = 'data:image/png;base64,ABC';

    it('maps 403 to invalid API key message', async () => {
      mockGenerateContent.mockRejectedValue(new Error('403 Forbidden'));
      await expect(service.processImage(imageData, 'Auto', 'English', 'model'))
        .rejects.toThrow('Invalid API key or permissions.');
    });

    it('maps 404 to not found message', async () => {
      mockGenerateContent.mockRejectedValue(new Error('404 Not Found'));
      await expect(service.processImage(imageData, 'Auto', 'English', 'model'))
        .rejects.toThrow('Gemini API not found.');
    });

    it('maps 429 to rate limit message', async () => {
      mockGenerateContent.mockRejectedValue(new Error('429 Rate Limit'));
      await expect(service.processImage(imageData, 'Auto', 'English', 'model'))
        .rejects.toThrow('Rate limit exceeded. Please try again later.');
    });
  });

  // ── listModels ────────────────────────────────────────────────────────────

  describe('listModels', () => {
    async function* makeModels() {
      yield { name: 'models/gemini-2.5-flash', supportedActions: ['generateContent'] };
      yield { name: 'models/gemini-pro', supportedActions: ['generateContent'] };
      yield { name: 'models/text-embedding-004', supportedActions: ['embedContent'] };
    }

    it('returns only models that support generateContent', async () => {
      mockList.mockResolvedValue(makeModels());

      const models = await service.listModels();

      expect(models).toEqual(['gemini-2.5-flash', 'gemini-pro']);
      expect(models).not.toContain('text-embedding-004');
    });

    it('strips the "models/" prefix from model names', async () => {
      mockList.mockResolvedValue(makeModels());

      const models = await service.listModels();

      expect(models.every(m => !m.startsWith('models/'))).toBe(true);
    });
  });
});
