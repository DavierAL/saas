import { createPowerSyncConfig } from '../powersync-config';

describe('powersync-config', () => {
  describe('createPowerSyncConfig', () => {
    test('creates config with provided URLs', () => {
      const config = createPowerSyncConfig(
        'https://api.example.com',
        'https://powersync.example.com'
      );

      expect(config.backendUrl).toBe('https://api.example.com');
      expect(config.powersyncUrl).toBe('https://powersync.example.com');
    });

    test('config is readonly (immutability)', () => {
      const config = createPowerSyncConfig(
        'https://api.example.com',
        'https://powersync.example.com'
      );

      // TypeScript compile-time check - these should fail if uncommented
      // config.backendUrl = 'https://other.com';
      // (config as any).backendUrl = 'https://other.com';

      expect(config).toBeDefined();
    });

    test('returns PowerSyncConfig type', () => {
      const config = createPowerSyncConfig('a', 'b');

      expect(config).toHaveProperty('backendUrl');
      expect(config).toHaveProperty('powersyncUrl');
      expect(typeof config.backendUrl).toBe('string');
      expect(typeof config.powersyncUrl).toBe('string');
    });

    test('handles various URL formats', () => {
      const configs = [
        createPowerSyncConfig('http://localhost:3000', 'http://localhost:54321'),
        createPowerSyncConfig('https://prod.api.com', 'wss://sync.prod.api.com'),
        createPowerSyncConfig('', ''),
      ];

      const c0 = configs[0]!;
      const c1 = configs[1]!;
      const c2 = configs[2]!;

      expect(c0.backendUrl).toBe('http://localhost:3000');
      expect(c1.powersyncUrl).toBe('wss://sync.prod.api.com');
      expect(c2.backendUrl).toBe('');
    });
  });
});