import { CaptureWindowPool } from '../captureWindowPool';
import type { BrowserWindow } from 'electron';

type Listener = (...args: any[]) => void;

function makeMockWindow() {
  let destroyed = false;
  const listeners = new Map<string, Listener[]>();
  const wcListeners = new Map<string, Listener[]>();

  const win: any = {
    on: jest.fn((event: string, cb: Listener) => {
      listeners.set(event, [...(listeners.get(event) ?? []), cb]);
      return win;
    }),
    removeAllListeners: jest.fn((event: string) => {
      listeners.delete(event);
      return win;
    }),
    destroy: jest.fn(() => {
      destroyed = true;
    }),
    isDestroyed: jest.fn(() => destroyed),
    hide: jest.fn(),
    show: jest.fn(),
    webContents: {
      send: jest.fn(),
      on: jest.fn((event: string, cb: Listener) => {
        wcListeners.set(event, [...(wcListeners.get(event) ?? []), cb]);
      }),
    },
    emit: (event: string) => (listeners.get(event) ?? []).forEach(cb => cb()),
    emitWebContents: (event: string) => (wcListeners.get(event) ?? []).forEach(cb => cb()),
    destroyExternally: () => {
      destroyed = true;
      (listeners.get('closed') ?? []).forEach(cb => cb());
    },
  };
  return win;
}

type MockWindow = ReturnType<typeof makeMockWindow>;

function makeDisplay(id: number, x = 0): Electron.Display {
  return {
    id,
    bounds: { x, y: 0, width: 1920, height: 1080 },
    scaleFactor: 1,
  } as unknown as Electron.Display;
}

function makePool(displays: Electron.Display[] = [makeDisplay(1)]) {
  const created: MockWindow[] = [];
  const windowFactory = jest.fn(() => {
    const win = makeMockWindow();
    created.push(win);
    return win as unknown as BrowserWindow;
  });
  const interfaceLoader = jest.fn().mockResolvedValue(undefined);
  const getDisplays = jest.fn(() => displays);
  const onWindowCreated = jest.fn();
  const pool = new CaptureWindowPool({ windowFactory, interfaceLoader, getDisplays, onWindowCreated });
  return { pool, created, windowFactory, interfaceLoader, getDisplays, onWindowCreated };
}

describe('CaptureWindowPool', () => {
  it('acquire returns null before prepare', () => {
    const { pool } = makePool();

    expect(pool.acquire()).toBeNull();
  });

  it('prepare creates one hidden window per display and loads the capture interface', async () => {
    const displays = [makeDisplay(1), makeDisplay(2, 1920)];
    const { pool, windowFactory, interfaceLoader } = makePool(displays);

    await pool.prepare();

    expect(windowFactory).toHaveBeenCalledTimes(2);
    expect(interfaceLoader).toHaveBeenCalledTimes(2);
  });

  it('invokes onWindowCreated for each pooled window', async () => {
    const { pool, onWindowCreated, created } = makePool();

    await pool.prepare();

    expect(onWindowCreated).toHaveBeenCalledTimes(1);
    expect(onWindowCreated).toHaveBeenCalledWith(created[0], 1);
  });

  it('acquire returns windows keyed by display id after prepare', async () => {
    const { pool, created } = makePool([makeDisplay(7)]);

    await pool.prepare();
    const windows = pool.acquire();

    expect(windows).not.toBeNull();
    expect(windows!.get(7)).toBe(created[0]);
  });

  it('acquire returns null while already acquired', async () => {
    const { pool } = makePool();
    await pool.prepare();

    expect(pool.acquire()).not.toBeNull();
    expect(pool.acquire()).toBeNull();
  });

  it('release hides each window and sends capture-reset to its renderer', async () => {
    const { pool, created } = makePool();
    await pool.prepare();
    pool.acquire();

    pool.release();

    expect(created[0].hide).toHaveBeenCalled();
    expect(created[0].webContents.send).toHaveBeenCalledWith('capture-reset');
  });

  it('acquire works again after release', async () => {
    const { pool } = makePool();
    await pool.prepare();
    pool.acquire();
    pool.release();

    expect(pool.acquire()).not.toBeNull();
  });

  it('acquire returns null when the display configuration changed since prepare', async () => {
    const displays = [makeDisplay(1)];
    const { pool, getDisplays } = makePool(displays);
    await pool.prepare();

    getDisplays.mockReturnValue([makeDisplay(1), makeDisplay(2, 1920)]);

    expect(pool.acquire()).toBeNull();
  });

  it('acquire returns null when display bounds changed since prepare', async () => {
    const { pool, getDisplays } = makePool([makeDisplay(1)]);
    await pool.prepare();

    const resized = makeDisplay(1);
    (resized.bounds as any).width = 2560;
    getDisplays.mockReturnValue([resized]);

    expect(pool.acquire()).toBeNull();
  });

  it('acquire returns null when a pooled window was destroyed', async () => {
    const { pool, created } = makePool();
    await pool.prepare();

    created[0].destroyExternally();

    expect(pool.acquire()).toBeNull();
  });

  it('rebuilds in the background when a pooled window closes while idle', async () => {
    const { pool, windowFactory, created } = makePool();
    await pool.prepare();

    created[0].destroyExternally();
    await Promise.resolve(); // let the background prepare start
    await Promise.resolve();

    expect(windowFactory).toHaveBeenCalledTimes(2); // initial + rebuild
  });

  it('defers rebuild while acquired: render-process-gone during use rebuilds on release', async () => {
    const { pool, windowFactory, created } = makePool();
    await pool.prepare();
    pool.acquire();

    created[0].emitWebContents('render-process-gone');
    expect(windowFactory).toHaveBeenCalledTimes(1); // no rebuild while in use

    pool.release();
    await Promise.resolve();
    await Promise.resolve();

    expect(windowFactory).toHaveBeenCalledTimes(2);
  });

  it('destroys partially created windows when prepare fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { pool, created, interfaceLoader } = makePool([makeDisplay(1), makeDisplay(2, 1920)]);
    interfaceLoader.mockRejectedValueOnce(new Error('load failed'));

    await pool.prepare();

    expect(created.every(w => w.destroy.mock.calls.length > 0)).toBe(true);
    expect(pool.acquire()).toBeNull();
    consoleErrorSpy.mockRestore();
  });

  it('destroyAll destroys every pooled window', async () => {
    const { pool, created } = makePool();
    await pool.prepare();

    pool.destroyAll();

    expect(created[0].destroy).toHaveBeenCalled();
    expect(pool.acquire()).toBeNull();
  });

  it('prepare replaces existing pooled windows', async () => {
    const { pool, created } = makePool();
    await pool.prepare();
    await pool.prepare();

    expect(created).toHaveLength(2);
    expect(created[0].destroy).toHaveBeenCalled();
    expect(pool.acquire()!.get(1)).toBe(created[1]);
  });
});
