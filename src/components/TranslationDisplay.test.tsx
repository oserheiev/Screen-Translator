import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import TranslationDisplay from './TranslationDisplay';

// Mock the ClipboardService
jest.mock('../services/clipboard.service', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      copyToClipboard: jest.fn(),
    })),
  };
});

describe('TranslationDisplay', () => {
  const defaultProps = {
    text: 'Translated text content',
    label: 'Translation',
  };

  let mockClipboardService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const ClipboardService = require('../services/clipboard.service').default;
    mockClipboardService = new ClipboardService();
  });

  describe('Rendering', () => {
    it('renders with correct label', () => {
      render(<TranslationDisplay {...defaultProps} />);
      
      expect(screen.getByText('Translation')).toBeInTheDocument();
    });

    it('renders copy button', () => {
      render(<TranslationDisplay {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('renders text content as read-only div', () => {
      render(<TranslationDisplay {...defaultProps} />);
      
      expect(screen.getByText('Translated text content')).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('shows placeholder when text is empty', () => {
      render(<TranslationDisplay {...defaultProps} text="" />);
      
      expect(screen.getByText('Translation will appear here')).toBeInTheDocument();
    });

    it('has correct CSS classes', () => {
      render(<TranslationDisplay {...defaultProps} />);
      
      expect(screen.getByText('Translation').closest('.text-display')).toBeInTheDocument();
      expect(screen.getByText('Translation').closest('.text-display-header')).toBeInTheDocument();
      expect(screen.getByText('Translated text content').closest('.text-display-content')).toBeInTheDocument();
    });

    it('displays different labels correctly', () => {
      const { rerender } = render(<TranslationDisplay text="Test" label="First Label" />);
      
      expect(screen.getByText('First Label')).toBeInTheDocument();
      
      rerender(<TranslationDisplay text="Test" label="Second Label" />);
      
      expect(screen.getByText('Second Label')).toBeInTheDocument();
      expect(screen.queryByText('First Label')).not.toBeInTheDocument();
    });

    it('updates text content when text prop changes', () => {
      const { rerender } = render(<TranslationDisplay {...defaultProps} text="Initial text" />);
      
      expect(screen.getByText('Initial text')).toBeInTheDocument();
      
      rerender(<TranslationDisplay {...defaultProps} text="Updated text" />);
      
      expect(screen.getByText('Updated text')).toBeInTheDocument();
      expect(screen.queryByText('Initial text')).not.toBeInTheDocument();
    });
  });

  describe('Copy Functionality', () => {
    it('calls clipboard service when copy button is clicked', async () => {
      mockClipboardService.copyToClipboard.mockResolvedValue(true);
      render(<TranslationDisplay {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      expect(mockClipboardService.copyToClipboard).toHaveBeenCalledWith('Translated text content');
    });

    it('shows "Copied!" when copy is successful', async () => {
      mockClipboardService.copyToClipboard.mockResolvedValue(true);
      render(<TranslationDisplay {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument();
      });
    });

    it('reverts to "Copy" after 2 seconds', async () => {
      jest.useFakeTimers();
      mockClipboardService.copyToClipboard.mockResolvedValue(true);
      render(<TranslationDisplay {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument();
      });
      
      jest.advanceTimersByTime(2000);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });

    it('does not show "Copied!" when copy fails', async () => {
      mockClipboardService.copyToClipboard.mockResolvedValue(false);
      render(<TranslationDisplay {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
      });
      
      expect(screen.queryByRole('button', { name: /copied!/i })).not.toBeInTheDocument();
    });

    it('disables copy button when text is empty', () => {
      render(<TranslationDisplay {...defaultProps} text="" />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      expect(copyButton).toBeDisabled();
    });

    it('enables copy button when text is not empty', () => {
      render(<TranslationDisplay {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      expect(copyButton).not.toBeDisabled();
    });

    it('does not call clipboard service when text is empty', async () => {
      render(<TranslationDisplay {...defaultProps} text="" />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      expect(mockClipboardService.copyToClipboard).not.toHaveBeenCalled();
    });

    it('handles clipboard service errors gracefully', async () => {
      mockClipboardService.copyToClipboard.mockRejectedValue(new Error('Clipboard error'));
      render(<TranslationDisplay {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      
      expect(() => fireEvent.click(copyButton)).not.toThrow();
    });

    it('handles multiple copy operations', async () => {
      mockClipboardService.copyToClipboard.mockResolvedValue(true);
      render(<TranslationDisplay {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      
      fireEvent.click(copyButton);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument();
      });
      
      fireEvent.click(copyButton);
      
      expect(mockClipboardService.copyToClipboard).toHaveBeenCalledTimes(2);
    });
  });

  describe('Read-only Behavior', () => {
    it('does not render any input elements', () => {
      render(<TranslationDisplay {...defaultProps} />);
      
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.queryByRole('input')).not.toBeInTheDocument();
    });

    it('displays text in a non-editable div', () => {
      render(<TranslationDisplay {...defaultProps} />);
      
      const textElement = screen.getByText('Translated text content');
      expect(textElement.tagName).toBe('DIV');
    });

    it('does not respond to text editing attempts', () => {
      render(<TranslationDisplay {...defaultProps} />);
      
      const textElement = screen.getByText('Translated text content');
      
      // Try to trigger change events (should not work)
      fireEvent.change(textElement, { target: { value: 'Should not change' } });
      
      expect(screen.getByText('Translated text content')).toBeInTheDocument();
    });

    it('maintains read-only state across re-renders', () => {
      const { rerender } = render(<TranslationDisplay {...defaultProps} />);
      
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      
      rerender(<TranslationDisplay {...defaultProps} text="Different text" />);
      
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByText('Different text')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('handles empty text gracefully', () => {
      render(<TranslationDisplay text="" label="Empty Translation" />);
      
      expect(screen.getByText('Empty Translation will appear here')).toBeInTheDocument();
    });

    it('handles long text content', () => {
      const longText = 'A'.repeat(1000);
      render(<TranslationDisplay text={longText} label="Long Text" />);
      
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('handles special characters in text', () => {
      const specialText = 'Text with émojis 🎉 and spëcial chars: <>&"\'';
      render(<TranslationDisplay text={specialText} label="Special Text" />);
      
      expect(screen.getByText(specialText)).toBeInTheDocument();
    });

    it('handles multiline text', () => {
      const multilineText = 'Line 1\nLine 2\nLine 3';
      render(<TranslationDisplay text={multilineText} label="Multiline" />);
      
      expect(screen.getByText(multilineText)).toBeInTheDocument();
    });

    it('handles different label values', () => {
      const { rerender } = render(<TranslationDisplay text="Test" label="First Label" />);
      
      expect(screen.getByText('First Label')).toBeInTheDocument();
      
      rerender(<TranslationDisplay text="Test" label="Second Label" />);
      
      expect(screen.getByText('Second Label')).toBeInTheDocument();
      expect(screen.queryByText('First Label')).not.toBeInTheDocument();
    });

    it('updates placeholder text based on label', () => {
      const { rerender } = render(<TranslationDisplay text="" label="Custom Label" />);
      
      expect(screen.getByText('Custom Label will appear here')).toBeInTheDocument();
      
      rerender(<TranslationDisplay text="" label="Different Label" />);
      
      expect(screen.getByText('Different Label will appear here')).toBeInTheDocument();
      expect(screen.queryByText('Custom Label will appear here')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper structure for screen readers', () => {
      render(<TranslationDisplay {...defaultProps} />);
      
      expect(screen.getByText('Translation')).toBeInTheDocument();
      expect(screen.getByText('Translated text content')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('copy button is focusable', () => {
      render(<TranslationDisplay {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      copyButton.focus();
      expect(copyButton).toHaveFocus();
    });

    it('has proper button text for screen readers', () => {
      render(<TranslationDisplay {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('updates button text for screen readers when copied', async () => {
      mockClipboardService.copyToClipboard.mockResolvedValue(true);
      render(<TranslationDisplay {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument();
      });
    });

    it('text content is accessible to screen readers', () => {
      render(<TranslationDisplay {...defaultProps} />);
      
      const textElement = screen.getByText('Translated text content');
      expect(textElement).toBeInTheDocument();
      expect(textElement).toBeVisible();
    });

    it('placeholder text is accessible when content is empty', () => {
      render(<TranslationDisplay text="" label="Empty Content" />);
      
      const placeholderElement = screen.getByText('Empty Content will appear here');
      expect(placeholderElement).toBeInTheDocument();
      expect(placeholderElement).toBeVisible();
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid copy button clicks', async () => {
      mockClipboardService.copyToClipboard.mockResolvedValue(true);
      render(<TranslationDisplay {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      
      fireEvent.click(copyButton);
      fireEvent.click(copyButton);
      fireEvent.click(copyButton);
      
      expect(mockClipboardService.copyToClipboard).toHaveBeenCalledTimes(3);
    });

    it('handles component unmounting during copy operation', async () => {
      jest.useFakeTimers();
      mockClipboardService.copyToClipboard.mockResolvedValue(true);
      
      const { unmount } = render(<TranslationDisplay {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      unmount();
      
      expect(() => jest.advanceTimersByTime(2000)).not.toThrow();
      
      jest.useRealTimers();
    });

    it('maintains copy state across re-renders', async () => {
      mockClipboardService.copyToClipboard.mockResolvedValue(true);
      const { rerender } = render(<TranslationDisplay {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument();
      });
      
      rerender(<TranslationDisplay {...defaultProps} text="Different text" />);
      
      expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument();
    });

    it('creates new clipboard service instance for each component', () => {
      const ClipboardService = require('../services/clipboard.service').default;
      
      render(<TranslationDisplay text="Test 1" label="Label 1" />);
      render(<TranslationDisplay text="Test 2" label="Label 2" />);
      
      expect(ClipboardService).toHaveBeenCalledTimes(2);
    });

    it('handles null or undefined text gracefully', () => {
      // @ts-ignore - Testing edge case with invalid props
      render(<TranslationDisplay text={null} label="Null Text" />);
      
      expect(screen.getByText('Null Text will appear here')).toBeInTheDocument();
    });

    it('handles very long labels', () => {
      const longLabel = 'A'.repeat(100);
      render(<TranslationDisplay text="Test" label={longLabel} />);
      
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });
  });

  describe('Comparison with TextDisplay', () => {
    it('behaves differently from TextDisplay (read-only vs editable)', () => {
      render(<TranslationDisplay {...defaultProps} />);
      
      // Should not have textarea (unlike TextDisplay)
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      
      // Should have text content in a div
      expect(screen.getByText('Translated text content')).toBeInTheDocument();
    });

    it('has same copy functionality as TextDisplay', async () => {
      mockClipboardService.copyToClipboard.mockResolvedValue(true);
      render(<TranslationDisplay {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument();
      });
      
      expect(mockClipboardService.copyToClipboard).toHaveBeenCalledWith('Translated text content');
    });
  });
});