/**
 * Enhanced Logging System Tests
 *
 * Comprehensive test suite for the logging system including all transports,
 * log levels, context injection, and error handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import {
  AppLogger,
  ConsoleTransport,
  LocalStorageTransport,
  RemoteTransport,
  getDefaultLoggerConfig,
  shouldLog,
  serializeError,
  generateCorrelationId,
  formatLogMessage,
  initializeLogger,
  getLogger,
  logger,
  useLogger,
  withLogging,
  LOG_LEVELS,
  LogLevel,
  LogEntry,
  LogContext,
  LoggerConfig,
  LogTransportConfig,
} from '../services/logger';

// Mock React for testing
vi.mock('react', () => ({
  default: {
    useEffect: vi.fn((fn, deps) => fn()),
    FC: vi.fn(),
  },
  useEffect: vi.fn((fn, deps) => fn()),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock fetch for remote transport
global.fetch = vi.fn();

// Mock console methods
const mockConsole = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Store original console methods
const originalConsole = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

// Replace console methods with mocks
console.debug = mockConsole.debug;
console.info = mockConsole.info;
console.warn = mockConsole.warn;
console.error = mockConsole.error;

describe('Enhanced Logging System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Utility Functions', () => {
    describe('shouldLog', () => {
      it('should return true when entry level is higher than config level', () => {
        expect(shouldLog('ERROR', 'DEBUG')).toBe(true);
        expect(shouldLog('WARN', 'INFO')).toBe(true);
        expect(shouldLog('INFO', 'DEBUG')).toBe(true);
      });

      it('should return true when entry level equals config level', () => {
        expect(shouldLog('ERROR', 'ERROR')).toBe(true);
        expect(shouldLog('WARN', 'WARN')).toBe(true);
        expect(shouldLog('INFO', 'INFO')).toBe(true);
        expect(shouldLog('DEBUG', 'DEBUG')).toBe(true);
      });

      it('should return false when entry level is lower than config level', () => {
        expect(shouldLog('DEBUG', 'INFO')).toBe(false);
        expect(shouldLog('INFO', 'WARN')).toBe(false);
        expect(shouldLog('WARN', 'ERROR')).toBe(false);
      });
    });

    describe('serializeError', () => {
      it('should serialize basic error properties', () => {
        const error = new Error('Test error');
        error.name = 'TestError';

        const serialized = serializeError(error);

        expect(serialized.name).toBe('TestError');
        expect(serialized.message).toBe('Test error');
        expect(serialized.stack).toBeDefined();
      });

      it('should handle nested error causes', () => {
        const rootError = new Error('Root cause');
        const wrappedError = new Error('Wrapped error');
        (wrappedError as any).cause = rootError;

        const serialized = serializeError(wrappedError);

        expect(serialized.message).toBe('Wrapped error');
        expect(serialized.cause).toBeDefined();
        expect(serialized.cause?.message).toBe('Root cause');
      });
    });

    describe('generateCorrelationId', () => {
      it('should generate unique correlation IDs', () => {
        const id1 = generateCorrelationId();
        const id2 = generateCorrelationId();

        expect(id1).not.toBe(id2);
        expect(id1).toMatch(/^\d+-[a-z0-9]+$/);
        expect(id2).toMatch(/^\d+-[a-z0-9]+$/);
      });
    });

    describe('formatLogMessage', () => {
      it('should format log message with all components', () => {
        const entry: LogEntry = {
          level: 'INFO',
          message: 'Test message',
          timestamp: 1640995200000, // 2022-01-01T00:00:00.000Z
          context: { component: 'TestComponent' },
          correlationId: 'test-correlation-id',
        };

        const formatted = formatLogMessage(entry);

        expect(formatted).toContain('2022-01-01T00:00:00.000Z');
        expect(formatted).toContain('INFO');
        expect(formatted).toContain('[TestComponent]');
        expect(formatted).toContain('(test-correlation-id)');
        expect(formatted).toContain('Test message');
      });

      it('should handle missing optional components', () => {
        const entry: LogEntry = {
          level: 'ERROR',
          message: 'Error message',
          timestamp: 1640995200000,
          context: {},
        };

        const formatted = formatLogMessage(entry);

        expect(formatted).toContain('ERROR');
        expect(formatted).toContain('Error message');
        expect(formatted).not.toContain('[');
        expect(formatted).not.toContain('(');
      });
    });

    describe('getDefaultLoggerConfig', () => {
      it('should return development config', () => {
        const config = getDefaultLoggerConfig('development');

        expect(config.level).toBe('DEBUG');
        expect(config.enableContextInjection).toBe(true);
        expect(config.enableCorrelationIds).toBe(true);
        expect(config.maxLogEntries).toBe(5000);
        expect(config.transports).toHaveLength(3);

        const consoleTransport = config.transports.find(t => t.type === 'console');
        expect(consoleTransport?.level).toBe('DEBUG');

        const localStorageTransport = config.transports.find(t => t.type === 'localStorage');
        expect(localStorageTransport?.enabled).toBe(true);

        const remoteTransport = config.transports.find(t => t.type === 'remote');
        expect(remoteTransport?.enabled).toBe(false);
      });

      it('should return production config', () => {
        const config = getDefaultLoggerConfig('production');

        expect(config.level).toBe('WARN');
        expect(config.maxLogEntries).toBe(1000);

        const consoleTransport = config.transports.find(t => t.type === 'console');
        expect(consoleTransport?.level).toBe('WARN');

        const localStorageTransport = config.transports.find(t => t.type === 'localStorage');
        expect(localStorageTransport?.enabled).toBe(false);

        const remoteTransport = config.transports.find(t => t.type === 'remote');
        expect(remoteTransport?.enabled).toBe(true);
      });
    });
  });

  describe('Transport Implementations', () => {
    describe('ConsoleTransport', () => {
      let transport: ConsoleTransport;
      let config: LogTransportConfig;

      beforeEach(() => {
        config = {
          type: 'console',
          enabled: true,
          level: 'DEBUG',
        };
        transport = new ConsoleTransport(config);
      });

      it('should log to appropriate console method based on level', async () => {
        const debugEntry: LogEntry = {
          level: 'DEBUG',
          message: 'Debug message',
          timestamp: Date.now(),
          context: {},
        };

        const errorEntry: LogEntry = {
          level: 'ERROR',
          message: 'Error message',
          timestamp: Date.now(),
          context: {},
        };

        await transport.send(debugEntry);
        await transport.send(errorEntry);

        expect(mockConsole.debug).toHaveBeenCalledTimes(1);
        expect(mockConsole.error).toHaveBeenCalledTimes(1);
      });

      it('should respect log level filtering', async () => {
        transport.configure({ ...config, level: 'WARN' });

        const debugEntry: LogEntry = {
          level: 'DEBUG',
          message: 'Debug message',
          timestamp: Date.now(),
          context: {},
        };

        const warnEntry: LogEntry = {
          level: 'WARN',
          message: 'Warn message',
          timestamp: Date.now(),
          context: {},
        };

        await transport.send(debugEntry);
        await transport.send(warnEntry);

        expect(mockConsole.debug).not.toHaveBeenCalled();
        expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      });

      it('should not log when disabled', async () => {
        transport.configure({ ...config, enabled: false });

        const entry: LogEntry = {
          level: 'INFO',
          message: 'Info message',
          timestamp: Date.now(),
          context: {},
        };

        await transport.send(entry);

        expect(mockConsole.info).not.toHaveBeenCalled();
      });
    });

    describe('LocalStorageTransport', () => {
      let transport: LocalStorageTransport;
      let config: LogTransportConfig;

      beforeEach(() => {
        config = {
          type: 'localStorage',
          enabled: true,
          level: 'INFO',
          batchSize: 2,
          flushInterval: 1000,
        };
        transport = new LocalStorageTransport(config);
      });

      it('should store logs in localStorage when buffer is full', async () => {
        const entry1: LogEntry = {
          level: 'INFO',
          message: 'Message 1',
          timestamp: Date.now(),
          context: {},
        };

        const entry2: LogEntry = {
          level: 'INFO',
          message: 'Message 2',
          timestamp: Date.now(),
          context: {},
        };

        await transport.send(entry1);
        expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

        await transport.send(entry2);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'app-logs',
          expect.stringContaining('Message 1')
        );
      });

      it('should merge with existing logs', async () => {
        const existingLogs = [
          {
            level: 'DEBUG',
            message: 'Existing log',
            timestamp: Date.now() - 1000,
            context: {},
          },
        ];

        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingLogs));

        const newEntry: LogEntry = {
          level: 'INFO',
          message: 'New log',
          timestamp: Date.now(),
          context: {},
        };

        await transport.send(newEntry);
        await transport.flush();

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'app-logs',
          expect.stringContaining('Existing log')
        );
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'app-logs',
          expect.stringContaining('New log')
        );
      });

      it('should handle localStorage errors gracefully', async () => {
        mockLocalStorage.setItem.mockImplementation(() => {
          throw new Error('Storage quota exceeded');
        });

        const entry: LogEntry = {
          level: 'INFO',
          message: 'Test message',
          timestamp: Date.now(),
          context: {},
        };

        await transport.send(entry);
        await transport.flush();

        expect(mockConsole.error).toHaveBeenCalledWith(
          'Failed to store logs in localStorage:',
          expect.any(Error)
        );
      });
    });

    describe('RemoteTransport', () => {
      let transport: RemoteTransport;
      let config: LogTransportConfig;

      beforeEach(() => {
        config = {
          type: 'remote',
          enabled: true,
          level: 'WARN',
          batchSize: 2,
          endpoint: '/api/logs',
          apiKey: 'test-api-key',
        };
        transport = new RemoteTransport(config);
        (global.fetch as Mock).mockResolvedValue({
          ok: true,
          status: 200,
          statusText: 'OK',
        });
      });

      it('should send logs to remote endpoint when buffer is full', async () => {
        const entry1: LogEntry = {
          level: 'WARN',
          message: 'Warning 1',
          timestamp: Date.now(),
          context: {},
        };

        const entry2: LogEntry = {
          level: 'ERROR',
          message: 'Error 1',
          timestamp: Date.now(),
          context: {},
        };

        await transport.send(entry1);
        expect(global.fetch).not.toHaveBeenCalled();

        await transport.send(entry2);
        expect(global.fetch).toHaveBeenCalledWith('/api/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key',
          },
          body: expect.stringContaining('Warning 1'),
        });
      });

      it('should handle network errors gracefully', async () => {
        (global.fetch as Mock).mockRejectedValue(new Error('Network error'));

        const entry: LogEntry = {
          level: 'ERROR',
          message: 'Test error',
          timestamp: Date.now(),
          context: {},
        };

        await transport.send(entry);
        await transport.flush();

        expect(mockConsole.error).toHaveBeenCalledWith(
          'Failed to send logs to remote endpoint:',
          expect.any(Error)
        );
      });

      it('should handle HTTP errors gracefully', async () => {
        (global.fetch as Mock).mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        });

        const entry: LogEntry = {
          level: 'ERROR',
          message: 'Test error',
          timestamp: Date.now(),
          context: {},
        };

        await transport.send(entry);
        await transport.flush();

        expect(mockConsole.error).toHaveBeenCalledWith(
          'Failed to send logs to remote endpoint:',
          expect.any(Error)
        );
      });
    });
  });

  describe('AppLogger', () => {
    let logger: AppLogger;
    let config: LoggerConfig;

    beforeEach(() => {
      config = {
        level: 'DEBUG',
        enableContextInjection: true,
        enableCorrelationIds: true,
        environment: 'development',
        transports: [
          {
            type: 'console',
            enabled: true,
            level: 'DEBUG',
          },
        ],
      };
      logger = new AppLogger(config);
    });

    it('should initialize with global context', () => {
      const context = logger.getContext();

      expect(context.sessionId).toBeDefined();
      expect(context.timestamp).toBeDefined();
    });

    it('should log messages at different levels', () => {
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(mockConsole.debug).toHaveBeenCalledTimes(1);
      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      expect(mockConsole.error).toHaveBeenCalledTimes(1);
    });

    it('should respect log level filtering', () => {
      const warnLogger = new AppLogger({
        ...config,
        level: 'WARN',
      });

      warnLogger.debug('Debug message');
      warnLogger.info('Info message');
      warnLogger.warn('Warning message');
      warnLogger.error('Error message');

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      expect(mockConsole.error).toHaveBeenCalledTimes(1);
    });

    it('should merge context correctly', () => {
      logger.setContext({ userId: 'user123', component: 'TestComponent' });
      logger.info('Test message', { additionalData: { key: 'value' } });

      const logCall = mockConsole.info.mock.calls[0];
      const contextData = logCall[1];

      expect(contextData.userId).toBe('user123');
      expect(contextData.component).toBe('TestComponent');
      expect(contextData.additionalData).toEqual({ key: 'value' });
    });

    it('should serialize errors correctly', () => {
      const testError = new Error('Test error');
      testError.name = 'TestError';

      logger.error('Error occurred', testError);

      const logCall = mockConsole.error.mock.calls[0];
      const contextData = logCall[1];

      expect(contextData.error).toBeDefined();
      expect(contextData.error.name).toBe('TestError');
      expect(contextData.error.message).toBe('Test error');
      expect(contextData.error.stack).toBeDefined();
    });

    it('should generate correlation IDs when enabled', () => {
      logger.info('Test message');

      const logCall = mockConsole.info.mock.calls[0];
      const message = logCall[0];

      expect(message).toMatch(/\(\d+-[a-z0-9]+\)/);
    });

    it('should not generate correlation IDs when disabled', () => {
      const noCorrelationLogger = new AppLogger({
        ...config,
        enableCorrelationIds: false,
      });

      noCorrelationLogger.info('Test message');

      const logCall = mockConsole.info.mock.calls[0];
      const message = logCall[0];

      expect(message).not.toMatch(/\(\d+-[a-z0-9]+\)/);
    });
  });

  describe('Singleton Logger Functions', () => {
    beforeEach(() => {
      // Reset singleton instance
      (global as any).loggerInstance = null;
    });

    it('should initialize logger with default config', () => {
      const loggerInstance = initializeLogger();
      expect(loggerInstance).toBeDefined();
    });

    it('should initialize logger with custom config', () => {
      const customConfig = {
        level: 'ERROR' as LogLevel,
        enableContextInjection: false,
      };

      const loggerInstance = initializeLogger(customConfig);
      expect(loggerInstance).toBeDefined();
    });

    it('should return same instance on subsequent calls', () => {
      const logger1 = getLogger();
      const logger2 = getLogger();
      expect(logger1).toBe(logger2);
    });

    it('should provide convenience logging functions', () => {
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(mockConsole.debug).toHaveBeenCalledTimes(1);
      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      expect(mockConsole.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('React Integration', () => {
    describe('useLogger hook', () => {
      it('should return logger with component context', () => {
        const componentLogger = useLogger('TestComponent');

        componentLogger.info('Test message');

        const logCall = mockConsole.info.mock.calls[0];
        const message = logCall[0];
        const contextData = logCall[1];

        expect(message).toContain('[TestComponent]');
        expect(contextData.component).toBe('TestComponent');
      });

      it('should merge additional context with component context', () => {
        const componentLogger = useLogger('TestComponent');

        componentLogger.warn('Warning message', { userId: 'user123' });

        const logCall = mockConsole.warn.mock.calls[0];
        const contextData = logCall[1];

        expect(contextData.component).toBe('TestComponent');
        expect(contextData.userId).toBe('user123');
      });
    });

    describe('withLogging HOC', () => {
      it('should create wrapped component with logging', () => {
        const TestComponent = () => null;
        const WrappedComponent = withLogging(TestComponent, 'TestComponent');

        expect(WrappedComponent.displayName).toBe('withLogging(TestComponent)');
      });

      it('should use component name when no custom name provided', () => {
        const TestComponent = () => null;
        TestComponent.displayName = 'CustomDisplayName';

        const WrappedComponent = withLogging(TestComponent);

        expect(WrappedComponent.displayName).toBe('withLogging(CustomDisplayName)');
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle multiple transports simultaneously', async () => {
      const multiTransportConfig: LoggerConfig = {
        level: 'INFO',
        enableContextInjection: true,
        enableCorrelationIds: true,
        environment: 'development',
        transports: [
          {
            type: 'console',
            enabled: true,
            level: 'INFO',
          },
          {
            type: 'localStorage',
            enabled: true,
            level: 'WARN',
            batchSize: 1,
          },
        ],
      };

      const multiLogger = new AppLogger(multiTransportConfig);

      multiLogger.info('Info message');
      multiLogger.warn('Warning message');

      // Console should receive both messages
      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);

      // LocalStorage should only receive warning (due to level filtering)
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
    });

    it('should handle transport failures gracefully', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const config: LoggerConfig = {
        level: 'INFO',
        enableContextInjection: true,
        enableCorrelationIds: true,
        environment: 'development',
        transports: [
          {
            type: 'console',
            enabled: true,
            level: 'INFO',
          },
          {
            type: 'localStorage',
            enabled: true,
            level: 'INFO',
            batchSize: 1,
          },
        ],
      };

      const resilientLogger = new AppLogger(config);
      resilientLogger.info('Test message');

      // Console transport should still work
      expect(mockConsole.info).toHaveBeenCalledTimes(1);

      // Error should be logged for failed transport
      expect(mockConsole.error).toHaveBeenCalledWith(
        'Failed to store logs in localStorage:',
        expect.any(Error)
      );
    });

    it('should flush all transports', async () => {
      const config: LoggerConfig = {
        level: 'INFO',
        enableContextInjection: true,
        enableCorrelationIds: true,
        environment: 'development',
        transports: [
          {
            type: 'localStorage',
            enabled: true,
            level: 'INFO',
            batchSize: 10, // High batch size to prevent auto-flush
          },
          {
            type: 'remote',
            enabled: true,
            level: 'INFO',
            batchSize: 10,
            endpoint: '/api/logs',
          },
        ],
      };

      const flushLogger = new AppLogger(config);

      flushLogger.info('Message 1');
      flushLogger.info('Message 2');

      // Messages should be buffered, not sent yet
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();

      // Flush should send all buffered messages
      await flushLogger.flush();

      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
