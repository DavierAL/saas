/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  displayName:     '@saas-pos/application',
  preset:          'ts-jest',
  testEnvironment: 'node',
  rootDir:         './src',
  testMatch:       ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@saas-pos/domain$':      '<rootDir>/../../domain/src/index.ts',
    '^@saas-pos/utils$':       '<rootDir>/../../utils/src/index.ts',
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
