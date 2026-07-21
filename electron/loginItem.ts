import * as path from 'path';

export interface LoginItemEnvironment {
  isPackaged: boolean;
  execPath: string;
  appEntryArg: string;
}

export interface LoginItemSettings {
  openAtLogin: boolean;
  path: string;
  args: string[];
}

export function buildLoginItemSettings(
  openAtLogin: boolean,
  startHidden: boolean,
  env: LoginItemEnvironment
): LoginItemSettings {
  const args = env.isPackaged ? [] : [path.resolve(env.appEntryArg)];
  if (startHidden) {
    args.push('--hidden');
  }
  return { openAtLogin, path: env.execPath, args };
}
