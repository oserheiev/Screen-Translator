import '@testing-library/jest-dom';

// Mock Electron APIs for renderer process
const mockElectronAPI = {
  settings: {
    get: jest.fn().mockResolvedValue({
      apiKey: 'test-api-key',
      targetLanguage: 'English',
      hotkey: 'Ctrl+Alt+T',
      theme: 'light',
    }),
    save: jest.fn().mockResolvedValue(true),
  },
  capture: {
    start: jest.fn().mockResolvedValue(true),
    getScreens: jest.fn().mockResolvedValue([]),
    getSources: jest.fn().mockResolvedValue([]),
    complete: jest.fn().mockResolvedValue(undefined),
    log: jest.fn().mockResolvedValue(undefined),
  },
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
  platform: {
    getPlatform: jest.fn().mockResolvedValue('darwin'),
  },
  on: jest.fn().mockReturnValue(() => {}),
};

// Mock window.electron (not electronAPI)
Object.defineProperty(window, 'electron', {
  value: mockElectronAPI,
  writable: true
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific console methods
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock GeminiService
jest.mock('./services/gemini.service', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      processImage: jest.fn().mockResolvedValue({
        originalText: 'Mocked original text',
        translatedText: 'Mocked translated text'
      }),
      translateText: jest.fn().mockResolvedValue('Mocked translation')
    }))
  };
});

// Reset mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});