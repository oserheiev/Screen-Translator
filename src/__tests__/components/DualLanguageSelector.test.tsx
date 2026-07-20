import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DualLanguageSelector from '../../components/DualLanguageSelector';

jest.mock('../../i18n/useLocale', () => ({
  useLocale: () => ({
    languageNames: {
      Auto: 'Auto',
      English: 'English',
      Russian: 'Russian',
      Ukrainian: 'Ukrainian',
      Spanish: 'Spanish',
      French: 'French',
      German: 'German',
      Italian: 'Italian',
      Portuguese: 'Portuguese',
      'Chinese (Simplified)': 'Chinese (Simplified)',
      Japanese: 'Japanese',
      Korean: 'Korean',
      Polish: 'Polish',
    },
  }),
}));

const defaultProps = {
  sourceLanguage: 'Auto' as const,
  targetLanguage: 'English' as const,
  onSourceLanguageChange: jest.fn(),
  onTargetLanguageChange: jest.fn(),
};

describe('DualLanguageSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays the current source language', () => {
    render(<DualLanguageSelector {...defaultProps} />);
    // The trigger button shows the current value
    const sourceSelect = screen.getByLabelText('Source language');
    expect(sourceSelect.querySelector('button')?.textContent).toBe('Auto');
  });

  it('displays the current target language', () => {
    render(<DualLanguageSelector {...defaultProps} />);
    const targetSelect = screen.getByLabelText('Target language');
    expect(targetSelect.querySelector('button')?.textContent).toBe('English');
  });

  it('calls onSourceLanguageChange when a source language is selected', () => {
    const onSourceChange = jest.fn();
    render(<DualLanguageSelector {...defaultProps} onSourceLanguageChange={onSourceChange} />);

    // Open the source dropdown
    const sourceBtn = screen.getByLabelText('Source language').querySelector('button')!;
    fireEvent.click(sourceBtn);

    // Click French
    fireEvent.click(screen.getByText('French'));

    expect(onSourceChange).toHaveBeenCalledWith('French');
  });

  it('calls onTargetLanguageChange when a target language is selected', () => {
    const onTargetChange = jest.fn();
    render(<DualLanguageSelector {...defaultProps} onTargetLanguageChange={onTargetChange} />);

    // Open the target dropdown
    const targetBtn = screen.getByLabelText('Target language').querySelector('button')!;
    fireEvent.click(targetBtn);

    // Click Spanish
    fireEvent.click(screen.getByText('Spanish'));

    expect(onTargetChange).toHaveBeenCalledWith('Spanish');
  });

  it('swap button is disabled when source is Auto', () => {
    render(<DualLanguageSelector {...defaultProps} sourceLanguage="Auto" />);
    const swapBtn = screen.getByTitle('Swap languages');
    expect(swapBtn).toBeDisabled();
  });

  it('swap button swaps source and target when source is not Auto', () => {
    const onSource = jest.fn();
    const onTarget = jest.fn();
    render(
      <DualLanguageSelector
        {...defaultProps}
        sourceLanguage="English"
        targetLanguage="Spanish"
        onSourceLanguageChange={onSource}
        onTargetLanguageChange={onTarget}
      />
    );

    const swapBtn = screen.getByTitle('Swap languages');
    fireEvent.click(swapBtn);

    expect(onSource).toHaveBeenCalledWith('Spanish');
    expect(onTarget).toHaveBeenCalledWith('English');
  });

  it('sets aria-haspopup and aria-expanded on the trigger', () => {
    render(<DualLanguageSelector {...defaultProps} />);
    const trigger = screen.getByLabelText('Source language').querySelector('button')!;
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('marks the dropdown as a listbox with role="option" items', () => {
    render(<DualLanguageSelector {...defaultProps} />);
    const trigger = screen.getByLabelText('Source language').querySelector('button')!;
    fireEvent.click(trigger);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
  });

  it('moves selection with ArrowDown/ArrowUp and selects with Enter', () => {
    const onSourceChange = jest.fn();
    render(<DualLanguageSelector {...defaultProps} onSourceLanguageChange={onSourceChange} />);
    const trigger = screen.getByLabelText('Source language').querySelector('button')!;
    fireEvent.click(trigger);

    const listbox = screen.getByRole('listbox');
    fireEvent.keyDown(listbox, { key: 'ArrowDown' }); // Auto -> English
    fireEvent.keyDown(listbox, { key: 'Enter' });

    expect(onSourceChange).toHaveBeenCalledWith('English');
  });
});
