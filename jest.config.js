module.exports = {
  // Use multiple projects to handle different environments
  projects: [
    // React renderer process testing
    {
      displayName: 'renderer',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub',
        '^@google/genai$': '<rootDir>/src/mocks/gemini.mock.ts'
      },
      transformIgnorePatterns: [
        'node_modules/(?!(@google/genai)/)'
      ],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'jest.tsconfig.json'
        }]
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
      collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/index.tsx',
        '!src/capture.html'
      ]
    },
    // Electron main process testing
    {
      displayName: 'main',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/electron/**/*.test.{ts,js}'],
      setupFilesAfterEnv: ['<rootDir>/electron/setupTests.ts'],
      transform: {
        '^.+\\.(ts|js)$': ['ts-jest', {
          tsconfig: 'jest.tsconfig.json'
        }]
      },
      moduleFileExtensions: ['ts', 'js', 'json'],
      collectCoverageFrom: [
        'electron/**/*.{ts,js}',
        '!electron/**/*.d.ts',
        '!electron/main.ts'
      ]
    }
  ],
  // Global configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  // Verbose output
  verbose: true
};