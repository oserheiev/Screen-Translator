import { ScreenCapture } from '../../capture/capture';

let screenshotCallback: (payload: any) => void;
let resetCallback: () => void;

function makePayload(overrides: Record<string, any> = {}) {
  return {
    buffer: new Uint8Array([137, 80, 78, 71]),
    displayId: 1,
    displayX: 0,
    displayY: 0,
    ...overrides,
  };
}

describe('ScreenCapture', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="captureOverlay"></div>
      <div id="selectionArea"></div>
      <div id="instructions"></div>
    `;
    document.body.style.cursor = '';

    (URL as any).createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    (URL as any).revokeObjectURL = jest.fn();

    (window as any).electron = {
      settings: {
        get: jest.fn().mockResolvedValue({ appLanguage: 'English' }),
      },
      capture: {
        onScreenshotReady: jest.fn((cb: any) => { screenshotCallback = cb; }),
        onCaptureReset: jest.fn((cb: any) => { resetCallback = cb; }),
        complete: jest.fn().mockResolvedValue(undefined),
        log: jest.fn(),
      },
    };
  });

  it('registers persistent screenshot-ready and capture-reset listeners on construction', () => {
    new ScreenCapture();

    expect((window as any).electron.capture.onScreenshotReady).toHaveBeenCalledTimes(1);
    expect((window as any).electron.capture.onCaptureReset).toHaveBeenCalledTimes(1);
  });

  it('displays the screenshot as a blob-URL image on screenshot-ready', () => {
    new ScreenCapture();

    screenshotCallback(makePayload());

    const img = document.querySelector('img.screenshot-background') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.src).toContain('blob:mock-url');
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(document.body.style.cursor).toBe('crosshair');
  });

  it('replaces the previous screenshot and revokes its blob URL on a second screenshot-ready', () => {
    new ScreenCapture();

    screenshotCallback(makePayload());
    screenshotCallback(makePayload({ displayId: 2 }));

    const imgs = document.querySelectorAll('img.screenshot-background');
    expect(imgs).toHaveLength(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('clears the backdrop, selection and flags on capture-reset', () => {
    const capture = new ScreenCapture();
    screenshotCallback(makePayload());

    // Simulate an in-progress selection
    (capture as any).isSelecting = true;
    (capture as any).isCompleting = true;

    resetCallback();

    expect(document.querySelector('img.screenshot-background')).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    expect((document.getElementById('selectionArea') as HTMLElement).style.display).toBe('none');
    expect((capture as any).isSelecting).toBe(false);
    expect((capture as any).isCompleting).toBe(false);
  });

  it('stores the display offset from the payload for coordinate mapping', () => {
    const capture = new ScreenCapture();

    screenshotCallback(makePayload({ displayX: 1920, displayY: 100 }));

    expect((capture as any).localToGlobalCoordinates(10, 20)).toEqual({ x: 1930, y: 120 });
  });
});
