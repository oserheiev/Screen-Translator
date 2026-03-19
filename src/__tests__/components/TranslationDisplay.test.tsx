import React from 'react';
import { render, screen } from '@testing-library/react';
import TranslationDisplay from '../../components/TranslationDisplay';

jest.mock('../../i18n/useLocale', () => ({
  useLocale: () => ({
    translation: 'Translation',
    sourceText: 'Source Text',
    paste: 'Paste',
    typePlaceholder: 'Type here...',
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

describe('TranslationDisplay', () => {
  it('renders non-empty text via the Markdown component', () => {
    render(<TranslationDisplay text="**bold text**" />);
    // markdown-to-jsx is mocked to a plain div — verify the text reaches it
    expect(screen.getByTestId('markdown')).toHaveTextContent('**bold text**');
  });

  it('renders nothing in the content area when text is empty', () => {
    const { container } = render(<TranslationDisplay text="" />);
    const content = container.querySelector('.translation-content');
    expect(content).toBeEmptyDOMElement();
  });

  it('shows the skeleton overlay when isLoading is true', () => {
    const { container } = render(<TranslationDisplay text="text" isLoading={true} />);
    expect(container.querySelector('.translation-skeleton-overlay')).toBeInTheDocument();
  });

  it('hides the skeleton overlay when isLoading is false', () => {
    const { container } = render(<TranslationDisplay text="text" isLoading={false} />);
    expect(container.querySelector('.translation-skeleton-overlay')).not.toBeInTheDocument();
  });

  it('shows the panel header label', () => {
    render(<TranslationDisplay text="" />);
    expect(screen.getByText('Translation')).toBeInTheDocument();
  });

  it('copy button is disabled when text is empty', () => {
    render(<TranslationDisplay text="" />);
    // The copy button should be disabled when no text
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });
});
