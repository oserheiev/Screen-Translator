import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import TextDisplay from './TextDisplay';

// Mock the ClipboardService
jest.mock('../services/clipboard.service', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      copyToClipboard: jest.fn(),
    })),
  };
});

describe('TextDisplay', () => {
  const mockOnTextEdit = jest.fn();
  const defaultProps = {
    text: 'Sample text content',
    label: 'Original Text',
    onTextEdit: mockOnTextEdit,
  };

  let mockClipboardService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const ClipboardService = require('../services/clipboard.service').default;
    mockClipboardService = new ClipboardService();
  });

  describe('Rendering', () => {
    it('renders with correct label', () => {
      render(<TextDisplay {...defaultProps} />);
      
      expect(screen.getByText('Original Text')).toBeInTheDocument();
    });

    it('renders copy button', () => {
      render(<TextDisplay {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('renders textarea when editable is true', () => {
      render(<TextDisplay {...defaultProps} editable={true} />);
      
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders textarea by default (editable defaults to true)', () => {
      render(<TextDisplay {...defaultProps} />);
      
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders div when editable is false', () => {
      render(<TextDisplay {...defaultProps} editable={false} />);
      
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByText('Sample text content')).toBeInTheDocument();
    });

    it('displays text content in textarea', () => {
      render(<TextDisplay {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Sample text content');
    });

    it('displays text content in div when not editable', () => {
      render(<TextDisplay {...defaultProps} editable={false} />);
      
      expect(screen.getByText('Sample text content')).toBeInTheDocument();
    });

    it('shows placeholder when text is empty and editable', () => {
      render(<TextDisplay {...defaultProps} text="" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder', 'Original Text will appear here');
    });

    it('shows placeholder text when text is empty and not editable', () => {
      render(<TextDisplay {...defaultProps} text="" editable={false} />);
      
      expect(screen.getByText('Original Text will appear here')).toBeInTheDocument();
    });

    it('has correct CSS classes', () => {
      render(<TextDisplay {...defaultProps} />);
      
      expect(screen.getByText('Original Text').closest('.text-display')).toBeInTheDocument();
      expect(screen.getByText('Original Text').closest('.text-display-header')).toBeInTheDocument();
      expect(screen.getByRole('textbox').closest('.text-display-content')).toBeInTheDocument();
    });
  });

  describe('Copy Functionality', () => {
    it('calls clipboard service when copy button is clicked', async () => {
      mockClipboardService.copyToClipboard.mockResolvedValue(true);
      render(<TextDisplay {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      expect(mockClipboardService.copyToClipboard).toHaveBeenCalledWith('Sample text content');
    });

    it('shows "Copied!" when copy is successful', async () => {
      mockClipboardService.copyToClipboard.mockResolvedValue(true);
      render(<TextDisplay {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument();
      });
    });

    it('reverts to "Copy" after 2 seconds', async () => {
      jest.useFakeTimers();
      mockClipboardService.copyToClipboard.mockResolvedValue(true);
      render(<TextDisplay {...defaultProps} />);
      
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
      render(<TextDisplay {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
      });
      
      expect(screen.queryByRole('button', { name: /copied!/i })).not.toBeInTheDocument();
    });

    it('disables copy button when text is empty', () => {
      render(<TextDisplay {...defaultProps} text="" />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      expect(copyButton).toBeDisabled();
    });

    it('enables copy button when text is not empty', () => {
      render(<TextDisplay {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      expect(copyButton).not.toBeDisabled();
    });

    it('does not call clipboard service when text is empty', async () => {
      render(<TextDisplay {...defaultProps} text="" />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      expect(mockClipboardService.copyToClipboard).not.toHaveBeenCalled();
    });

    it('handles clipboard service errors gracefully', async () => {
      mockClipboardService.copyToClipboard.mockRejectedValue(new Error('Clipboard error'));
      render(<TextDisplay {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      
      expect(() => fireEvent.click(copyButton)).not.toThrow();
    });
  });

  describe('Text Editing', () => {
    it('calls onTextEdit when textarea value changes', () => {
      render(<TextDisplay {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Updated text' } });
      
      expect(mockOnTextEdit).toHaveBeenCalledWith('Updated text');
    });

    it('does not call onTextEdit when onTextEdit prop is not provided', () => {
      render(<TextDisplay text="Sample text" label="Test" />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Updated text' } });
      
      // Should not throw error
      expect(textarea).toHaveValue('Updated text');
    });

    it('updates textarea value when text prop changes', () => {
      const { rerender } = render(<TextDisplay {...defaultProps} text="Initial text" />);
      
      let textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Initial text');
      
      rerender(<TextDisplay {...defaultProps} text="Updated text" />);
      
      textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Updated text');
    });

    it('handles multiple text changes', () => {
      render(<TextDisplay {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      
      fireEvent.change(textarea, { target: { value: 'First change' } });
      expect(mockOnTextEdit).toHaveBeenCalledWith('First change');
      
      fireEvent.change(textarea, { target: { value: 'Second change' } });
      expect(mockOnTextEdit).toHaveBeenCalledWith('Second change');
      
      expect(mockOnTextEdit).toHaveBeenCalledTimes(2);
    });

    it('does not render textarea when editable is false', () => {
      render(<TextDisplay {...defaultProps} editable={false} />);
      
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('handles different label values', () => {
      const { rerender } = render(<TextDisplay {...defaultProps} label="First Label" />);
      
      expect(screen.getByText('First Label')).toBeInTheDocument();
      
      rerender(<TextDisplay {...defaultProps} label="Second Label" />);
      
      expect(screen.getByText('Second Label')).toBeInTheDocument();
      expect(screen.queryByText('First Label')).not.toBeInTheDocument();
    });

    it('handles empty text gracefully', () => {
      render(<TextDisplay {...defaultProps} text="" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('');
    });

    it('handles long text content', () => {
      const longText = 'A'.repeat(1000);
      render(<TextDisplay {...defaultProps} text={longText} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue(longText);
    });

    it('handles special characters in text', () => {
      const specialText = 'Text with émojis 🎉 and spëcial chars: <>&"\'';
      render(<TextDisplay {...defaultProps} text={specialText} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue(specialText);
    });

    it('updates editable state correctly', () => {
      const { rerender } = render(<TextDisplay {...defaultProps} editable={true} />);
      
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      
      rerender(<TextDisplay {...defaultProps} editable={false} />);
      
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByText('Sample text content')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper structure for screen readers', () => {
      render(<TextDisplay {...defaultProps} />);
      
      expect(screen.getByText('Original Text')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('textarea is focusable when editable', () => {
      render(<TextDisplay {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      textarea.focus();
      expect(textarea).toHaveFocus();
    });

    it('copy button is focusable', () => {
      render(<TextDisplay {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      copyButton.focus();
      expect(copyButton).toHaveFocus();
    });

    it('has proper button text for screen readers', () => {
      render(<TextDisplay {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('updates button text for screen readers when copied', async () => {
      mockClipboardService.copyToClipboard.mockResolvedValue(true);
      render(<TextDisplay {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid copy button clicks', async () => {
      mockClipboardService.copyToClipboard.mockResolvedValue(true);
      render(<TextDisplay {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      
      fireEvent.click(copyButton);
      fireEvent.click(copyButton);
      fireEvent.click(copyButton);
      
      expect(mockClipboardService.copyToClipboard).toHaveBeenCalledTimes(3);
    });

    it('handles component unmounting during copy operation', async () => {
      jest.useFakeTimers();
      mockClipboardService.copyToClipboard.mockResolvedValue(true);
      
      const { unmount } = render(<TextDisplay {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      unmount();
      
      expect(() => jest.advanceTimersByTime(2000)).not.toThrow();
      
      jest.useRealTimers();
    });

    it('maintains copy state across re-renders', async () => {
      mockClipboardService.copyToClipboard.mockResolvedValue(true);
      const { rerender } = render(<TextDisplay {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument();
      });
      
      rerender(<TextDisplay {...defaultProps} text="Different text" />);
      
      expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument();
    });

    it('creates new clipboard service instance for each component', () => {
      const ClipboardService = require('../services/clipboard.service').default;
      
      render(<TextDisplay {...defaultProps} />);
      render(<TextDisplay {...defaultProps} />);
      
      expect(ClipboardService).toHaveBeenCalledTimes(2);
    });
  });
});