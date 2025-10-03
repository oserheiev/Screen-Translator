import { app, BrowserWindow, ipcMain, globalShortcut, screen, Tray, Menu, systemPreferences } from 'electron';
import Store from 'electron-store';
import * as path from 'path';
import * as url from 'url';

// Import the main module - we need to mock dependencies first
jest.mock('electron');
jest.mock('electron-store');
jest.mock('path');
jest.mock('url');

// Mock console methods to avoid noise in tests
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

// Type the mocked modules with proper any types to avoid strict typing issues
const mockApp = app as any;
const mockBrowserWindow = BrowserWindow as any;
const mockIpcMain = ipcMain as any;
const mockGlobalShortcut = globalShortcut as any;
const mockScreen = screen as any;
const mockTray = Tray as any;
const mockMenu = Menu as any;
const mockSystemPreferences = systemPreferences as any;
const mockStore = Store as any;
const mockPath = path as any;
const mockUrl = url as any;

// Mock instances
let mockMainWindow: any;
let mockCaptureWindow: any;
let mockTrayInstance: any;
let mockStoreInstance: any;

describe('Electron Main Process', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset app.quitting
    mockApp.quitting = false;
    
    // Setup mock instances
    mockMainWindow = {
      loadURL: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      once: jest.fn(),
      show: jest.fn(),
      hide: jest.fn(),
      close: jest.fn(),
      focus: jest.fn(),
      moveTop: jest.fn(),
      isVisible: jest.fn().mockReturnValue(false),
      getBounds: jest.fn().mockReturnValue({ x: 100, y: 100, width: 800, height: 600 }),
      setBounds: jest.fn(),
      setAlwaysOnTop: jest.fn(),
      setIgnoreMouseEvents: jest.fn(),
      webContents: {
        send: jest.fn(),
        on: jest.fn(),
      },
    };

    mockCaptureWindow = {
      loadURL: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      once: jest.fn(),
      show: jest.fn(),
      hide: jest.fn(),
      close: jest.fn(),
      focus: jest.fn(),
      moveTop: jest.fn(),
      setBounds: jest.fn(),
      setAlwaysOnTop: jest.fn(),
      setIgnoreMouseEvents: jest.fn(),
      webContents: {
        send: jest.fn(),
        on: jest.fn(),
      },
    };

    mockTrayInstance = {
      setToolTip: jest.fn(),
      setContextMenu: jest.fn(),
      on: jest.fn(),
      destroy: jest.fn(),
    };

    mockStoreInstance = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      has: jest.fn(),
    };

    // Setup constructor mocks
    mockBrowserWindow.mockImplementation(() => mockMainWindow);
    mockTray.mockImplementation(() => mockTrayInstance);
    mockStore.mockImplementation(() => mockStoreInstance);

    // Setup default mock returns
    mockPath.join.mockImplementation((...args: string[]) => args.join('/'));
    mockUrl.format.mockImplementation((options: any) => `${options.protocol}//${options.pathname}`);
    mockMenu.buildFromTemplate.mockReturnValue({});
    mockGlobalShortcut.register.mockReturnValue(true);
    mockScreen.getPrimaryDisplay.mockReturnValue({
      id: 1,
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      workArea: { x: 0, y: 0, width: 1920, height: 1080 },
    });
    mockScreen.getAllDisplays.mockReturnValue([
      { id: 1, bounds: { x: 0, y: 0, width: 1920, height: 1080 } },
    ]);
    mockSystemPreferences.getMediaAccessStatus.mockReturnValue('granted');

    // Setup default store values
    mockStoreInstance.get.mockImplementation((key: string) => {
      const defaults: any = {
        apiKey: '',
        targetLanguage: 'English',
        hotkey: process.platform === 'darwin' ? 'Command+Alt+T' : 'Ctrl+Alt+T',
        theme: 'system'
      };
      return defaults[key];
    });
  });

  afterEach(() => {
    jest.resetModules();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  describe('App Lifecycle', () => {
    beforeEach(() => {
      // Import main.ts after mocks are set up
      require('./main');
    });

    it('should create window when app is ready', () => {
      const readyCallback = mockApp.on.mock.calls.find((call: any) => call[0] === 'ready')?.[1];
      expect(readyCallback).toBeDefined();
      
      if (readyCallback) {
        readyCallback();
      }
      
      expect(mockBrowserWindow).toHaveBeenCalledWith({
        width: 800,
        height: 600,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: expect.stringContaining('preload.js')
        },
        icon: expect.stringContaining('icon.png')
      });
    });

    it('should quit app on window-all-closed for non-macOS platforms', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });

      const windowAllClosedCallback = mockApp.on.mock.calls.find((call: any) => call[0] === 'window-all-closed')?.[1];
      expect(windowAllClosedCallback).toBeDefined();
      
      if (windowAllClosedCallback) {
        windowAllClosedCallback();
      }
      
      expect(mockApp.quit).toHaveBeenCalled();
      
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should not quit app on window-all-closed for macOS', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      const windowAllClosedCallback = mockApp.on.mock.calls.find((call: any) => call[0] === 'window-all-closed')?.[1];
      expect(windowAllClosedCallback).toBeDefined();
      
      if (windowAllClosedCallback) {
        windowAllClosedCallback();
      }
      
      expect(mockApp.quit).not.toHaveBeenCalled();
      
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should handle activate event', () => {
      const activateCallback = mockApp.on.mock.calls.find((call: any) => call[0] === 'activate')?.[1];
      expect(activateCallback).toBeDefined();
      
      if (activateCallback) {
        activateCallback();
      }
      
      expect(mockMainWindow.show).toHaveBeenCalled();
    });

    it('should handle before-quit event', () => {
      const beforeQuitCallback = mockApp.on.mock.calls.find((call: any) => call[0] === 'before-quit')?.[1];
      expect(beforeQuitCallback).toBeDefined();
      
      if (beforeQuitCallback) {
        beforeQuitCallback();
      }
      
      expect(mockGlobalShortcut.unregisterAll).toHaveBeenCalled();
      expect(mockApp.quitting).toBe(true);
    });
  });

  describe('Window Management', () => {
    beforeEach(() => {
      require('./main');
    });

    it('should create main window with correct configuration', () => {
      const readyCallback = mockApp.on.mock.calls.find((call: any) => call[0] === 'ready')?.[1];
      if (readyCallback) {
        readyCallback();
      }

      expect(mockBrowserWindow).toHaveBeenCalledWith({
        width: 800,
        height: 600,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: expect.stringContaining('preload.js')
        },
        icon: expect.stringContaining('icon.png')
      });

      expect(mockMainWindow.loadURL).toHaveBeenCalledWith(
        expect.stringContaining('index.html')
      );
    });

    it('should handle main window close event when not quitting', () => {
      const readyCallback = mockApp.on.mock.calls.find((call: any) => call[0] === 'ready')?.[1];
      if (readyCallback) {
        readyCallback();
      }

      const closeCallback = mockMainWindow.on.mock.calls.find((call: any) => call[0] === 'close')?.[1];
      expect(closeCallback).toBeDefined();

      const mockEvent = { preventDefault: jest.fn() };
      mockApp.quitting = false;
      
      if (closeCallback) {
        closeCallback(mockEvent);
      }
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockMainWindow.hide).toHaveBeenCalled();
    });

    it('should handle main window close event when quitting', () => {
      const readyCallback = mockApp.on.mock.calls.find((call: any) => call[0] === 'ready')?.[1];
      if (readyCallback) {
        readyCallback();
      }

      const closeCallback = mockMainWindow.on.mock.calls.find((call: any) => call[0] === 'close')?.[1];
      expect(closeCallback).toBeDefined();

      const mockEvent = { preventDefault: jest.fn() };
      mockApp.quitting = true;
      
      if (closeCallback) {
        closeCallback(mockEvent);
      }
      
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(mockMainWindow.hide).not.toHaveBeenCalled();
    });
  });

  describe('Tray Integration', () => {
    beforeEach(() => {
      require('./main');
    });

    it('should create tray with platform-specific icon on macOS', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      const readyCallback = mockApp.on.mock.calls.find((call: any) => call[0] === 'ready')?.[1];
      if (readyCallback) {
        readyCallback();
      }

      expect(mockTray).toHaveBeenCalledWith(expect.stringContaining('icon-mac.png'));
      expect(mockTrayInstance.setToolTip).toHaveBeenCalledWith('Screen Translator');
      expect(mockTrayInstance.setContextMenu).toHaveBeenCalled();

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should create tray with standard icon on Windows', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });

      const readyCallback = mockApp.on.mock.calls.find((call: any) => call[0] === 'ready')?.[1];
      if (readyCallback) {
        readyCallback();
      }

      expect(mockTray).toHaveBeenCalledWith(expect.stringContaining('icon.png'));

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should handle tray click to toggle window visibility', () => {
      const readyCallback = mockApp.on.mock.calls.find((call: any) => call[0] === 'ready')?.[1];
      if (readyCallback) {
        readyCallback();
      }

      const trayClickCallback = mockTrayInstance.on.mock.calls.find((call: any) => call[0] === 'click')?.[1];
      expect(trayClickCallback).toBeDefined();

      // Test showing window when hidden
      mockMainWindow.isVisible.mockReturnValue(false);
      if (trayClickCallback) {
        trayClickCallback();
      }
      expect(mockMainWindow.show).toHaveBeenCalled();

      // Test hiding window when visible
      mockMainWindow.isVisible.mockReturnValue(true);
      if (trayClickCallback) {
        trayClickCallback();
      }
      expect(mockMainWindow.hide).toHaveBeenCalled();
    });

    it('should create tray context menu with correct items', () => {
      const readyCallback = mockApp.on.mock.calls.find((call: any) => call[0] === 'ready')?.[1];
      if (readyCallback) {
        readyCallback();
      }

      expect(mockMenu.buildFromTemplate).toHaveBeenCalledWith([
        { label: 'Capture Screen', click: expect.any(Function) },
        { label: 'Open', click: expect.any(Function) },
        { type: 'separator' },
        { label: 'Quit', click: expect.any(Function) }
      ]);
    });
  });

  describe('Global Shortcuts', () => {
    beforeEach(() => {
      require('./main');
    });

    it('should register global shortcut with default hotkey', () => {
      const readyCallback = mockApp.on.mock.calls.find((call: any) => call[0] === 'ready')?.[1];
      if (readyCallback) {
        readyCallback();
      }

      expect(mockGlobalShortcut.unregisterAll).toHaveBeenCalled();
      expect(mockGlobalShortcut.register).toHaveBeenCalledWith(
        process.platform === 'darwin' ? 'Command+Alt+T' : 'Ctrl+Alt+T',
        expect.any(Function)
      );
    });

    it('should handle invalid hotkey gracefully', () => {
      mockStoreInstance.get.mockImplementation((key: string) => {
        if (key === 'hotkey') return '';
        return 'default';
      });

      const readyCallback = mockApp.on.mock.calls.find((call: any) => call[0] === 'ready')?.[1];
      if (readyCallback) {
        readyCallback();
      }

      expect(mockConsoleError).toHaveBeenCalledWith('Invalid hotkey configuration:', '');
      expect(mockGlobalShortcut.register).not.toHaveBeenCalled();
    });

    it('should handle failed shortcut registration', () => {
      mockGlobalShortcut.register.mockReturnValue(false);

      const readyCallback = mockApp.on.mock.calls.find((call: any) => call[0] === 'ready')?.[1];
      if (readyCallback) {
        readyCallback();
      }

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to register global shortcut - hotkey may be in use:',
        expect.any(String)
      );
    });

    it('should handle shortcut registration error', () => {
      mockGlobalShortcut.register.mockImplementation(() => {
        throw new Error('Registration failed');
      });

      const readyCallback = mockApp.on.mock.calls.find((call: any) => call[0] === 'ready')?.[1];
      if (readyCallback) {
        readyCallback();
      }

      expect(mockConsoleError).toHaveBeenCalledWith('Failed to register global shortcut:', expect.any(Error));
    });
  });

  describe('IPC Handlers', () => {
    beforeEach(() => {
      require('./main');
    });

    it('should handle get-settings IPC', () => {
      const readyCallback = mockApp.on.mock.calls.find((call: any) => call[0] === 'ready')?.[1];
      if (readyCallback) {
        readyCallback();
      }

      const getSettingsHandler = mockIpcMain.handle.mock.calls.find(
        (call: any) => call[0] === 'get-settings'
      )?.[1];
      
      expect(getSettingsHandler).toBeDefined();
      
      if (getSettingsHandler) {
        const result = getSettingsHandler();
        
        expect(result).toEqual({
          apiKey: '',
          targetLanguage: 'English',
          hotkey: process.platform === 'darwin' ? 'Command+Alt+T' : 'Ctrl+Alt+T'
        });
      }
    });

    it('should handle save-settings IPC', () => {
      const readyCallback = mockApp.on.mock.calls.find((call: any) => call[0] === 'ready')?.[1];
      if (readyCallback) {
        readyCallback();
      }

      const saveSettingsHandler = mockIpcMain.handle.mock.calls.find(
        (call: any) => call[0] === 'save-settings'
      )?.[1];
      
      expect(saveSettingsHandler).toBeDefined();
      
      if (saveSettingsHandler) {
        const settings = {
          apiKey: 'test-key',
          targetLanguage: 'Spanish',
          hotkey: 'Ctrl+Shift+T'
        };
        
        const result = saveSettingsHandler(null, settings);
        
        expect(mockStoreInstance.set).toHaveBeenCalledWith('apiKey', 'test-key');
        expect(mockStoreInstance.set).toHaveBeenCalledWith('targetLanguage', 'Spanish');
        expect(mockStoreInstance.set).toHaveBeenCalledWith('hotkey', 'Ctrl+Shift+T');
        expect(result).toBe(true);
      }
    });

    it('should handle get-platform IPC', () => {
      const readyCallback = mockApp.on.mock.calls.find((call: any) => call[0] === 'ready')?.[1];
      if (readyCallback) {
        readyCallback();
      }

      const getPlatformHandler = mockIpcMain.handle.mock.calls.find(
        (call: any) => call[0] === 'get-platform'
      )?.[1];
      
      expect(getPlatformHandler).toBeDefined();
      
      if (getPlatformHandler) {
        const result = getPlatformHandler();
        expect(result).toBe(process.platform);
      }
    });
  });

  describe('Settings Management', () => {
    beforeEach(() => {
      require('./main');
    });

    it('should initialize store with default settings', () => {
      expect(mockStore).toHaveBeenCalledWith({
        defaults: {
          apiKey: '',
          targetLanguage: 'English',
          hotkey: process.platform === 'darwin' ? 'Command+Alt+T' : 'Ctrl+Alt+T',
          theme: 'system'
        }
      });
    });

    it('should save partial settings and re-register hotkey when hotkey changes', () => {
      const readyCallback = mockApp.on.mock.calls.find((call: any) => call[0] === 'ready')?.[1];
      if (readyCallback) {
        readyCallback();
      }

      const saveSettingsHandler = mockIpcMain.handle.mock.calls.find(
        (call: any) => call[0] === 'save-settings'
      )?.[1];
      
      // Clear previous calls
      mockGlobalShortcut.unregisterAll.mockClear();
      mockGlobalShortcut.register.mockClear();
      
      if (saveSettingsHandler) {
        const settings = { hotkey: 'Ctrl+Shift+X' };
        saveSettingsHandler(null, settings);
        
        expect(mockStoreInstance.set).toHaveBeenCalledWith('hotkey', 'Ctrl+Shift+X');
        expect(mockGlobalShortcut.unregisterAll).toHaveBeenCalled();
        expect(mockGlobalShortcut.register).toHaveBeenCalledWith('Ctrl+Shift+X', expect.any(Function));
      }
    });

    it('should not save undefined settings', () => {
      const readyCallback = mockApp.on.mock.calls.find((call: any) => call[0] === 'ready')?.[1];
      if (readyCallback) {
        readyCallback();
      }

      const saveSettingsHandler = mockIpcMain.handle.mock.calls.find(
        (call: any) => call[0] === 'save-settings'
      )?.[1];
      
      if (saveSettingsHandler) {
        const settings = { apiKey: undefined, targetLanguage: 'French' };
        saveSettingsHandler(null, settings);
        
        expect(mockStoreInstance.set).not.toHaveBeenCalledWith('apiKey', undefined);
        expect(mockStoreInstance.set).toHaveBeenCalledWith('targetLanguage', 'French');
      }
    });
  });
});