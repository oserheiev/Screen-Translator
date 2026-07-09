import { showCaptureWindows } from '../captureWindowManager';
import { app, BrowserWindow, globalShortcut } from 'electron';

const MockBrowserWindow = BrowserWindow as jest.MockedClass<typeof BrowserWindow>;

function makeMockWindow() {
  return new MockBrowserWindow() as jest.Mocked<InstanceType<typeof BrowserWindow>>;
}

describe('showCaptureWindows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows, focuses and raises each capture window immediately (windows are pre-loaded)', () => {
    const win = makeMockWindow();

    showCaptureWindows(new Map([[1, win as any]]), jest.fn());

    expect(win.show).toHaveBeenCalledTimes(1);
    expect(win.focus).toHaveBeenCalledTimes(1);
    expect(win.moveTop).toHaveBeenCalled();
  });

  it('does not wait for ready-to-show', () => {
    const win = makeMockWindow();

    showCaptureWindows(new Map([[1, win as any]]), jest.fn());

    expect(win.once).not.toHaveBeenCalledWith('ready-to-show', expect.any(Function));
    expect(win.show).toHaveBeenCalled();
  });

  it('re-enables mouse events and raises always-on-top level', () => {
    const win = makeMockWindow();

    showCaptureWindows(new Map([[1, win as any]]), jest.fn());

    expect(win.setAlwaysOnTop).toHaveBeenCalledWith(true, 'screen-saver');
    expect(win.setIgnoreMouseEvents).toHaveBeenCalledWith(false);
  });

  it('does not call showInactive()', () => {
    const win = makeMockWindow();

    showCaptureWindows(new Map([[1, win as any]]), jest.fn());

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

  it('invokes the close callback when Escape is pressed', () => {
    const onClose = jest.fn();
    showCaptureWindows(new Map(), onClose);

    const [, escapeHandler] = (globalShortcut.register as jest.Mock).mock.calls[0];
    escapeHandler();

    expect(onClose).toHaveBeenCalled();
  });

  it('skips already-destroyed windows', () => {
    const win = makeMockWindow();
    (win.isDestroyed as jest.Mock).mockReturnValue(true);

    showCaptureWindows(new Map([[1, win as any]]), jest.fn());

    expect(win.show).not.toHaveBeenCalled();
    expect(win.focus).not.toHaveBeenCalled();
  });

  it('does not call setVisibleOnAllWorkspaces (already set at window creation)', () => {
    const win = makeMockWindow();

    showCaptureWindows(new Map([[1, win as any]]), jest.fn());

    expect(win.setVisibleOnAllWorkspaces).not.toHaveBeenCalled();
  });

  it('shows and focuses all windows when multiple displays are active', () => {
    const win1 = makeMockWindow();
    const win2 = makeMockWindow();

    showCaptureWindows(new Map([[1, win1 as any], [2, win2 as any]]), jest.fn());

    expect(win1.show).toHaveBeenCalled();
    expect(win1.focus).toHaveBeenCalled();
    expect(win2.show).toHaveBeenCalled();
    expect(win2.focus).toHaveBeenCalled();
  });
});
