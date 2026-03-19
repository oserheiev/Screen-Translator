// Mock for uiohook-napi — the native keyboard hook library.

type EventListener = (event: any) => void;
const listeners: Record<string, EventListener[]> = {};

export const uIOhook = {
  on: jest.fn((event: string, handler: EventListener) => {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(handler);
  }),
  off: jest.fn((event: string, handler: EventListener) => {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter(h => h !== handler);
    }
  }),
  start: jest.fn(),
  stop: jest.fn(),
  // Helper to simulate events in tests (not a real uiohook-napi API)
  _emit: (event: string, data: any) => {
    (listeners[event] || []).forEach(h => h(data));
  },
  _clearListeners: () => {
    Object.keys(listeners).forEach(k => delete listeners[k]);
  },
};

// UiohookKey codes (simplified, matching real values for consistency in tests)
export const UiohookKey = {
  A: 30, B: 48, C: 46, D: 32, E: 18, F: 33, G: 34, H: 35, I: 23, J: 36,
  K: 37, L: 38, M: 50, N: 49, O: 24, P: 25, Q: 16, R: 19, S: 31, T: 20,
  U: 22, V: 47, W: 17, X: 45, Y: 21, Z: 44,
  '0': 11, '1': 2, '2': 3, '3': 4, '4': 5, '5': 6, '6': 7, '7': 8, '8': 9, '9': 10,
  F1: 59, F2: 60, F3: 61, F4: 62, F5: 63, F6: 64, F7: 65, F8: 66, F9: 67,
  F10: 68, F11: 87, F12: 88, F13: 183, F14: 184, F15: 185,
  F16: 186, F17: 187, F18: 188, F19: 189, F20: 190,
  Space: 57, Tab: 15, Enter: 28, Escape: 1, Backspace: 14,
  Delete: 111, Insert: 110, Home: 102, End: 107,
  PageUp: 104, PageDown: 109,
  ArrowUp: 103, ArrowDown: 108, ArrowLeft: 105, ArrowRight: 106,
  PrintScreen: 99,
  Semicolon: 39, Equal: 13, Comma: 51, Minus: 12, Period: 52,
  Slash: 53, Backquote: 41, BracketLeft: 26, Backslash: 43,
  BracketRight: 27, Quote: 40,
  Numpad0: 82, Numpad1: 79, Numpad2: 80, Numpad3: 81, Numpad4: 75,
  Numpad5: 76, Numpad6: 77, Numpad7: 71, Numpad8: 72, Numpad9: 73,
  NumpadMultiply: 55, NumpadAdd: 78, NumpadSubtract: 74,
  NumpadDecimal: 83, NumpadDivide: 98, NumpadEnter: 96,
};

// UiohookKeyboardEvent type
export interface UiohookKeyboardEvent {
  keycode: number;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}
