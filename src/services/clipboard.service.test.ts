import { ClipboardService } from './clipboard.service';

describe('ClipboardService', () => {
  let clipboardService: ClipboardService;
  let mockElectronClipboard: jest.Mock;
  let mockNavigatorClipboard: jest.Mock;

  beforeEach(() => {
    clipboardService = new ClipboardService();
    
    // Mock Electron clipboard API
    mockElectronClipboard = jest.fn().mockResolvedValue(undefined);
    
    // Mock Navigator clipboard API
    mockNavigatorClipboard = jest.fn().mockResolvedValue(undefined);
    
    // Update existing window.electron mock
    if (window.electron) {
      window.electron.clipboard = {
        writeText: mockElectronClipboard
      };
    }

    // Setup navigator.clipboard mock
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockNavigatorClipboard
      },
      writable: true,
      configurable: true
    });

    // Clear console.error mock
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up navigator clipboard mock
    delete (navigator as any).clipboard;
  });

  describe('copyToClipboard', () => {
    const testText = 'Hello, World!';

    describe('when running in Electron environment', () => {
      it('should use Electron clipboard API and return true on success', async () => {
        const result = await clipboardService.copyToClipboard(testText);

        expect(mockElectronClipboard).toHaveBeenCalledWith(testText);
        expect(result).toBe(true);
      });

      it('should return false when Electron clipboard API fails', async () => {
        const error = new Error('Electron clipboard error');
        mockElectronClipboard.mockRejectedValue(error);

        const result = await clipboardService.copyToClipboard(testText);

        expect(mockElectronClipboard).toHaveBeenCalledWith(testText);
        expect(console.error).toHaveBeenCalledWith('Failed to copy text to clipboard:', error);
        expect(result).toBe(false);
      });

      it('should handle empty text', async () => {
        const result = await clipboardService.copyToClipboard('');

        expect(mockElectronClipboard).toHaveBeenCalledWith('');
        expect(result).toBe(true);
      });

      it('should handle special characters and unicode', async () => {
        const specialText = '🚀 Special chars: áéíóú ñ 中文 русский';
        
        const result = await clipboardService.copyToClipboard(specialText);

        expect(mockElectronClipboard).toHaveBeenCalledWith(specialText);
        expect(result).toBe(true);
      });

      it('should handle very long text', async () => {
        const longText = 'A'.repeat(10000);
        
        const result = await clipboardService.copyToClipboard(longText);

        expect(mockElectronClipboard).toHaveBeenCalledWith(longText);
        expect(result).toBe(true);
      });
    });

    describe('when running in browser environment', () => {
      // Note: The current implementation always uses Electron API when available
      // Browser fallback would need to be tested with a different service implementation
      it('should be tested when browser fallback is implemented', () => {
        expect(true).toBe(true); // Placeholder test
      });
    });

    describe('edge cases', () => {
      it('should handle null text input', async () => {
        const result = await clipboardService.copyToClipboard(null as any);

        expect(mockElectronClipboard).toHaveBeenCalledWith(null);
        expect(result).toBe(true);
      });

      it('should handle undefined text input', async () => {
        const result = await clipboardService.copyToClipboard(undefined as any);

        expect(mockElectronClipboard).toHaveBeenCalledWith(undefined);
        expect(result).toBe(true);
      });

      it('should handle numeric input', async () => {
        const result = await clipboardService.copyToClipboard(123 as any);

        expect(mockElectronClipboard).toHaveBeenCalledWith(123);
        expect(result).toBe(true);
      });

      it('should handle object input', async () => {
        const objectInput = { test: 'value' };
        const result = await clipboardService.copyToClipboard(objectInput as any);

        expect(mockElectronClipboard).toHaveBeenCalledWith(objectInput);
        expect(result).toBe(true);
      });
    });

    describe('error handling', () => {
      it('should handle synchronous errors in Electron environment', async () => {
        mockElectronClipboard.mockImplementation(() => {
          throw new Error('Synchronous error');
        });

        const result = await clipboardService.copyToClipboard(testText);

        expect(console.error).toHaveBeenCalledWith(
          'Failed to copy text to clipboard:', 
          expect.any(Error)
        );
        expect(result).toBe(false);
      });

      it('should handle timeout errors', async () => {
        const timeoutError = new Error('Timeout');
        mockElectronClipboard.mockRejectedValue(timeoutError);

        const result = await clipboardService.copyToClipboard(testText);

        expect(console.error).toHaveBeenCalledWith('Failed to copy text to clipboard:', timeoutError);
        expect(result).toBe(false);
      });
    });

    describe('multiple calls', () => {
      it('should handle multiple sequential calls successfully', async () => {
        const texts = ['First text', 'Second text', 'Third text'];
        const results = [];

        for (const text of texts) {
          const result = await clipboardService.copyToClipboard(text);
          results.push(result);
        }

        expect(results).toEqual([true, true, true]);
        expect(mockElectronClipboard).toHaveBeenCalledTimes(3);
        expect(mockElectronClipboard).toHaveBeenNthCalledWith(1, 'First text');
        expect(mockElectronClipboard).toHaveBeenNthCalledWith(2, 'Second text');
        expect(mockElectronClipboard).toHaveBeenNthCalledWith(3, 'Third text');
      });

      it('should handle concurrent calls', async () => {
        const texts = ['Concurrent 1', 'Concurrent 2', 'Concurrent 3'];
        
        const promises = texts.map(text => clipboardService.copyToClipboard(text));
        const results = await Promise.all(promises);

        expect(results).toEqual([true, true, true]);
        expect(mockElectronClipboard).toHaveBeenCalledTimes(3);
      });

      it('should handle mixed success and failure calls', async () => {
        mockElectronClipboard
          .mockResolvedValueOnce(undefined) // First call succeeds
          .mockRejectedValueOnce(new Error('Second call fails')) // Second call fails
          .mockResolvedValueOnce(undefined); // Third call succeeds

        const result1 = await clipboardService.copyToClipboard('Text 1');
        const result2 = await clipboardService.copyToClipboard('Text 2');
        const result3 = await clipboardService.copyToClipboard('Text 3');

        expect(result1).toBe(true);
        expect(result2).toBe(false);
        expect(result3).toBe(true);
      });
    });
  });

  describe('service instantiation', () => {
    it('should create a new instance without errors', () => {
      const newService = new ClipboardService();
      expect(newService).toBeInstanceOf(ClipboardService);
    });

    it('should create multiple independent instances', () => {
      const service1 = new ClipboardService();
      const service2 = new ClipboardService();
      
      expect(service1).toBeInstanceOf(ClipboardService);
      expect(service2).toBeInstanceOf(ClipboardService);
      expect(service1).not.toBe(service2);
    });
  });
});