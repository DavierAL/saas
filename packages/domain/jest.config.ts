import type { Config } from 'jest';

const config: Config = {
  displayName:     '@saas-pos/domain',
  preset:          'ts-jest',
  testEnvironment: 'node',
  rootDir:         './src',
  testMatch:       ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '../tsconfig.json' }],
  },
};

export default config;
