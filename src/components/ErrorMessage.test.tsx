import React from 'react';
import { render, screen, fireEvent } from '../test-utils';
import ErrorMessage from './ErrorMessage';

describe('ErrorMessage', () => {
  const defaultProps = {
    message: 'An error occurred',
  };

  describe('Rendering', () => {
    it('renders error message text', () => {
      render(<ErrorMessage {...defaultProps} />);
      
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });

    it('renders with correct CSS class', () => {
      render(<ErrorMessage {...defaultProps} />);
      
      const errorElement = screen.getByText('An error occurred').closest('.error-message');
      expect(errorElement).toBeInTheDocument();
    });

    it('renders message in a paragraph element', () => {
      render(<ErrorMessage {...defaultProps} />);
      
      const messageElement = screen.getByText('An error occurred');
      expect(messageElement.tagName).toBe('P');
    });

    it('renders retry button when onRetry is provided', () => {
      const mockOnRetry = jest.fn();
      render(<ErrorMessage {...defaultProps} onRetry={mockOnRetry} />);
      
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('does not render retry button when onRetry is not provided', () => {
      render(<ErrorMessage {...defaultProps} />);
      
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });

    it('retry button has correct CSS class', () => {
      const mockOnRetry = jest.fn();
      render(<ErrorMessage {...defaultProps} onRetry={mockOnRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toHaveClass('retry-button');
    });
  });

  describe('Message Content', () => {
    it('displays different error messages correctly', () => {
      const { rerender } = render(<ErrorMessage message="First error" />);
      
      expect(screen.getByText('First error')).toBeInTheDocument();
      
      rerender(<ErrorMessage message="Second error" />);
      
      expect(screen.getByText('Second error')).toBeInTheDocument();
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
    });

    it('handles empty message', () => {
      render(<ErrorMessage message="" />);
      
      expect(screen.getByText('')).toBeInTheDocument();
    });

    it('handles long error messages', () => {
      const longMessage = 'This is a very long error message that might wrap to multiple lines and should still be displayed correctly without breaking the layout or functionality of the component.';
      render(<ErrorMessage message={longMessage} />);
      
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('handles special characters in message', () => {
      const specialMessage = 'Error with émojis 🚨 and spëcial chars: <>&"\'';
      render(<ErrorMessage message={specialMessage} />);
      
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it('handles multiline error messages', () => {
      const multilineMessage = 'Line 1 of error\nLine 2 of error\nLine 3 of error';
      render(<ErrorMessage message={multilineMessage} />);
      
      expect(screen.getByText(multilineMessage)).toBeInTheDocument();
    });

    it('handles HTML-like content safely', () => {
      const htmlMessage = '<script>alert("xss")</script>Error message';
      render(<ErrorMessage message={htmlMessage} />);
      
      expect(screen.getByText(htmlMessage)).toBeInTheDocument();
      // Should not execute script
      expect(document.querySelector('script')).not.toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('calls onRetry when retry button is clicked', () => {
      const mockOnRetry = jest.fn();
      render(<ErrorMessage {...defaultProps} onRetry={mockOnRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);
      
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('calls onRetry multiple times when clicked multiple times', () => {
      const mockOnRetry = jest.fn();
      render(<ErrorMessage {...defaultProps} onRetry={mockOnRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);
      
      expect(mockOnRetry).toHaveBeenCalledTimes(3);
    });

    it('does not call onRetry when button is not present', () => {
      const mockOnRetry = jest.fn();
      render(<ErrorMessage {...defaultProps} />);
      
      // No retry button should be present
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
      expect(mockOnRetry).not.toHaveBeenCalled();
    });

    it('handles onRetry function changes', () => {
      const firstMockOnRetry = jest.fn();
      const secondMockOnRetry = jest.fn();
      
      const { rerender } = render(<ErrorMessage {...defaultProps} onRetry={firstMockOnRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);
      
      expect(firstMockOnRetry).toHaveBeenCalledTimes(1);
      expect(secondMockOnRetry).not.toHaveBeenCalled();
      
      rerender(<ErrorMessage {...defaultProps} onRetry={secondMockOnRetry} />);
      
      fireEvent.click(retryButton);
      
      expect(firstMockOnRetry).toHaveBeenCalledTimes(1); // Still 1
      expect(secondMockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('handles removal of onRetry prop', () => {
      const mockOnRetry = jest.fn();
      const { rerender } = render(<ErrorMessage {...defaultProps} onRetry={mockOnRetry} />);
      
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      
      rerender(<ErrorMessage {...defaultProps} />);
      
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });

    it('handles addition of onRetry prop', () => {
      const mockOnRetry = jest.fn();
      const { rerender } = render(<ErrorMessage {...defaultProps} />);
      
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
      
      rerender(<ErrorMessage {...defaultProps} onRetry={mockOnRetry} />);
      
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper structure for screen readers', () => {
      const mockOnRetry = jest.fn();
      render(<ErrorMessage {...defaultProps} onRetry={mockOnRetry} />);
      
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('retry button is focusable', () => {
      const mockOnRetry = jest.fn();
      render(<ErrorMessage {...defaultProps} onRetry={mockOnRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      retryButton.focus();
      
      expect(retryButton).toHaveFocus();
    });

    it('retry button can be activated with keyboard', () => {
      const mockOnRetry = jest.fn();
      render(<ErrorMessage {...defaultProps} onRetry={mockOnRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      retryButton.focus();
      
      fireEvent.keyDown(retryButton, { key: 'Enter', code: 'Enter' });
      
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('retry button can be activated with space key', () => {
      const mockOnRetry = jest.fn();
      render(<ErrorMessage {...defaultProps} onRetry={mockOnRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      retryButton.focus();
      
      fireEvent.keyDown(retryButton, { key: ' ', code: 'Space' });
      
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('error message is accessible to screen readers', () => {
      render(<ErrorMessage {...defaultProps} />);
      
      const messageElement = screen.getByText('An error occurred');
      expect(messageElement).toBeInTheDocument();
      expect(messageElement).toBeVisible();
    });

    it('has proper button role', () => {
      const mockOnRetry = jest.fn();
      render(<ErrorMessage {...defaultProps} onRetry={mockOnRetry} />);
      
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('error message has semantic meaning', () => {
      render(<ErrorMessage {...defaultProps} />);
      
      const errorContainer = screen.getByText('An error occurred').closest('.error-message');
      expect(errorContainer).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('handles undefined onRetry prop', () => {
      render(<ErrorMessage message="Test error" onRetry={undefined} />);
      
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });

    it('handles null onRetry prop', () => {
      // @ts-ignore - Testing edge case
      render(<ErrorMessage message="Test error" onRetry={null} />);
      
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });

    it('handles different message types', () => {
      const { rerender } = render(<ErrorMessage message="String message" />);
      
      expect(screen.getByText('String message')).toBeInTheDocument();
      
      // Test with number (edge case)
      // @ts-ignore - Testing edge case
      rerender(<ErrorMessage message={123} />);
      
      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('updates message when prop changes', () => {
      const { rerender } = render(<ErrorMessage message="Initial error" />);
      
      expect(screen.getByText('Initial error')).toBeInTheDocument();
      
      rerender(<ErrorMessage message="Updated error" />);
      
      expect(screen.getByText('Updated error')).toBeInTheDocument();
      expect(screen.queryByText('Initial error')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid retry button clicks', () => {
      const mockOnRetry = jest.fn();
      render(<ErrorMessage {...defaultProps} onRetry={mockOnRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      
      // Rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(retryButton);
      }
      
      expect(mockOnRetry).toHaveBeenCalledTimes(10);
    });

    it('handles component unmounting gracefully', () => {
      const mockOnRetry = jest.fn();
      const { unmount } = render(<ErrorMessage {...defaultProps} onRetry={mockOnRetry} />);
      
      expect(() => unmount()).not.toThrow();
    });

    it('maintains state during re-renders with same props', () => {
      const mockOnRetry = jest.fn();
      const { rerender } = render(<ErrorMessage message="Test error" onRetry={mockOnRetry} />);
      
      expect(screen.getByText('Test error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      
      rerender(<ErrorMessage message="Test error" onRetry={mockOnRetry} />);
      
      expect(screen.getByText('Test error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('handles onRetry throwing errors', () => {
      const mockOnRetry = jest.fn(() => {
        throw new Error('Retry failed');
      });
      
      render(<ErrorMessage {...defaultProps} onRetry={mockOnRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      
      expect(() => fireEvent.click(retryButton)).toThrow('Retry failed');
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('handles very long messages without breaking layout', () => {
      const veryLongMessage = 'A'.repeat(10000);
      render(<ErrorMessage message={veryLongMessage} />);
      
      expect(screen.getByText(veryLongMessage)).toBeInTheDocument();
    });

    it('handles empty string message', () => {
      render(<ErrorMessage message="" />);
      
      const messageElement = screen.getByText('');
      expect(messageElement).toBeInTheDocument();
      expect(messageElement.tagName).toBe('P');
    });

    it('handles whitespace-only message', () => {
      const whitespaceMessage = '   \n\t   ';
      render(<ErrorMessage message={whitespaceMessage} />);
      
      expect(screen.getByText(whitespaceMessage)).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('has correct DOM structure without retry button', () => {
      render(<ErrorMessage {...defaultProps} />);
      
      const container = screen.getByText('An error occurred').closest('.error-message');
      expect(container).toBeInTheDocument();
      expect(container?.children).toHaveLength(1); // Only the paragraph
      expect(container?.querySelector('p')).toBeInTheDocument();
      expect(container?.querySelector('button')).not.toBeInTheDocument();
    });

    it('has correct DOM structure with retry button', () => {
      const mockOnRetry = jest.fn();
      render(<ErrorMessage {...defaultProps} onRetry={mockOnRetry} />);
      
      const container = screen.getByText('An error occurred').closest('.error-message');
      expect(container).toBeInTheDocument();
      expect(container?.children).toHaveLength(2); // Paragraph and button
      expect(container?.querySelector('p')).toBeInTheDocument();
      expect(container?.querySelector('button')).toBeInTheDocument();
    });

    it('maintains proper element order', () => {
      const mockOnRetry = jest.fn();
      render(<ErrorMessage {...defaultProps} onRetry={mockOnRetry} />);
      
      const container = screen.getByText('An error occurred').closest('.error-message');
      const children = container?.children;
      
      expect(children?.[0].tagName).toBe('P');
      expect(children?.[1].tagName).toBe('BUTTON');
    });
  });
});