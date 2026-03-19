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

      expect(result.translatedText).toBe('Bonjour le monde');
    });

    it('uses "detected language" when source is Auto', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Translated' });

      await service.translateText('text', 'Auto', 'German', 'model');

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents).toContain('detected language');
    });
  });

  // ── processImage with extras ──────────────────────────────────────────────

  describe('processImage with extras', () => {
    const imageData = 'data:image/png;base64,ABC123';

    it('returns alternatives when showAlternatives is true and response contains them', async () => {
      const altGroup = { category: 'Nouns', items: [{ word: 'Hola', backTranslations: ['Hello'] }] };
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({ originalText: 'Hello', translatedText: 'Hola', alternatives: [altGroup] }),
      });

      const result = await service.processImage(imageData, 'Auto', 'Spanish', 'model', { showAlternatives: true, showContext: false });

      expect(result.alternatives).toEqual([altGroup]);
    });

    it('returns context when showContext is true and response contains it', async () => {
      const ctx = { explanation: 'Informal greeting', tags: [{ label: 'Informal', applicable: true }] };
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({ originalText: 'Hi', translatedText: 'Salut', context: ctx }),
      });

      const result = await service.processImage(imageData, 'Auto', 'French', 'model', { showAlternatives: false, showContext: true });

      expect(result.context).toEqual(ctx);
    });

    it('omits alternatives from result when showAlternatives is false', async () => {
      mockGenerateContent.mockResolvedValue({
        text: '{"originalText":"Hi","translatedText":"Hola"}',
      });

      const result = await service.processImage(imageData, 'Auto', 'Spanish', 'model', { showAlternatives: false, showContext: false });

      expect(result.alternatives).toBeUndefined();
    });

    it('includes "alternatives" keyword in prompt when showAlternatives is true', async () => {
      mockGenerateContent.mockResolvedValue({
        text: '{"originalText":"Hi","translatedText":"Hola","alternatives":[]}',
      });

      await service.processImage(imageData, 'Auto', 'Spanish', 'model', { showAlternatives: true, showContext: false });

      const prompt = mockGenerateContent.mock.calls[0][0].contents[0].parts[0].text as string;
      expect(prompt).toContain('alternatives');
    });

    it('includes "context" keyword in prompt when showContext is true', async () => {
      mockGenerateContent.mockResolvedValue({
        text: '{"originalText":"Hi","translatedText":"Hola","context":{}}',
      });

      await service.processImage(imageData, 'Auto', 'Spanish', 'model', { showAlternatives: false, showContext: true });

      const prompt = mockGenerateContent.mock.calls[0][0].contents[0].parts[0].text as string;
      expect(prompt).toContain('"context"');
    });

    it('instructs back-translations to use source language in prompt', async () => {
      mockGenerateContent.mockResolvedValue({
        text: '{"originalText":"Bonjour","translatedText":"Hello","alternatives":[]}',
      });

      await service.processImage(imageData, 'French', 'English', 'model', { showAlternatives: true, showContext: false });

      const prompt = mockGenerateContent.mock.calls[0][0].contents[0].parts[0].text as string;
      expect(prompt).toMatch(/source language.*French/i);
    });
  });

  // ── translateText with extras ──────────────────────────────────────────────

  describe('translateText with extras', () => {
    it('switches to JSON mode and returns alternatives when showAlternatives is true', async () => {
      const altGroup = { category: 'Nouns', items: [{ word: 'Salut', backTranslations: ['Hi'] }] };
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({ translatedText: 'Bonjour', alternatives: [altGroup] }),
      });

      const result = await service.translateText('Hello', 'English', 'French', 'model', { showAlternatives: true, showContext: false });

      expect(result.translatedText).toBe('Bonjour');
      expect(result.alternatives).toEqual([altGroup]);
    });

    it('returns context when showContext is true', async () => {
      const ctx = { explanation: 'Formal greeting', tags: [{ label: 'Formal', applicable: true }] };
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({ translatedText: 'Bonjour', context: ctx }),
      });

      const result = await service.translateText('Hello', 'English', 'French', 'model', { showAlternatives: false, showContext: true });

      expect(result.translatedText).toBe('Bonjour');
      expect(result.context).toEqual(ctx);
    });

    it('returns plain text object without extras when both toggles are off', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Bonjour' });

      const result = await service.translateText('Hello', 'English', 'French', 'model', { showAlternatives: false, showContext: false });

      expect(result.translatedText).toBe('Bonjour');
      expect(result.alternatives).toBeUndefined();
      expect(result.context).toBeUndefined();
    });

    it('uses array contents format when extras are requested', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({ translatedText: 'Bonjour', alternatives: [] }),
      });

      await service.translateText('Hello', 'English', 'French', 'model', { showAlternatives: true, showContext: false });

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(Array.isArray(callArgs.contents)).toBe(true);
    });

    it('uses plain string contents format when no extras requested', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Bonjour' });

      await service.translateText('Hello', 'English', 'French', 'model');

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(typeof callArgs.contents).toBe('string');
    });

    it('falls back to raw text as translatedText when JSON parsing fails with extras', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'not json but a translation' });

      const result = await service.translateText('Hello', 'English', 'French', 'model', { showAlternatives: true, showContext: false });

      expect(result.translatedText).toBe('not json but a translation');
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
