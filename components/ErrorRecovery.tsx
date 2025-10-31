/**
 * ErrorRecovery.tsx
 *
 * Error recovery UI components for handling various failure scenarios
 * in the RSS feed loading system. Provides user-friendly error messages
 * and recovery options.
 *
 * @author Matheus Pereira
 * @version 1.0.0
 */

import React, { useState } from "react";
import { LoadingSpinner } from "./ProgressIndicator";

export interface FeedError {
  url: string;
  error: string;
  timestamp: number;
  feedTitle?: string;
  errorType?: "timeout" | "network" | "parse" | "cors" | "unknown";
}

interface ErrorDisplayProps {
  error: FeedError;
  onRetry?: (url: string) => void;
  onRemove?: (url: string) => void;
  isRetrying?: boolean;
  className?: string;
}

/**
 * Individual error display component for a single feed
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onRemove,
  isRetrying = false,
  className = "",
}) => {
  const getErrorIcon = () => {
    switch (error.errorType) {
      case "timeout":
        return (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "network":
        return (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
            />
          </svg>
        );
      case "parse":
        return (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      case "cors":
        return (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
    }
  };

  const getErrorMessage = () => {
    switch (error.errorType) {
      case "timeout":
        return "Feed took too long to respond";
      case "network":
        return "Network connection failed";
      case "parse":
        return "Unable to parse feed content";
      case "cors":
        return "Cross-origin request blocked";
      default:
        return error.error || "Unknown error occurred";
    }
  };

  const getErrorSeverity = () => {
    switch (error.errorType) {
      case "timeout":
      case "network":
        return "warning"; // Temporary issues
      case "parse":
      case "cors":
        return "error"; // More serious issues
      default:
        return "warning";
    }
  };

  const severity = getErrorSeverity();
  const severityClasses = {
    warning: {
      container: "bg-yellow-50 border-yellow-200",
      icon: "text-yellow-500",
      title: "text-yellow-800",
      message: "text-yellow-700",
      button: "bg-yellow-100 hover:bg-yellow-200 text-yellow-800",
    },
    error: {
      container: "bg-red-50 border-red-200",
      icon: "text-red-500",
      title: "text-red-800",
      message: "text-red-700",
      button: "bg-red-100 hover:bg-red-200 text-red-800",
    },
  };

  const classes = severityClasses[severity];

  return (
    <div className={`border rounded-lg p-4 ${classes.container} ${className}`}>
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 ${classes.icon}`}>{getErrorIcon()}</div>

        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium ${classes.title}`}>
            {error.feedTitle || new URL(error.url).hostname}
          </h4>
          <p className={`text-sm mt-1 ${classes.message}`}>
            {getErrorMessage()}
          </p>
          <p className={`text-xs mt-1 ${classes.message} opacity-75`}>
            Failed at {new Date(error.timestamp).toLocaleTimeString()}
          </p>
        </div>

        <div className="flex-shrink-0 flex space-x-2">
          {onRetry && (
            <button
              onClick={() => onRetry(error.url)}
              disabled={isRetrying}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors touch-manipulation ${
                classes.button
              } ${isRetrying ? "opacity-50 cursor-not-allowed" : ""}`}
              style={{ minHeight: "32px", minWidth: "60px" }}
            >
              {isRetrying ? (
                <div className="flex items-center space-x-1">
                  <LoadingSpinner size="sm" />
                  <span>Retrying...</span>
                </div>
              ) : (
                "Retry"
              )}
            </button>
          )}

          {onRemove && (
            <button
              onClick={() => onRemove(error.url)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Remove this feed"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface ErrorSummaryProps {
  errors: FeedError[];
  onRetryAll?: () => void;
  onRetrySelected?: (urls: string[]) => void;
  onDismissAll?: () => void;
  isRetrying?: boolean;
  className?: string;
}

/**
 * Error summary component showing overview of all errors
 */
export const ErrorSummary: React.FC<ErrorSummaryProps> = ({
  errors,
  onRetryAll,
  onRetrySelected,
  onDismissAll,
  isRetrying = false,
  className = "",
}) => {
  const [selectedErrors, setSelectedErrors] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  if (errors.length === 0) return null;

  const errorsByType = errors.reduce((acc, error) => {
    const type = error.errorType || "unknown";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleSelectError = (url: string, selected: boolean) => {
    if (selected) {
      setSelectedErrors((prev) => [...prev, url]);
    } else {
      setSelectedErrors((prev) => prev.filter((u) => u !== url));
    }
  };

  const handleSelectAll = () => {
    if (selectedErrors.length === errors.length) {
      setSelectedErrors([]);
    } else {
      setSelectedErrors(errors.map((e) => e.url));
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "timeout":
        return "Timeout";
      case "network":
        return "Network";
      case "parse":
        return "Parse Error";
      case "cors":
        return "CORS";
      default:
        return "Other";
    }
  };

  return (
    <div
      className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-red-500">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-red-800 font-medium">
              {errors.length} feed{errors.length !== 1 ? "s" : ""} failed to
              load
            </h3>
            <p className="text-red-700 text-sm">
              {Object.entries(errorsByType)
                .map(([type, count]) => `${count} ${getTypeLabel(type)}`)
                .join(", ")}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            {isExpanded ? "Hide Details" : "Show Details"}
          </button>

          {onRetryAll && (
            <button
              onClick={onRetryAll}
              disabled={isRetrying}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors touch-manipulation bg-red-100 hover:bg-red-200 text-red-800 ${
                isRetrying ? "opacity-50 cursor-not-allowed" : ""
              }`}
              style={{ minHeight: "36px", minWidth: "80px" }}
            >
              {isRetrying ? (
                <div className="flex items-center space-x-1">
                  <LoadingSpinner size="sm" />
                  <span>Retrying...</span>
                </div>
              ) : (
                "Retry All"
              )}
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {/* Bulk actions */}
          <div className="flex items-center justify-between border-t border-red-200 pt-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedErrors.length === errors.length}
                onChange={handleSelectAll}
                className="rounded border-red-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-red-700 text-sm">
                {selectedErrors.length > 0
                  ? `${selectedErrors.length} selected`
                  : "Select all"}
              </span>
            </div>

            {selectedErrors.length > 0 && onRetrySelected && (
              <button
                onClick={() => onRetrySelected(selectedErrors)}
                disabled={isRetrying}
                className="px-3 py-1 rounded text-sm font-medium bg-red-100 hover:bg-red-200 text-red-800 transition-colors"
              >
                Retry Selected
              </button>
            )}
          </div>

          {/* Individual error items */}
          <div className="space-y-2">
            {errors.map((error, index) => (
              <div
                key={`${error.url}-${index}`}
                className="flex items-start space-x-2"
              >
                <input
                  type="checkbox"
                  checked={selectedErrors.includes(error.url)}
                  onChange={(e) =>
                    handleSelectError(error.url, e.target.checked)
                  }
                  className="mt-1 rounded border-red-300 text-red-600 focus:ring-red-500"
                />
                <div className="flex-1">
                  <ErrorDisplay
                    error={error}
                    onRetry={onRetrySelected ? undefined : onRetryAll}
                    isRetrying={isRetrying}
                    className="bg-white border-red-300"
                  />
                </div>
              </div>
            ))}
          </div>

          {onDismissAll && (
            <div className="border-t border-red-200 pt-3">
              <button
                onClick={onDismissAll}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Dismiss All Errors
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface NetworkErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error) => void;
}

interface NetworkErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for network-related errors
 */
export class NetworkErrorBoundary extends React.Component<
  NetworkErrorBoundaryProps,
  NetworkErrorBoundaryState
> {
  constructor(props: NetworkErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): NetworkErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Network Error Boundary caught an error:", error, errorInfo);
    this.props.onError?.(error);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent error={this.state.error} retry={this.retry} />
        );
      }

      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-red-800 font-medium text-lg mb-2">
            Something went wrong
          </h3>
          <p className="text-red-700 mb-4">
            {this.state.error.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={this.retry}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface QuickFixSuggestionsProps {
  errors: FeedError[];
  onApplyFix?: (fixType: string, urls: string[]) => void;
  className?: string;
}

/**
 * Component that suggests quick fixes for common error patterns
 */
export const QuickFixSuggestions: React.FC<QuickFixSuggestionsProps> = ({
  errors,
  onApplyFix,
  className = "",
}) => {
  if (errors.length === 0) return null;

  const timeoutErrors = errors.filter((e) => e.errorType === "timeout");
  const networkErrors = errors.filter((e) => e.errorType === "network");
  const corsErrors = errors.filter((e) => e.errorType === "cors");

  const suggestions = [];

  if (timeoutErrors.length > 0) {
    suggestions.push({
      type: "increase-timeout",
      title: "Increase Timeout",
      description: `${timeoutErrors.length} feed${
        timeoutErrors.length !== 1 ? "s" : ""
      } timed out. Try increasing the timeout duration.`,
      urls: timeoutErrors.map((e) => e.url),
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    });
  }

  if (networkErrors.length > 0) {
    suggestions.push({
      type: "check-connection",
      title: "Check Connection",
      description: `${networkErrors.length} feed${
        networkErrors.length !== 1 ? "s" : ""
      } failed due to network issues. Check your internet connection.`,
      urls: networkErrors.map((e) => e.url),
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
          />
        </svg>
      ),
    });
  }

  if (corsErrors.length > 0) {
    suggestions.push({
      type: "use-proxy",
      title: "Use Proxy Service",
      description: `${corsErrors.length} feed${
        corsErrors.length !== 1 ? "s" : ""
      } blocked by CORS policy. Consider using a proxy service.`,
      urls: corsErrors.map((e) => e.url),
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    });
  }

  if (suggestions.length === 0) return null;

  return (
    <div
      className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center space-x-2 mb-3">
        <div className="text-blue-500">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-blue-800 font-medium">Quick Fix Suggestions</h3>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-white border border-blue-200 rounded-md p-3"
          >
            <div className="flex items-center space-x-3">
              <div className="text-blue-500">{suggestion.icon}</div>
              <div>
                <h4 className="text-blue-800 font-medium text-sm">
                  {suggestion.title}
                </h4>
                <p className="text-blue-700 text-xs">
                  {suggestion.description}
                </p>
              </div>
            </div>

            {onApplyFix && (
              <button
                onClick={() => onApplyFix(suggestion.type, suggestion.urls)}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-sm font-medium transition-colors touch-manipulation"
                style={{ minHeight: "36px", minWidth: "80px" }}
              >
                Apply Fix
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Utility function to categorize errors by type
 */
export const categorizeError = (error: string): FeedError["errorType"] => {
  const errorLower = error.toLowerCase();

  if (errorLower.includes("timeout") || errorLower.includes("abort")) {
    return "timeout";
  }

  if (
    errorLower.includes("network") ||
    errorLower.includes("fetch") ||
    errorLower.includes("connection")
  ) {
    return "network";
  }

  if (
    errorLower.includes("parse") ||
    errorLower.includes("xml") ||
    errorLower.includes("json")
  ) {
    return "parse";
  }

  if (errorLower.includes("cors") || errorLower.includes("cross-origin")) {
    return "cors";
  }

  return "unknown";
};

/**
 * Enhanced error processing function
 */
export const processErrors = (
  errors: Array<{
    url: string;
    error: string;
    timestamp: number;
    feedTitle?: string;
  }>
): FeedError[] => {
  return errors.map((error) => ({
    ...error,
    errorType: categorizeError(error.error),
  }));
};
