// Mock for the 'electron' module used in main process tests.

const app = {
  getPath: jest.fn().mockReturnValue('/tmp/test-app'),
  getVersion: jest.fn().mockReturnValue('1.3.1'),
  quit: jest.fn(),
  on: jest.fn(),
  whenReady: jest.fn().mockResolvedValue(undefined),
  isPackaged: false,
  requestSingleInstanceLock: jest.fn().mockReturnValue(true),
};

const BrowserWindow = jest.fn().mockImplementation(() => ({
  loadFile: jest.fn(),
  loadURL: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  webContents: {
    send: jest.fn(),
    on: jest.fn(),
    openDevTools: jest.fn(),
  },
  show: jest.fn(),
  hide: jest.fn(),
  close: jest.fn(),
  destroy: jest.fn(),
  isDestroyed: jest.fn().mockReturnValue(false),
  setBounds: jest.fn(),
  getBounds: jest.fn().mockReturnValue({ x: 0, y: 0, width: 800, height: 600 }),
  setAlwaysOnTop: jest.fn(),
  showInactive: jest.fn(),
  focus: jest.fn(),
  setIgnoreMouseEvents: jest.fn(),
}));
(BrowserWindow as any).getAllWindows = jest.fn().mockReturnValue([]);
(BrowserWindow as any).fromWebContents = jest.fn();

const ipcMain = {
  handle: jest.fn(),
  on: jest.fn(),
  removeHandler: jest.fn(),
  removeAllListeners: jest.fn(),
};

const screen = {
  getAllDisplays: jest.fn().mockReturnValue([
    { id: 1, bounds: { x: 0, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 },
  ]),
  getPrimaryDisplay: jest.fn().mockReturnValue(
    { id: 1, bounds: { x: 0, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 }
  ),
};

const globalShortcut = {
  register: jest.fn().mockReturnValue(true),
  unregisterAll: jest.fn(),
  unregister: jest.fn(),
};

const systemPreferences = {
  isTrustedAccessibilityClient: jest.fn().mockReturnValue(true),
  askForMediaAccess: jest.fn().mockResolvedValue(true),
};

const Tray = jest.fn().mockImplementation(() => ({
  setToolTip: jest.fn(),
  setContextMenu: jest.fn(),
  on: jest.fn(),
}));

const Menu = {
  buildFromTemplate: jest.fn().mockReturnValue({}),
  setApplicationMenu: jest.fn(),
};

const MenuItem = jest.fn();

const shell = {
  openExternal: jest.fn().mockResolvedValue(undefined),
};

const nativeImage = {
  createFromPath: jest.fn().mockReturnValue({ resize: jest.fn().mockReturnThis() }),
  createFromDataURL: jest.fn(),
};

const dialog = {
  showMessageBox: jest.fn().mockResolvedValue({ response: 0 }),
  showOpenDialog: jest.fn().mockResolvedValue({ filePaths: [] }),
};

const desktopCapturer = {
  getSources: jest.fn().mockResolvedValue([]),
};

export {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  globalShortcut,
  systemPreferences,
  Tray,
  Menu,
  MenuItem,
  shell,
  nativeImage,
  dialog,
  desktopCapturer,
};
