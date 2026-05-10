import { createLogger, logger, LogLevel } from '../logger';

describe('logger utilities', () => {
  let originalEnv: string | undefined;

  beforeAll(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterAll(() => {
    if (originalEnv !== undefined) {
      process.env.NODE_ENV = originalEnv;
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ConsoleLogger', () => {
    test('creates logger with specified level', () => {
      const testLogger = createLogger('debug');
      expect(testLogger).toBeDefined();
      expect(typeof testLogger.debug).toBe('function');
      expect(typeof testLogger.info).toBe('function');
      expect(typeof testLogger.warn).toBe('function');
      expect(typeof testLogger.error).toBe('function');
    });

    test('debug logs when level is debug', () => {
      const testLogger = createLogger('debug');
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();

      testLogger.debug('test message', { foo: 'bar' });

      expect(consoleSpy).toHaveBeenCalledWith('[DEBUG] test message', { foo: 'bar' });
      consoleSpy.mockRestore();
    });

    test('info logs when level is info or lower', () => {
      const testLogger = createLogger('info');
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

      testLogger.info('test message');

      expect(consoleSpy).toHaveBeenCalledWith('[INFO] test message');
      consoleSpy.mockRestore();
    });

    test('warn logs when level is warn or lower', () => {
      const testLogger = createLogger('warn');
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      testLogger.warn('test message');

      expect(consoleSpy).toHaveBeenCalledWith('[WARN] test message');
      consoleSpy.mockRestore();
    });

    test('error logs when level is error', () => {
      const testLogger = createLogger('error');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      testLogger.error('test message');

      expect(consoleSpy).toHaveBeenCalledWith('[ERROR] test message');
      consoleSpy.mockRestore();
    });

    test('does not log when level is above message level', () => {
      const testLogger = createLogger('error');
      const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
      const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      testLogger.debug('debug message');
      testLogger.info('info message');
      testLogger.warn('warn message');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      consoleDebugSpy.mockRestore();
      consoleInfoSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    test('setLevel changes the logging level', () => {
      const testLogger = createLogger('error') as any;

      // Initially debug should not log
      const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
      testLogger.debug('should not log');
      expect(consoleDebugSpy).not.toHaveBeenCalled();

      // After setting to debug, it should log
      testLogger.setLevel('debug');
      testLogger.debug('should log now');
      expect(consoleDebugSpy).toHaveBeenCalledWith('[DEBUG] should log now');

      consoleDebugSpy.mockRestore();
    });

    test('handles multiple arguments', () => {
      const testLogger = createLogger('debug');
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();

      testLogger.debug('message', 'arg1', 123, { key: 'value' });

      expect(consoleSpy).toHaveBeenCalledWith('[DEBUG] message', 'arg1', 123, { key: 'value' });
      consoleSpy.mockRestore();
    });
  });

  describe('default logger instance', () => {
    test('logger is exported and is a Logger', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });
  });

  describe('LogLevel type', () => {
    test('LogLevel accepts valid values', () => {
      const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
      levels.forEach((level) => {
        const testLogger = createLogger(level);
        expect(testLogger).toBeDefined();
      });
    });
  });
});