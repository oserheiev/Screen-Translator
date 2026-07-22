import { app, BrowserWindow, globalShortcut, ipcMain, screen, Tray, Menu, systemPreferences, shell } from 'electron';
import { keyboardHook } from './keyboardHook';
import * as path from 'path';
import * as url from 'url';
import Store from 'electron-store';
import { autoUpdater } from 'electron-updater';
import { Settings, AppLanguage } from './types';
import { WINDOW_CONFIG, TRAY_ICONS, IPC_CHANNELS } from './constants';
import { getLocale } from '../src/i18n/index';
import { showCaptureWindows } from './captureWindowManager';
import { validateWindowBounds } from './windowBounds';
import { createCaptureWindow, loadCaptureInterface } from './captureWindowFactory';
import { captureDisplayScreenshots } from './screenshot';
import { CaptureWindowPool } from './captureWindowPool';
import { buildLoginItemSettings } from './loginItem';
import { createAnalyticsClient, getOrCreateDistinctId, buildTranslationEventProperties, trackAppStarted, trackTranslationCompleted } from './analytics';

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
    model: 'gemini-2.5-flash',
    alwaysOnTop: false,
    startMinimizedToTray: false
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

const analyticsClient = createAnalyticsClient();
const analyticsDistinctId = getOrCreateDistinctId(store);

function computeLoginItemSettings(openAtLogin: boolean) {
  const startHidden = !!store.get('startMinimizedToTray');
  return buildLoginItemSettings(openAtLogin, startHidden, {
    isPackaged: app.isPackaged,
    execPath: process.execPath,
    appEntryArg: process.argv[1] ?? '.',
  });
}

function applyLoginItemSettings(openAtLogin: boolean) {
  app.setLoginItemSettings(computeLoginItemSettings(openAtLogin));
}

function isLoginItemEnabled(): boolean {
  const { path: loginItemPath, args } = computeLoginItemSettings(true);
  return app.getLoginItemSettings({ path: loginItemPath, args }).openAtLogin;
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let captureWindows: Map<number, BrowserWindow> = new Map();
let isCapturing = false;

let captureFromPool = false;
const captureWindowPool = new CaptureWindowPool({
  onWindowCreated: (win) => {
    win.webContents.on('before-input-event', (_event, input) => {
      if (input.key === 'Escape') {
        closeAllCaptureWindows().catch(console.error);
      }
    });
  },
});

function createWindow(startHidden: boolean = false) {
  const savedBounds = validateWindowBounds(
    store.get('windowBounds'),
    screen.getAllDisplays()
  );

  mainWindow = new BrowserWindow({
    width: savedBounds?.width ?? WINDOW_CONFIG.WIDTH,
    height: savedBounds?.height ?? WINDOW_CONFIG.HEIGHT,
    x: savedBounds?.x,
    y: savedBounds?.y,
    minWidth: WINDOW_CONFIG.MIN_WIDTH,
    minHeight: WINDOW_CONFIG.MIN_HEIGHT,
    alwaysOnTop: store.get('alwaysOnTop') ?? false,
    show: !startHidden,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, WINDOW_CONFIG.PRELOAD_PATH)
    },
    icon: path.join(__dirname, WINDOW_CONFIG.ICON_PATH)
  });

  let saveBoundsTimer: ReturnType<typeof setTimeout> | null = null;
  const saveBounds = () => {
    if (saveBoundsTimer) clearTimeout(saveBoundsTimer);
    saveBoundsTimer = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isMaximized()) {
        store.set('windowBounds', mainWindow.getBounds());
      }
    }, 500);
  };

  mainWindow.on('resize', saveBounds);
  mainWindow.on('move', saveBounds);

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

  mainWindow.on('close', () => {
    if (saveBoundsTimer) clearTimeout(saveBoundsTimer);
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isMaximized()) {
      store.set('windowBounds', mainWindow.getBounds());
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
    // Capture the frozen screenshot FIRST (freeze-at-hotkey semantics),
    // then show pre-created windows — or fall back to creating them now.
    const screenshotsByDisplayId = await captureDisplayScreenshots(displays);

    const pooled = captureWindowPool.acquire();
    captureFromPool = pooled !== null;

    if (pooled) {
      pooled.forEach((win, displayId) => captureWindows.set(displayId, win));
    } else {
      // Cold path: pool not ready (startup, display change, renderer crash)
      await Promise.all(displays.map(async (display) => {
        const window = createCaptureWindow(display);
        captureWindows.set(display.id, window);
        setupCaptureWindowEvents(window, display.id);
        await loadCaptureInterface(window);
      }));
    }

    for (const display of displays) {
      const window = captureWindows.get(display.id);
      if (!window || window.isDestroyed()) continue;
      const screenshot = screenshotsByDisplayId.get(display.id);
      if (screenshot) {
        window.webContents.send(IPC_CHANNELS.SCREENSHOT_READY, {
          buffer: screenshot,
          displayId: display.id,
          displayX: display.bounds.x,
          displayY: display.bounds.y,
        });
      } else {
        // No screenshot for this display: don't show it as an invisible,
        // input-eating, always-on-top overlay. Drop it from the map; cold
        // windows are destroyed outright, pooled windows just stay hidden
        // (pool.release() resets them later).
        console.error(`No screenshot available for display ${display.id}`);
        captureWindows.delete(display.id);
        if (!captureFromPool) {
          window.destroy();
        }
      }
    }

    if (captureWindows.size === 0) {
      throw new Error('Failed to capture screenshot for any display');
    }

    showAllCaptureWindows();

    console.log(`Initialized capture windows for ${captureWindows.size} displays (pool: ${captureFromPool})`);
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
  // An acquired pool must always be released even when every window was
  // dropped from captureWindows (e.g. all displays failed to screenshot),
  // otherwise the pool stays stuck `inUse` and the hotkey goes dead.
  if (isClosingWindows || (captureWindows.size === 0 && !captureFromPool)) return;
  isClosingWindows = true;

  globalShortcut.unregister('Escape');

  try {
    console.log(`Releasing ${captureWindows.size} capture windows (pool: ${captureFromPool})`);
    const windows = Array.from(captureWindows.values());
    captureWindows.clear();

    if (captureFromPool) {
      // Pooled windows are hidden and reset, staying warm for the next capture
      captureWindowPool.release();
    } else {
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
      // Warm the pool so the next capture takes the fast path
      void captureWindowPool.prepare();
    }
  } finally {
    captureFromPool = false;
    isClosingWindows = false;
    isCapturing = false;
  }
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
  showCaptureWindows(captureWindows, () => {
    closeAllCaptureWindows().catch(console.error);
  });
}

async function fetchWhatsNewPreview(version: string): Promise<{ English: string; [key: string]: string }[] | null> {
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/oserheiev/Screen-Translator/v${version}/src/whatsnew.json`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return null;
    const entries = await res.json();
    if (!Array.isArray(entries)) return null;
    const entry = entries.find((e: any) => e && e.version === version);
    return entry?.bullets ?? null;
  } catch {
    return null; // best-effort preview; never block the update-available notification on this
  }
}

function setupAutoUpdater() {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', async (info) => {
    const previewBullets = await fetchWhatsNewPreview(info.version);
    mainWindow?.webContents.send(IPC_CHANNELS.UPDATE_AVAILABLE, {
      version: info.version,
      releaseNotes: info.releaseNotes,
      previewBullets,
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
      appLanguage: store.get('appLanguage'),
      showAlternatives: store.get('showAlternatives'),
      showContext: store.get('showContext'),
      alwaysOnTop: store.get('alwaysOnTop'),
      startMinimizedToTray: store.get('startMinimizedToTray'),
      launchAtStartup: isLoginItemEnabled(),
      lastSeenVersion: store.get('lastSeenVersion'),
      ignoredUpdateVersion: store.get('ignoredUpdateVersion'),
      analyticsEnabled: store.get('analyticsEnabled'),
      legalDocsHashAccepted: store.get('legalDocsHashAccepted')
    };
  });

  ipcMain.handle(IPC_CHANNELS.SAVE_SETTINGS, (_, settings: Partial<Settings> & { launchAtStartup?: boolean }) => {
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
    if (settings.showAlternatives !== undefined) store.set('showAlternatives', settings.showAlternatives);
    if (settings.showContext !== undefined) store.set('showContext', settings.showContext);
    if (settings.alwaysOnTop !== undefined) {
      store.set('alwaysOnTop', settings.alwaysOnTop);
      mainWindow?.setAlwaysOnTop(settings.alwaysOnTop);
    }
    if (settings.startMinimizedToTray !== undefined) {
      store.set('startMinimizedToTray', settings.startMinimizedToTray);
    }
    if (settings.launchAtStartup !== undefined) {
      applyLoginItemSettings(settings.launchAtStartup);
    } else if (settings.startMinimizedToTray !== undefined && isLoginItemEnabled()) {
      // Re-registers the login item so its --hidden marker reflects the
      // just-changed setting on the very next login, not just after the
      // next launchAtStartup toggle.
      applyLoginItemSettings(true);
    }
    if (settings.lastSeenVersion !== undefined) store.set('lastSeenVersion', settings.lastSeenVersion);
    if (settings.ignoredUpdateVersion !== undefined) store.set('ignoredUpdateVersion', settings.ignoredUpdateVersion);
    if (settings.analyticsEnabled !== undefined) store.set('analyticsEnabled', settings.analyticsEnabled);
    if (settings.legalDocsHashAccepted !== undefined) store.set('legalDocsHashAccepted', settings.legalDocsHashAccepted);
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

    // Get current theme and language if possible from store, or pass defaults
    const theme = store.get('theme') || 'system';
    const lang = store.get('appLanguage') ?? 'English';

    alertWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, WINDOW_CONFIG.INDEX_HTML_PATH),
        protocol: 'file:',
        slashes: true,
        search: `?mode=alert&title=${encodeURIComponent(title)}&message=${encodeURIComponent(message)}&theme=${theme}&lang=${encodeURIComponent(lang as string)}`
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

  ipcMain.handle(IPC_CHANNELS.TRACK_TRANSLATION_COMPLETED, (_, properties: { languagePair: string; trigger: 'capture' | 'manual' }) => {
    const enriched = buildTranslationEventProperties(properties, app.getVersion());
    trackTranslationCompleted(analyticsClient, analyticsDistinctId, store.get('analyticsEnabled'), enriched);
  });

}

// App lifecycle events
app.on('ready', () => {
  if (!store.get('appLanguage')) {
    store.set('appLanguage', detectAppLanguage(app.getLocale()));
  }
  trackAppStarted(analyticsClient, analyticsDistinctId, store.get('analyticsEnabled'));
  if (isLoginItemEnabled()) {
    // Repairs a stale/incorrect registration (e.g. from before this fix,
    // or from switching between `npm run dev` and a packaged install).
    applyLoginItemSettings(true);
  }
  const hookStarted = keyboardHook.start();
  const launchedHidden = process.argv.includes('--hidden');
  createWindow(launchedHidden);

  if (!hookStarted && process.platform === 'darwin' && mainWindow) {
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow?.webContents.send(IPC_CHANNELS.ACCESSIBILITY_ERROR);
    });
  }

  void captureWindowPool.prepare();

  // Rebuild the pool when the display configuration changes (events fire in bursts)
  let displayChangeTimer: ReturnType<typeof setTimeout> | null = null;
  const scheduleDisplayRebuild = () => {
    if (displayChangeTimer) clearTimeout(displayChangeTimer);
    displayChangeTimer = setTimeout(() => {
      void captureWindowPool.prepare();
    }, 500);
  };
  screen.on('display-added', scheduleDisplayRebuild);
  screen.on('display-removed', scheduleDisplayRebuild);
  screen.on('display-metrics-changed', scheduleDisplayRebuild);
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
  captureWindowPool.destroyAll();
  analyticsClient.shutdown().catch(() => { /* best-effort flush on quit */ });
});

declare global {
  namespace Electron {
    interface App {
      quitting: boolean;
    }
  }
}

app.quitting = false;