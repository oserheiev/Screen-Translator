import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider } from '../../contexts/AppContext';
import WhatsNewModal from '../../components/WhatsNewModal';
import { WhatsNewEntry } from '../../whatsnew';

jest.mock('../../services/gemini.service');

const entries: WhatsNewEntry[] = [
  {
    version: '1.7.0',
    bullets: [
      { English: 'Faster capture overlay', German: 'Schnelleres Aufnahme-Overlay' },
      { English: 'Buffer-based screenshots' }, // no German — falls back within the SAME entry
    ],
  },
  {
    version: '1.6.5',
    bullets: [{ English: 'Bug fixes' }],
  },
];

function renderModal(onClose = jest.fn()) {
  render(
    <AppProvider>
      <WhatsNewModal entries={entries} onClose={onClose} />
    </AppProvider>
  );
  return onClose;
}

describe('WhatsNewModal', () => {
  it('renders the title with the newest version and English bullets by default', async () => {
    renderModal();

    expect(await screen.findByText("What's New in v1.7.0")).toBeInTheDocument();
    expect(screen.getByText('Faster capture overlay')).toBeInTheDocument();
    expect(screen.getByText('Bug fixes')).toBeInTheDocument();
  });

  it('shows version subheadings when multiple versions are listed', async () => {
    renderModal();

    expect(await screen.findByText('v1.7.0')).toBeInTheDocument();
    expect(screen.getByText('v1.6.5')).toBeInTheDocument();
  });

  it('falls back to English per bullet, even within the same entry', async () => {
    (window.electron.settings.get as jest.Mock).mockResolvedValue({
      apiKey: 'valid-key',
      appLanguage: 'German',
    });

    renderModal();

    // First bullet of 1.7.0 has a German translation
    expect(await screen.findByText('Schnelleres Aufnahme-Overlay')).toBeInTheDocument();
    // Second bullet of the SAME entry has no German — falls back to English
    expect(screen.getByText('Buffer-based screenshots')).toBeInTheDocument();
    // 1.6.5 has no German at all — falls back to English
    expect(screen.getByText('Bug fixes')).toBeInTheDocument();
  });

  it('calls onClose when the dismiss button is clicked', async () => {
    const onClose = renderModal();

    await userEvent.click(await screen.findByText('Got it'));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders nothing for an empty entries list', () => {
    const { container } = render(
      <AppProvider>
        <WhatsNewModal entries={[]} onClose={jest.fn()} />
      </AppProvider>
    );
    expect(container.querySelector('.modal-overlay')).toBeNull();
  });
});
