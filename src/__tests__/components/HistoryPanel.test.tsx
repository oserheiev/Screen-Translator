import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HistoryPanel from '../../components/HistoryPanel';
import { HistoryEntry } from '../../types';

jest.mock('../../i18n/useLocale', () => ({
  useLocale: () => ({
    recentHistory: 'Recent History',
    noHistory: 'No history yet',
    clearHistory: 'Clear history',
    today: 'Today',
    yesterday: 'Yesterday',
    languageNames: {},
  }),
}));

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: Math.random().toString(36).slice(2),
    originalText: 'Hello world',
    translatedText: 'Hola mundo',
    sourceLanguage: 'English',
    targetLanguage: 'Spanish',
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('HistoryPanel', () => {
  it('shows the empty state when there are no entries', () => {
    render(<HistoryPanel entries={[]} onSelect={jest.fn()} onClear={jest.fn()} />);
    expect(screen.getByText('No history yet')).toBeInTheDocument();
  });

  it('renders one button per history entry', () => {
    const entries = [makeEntry({ originalText: 'First' }), makeEntry({ originalText: 'Second' })];
    render(<HistoryPanel entries={entries} onSelect={jest.fn()} onClear={jest.fn()} />);

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('calls onSelect with the correct entry when clicked', () => {
    const onSelect = jest.fn();
    const entry = makeEntry({ originalText: 'Click me' });
    render(<HistoryPanel entries={[entry]} onSelect={onSelect} onClear={jest.fn()} />);

    fireEvent.click(screen.getByText('Click me'));

    expect(onSelect).toHaveBeenCalledWith(entry);
  });

  it('calls onClear when the clear button is clicked', () => {
    const onClear = jest.fn();
    render(<HistoryPanel entries={[makeEntry()]} onSelect={jest.fn()} onClear={onClear} />);

    fireEvent.click(screen.getByText('Clear history'));

    expect(onClear).toHaveBeenCalled();
  });

  it('truncates long original text to 40 characters with ellipsis', () => {
    const longText = 'A'.repeat(50);
    render(<HistoryPanel entries={[makeEntry({ originalText: longText })]} onSelect={jest.fn()} onClear={jest.fn()} />);

    expect(screen.getByText(`${'A'.repeat(40)}...`)).toBeInTheDocument();
  });

  it('does not add ellipsis when text is 40 chars or fewer', () => {
    const exactText = 'B'.repeat(40);
    render(<HistoryPanel entries={[makeEntry({ originalText: exactText })]} onSelect={jest.fn()} onClear={jest.fn()} />);

    expect(screen.getByText(exactText)).toBeInTheDocument();
  });

  it('shows the panel header label', () => {
    render(<HistoryPanel entries={[]} onSelect={jest.fn()} onClear={jest.fn()} />);
    expect(screen.getByText('Recent History')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = jest.fn();
    render(<HistoryPanel entries={[]} onSelect={jest.fn()} onClear={jest.fn()} onClose={onClose} />);

    fireEvent.click(screen.getByText('×'));

    expect(onClose).toHaveBeenCalled();
  });
});
