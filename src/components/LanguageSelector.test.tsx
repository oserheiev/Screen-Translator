import React from 'react';
import { render, screen, fireEvent } from '../test-utils';
import LanguageSelector from './LanguageSelector';

describe('LanguageSelector', () => {
  const mockOnLanguageChange = jest.fn();
  const defaultProps = {
    selectedLanguage: 'English',
    onLanguageChange: mockOnLanguageChange,
  };

  beforeEach(() => {
    mockOnLanguageChange.mockClear();
  });

  describe('Rendering', () => {
    it('renders with correct label', () => {
      render(<LanguageSelector {...defaultProps} />);
      
      expect(screen.getByText(/translate to:/i)).toBeInTheDocument();
    });

    it('renders select element with correct ID', () => {
      render(<LanguageSelector {...defaultProps} />);
      
      const select = screen.getByLabelText(/translate to:/i);
      expect(select).toHaveAttribute('id', 'language-select');
    });

    it('renders with correct CSS class', () => {
      render(<LanguageSelector {...defaultProps} />);
      
      const container = screen.getByText(/translate to:/i).parentElement;
      expect(container).toHaveClass('language-selector');
    });

    it('displays selected language correctly', () => {
      render(<LanguageSelector {...defaultProps} selectedLanguage="Spanish" />);
      
      const select = screen.getByLabelText(/translate to:/i);
      expect(select).toHaveValue('Spanish');
    });

    it('renders all supported languages as options', () => {
      render(<LanguageSelector {...defaultProps} />);
      
      const expectedLanguages = [
        'English',
        'Russian',
        'Ukrainian',
        'Spanish',
        'French',
        'German',
        'Italian',
        'Portuguese',
        'Chinese (Simplified)',
        'Japanese',
        'Korean'
      ];

      expectedLanguages.forEach(language => {
        expect(screen.getByRole('option', { name: language })).toBeInTheDocument();
      });
    });

    it('has correct number of options', () => {
      render(<LanguageSelector {...defaultProps} />);
      
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(11);
    });

    it('each option has correct value attribute', () => {
      render(<LanguageSelector {...defaultProps} />);
      
      const expectedLanguages = [
        'English',
        'Russian',
        'Ukrainian',
        'Spanish',
        'French',
        'German',
        'Italian',
        'Portuguese',
        'Chinese (Simplified)',
        'Japanese',
        'Korean'
      ];

      expectedLanguages.forEach(language => {
        const option = screen.getByRole('option', { name: language });
        expect(option).toHaveAttribute('value', language);
      });
    });
  });

  describe('User Interactions', () => {
    it('calls onLanguageChange when selection changes', () => {
      render(<LanguageSelector {...defaultProps} />);
      
      const select = screen.getByLabelText(/translate to:/i);
      fireEvent.change(select, { target: { value: 'Spanish' } });
      
      expect(mockOnLanguageChange).toHaveBeenCalledWith('Spanish');
      expect(mockOnLanguageChange).toHaveBeenCalledTimes(1);
    });

    it('calls onLanguageChange with correct value for each language', () => {
      render(<LanguageSelector {...defaultProps} />);
      
      const select = screen.getByLabelText(/translate to:/i);
      const languages = ['Russian', 'French', 'Japanese', 'German'];
      
      languages.forEach((language, index) => {
        fireEvent.change(select, { target: { value: language } });
        expect(mockOnLanguageChange).toHaveBeenNthCalledWith(index + 1, language);
      });
      
      expect(mockOnLanguageChange).toHaveBeenCalledTimes(4);
    });

    it('updates display when selectedLanguage prop changes', () => {
      const { rerender } = render(<LanguageSelector {...defaultProps} selectedLanguage="English" />);
      
      let select = screen.getByLabelText(/translate to:/i);
      expect(select).toHaveValue('English');
      
      rerender(<LanguageSelector {...defaultProps} selectedLanguage="French" />);
      
      select = screen.getByLabelText(/translate to:/i);
      expect(select).toHaveValue('French');
    });

    it('handles rapid selection changes', () => {
      render(<LanguageSelector {...defaultProps} />);
      
      const select = screen.getByLabelText(/translate to:/i);
      
      fireEvent.change(select, { target: { value: 'Spanish' } });
      fireEvent.change(select, { target: { value: 'French' } });
      fireEvent.change(select, { target: { value: 'German' } });
      
      expect(mockOnLanguageChange).toHaveBeenCalledTimes(3);
      expect(mockOnLanguageChange).toHaveBeenNthCalledWith(1, 'Spanish');
      expect(mockOnLanguageChange).toHaveBeenNthCalledWith(2, 'French');
      expect(mockOnLanguageChange).toHaveBeenNthCalledWith(3, 'German');
    });
  });

  describe('Props Handling', () => {
    it('handles all supported languages as selectedLanguage', () => {
      const languages = [
        'English',
        'Russian',
        'Ukrainian',
        'Spanish',
        'French',
        'German',
        'Italian',
        'Portuguese',
        'Chinese (Simplified)',
        'Japanese',
        'Korean'
      ];

      languages.forEach(language => {
        const { rerender } = render(<LanguageSelector {...defaultProps} selectedLanguage={language} />);
        
        const select = screen.getByLabelText(/translate to:/i);
        expect(select).toHaveValue(language);
        
        rerender(<div />); // Clean up for next iteration
      });
    });

    it('handles empty selectedLanguage gracefully', () => {
      render(<LanguageSelector {...defaultProps} selectedLanguage="" />);
      
      const select = screen.getByLabelText(/translate to:/i);
      expect(select).toHaveValue('');
    });

    it('handles invalid selectedLanguage gracefully', () => {
      render(<LanguageSelector {...defaultProps} selectedLanguage="InvalidLanguage" />);
      
      const select = screen.getByLabelText(/translate to:/i);
      expect(select).toHaveValue('InvalidLanguage');
    });

    it('updates when onLanguageChange prop changes', () => {
      const newMockOnLanguageChange = jest.fn();
      const { rerender } = render(<LanguageSelector {...defaultProps} />);
      
      const select = screen.getByLabelText(/translate to:/i);
      fireEvent.change(select, { target: { value: 'Spanish' } });
      
      expect(mockOnLanguageChange).toHaveBeenCalledWith('Spanish');
      expect(newMockOnLanguageChange).not.toHaveBeenCalled();
      
      rerender(<LanguageSelector selectedLanguage="English" onLanguageChange={newMockOnLanguageChange} />);
      
      fireEvent.change(select, { target: { value: 'French' } });
      
      expect(mockOnLanguageChange).toHaveBeenCalledTimes(1); // Still 1 from before
      expect(newMockOnLanguageChange).toHaveBeenCalledWith('French');
    });
  });

  describe('Accessibility', () => {
    it('has proper label association', () => {
      render(<LanguageSelector {...defaultProps} />);
      
      const label = screen.getByText(/translate to:/i);
      const select = screen.getByLabelText(/translate to:/i);
      
      expect(label).toHaveAttribute('for', 'language-select');
      expect(select).toHaveAttribute('id', 'language-select');
    });

    it('is focusable', () => {
      render(<LanguageSelector {...defaultProps} />);
      
      const select = screen.getByLabelText(/translate to:/i);
      select.focus();
      
      expect(select).toHaveFocus();
    });

    it('can be navigated with keyboard', () => {
      render(<LanguageSelector {...defaultProps} />);
      
      const select = screen.getByLabelText(/translate to:/i);
      select.focus();
      
      fireEvent.keyDown(select, { key: 'ArrowDown', code: 'ArrowDown' });
      fireEvent.keyDown(select, { key: 'Enter', code: 'Enter' });
      
      // The exact behavior depends on browser implementation
      expect(select).toHaveFocus();
    });

    it('has proper select role', () => {
      render(<LanguageSelector {...defaultProps} />);
      
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('has proper option roles', () => {
      render(<LanguageSelector {...defaultProps} />);
      
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
      
      options.forEach(option => {
        expect(option).toHaveAttribute('value');
      });
    });
  });

  describe('Language List Consistency', () => {
    it('maintains consistent language order', () => {
      render(<LanguageSelector {...defaultProps} />);
      
      const options = screen.getAllByRole('option');
      const optionTexts = options.map(option => option.textContent);
      
      const expectedOrder = [
        'English',
        'Russian',
        'Ukrainian',
        'Spanish',
        'French',
        'German',
        'Italian',
        'Portuguese',
        'Chinese (Simplified)',
        'Japanese',
        'Korean'
      ];
      
      expect(optionTexts).toEqual(expectedOrder);
    });

    it('includes all expected languages', () => {
      render(<LanguageSelector {...defaultProps} />);
      
      const requiredLanguages = [
        'English',
        'Russian',
        'Ukrainian',
        'Spanish',
        'French',
        'German',
        'Italian',
        'Portuguese',
        'Chinese (Simplified)',
        'Japanese',
        'Korean'
      ];
      
      requiredLanguages.forEach(language => {
        expect(screen.getByRole('option', { name: language })).toBeInTheDocument();
      });
    });

    it('does not include unexpected languages', () => {
      render(<LanguageSelector {...defaultProps} />);
      
      const options = screen.getAllByRole('option');
      const optionTexts = options.map(option => option.textContent);
      
      const unexpectedLanguages = ['Arabic', 'Hindi', 'Turkish', 'Dutch'];
      
      unexpectedLanguages.forEach(language => {
        expect(optionTexts).not.toContain(language);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles component unmounting gracefully', () => {
      const { unmount } = render(<LanguageSelector {...defaultProps} />);
      
      expect(() => unmount()).not.toThrow();
    });

    it('maintains state during re-renders with same props', () => {
      const { rerender } = render(<LanguageSelector {...defaultProps} selectedLanguage="Spanish" />);
      
      let select = screen.getByLabelText(/translate to:/i);
      expect(select).toHaveValue('Spanish');
      
      rerender(<LanguageSelector {...defaultProps} selectedLanguage="Spanish" />);
      
      select = screen.getByLabelText(/translate to:/i);
      expect(select).toHaveValue('Spanish');
    });

    it('handles special characters in language names', () => {
      render(<LanguageSelector {...defaultProps} />);
      
      const chineseOption = screen.getByRole('option', { name: 'Chinese (Simplified)' });
      expect(chineseOption).toBeInTheDocument();
      expect(chineseOption).toHaveAttribute('value', 'Chinese (Simplified)');
    });
  });
});