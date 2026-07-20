import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TextDisplay from '../../components/TextDisplay';

jest.mock('../../i18n/useLocale', () => ({
  useLocale: () => ({
    sourceText: 'Source Text',
    paste: 'Paste',
    copy: 'Copy',
    typePlaceholder: 'Type here...',
    pasteFailed: 'Paste failed',
    translation: 'Translation',
    recentHistory: 'Recent History',
    noHistory: 'No history',
    clearHistory: 'Clear history',
    today: 'Today',
    yesterday: 'Yesterday',
    languageNames: {},
    apiKeyNotSet: 'API key not set',
  }),
}));

jest.mock('../../services/clipboard.service', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    copyToClipboard: jest.fn().mockResolvedValue(true),
  })),
}));

describe('TextDisplay', () => {
  it('renders the provided text in the textarea', () => {
    render(<TextDisplay text="Hello world" />);
    expect(screen.getByRole('textbox')).toHaveValue('Hello world');
  });

  it('shows the placeholder when text is empty', () => {
    render(<TextDisplay text="" />);
    expect(screen.getByText('Type here...')).toBeInTheDocument();
  });

  it('hides the placeholder when text is present', () => {
    render(<TextDisplay text="Some text" />);
    expect(screen.queryByText('Type here...')).not.toBeInTheDocument();
  });

  it('shows the skeleton overlay when isLoading is true', () => {
    const { container } = render(<TextDisplay text="" isLoading={true} />);
    expect(container.querySelector('.translation-skeleton-overlay')).toBeInTheDocument();
  });

  it('hides the skeleton overlay when isLoading is false', () => {
    const { container } = render(<TextDisplay text="" isLoading={false} />);
    expect(container.querySelector('.translation-skeleton-overlay')).not.toBeInTheDocument();
  });

  it('hides the empty-state placeholder while loading, even when text is empty', () => {
    render(<TextDisplay text="" isLoading={true} />);
    expect(screen.queryByText('Type here...')).not.toBeInTheDocument();
  });

  it('calls onTextEdit when the textarea value changes', () => {
    const onEdit = jest.fn();
    render(<TextDisplay text="" onTextEdit={onEdit} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'New value' } });

    expect(onEdit).toHaveBeenCalledWith('New value');
  });

  it('disables the textarea when disabled prop is true', () => {
    render(<TextDisplay text="text" disabled={true} />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('calls onPasteError when clipboard read rejects', async () => {
    const onPasteError = jest.fn();
    Object.assign(navigator, {
      clipboard: { readText: jest.fn().mockRejectedValue(new Error('denied')) },
    });
    render(<TextDisplay text="" onPasteError={onPasteError} />);

    fireEvent.click(screen.getByTitle('Paste'));

    await waitFor(() => expect(onPasteError).toHaveBeenCalled());
  });

  it('labels the copy button for accessibility', () => {
    render(<TextDisplay text="some text" />);
    expect(screen.getByTitle('Copy')).toBeInTheDocument();
  });
});
