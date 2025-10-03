import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import SettingsModal from './SettingsModal';
import { Theme } from '../types';

describe('SettingsModal', () => {
  const defaultProps = {
    apiKey: 'test-api-key',
    hotkey: 'Ctrl+Alt+T',
    theme: 'light' as Theme,
    onApiKeyChange: jest.fn(),
    onHotkeyChange: jest.fn(),
    onThemeChange: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders settings modal with correct title', () => {
      render(<SettingsModal {...defaultProps} />);
      
      expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
    });

    it('renders welcome modal for first run', () => {
      render(<SettingsModal {...defaultProps} isFirstRun={true} />);
      
      expect(screen.getByRole('heading', { name: /welcome to screen translator/i })).toBeInTheDocument();
    });

    it('shows close button for regular settings modal', () => {
      render(<SettingsModal {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /×/i })).toBeInTheDocument();
    });

    it('does not show close button for first run modal', () => {
      render(<SettingsModal {...defaultProps} isFirstRun={true} />);
      
      expect(screen.queryByRole('button', { name: /×/i })).not.toBeInTheDocument();
    });

    it('shows welcome message for first run', () => {
      render(<SettingsModal {...defaultProps} isFirstRun={true} />);
      
      expect(screen.getByText(/to use screen translator, you need to set up your gemini api key/i)).toBeInTheDocument();
    });

    it('renders API key input with correct value', () => {
      render(<SettingsModal {...defaultProps} />);
      
      const input = screen.getByLabelText(/gemini api key/i);
      expect(input).toHaveValue('test-api-key');
    });

    it('renders hotkey input with correct value', () => {
      render(<SettingsModal {...defaultProps} />);
      
      const input = screen.getByLabelText(/global hotkey/i);
      expect(input).toHaveValue('Ctrl+Alt+T');
    });

    it('renders theme selector with correct value', () => {
      render(<SettingsModal {...defaultProps} />);
      
      const select = screen.getByLabelText(/theme/i);
      expect(select).toHaveValue('light');
    });

    it('does not show hotkey and theme inputs for first run', () => {
      render(<SettingsModal {...defaultProps} isFirstRun={true} />);
      
      expect(screen.queryByLabelText(/global hotkey/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/theme/i)).not.toBeInTheDocument();
    });

    it('shows Get Started button for first run', () => {
      render(<SettingsModal {...defaultProps} isFirstRun={true} />);
      
      expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
    });

    it('shows Save button for regular settings', () => {
      render(<SettingsModal {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('shows Cancel button for regular settings', () => {
      render(<SettingsModal {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('does not show Cancel button for first run', () => {
      render(<SettingsModal {...defaultProps} isFirstRun={true} />);
      
      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });

    it('renders API key link', () => {
      render(<SettingsModal {...defaultProps} />);
      
      const link = screen.getByRole('link', { name: /get a gemini api key/i });
      expect(link).toHaveAttribute('href', 'https://aistudio.google.com/app/apikey');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders theme options correctly', () => {
      render(<SettingsModal {...defaultProps} />);
      
      expect(screen.getByRole('option', { name: /light/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /dark/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /system default/i })).toBeInTheDocument();
    });

    it('renders hotkey help text', () => {
      render(<SettingsModal {...defaultProps} />);
      
      expect(screen.getByText(/use format like ctrl\+alt\+t or command\+shift\+s/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows error when API key is empty on submit', async () => {
      render(<SettingsModal {...defaultProps} apiKey="" />);
      
      const apiKeyInput = screen.getByLabelText(/gemini api key/i);
      fireEvent.change(apiKeyInput, { target: { value: '' } });
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/api key is required/i)).toBeInTheDocument();
      });
    });

    it('shows error when API key is only whitespace on submit', async () => {
      render(<SettingsModal {...defaultProps} apiKey="" />);
      
      const apiKeyInput = screen.getByLabelText(/gemini api key/i);
      fireEvent.change(apiKeyInput, { target: { value: '   ' } });
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/api key is required/i)).toBeInTheDocument();
      });
    });

    it('clears error when API key is entered', async () => {
      render(<SettingsModal {...defaultProps} apiKey="" />);
      
      const apiKeyInput = screen.getByLabelText(/gemini api key/i);
      const saveButton = screen.getByRole('button', { name: /save/i });
      
      // Trigger error
      fireEvent.click(saveButton);
      await waitFor(() => {
        expect(screen.getByText(/api key is required/i)).toBeInTheDocument();
      });
      
      // Clear error by typing
      fireEvent.change(apiKeyInput, { target: { value: 'new-api-key' } });
      
      expect(screen.queryByText(/api key is required/i)).not.toBeInTheDocument();
    });

    it('does not submit when API key is invalid', async () => {
      render(<SettingsModal {...defaultProps} apiKey="" />);
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/api key is required/i)).toBeInTheDocument();
      });
      
      expect(defaultProps.onApiKeyChange).not.toHaveBeenCalled();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    it('calls onApiKeyChange with trimmed value on submit', async () => {
      render(<SettingsModal {...defaultProps} apiKey="" />);
      
      const apiKeyInput = screen.getByLabelText(/gemini api key/i);
      fireEvent.change(apiKeyInput, { target: { value: '  new-api-key  ' } });
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(defaultProps.onApiKeyChange).toHaveBeenCalledWith('new-api-key');
      });
    });

    it('calls onHotkeyChange on submit', async () => {
      render(<SettingsModal {...defaultProps} />);
      
      const hotkeyInput = screen.getByLabelText(/global hotkey/i);
      fireEvent.change(hotkeyInput, { target: { value: 'Ctrl+Shift+T' } });
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(defaultProps.onHotkeyChange).toHaveBeenCalledWith('Ctrl+Shift+T');
      });
    });

    it('calls onThemeChange on submit', async () => {
      render(<SettingsModal {...defaultProps} />);
      
      const themeSelect = screen.getByLabelText(/theme/i);
      fireEvent.change(themeSelect, { target: { value: 'dark' } });
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(defaultProps.onThemeChange).toHaveBeenCalledWith('dark');
      });
    });

    it('calls onClose on submit', async () => {
      render(<SettingsModal {...defaultProps} />);
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('calls onClose when close button is clicked', () => {
      render(<SettingsModal {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: /×/i });
      fireEvent.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('calls onClose when cancel button is clicked', () => {
      render(<SettingsModal {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('updates API key input value', () => {
      render(<SettingsModal {...defaultProps} />);
      
      const apiKeyInput = screen.getByLabelText(/gemini api key/i);
      fireEvent.change(apiKeyInput, { target: { value: 'updated-key' } });
      
      expect(apiKeyInput).toHaveValue('updated-key');
    });

    it('updates hotkey input value', () => {
      render(<SettingsModal {...defaultProps} />);
      
      const hotkeyInput = screen.getByLabelText(/global hotkey/i);
      fireEvent.change(hotkeyInput, { target: { value: 'Ctrl+Shift+X' } });
      
      expect(hotkeyInput).toHaveValue('Ctrl+Shift+X');
    });

    it('updates theme select value', () => {
      render(<SettingsModal {...defaultProps} />);
      
      const themeSelect = screen.getByLabelText(/theme/i);
      fireEvent.change(themeSelect, { target: { value: 'system' } });
      
      expect(themeSelect).toHaveValue('system');
    });

    it('submits form on Enter key in API key input', async () => {
      render(<SettingsModal {...defaultProps} />);
      
      const apiKeyInput = screen.getByLabelText(/gemini api key/i);
      fireEvent.keyDown(apiKeyInput, { key: 'Enter', code: 'Enter' });
      
      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });
  });

  describe('Props Handling', () => {
    it('initializes with provided props', () => {
      const props = {
        ...defaultProps,
        apiKey: 'custom-key',
        hotkey: 'Command+Option+T',
        theme: 'dark' as Theme,
      };
      
      render(<SettingsModal {...props} />);
      
      expect(screen.getByLabelText(/gemini api key/i)).toHaveValue('custom-key');
      expect(screen.getByLabelText(/global hotkey/i)).toHaveValue('Command+Option+T');
      expect(screen.getByLabelText(/theme/i)).toHaveValue('dark');
    });

    it('handles empty initial values', () => {
      const props = {
        ...defaultProps,
        apiKey: '',
        hotkey: '',
        theme: 'system' as Theme,
      };
      
      render(<SettingsModal {...props} />);
      
      expect(screen.getByLabelText(/gemini api key/i)).toHaveValue('');
      expect(screen.getByLabelText(/global hotkey/i)).toHaveValue('');
      expect(screen.getByLabelText(/theme/i)).toHaveValue('system');
    });
  });

  describe('Accessibility', () => {
    it('has proper form structure', () => {
      render(<SettingsModal {...defaultProps} />);
      
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('has proper labels for inputs', () => {
      render(<SettingsModal {...defaultProps} />);
      
      expect(screen.getByLabelText(/gemini api key/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/global hotkey/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/theme/i)).toBeInTheDocument();
    });

    it('has proper input IDs matching labels', () => {
      render(<SettingsModal {...defaultProps} />);
      
      expect(screen.getByLabelText(/gemini api key/i)).toHaveAttribute('id', 'api-key');
      expect(screen.getByLabelText(/global hotkey/i)).toHaveAttribute('id', 'hotkey');
      expect(screen.getByLabelText(/theme/i)).toHaveAttribute('id', 'theme');
    });

    it('has proper placeholder text', () => {
      render(<SettingsModal {...defaultProps} />);
      
      expect(screen.getByPlaceholderText(/enter your gemini api key/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e\.g\., ctrl\+alt\+t/i)).toBeInTheDocument();
    });

    it('shows error message with proper styling', async () => {
      render(<SettingsModal {...defaultProps} apiKey="" />);
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/api key is required/i);
        expect(errorMessage).toHaveClass('error-message');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid form submissions', async () => {
      render(<SettingsModal {...defaultProps} />);
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      
      // Rapid clicks
      fireEvent.click(saveButton);
      fireEvent.click(saveButton);
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalledTimes(3);
      });
    });

    it('maintains form state during re-renders', () => {
      const { rerender } = render(<SettingsModal {...defaultProps} />);
      
      const apiKeyInput = screen.getByLabelText(/gemini api key/i);
      fireEvent.change(apiKeyInput, { target: { value: 'changed-key' } });
      
      rerender(<SettingsModal {...defaultProps} />);
      
      expect(apiKeyInput).toHaveValue('changed-key');
    });

    it('handles theme changes correctly', () => {
      render(<SettingsModal {...defaultProps} />);
      
      const themeSelect = screen.getByLabelText(/theme/i);
      
      fireEvent.change(themeSelect, { target: { value: 'dark' } });
      expect(themeSelect).toHaveValue('dark');
      
      fireEvent.change(themeSelect, { target: { value: 'system' } });
      expect(themeSelect).toHaveValue('system');
      
      fireEvent.change(themeSelect, { target: { value: 'light' } });
      expect(themeSelect).toHaveValue('light');
    });

    it('prevents form submission with preventDefault', async () => {
      const mockPreventDefault = jest.fn();
      render(<SettingsModal {...defaultProps} />);
      
      const form = screen.getByRole('form');
      fireEvent.submit(form, { preventDefault: mockPreventDefault });
      
      expect(mockPreventDefault).toHaveBeenCalled();
    });
  });
});