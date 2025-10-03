import React from 'react';
import { render, screen } from '../test-utils';
import ThemeProvider from './ThemeProvider';
import { useAppContext } from '../contexts/AppContext';

// Mock the useAppContext hook
jest.mock('../contexts/AppContext', () => ({
  useAppContext: jest.fn(),
}));

// Mock window.matchMedia
const mockMatchMedia = jest.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

describe('ThemeProvider', () => {
  const mockUseAppContext = useAppContext as jest.MockedFunction<typeof useAppContext>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset document classes
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    
    // Default mock implementation
    mockUseAppContext.mockReturnValue({
      theme: 'light',
      originalText: '',
      translatedText: '',
      targetLanguage: 'English',
      apiKey: '',
      hotkey: '',
      isProcessing: false,
      error: null,
      setOriginalText: jest.fn(),
      setTargetLanguage: jest.fn(),
      setApiKey: jest.fn(),
      setHotkey: jest.fn(),
      setTheme: jest.fn(),
      processImage: jest.fn(),
      translateText: jest.fn(),
      clearError: jest.fn(),
    });
    
    // Default matchMedia mock
    mockMatchMedia.mockReturnValue({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    });
  });

  describe('Rendering', () => {
    it('renders children correctly', () => {
      render(
        <ThemeProvider>
          <div data-testid="child">Test Child</div>
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('renders multiple children correctly', () => {
      render(
        <ThemeProvider>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
          <span data-testid="child3">Child 3</span>
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
      expect(screen.getByTestId('child3')).toBeInTheDocument();
    });

    it('renders without children', () => {
      expect(() => render(<ThemeProvider />)).not.toThrow();
    });

    it('renders with null children', () => {
      expect(() => render(<ThemeProvider>{null}</ThemeProvider>)).not.toThrow();
    });

    it('renders with undefined children', () => {
      expect(() => render(<ThemeProvider>{undefined}</ThemeProvider>)).not.toThrow();
    });
  });

  describe('Light Theme', () => {
    it('applies light theme class when theme is light', () => {
      mockUseAppContext.mockReturnValue({
        theme: 'light',
        originalText: '',
        translatedText: '',
        targetLanguage: 'English',
        apiKey: '',
        hotkey: '',
        isProcessing: false,
        error: null,
        setOriginalText: jest.fn(),
        setTargetLanguage: jest.fn(),
        setApiKey: jest.fn(),
        setHotkey: jest.fn(),
        setTheme: jest.fn(),
        processImage: jest.fn(),
        translateText: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('theme-light')).toBe(true);
      expect(document.documentElement.classList.contains('theme-dark')).toBe(false);
    });

    it('removes existing theme classes before applying light theme', () => {
      // Pre-add dark theme class
      document.documentElement.classList.add('theme-dark');
      
      mockUseAppContext.mockReturnValue({
        theme: 'light',
        originalText: '',
        translatedText: '',
        targetLanguage: 'English',
        apiKey: '',
        hotkey: '',
        isProcessing: false,
        error: null,
        setOriginalText: jest.fn(),
        setTargetLanguage: jest.fn(),
        setApiKey: jest.fn(),
        setHotkey: jest.fn(),
        setTheme: jest.fn(),
        processImage: jest.fn(),
        translateText: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('theme-light')).toBe(true);
      expect(document.documentElement.classList.contains('theme-dark')).toBe(false);
    });
  });

  describe('Dark Theme', () => {
    it('applies dark theme class when theme is dark', () => {
      mockUseAppContext.mockReturnValue({
        theme: 'dark',
        originalText: '',
        translatedText: '',
        targetLanguage: 'English',
        apiKey: '',
        hotkey: '',
        isProcessing: false,
        error: null,
        setOriginalText: jest.fn(),
        setTargetLanguage: jest.fn(),
        setApiKey: jest.fn(),
        setHotkey: jest.fn(),
        setTheme: jest.fn(),
        processImage: jest.fn(),
        translateText: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
      expect(document.documentElement.classList.contains('theme-light')).toBe(false);
    });

    it('removes existing theme classes before applying dark theme', () => {
      // Pre-add light theme class
      document.documentElement.classList.add('theme-light');
      
      mockUseAppContext.mockReturnValue({
        theme: 'dark',
        originalText: '',
        translatedText: '',
        targetLanguage: 'English',
        apiKey: '',
        hotkey: '',
        isProcessing: false,
        error: null,
        setOriginalText: jest.fn(),
        setTargetLanguage: jest.fn(),
        setApiKey: jest.fn(),
        setHotkey: jest.fn(),
        setTheme: jest.fn(),
        processImage: jest.fn(),
        translateText: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
      expect(document.documentElement.classList.contains('theme-light')).toBe(false);
    });
  });

  describe('System Theme', () => {
    it('applies light theme when system preference is light', () => {
      mockMatchMedia.mockReturnValue({
        matches: false, // prefers-color-scheme: dark is false
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      });

      mockUseAppContext.mockReturnValue({
        theme: 'system',
        originalText: '',
        translatedText: '',
        targetLanguage: 'English',
        apiKey: '',
        hotkey: '',
        isProcessing: false,
        error: null,
        setOriginalText: jest.fn(),
        setTargetLanguage: jest.fn(),
        setApiKey: jest.fn(),
        setHotkey: jest.fn(),
        setTheme: jest.fn(),
        processImage: jest.fn(),
        translateText: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(document.documentElement.classList.contains('theme-light')).toBe(true);
      expect(document.documentElement.classList.contains('theme-dark')).toBe(false);
    });

    it('applies dark theme when system preference is dark', () => {
      mockMatchMedia.mockReturnValue({
        matches: true, // prefers-color-scheme: dark is true
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      });

      mockUseAppContext.mockReturnValue({
        theme: 'system',
        originalText: '',
        translatedText: '',
        targetLanguage: 'English',
        apiKey: '',
        hotkey: '',
        isProcessing: false,
        error: null,
        setOriginalText: jest.fn(),
        setTargetLanguage: jest.fn(),
        setApiKey: jest.fn(),
        setHotkey: jest.fn(),
        setTheme: jest.fn(),
        processImage: jest.fn(),
        translateText: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
      expect(document.documentElement.classList.contains('theme-light')).toBe(false);
    });

    it('queries system preference correctly', () => {
      mockUseAppContext.mockReturnValue({
        theme: 'system',
        originalText: '',
        translatedText: '',
        targetLanguage: 'English',
        apiKey: '',
        hotkey: '',
        isProcessing: false,
        error: null,
        setOriginalText: jest.fn(),
        setTargetLanguage: jest.fn(),
        setApiKey: jest.fn(),
        setHotkey: jest.fn(),
        setTheme: jest.fn(),
        processImage: jest.fn(),
        translateText: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });
  });

  describe('Theme Changes', () => {
    it('updates theme when context theme changes', () => {
      const { rerender } = render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      // Initially light theme
      expect(document.documentElement.classList.contains('theme-light')).toBe(true);

      // Change to dark theme
      mockUseAppContext.mockReturnValue({
        theme: 'dark',
        originalText: '',
        translatedText: '',
        targetLanguage: 'English',
        apiKey: '',
        hotkey: '',
        isProcessing: false,
        error: null,
        setOriginalText: jest.fn(),
        setTargetLanguage: jest.fn(),
        setApiKey: jest.fn(),
        setHotkey: jest.fn(),
        setTheme: jest.fn(),
        processImage: jest.fn(),
        translateText: jest.fn(),
        clearError: jest.fn(),
      });

      rerender(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
      expect(document.documentElement.classList.contains('theme-light')).toBe(false);
    });

    it('switches from explicit theme to system theme', () => {
      mockMatchMedia.mockReturnValue({
        matches: true, // System prefers dark
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      });

      const { rerender } = render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      // Initially light theme
      expect(document.documentElement.classList.contains('theme-light')).toBe(true);

      // Change to system theme (which should be dark)
      mockUseAppContext.mockReturnValue({
        theme: 'system',
        originalText: '',
        translatedText: '',
        targetLanguage: 'English',
        apiKey: '',
        hotkey: '',
        isProcessing: false,
        error: null,
        setOriginalText: jest.fn(),
        setTargetLanguage: jest.fn(),
        setApiKey: jest.fn(),
        setHotkey: jest.fn(),
        setTheme: jest.fn(),
        processImage: jest.fn(),
        translateText: jest.fn(),
        clearError: jest.fn(),
      });

      rerender(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
      expect(document.documentElement.classList.contains('theme-light')).toBe(false);
    });

    it('switches from system theme to explicit theme', () => {
      mockMatchMedia.mockReturnValue({
        matches: true, // System prefers dark
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      });

      mockUseAppContext.mockReturnValue({
        theme: 'system',
        originalText: '',
        translatedText: '',
        targetLanguage: 'English',
        apiKey: '',
        hotkey: '',
        isProcessing: false,
        error: null,
        setOriginalText: jest.fn(),
        setTargetLanguage: jest.fn(),
        setApiKey: jest.fn(),
        setHotkey: jest.fn(),
        setTheme: jest.fn(),
        processImage: jest.fn(),
        translateText: jest.fn(),
        clearError: jest.fn(),
      });

      const { rerender } = render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      // Initially system theme (dark)
      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);

      // Change to explicit light theme
      mockUseAppContext.mockReturnValue({
        theme: 'light',
        originalText: '',
        translatedText: '',
        targetLanguage: 'English',
        apiKey: '',
        hotkey: '',
        isProcessing: false,
        error: null,
        setOriginalText: jest.fn(),
        setTargetLanguage: jest.fn(),
        setApiKey: jest.fn(),
        setHotkey: jest.fn(),
        setTheme: jest.fn(),
        processImage: jest.fn(),
        translateText: jest.fn(),
        clearError: jest.fn(),
      });

      rerender(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('theme-light')).toBe(true);
      expect(document.documentElement.classList.contains('theme-dark')).toBe(false);
    });
  });

  describe('Context Integration', () => {
    it('calls useAppContext to get theme', () => {
      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(mockUseAppContext).toHaveBeenCalled();
    });

    it('responds to context changes', () => {
      let contextValue = {
        theme: 'light' as const,
        originalText: '',
        translatedText: '',
        targetLanguage: 'English' as const,
        apiKey: '',
        hotkey: '',
        isProcessing: false,
        error: null,
        setOriginalText: jest.fn(),
        setTargetLanguage: jest.fn(),
        setApiKey: jest.fn(),
        setHotkey: jest.fn(),
        setTheme: jest.fn(),
        processImage: jest.fn(),
        translateText: jest.fn(),
        clearError: jest.fn(),
      };

      mockUseAppContext.mockReturnValue(contextValue);

      const { rerender } = render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('theme-light')).toBe(true);

      // Update context
      contextValue = { ...contextValue, theme: 'dark' };
      mockUseAppContext.mockReturnValue(contextValue);

      rerender(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles invalid theme values gracefully', () => {
      mockUseAppContext.mockReturnValue({
        // @ts-ignore - Testing invalid theme
        theme: 'invalid-theme',
        originalText: '',
        translatedText: '',
        targetLanguage: 'English',
        apiKey: '',
        hotkey: '',
        isProcessing: false,
        error: null,
        setOriginalText: jest.fn(),
        setTargetLanguage: jest.fn(),
        setApiKey: jest.fn(),
        setHotkey: jest.fn(),
        setTheme: jest.fn(),
        processImage: jest.fn(),
        translateText: jest.fn(),
        clearError: jest.fn(),
      });

      expect(() => render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      )).not.toThrow();

      // Should apply the invalid theme as-is
      expect(document.documentElement.classList.contains('theme-invalid-theme')).toBe(true);
    });

    it('handles matchMedia not being available', () => {
      // Remove matchMedia
      delete (window as any).matchMedia;

      mockUseAppContext.mockReturnValue({
        theme: 'system',
        originalText: '',
        translatedText: '',
        targetLanguage: 'English',
        apiKey: '',
        hotkey: '',
        isProcessing: false,
        error: null,
        setOriginalText: jest.fn(),
        setTargetLanguage: jest.fn(),
        setApiKey: jest.fn(),
        setHotkey: jest.fn(),
        setTheme: jest.fn(),
        processImage: jest.fn(),
        translateText: jest.fn(),
        clearError: jest.fn(),
      });

      expect(() => render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      )).toThrow();

      // Restore matchMedia
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });
    });

    it('handles component unmounting gracefully', () => {
      const { unmount } = render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(() => unmount()).not.toThrow();
    });

    it('handles rapid theme changes', () => {
      const { rerender } = render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      const themes = ['light', 'dark', 'system', 'light', 'dark'] as const;
      
      themes.forEach(theme => {
        mockUseAppContext.mockReturnValue({
          theme,
          originalText: '',
          translatedText: '',
          targetLanguage: 'English',
          apiKey: '',
          hotkey: '',
          isProcessing: false,
          error: null,
          setOriginalText: jest.fn(),
          setTargetLanguage: jest.fn(),
          setApiKey: jest.fn(),
          setHotkey: jest.fn(),
          setTheme: jest.fn(),
          processImage: jest.fn(),
          translateText: jest.fn(),
          clearError: jest.fn(),
        });

        rerender(
          <ThemeProvider>
            <div>Test</div>
          </ThemeProvider>
        );
      });

      // Should end with dark theme
      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    });

    it('handles null or undefined children gracefully', () => {
      expect(() => render(<ThemeProvider>{null}</ThemeProvider>)).not.toThrow();
      expect(() => render(<ThemeProvider>{undefined}</ThemeProvider>)).not.toThrow();
      expect(() => render(<ThemeProvider />)).not.toThrow();
    });

    it('preserves other document classes', () => {
      document.documentElement.classList.add('other-class', 'another-class');

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('other-class')).toBe(true);
      expect(document.documentElement.classList.contains('another-class')).toBe(true);
      expect(document.documentElement.classList.contains('theme-light')).toBe(true);
    });
  });

  describe('System Theme Detection', () => {
    it('correctly detects system dark mode preference', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      });

      mockUseAppContext.mockReturnValue({
        theme: 'system',
        originalText: '',
        translatedText: '',
        targetLanguage: 'English',
        apiKey: '',
        hotkey: '',
        isProcessing: false,
        error: null,
        setOriginalText: jest.fn(),
        setTargetLanguage: jest.fn(),
        setApiKey: jest.fn(),
        setHotkey: jest.fn(),
        setTheme: jest.fn(),
        processImage: jest.fn(),
        translateText: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    });

    it('correctly detects system light mode preference', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      });

      mockUseAppContext.mockReturnValue({
        theme: 'system',
        originalText: '',
        translatedText: '',
        targetLanguage: 'English',
        apiKey: '',
        hotkey: '',
        isProcessing: false,
        error: null,
        setOriginalText: jest.fn(),
        setTargetLanguage: jest.fn(),
        setApiKey: jest.fn(),
        setHotkey: jest.fn(),
        setTheme: jest.fn(),
        processImage: jest.fn(),
        translateText: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('theme-light')).toBe(true);
    });
  });
});