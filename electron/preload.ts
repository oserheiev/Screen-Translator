import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
//
// Channel names below are string literals rather than IPC_CHANNELS
// constants: the preload script runs sandboxed and cannot `require`
// local modules like electron/constants.ts at runtime, so literals
// are intentional here (and must be kept in sync with IPC_CHANNELS).
contextBridge.exposeInMainWorld(
  'electron',
  {
    settings: {
      get: () => ipcRenderer.invoke('get-settings'),
      save: (settings: any) => ipcRenderer.invoke('save-settings', settings)
    },
    capture: {
      start: () => ipcRenderer.invoke('start-screen-capture'),
      getScreens: async () => {
        try {
          return await ipcRenderer.invoke('get-screens');
        } catch (error) {
          console.error('Failed to get screens:', error);
          throw new Error('Failed to get screen information');
        }
      },
      getSources: async () => {
        try {
          return await ipcRenderer.invoke('get-sources');
        } catch (error) {
          console.error('Failed to get sources:', error);
          throw new Error('Failed to get screen sources');
        }
      },
      complete: async (imageData: string) => {
        try {
          return await ipcRenderer.invoke('capture-completed', imageData);
        } catch (error) {
          console.error('Failed to complete capture:', error);
          throw new Error('Failed to send capture data');
        }
      },
      log: (message: string, ...args: any[]) => ipcRenderer.invoke('log-message', message, ...args),
      onScreenshotReady: (callback: (payload: { buffer: Uint8Array; displayId: number; displayX: number; displayY: number }) => void) => {
        ipcRenderer.on('screenshot-ready', (_event, payload) => callback(payload));
      },
      onCaptureReset: (callback: () => void) => {
        ipcRenderer.on('capture-reset', () => callback());
      }
    },
    clipboard: {
      writeText: (text: string) => ipcRenderer.invoke('clipboard-write-text', text)
    },
    alert: {
      show: (title: string, message: string) => ipcRenderer.invoke('show-alert', { title, message }),
      close: () => ipcRenderer.invoke('close-window'),
      resize: (width: number, height: number) => ipcRenderer.invoke('resize-window', { width, height })
    },
    platform: {
      getPlatform: () => ipcRenderer.invoke('get-platform')
    },
    window: {
      show: () => ipcRenderer.invoke('show-window')
    },
    shell: {
      openExternal: (url: string) => ipcRenderer.invoke('open-external', url)
    },
    history: {
      get: () => ipcRenderer.invoke('get-history'),
      save: (history: any[]) => ipcRenderer.invoke('save-history', history)
    },
    updater: {
      check: () => ipcRenderer.invoke('check-for-updates'),
      download: () => ipcRenderer.invoke('download-update'),
      install: () => ipcRenderer.invoke('install-update')
    },
    app: {
      getVersion: () => ipcRenderer.invoke('get-version')
    },
    on: (channel: string, callback: (...args: any[]) => void) => {
      // Whitelist channels
      const validChannels = ['image-captured', 'capture-error', 'permission-error', 'accessibility-error', 'update-available', 'update-progress', 'update-error'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        const subscription = (_event: any, ...args: any[]) => callback(...args);
        ipcRenderer.on(channel, subscription);

        // Return a function to remove the event listener
        return () => {
          ipcRenderer.removeListener(channel, subscription);
        };
      }

      return () => { }; // Return empty function if channel is not valid
    }
  }
);