import { app, BrowserWindow, globalShortcut, ipcMain, screen, Tray, Menu, systemPreferences, shell } from 'electron';
import { keyboardHook } from './keyboardHook';
import * as path from 'path';
import * as url from 'url';
import Store from 'electron-store';
import { autoUpdater } from 'electron-updater';
import { Settings, AppLanguage } from './types';
import { WINDOW_CONFIG, TRAY_ICONS, IPC_CHANNELS } from './constants';
import { getLocale } from '../src/i18n/index';

// Enforce single application instance
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
}

function getTrayLabels() {
  const lang = store?.get('appLanguage') ?? 'English';
  return getLocale(lang as AppLanguage);
}

function detectAppLanguage(locale: string): AppLanguage {
  const l = locale.toLowerCase();
  if (l.startsWith('ru')) return 'Russian';
  if (l.startsWith('uk')) return 'Ukrainian';
  if (l.startsWith('es')) return 'Spanish';
  if (l.startsWith('fr')) return 'French';
  if (l.startsWith('de')) return 'German';
  if (l.startsWith('it')) return 'Italian';
  if (l.startsWith('pt')) return 'Portuguese';
  if (l.startsWith('zh')) return 'Chinese (Simplified)';
  if (l.startsWith('ja')) return 'Japanese';
  if (l.startsWith('ko')) return 'Korean';
  if (l.startsWith('pl')) return 'Polish';
  return 'English';
}

// Initialize the settings store
const store = new Store<Settings>({
  defaults: {
    apiKey: '',
    sourceLanguage: 'Auto',
    targetLanguage: 'English',
    hotkey: process.platform === 'darwin' ? 'Command+Alt+T' : 'Ctrl+Alt+T',
    theme: 'system',
    model: 'gemini-2.5-flash'
  }
});

// Base64 obfuscation for API key storage.
// NOTE: Base64 is NOT encryption — it only prevents the key from being
// immediately readable in the config file (casual obfuscation).
function encodeApiKey(plain: string): string {
  return Buffer.from(plain).toString('base64');
}

function decodeApiKey(encoded: string): string {
  try {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  } catch {
    return encoded;
  }
}

// Migrate plain-text API key from previous versions to Base64.
// Uses an explicit flag to avoid false positives with keys that happen to be valid Base64.
function migrateApiKey() {
  if ((store as any).get('apiKeyMigrated')) return;
  const raw = store.get('apiKey');
  if (raw) {
    store.set('apiKey', encodeApiKey(raw));
  }
  (store as any).set('apiKeyMigrated', true);
}

migrateApiKey();

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let captureWindows: Map<number, BrowserWindow> = new Map();
let isCapturing = false;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: WINDOW_CONFIG.WIDTH,
    height: WINDOW_CONFIG.HEIGHT,
    minWidth: WINDOW_CONFIG.MIN_WIDTH,
    minHeight: WINDOW_CONFIG.MIN_HEIGHT,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, WINDOW_CONFIG.PRELOAD_PATH)
    },
    icon: path.join(__dirname, WINDOW_CONFIG.ICON_PATH)
  });

  // Load the index.html of the app
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, WINDOW_CONFIG.INDEX_HTML_PATH),
      protocol: 'file:',
      slashes: true
    })
  );

  // Open DevTools for debugging
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--debug')) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window close event
  mainWindow.on('close', (event) => {
    if (app.quitting) {
      mainWindow = null;
    } else {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  // Create tray icon
  createTray();

  // Register global shortcut
  registerGlobalShortcut();

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Set up IPC handlers
  setupIpcHandlers();

  // Set up auto-updater
  setupAutoUpdater();
}

function buildTrayMenu() {
  const labels = getTrayLabels();
  return Menu.buildFromTemplate([
    {
      label: labels.trayCapture,
      click: () => startScreenCapture()
    },
    {
      label: labels.trayOpen,
      click: () => mainWindow?.show()
    },
    {
      type: 'separator'
    },
    {
      label: labels.trayQuit,
      click: () => {
        app.quitting = true;
        app.quit();
      }
    }
  ]);
}

function updateTrayMenu() {
  if (tray && !tray.isDestroyed()) {
    tray.setContextMenu(buildTrayMenu());
  }
}

function createTray() {
  if (!mainWindow) return;

  // Use platform-specific tray icons for proper sizing
  let iconPath: string;
  if (process.platform === 'darwin') {
    iconPath = path.join(__dirname, TRAY_ICONS.MACOS);
  } else {
    iconPath = path.join(__dirname, TRAY_ICONS.WINDOWS);
  }

  tray = new Tray(iconPath);
  tray.setToolTip('Screen Translator');
  tray.setContextMenu(buildTrayMenu());

  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
    }
  });
}

function registerGlobalShortcut() {
  const hotkey = store.get('hotkey');

  if (!hotkey || typeof hotkey !== 'string' || hotkey.trim() === '') {
    console.error('Invalid hotkey configuration:', hotkey);
    return;
  }

  keyboardHook.unregisterAll();
  const registered = keyboardHook.registerHotkey(hotkey, () => {
    startScreenCapture();
  });

  if (!registered && mainWindow) {
    mainWindow.webContents.send(
      IPC_CHANNELS.CAPTURE_ERROR,
      `Hotkey "${hotkey}" could not be registered: unknown key. Please update it in Settings.`
    );
  }
}

async function requestScreenCapturePermission(): Promise<boolean> {
  if (process.platform === 'darwin') {
    try {
      const status = systemPreferences.getMediaAccessStatus('screen');
      console.log('Screen capture permission status:', status);

      if (status === 'denied' || status === 'not-determined') {
        console.log('Screen capture permission not granted, status:', status);
        // Attempt getSources to register the app in macOS Screen Recording list
        try {
          const { desktopCapturer } = require('electron');
          await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 0, height: 0 } });
        } catch (_) { /* ignore — just triggering registration */ }
        if (mainWindow) {
          mainWindow.webContents.send(IPC_CHANNELS.PERMISSION_ERROR, { platform: process.platform });
        }
        return false;
      }
      return status === 'granted';
    } catch (error) {
      console.error('Error checking screen capture permission:', error);
      return false;
    }
  }
  return true;
}

function findSourceForDisplay(display: Electron.Display, sources: Electron.DesktopCapturerSource[]): Electron.DesktopCapturerSource | null {
  const screenSources = sources.filter((s: any) => s.id.startsWith('screen:'));
  const match = screenSources.find((source: any) => {
    if (source.id.includes(display.id.toString())) return true;
    // @ts-ignore - display_id may be present on some platforms
    if (source.display_id === `screen:${display.id}:0`) return true;
    if (source.name && source.name.includes(display.id.toString())) return true;
    return false;
  });
  return match || screenSources[0] || null;
}

async function startScreenCapture() {
  if (isCapturing) return;
  isCapturing = true;
  console.log('Starting screen capture...');

  const hasPermission = await requestScreenCapturePermission();
  if (!hasPermission) {
    isCapturing = false;
    return;
  }

  await closeAllCaptureWindows();

  const displays = screen.getAllDisplays();
  console.log(`Found ${displays.length} displays`);

  try {
    // Capture screenshots in main process before creating overlay windows.
    // This avoids getUserMedia/video stream overhead and is faster.
    // Each display gets its own getSources() call with the exact physical pixel dimensions
    // so thumbnails are never upscaled or aspect-ratio-constrained by another display's size.
    const { desktopCapturer } = require('electron');

    const screenshotsByDisplayId = new Map<number, string>();
    await Promise.all(displays.map(async (display) => {
      const physWidth = Math.round(display.bounds.width * display.scaleFactor);
      const physHeight = Math.round(display.bounds.height * display.scaleFactor);
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: physWidth, height: physHeight }
      });
      const source = findSourceForDisplay(display, sources);
      if (source) {
        screenshotsByDisplayId.set(display.id, source.thumbnail.toDataURL());
        console.log(`Captured screenshot for display ${display.id} at ${physWidth}x${physHeight}`);
      } else {
        console.warn(`No source found for display ${display.id}`);
      }
    }));

    const windowCreationPromises = displays.map(async (display) => {
      const window = await createCaptureWindowForDisplay(display);
      captureWindows.set(display.id, window);
      return { window, displayId: display.id };
    });

    const windowResults = await Promise.all(windowCreationPromises);

    const setupPromises = windowResults.map(async ({ window, displayId }) => {
      await loadCaptureInterfaceForWindow(window);
      setupCaptureWindowEvents(window, displayId);

      // Send pre-captured screenshot along with display bounds to the window renderer
      const screenshot = screenshotsByDisplayId.get(displayId);
      const display = displays.find(d => d.id === displayId)!;
      if (screenshot) {
        window.webContents.send(IPC_CHANNELS.SCREENSHOT_READY, {
          dataUrl: screenshot,
          displayId,
          displayX: display.bounds.x,
          displayY: display.bounds.y,
        });
      } else {
        console.error(`No screenshot available for display ${displayId}`);
        window.webContents.send(IPC_CHANNELS.CAPTURE_ERROR, 'Failed to capture screenshot for this display');
      }
    });

    await Promise.all(setupPromises);

    showAllCaptureWindows();

    console.log(`Initialized capture windows for ${captureWindows.size} displays`);
  } catch (error) {
    console.error('Failed to start screen capture:', error);
    isCapturing = false;
    if (mainWindow) {
      mainWindow.webContents.send(IPC_CHANNELS.CAPTURE_ERROR,
        `Failed to start screen capture: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    await closeAllCaptureWindows();
  }
}

let isClosingWindows = false;
async function closeAllCaptureWindows() {
  if (isClosingWindows || captureWindows.size === 0) return;
  isClosingWindows = true;

  globalShortcut.unregister('Escape');

  try {
    console.log(`Closing ${captureWindows.size} capture windows`);
    const windows = Array.from(captureWindows.values());
    captureWindows.clear();

    for (const win of windows) {
      if (win && !win.isDestroyed()) {
        try {
          win.hide();
          // Use setImmediate to ensure current event loop finishes before destruction
          setImmediate(() => {
            if (!win.isDestroyed()) win.destroy();
          });
        } catch (e) {
          console.error('Error closing capture window:', e);
        }
      }
    }
  } finally {
    isClosingWindows = false;
    isCapturing = false;
  }
}

async function createCaptureWindowForDisplay(display: Electron.Display): Promise<BrowserWindow> {
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

async function loadCaptureInterfaceForWindow(captureWindow: BrowserWindow) {
  await captureWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, WINDOW_CONFIG.CAPTURE_HTML_PATH),
      protocol: 'file:',
      slashes: true
    })
  );
}

function setupCaptureWindowEvents(captureWindow: BrowserWindow, displayId: number) {
  captureWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`Capture window for display ${displayId} failed to load:`, errorDescription);
    if (mainWindow) {
      mainWindow.webContents.send(IPC_CHANNELS.CAPTURE_ERROR,
        `Capture window failed to load: ${errorDescription}`
      );
    }
    captureWindows.delete(displayId);
    if (!captureWindow.isDestroyed()) {
      captureWindow.close();
    }
  });

  captureWindow.on('closed', () => {
    captureWindows.delete(displayId);
  });

  captureWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape') {
      closeAllCaptureWindows();
    }
  });
}

function showAllCaptureWindows() {
  globalShortcut.register('Escape', () => closeAllCaptureWindows());

  captureWindows.forEach((captureWindow, displayId) => {
    if (captureWindow && !captureWindow.isDestroyed()) {
      let shown = false;

      const showWindow = () => {
        if (shown || captureWindow.isDestroyed()) return;
        shown = true;

        captureWindow.setAlwaysOnTop(true, 'screen-saver');
        captureWindow.setIgnoreMouseEvents(false);
        captureWindow.setVisibleOnAllWorkspaces(true);
        captureWindow.showInactive();
        captureWindow.moveTop();

        process.nextTick(() => {
          if (captureWindow && !captureWindow.isDestroyed()) {
            captureWindow.moveTop();
          }
        });
      };

      captureWindow.once('ready-to-show', showWindow);

      setTimeout(() => {
        if (!shown) {
          showWindow();
        }
      }, 300);
    }
  });
}

function setupAutoUpdater() {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send(IPC_CHANNELS.UPDATE_AVAILABLE, {
      version: info.version,
      releaseNotes: info.releaseNotes,
      downloaded: false
    });
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send(IPC_CHANNELS.UPDATE_PROGRESS, Math.round(progress.percent));
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send(IPC_CHANNELS.UPDATE_AVAILABLE, {
      version: info.version,
      downloaded: true
    });
  });

  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send(IPC_CHANNELS.UPDATE_ERROR, err.message);
  });

  ipcMain.handle(IPC_CHANNELS.CHECK_FOR_UPDATES, async () => {
    try {
      await autoUpdater.checkForUpdates();
    } catch (err) {
      mainWindow?.webContents.send(IPC_CHANNELS.UPDATE_ERROR, String(err));
    }
  });

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_UPDATE, async () => {
    if (process.platform === 'darwin') {
      shell.openExternal('https://github.com/oserheiev/Screen-Translator/releases/latest');
      return;
    }
    try {
      await autoUpdater.downloadUpdate();
    } catch (err) {
      mainWindow?.webContents.send(IPC_CHANNELS.UPDATE_ERROR, String(err));
    }
  });

  ipcMain.handle(IPC_CHANNELS.INSTALL_UPDATE, () => {
    autoUpdater.quitAndInstall();
  });

  // Check on startup, then every 4 hours
  autoUpdater.checkForUpdates().catch(() => {/* ignore startup errors */ });
  setInterval(() => {
    autoUpdater.checkForUpdates().catch(() => {/* ignore */ });
  }, 4 * 60 * 60 * 1000);
}

function setupIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.START_CAPTURE, async () => {
    await startScreenCapture();
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, () => {
    const storedKey = store.get('apiKey');
    return {
      apiKey: storedKey ? decodeApiKey(storedKey) : '',
      sourceLanguage: store.get('sourceLanguage'),
      targetLanguage: store.get('targetLanguage'),
      hotkey: store.get('hotkey'),
      theme: store.get('theme'),
      model: store.get('model'),
      appLanguage: store.get('appLanguage')
    };
  });

  ipcMain.handle(IPC_CHANNELS.SAVE_SETTINGS, (_, settings: Partial<Settings>) => {
    if (settings.apiKey !== undefined) store.set('apiKey', settings.apiKey ? encodeApiKey(settings.apiKey) : '');
    if (settings.sourceLanguage !== undefined) store.set('sourceLanguage', settings.sourceLanguage);
    if (settings.targetLanguage !== undefined) store.set('targetLanguage', settings.targetLanguage);
    if (settings.hotkey !== undefined) {
      store.set('hotkey', settings.hotkey);
      registerGlobalShortcut();
    }
    if (settings.theme !== undefined) store.set('theme', settings.theme);
    if (settings.model !== undefined) store.set('model', settings.model);
    if (settings.appLanguage !== undefined) {
      store.set('appLanguage', settings.appLanguage);
      updateTrayMenu(); // Rebuild tray menu in new language
    }
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_WRITE, async (_, text: string) => {
    require('electron').clipboard.writeText(text);
  });

  ipcMain.handle(IPC_CHANNELS.GET_SCREENS, async () => {
    return screen.getAllDisplays();
  });

  ipcMain.handle(IPC_CHANNELS.GET_SOURCES, async () => {
    try {
      const { desktopCapturer } = require('electron');
      const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: 0, height: 0 }
      });
      return sources;
    } catch (error) {
      console.error('Failed to get sources:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.CAPTURE_COMPLETED, async (_, imageDataPath: string) => {
    // Send data to main window first
    mainWindow?.webContents.send(IPC_CHANNELS.IMAGE_CAPTURED, imageDataPath);

    // Close capture windows asynchronously with a slight delay to ensure IPC return
    setTimeout(() => {
      closeAllCaptureWindows().catch(err => console.error('Delayed close failed:', err));
    }, 50);

    return true;
  });

  ipcMain.handle(IPC_CHANNELS.LOG_MESSAGE, (_, message: string, ...args: any[]) => {
    console.log(message, ...args);
  });

  ipcMain.handle(IPC_CHANNELS.GET_PLATFORM, () => {
    return process.platform;
  });

  ipcMain.handle(IPC_CHANNELS.SHOW_WINDOW, () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      mainWindow.moveTop();
    }
  });

  ipcMain.handle(IPC_CHANNELS.CAPTURE_READY, (event) => {
    const senderWindow = BrowserWindow.fromWebContents(event.sender);
    if (senderWindow) {
      console.log('Capture window reported ready, forcing focus');
      senderWindow.focus();
    }
  });

  ipcMain.handle(IPC_CHANNELS.SHOW_ALERT, async (_, { title, message }) => {
    const width = 400;
    const height = 250;

    const alertWindow = new BrowserWindow({
      width,
      height,
      frame: false,
      resizable: true, // Allow resizing so setSize works reliably
      alwaysOnTop: true,
      skipTaskbar: true, // Don't show in taskbar if possible
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, WINDOW_CONFIG.PRELOAD_PATH)
      },
      icon: path.join(__dirname, WINDOW_CONFIG.ICON_PATH)
    });

    // Get current theme if possible from store, or pass it
    const theme = store.get('theme') || 'system';

    alertWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, WINDOW_CONFIG.INDEX_HTML_PATH),
        protocol: 'file:',
        slashes: true,
        search: `?mode=alert&title=${encodeURIComponent(title)}&message=${encodeURIComponent(message)}&theme=${theme}`
      })
    );
  });

  ipcMain.handle(IPC_CHANNELS.CLOSE_WINDOW, (event) => {
    const senderWindow = BrowserWindow.fromWebContents(event.sender);
    senderWindow?.close();
  });

  ipcMain.handle(IPC_CHANNELS.RESIZE_WINDOW, (event, { width, height }) => {
    const senderWindow = BrowserWindow.fromWebContents(event.sender);
    if (senderWindow && !senderWindow.isDestroyed()) {
      senderWindow.setSize(width, height);
    }
  });

  ipcMain.handle(IPC_CHANNELS.OPEN_EXTERNAL, (_, url: string) => {
    shell.openExternal(url);
  });

  ipcMain.handle(IPC_CHANNELS.GET_HISTORY, () => {
    return store.get('history') || [];
  });

  ipcMain.handle(IPC_CHANNELS.SAVE_HISTORY, (_, history: any[]) => {
    store.set('history', history);
  });

  ipcMain.handle(IPC_CHANNELS.GET_VERSION, () => {
    return app.getVersion();
  });

}

// App lifecycle events
app.on('ready', () => {
  if (!store.get('appLanguage')) {
    store.set('appLanguage', detectAppLanguage(app.getLocale()));
  }
  const hookStarted = keyboardHook.start();
  createWindow();

  if (!hookStarted && process.platform === 'darwin' && mainWindow) {
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow?.webContents.send(IPC_CHANNELS.ACCESSIBILITY_ERROR);
    });
  }
});

// On second-instance attempt: focus/restore the existing window
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

app.on('before-quit', () => {
  app.quitting = true;
  keyboardHook.stop();
});

declare global {
  namespace Electron {
    interface App {
      quitting: boolean;
    }
  }
}

app.quitting = false;