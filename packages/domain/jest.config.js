/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  displayName:     '@saas-pos/domain',
  preset:          'ts-jest',
  testEnvironment: 'node',
  rootDir:         './src',
  testMatch:       ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches:   50,
      functions:  50,
      lines:      50,
      statements: 50,
    },
  },
};
