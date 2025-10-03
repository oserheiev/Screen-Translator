import React from 'react';
import { render, screen, fireEvent } from '../test-utils';
import CaptureButton from './CaptureButton';

describe('CaptureButton', () => {
  const mockOnCapture = jest.fn();

  beforeEach(() => {
    mockOnCapture.mockClear();
  });

  describe('Rendering', () => {
    it('renders with correct text', () => {
      render(<CaptureButton onCapture={mockOnCapture} />);
      
      expect(screen.getByRole('button', { name: /capture screen/i })).toBeInTheDocument();
    });

    it('renders with correct CSS class', () => {
      render(<CaptureButton onCapture={mockOnCapture} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('capture-button');
    });

    it('is enabled by default', () => {
      render(<CaptureButton onCapture={mockOnCapture} />);
      
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('is disabled when disabled prop is true', () => {
      render(<CaptureButton onCapture={mockOnCapture} disabled={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('is enabled when disabled prop is false', () => {
      render(<CaptureButton onCapture={mockOnCapture} disabled={false} />);
      
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('calls onCapture when clicked', () => {
      render(<CaptureButton onCapture={mockOnCapture} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOnCapture).toHaveBeenCalledTimes(1);
    });

    it('calls onCapture multiple times when clicked multiple times', () => {
      render(<CaptureButton onCapture={mockOnCapture} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(mockOnCapture).toHaveBeenCalledTimes(3);
    });

    it('does not call onCapture when disabled and clicked', () => {
      render(<CaptureButton onCapture={mockOnCapture} disabled={true} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOnCapture).not.toHaveBeenCalled();
    });
  });

  describe('Props Handling', () => {
    it('handles undefined disabled prop correctly', () => {
      render(<CaptureButton onCapture={mockOnCapture} />);
      
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('updates when disabled prop changes', () => {
      const { rerender } = render(<CaptureButton onCapture={mockOnCapture} disabled={false} />);
      
      let button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
      
      rerender(<CaptureButton onCapture={mockOnCapture} disabled={true} />);
      
      button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('updates when onCapture prop changes', () => {
      const newMockOnCapture = jest.fn();
      const { rerender } = render(<CaptureButton onCapture={mockOnCapture} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(mockOnCapture).toHaveBeenCalledTimes(1);
      expect(newMockOnCapture).not.toHaveBeenCalled();
      
      rerender(<CaptureButton onCapture={newMockOnCapture} />);
      
      fireEvent.click(button);
      expect(mockOnCapture).toHaveBeenCalledTimes(1); // Still 1 from before
      expect(newMockOnCapture).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper button role', () => {
      render(<CaptureButton onCapture={mockOnCapture} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('is focusable when enabled', () => {
      render(<CaptureButton onCapture={mockOnCapture} />);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('is not focusable when disabled', () => {
      render(<CaptureButton onCapture={mockOnCapture} disabled={true} />);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).not.toHaveFocus();
    });

    it('can be activated with keyboard', () => {
      render(<CaptureButton onCapture={mockOnCapture} />);
      
      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      
      expect(mockOnCapture).toHaveBeenCalledTimes(1);
    });

    it('can be activated with space key', () => {
      render(<CaptureButton onCapture={mockOnCapture} />);
      
      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      
      expect(mockOnCapture).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid clicks correctly', () => {
      render(<CaptureButton onCapture={mockOnCapture} />);
      
      const button = screen.getByRole('button');
      
      // Simulate rapid clicking
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }
      
      expect(mockOnCapture).toHaveBeenCalledTimes(10);
    });

    it('maintains state when re-rendered with same props', () => {
      const { rerender } = render(<CaptureButton onCapture={mockOnCapture} disabled={false} />);
      
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
      
      rerender(<CaptureButton onCapture={mockOnCapture} disabled={false} />);
      
      expect(button).not.toBeDisabled();
      fireEvent.click(button);
      expect(mockOnCapture).toHaveBeenCalledTimes(1);
    });
  });
});