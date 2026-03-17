import { uIOhook, UiohookKey, UiohookKeyboardEvent } from 'uiohook-napi';
import { systemPreferences } from 'electron';

interface ParsedHotkey {
  keyCode: number;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

// Keys use DOM KeyboardEvent.key names (lowercased) since that's what
// SettingsModal.tsx produces via e.key. See src/components/SettingsModal.tsx.
const KEY_MAP: Record<string, number> = {
  a: UiohookKey.A, b: UiohookKey.B, c: UiohookKey.C, d: UiohookKey.D,
  e: UiohookKey.E, f: UiohookKey.F, g: UiohookKey.G, h: UiohookKey.H,
  i: UiohookKey.I, j: UiohookKey.J, k: UiohookKey.K, l: UiohookKey.L,
  m: UiohookKey.M, n: UiohookKey.N, o: UiohookKey.O, p: UiohookKey.P,
  q: UiohookKey.Q, r: UiohookKey.R, s: UiohookKey.S, t: UiohookKey.T,
  u: UiohookKey.U, v: UiohookKey.V, w: UiohookKey.W, x: UiohookKey.X,
  y: UiohookKey.Y, z: UiohookKey.Z,
  '0': UiohookKey['0'], '1': UiohookKey['1'], '2': UiohookKey['2'],
  '3': UiohookKey['3'], '4': UiohookKey['4'], '5': UiohookKey['5'],
  '6': UiohookKey['6'], '7': UiohookKey['7'], '8': UiohookKey['8'],
  '9': UiohookKey['9'],
  f1: UiohookKey.F1, f2: UiohookKey.F2, f3: UiohookKey.F3,
  f4: UiohookKey.F4, f5: UiohookKey.F5, f6: UiohookKey.F6,
  f7: UiohookKey.F7, f8: UiohookKey.F8, f9: UiohookKey.F9,
  f10: UiohookKey.F10, f11: UiohookKey.F11, f12: UiohookKey.F12,
  ' ': UiohookKey.Space,
  tab: UiohookKey.Tab,
  enter: UiohookKey.Enter,
  escape: UiohookKey.Escape,
  backspace: UiohookKey.Backspace,
  delete: UiohookKey.Delete,
  insert: UiohookKey.Insert,
  home: UiohookKey.Home,
  end: UiohookKey.End,
  pageup: UiohookKey.PageUp,
  pagedown: UiohookKey.PageDown,
  arrowup: UiohookKey.ArrowUp,
  arrowdown: UiohookKey.ArrowDown,
  arrowleft: UiohookKey.ArrowLeft,
  arrowright: UiohookKey.ArrowRight,
  printscreen: UiohookKey.PrintScreen,
};

function parseHotkey(hotkeyString: string): ParsedHotkey | null {
  const parts = hotkeyString.split('+').map(p => p.trim().toLowerCase());
  const modifiers = { ctrl: false, alt: false, shift: false, meta: false };
  let keyCode = 0;

  for (const part of parts) {
    if (part === 'ctrl' || part === 'control') {
      modifiers.ctrl = true;
    } else if (part === 'alt' || part === 'option') {
      modifiers.alt = true;
    } else if (part === 'shift') {
      modifiers.shift = true;
    } else if (part === 'command' || part === 'meta' || part === 'super') {
      modifiers.meta = true;
    } else {
      keyCode = KEY_MAP[part] ?? 0;
    }
  }

  if (keyCode === 0) {
    return null;
  }

  return { keyCode, ...modifiers };
}

class KeyboardHookService {
  private parsedHotkey: ParsedHotkey | null = null;
  private callback: (() => void) | null = null;
  private started = false;
  private lastFired = 0;
  private throttleMs = 500;
  private keydownHandler: ((event: UiohookKeyboardEvent) => void) | null = null;

  start(): void {
    if (this.started) return;

    if (process.platform === 'darwin') {
      const trusted = systemPreferences.isTrustedAccessibilityClient(true);
      if (!trusted) {
        console.warn('Accessibility permission not granted. Keyboard hook may not work on macOS.');
      }
    }

    this.keydownHandler = (event: UiohookKeyboardEvent) => {
      if (!this.parsedHotkey || !this.callback) return;

      if (
        event.keycode === this.parsedHotkey.keyCode &&
        event.ctrlKey === this.parsedHotkey.ctrl &&
        event.altKey === this.parsedHotkey.alt &&
        event.shiftKey === this.parsedHotkey.shift &&
        event.metaKey === this.parsedHotkey.meta
      ) {
        const now = Date.now();
        if (now - this.lastFired < this.throttleMs) return;
        this.lastFired = now;
        this.callback();
      }
    };

    uIOhook.on('keydown', this.keydownHandler);
    uIOhook.start();
    this.started = true;
    console.log('Keyboard hook started');
  }

  stop(): void {
    if (!this.started) return;
    if (this.keydownHandler) {
      uIOhook.off('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    uIOhook.stop();
    this.started = false;
    console.log('Keyboard hook stopped');
  }

  registerHotkey(hotkeyString: string, callback: () => void): void {
    this.parsedHotkey = parseHotkey(hotkeyString);
    this.callback = callback;

    if (!this.parsedHotkey) {
      console.error('Failed to parse hotkey:', hotkeyString);
    } else {
      console.log('Registered keyboard hook hotkey:', hotkeyString);
    }
  }

  unregisterAll(): void {
    this.parsedHotkey = null;
    this.callback = null;
  }
}

export const keyboardHook = new KeyboardHookService();
