import { BrowserWindow } from 'electron';
import * as path from 'path';
import * as url from 'url';
import { WINDOW_CONFIG } from './constants';

export function createCaptureWindow(display: Electron.Display): BrowserWindow {
  const captureWindow = new BrowserWindow({
    width: display.bounds.width,
    height: display.bounds.height,
    x: display.bounds.x,
    y: display.bounds.y,
    transparent: true,
    frame: false,
    fullscreen: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    show: false,
    focusable: true,
    acceptFirstMouse: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, WINDOW_CONFIG.PRELOAD_PATH),
      additionalArguments: [`--display-id=${display.id}`]
    }
  });

  captureWindow.setVisibleOnAllWorkspaces(true);

  captureWindow.setBounds({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height
  });

  if (process.platform === 'darwin') {
    captureWindow.setPosition(display.bounds.x, display.bounds.y);
  }

  return captureWindow;
}

export async function loadCaptureInterface(captureWindow: BrowserWindow): Promise<void> {
  await captureWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, WINDOW_CONFIG.CAPTURE_HTML_PATH),
      protocol: 'file:',
      slashes: true
    })
  );
}
