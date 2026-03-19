import { renderHook, act } from '@testing-library/react';
import { useElectronIpc } from '../../hooks/useElectronIpc';

describe('useElectronIpc', () => {
  describe('isElectronAvailable', () => {
    it('is true when window.electron exists', () => {
      // setupTests.ts sets window.electron before each test
      const { result } = renderHook(() => useElectronIpc());
      expect(result.current.isElectronAvailable).toBe(true);
    });

    it('is false when window.electron is undefined', () => {
      const original = (window as any).electron;
      (window as any).electron = undefined;

      const { result } = renderHook(() => useElectronIpc());
      expect(result.current.isElectronAvailable).toBe(false);

      (window as any).electron = original;
    });
  });

  describe('startCapture', () => {
    it('calls electron.capture.start() and returns true on success', async () => {
      const { result } = renderHook(() => useElectronIpc());

      let returnValue: boolean | undefined;
      await act(async () => {
        returnValue = await result.current.startCapture();
      });

      expect(window.electron.capture.start).toHaveBeenCalled();
      expect(returnValue).toBe(true);
    });

    it('returns false and does not throw when capture.start() rejects', async () => {
      (window.electron.capture.start as jest.Mock).mockRejectedValue(new Error('IPC error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useElectronIpc());

      let returnValue: boolean | undefined;
      await act(async () => {
        returnValue = await result.current.startCapture();
      });

      expect(returnValue).toBe(false);
      consoleSpy.mockRestore();
    });

    it('returns false when Electron is not available', async () => {
      const original = (window as any).electron;
      (window as any).electron = undefined;

      const { result } = renderHook(() => useElectronIpc());
      let returnValue: boolean | undefined;
      await act(async () => {
        returnValue = await result.current.startCapture();
      });

      expect(returnValue).toBe(false);
      (window as any).electron = original;
    });
  });

  describe('onImageCaptured', () => {
    it('registers a listener via electron.on', () => {
      const { result } = renderHook(() => useElectronIpc());
      const callback = jest.fn();

      act(() => {
        result.current.onImageCaptured(callback);
      });

      expect(window.electron.on).toHaveBeenCalledWith('image-captured', expect.any(Function));
    });

    it('returns a no-op function when Electron is not available', () => {
      const original = (window as any).electron;
      (window as any).electron = undefined;

      const { result } = renderHook(() => useElectronIpc());
      let removeListener: (() => void) | undefined;
      act(() => {
        removeListener = result.current.onImageCaptured(jest.fn());
      });

      expect(typeof removeListener).toBe('function');
      expect(() => removeListener?.()).not.toThrow();

      (window as any).electron = original;
    });
  });

  describe('getSettings', () => {
    it('delegates to electron.settings.get()', async () => {
      const mockSettings = { apiKey: 'test', sourceLanguage: 'Auto', targetLanguage: 'English', hotkey: 'Ctrl+Alt+T', theme: 'system', model: 'gemini-2.5-flash', appLanguage: 'English' };
      (window.electron.settings.get as jest.Mock).mockResolvedValue(mockSettings);

      const { result } = renderHook(() => useElectronIpc());
      let settings: any;
      await act(async () => {
        settings = await result.current.getSettings();
      });

      expect(settings).toEqual(mockSettings);
    });

    it('returns null when Electron is not available', async () => {
      const original = (window as any).electron;
      (window as any).electron = undefined;

      const { result } = renderHook(() => useElectronIpc());
      let settings: any;
      await act(async () => {
        settings = await result.current.getSettings();
      });

      expect(settings).toBeNull();
      (window as any).electron = original;
    });
  });

  describe('getPlatform', () => {
    it('returns platform from Electron', async () => {
      (window.electron.platform.getPlatform as jest.Mock).mockResolvedValue('darwin');

      const { result } = renderHook(() => useElectronIpc());
      let platform: string | undefined;
      await act(async () => {
        platform = await result.current.getPlatform();
      });

      expect(platform).toBe('darwin');
    });

    it('returns "web" when Electron is not available', async () => {
      const original = (window as any).electron;
      (window as any).electron = undefined;

      const { result } = renderHook(() => useElectronIpc());
      let platform: string | undefined;
      await act(async () => {
        platform = await result.current.getPlatform();
      });

      expect(platform).toBe('web');
      (window as any).electron = original;
    });
  });
});
