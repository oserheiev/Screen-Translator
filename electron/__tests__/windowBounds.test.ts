import { validateWindowBounds } from '../windowBounds';

const display = (x: number, y: number, width: number, height: number) => ({
  bounds: { x, y, width, height },
});

describe('validateWindowBounds', () => {
  const primary = display(0, 0, 1920, 1080);

  it('returns bounds that are fully within a display', () => {
    const bounds = { x: 100, y: 100, width: 800, height: 600 };
    expect(validateWindowBounds(bounds, [primary])).toEqual(bounds);
  });

  it('returns bounds on the second display in a multi-monitor setup', () => {
    const second = display(1920, 0, 2560, 1440);
    const bounds = { x: 2000, y: 100, width: 800, height: 600 };
    expect(validateWindowBounds(bounds, [primary, second])).toEqual(bounds);
  });

  it('returns partially overlapping bounds', () => {
    const bounds = { x: -100, y: 0, width: 800, height: 600 };
    expect(validateWindowBounds(bounds, [primary])).toEqual(bounds);
  });

  it('returns null for bounds entirely off all displays', () => {
    const bounds = { x: 9000, y: 9000, width: 800, height: 600 };
    expect(validateWindowBounds(bounds, [primary])).toBeNull();
  });

  it('returns null for null input', () => {
    expect(validateWindowBounds(null, [primary])).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(validateWindowBounds(undefined, [primary])).toBeNull();
  });

  it('returns null when the displays array is empty', () => {
    const bounds = { x: 100, y: 100, width: 800, height: 600 };
    expect(validateWindowBounds(bounds, [])).toBeNull();
  });
});
