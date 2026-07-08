import { desktopCapturer } from 'electron';

export function findSourceForDisplay(display: Electron.Display, displayIndex: number, sources: Electron.DesktopCapturerSource[]): Electron.DesktopCapturerSource | null {
  // Sort screen sources by their sequential index (screen:0:0, screen:1:0, ...)
  const screenSources = sources
    .filter((s: any) => s.id.startsWith('screen:'))
    .sort((a: any, b: any) => {
      const aIdx = parseInt(a.id.split(':')[1] ?? '0', 10);
      const bIdx = parseInt(b.id.split(':')[1] ?? '0', 10);
      return aIdx - bIdx;
    });

  const match = screenSources.find((source: any) => {
    if (source.id.includes(display.id.toString())) return true;
    // @ts-ignore - display_id may be present on some platforms (raw ID string)
    if (source.display_id === display.id.toString()) return true;
    if (source.name && source.name.includes(display.id.toString())) return true;
    return false;
  });

  // Positional fallback: match by display index (both APIs order displays left-to-right)
  return match || screenSources[displayIndex] || screenSources[0] || null;
}

// Capture a full-resolution screenshot of every display, keyed by display id.
// Each display gets its own getSources() call with the exact physical pixel dimensions
// so thumbnails are never upscaled or aspect-ratio-constrained by another display's size.
export async function captureDisplayScreenshots(
  displays: Electron.Display[]
): Promise<Map<number, Buffer>> {
  // Sort displays left-to-right (then top-to-bottom) to match desktopCapturer source order
  const sortedDisplays = [...displays].sort((a, b) =>
    a.bounds.x !== b.bounds.x ? a.bounds.x - b.bounds.x : a.bounds.y - b.bounds.y
  );

  const screenshotsByDisplayId = new Map<number, Buffer>();
  await Promise.all(displays.map(async (display) => {
    const displayIndex = sortedDisplays.findIndex(d => d.id === display.id);
    const physWidth = Math.round(display.bounds.width * display.scaleFactor);
    const physHeight = Math.round(display.bounds.height * display.scaleFactor);
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: physWidth, height: physHeight }
    });
    const source = findSourceForDisplay(display, displayIndex, sources);
    if (source) {
      screenshotsByDisplayId.set(display.id, source.thumbnail.toPNG());
    } else {
      console.warn(`No source found for display ${display.id}`);
    }
  }));
  return screenshotsByDisplayId;
}
