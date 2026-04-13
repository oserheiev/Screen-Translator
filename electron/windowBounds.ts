export function validateWindowBounds(
  bounds: { x: number; y: number; width: number; height: number } | null | undefined,
  displays: { bounds: { x: number; y: number; width: number; height: number } }[]
): { x: number; y: number; width: number; height: number } | null {
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
