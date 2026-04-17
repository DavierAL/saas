/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  displayName: '@saas-pos/db',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './src',
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@saas-pos/domain$': '<rootDir>/../../domain/src/index.ts',
    '^@saas-pos/utils$': '<rootDir>/../../utils/src/index.ts',
  },
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },
};
