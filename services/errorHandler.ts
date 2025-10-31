/**
 * Error Handler Service
 *
 * Centralized error handling system with recovery strategies,
 * error reporting, and context management.
 */

import { logger } from './logger';

// Error types and interfaces
export interface ErrorContext {
  component?: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: number;
  additionalData?: Record<string, any>;
}

export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  cause?: SerializedError;
}

export interface ErrorReport {
  id: string;
  timestamp: number;
  error: SerializedError;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recovered: boolean;
}

export interface RecoveryStrategy {
  canRecover: (error: Error) => boolean;
  recover: (error: Error, context: ErrorContext) => Promise<boolean>;
  maxAttempts?: number;
}

// Error classification
export enum ErrorType {
  NETWORK_ERROR = 'NetworkError',
  CACHE_ERROR = 'CacheError',
  COMPONENT_ERROR = 'ComponentError',
  VALIDATION_ERROR = 'ValidationError',
  SECURITY_ERROR = 'SecurityError',
  PERFORMANCE_ERROR = 'PerformanceError',
  UNKNOWN_ERROR = 'UnknownError',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Main Error Handler class
 */
export class ErrorHandler {
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  private errorReports: ErrorReport[] = [];
  private maxReports = 100;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupDefaultRecoveryStrategies();
    this.setupGlobalErrorHandlers();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup default recovery strategies
   */
  private setupDefaultRecoveryStrategies(): void {
    // Network error recovery
    this.registerRecoveryStrategy(ErrorType.NETWORK_ERROR, {
      canRecover: (error) => error.name === 'NetworkError' || error.message.includes('fetch'),
      recover: async (error, context) => {
        logger.info('Attempting network error recovery', {
          additionalData: { error: error.message, context }
        });

        // Retry with exponential backoff
        const maxRetries = 3;
        let attempt = 0;

        while (attempt < maxRetries) {
          try {
            await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff

            // If the error has a retry function in context, use it
            if (context.additionalData?.retryFunction) {
              await context.additionalData.retryFunction();
              return true;
            }

            attempt++;
          } catch (retryError) {
            logger.warn(`Network retry attempt ${attempt + 1} failed`, {
              additionalData: {
                error: retryError instanceof Error ? retryError.message : String(retryError)
              }
            });
            attempt++;
          }
        }

        return false;
      },
      maxAttempts: 3,
    });

    // Cache error recovery
    this.registerRecoveryStrategy(ErrorType.CACHE_ERROR, {
      canRecover: (error) => error.message.includes('cache') || error.message.includes('storage'),
      recover: async (error, context) => {
        logger.info('Attempting cache error recovery', {
          additionalData: { error: error.message, context }
        });

        try {
          // Clear potentially corrupted cache
          if (typeof localStorage !== 'undefined') {
            const keysToRemove = Object.keys(localStorage).filter(key =>
              key.startsWith('rss-') || key.startsWith('cache-')
            );
            keysToRemove.forEach(key => localStorage.removeItem(key));
          }

          // Clear IndexedDB cache if available
          if ('indexedDB' in window) {
            // This would be implemented based on your IndexedDB usage
            logger.info('IndexedDB cache cleared');
          }

          return true;
        } catch (clearError) {
          logger.error('Failed to clear cache during recovery', clearError instanceof Error ? clearError : new Error(String(clearError)));
          return false;
        }
      },
    });

    // Component error recovery
    this.registerRecoveryStrategy(ErrorType.COMPONENT_ERROR, {
      canRecover: (error) => error.name === 'ChunkLoadError' || error.message.includes('Loading chunk'),
      recover: async (error, context) => {
        logger.info('Attempting component error recovery', {
          additionalData: { error: error.message, context }
        });

        try {
          // For chunk load errors, reload the page
          if (error.name === 'ChunkLoadError') {
            window.location.reload();
            return true;
          }

          // For other component errors, try to reset component state
          if (context.additionalData?.resetFunction) {
            context.additionalData.resetFunction();
            return true;
          }

          return false;
        } catch (recoveryError) {
          logger.error('Component recovery failed', recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError)));
          return false;
        }
      },
    });
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      this.handleError(error, {
        component: 'global',
        additionalData: { type: 'unhandledrejection' },
      });
    });

    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      const error = event.error || new Error(event.message);
      this.handleError(error, {
        component: 'global',
        url: event.filename,
        additionalData: {
          type: 'javascript',
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });
  }

  /**
   * Register a recovery strategy for a specific error type
   */
  public registerRecoveryStrategy(errorType: string, strategy: RecoveryStrategy): void {
    this.recoveryStrategies.set(errorType, strategy);
    logger.debug(`Recovery strategy registered for ${errorType}`);
  }

  /**
   * Handle an error with optional recovery attempt
   */
  public async handleError(
    error: Error,
    context: ErrorContext = {},
    attemptRecovery = true
  ): Promise<boolean> {
    const enhancedContext = this.enhanceContext(context);
    const errorType = this.classifyError(error);
    const severity = this.determineSeverity(error, errorType);

    // Create error report
    const report = this.createErrorReport(error, enhancedContext, severity);
    this.storeErrorReport(report);

    // Log the error
    logger.error(`${errorType}: ${error.message}`, error, enhancedContext);

    // Attempt recovery if enabled
    let recovered = false;
    if (attemptRecovery) {
      recovered = await this.attemptRecovery(error, enhancedContext, errorType);
      report.recovered = recovered;
    }

    // Report to external services if configured
    await this.reportError(report);

    return recovered;
  }

  /**
   * Enhance error context with additional information
   */
  private enhanceContext(context: ErrorContext): ErrorContext {
    return {
      ...context,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
  }

  /**
   * Classify error type
   */
  private classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (name.includes('network') || message.includes('fetch') || message.includes('network')) {
      return ErrorType.NETWORK_ERROR;
    }

    if (message.includes('cache') || message.includes('storage')) {
      return ErrorType.CACHE_ERROR;
    }

    if (name.includes('chunk') || message.includes('loading chunk')) {
      return ErrorType.COMPONENT_ERROR;
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION_ERROR;
    }

    if (message.includes('security') || message.includes('csp') || message.includes('cors')) {
      return ErrorType.SECURITY_ERROR;
    }

    if (message.includes('performance') || message.includes('timeout')) {
      return ErrorType.PERFORMANCE_ERROR;
    }

    return ErrorType.UNKNOWN_ERROR;
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error, errorType: ErrorType): ErrorSeverity {
    // Critical errors that break core functionality
    if (errorType === ErrorType.SECURITY_ERROR ||
        error.name === 'ChunkLoadError' ||
        error.message.includes('Cannot read properties of undefined')) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity errors that impact user experience
    if (errorType === ErrorType.NETWORK_ERROR ||
        errorType === ErrorType.COMPONENT_ERROR) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity errors that cause minor issues
    if (errorType === ErrorType.CACHE_ERROR ||
        errorType === ErrorType.VALIDATION_ERROR) {
      return ErrorSeverity.MEDIUM;
    }

    // Low severity errors that don't impact functionality
    return ErrorSeverity.LOW;
  }

  /**
   * Create error report
   */
  private createErrorReport(
    error: Error,
    context: ErrorContext,
    severity: ErrorSeverity
  ): ErrorReport {
    return {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      error: this.serializeError(error),
      context,
      severity,
      recovered: false,
    };
  }

  /**
   * Serialize error for storage and reporting
   */
  private serializeError(error: Error): SerializedError {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: (error as any).cause instanceof Error ? this.serializeError((error as any).cause) : undefined,
    };
  }

  /**
   * Store error report locally
   */
  private storeErrorReport(report: ErrorReport): void {
    this.errorReports.push(report);

    // Keep only the most recent reports
    if (this.errorReports.length > this.maxReports) {
      this.errorReports = this.errorReports.slice(-this.maxReports);
    }

    // Store in localStorage for persistence
    try {
      const recentReports = this.errorReports.slice(-10); // Keep only 10 most recent
      localStorage.setItem('error-reports', JSON.stringify(recentReports));
    } catch (storageError) {
      logger.warn('Failed to store error reports in localStorage', {
        additionalData: { error: storageError instanceof Error ? storageError.message : String(storageError) }
      });
    }
  }

  /**
   * Attempt error recovery
   */
  private async attemptRecovery(
    error: Error,
    context: ErrorContext,
    errorType: ErrorType
  ): Promise<boolean> {
    const strategy = this.recoveryStrategies.get(errorType) || this.recoveryStrategies.get(error.name);

    if (!strategy || !strategy.canRecover(error)) {
      logger.debug(`No recovery strategy available for ${errorType}`);
      return false;
    }

    try {
      logger.info(`Attempting recovery for ${errorType}`, {
        additionalData: { error: error.message }
      });
      const recovered = await strategy.recover(error, context);

      if (recovered) {
        logger.info(`Successfully recovered from ${errorType}`);
      } else {
        logger.warn(`Recovery failed for ${errorType}`);
      }

      return recovered;
    } catch (recoveryError) {
      logger.error(`Recovery strategy failed for ${errorType}`, recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError)));
      return false;
    }
  }

  /**
   * Report error to external services
   */
  private async reportError(report: ErrorReport): Promise<void> {
    // Only report high and critical errors in production
    if (import.meta.env.MODE === 'production' &&
        (report.severity === ErrorSeverity.HIGH || report.severity === ErrorSeverity.CRITICAL)) {

      try {
        // This would integrate with your error reporting service
        // For now, we'll just log it
        logger.info('Error report would be sent to external service', {
          additionalData: {
            reportId: report.id,
            severity: report.severity,
          }
        });

        // Example: Send to external service
        // await fetch('/api/errors', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(report),
        // });
      } catch (reportingError) {
        logger.error('Failed to report error to external service', reportingError instanceof Error ? reportingError : new Error(String(reportingError)));
      }
    }
  }

  /**
   * Get error reports
   */
  public getErrorReports(): ErrorReport[] {
    return [...this.errorReports];
  }

  /**
   * Clear error reports
   */
  public clearErrorReports(): void {
    this.errorReports = [];
    try {
      localStorage.removeItem('error-reports');
    } catch (error) {
      logger.warn('Failed to clear error reports from localStorage', {
        additionalData: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  /**
   * Get error statistics
   */
  public getErrorStatistics(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byType: Record<string, number>;
    recoveryRate: number;
  } {
    const total = this.errorReports.length;
    const bySeverity = this.errorReports.reduce((acc, report) => {
      acc[report.severity] = (acc[report.severity] || 0) + 1;
      return acc;
    }, {} as Record<ErrorSeverity, number>);

    const byType = this.errorReports.reduce((acc, report) => {
      const type = report.error.name;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recoveredCount = this.errorReports.filter(report => report.recovered).length;
    const recoveryRate = total > 0 ? recoveredCount / total : 0;

    return {
      total,
      bySeverity,
      byType,
      recoveryRate,
    };
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();

// Export default instance
export default errorHandler;
