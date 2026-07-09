import { screen } from 'electron';
import type { BrowserWindow } from 'electron';
import { createCaptureWindow, loadCaptureInterface } from './captureWindowFactory';
import { IPC_CHANNELS } from './constants';

interface DisplaySnapshot {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  scaleFactor: number;
}

export interface CaptureWindowPoolDeps {
  windowFactory?: (display: Electron.Display) => BrowserWindow;
  interfaceLoader?: (win: BrowserWindow) => Promise<void>;
  getDisplays?: () => Electron.Display[];
  onWindowCreated?: (win: BrowserWindow, displayId: number) => void;
}

// Keeps one hidden, fully-loaded capture window per display so the overlay
// can be shown immediately on hotkey instead of paying window-creation and
// page-load cost on the critical path.
export class CaptureWindowPool {
  private windows = new Map<number, BrowserWindow>();
  private snapshot: DisplaySnapshot[] = [];
  private preparing = false;
  private inUse = false;
  private needsRebuild = false;

  private readonly windowFactory: (display: Electron.Display) => BrowserWindow;
  private readonly interfaceLoader: (win: BrowserWindow) => Promise<void>;
  private readonly getDisplays: () => Electron.Display[];
  private readonly onWindowCreated: (win: BrowserWindow, displayId: number) => void;

  constructor(deps: CaptureWindowPoolDeps = {}) {
    this.windowFactory = deps.windowFactory ?? createCaptureWindow;
    this.interfaceLoader = deps.interfaceLoader ?? loadCaptureInterface;
    this.getDisplays = deps.getDisplays ?? (() => screen.getAllDisplays());
    this.onWindowCreated = deps.onWindowCreated ?? (() => { });
  }

  isReady(): boolean {
    if (this.inUse || this.preparing || this.windows.size === 0) return false;
    if (!this.snapshotMatches(this.getDisplays())) return false;
    for (const win of this.windows.values()) {
      if (win.isDestroyed()) return false;
    }
    return true;
  }

  acquire(): Map<number, BrowserWindow> | null {
    if (!this.isReady()) return null;
    this.inUse = true;
    return new Map(this.windows);
  }

  release(): void {
    if (!this.inUse) return;
    this.inUse = false;

    let healthy = this.windows.size > 0;
    for (const win of this.windows.values()) {
      if (win.isDestroyed()) {
        healthy = false;
        continue;
      }
      win.hide();
      win.webContents.send(IPC_CHANNELS.CAPTURE_RESET);
    }

    if (!healthy || this.needsRebuild) {
      this.needsRebuild = false;
      void this.prepare();
    }
  }

  async prepare(): Promise<void> {
    if (this.inUse || this.preparing) {
      this.needsRebuild = true;
      return;
    }
    this.preparing = true;
    try {
      this.disposeWindows();
      const displays = this.getDisplays();

      for (const display of displays) {
        const win = this.windowFactory(display);
        this.windows.set(display.id, win);
        win.on('closed', () => this.handleWindowGone(display.id, win));
        win.webContents.on('render-process-gone', () => this.handleWindowGone(display.id, win));
        this.onWindowCreated(win, display.id);
      }

      await Promise.all(
        Array.from(this.windows.values()).map(win => this.interfaceLoader(win))
      );

      this.snapshot = displays.map(d => ({
        id: d.id,
        x: d.bounds.x,
        y: d.bounds.y,
        width: d.bounds.width,
        height: d.bounds.height,
        scaleFactor: d.scaleFactor,
      }));
    } catch (error) {
      console.error('Failed to prepare capture window pool:', error);
      this.disposeWindows();
    } finally {
      this.preparing = false;
    }

    if (this.needsRebuild && !this.inUse) {
      this.needsRebuild = false;
      await this.prepare();
    }
  }

  /** App-shutdown cleanup. Not safe mid-capture: destroys windows without checking inUse. */
  destroyAll(): void {
    this.disposeWindows();
  }

  private handleWindowGone(displayId: number, win: BrowserWindow): void {
    // Ignore events from windows that are no longer part of the pool
    if (this.windows.get(displayId) !== win) return;
    if (this.inUse || this.preparing) {
      this.needsRebuild = true;
      return;
    }
    void this.prepare();
  }

  private disposeWindows(): void {
    for (const win of this.windows.values()) {
      if (!win.isDestroyed()) {
        // Prevent the 'closed' handler from triggering a rebuild loop
        win.removeAllListeners('closed');
        win.destroy();
      }
    }
    this.windows.clear();
    this.snapshot = [];
  }

  private snapshotMatches(displays: Electron.Display[]): boolean {
    if (displays.length !== this.snapshot.length) return false;
    return displays.every(d => {
      const s = this.snapshot.find(snap => snap.id === d.id);
      return !!s
        && s.x === d.bounds.x
        && s.y === d.bounds.y
        && s.width === d.bounds.width
        && s.height === d.bounds.height
        && s.scaleFactor === d.scaleFactor;
    });
  }
}
