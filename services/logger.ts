/**
 * Enhanced Logging System
 *
 * Provides structured logging with multiple log levels, context-aware logging,
 * and configurable transports for different environments.
 */

import React from 'react';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogContext {
  component?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: number;
  userAgent?: string;
  url?: string;
  additionalData?: Record<string, any>;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context: LogContext;
  error?: SerializedError;
  correlationId?: string;
}

export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  cause?: SerializedError;
}

export interface LogTransportConfig {
  type: 'console' | 'remote' | 'localStorage' | 'indexedDB';
  enabled: boolean;
  level: LogLevel;
  batchSize?: number;
  flushInterval?: number;
  endpoint?: string;
  apiKey?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  transports: LogTransportConfig[];
  enableContextInjection: boolean;
  enableCorrelationIds: boolean;
  maxLogEntries?: number;
  environment: 'development' | 'staging' | 'production';
}

export interface Logger {
  debug(message: string, context?: Partial<LogContext>): void;
  info(message: string, context?: Partial<LogContext>): void;
  warn(message: string, context?: Partial<LogContext>): void;
  error(message: string, error?: Error, context?: Partial<LogContext>): void;
  setContext(context: Partial<LogContext>): void;
  getContext(): LogContext;
  flush(): Promise<void>;
}

export interface LogTransport {
  send(logEntry: LogEntry): Promise<void>;
  batch(logEntries: LogEntry[]): Promise<void>;
  configure(config: LogTransportConfig): void;
  flush(): Promise<void>;
}

// Log level hierarchy for filtering
export const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Default configuration based on environment
export const getDefaultLoggerConfig = (environment: string): LoggerConfig => {
  const isDevelopment = environment === 'development';
  const isProduction = environment === 'production';

  return {
    level: isDevelopment ? 'DEBUG' : isProduction ? 'WARN' : 'INFO',
    enableContextInjection: true,
    enableCorrelationIds: true,
    maxLogEntries: isProduction ? 1000 : 5000,
    environment: environment as LoggerConfig['environment'],
    transports: [
      {
        type: 'console',
        enabled: true,
        level: isDevelopment ? 'DEBUG' : 'WARN',
      },
      {
        type: 'localStorage',
        enabled: !isProduction,
        level: 'INFO',
        batchSize: 50,
        flushInterval: 30000, // 30 seconds
      },
      {
        type: 'remote',
        enabled: false, // Disabled for GitHub Pages deployment
        level: 'WARN',
        batchSize: 100,
        flushInterval: 60000, // 1 minute
        endpoint: '/api/logs',
      },
    ],
  };
};

// Utility functions
export const serializeError = (error: Error): SerializedError => {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    cause: (error as any).cause ? serializeError((error as any).cause as Error) : undefined,
  };
};

export const shouldLog = (entryLevel: LogLevel, configLevel: LogLevel): boolean => {
  return LOG_LEVELS[entryLevel] >= LOG_LEVELS[configLevel];
};

export const generateCorrelationId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const formatLogMessage = (entry: LogEntry): string => {
  const timestamp = new Date(entry.timestamp).toISOString();
  const context = entry.context.component ? `[${entry.context.component}]` : '';
  const correlation = entry.correlationId ? `(${entry.correlationId})` : '';

  return `${timestamp} ${entry.level} ${context}${correlation} ${entry.message}`;
};

// Console Transport Implementation
export class ConsoleTransport implements LogTransport {
  private config: LogTransportConfig;

  constructor(config: LogTransportConfig) {
    this.config = config;
  }

  configure(config: LogTransportConfig): void {
    this.config = config;
  }

  async send(logEntry: LogEntry): Promise<void> {
    if (!this.config.enabled || !shouldLog(logEntry.level, this.config.level)) {
      return;
    }

    const formattedMessage = formatLogMessage(logEntry);
    const contextData = { ...logEntry.context, error: logEntry.error };

    switch (logEntry.level) {
      case 'DEBUG':
        console.debug(formattedMessage, contextData);
        break;
      case 'INFO':
        console.info(formattedMessage, contextData);
        break;
      case 'WARN':
        console.warn(formattedMessage, contextData);
        break;
      case 'ERROR':
        console.error(formattedMessage, contextData);
        break;
    }
  }

  async batch(logEntries: LogEntry[]): Promise<void> {
    for (const entry of logEntries) {
      await this.send(entry);
    }
  }

  async flush(): Promise<void> {
    // Console transport doesn't need flushing
  }
}

// LocalStorage Transport Implementation
export class LocalStorageTransport implements LogTransport {
  private config: LogTransportConfig;
  private buffer: LogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;
  private readonly storageKey = 'app-logs';

  constructor(config: LogTransportConfig) {
    this.config = config;
    this.startFlushTimer();
  }

  configure(config: LogTransportConfig): void {
    this.config = config;
    this.startFlushTimer();
  }

  async send(logEntry: LogEntry): Promise<void> {
    if (!this.config.enabled || !shouldLog(logEntry.level, this.config.level)) {
      return;
    }

    this.buffer.push(logEntry);

    if (this.buffer.length >= (this.config.batchSize || 50)) {
      await this.flush();
    }
  }

  async batch(logEntries: LogEntry[]): Promise<void> {
    const filteredEntries = logEntries.filter(entry =>
      this.config.enabled && shouldLog(entry.level, this.config.level)
    );

    this.buffer.push(...filteredEntries);

    if (this.buffer.length >= (this.config.batchSize || 50)) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    try {
      const existingLogs = this.getStoredLogs();
      const newLogs = [...existingLogs, ...this.buffer];

      // Keep only the most recent logs to prevent storage overflow
      const maxLogs = 1000;
      const logsToStore = newLogs.slice(-maxLogs);

      localStorage.setItem(this.storageKey, JSON.stringify(logsToStore));
      this.buffer = [];
    } catch (error) {
      console.error('Failed to store logs in localStorage:', error);
    }
  }

  private getStoredLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    if (this.config.flushInterval) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }
}

// Remote Transport Implementation
export class RemoteTransport implements LogTransport {
  private config: LogTransportConfig;
  private buffer: LogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: LogTransportConfig) {
    this.config = config;
    this.startFlushTimer();
  }

  configure(config: LogTransportConfig): void {
    this.config = config;
    this.startFlushTimer();
  }

  async send(logEntry: LogEntry): Promise<void> {
    if (!this.config.enabled || !shouldLog(logEntry.level, this.config.level)) {
      return;
    }

    this.buffer.push(logEntry);

    if (this.buffer.length >= (this.config.batchSize || 100)) {
      await this.flush();
    }
  }

  async batch(logEntries: LogEntry[]): Promise<void> {
    const filteredEntries = logEntries.filter(entry =>
      this.config.enabled && shouldLog(entry.level, this.config.level)
    );

    this.buffer.push(...filteredEntries);

    if (this.buffer.length >= (this.config.batchSize || 100)) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0 || !this.config.endpoint) return;

    const logsToSend = [...this.buffer];
    this.buffer = [];

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify({ logs: logsToSend }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send logs to remote endpoint:', error);
      // Re-add logs to buffer for retry
      this.buffer.unshift(...logsToSend);
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    if (this.config.flushInterval) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }
}
// Main Logger Implementation
export class AppLogger implements Logger {
  private config: LoggerConfig;
  private transports: LogTransport[] = [];
  private globalContext: LogContext = {};
  private sessionId: string;

  constructor(config: LoggerConfig) {
    this.config = config;
    this.sessionId = generateCorrelationId();
    this.initializeTransports();
    this.initializeGlobalContext();
  }

  private initializeTransports(): void {
    this.transports = this.config.transports.map(transportConfig => {
      switch (transportConfig.type) {
        case 'console':
          return new ConsoleTransport(transportConfig);
        case 'localStorage':
          return new LocalStorageTransport(transportConfig);
        case 'remote':
          return new RemoteTransport(transportConfig);
        default:
          throw new Error(`Unknown transport type: ${transportConfig.type}`);
      }
    });
  }

  private initializeGlobalContext(): void {
    if (this.config.enableContextInjection) {
      this.globalContext = {
        sessionId: this.sessionId,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        timestamp: Date.now(),
      };
    }
  }

  setContext(context: Partial<LogContext>): void {
    this.globalContext = { ...this.globalContext, ...context };
  }

  getContext(): LogContext {
    return { ...this.globalContext };
  }

  debug(message: string, context?: Partial<LogContext>): void {
    this.log('DEBUG', message, undefined, context);
  }

  info(message: string, context?: Partial<LogContext>): void {
    this.log('INFO', message, undefined, context);
  }

  warn(message: string, context?: Partial<LogContext>): void {
    this.log('WARN', message, undefined, context);
  }

  error(message: string, error?: Error, context?: Partial<LogContext>): void {
    this.log('ERROR', message, error, context);
  }

  private log(level: LogLevel, message: string, error?: Error, context?: Partial<LogContext>): void {
    if (!shouldLog(level, this.config.level)) {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context: {
        ...this.globalContext,
        ...context,
        url: typeof window !== 'undefined' ? window.location.href : this.globalContext.url,
      },
      error: error ? serializeError(error) : undefined,
      correlationId: this.config.enableCorrelationIds ? generateCorrelationId() : undefined,
    };

    // Send to all configured transports
    this.transports.forEach(transport => {
      transport.send(logEntry).catch(err => {
        console.error('Transport failed to send log:', err);
      });
    });
  }

  async flush(): Promise<void> {
    await Promise.all(this.transports.map(transport => transport.flush()));
  }
}

// Singleton logger instance
let loggerInstance: Logger | null = null;

export const initializeLogger = (config?: Partial<LoggerConfig>): Logger => {
  const environment = import.meta.env.MODE || 'development';
  const defaultConfig = getDefaultLoggerConfig(environment);
  const finalConfig = { ...defaultConfig, ...config };

  loggerInstance = new AppLogger(finalConfig);
  return loggerInstance;
};

export const getLogger = (): Logger => {
  if (!loggerInstance) {
    loggerInstance = initializeLogger();
  }
  return loggerInstance;
};

// Convenience functions for direct usage
export const logger = {
  debug: (message: string, context?: Partial<LogContext>) => getLogger().debug(message, context),
  info: (message: string, context?: Partial<LogContext>) => getLogger().info(message, context),
  warn: (message: string, context?: Partial<LogContext>) => getLogger().warn(message, context),
  error: (message: string, error?: Error, context?: Partial<LogContext>) => getLogger().error(message, error, context),
  setContext: (context: Partial<LogContext>) => getLogger().setContext(context),
  getContext: () => getLogger().getContext(),
  flush: () => getLogger().flush(),
};

// React Hook for component-level logging
export const useLogger = (componentName: string) => {
  const loggerInstance = getLogger();

  return {
    debug: (message: string, context?: Partial<LogContext>) =>
      loggerInstance.debug(message, { ...context, component: componentName }),
    info: (message: string, context?: Partial<LogContext>) =>
      loggerInstance.info(message, { ...context, component: componentName }),
    warn: (message: string, context?: Partial<LogContext>) =>
      loggerInstance.warn(message, { ...context, component: componentName }),
    error: (message: string, error?: Error, context?: Partial<LogContext>) =>
      loggerInstance.error(message, error, { ...context, component: componentName }),
    setContext: (context: Partial<LogContext>) => loggerInstance.setContext(context),
    getContext: () => loggerInstance.getContext(),
  };
};

// Higher-order component for automatic logging
export const withLogging = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) => {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const LoggingWrapper: React.FC<P> = (props) => {
    const logger = useLogger(displayName);

    React.useEffect(() => {
      logger.debug(`${displayName} mounted`);

      return () => {
        logger.debug(`${displayName} unmounted`);
      };
    }, [logger]);

    return React.createElement(WrappedComponent, props);
  };

  LoggingWrapper.displayName = `withLogging(${displayName})`;
  return LoggingWrapper;
};
