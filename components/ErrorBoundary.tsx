/**
 * Error Boundary Component
 *
 * React error boundary with recovery mechanisms and user-friendly fallbacks
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { errorHandler, ErrorContext } from "../services/errorHandler";
import { logger } from "../services/logger";

// Props interfaces
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean;
  level?: "page" | "section" | "component";
  name?: string;
}

export interface ErrorFallbackProps {
  error?: Error;
  errorInfo?: ErrorInfo;
  resetError?: () => void;
  retry?: () => void;
  hasError: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
  isRecovering: boolean;
}

/**
 * Main Error Boundary Component
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private maxRetries = 3;
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      retryCount: 0,
      isRecovering: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, name = "Unknown", level = "component" } = this.props;

    // Enhanced error context
    const context: ErrorContext = {
      component: name,
      additionalData: {
        level,
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        retryCount: this.state.retryCount,
        resetFunction: () => this.resetError(),
      },
    };

    // Store error info in state
    this.setState({ errorInfo });

    // Handle error through error handler
    errorHandler.handleError(error, context, true);

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Log error with context
    logger.error(`Error caught by ${name} boundary`, error, context);
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  /**
   * Reset error state
   */
  resetError = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0,
      isRecovering: false,
    });
  };

  /**
   * Retry with automatic recovery attempt
   */
  retry = async () => {
    const { error } = this.state;

    if (!error || this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState({
      isRecovering: true,
      retryCount: this.state.retryCount + 1,
    });

    try {
      // Attempt recovery through error handler
      const recovered = await errorHandler.handleError(
        error,
        {
          component: this.props.name || "ErrorBoundary",
          additionalData: {
            retryAttempt: this.state.retryCount + 1,
            resetFunction: () => this.resetError(),
          },
        },
        true
      );

      if (recovered) {
        // If recovery successful, reset the error state
        this.resetError();
      } else {
        // If recovery failed, wait before allowing another retry
        this.retryTimeout = setTimeout(() => {
          this.setState({ isRecovering: false });
        }, 2000);
      }
    } catch (recoveryError) {
      logger.error(
        "Error during boundary recovery",
        recoveryError instanceof Error
          ? recoveryError
          : new Error(String(recoveryError))
      );
      this.setState({ isRecovering: false });
    }
  };

  render() {
    const { hasError, error, errorInfo, isRecovering } = this.state;
    const { children, fallback: CustomFallback, isolate = false } = this.props;

    if (hasError) {
      const fallbackProps: ErrorFallbackProps = {
        error,
        errorInfo,
        resetError: this.resetError,
        retry: this.retry,
        hasError: true,
      };

      // Use custom fallback if provided
      if (CustomFallback) {
        return <CustomFallback {...fallbackProps} />;
      }

      // Use default fallback based on isolation level
      if (isolate) {
        return (
          <IsolatedErrorFallback
            {...fallbackProps}
            isRecovering={isRecovering}
          />
        );
      } else {
        return (
          <DefaultErrorFallback
            {...fallbackProps}
            isRecovering={isRecovering}
          />
        );
      }
    }

    return children;
  }
}

/**
 * Default Error Fallback Component
 */
interface DefaultErrorFallbackProps extends ErrorFallbackProps {
  isRecovering: boolean;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  resetError,
  retry,
  isRecovering,
}) => {
  return (
    <div className="error-boundary-fallback">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <h2>Something went wrong</h2>
        <p>
          We encountered an unexpected error. Don't worry, we're working to fix
          it.
        </p>

        {error && (
          <details className="error-details">
            <summary>Error Details</summary>
            <pre>{error.message}</pre>
          </details>
        )}

        <div className="error-actions">
          <button
            onClick={retry}
            disabled={isRecovering}
            className="retry-button"
          >
            {isRecovering ? "Recovering..." : "Try Again"}
          </button>
          <button onClick={resetError} className="reset-button">
            Reset
          </button>
          <button
            onClick={() => window.location.reload()}
            className="reload-button"
          >
            Reload Page
          </button>
        </div>
      </div>

      <style>{`
        .error-boundary-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          padding: 2rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          margin: 1rem 0;
        }

        .error-content {
          text-align: center;
          max-width: 500px;
        }

        .error-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .error-content h2 {
          color: #dc2626;
          margin-bottom: 0.5rem;
        }

        .error-content p {
          color: #6b7280;
          margin-bottom: 1.5rem;
        }

        .error-details {
          text-align: left;
          margin-bottom: 1.5rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 1rem;
        }

        .error-details summary {
          cursor: pointer;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .error-details pre {
          font-size: 0.875rem;
          color: #374151;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .error-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .error-actions button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .retry-button {
          background: #3b82f6;
          color: white;
        }

        .retry-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .retry-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .reset-button {
          background: #6b7280;
          color: white;
        }

        .reset-button:hover {
          background: #4b5563;
        }

        .reload-button {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .reload-button:hover {
          background: #e5e7eb;
        }
      `}</style>
    </div>
  );
};

/**
 * Isolated Error Fallback Component (for smaller components)
 */
const IsolatedErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  retry,
  isRecovering,
}) => {
  return (
    <div className="isolated-error-fallback">
      <span className="error-icon">⚠️</span>
      <span className="error-message">Error loading component</span>
      <button
        onClick={retry}
        disabled={isRecovering}
        className="retry-button-small"
        title={error?.message}
      >
        {isRecovering ? "..." : "↻"}
      </button>

      <style>{`
        .isolated-error-fallback {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 4px;
          font-size: 0.875rem;
          color: #dc2626;
        }

        .error-icon {
          font-size: 1rem;
        }

        .error-message {
          font-weight: 500;
        }

        .retry-button-small {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          color: #3b82f6;
          padding: 0.25rem;
          border-radius: 2px;
          transition: background-color 0.2s;
        }

        .retry-button-small:hover:not(:disabled) {
          background: #dbeafe;
        }

        .retry-button-small:disabled {
          color: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

/**
 * Higher-order component for wrapping components with error boundaries
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}

/**
 * Hook for error boundary functionality in functional components
 */
export function useErrorHandler() {
  const handleError = React.useCallback(
    (error: Error, context?: ErrorContext) => {
      errorHandler.handleError(error, {
        component: "useErrorHandler",
        ...context,
      });
    },
    []
  );

  const reportError = React.useCallback(
    (error: Error, context?: ErrorContext) => {
      errorHandler.handleError(
        error,
        {
          component: "useErrorHandler",
          ...context,
        },
        false
      ); // Don't attempt recovery for manually reported errors
    },
    []
  );

  return {
    handleError,
    reportError,
    getErrorReports: errorHandler.getErrorReports.bind(errorHandler),
    clearErrorReports: errorHandler.clearErrorReports.bind(errorHandler),
    getErrorStatistics: errorHandler.getErrorStatistics.bind(errorHandler),
  };
}

export default ErrorBoundary;
