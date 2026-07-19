import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AppProvider, useAppContext } from '../../contexts/AppContext';
import GeminiService from '../../services/gemini.service';

jest.mock('../../services/gemini.service');

jest.mock('../../whatsnew', () => {
  const actual = jest.requireActual('../../whatsnew');
  return {
    ...actual,
    WHATS_NEW: [
      { version: '1.7.0', bullets: [{ English: 'Faster capture overlay' }] },
      { version: '1.6.5', bullets: [{ English: 'Bug fixes' }] },
    ],
  };
});

// Minimal consumer to expose context values in tests
const Consumer: React.FC<{ onRender?: (ctx: ReturnType<typeof useAppContext>) => void }> = ({ onRender }) => {
  const ctx = useAppContext();
  onRender?.(ctx);
  return (
    <div>
      <span data-testid="original">{ctx.originalText}</span>
      <span data-testid="translated">{ctx.translatedText}</span>
      <span data-testid="error">{ctx.error ?? ''}</span>
      <span data-testid="processing">{String(ctx.isProcessing)}</span>
      <span data-testid="capture-processing">{String(ctx.isCaptureProcessing)}</span>
      <span data-testid="history-count">{ctx.history.length}</span>
    </div>
  );
};

function renderWithProvider(ui: React.ReactElement = <Consumer />) {
  return render(<AppProvider>{ui}</AppProvider>);
}

let mockProcessImage: jest.Mock;
let mockTranslateText: jest.Mock;
let mockListModels: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();

  mockProcessImage = jest.fn().mockResolvedValue({ originalText: 'Hello', translatedText: 'Hola' });
  mockTranslateText = jest.fn().mockResolvedValue('Hola');
  mockListModels = jest.fn().mockResolvedValue(['gemini-2.5-flash']);

  (GeminiService as jest.Mock).mockImplementation(() => ({
    processImage: mockProcessImage,
    translateText: mockTranslateText,
    listModels: mockListModels,
  }));
});

describe('AppContext — settings loading', () => {
  it('calls electron.settings.get() on mount', async () => {
    renderWithProvider();
    await waitFor(() => {
      expect(window.electron.settings.get).toHaveBeenCalled();
    });
  });

  it('applies loaded settings to context state', async () => {
    (window.electron.settings.get as jest.Mock).mockResolvedValue({
      apiKey: 'my-key',
      sourceLanguage: 'French',
      targetLanguage: 'German',
      hotkey: 'Ctrl+Shift+S',
      theme: 'dark',
      model: 'gemini-pro',
      appLanguage: 'English',
    });

    let ctx!: ReturnType<typeof useAppContext>;
    renderWithProvider(<Consumer onRender={c => { ctx = c; }} />);

    await waitFor(() => expect(ctx.apiKey).toBe('my-key'));
    expect(ctx.sourceLanguage).toBe('French');
    expect(ctx.targetLanguage).toBe('German');
  });

  it('loads history from electron.history.get() on mount', async () => {
    const mockHistory = [
      { id: '1', originalText: 'Hi', translatedText: 'Hola', sourceLanguage: 'English', targetLanguage: 'Spanish', timestamp: Date.now() },
    ];
    (window.electron.history.get as jest.Mock).mockResolvedValue(mockHistory);

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('history-count').textContent).toBe('1');
    });
  });
});

describe('AppContext — GeminiService creation', () => {
  it('creates GeminiService when apiKey is set', async () => {
    (window.electron.settings.get as jest.Mock).mockResolvedValue({
      apiKey: 'valid-key',
      sourceLanguage: 'Auto',
      targetLanguage: 'English',
      hotkey: 'Ctrl+Alt+T',
      theme: 'system',
      model: 'gemini-2.5-flash',
      appLanguage: 'English',
    });

    renderWithProvider();

    await waitFor(() => expect(GeminiService).toHaveBeenCalledWith('valid-key'));
  });

  it('does NOT create GeminiService when apiKey is empty', async () => {
    (window.electron.settings.get as jest.Mock).mockResolvedValue(null);

    renderWithProvider();

    await waitFor(() => expect(window.electron.settings.get).toHaveBeenCalled());
    expect(GeminiService).not.toHaveBeenCalled();
  });
});

describe('AppContext — processImage', () => {
  beforeEach(async () => {
    (window.electron.settings.get as jest.Mock).mockResolvedValue({
      apiKey: 'valid-key',
      sourceLanguage: 'Auto',
      targetLanguage: 'English',
      hotkey: 'Ctrl+Alt+T',
      theme: 'system',
      model: 'gemini-2.5-flash',
      appLanguage: 'English',
    });
  });

  it('sets originalText and translatedText after successful processImage', async () => {
    let ctx!: ReturnType<typeof useAppContext>;
    renderWithProvider(<Consumer onRender={c => { ctx = c; }} />);

    await waitFor(() => expect(GeminiService).toHaveBeenCalled());

    await act(async () => {
      await ctx.processImage('data:image/png;base64,ABC');
    });

    expect(screen.getByTestId('original').textContent).toBe('Hello');
    expect(screen.getByTestId('translated').textContent).toBe('Hola');
  });

  it('appends a history entry after processImage', async () => {
    let ctx!: ReturnType<typeof useAppContext>;
    renderWithProvider(<Consumer onRender={c => { ctx = c; }} />);

    await waitFor(() => expect(GeminiService).toHaveBeenCalled());

    await act(async () => {
      await ctx.processImage('data:image/png;base64,ABC');
    });

    expect(screen.getByTestId('history-count').textContent).toBe('1');
  });

  it('sets error state when processImage throws', async () => {
    mockProcessImage.mockRejectedValue(new Error('API failure'));

    let ctx!: ReturnType<typeof useAppContext>;
    renderWithProvider(<Consumer onRender={c => { ctx = c; }} />);

    await waitFor(() => expect(GeminiService).toHaveBeenCalled());

    await act(async () => {
      await ctx.processImage('data:image/png;base64,ABC');
    });

    expect(screen.getByTestId('error').textContent).toBe('API failure');
  });

  it('sets error when no geminiService and processImage is called', async () => {
    (window.electron.settings.get as jest.Mock).mockResolvedValue(null);

    let ctx!: ReturnType<typeof useAppContext>;
    renderWithProvider(<Consumer onRender={c => { ctx = c; }} />);
    await waitFor(() => expect(window.electron.settings.get).toHaveBeenCalled());

    await act(async () => {
      await ctx.processImage('data:image/png;base64,ABC');
    });

    expect(screen.getByTestId('error').textContent).not.toBe('');
  });
});

describe('AppContext — translateText', () => {
  beforeEach(async () => {
    (window.electron.settings.get as jest.Mock).mockResolvedValue({
      apiKey: 'valid-key',
      sourceLanguage: 'Auto',
      targetLanguage: 'English',
      hotkey: 'Ctrl+Alt+T',
      theme: 'system',
      model: 'gemini-2.5-flash',
      appLanguage: 'English',
    });
  });

  it('appends a history entry after translateText', async () => {
    let ctx!: ReturnType<typeof useAppContext>;
    renderWithProvider(<Consumer onRender={c => { ctx = c; }} />);

    await waitFor(() => expect(GeminiService).toHaveBeenCalled());

    await act(async () => {
      await ctx.translateText('Hello');
    });

    expect(screen.getByTestId('history-count').textContent).toBe('1');
  });

  it('does nothing when text is empty', async () => {
    let ctx!: ReturnType<typeof useAppContext>;
    renderWithProvider(<Consumer onRender={c => { ctx = c; }} />);

    await waitFor(() => expect(GeminiService).toHaveBeenCalled());

    await act(async () => {
      await ctx.translateText('   ');
    });

    expect(mockTranslateText).not.toHaveBeenCalled();
    expect(screen.getByTestId('history-count').textContent).toBe('0');
  });
});

describe('AppContext — history management', () => {
  it('caps history at 30 entries', async () => {
    (window.electron.settings.get as jest.Mock).mockResolvedValue({
      apiKey: 'valid-key',
      sourceLanguage: 'Auto',
      targetLanguage: 'English',
      hotkey: 'Ctrl+Alt+T',
      theme: 'system',
      model: 'gemini-2.5-flash',
      appLanguage: 'English',
    });

    let ctx!: ReturnType<typeof useAppContext>;
    renderWithProvider(<Consumer onRender={c => { ctx = c; }} />);

    await waitFor(() => expect(GeminiService).toHaveBeenCalled());

    // Add 31 entries
    for (let i = 0; i < 31; i++) {
      mockProcessImage.mockResolvedValueOnce({ originalText: `text${i}`, translatedText: `trans${i}` });
      await act(async () => {
        await ctx.processImage('data:image/png;base64,ABC');
      });
    }

    expect(screen.getByTestId('history-count').textContent).toBe('30');
  });

  it('clearHistory() empties the history array', async () => {
    (window.electron.settings.get as jest.Mock).mockResolvedValue({
      apiKey: 'valid-key',
      sourceLanguage: 'Auto',
      targetLanguage: 'English',
      hotkey: 'Ctrl+Alt+T',
      theme: 'system',
      model: 'gemini-2.5-flash',
      appLanguage: 'English',
    });

    let ctx!: ReturnType<typeof useAppContext>;
    renderWithProvider(<Consumer onRender={c => { ctx = c; }} />);

    await waitFor(() => expect(GeminiService).toHaveBeenCalled());

    await act(async () => {
      await ctx.processImage('data:image/png;base64,ABC');
    });

    expect(screen.getByTestId('history-count').textContent).toBe('1');

    act(() => { ctx.clearHistory(); });

    expect(screen.getByTestId('history-count').textContent).toBe('0');
  });

  it('restoreHistoryEntry() sets originalText and translatedText', async () => {
    let ctx!: ReturnType<typeof useAppContext>;
    renderWithProvider(<Consumer onRender={c => { ctx = c; }} />);
    await waitFor(() => expect(window.electron.settings.get).toHaveBeenCalled());

    const entry = {
      id: 'test-id',
      originalText: 'Restored original',
      translatedText: 'Restored translation',
      sourceLanguage: 'English' as const,
      targetLanguage: 'Spanish' as const,
      timestamp: Date.now(),
    };

    act(() => { ctx.restoreHistoryEntry(entry); });

    expect(screen.getByTestId('original').textContent).toBe('Restored original');
    expect(screen.getByTestId('translated').textContent).toBe('Restored translation');
  });
});

describe("AppContext — what's new", () => {
  beforeEach(() => {
    (window.electron.app.getVersion as jest.Mock).mockResolvedValue('1.7.0');
  });

  it('shows unseen entries after an upgrade', async () => {
    (window.electron.settings.get as jest.Mock).mockResolvedValue({
      apiKey: 'valid-key',
      lastSeenVersion: '1.6.0',
    });

    let ctx!: ReturnType<typeof useAppContext>;
    renderWithProvider(<Consumer onRender={c => { ctx = c; }} />);

    await waitFor(() =>
      expect(ctx.whatsNewEntries.map(e => e.version)).toEqual(['1.7.0', '1.6.5'])
    );
  });

  it('treats missing lastSeenVersion with existing settings as an upgrade', async () => {
    (window.electron.settings.get as jest.Mock).mockResolvedValue({ apiKey: 'valid-key' });

    let ctx!: ReturnType<typeof useAppContext>;
    renderWithProvider(<Consumer onRender={c => { ctx = c; }} />);

    await waitFor(() => expect(ctx.whatsNewEntries.length).toBe(2));
  });

  it('fresh install: persists version silently and shows nothing', async () => {
    // setupTests defaults: settings.get → null, history.get → []
    let ctx!: ReturnType<typeof useAppContext>;
    renderWithProvider(<Consumer onRender={c => { ctx = c; }} />);

    await waitFor(() =>
      expect(window.electron.settings.save).toHaveBeenCalledWith({ lastSeenVersion: '1.7.0' })
    );
    expect(ctx.whatsNewEntries).toEqual([]);
  });

  it('does nothing when lastSeenVersion equals the current version', async () => {
    (window.electron.settings.get as jest.Mock).mockResolvedValue({
      apiKey: 'valid-key',
      lastSeenVersion: '1.7.0',
    });

    let ctx!: ReturnType<typeof useAppContext>;
    renderWithProvider(<Consumer onRender={c => { ctx = c; }} />);

    await waitFor(() => expect(window.electron.settings.get).toHaveBeenCalled());
    expect(ctx.whatsNewEntries).toEqual([]);
    expect(window.electron.settings.save).not.toHaveBeenCalledWith(
      expect.objectContaining({ lastSeenVersion: expect.anything() })
    );
  });

  it('persists silently when no entries exist in the unseen range', async () => {
    (window.electron.app.getVersion as jest.Mock).mockResolvedValue('1.8.0');
    (window.electron.settings.get as jest.Mock).mockResolvedValue({
      apiKey: 'valid-key',
      lastSeenVersion: '1.7.0',
    });

    let ctx!: ReturnType<typeof useAppContext>;
    renderWithProvider(<Consumer onRender={c => { ctx = c; }} />);

    await waitFor(() =>
      expect(window.electron.settings.save).toHaveBeenCalledWith({ lastSeenVersion: '1.8.0' })
    );
    expect(ctx.whatsNewEntries).toEqual([]);
  });

  it('dismissWhatsNew clears entries and persists the current version', async () => {
    (window.electron.settings.get as jest.Mock).mockResolvedValue({
      apiKey: 'valid-key',
      lastSeenVersion: '1.6.0',
    });

    let ctx!: ReturnType<typeof useAppContext>;
    renderWithProvider(<Consumer onRender={c => { ctx = c; }} />);
    await waitFor(() => expect(ctx.whatsNewEntries.length).toBe(2));

    act(() => { ctx.dismissWhatsNew(); });

    await waitFor(() =>
      expect(window.electron.settings.save).toHaveBeenCalledWith({ lastSeenVersion: '1.7.0' })
    );
    expect(ctx.whatsNewEntries).toEqual([]);
  });
});

describe('AppContext — update prompt', () => {
  let listeners: Record<string, (...args: any[]) => void>;

  beforeEach(() => {
    listeners = {};
    (window.electron.on as jest.Mock).mockImplementation((channel: string, cb: any) => {
      listeners[channel] = cb;
      return () => {};
    });
  });

  it('prompts when an update is available and not ignored', async () => {
    (window.electron.settings.get as jest.Mock).mockResolvedValue({ apiKey: 'valid-key' });

    let ctx!: ReturnType<typeof useAppContext>;
    renderWithProvider(<Consumer onRender={c => { ctx = c; }} />);
    await waitFor(() => expect(ctx.apiKey).toBe('valid-key'));

    act(() => { listeners['update-available']({ version: '1.8.0', downloaded: false }); });

    await waitFor(() => expect(ctx.updatePromptVersion).toBe('1.8.0'));
  });

  it('does not prompt for an ignored version but still updates the pill state', async () => {
    (window.electron.settings.get as jest.Mock).mockResolvedValue({
      apiKey: 'valid-key',
      ignoredUpdateVersion: '1.8.0',
    });

    let ctx!: ReturnType<typeof useAppContext>;
    renderWithProvider(<Consumer onRender={c => { ctx = c; }} />);
    await waitFor(() => expect(ctx.apiKey).toBe('valid-key'));

    act(() => { listeners['update-available']({ version: '1.8.0', downloaded: false }); });

    await waitFor(() => expect(ctx.updateStatus).toBe('available'));
    expect(ctx.updatePromptVersion).toBeNull();
  });

  it('does not prompt for an already-downloaded update', async () => {
    (window.electron.settings.get as jest.Mock).mockResolvedValue({ apiKey: 'valid-key' });

    let ctx!: ReturnType<typeof useAppContext>;
    renderWithProvider(<Consumer onRender={c => { ctx = c; }} />);
    await waitFor(() => expect(ctx.apiKey).toBe('valid-key'));

    act(() => { listeners['update-available']({ version: '1.8.0', downloaded: true }); });

    await waitFor(() => expect(ctx.updateStatus).toBe('ready'));
    expect(ctx.updatePromptVersion).toBeNull();
  });

  it('ignoreUpdateVersion persists the version and hides the prompt', async () => {
    (window.electron.settings.get as jest.Mock).mockResolvedValue({ apiKey: 'valid-key' });

    let ctx!: ReturnType<typeof useAppContext>;
    renderWithProvider(<Consumer onRender={c => { ctx = c; }} />);
    await waitFor(() => expect(ctx.apiKey).toBe('valid-key'));

    act(() => { listeners['update-available']({ version: '1.8.0', downloaded: false }); });
    await waitFor(() => expect(ctx.updatePromptVersion).toBe('1.8.0'));

    act(() => { ctx.ignoreUpdateVersion(); });

    await waitFor(() =>
      expect(window.electron.settings.save).toHaveBeenCalledWith({ ignoredUpdateVersion: '1.8.0' })
    );
    expect(ctx.updatePromptVersion).toBeNull();
  });

  it('dismissUpdatePrompt hides for the session without persisting', async () => {
    (window.electron.settings.get as jest.Mock).mockResolvedValue({ apiKey: 'valid-key' });

    let ctx!: ReturnType<typeof useAppContext>;
    renderWithProvider(<Consumer onRender={c => { ctx = c; }} />);
    await waitFor(() => expect(ctx.apiKey).toBe('valid-key'));

    act(() => { listeners['update-available']({ version: '1.8.0', downloaded: false }); });
    await waitFor(() => expect(ctx.updatePromptVersion).toBe('1.8.0'));

    act(() => { ctx.dismissUpdatePrompt(); });

    await waitFor(() => expect(ctx.updatePromptVersion).toBeNull());
    expect(window.electron.settings.save).not.toHaveBeenCalledWith(
      expect.objectContaining({ ignoredUpdateVersion: expect.anything() })
    );
  });

  it('stores previewBullets from the update-available payload', async () => {
    (window.electron.settings.get as jest.Mock).mockResolvedValue({ apiKey: 'valid-key' });

    let ctx!: ReturnType<typeof useAppContext>;
    renderWithProvider(<Consumer onRender={c => { ctx = c; }} />);
    await waitFor(() => expect(ctx.apiKey).toBe('valid-key'));

    act(() => {
      listeners['update-available']({
        version: '1.8.0',
        downloaded: false,
        previewBullets: [{ English: 'Faster startup' }],
      });
    });

    await waitFor(() => expect(ctx.updatePreviewBullets).toEqual([{ English: 'Faster startup' }]));
  });

  it('defaults previewBullets to null when the payload omits it', async () => {
    (window.electron.settings.get as jest.Mock).mockResolvedValue({ apiKey: 'valid-key' });

    let ctx!: ReturnType<typeof useAppContext>;
    renderWithProvider(<Consumer onRender={c => { ctx = c; }} />);
    await waitFor(() => expect(ctx.apiKey).toBe('valid-key'));

    act(() => { listeners['update-available']({ version: '1.8.0', downloaded: false }); });

    await waitFor(() => expect(ctx.updatePromptVersion).toBe('1.8.0'));
    expect(ctx.updatePreviewBullets).toBeNull();
  });
});
