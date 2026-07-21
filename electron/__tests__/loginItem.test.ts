import * as path from 'path';
import { buildLoginItemSettings } from '../loginItem';

describe('buildLoginItemSettings', () => {
  const packagedEnv = {
    isPackaged: true,
    execPath: 'C:\\Program Files\\Screen Translator\\Screen Translator.exe',
    appEntryArg: '.',
  };
  const devEnv = {
    isPackaged: false,
    execPath: 'D:\\Programming\\Screen-Translator\\node_modules\\electron\\dist\\electron.exe',
    appEntryArg: '.',
  };

  it('uses no args for a packaged build with no hidden start', () => {
    const result = buildLoginItemSettings(true, false, packagedEnv);
    expect(result).toEqual({ openAtLogin: true, path: packagedEnv.execPath, args: [] });
  });

  it('resolves the app entry argument for a dev build', () => {
    const result = buildLoginItemSettings(true, false, devEnv);
    expect(result.args).toEqual([path.resolve('.')]);
  });

  it('appends --hidden for a packaged build when startHidden is true', () => {
    const result = buildLoginItemSettings(true, true, packagedEnv);
    expect(result.args).toEqual(['--hidden']);
  });

  it('appends --hidden after the app entry argument for a dev build', () => {
    const result = buildLoginItemSettings(true, true, devEnv);
    expect(result.args).toEqual([path.resolve('.'), '--hidden']);
  });

  it('omits --hidden when startHidden is false', () => {
    const result = buildLoginItemSettings(true, false, devEnv);
    expect(result.args).not.toContain('--hidden');
  });

  it('carries openAtLogin=false through unchanged', () => {
    const result = buildLoginItemSettings(false, true, packagedEnv);
    expect(result.openAtLogin).toBe(false);
  });

  it('always sets path to execPath', () => {
    const result = buildLoginItemSettings(true, false, devEnv);
    expect(result.path).toBe(devEnv.execPath);
  });
});
