import { captureDisplayScreenshots, findSourceForDisplay } from '../screenshot';
import { desktopCapturer } from 'electron';

const mockGetSources = desktopCapturer.getSources as jest.Mock;

function makeDisplay(id: number, x: number, width: number, scaleFactor = 1) {
  return {
    id,
    bounds: { x, y: 0, width, height: 1080 },
    scaleFactor,
  } as unknown as Electron.Display;
}

function makeSource(id: string, displayId?: number) {
  return {
    id,
    name: `Screen ${id}`,
    display_id: displayId !== undefined ? String(displayId) : undefined,
    thumbnail: { toPNG: jest.fn().mockReturnValue(Buffer.from(`png-${id}`)) },
  } as unknown as Electron.DesktopCapturerSource;
}

describe('captureDisplayScreenshots', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests thumbnails at physical pixel size (bounds x scaleFactor)', async () => {
    const display = makeDisplay(1, 0, 1920, 2);
    mockGetSources.mockResolvedValue([makeSource('screen:1:0', 1)]);

    await captureDisplayScreenshots([display]);

    expect(mockGetSources).toHaveBeenCalledWith({
      types: ['screen'],
      thumbnailSize: { width: 3840, height: 2160 },
    });
  });

  it('returns PNG buffers keyed by display id', async () => {
    const display = makeDisplay(7, 0, 1920);
    mockGetSources.mockResolvedValue([makeSource('screen:7:0', 7)]);

    const result = await captureDisplayScreenshots([display]);

    expect(result.get(7)).toEqual(Buffer.from('png-screen:7:0'));
  });

  it('omits displays that have no matching source', async () => {
    const display = makeDisplay(1, 0, 1920);
    mockGetSources.mockResolvedValue([]);

    const result = await captureDisplayScreenshots([display]);

    expect(result.size).toBe(0);
  });

  it('captures every display', async () => {
    const d1 = makeDisplay(1, 0, 1920);
    const d2 = makeDisplay(2, 1920, 2560);
    mockGetSources.mockResolvedValue([
      makeSource('screen:1:0', 1),
      makeSource('screen:2:0', 2),
    ]);

    const result = await captureDisplayScreenshots([d1, d2]);

    expect(result.size).toBe(2);
    expect(mockGetSources).toHaveBeenCalledTimes(2);
  });
});

describe('findSourceForDisplay', () => {
  it('matches a source by display_id', () => {
    const display = makeDisplay(123, 0, 1920);
    const sources = [makeSource('screen:0:0', 999), makeSource('screen:1:0', 123)];

    const result = findSourceForDisplay(display, 0, sources);

    expect(result!.id).toBe('screen:1:0');
  });

  it('falls back to positional matching when no id matches', () => {
    const display = makeDisplay(555, 1920, 2560);
    const sources = [makeSource('screen:0:0'), makeSource('screen:1:0')];

    const result = findSourceForDisplay(display, 1, sources);

    expect(result!.id).toBe('screen:1:0');
  });

  it('returns null when there are no screen sources', () => {
    const display = makeDisplay(1, 0, 1920);

    const result = findSourceForDisplay(display, 0, []);

    expect(result).toBeNull();
  });
});
