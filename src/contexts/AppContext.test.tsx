import React from 'react';
import { render, screen, waitFor, act } from '../test-utils';
import { AppProvider, useAppContext, AppContext } from './AppContext';
import GeminiService from '../services/gemini.service';
import { SupportedLanguage, Theme } from '../types';

// Mock GeminiService
jest.mock('../services/gemini.service');

describe('AppContext', () => {
  let mockGeminiService: jest.Mocked<GeminiService>;
  let mockElectronSettings: any;
  let mockElectronPlatform: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock GeminiService
    mockGeminiService = {
      processImage: jest.fn(),
      translateText: jest.fn(),
      reset: jest.fn(),
    } as any;

    (GeminiService as jest.MockedClass<typeof GeminiService>).mockImplementation(() => mockGeminiService);

    // Mock Electron APIs
    mockElectronSettings = {
      get: jest.fn().mockResolvedValue({
        apiKey: 'test-api-key',
        targetLanguage: 'English',
        hotkey: 'Ctrl+Alt+T',
        theme: 'light',
      }),
      save: jest.fn().mockResolvedValue(true),
    };

    mockElectronPlatform = {
      getPlatform: jest.fn().mockResolvedValue('darwin'),
    };

    // Update existing window.electron mock instead of redefining
    if (window.electron) {
      window.electron.settings = mockElectronSettings;
      window.electron.platform = mockElectronPlatform;
    }
  });

  // Test component to access context
  const TestComponent: React.FC = () => {
    const context = useAppContext();
    return (
      <div>
        <div data-testid="original-text">{context.originalText}</div>
        <div data-testid="translated-text">{context.translatedText}</div>
        <div data-testid="target-language">{context.targetLanguage}</div>
        <div data-testid="api-key">{context.apiKey}</div>
        <div data-testid="hotkey">{context.hotkey}</div>
        <div data-testid="theme">{context.theme}</div>
        <div data-testid="is-processing">{context.isProcessing.toString()}</div>
        <div data-testid="error">{context.error || 'null'}</div>
        <button onClick={() => context.setOriginalText('New original text')}>
          Set Original Text
        </button>
        <button onClick={() => context.setTargetLanguage('Spanish')}>
          Set Target Language
        </button>
        <button onClick={() => context.setApiKey('new-api-key')}>
          Set API Key
        </button>
        <button onClick={() => context.setHotkey('Ctrl+Shift+T')}>
          Set Hotkey
        </button>
        <button onClick={() => context.setTheme('dark')}>
          Set Theme
        </button>
        <button onClick={() => context.processImage('test-image-data')}>
          Process Image
        </button>
        <button onClick={() => context.translateText('test text')}>
          Translate Text
        </button>
        <button onClick={() => context.clearError()}>
          Clear Error
        </button>
      </div>
    );
  };

  const renderWithProvider = (component: React.ReactElement) => {
    return render(<AppProvider>{component}</AppProvider>);
  };

  describe('AppProvider initialization', () => {
    it('should provide default context values', () => {
      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('original-text')).toHaveTextContent('');
      expect(screen.getByTestId('translated-text')).toHaveTextContent('');
      expect(screen.getByTestId('target-language')).toHaveTextContent('English');
      expect(screen.getByTestId('api-key')).toHaveTextContent('');
      expect(screen.getByTestId('hotkey')).toHaveTextContent('Ctrl+Alt+T');
      expect(screen.getByTestId('theme')).toHaveTextContent('system');
      expect(screen.getByTestId('is-processing')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });

    it('should load settings from Electron store on mount', async () => {
      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(mockElectronSettings.get).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByTestId('api-key')).toHaveTextContent('test-api-key');
        expect(screen.getByTestId('target-language')).toHaveTextContent('English');
        expect(screen.getByTestId('hotkey')).toHaveTextContent('Ctrl+Alt+T');
        expect(screen.getByTestId('theme')).toHaveTextContent('light');
      });
    });

    it('should set platform-specific default hotkey when no hotkey in settings', async () => {
      mockElectronSettings.get.mockResolvedValue({
        apiKey: 'test-api-key',
        targetLanguage: 'English',
        theme: 'light',
        // No hotkey in settings
      });

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(mockElectronPlatform.getPlatform).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByTestId('hotkey')).toHaveTextContent('Command+Alt+T');
      });
    });

    it('should use Ctrl+Alt+T for non-macOS platforms', async () => {
      mockElectronPlatform.getPlatform.mockResolvedValue('win32');
      mockElectronSettings.get.mockResolvedValue({
        apiKey: 'test-api-key',
        targetLanguage: 'English',
        theme: 'light',
      });

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('hotkey')).toHaveTextContent('Ctrl+Alt+T');
      });
    });

    it('should handle settings loading errors gracefully', async () => {
      mockElectronSettings.get.mockRejectedValue(new Error('Settings load error'));

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Failed to load settings:', expect.any(Error));
      });

      // Should still render with default values
      expect(screen.getByTestId('api-key')).toHaveTextContent('');
      expect(screen.getByTestId('target-language')).toHaveTextContent('English');
    });

    it('should work without Electron environment', async () => {
      delete (window as any).electron;

      renderWithProvider(<TestComponent />);

      // Should render with default values
      expect(screen.getByTestId('api-key')).toHaveTextContent('');
      expect(screen.getByTestId('target-language')).toHaveTextContent('English');
      expect(screen.getByTestId('hotkey')).toHaveTextContent('Ctrl+Alt+T');
    });
  });

  describe('Settings persistence', () => {
    it('should save settings when API key changes', async () => {
      renderWithProvider(<TestComponent />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('api-key')).toHaveTextContent('test-api-key');
      });

      // Change API key
      act(() => {
        screen.getByText('Set API Key').click();
      });

      await waitFor(() => {
        expect(mockElectronSettings.save).toHaveBeenCalledWith({
          apiKey: 'new-api-key',
          targetLanguage: 'English',
          hotkey: 'Ctrl+Alt+T',
          theme: 'light',
        });
      });
    });

    it('should save settings when target language changes', async () => {
      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('api-key')).toHaveTextContent('test-api-key');
      });

      act(() => {
        screen.getByText('Set Target Language').click();
      });

      await waitFor(() => {
        expect(mockElectronSettings.save).toHaveBeenCalledWith({
          apiKey: 'test-api-key',
          targetLanguage: 'Spanish',
          hotkey: 'Ctrl+Alt+T',
          theme: 'light',
        });
      });
    });

    it('should save settings when hotkey changes', async () => {
      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('api-key')).toHaveTextContent('test-api-key');
      });

      act(() => {
        screen.getByText('Set Hotkey').click();
      });

      await waitFor(() => {
        expect(mockElectronSettings.save).toHaveBeenCalledWith({
          apiKey: 'test-api-key',
          targetLanguage: 'English',
          hotkey: 'Ctrl+Shift+T',
          theme: 'light',
        });
      });
    });

    it('should save settings when theme changes', async () => {
      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('api-key')).toHaveTextContent('test-api-key');
      });

      act(() => {
        screen.getByText('Set Theme').click();
      });

      await waitFor(() => {
        expect(mockElectronSettings.save).toHaveBeenCalledWith({
          apiKey: 'test-api-key',
          targetLanguage: 'English',
          hotkey: 'Ctrl+Alt+T',
          theme: 'dark',
        });
      });
    });

    it('should not save settings if no API key is set', async () => {
      mockElectronSettings.get.mockResolvedValue({
        targetLanguage: 'English',
        hotkey: 'Ctrl+Alt+T',
        theme: 'light',
        // No API key
      });

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('target-language')).toHaveTextContent('English');
      });

      // Should not call save since no API key
      expect(mockElectronSettings.save).not.toHaveBeenCalled();
    });

    it('should handle settings save errors gracefully', async () => {
      mockElectronSettings.save.mockRejectedValue(new Error('Save error'));

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('api-key')).toHaveTextContent('test-api-key');
      });

      act(() => {
        screen.getByText('Set Target Language').click();
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Failed to save settings:', expect.any(Error));
      });
    });
  });

  describe('GeminiService management', () => {
    it('should create GeminiService when API key is set', async () => {
      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('api-key')).toHaveTextContent('test-api-key');
      });

      expect(GeminiService).toHaveBeenCalledWith('test-api-key');
    });

    it('should recreate GeminiService when API key changes', async () => {
      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('api-key')).toHaveTextContent('test-api-key');
      });

      expect(GeminiService).toHaveBeenCalledWith('test-api-key');

      act(() => {
        screen.getByText('Set API Key').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('api-key')).toHaveTextContent('new-api-key');
      });

      expect(GeminiService).toHaveBeenCalledWith('new-api-key');
    });

    it('should not create GeminiService when API key is empty', async () => {
      mockElectronSettings.get.mockResolvedValue({
        targetLanguage: 'English',
        hotkey: 'Ctrl+Alt+T',
        theme: 'light',
        // No API key
      });

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('api-key')).toHaveTextContent('');
      });

      expect(GeminiService).not.toHaveBeenCalled();
    });
  });

  describe('processImage', () => {
    beforeEach(async () => {
      renderWithProvider(<TestComponent />);
      await waitFor(() => {
        expect(screen.getByTestId('api-key')).toHaveTextContent('test-api-key');
      });
    });

    it('should successfully process image and update state', async () => {
      const mockResult = {
        originalText: 'Original text from image',
        translatedText: 'Translated text from image',
      };
      mockGeminiService.processImage.mockResolvedValue(mockResult);

      act(() => {
        screen.getByText('Process Image').click();
      });

      expect(screen.getByTestId('is-processing')).toHaveTextContent('true');

      await waitFor(() => {
        expect(screen.getByTestId('is-processing')).toHaveTextContent('false');
      });

      expect(mockGeminiService.processImage).toHaveBeenCalledWith('test-image-data', 'English');
      expect(screen.getByTestId('original-text')).toHaveTextContent('Original text from image');
      expect(screen.getByTestId('translated-text')).toHaveTextContent('Translated text from image');
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });

    it('should handle processImage errors', async () => {
      const error = new Error('Processing failed');
      mockGeminiService.processImage.mockRejectedValue(error);

      act(() => {
        screen.getByText('Process Image').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-processing')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('error')).toHaveTextContent('Processing failed');
      expect(screen.getByTestId('original-text')).toHaveTextContent('');
      expect(screen.getByTestId('translated-text')).toHaveTextContent('');
    });

    it('should handle non-Error objects in processImage', async () => {
      mockGeminiService.processImage.mockRejectedValue('String error');

      act(() => {
        screen.getByText('Process Image').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('An unknown error occurred');
      });
    });

    it('should show error when no GeminiService available', async () => {
      // Create component without API key
      mockElectronSettings.get.mockResolvedValue({
        targetLanguage: 'English',
        hotkey: 'Ctrl+Alt+T',
        theme: 'light',
      });

      render(<AppProvider><TestComponent /></AppProvider>);

      await waitFor(() => {
        expect(screen.getByTestId('api-key')).toHaveTextContent('');
      });

      act(() => {
        screen.getByText('Process Image').click();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('API key not set. Please set your Gemini API key in settings.');
      expect(mockGeminiService.processImage).not.toHaveBeenCalled();
    });

    it('should use current target language for processing', async () => {
      const mockResult = {
        originalText: 'Hello',
        translatedText: 'Hola',
      };
      mockGeminiService.processImage.mockResolvedValue(mockResult);

      // Change target language first
      act(() => {
        screen.getByText('Set Target Language').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('target-language')).toHaveTextContent('Spanish');
      });

      act(() => {
        screen.getByText('Process Image').click();
      });

      await waitFor(() => {
        expect(mockGeminiService.processImage).toHaveBeenCalledWith('test-image-data', 'Spanish');
      });
    });
  });

  describe('translateText', () => {
    beforeEach(async () => {
      renderWithProvider(<TestComponent />);
      await waitFor(() => {
        expect(screen.getByTestId('api-key')).toHaveTextContent('test-api-key');
      });
    });

    it('should successfully translate text and update state', async () => {
      mockGeminiService.translateText.mockResolvedValue('Translated result');

      act(() => {
        screen.getByText('Translate Text').click();
      });

      expect(screen.getByTestId('is-processing')).toHaveTextContent('true');

      await waitFor(() => {
        expect(screen.getByTestId('is-processing')).toHaveTextContent('false');
      });

      expect(mockGeminiService.translateText).toHaveBeenCalledWith('test text', 'English');
      expect(screen.getByTestId('translated-text')).toHaveTextContent('Translated result');
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });

    it('should handle translateText errors', async () => {
      const error = new Error('Translation failed');
      mockGeminiService.translateText.mockRejectedValue(error);

      act(() => {
        screen.getByText('Translate Text').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-processing')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('error')).toHaveTextContent('Translation failed');
    });

    it('should show error when no GeminiService available', async () => {
      mockElectronSettings.get.mockResolvedValue({
        targetLanguage: 'English',
        hotkey: 'Ctrl+Alt+T',
        theme: 'light',
      });

      const { rerender } = render(<AppProvider><TestComponent /></AppProvider>);

      await waitFor(() => {
        expect(screen.getByTestId('api-key')).toHaveTextContent('');
      });

      act(() => {
        screen.getByText('Translate Text').click();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('API key not set. Please set your Gemini API key in settings.');
      expect(mockGeminiService.translateText).not.toHaveBeenCalled();
    });

    it('should clear translated text for empty input', async () => {
      const TestComponentWithEmptyText: React.FC = () => {
        const context = useAppContext();
        return (
          <div>
            <div data-testid="translated-text">{context.translatedText}</div>
            <button onClick={() => context.translateText('')}>
              Translate Empty Text
            </button>
          </div>
        );
      };

      render(<AppProvider><TestComponentWithEmptyText /></AppProvider>);

      act(() => {
        screen.getByText('Translate Empty Text').click();
      });

      expect(screen.getByTestId('translated-text')).toHaveTextContent('');
      expect(mockGeminiService.translateText).not.toHaveBeenCalled();
    });

    it('should clear translated text for whitespace-only input', async () => {
      const TestComponentWithWhitespace: React.FC = () => {
        const context = useAppContext();
        return (
          <div>
            <div data-testid="translated-text">{context.translatedText}</div>
            <button onClick={() => context.translateText('   ')}>
              Translate Whitespace
            </button>
          </div>
        );
      };

      render(<AppProvider><TestComponentWithWhitespace /></AppProvider>);

      act(() => {
        screen.getByText('Translate Whitespace').click();
      });

      expect(screen.getByTestId('translated-text')).toHaveTextContent('');
      expect(mockGeminiService.translateText).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      renderWithProvider(<TestComponent />);
      await waitFor(() => {
        expect(screen.getByTestId('api-key')).toHaveTextContent('test-api-key');
      });
    });

    it('should clear error when clearError is called', async () => {
      // First create an error
      mockGeminiService.processImage.mockRejectedValue(new Error('Test error'));

      act(() => {
        screen.getByText('Process Image').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Test error');
      });

      // Clear the error
      act(() => {
        screen.getByText('Clear Error').click();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });

    it('should clear error when starting new operations', async () => {
      // First create an error
      mockGeminiService.processImage.mockRejectedValue(new Error('Test error'));

      act(() => {
        screen.getByText('Process Image').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Test error');
      });

      // Start new operation - should clear error
      mockGeminiService.translateText.mockResolvedValue('Success');

      act(() => {
        screen.getByText('Translate Text').click();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });
  });

  describe('state setters', () => {
    beforeEach(() => {
      renderWithProvider(<TestComponent />);
    });

    it('should update original text', () => {
      act(() => {
        screen.getByText('Set Original Text').click();
      });

      expect(screen.getByTestId('original-text')).toHaveTextContent('New original text');
    });

    it('should update target language', () => {
      act(() => {
        screen.getByText('Set Target Language').click();
      });

      expect(screen.getByTestId('target-language')).toHaveTextContent('Spanish');
    });

    it('should update API key', () => {
      act(() => {
        screen.getByText('Set API Key').click();
      });

      expect(screen.getByTestId('api-key')).toHaveTextContent('new-api-key');
    });

    it('should update hotkey', () => {
      act(() => {
        screen.getByText('Set Hotkey').click();
      });

      expect(screen.getByTestId('hotkey')).toHaveTextContent('Ctrl+Shift+T');
    });

    it('should update theme', () => {
      act(() => {
        screen.getByText('Set Theme').click();
      });

      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    });
  });

  describe('useAppContext hook', () => {
    it('should provide context when used inside AppProvider', () => {
      const TestComponentInsideProvider: React.FC = () => {
        const context = useAppContext();
        expect(context).toBeDefined();
        expect(typeof context.processImage).toBe('function');
        expect(typeof context.translateText).toBe('function');
        return <div>Test</div>;
      };

      renderWithProvider(<TestComponentInsideProvider />);
    });

    it('should work with the main TestComponent', () => {
      renderWithProvider(<TestComponent />);
      
      // If we get here without errors, the context is working
      expect(screen.getByTestId('target-language')).toHaveTextContent('English');
    });
  });
});