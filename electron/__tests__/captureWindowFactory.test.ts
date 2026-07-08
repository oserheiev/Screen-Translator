import { createCaptureWindow, loadCaptureInterface } from '../captureWindowFactory';
import { BrowserWindow } from 'electron';

const MockBrowserWindow = BrowserWindow as jest.MockedClass<typeof BrowserWindow>;

const display = {
  id: 42,
  bounds: { x: 100, y: 50, width: 1920, height: 1080 },
  scaleFactor: 1,
} as unknown as Electron.Display;

describe('createCaptureWindow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a hidden transparent frameless always-on-top window sized to the display', () => {
    createCaptureWindow(display);

    expect(MockBrowserWindow).toHaveBeenCalledWith(expect.objectContaining({
      x: 100,
      y: 50,
      width: 1920,
      height: 1080,
      show: false,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: true,
    }));
  });

  it('passes the display id to the renderer via additionalArguments', () => {
    createCaptureWindow(display);

    const options = MockBrowserWindow.mock.calls[0][0]!;
    expect(options.webPreferences!.additionalArguments).toContain('--display-id=42');
  });

  it('makes the window visible on all workspaces and sets explicit bounds', () => {
    const win = createCaptureWindow(display);

    expect(win.setVisibleOnAllWorkspaces).toHaveBeenCalledWith(true);
    expect(win.setBounds).toHaveBeenCalledWith({
      x: 100, y: 50, width: 1920, height: 1080,
    });
  });
});

describe('loadCaptureInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads capture.html into the window', async () => {
    const win = createCaptureWindow(display);

    await loadCaptureInterface(win);

    expect(win.loadURL).toHaveBeenCalledWith(expect.stringContaining('capture.html'));
  });
});
