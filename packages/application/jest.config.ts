import type { Config } from 'jest';

const config: Config = {
  displayName:     '@saas-pos/application',
  preset:          'ts-jest',
  testEnvironment: 'node',
  rootDir:         './src',
  testMatch:       ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '../tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@saas-pos/domain$':      '<rootDir>/../../domain/src/index.ts',
    '^@saas-pos/utils$':       '<rootDir>/../../utils/src/index.ts',
  },
};

export default config;
