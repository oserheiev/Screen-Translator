const { app, BrowserWindow, ipcMain, globalShortcut, screen, Tray, Menu, desktopCapturer } = require('electron');
const path = require('path');
const url = require('url');
const Store = require('electron-store');
const fs = require('fs');

// Set up logging
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, `app-${new Date().toISOString().replace(/:/g, '-')}.log`);

// Create a logger function
function log(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${level}] ${message}`;

  // Log to console
  console[level.toLowerCase()](formattedMessage, ...args);

  // Log to file
  try {
    const logEntry = `${formattedMessage} ${args.length ? JSON.stringify(args) : ''}\n`;
    fs.appendFileSync(logFile, logEntry);
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
}

// Create convenience methods
const logger = {
  info: (message, ...args) => log('INFO', message, ...args),
  warn: (message, ...args) => log('WARN', message, ...args),
  error: (message, ...args) => log('ERROR', message, ...args),
  debug: (message, ...args) => log('DEBUG', message, ...args)
};

logger.info('Application starting');

// Initialize the settings store
const store = new Store({
  defaults: {
    apiKey: '',
    targetLanguage: 'English',
    hotkey: process.platform === 'darwin' ? 'Command+Alt+T' : 'Ctrl+Alt+T',
    theme: 'system'
  }
});

let mainWindow = null;
let tray = null;
let captureWindow = null;

function createWindow() {
  // Create the browser window
  const fs = require('fs');

  // Use platform-specific icons for the window
  let iconPath;
  if (process.platform === 'darwin') {
    // On macOS, use the regular icon for the window (not the small one)
    iconPath = path.join(__dirname, 'assets/icons/icon.png');
  } else {
    // On other platforms, use the regular icon
    iconPath = path.join(__dirname, 'assets/icons/icon.png');
  }

  // Check if icon exists
  const iconExists = fs.existsSync(iconPath);
  iconPath = iconExists ? iconPath : null;

  if (!iconExists) {
    console.warn('No icon file found for window');
  }

  const windowOptions = {
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'build/electron/preload.js')
    }
  };

  // Only add icon if it exists
  if (iconPath) {
    windowOptions.icon = iconPath;
  }

  mainWindow = new BrowserWindow(windowOptions);

  // Load the index.html of the app
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'build/index.html'),
      protocol: 'file:',
      slashes: true
    })
  );

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

  // Set up IPC handlers
  setupIpcHandlers();
}

function createTray() {
  if (!mainWindow) return;

  const fs = require('fs');
  let iconPath;

  // Use platform-specific icons
  if (process.platform === 'darwin') {
    // On macOS, use the smaller icon
    iconPath = path.join(__dirname, 'assets/icons/icon-mac.png');
    console.log('Using macOS specific icon');
  } else {
    // On other platforms, use the regular icon
    iconPath = path.join(__dirname, 'assets/icons/icon.png');
    console.log('Using standard icon');
  }

  console.log('Attempting to load tray icon from:', iconPath);

  // Check if file exists
  const iconExists = fs.existsSync(iconPath);
  console.log('Icon exists check:', iconExists);

  if (!iconExists) {
    console.error('Icon not found. Cannot create tray.');
    return; // Exit function if icon doesn't exist
  }

  // Try to create tray with the icon
  try {
    tray = new Tray(iconPath);
  } catch (error) {
    console.error('Error creating tray:', error);
    return; // Exit function if tray creation fails
  }

  // Only proceed if tray was successfully created
  if (!tray) {
    console.error('Tray creation failed');
    return;
  }

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

  globalShortcut.unregisterAll();

  try {
    globalShortcut.register(hotkey, () => {
      startScreenCapture();
    });
  } catch (error) {
    console.error('Failed to register global shortcut:', error);
  }
}

function startScreenCapture() {
  if (captureWindow) {
    logger.info('Capture window already exists, focusing it');
    captureWindow.focus();
    return;
  }

  logger.info('Starting screen capture...');

  // Check if we have screen sources available
  logger.debug('Requesting screen sources');
  desktopCapturer.getSources({ types: ['screen'] })
    .then(sources => {
      if (sources.length === 0) {
        console.error('No screen sources available');
        // Show error dialog
        const { dialog } = require('electron');
        dialog.showErrorBox(
          'Screen Capture Error',
          'No screen sources available. Please check your display settings and try again.'
        );
        return;
      }

      logger.info(`Found ${sources.length} screen sources`);

      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.workAreaSize;

      logger.info(`Creating capture window with dimensions: ${width}x${height}`);

      // Create a window that covers the entire screen
      // Use the actual screen dimensions, not just the work area
      const actualWidth = primaryDisplay.bounds.width;
      const actualHeight = primaryDisplay.bounds.height;

      logger.debug(`Using actual screen dimensions: ${actualWidth}x${actualHeight}`);

      captureWindow = new BrowserWindow({
        x: primaryDisplay.bounds.x,
        y: primaryDisplay.bounds.y,
        width: actualWidth,
        height: actualHeight,
        transparent: true,
        frame: false,
        focusable: false,
        fullscreen: true,
        alwaysOnTop: true, // Make sure it's on top of everything
        skipTaskbar: true, // Don't show in taskbar
        show: false, // Don't show until ready
        enableLargerThanScreen: true, // Allow window to be larger than screen
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, 'build/electron/preload.js'),
          // Enable screen capture permissions
          enableRemoteModule: false,
          webSecurity: true
        }
      });

      // Log window bounds for debugging
      const bounds = captureWindow.getBounds();
      logger.debug(`Capture window bounds: x=${bounds.x}, y=${bounds.y}, width=${bounds.width}, height=${bounds.height}`);

      // Wait for window to be ready before showing
      captureWindow.once('ready-to-show', () => {
        logger.info('Capture window ready to show');
        // Add a small delay to ensure everything is initialized
        setTimeout(() => {
          if (captureWindow) {
            captureWindow.showInactive();
            logger.info('Capture window shown and focused');
            logger.info('Capture window shown and focused');
          }
        }, 300);
      });

      // Handle window load completion
      captureWindow.webContents.on('did-finish-load', () => {
        logger.info('Capture window finished loading');
      });

      // Handle errors
      captureWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        logger.error('Capture window failed to load:', errorDescription);
        if (captureWindow) {
          captureWindow.close();
        }

        const { dialog } = require('electron');
        dialog.showErrorBox(
          'Screen Capture Error',
          `Failed to load capture window: ${errorDescription}`
        );
      });

      captureWindow.loadURL(
        url.format({
          pathname: path.join(__dirname, 'build/capture.html'),
          protocol: 'file:',
          slashes: true
        })
      );

      captureWindow.on('closed', () => {
        logger.info('Capture window closed');
        captureWindow = null;
      });

      // Handle ESC key to cancel capture
      captureWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'Escape') {
          logger.info('ESC key pressed, closing capture window');
          captureWindow?.close();
        }
      });
    })
    .catch(error => {
      logger.error('Error starting screen capture:', error);
      // Show error dialog
      const { dialog } = require('electron');
      dialog.showErrorBox(
        'Screen Capture Error',
        `Failed to start screen capture: ${error.message || 'Unknown error'}`
      );
    });

  // Note: The loadURL, closed event, and ESC key handling are already set up in the promise chain above
}

// IPC handlers
function setupIpcHandlers() {
  ipcMain.handle('get-settings', () => {
    return {
      apiKey: store.get('apiKey'),
      targetLanguage: store.get('targetLanguage'),
      hotkey: store.get('hotkey'),
      theme: store.get('theme')
    };
  });

  ipcMain.handle('save-settings', (_, settings) => {
    if (settings.apiKey !== undefined) {
      store.set('apiKey', settings.apiKey);
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

  ipcMain.handle('clipboard-write-text', async (_, text) => {
    require('electron').clipboard.writeText(text);
  });

  ipcMain.handle('get-screens', async () => {
    return screen.getAllDisplays();
  });

  // Add handler for logging from renderer process
  ipcMain.handle('log-message', (_, message, ...args) => {
    logger.debug(`[Renderer] ${message}`, ...args);
    return true;
  });

  // Add handler for get-sources
  ipcMain.handle('get-sources', async () => {
    try {
      logger.info('Getting screen sources...');

      // Get available sources (screens, windows)
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 0, height: 0 } // No thumbnails needed
      });

      logger.info(`Found ${sources.length} screen sources`);

      if (sources.length === 0) {
        logger.warn('No screen sources found');
      } else {
        sources.forEach((source, index) => {
          logger.debug(`Source ${index}: ${source.name} (${source.id})`);

          // Log display details if available
          const displays = screen.getAllDisplays();
          if (displays.length > 0) {
            logger.debug('Available displays:');
            displays.forEach((display, i) => {
              logger.debug(`Display ${i}: ${display.id}, bounds: ${JSON.stringify(display.bounds)}, workArea: ${JSON.stringify(display.workArea)}`);
            });
          }
        });
      }

      return sources;
    } catch (error) {
      logger.error('Error getting screen sources:', error);
      return [];
    }
  });

  ipcMain.handle('capture-completed', (_, imageData) => {
    if (captureWindow) {
      captureWindow.close();
      captureWindow = null;
    }
    mainWindow?.webContents.send('image-captured', imageData);
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

app.quitting = false;