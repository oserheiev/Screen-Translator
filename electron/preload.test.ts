import { contextBridge, ipcRenderer } from 'electron';

// Mock Electron modules
jest.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: jest.fn(),
  },
  ipcRenderer: {
    invoke: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
  },
}));

// Type the mocked modules
const mockContextBridge = contextBridge as jest.Mocked<typeof contextBridge>;
const mockIpcRenderer = ipcRenderer as jest.Mocked<typeof ipcRenderer>;

describe('Preload Script', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock returns
    mockIpcRenderer.invoke.mockResolvedValue('mock-result');
    mockIpcRenderer.on.mockReturnValue(undefined as any);
    mockIpcRenderer.removeListener.mockReturnValue(undefined as any);
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe('Context Bridge Exposure', () => {
    beforeEach(() => {
      // Import preload.ts after mocks are set up
      require('./preload');
    });

    it('should expose electron API to main world', () => {
      expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
        'electron',
        expect.objectContaining({
          settings: expect.any(Object),
          capture: expect.any(Object),
          clipboard: expect.any(Object),
          platform: expect.any(Object),
          on: expect.any(Function),
        })
      );
    });

    it('should expose settings API with get and save methods', () => {
      const calls = mockContextBridge.exposeInMainWorld.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const exposedAPI = calls[0][1];
      
      expect(exposedAPI.settings).toEqual({
        get: expect.any(Function),
        save: expect.any(Function),
      });
    });

    it('should expose capture API with all required methods', () => {
      const calls = mockContextBridge.exposeInMainWorld.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const exposedAPI = calls[0][1];
      
      expect(exposedAPI.capture).toEqual({
        start: expect.any(Function),
        getScreens: expect.any(Function),
        getSources: expect.any(Function),
        complete: expect.any(Function),
        log: expect.any(Function),
      });
    });

    it('should expose clipboard API with writeText method', () => {
      const calls = mockContextBridge.exposeInMainWorld.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const exposedAPI = calls[0][1];
      
      expect(exposedAPI.clipboard).toEqual({
        writeText: expect.any(Function),
      });
    });

    it('should expose platform API with getPlatform method', () => {
      const calls = mockContextBridge.exposeInMainWorld.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const exposedAPI = calls[0][1];
      
      expect(exposedAPI.platform).toEqual({
        getPlatform: expect.any(Function),
      });
    });
  });

  describe('Settings API', () => {
    let settingsAPI: any;

    beforeEach(() => {
      require('./preload');
      const calls = mockContextBridge.exposeInMainWorld.mock.calls;
      if (calls.length > 0) {
        const exposedAPI = calls[0][1];
        settingsAPI = exposedAPI.settings;
      }
    });

    it('should call get-settings IPC when settings.get is called', async () => {
      const mockSettings = {
        apiKey: 'test-key',
        targetLanguage: 'Spanish',
        hotkey: 'Ctrl+Alt+T'
      };
      mockIpcRenderer.invoke.mockResolvedValue(mockSettings);

      const result = await settingsAPI.get();

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-settings');
      expect(result).toEqual(mockSettings);
    });

    it('should call save-settings IPC when settings.save is called', async () => {
      const settingsToSave = {
        apiKey: 'new-key',
        targetLanguage: 'French',
        hotkey: 'Ctrl+Shift+T'
      };
      mockIpcRenderer.invoke.mockResolvedValue(true);

      const result = await settingsAPI.save(settingsToSave);

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('save-settings', settingsToSave);
      expect(result).toBe(true);
    });
  });

  describe('Capture API', () => {
    let captureAPI: any;

    beforeEach(() => {
      require('./preload');
      const calls = mockContextBridge.exposeInMainWorld.mock.calls;
      if (calls.length > 0) {
        const exposedAPI = calls[0][1];
        captureAPI = exposedAPI.capture;
      }
    });

    it('should call start-screen-capture IPC when capture.start is called', async () => {
      mockIpcRenderer.invoke.mockResolvedValue(true);

      const result = await captureAPI.start();

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('start-screen-capture');
      expect(result).toBe(true);
    });

    it('should call get-screens IPC when capture.getScreens is called', async () => {
      const mockScreens = [
        { id: 1, bounds: { x: 0, y: 0, width: 1920, height: 1080 } }
      ];
      mockIpcRenderer.invoke.mockResolvedValue(mockScreens);

      const result = await captureAPI.getScreens();

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-screens');
      expect(result).toEqual(mockScreens);
    });

    it('should handle getScreens error and throw with custom message', async () => {
      const error = new Error('IPC failed');
      mockIpcRenderer.invoke.mockRejectedValue(error);

      await expect(captureAPI.getScreens()).rejects.toThrow('Failed to get screen information');
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-screens');
    });

    it('should call get-sources IPC when capture.getSources is called', async () => {
      const mockSources = [
        { id: 'screen:0', name: 'Screen 1' }
      ];
      mockIpcRenderer.invoke.mockResolvedValue(mockSources);

      const result = await captureAPI.getSources();

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-sources');
      expect(result).toEqual(mockSources);
    });

    it('should handle getSources error and throw with custom message', async () => {
      const error = new Error('IPC failed');
      mockIpcRenderer.invoke.mockRejectedValue(error);

      await expect(captureAPI.getSources()).rejects.toThrow('Failed to get screen sources');
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-sources');
    });

    it('should call capture-completed IPC when capture.complete is called', async () => {
      const imageData = 'data:image/png;base64,test';
      mockIpcRenderer.invoke.mockResolvedValue(true);

      const result = await captureAPI.complete(imageData);

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('capture-completed', imageData);
      expect(result).toBe(true);
    });

    it('should handle complete error and throw with custom message', async () => {
      const error = new Error('IPC failed');
      mockIpcRenderer.invoke.mockRejectedValue(error);

      await expect(captureAPI.complete('test-data')).rejects.toThrow('Failed to send capture data');
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('capture-completed', 'test-data');
    });

    it('should call log-message IPC when capture.log is called', async () => {
      const message = 'Test log message';
      const args = ['arg1', 'arg2'];
      mockIpcRenderer.invoke.mockResolvedValue(undefined);

      await captureAPI.log(message, ...args);

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('log-message', message, ...args);
    });
  });

  describe('Clipboard API', () => {
    let clipboardAPI: any;

    beforeEach(() => {
      require('./preload');
      const calls = mockContextBridge.exposeInMainWorld.mock.calls;
      if (calls.length > 0) {
        const exposedAPI = calls[0][1];
        clipboardAPI = exposedAPI.clipboard;
      }
    });

    it('should call clipboard-write-text IPC when clipboard.writeText is called', async () => {
      const text = 'Test clipboard text';
      mockIpcRenderer.invoke.mockResolvedValue(undefined);

      const result = await clipboardAPI.writeText(text);

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('clipboard-write-text', text);
      expect(result).toBeUndefined();
    });
  });

  describe('Platform API', () => {
    let platformAPI: any;

    beforeEach(() => {
      require('./preload');
      const exposedAPI = mockContextBridge.exposeInMainWorld.mock.calls[0][1];
      platformAPI = exposedAPI.platform;
    });

    it('should call get-platform IPC when platform.getPlatform is called', async () => {
      const mockPlatform = 'darwin';
      mockIpcRenderer.invoke.mockResolvedValue(mockPlatform);

      const result = await platformAPI.getPlatform();

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-platform');
      expect(result).toBe(mockPlatform);
    });
  });

  describe('Event Listener API', () => {
    let onAPI: any;

    beforeEach(() => {
      require('./preload');
      const exposedAPI = mockContextBridge.exposeInMainWorld.mock.calls[0][1];
      onAPI = exposedAPI.on;
    });

    it('should register event listener for valid channels', () => {
      const callback = jest.fn();
      const mockSubscription = jest.fn();
      mockIpcRenderer.on.mockImplementation((channel, listener) => {
        // Simulate the subscription function
        return undefined as any;
      });

      const unsubscribe = onAPI('image-captured', callback);

      expect(mockIpcRenderer.on).toHaveBeenCalledWith('image-captured', expect.any(Function));
      expect(typeof unsubscribe).toBe('function');
    });

    it('should register event listener for capture-error channel', () => {
      const callback = jest.fn();
      mockIpcRenderer.on.mockImplementation((channel, listener) => {
        return undefined as any;
      });

      const unsubscribe = onAPI('capture-error', callback);

      expect(mockIpcRenderer.on).toHaveBeenCalledWith('capture-error', expect.any(Function));
      expect(typeof unsubscribe).toBe('function');
    });

    it('should not register event listener for invalid channels', () => {
      const callback = jest.fn();

      const unsubscribe = onAPI('invalid-channel', callback);

      expect(mockIpcRenderer.on).not.toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should return empty function for invalid channels', () => {
      const callback = jest.fn();

      const unsubscribe = onAPI('invalid-channel', callback);

      // Should return a function that does nothing
      unsubscribe();
      expect(mockIpcRenderer.removeListener).not.toHaveBeenCalled();
    });

    it('should properly handle event listener removal', () => {
      const callback = jest.fn();
      let storedListener: any;
      
      mockIpcRenderer.on.mockImplementation((channel, listener) => {
        storedListener = listener;
        return undefined as any;
      });

      const unsubscribe = onAPI('image-captured', callback);
      
      // Call unsubscribe
      unsubscribe();

      expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith('image-captured', storedListener);
    });

    it('should strip event object and pass only args to callback', () => {
      const callback = jest.fn();
      let registeredListener: any;
      
      mockIpcRenderer.on.mockImplementation((channel, listener) => {
        registeredListener = listener;
        return undefined as any;
      });

      onAPI('image-captured', callback);

      // Simulate an event with event object and args
      const mockEvent = { sender: 'mock-sender' };
      const arg1 = 'test-arg1';
      const arg2 = 'test-arg2';
      
      registeredListener(mockEvent, arg1, arg2);

      // Callback should be called with args only, not the event object
      expect(callback).toHaveBeenCalledWith(arg1, arg2);
    });
  });

  describe('Error Handling', () => {
    let captureAPI: any;

    beforeEach(() => {
      require('./preload');
      const exposedAPI = mockContextBridge.exposeInMainWorld.mock.calls[0][1];
      captureAPI = exposedAPI.capture;
    });

    it('should log errors to console when getScreens fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Network error');
      mockIpcRenderer.invoke.mockRejectedValue(error);

      await expect(captureAPI.getScreens()).rejects.toThrow('Failed to get screen information');
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get screens:', error);
      
      consoleSpy.mockRestore();
    });

    it('should log errors to console when getSources fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Permission denied');
      mockIpcRenderer.invoke.mockRejectedValue(error);

      await expect(captureAPI.getSources()).rejects.toThrow('Failed to get screen sources');
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get sources:', error);
      
      consoleSpy.mockRestore();
    });

    it('should log errors to console when complete fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('IPC timeout');
      mockIpcRenderer.invoke.mockRejectedValue(error);

      await expect(captureAPI.complete('test-data')).rejects.toThrow('Failed to send capture data');
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to complete capture:', error);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Type Safety', () => {
    beforeEach(() => {
      require('./preload');
    });

    it('should handle settings with proper types', async () => {
      const exposedAPI = mockContextBridge.exposeInMainWorld.mock.calls[0][1];
      const settingsAPI = exposedAPI.settings;

      const mockSettings = {
        apiKey: 'test-key',
        targetLanguage: 'English' as const,
        hotkey: 'Ctrl+Alt+T'
      };
      mockIpcRenderer.invoke.mockResolvedValue(mockSettings);

      const result = await settingsAPI.get();
      expect(result).toEqual(mockSettings);

      // Test save with partial settings
      await settingsAPI.save({ apiKey: 'new-key' });
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('save-settings', { apiKey: 'new-key' });
    });

    it('should handle capture methods with proper argument types', async () => {
      const exposedAPI = mockContextBridge.exposeInMainWorld.mock.calls[0][1];
      const captureAPI = exposedAPI.capture;

      // Test log with multiple arguments
      await captureAPI.log('Test message', 'arg1', 42, { key: 'value' });
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('log-message', 'Test message', 'arg1', 42, { key: 'value' });

      // Test complete with string data
      mockIpcRenderer.invoke.mockResolvedValue(true);
      await captureAPI.complete('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('capture-completed', expect.stringContaining('data:image/png'));
    });
  });
});