import { Settings } from './types';

export function validateWindowBounds(
  bounds: NonNullable<Settings['windowBounds']> | null | undefined,
  displays: { bounds: { x: number; y: number; width: number; height: number } }[]
): NonNullable<Settings['windowBounds']> | null {
  if (!bounds) return null;

  const visible = displays.some((display) => {
    const db = display.bounds;
    return (
      bounds.x < db.x + db.width &&
      bounds.x + bounds.width > db.x &&
      bounds.y < db.y + db.height &&
      bounds.y + bounds.height > db.y
    );
  });

  return visible ? bounds : null;
}
