/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'renderer',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/jest.tsconfig.json' }],
      },
      moduleNameMapper: {
        '\\.(css|less|scss)$': 'identity-obj-proxy',
        '^@google/genai$': '<rootDir>/__mocks__/@google/genai.ts',
        '^markdown-to-jsx$': '<rootDir>/__mocks__/markdown-to-jsx.ts',
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
    },
    {
      displayName: 'main',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/electron/**/*.test.ts'],
      transform: {
        '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/jest.tsconfig.json' }],
      },
      moduleNameMapper: {
        '^electron$': '<rootDir>/__mocks__/electron-main.ts',
        '^electron-store$': '<rootDir>/__mocks__/electron-store.ts',
        '^uiohook-napi$': '<rootDir>/__mocks__/uiohook-napi.ts',
        '^electron-updater$': '<rootDir>/__mocks__/electron-updater.ts',
      },
    },
  ],
};
