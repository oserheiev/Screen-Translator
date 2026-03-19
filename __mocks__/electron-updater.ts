// Mock for electron-updater
export const autoUpdater = {
  checkForUpdatesAndNotify: jest.fn().mockResolvedValue(null),
  checkForUpdates: jest.fn().mockResolvedValue(null),
  downloadUpdate: jest.fn().mockResolvedValue(null),
  quitAndInstall: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
  autoDownload: false,
  autoInstallOnAppQuit: false,
};
