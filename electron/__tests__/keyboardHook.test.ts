// The keyboardHook module exports a singleton. We reset its internal state
// manually between tests to keep them isolated.

import { keyboardHook } from '../keyboardHook';
import { uIOhook, UiohookKey } from 'uiohook-napi';
import { systemPreferences } from 'electron';

const mockUIOhook = uIOhook as jest.Mocked<typeof uIOhook> & { _emit: (e: string, d: any) => void; _clearListeners: () => void };

function resetSingleton() {
  (keyboardHook as any).parsedHotkey = null;
  (keyboardHook as any).callback = null;
  (keyboardHook as any).started = false;
  (keyboardHook as any).lastFired = 0;
  (keyboardHook as any).keydownHandler = null;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUIOhook._clearListeners();
  resetSingleton();
  // Default: accessibility trusted, non-darwin platform
  (systemPreferences.isTrustedAccessibilityClient as jest.Mock).mockReturnValue(true);
  Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
});

afterEach(() => {
  // Clean up if started
  if ((keyboardHook as any).started) {
    keyboardHook.stop();
  }
});

describe('keyboardHook.registerHotkey', () => {
  it('returns true for a valid hotkey string', () => {
    const result = keyboardHook.registerHotkey('Ctrl+Alt+T', jest.fn());
    expect(result).toBe(true);
  });

  it('returns false for an unknown key', () => {
    const result = keyboardHook.registerHotkey('Ctrl+Alt+XYZ', jest.fn());
    expect(result).toBe(false);
  });

  it('parses Ctrl+Alt+T correctly (sets ctrl, alt, T keycode)', () => {
    keyboardHook.registerHotkey('Ctrl+Alt+T', jest.fn());
    const parsed = (keyboardHook as any).parsedHotkey;
    expect(parsed).not.toBeNull();
    expect(parsed.ctrl).toBe(true);
    expect(parsed.alt).toBe(true);
    expect(parsed.shift).toBe(false);
    expect(parsed.meta).toBe(false);
    expect(parsed.keyCode).toBe(UiohookKey.T);
  });

  it('parses Ctrl+Shift+A correctly', () => {
    keyboardHook.registerHotkey('Ctrl+Shift+A', jest.fn());
    const parsed = (keyboardHook as any).parsedHotkey;
    expect(parsed.ctrl).toBe(true);
    expect(parsed.shift).toBe(true);
    expect(parsed.alt).toBe(false);
    expect(parsed.keyCode).toBe(UiohookKey.A);
  });

  it('is case-insensitive (ctrl vs Ctrl vs CTRL)', () => {
    const r1 = keyboardHook.registerHotkey('ctrl+alt+t', jest.fn());
    expect(r1).toBe(true);
    resetSingleton();

    const r2 = keyboardHook.registerHotkey('CTRL+ALT+T', jest.fn());
    expect(r2).toBe(true);
  });

  it('accepts a function key without modifiers (F1)', () => {
    const result = keyboardHook.registerHotkey('F1', jest.fn());
    expect(result).toBe(true);
    const parsed = (keyboardHook as any).parsedHotkey;
    expect(parsed.ctrl).toBe(false);
    expect(parsed.alt).toBe(false);
    expect(parsed.keyCode).toBe(UiohookKey.F1);
  });
});

describe('keyboardHook.start / stop', () => {
  it('registers a keydown listener and starts uIOhook', () => {
    keyboardHook.registerHotkey('Ctrl+Alt+T', jest.fn());
    const started = keyboardHook.start();

    expect(started).toBe(true);
    expect(uIOhook.on).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(uIOhook.start).toHaveBeenCalled();
  });

  it('does not start twice (idempotent)', () => {
    keyboardHook.registerHotkey('Ctrl+Alt+T', jest.fn());
    keyboardHook.start();
    keyboardHook.start();

    expect(uIOhook.start).toHaveBeenCalledTimes(1);
  });

  it('removes the listener and stops uIOhook on stop()', () => {
    keyboardHook.registerHotkey('Ctrl+Alt+T', jest.fn());
    keyboardHook.start();
    keyboardHook.stop();

    expect(uIOhook.off).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(uIOhook.stop).toHaveBeenCalled();
  });
});

describe('keyboardHook callback invocation', () => {
  it('invokes the callback when the registered hotkey event fires', () => {
    const callback = jest.fn();
    keyboardHook.registerHotkey('Ctrl+Alt+T', callback);
    keyboardHook.start();

    // Simulate a keydown event matching Ctrl+Alt+T
    mockUIOhook._emit('keydown', {
      keycode: UiohookKey.T,
      ctrlKey: true,
      altKey: true,
      shiftKey: false,
      metaKey: false,
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('does NOT invoke callback for a non-matching keydown event', () => {
    const callback = jest.fn();
    keyboardHook.registerHotkey('Ctrl+Alt+T', callback);
    keyboardHook.start();

    // Wrong key
    mockUIOhook._emit('keydown', {
      keycode: UiohookKey.A,
      ctrlKey: true,
      altKey: true,
      shiftKey: false,
      metaKey: false,
    });

    expect(callback).not.toHaveBeenCalled();
  });
});

describe('keyboardHook.unregisterAll', () => {
  it('clears the registered hotkey and callback', () => {
    keyboardHook.registerHotkey('Ctrl+Alt+T', jest.fn());
    keyboardHook.unregisterAll();

    expect((keyboardHook as any).parsedHotkey).toBeNull();
    expect((keyboardHook as any).callback).toBeNull();
  });
});
