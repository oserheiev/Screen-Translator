import { app, BrowserWindow, ipcMain, globalShortcut, screen, Tray, Menu, systemPreferences, shell } from 'electron';
import * as path from 'path';
import * as url from 'url';
import Store from 'electron-store';
import { Settings, SupportedLanguage, Theme } from './types';

// Initialize the settings store
const store = new Store<Settings>({
  defaults: {
    apiKey: '',
    sourceLanguage: 'Auto',
    targetLanguage: 'English',
    hotkey: process.platform === 'darwin' ? 'Command+Alt+T' : 'Ctrl+Alt+T',
    theme: 'system'
  }
});

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let captureWindows: Map<number, BrowserWindow> = new Map();

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../../assets/icons/icon.png')
  });

  // Load the index.html of the app
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, '../index.html'),
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
    // macOS uses 16x16 or 32x32 for tray icons
    iconPath = path.join(__dirname, '../../assets/icons/icon-mac.png');
  } else if (process.platform === 'win32') {
    // Windows typically uses 16x16 for tray icons
    iconPath = path.join(__dirname, '../../assets/icons/icon.png');
  } else {
    // Linux and other platforms
    iconPath = path.join(__dirname, '../../assets/icons/icon.png');
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

  // Validate hotkey before registration
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

      if (status === 'denied') {
        console.error('Screen capture permission denied by user');
        if (mainWindow) {
          mainWindow.webContents.send('capture-error',
            'Screen recording permission denied. Please enable it in System Preferences > Security & Privacy > Privacy > Screen Recording, then restart the application.'
          );
        }
        return false;
      } else if (status === 'not-determined') {
        console.log('Screen capture permission not determined, will be requested during capture');
        // Note: Screen recording permission cannot be requested programmatically on macOS
        // It will be requested automatically when getUserMedia is called
        if (mainWindow) {
          mainWindow.webContents.send('capture-error',
            'Screen recording permission is required. The system will prompt you to grant permission when you start capturing. If denied, please enable it manually in System Preferences > Security & Privacy > Privacy > Screen Recording.'
          );
        }
        return true; // Allow the attempt - permission will be requested during getUserMedia
      }
      return status === 'granted';
    } catch (error) {
      console.error('Error checking screen capture permission:', error);
      if (mainWindow) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        mainWindow.webContents.send('capture-error',
          `Error checking screen capture permissions: ${errorMessage}. Please try again.`
        );
      }
      return false; // Don't proceed if we can't check permissions
    }
  }
  return true; // Non-macOS platforms
}
async function startScreenCapture() {
  console.log('Starting optimized multi-monitor screen capture...');

  // Check permissions first
  const hasPermission = await requestScreenCapturePermission();
  if (!hasPermission) {
    console.error('Screen capture permission not granted');
    return;
  }

  // Force close any existing capture windows first
  await closeAllCaptureWindows();

  // Get all displays for multi-monitor support
  const displays = screen.getAllDisplays();
  console.log(`Found ${displays.length} displays for capture`);

  try {
    // Create capture windows for all displays in parallel for better performance
    const windowCreationPromises = displays.map(async (display) => {
      const window = await createCaptureWindowForDisplay(display);
      captureWindows.set(display.id, window);
      return { window, displayId: display.id };
    });

    const windowResults = await Promise.all(windowCreationPromises);
    console.log(`Created ${windowResults.length} capture windows`);

    // Load capture interface and setup events in parallel
    const setupPromises = windowResults.map(async ({ window, displayId }) => {
      // Load interface and setup events concurrently
      const [_] = await Promise.all([
        loadCaptureInterfaceForWindow(window),
        Promise.resolve(setupCaptureWindowEvents(window, displayId))
      ]);
    });

    await Promise.all(setupPromises);

    // Show all capture windows immediately
    showAllCaptureWindows();

    console.log(`Successfully initialized capture windows for ${captureWindows.size} displays`);
  } catch (error) {
    console.error('Failed to start screen capture:', error);
    if (mainWindow) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      mainWindow.webContents.send('capture-error',
        `Failed to start screen capture: ${errorMessage}. Please try again.`
      );
    }
    await closeAllCaptureWindows();
  }
}

async function closeAllCaptureWindows() {
  console.log(`Closing ${captureWindows.size} existing capture windows`);

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

  // Wait a moment for cleanup
  await new Promise(resolve => setTimeout(resolve, 100));
}

async function createCaptureWindowForDisplay(display: Electron.Display): Promise<BrowserWindow> {
  console.log(`Creating capture window for display ${display.id}: ${JSON.stringify(display.bounds)}`);

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
      preload: path.join(__dirname, 'preload.js'),
      additionalArguments: [`--display-id=${display.id}`]
    }
  });

  // Set visible on all workspaces after creation
  captureWindow.setVisibleOnAllWorkspaces(true);

  // Ensure the window covers the entire screen with exact positioning
  captureWindow.setBounds({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height
  });

  // Additional positioning for multi-monitor setups
  if (process.platform === 'darwin') {
    // macOS specific: ensure window appears on correct screen
    captureWindow.setPosition(display.bounds.x, display.bounds.y);
  }

  console.log(`Capture window created for display ${display.id} at position (${display.bounds.x}, ${display.bounds.y}) with size ${display.bounds.width}x${display.bounds.height}`);

  return captureWindow;
}

async function loadCaptureInterfaceForWindow(captureWindow: BrowserWindow) {
  await captureWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, '../capture.html'),
      protocol: 'file:',
      slashes: true
    })
  );
  console.log('Capture page loaded successfully for window');
}

function setupCaptureWindowEvents(captureWindow: BrowserWindow, displayId: number) {
  // Handle load failures
  captureWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`Capture window for display ${displayId} failed to load:`, errorCode, errorDescription);
    if (mainWindow) {
      mainWindow.webContents.send('capture-error',
        `Capture window failed to load: ${errorDescription}. Please try again.`
      );
    }
    captureWindows.delete(displayId);
    if (!captureWindow.isDestroyed()) {
      captureWindow.close();
    }
  });

  captureWindow.on('closed', () => {
    console.log(`Capture window for display ${displayId} closed`);
    captureWindows.delete(displayId);
  });

  // Handle ESC key to cancel capture - close all windows
  captureWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape') {
      console.log('ESC key pressed, closing all capture windows');
      closeAllCaptureWindows();
    }
  });

  // Forward console messages for debugging
  captureWindow.webContents.on('console-message', (event, level, message) => {
    console.log(`[Capture Window ${displayId}] ${message}`);
  });
}

function showAllCaptureWindows() {
  console.log(`Showing ${captureWindows.size} capture windows with optimized timing`);

  captureWindows.forEach((captureWindow, displayId) => {
    if (captureWindow && !captureWindow.isDestroyed()) {
      console.log(`Preparing to show capture window for display ${displayId}`);

      // Set up ready-to-show handler with faster fallback
      let shown = false;

      const showWindow = () => {
        if (shown || captureWindow.isDestroyed()) return;
        shown = true;

        console.log(`Showing capture window for display ${displayId}`);

        // Optimized window showing sequence
        captureWindow.setAlwaysOnTop(true, 'screen-saver');
        captureWindow.setIgnoreMouseEvents(false);
        captureWindow.setVisibleOnAllWorkspaces(true);
        captureWindow.show();
        captureWindow.focus();
        captureWindow.moveTop();

        // Immediate focus without delay for better responsiveness
        process.nextTick(() => {
          if (captureWindow && !captureWindow.isDestroyed()) {
            captureWindow.focus();
            captureWindow.moveTop();
            console.log(`Capture window for display ${displayId} is now active`);
          }
        });
      };

      // Try ready-to-show first
      captureWindow.once('ready-to-show', showWindow);

      // Faster fallback timeout for better responsiveness
      setTimeout(() => {
        if (!shown) {
          console.log(`Fast fallback: Force showing capture window for display ${displayId}`);
          showWindow();
        }
      }, 300); // Reduced from 1000ms to 300ms
    }
  });
}

// IPC handlers
function setupIpcHandlers() {
  ipcMain.handle('start-screen-capture', async () => {
    await startScreenCapture();
    return true;
  });

  ipcMain.handle('get-settings', () => {
    return {
      apiKey: store.get('apiKey'),
      sourceLanguage: store.get('sourceLanguage'),
      targetLanguage: store.get('targetLanguage'),
      hotkey: store.get('hotkey'),
      theme: store.get('theme')
    };
  });

  ipcMain.handle('save-settings', (_, settings: Partial<Settings>) => {
    if (settings.apiKey !== undefined) {
      store.set('apiKey', settings.apiKey);
    }

    if (settings.sourceLanguage !== undefined) {
      store.set('sourceLanguage', settings.sourceLanguage);
    }

    if (settings.targetLanguage !== undefined) {
      store.set('targetLanguage', settings.targetLanguage);
    }

    if (settings.hotkey !== undefined) {
      store.set('hotkey', settings.hotkey);
      registerGlobalShortcut();
    }

    if (settings.theme !== undefined) {
      store.set('theme', settings.theme);
    }

    return true;
  });

  ipcMain.handle('clipboard-write-text', async (_, text: string) => {
    require('electron').clipboard.writeText(text);
  });

  ipcMain.handle('get-screens', async () => {
    const displays = screen.getAllDisplays();
    console.log(`Returning ${displays.length} displays:`, displays.map(d => ({ id: d.id, bounds: d.bounds })));
    return displays;
  });

  ipcMain.handle('get-sources', async () => {
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

  ipcMain.handle('capture-completed', async (_, imageData: string) => {
    console.log('Capture completed, image data length:', imageData.length);
    console.log('Sending image-captured event to main window');

    // Close and cleanup all capture windows
    await closeAllCaptureWindows();

    mainWindow?.webContents.send('image-captured', imageData);
    console.log('Image-captured event sent');
  });

  ipcMain.handle('log-message', (_, message: string, ...args: any[]) => {
    console.log(message, ...args);
  });

  ipcMain.handle('get-platform', () => {
    return process.platform;
  });

  ipcMain.handle('show-window', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
      mainWindow.focus();
      mainWindow.moveTop();
    }
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

// Declare app.quitting property
declare global {
  namespace Electron {
    interface App {
      quitting: boolean;
    }
  }
}

app.quitting = false;