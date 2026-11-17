import { EventEmitter } from 'node:events';
import { app } from 'electron';

it('exits once when Windows ends the session, even if multiple windows are notified', () => {
  const platform = Object.getOwnPropertyDescriptor(process, 'platform')!;
  Object.defineProperty(process, 'platform', { ...platform, value: 'win32' });
  try {
    require('../main');
  } finally {
    Object.defineProperty(process, 'platform', platform);
  }

  const [, onWindowCreated] = (app.on as jest.Mock).mock.calls.find(
    ([event]) => event === 'browser-window-created'
  ) ?? [];
  const mainWindow = new EventEmitter();
  const overlayWindow = new EventEmitter();
  onWindowCreated?.({}, mainWindow);
  onWindowCreated?.({}, overlayWindow);

  mainWindow.emit('query-session-end');
  expect(app.exit).not.toHaveBeenCalled();

  overlayWindow.emit('session-end');
  mainWindow.emit('session-end');

  expect(app.exit).toHaveBeenCalledWith(0);
  expect(app.exit).toHaveBeenCalledTimes(1);
});
