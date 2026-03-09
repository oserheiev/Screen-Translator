import { app, BrowserWindow, ipcMain, globalShortcut, screen, Tray, Menu, systemPreferences, shell } from 'electron';
import * as path from 'path';
import * as url from 'url';
import Store from 'electron-store';
import { Settings } from './types';
import { WINDOW_CONFIG, TRAY_ICONS, IPC_CHANNELS } from './constants';

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

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let captureWindows: Map<number, BrowserWindow> = new Map();

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: WINDOW_CONFIG.WIDTH,
    height: WINDOW_CONFIG.HEIGHT,
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

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Capture Screen',
      click: () => startScreenCapture()
    },
    {
      label: 'Open',
      click: () => mainWindow?.show()
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit',
      click: () => {
        app.quitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Screen Translator');
  tray.setContextMenu(contextMenu);

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

  globalShortcut.unregisterAll();

  try {
    const success = globalShortcut.register(hotkey, () => {
      startScreenCapture();
    });

    if (!success) {
      console.error('Failed to register global shortcut - hotkey may be in use:', hotkey);
    } else {
      console.log('Successfully registered global shortcut:', hotkey);
    }
  } catch (error) {
    console.error('Failed to register global shortcut:', error);
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

async function startScreenCapture() {
  console.log('Starting screen capture...');

  const hasPermission = await requestScreenCapturePermission();
  if (!hasPermission) {
    return;
  }

  await closeAllCaptureWindows();

  const displays = screen.getAllDisplays();
  console.log(`Found ${displays.length} displays`);

  try {
    const windowCreationPromises = displays.map(async (display) => {
      const window = await createCaptureWindowForDisplay(display);
      captureWindows.set(display.id, window);
      return { window, displayId: display.id };
    });

    const windowResults = await Promise.all(windowCreationPromises);

    const setupPromises = windowResults.map(async ({ window, displayId }) => {
      const [_] = await Promise.all([
        loadCaptureInterfaceForWindow(window),
        Promise.resolve(setupCaptureWindowEvents(window, displayId))
      ]);
    });

    await Promise.all(setupPromises);

    showAllCaptureWindows();

    console.log(`Initialized capture windows for ${captureWindows.size} displays`);
  } catch (error) {
    console.error('Failed to start screen capture:', error);
    if (mainWindow) {
      mainWindow.webContents.send(IPC_CHANNELS.CAPTURE_ERROR,
        `Failed to start screen capture: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    await closeAllCaptureWindows();
  }
}

async function closeAllCaptureWindows() {
  console.log(`Closing ${captureWindows.size} capture windows`);

  const closePromises = Array.from(captureWindows.values()).map(window => {
    return new Promise<void>((resolve) => {
      if (window && !window.isDestroyed()) {
        window.once('closed', () => resolve());
        window.close();
      } else {
        resolve();
      }
    });
  });

  await Promise.all(closePromises);
  captureWindows.clear();
  await new Promise(resolve => setTimeout(resolve, 100));
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

function setupIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.START_CAPTURE, async () => {
    await startScreenCapture();
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, () => {
    return {
      apiKey: store.get('apiKey'),
      sourceLanguage: store.get('sourceLanguage'),
      targetLanguage: store.get('targetLanguage'),
      hotkey: store.get('hotkey'),
      theme: store.get('theme'),
      model: store.get('model')
    };
  });

  ipcMain.handle(IPC_CHANNELS.SAVE_SETTINGS, (_, settings: Partial<Settings>) => {
    if (settings.apiKey !== undefined) store.set('apiKey', settings.apiKey);
    if (settings.sourceLanguage !== undefined) store.set('sourceLanguage', settings.sourceLanguage);
    if (settings.targetLanguage !== undefined) store.set('targetLanguage', settings.targetLanguage);
    if (settings.hotkey !== undefined) {
      store.set('hotkey', settings.hotkey);
      registerGlobalShortcut();
    }
    if (settings.theme !== undefined) store.set('theme', settings.theme);
    if (settings.model !== undefined) store.set('model', settings.model);
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

  ipcMain.handle(IPC_CHANNELS.CAPTURE_COMPLETED, async (_, imageData: string) => {
    await closeAllCaptureWindows();
    mainWindow?.webContents.send(IPC_CHANNELS.IMAGE_CAPTURED, imageData);
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
}

// App lifecycle events
app.on('ready', () => {
  createWindow();
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
  globalShortcut.unregisterAll();
});

declare global {
  namespace Electron {
    interface App {
      quitting: boolean;
    }
  }
}

app.quitting = false;