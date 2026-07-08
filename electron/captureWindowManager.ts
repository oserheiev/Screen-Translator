import { app, BrowserWindow, globalShortcut } from 'electron';

// Windows are always fully loaded before this is called: pooled windows load
// capture.html at prepare time, cold-path windows are awaited before showing.
export function showCaptureWindows(
  windows: Map<number, BrowserWindow>,
  onEscapeClose: () => void
): void {
  app.focus({ steal: true });

  globalShortcut.register('Escape', onEscapeClose);

  windows.forEach((captureWindow) => {
    if (!captureWindow || captureWindow.isDestroyed()) return;

    captureWindow.setAlwaysOnTop(true, 'screen-saver');
    captureWindow.setIgnoreMouseEvents(false);
    captureWindow.show();
    captureWindow.focus();
    captureWindow.moveTop();

    process.nextTick(() => {
      if (!captureWindow.isDestroyed()) {
        captureWindow.moveTop();
      }
    });
  });
}
