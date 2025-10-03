import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AppProvider } from './contexts/AppContext';

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AppProvider>
      {children}
    </AppProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Common test data and utilities
export const mockSettings = {
  apiKey: 'test-api-key',
  sourceLanguage: 'auto',
  targetLanguage: 'en',
  hotkey: 'CommandOrControl+Shift+T',
  theme: 'light' as const,
  autoTranslate: true,
  showTray: true,
};

export const mockTranslationResponse = {
  originalText: 'Hello world',
  translatedText: 'Hola mundo',
  sourceLanguage: 'en',
  targetLanguage: 'es',
};

// Mock electron API responses
export const mockElectronResponses = {
  captureScreen: jest.fn(() => Promise.resolve('data:image/png;base64,mock-image-data')),
  translateText: jest.fn(() => Promise.resolve(mockTranslationResponse)),
  getSettings: jest.fn(() => Promise.resolve(mockSettings)),
  saveSettings: jest.fn(() => Promise.resolve()),
  copyToClipboard: jest.fn(() => Promise.resolve()),
  registerHotkey: jest.fn(() => Promise.resolve(true)),
  unregisterHotkey: jest.fn(() => Promise.resolve()),
  showTray: jest.fn(() => Promise.resolve()),
  hideTray: jest.fn(() => Promise.resolve()),
};

// Helper to setup electron API mocks
export const setupElectronMocks = () => {
  Object.assign((window as any).electronAPI, mockElectronResponses);
};

// Helper to reset all mocks
export const resetAllMocks = () => {
  Object.values(mockElectronResponses).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockClear();
    }
  });
};

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper to create mock events
export const createMockEvent = (type: string, data: any = {}) => ({
  type,
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  target: { value: '' },
  ...data,
});

// Helper to create mock file
export const createMockFile = (name: string, content: string, type: string = 'text/plain') => {
  const file = new File([content], name, { type });
  return file;
};