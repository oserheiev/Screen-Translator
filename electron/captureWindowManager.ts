import { app, BrowserWindow, globalShortcut } from 'electron';

export function showCaptureWindows(
  windows: Map<number, BrowserWindow>,
  onEscapeClose: () => void
): void {
  app.focus({ steal: true });

  globalShortcut.register('Escape', onEscapeClose);

  windows.forEach((captureWindow) => {
    if (!captureWindow || captureWindow.isDestroyed()) return;

    let shown = false;

    const showWindow = () => {
      if (shown || captureWindow.isDestroyed()) return;
      shown = true;

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
    };

    captureWindow.once('ready-to-show', showWindow);

    setTimeout(() => {
      if (!shown) showWindow();
    }, 300);
  });
}
