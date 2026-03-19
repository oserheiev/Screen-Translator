import '@testing-library/jest-dom';

// Default window.electron mock for renderer tests.
// Individual tests can override specific methods via jest.spyOn or reassigning properties.
const makeElectronMock = () => ({
  settings: {
    get: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockResolvedValue(true),
  },
  history: {
    get: jest.fn().mockResolvedValue([]),
    save: jest.fn().mockResolvedValue(undefined),
  },
  capture: {
    start: jest.fn().mockResolvedValue(true),
    getScreens: jest.fn().mockResolvedValue([]),
    getSources: jest.fn().mockResolvedValue([]),
    complete: jest.fn().mockResolvedValue(undefined),
    log: jest.fn().mockResolvedValue(undefined),
    ready: jest.fn().mockResolvedValue(undefined),
    onScreenshotReady: jest.fn(),
  },
  alert: {
    show: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    resize: jest.fn().mockResolvedValue(undefined),
  },
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
  platform: {
    getPlatform: jest.fn().mockResolvedValue('linux'),
  },
  window: {
    show: jest.fn().mockResolvedValue(undefined),
  },
  shell: {
    openExternal: jest.fn().mockResolvedValue(undefined),
  },
  updater: {
    check: jest.fn().mockResolvedValue(undefined),
    download: jest.fn().mockResolvedValue(undefined),
    install: jest.fn().mockResolvedValue(undefined),
  },
  app: {
    getVersion: jest.fn().mockResolvedValue('1.3.1'),
  },
  on: jest.fn().mockReturnValue(() => {}),
  removeListener: jest.fn(),
});

// Suppress console noise from source code during test runs
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

beforeEach(() => {
  (window as any).electron = makeElectronMock();
});
