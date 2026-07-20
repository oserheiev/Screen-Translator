import React from 'react';
import { render, screen } from '@testing-library/react';
import TranslationDisplay from '../../components/TranslationDisplay';

jest.mock('../../i18n/useLocale', () => ({
  useLocale: () => ({
    translation: 'Translation',
    sourceText: 'Source Text',
    paste: 'Paste',
    copy: 'Copy',
    typePlaceholder: 'Type here...',
    recentHistory: 'Recent History',
    noHistory: 'No history',
    clearHistory: 'Clear history',
    today: 'Today',
    yesterday: 'Yesterday',
    languageNames: {},
    apiKeyNotSet: 'API key not set',
    altToggleLabel: 'Alt',
    contextToggleLabel: 'Context',
    alternatives: 'Alternatives',
    contextOfUse: 'Context of Use',
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

  it('labels the copy button for accessibility', () => {
    render(<TranslationDisplay text="some translated text" />);
    expect(screen.getByTitle('Copy')).toBeInTheDocument();
  });
});

describe('TranslationDisplay — alternatives section', () => {
  const alternatives = [
    {
      category: 'Nouns',
      items: [{ word: 'Hola', backTranslations: ['Hello', 'Hi'] }],
    },
  ];

  it('shows alternatives when showAlternatives is true and alternatives exist', () => {
    render(<TranslationDisplay text="text" showAlternatives={true} alternatives={alternatives} />);
    expect(screen.getByText('Nouns')).toBeInTheDocument();
    expect(screen.getByText('Hola')).toBeInTheDocument();
    expect(screen.getByText('Hello, Hi')).toBeInTheDocument();
  });

  it('hides alternatives when showAlternatives is false', () => {
    render(<TranslationDisplay text="text" showAlternatives={false} alternatives={alternatives} />);
    expect(screen.queryByText('Nouns')).not.toBeInTheDocument();
  });

  it('hides alternatives when alternatives is null even if toggle is on', () => {
    render(<TranslationDisplay text="text" showAlternatives={true} alternatives={null} />);
    expect(screen.queryByText('Nouns')).not.toBeInTheDocument();
  });

  it('shows the Alt toggle pill when onToggleAlternatives is provided', () => {
    render(<TranslationDisplay text="text" onToggleAlternatives={jest.fn()} />);
    expect(screen.getByTitle('Alternatives')).toBeInTheDocument();
  });

  it('does not show the Alt toggle pill when onToggleAlternatives is not provided', () => {
    render(<TranslationDisplay text="text" />);
    expect(screen.queryByTitle('Alternatives')).not.toBeInTheDocument();
  });

  it('applies active class to Alt pill when showAlternatives is true', () => {
    render(<TranslationDisplay text="text" showAlternatives={true} onToggleAlternatives={jest.fn()} />);
    expect(screen.getByTitle('Alternatives')).toHaveClass('active');
  });
});

describe('TranslationDisplay — context section', () => {
  const contextData = {
    explanation: 'A greeting used informally.',
    tags: [
      { label: 'Informal', applicable: true },
      { label: 'Formal', applicable: false },
    ],
  };

  it('shows context section when showContext is true and contextData exists', () => {
    render(<TranslationDisplay text="text" showContext={true} contextData={contextData} />);
    expect(screen.getByText('A greeting used informally.')).toBeInTheDocument();
  });

  it('renders applicable and non-applicable tags with correct marks', () => {
    render(<TranslationDisplay text="text" showContext={true} contextData={contextData} />);
    expect(screen.getByText('✓ Informal')).toBeInTheDocument();
    expect(screen.getByText('✗ Formal')).toBeInTheDocument();
  });

  it('applies not-applicable class to tags where applicable is false', () => {
    const { container } = render(<TranslationDisplay text="text" showContext={true} contextData={contextData} />);
    const notApplicable = container.querySelector('.context-tag.not-applicable');
    expect(notApplicable).toBeInTheDocument();
    expect(notApplicable).toHaveTextContent('Formal');
  });

  it('hides context section when showContext is false', () => {
    render(<TranslationDisplay text="text" showContext={false} contextData={contextData} />);
    expect(screen.queryByText('A greeting used informally.')).not.toBeInTheDocument();
  });

  it('hides context section when contextData is null even if toggle is on', () => {
    render(<TranslationDisplay text="text" showContext={true} contextData={null} />);
    expect(screen.queryByText('A greeting used informally.')).not.toBeInTheDocument();
  });

  it('shows the Context toggle pill when onToggleContext is provided', () => {
    render(<TranslationDisplay text="text" onToggleContext={jest.fn()} />);
    expect(screen.getByTitle('Context of Use')).toBeInTheDocument();
  });

  it('applies active class to Context pill when showContext is true', () => {
    render(<TranslationDisplay text="text" showContext={true} onToggleContext={jest.fn()} />);
    expect(screen.getByTitle('Context of Use')).toHaveClass('active');
  });
});
