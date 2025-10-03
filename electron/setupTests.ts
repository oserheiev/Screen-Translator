// Mock Electron modules for main process testing
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/mock/path'),
    getVersion: jest.fn(() => '1.0.0'),
    getName: jest.fn(() => 'Screen Translator'),
    quit: jest.fn(),
    on: jest.fn(),
    whenReady: jest.fn(() => Promise.resolve()),
    dock: {
      hide: jest.fn(),
      show: jest.fn(),
    },
    setLoginItemSettings: jest.fn(),
  },
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadFile: jest.fn(),
    loadURL: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    close: jest.fn(),
    minimize: jest.fn(),
    maximize: jest.fn(),
    unmaximize: jest.fn(),
    isMaximized: jest.fn(() => false),
    setAlwaysOnTop: jest.fn(),
    setVisibleOnAllWorkspaces: jest.fn(),
    setFullScreenable: jest.fn(),
    webContents: {
      send: jest.fn(),
      on: jest.fn(),
      openDevTools: jest.fn(),
    },
  })),
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
    removeHandler: jest.fn(),
    removeAllListeners: jest.fn(),
  },
  Menu: {
    setApplicationMenu: jest.fn(),
    buildFromTemplate: jest.fn(),
  },
  Tray: jest.fn().mockImplementation(() => ({
    setToolTip: jest.fn(),
    setContextMenu: jest.fn(),
    on: jest.fn(),
    destroy: jest.fn(),
  })),
  nativeImage: {
    createFromPath: jest.fn(() => ({
      resize: jest.fn(),
    })),
  },
  globalShortcut: {
    register: jest.fn(() => true),
    unregister: jest.fn(),
    unregisterAll: jest.fn(),
    isRegistered: jest.fn(() => false),
  },
  clipboard: {
    writeText: jest.fn(),
    readText: jest.fn(() => ''),
  },
  screen: {
    getPrimaryDisplay: jest.fn(() => ({
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      workArea: { x: 0, y: 0, width: 1920, height: 1080 },
    })),
    getAllDisplays: jest.fn(() => []),
  },
  desktopCapturer: {
    getSources: jest.fn(() => Promise.resolve([])),
  },
}));

// Mock electron-store
jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    has: jest.fn(() => false),
    store: {},
  }));
});

// Mock Node.js modules
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    access: jest.fn(),
  },
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  resolve: jest.fn((...args) => args.join('/')),
  dirname: jest.fn(() => '/mock/dir'),
  basename: jest.fn(() => 'mock-file'),
  extname: jest.fn(() => '.mock'),
}));

jest.mock('os', () => ({
  platform: jest.fn(() => 'darwin'),
  homedir: jest.fn(() => '/mock/home'),
  tmpdir: jest.fn(() => '/mock/tmp'),
}));

// Mock Google Generative AI
jest.mock('@google/genai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn(() => ({
      generateContent: jest.fn(() => Promise.resolve({
        response: {
          text: jest.fn(() => 'Mocked translation'),
        },
      })),
    })),
  })),
}));

// Global test utilities
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup and teardown
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});