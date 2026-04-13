import { showCaptureWindows } from '../captureWindowManager';
import { app, BrowserWindow, globalShortcut } from 'electron';

const MockBrowserWindow = BrowserWindow as jest.MockedClass<typeof BrowserWindow>;

function makeMockWindow() {
  const win = new MockBrowserWindow() as jest.Mocked<InstanceType<typeof BrowserWindow>>;
  // Suppress ready-to-show so we control timing via fake timers
  (win.once as jest.Mock).mockImplementation(() => win);
  return win;
}

describe('showCaptureWindows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calls show() on each capture window', () => {
    const win = makeMockWindow();
    showCaptureWindows(new Map([[1, win as any]]), jest.fn());

    jest.advanceTimersByTime(300);

    expect(win.show).toHaveBeenCalled();
  });

  it('calls focus() on each capture window', () => {
    const win = makeMockWindow();
    showCaptureWindows(new Map([[1, win as any]]), jest.fn());

    jest.advanceTimersByTime(300);

    expect(win.focus).toHaveBeenCalled();
  });

  it('does not call showInactive()', () => {
    const win = makeMockWindow();
    showCaptureWindows(new Map([[1, win as any]]), jest.fn());

    jest.advanceTimersByTime(300);

    expect(win.showInactive).not.toHaveBeenCalled();
  });

  it('calls app.focus({ steal: true }) to allow stealing focus from foreground apps', () => {
    showCaptureWindows(new Map(), jest.fn());

    expect(app.focus).toHaveBeenCalledWith({ steal: true });
  });

  it('registers Escape shortcut to invoke the close callback', () => {
    const onClose = jest.fn();
    showCaptureWindows(new Map(), onClose);

    expect(globalShortcut.register).toHaveBeenCalledWith('Escape', expect.any(Function));
  });

  it('shows windows via ready-to-show event when it fires before the timeout', () => {
    const win = makeMockWindow();
    // Fire ready-to-show synchronously when registered
    (win.once as jest.Mock).mockImplementation((event: string, cb: () => void) => {
      if (event === 'ready-to-show') cb();
      return win;
    });

    showCaptureWindows(new Map([[1, win as any]]), jest.fn());

    expect(win.show).toHaveBeenCalled();
    expect(win.focus).toHaveBeenCalled();
  });

  it('only shows each window once even if both ready-to-show and timeout fire', () => {
    const win = makeMockWindow();
    (win.once as jest.Mock).mockImplementation((event: string, cb: () => void) => {
      if (event === 'ready-to-show') cb();
      return win;
    });

    showCaptureWindows(new Map([[1, win as any]]), jest.fn());
    jest.advanceTimersByTime(300);

    expect(win.show).toHaveBeenCalledTimes(1);
    expect(win.focus).toHaveBeenCalledTimes(1);
  });

  it('skips already-destroyed windows', () => {
    const win = makeMockWindow();
    (win.isDestroyed as jest.Mock).mockReturnValue(true);

    showCaptureWindows(new Map([[1, win as any]]), jest.fn());
    jest.advanceTimersByTime(300);

    expect(win.show).not.toHaveBeenCalled();
    expect(win.focus).not.toHaveBeenCalled();
  });

  it('does not call setVisibleOnAllWorkspaces (already set at window creation)', () => {
    const win = makeMockWindow();
    showCaptureWindows(new Map([[1, win as any]]), jest.fn());
    jest.advanceTimersByTime(300);
    expect(win.setVisibleOnAllWorkspaces).not.toHaveBeenCalled();
  });

  it('invokes the close callback when Escape is pressed', () => {
    const onClose = jest.fn();
    showCaptureWindows(new Map(), onClose);

    const [, escapeHandler] = (globalShortcut.register as jest.Mock).mock.calls[0];
    escapeHandler();

    expect(onClose).toHaveBeenCalled();
  });

  it('shows and focuses all windows when multiple displays are active', () => {
    const win1 = makeMockWindow();
    const win2 = makeMockWindow();
    showCaptureWindows(new Map([[1, win1 as any], [2, win2 as any]]), jest.fn());

    jest.advanceTimersByTime(300);

    expect(win1.show).toHaveBeenCalled();
    expect(win1.focus).toHaveBeenCalled();
    expect(win2.show).toHaveBeenCalled();
    expect(win2.focus).toHaveBeenCalled();
  });
});
