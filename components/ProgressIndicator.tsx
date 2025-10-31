/**
 * ProgressIndicator.tsx
 *
 * Progress indicator components for feed loading and other async operations.
 * Provides visual feedback about loading progress and status.
 *
 * @author Matheus Pereira
 * @version 1.0.0
 */

import React from "react";

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showPercentage?: boolean;
  color?: "primary" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

/**
 * Basic progress bar component
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = "",
  showPercentage = false,
  color = "primary",
  size = "md",
  animated = true,
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  const colorClasses = {
    primary: "bg-[rgb(var(--color-accent))]",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  };

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`bg-gray-700 rounded-full ${sizeClasses[size]} overflow-hidden`}
      >
        <div
          className={`${colorClasses[color]} ${
            sizeClasses[size]
          } rounded-full transition-all duration-300 ${
            animated ? "ease-out" : ""
          }`}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Loading progress: ${Math.round(clampedProgress)}%`}
        />
      </div>
      {showPercentage && (
        <div className="text-right text-sm text-gray-400 mt-1">
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  );
};

interface FeedLoadingProgressProps {
  loadedFeeds: number;
  totalFeeds: number;
  progress: number;
  isBackgroundRefresh?: boolean;
  errors?: Array<{ url: string; error: string; feedTitle?: string }>;
  onCancel?: () => void;
  onRetryErrors?: () => void;
  className?: string;
}

/**
 * Specialized progress indicator for feed loading
 */
export const FeedLoadingProgress: React.FC<FeedLoadingProgressProps> = ({
  loadedFeeds,
  totalFeeds,
  progress,
  isBackgroundRefresh = false,
  errors = [],
  onCancel,
  onRetryErrors,
  className = "",
}) => {
  const hasErrors = errors.length > 0;
  const isComplete = loadedFeeds >= totalFeeds;

  return (
    <div className={`${className}`}>
      <div
        className={`rounded-lg p-4 ${
          isBackgroundRefresh
            ? "bg-blue-50 border border-blue-200"
            : hasErrors
            ? "bg-yellow-50 border border-yellow-200"
            : "bg-gray-800 border border-gray-700"
        }`}
      >
        <div className="flex items-center space-x-3">
          {/* Loading spinner */}
          {!isComplete && (
            <div
              className={`animate-spin rounded-full border-t-2 border-b-2 ${
                isBackgroundRefresh
                  ? "h-5 w-5 border-blue-500"
                  : hasErrors
                  ? "h-5 w-5 border-yellow-500"
                  : "h-5 w-5 border-[rgb(var(--color-accent))]"
              }`}
            />
          )}

          {/* Success icon when complete */}
          {isComplete && !hasErrors && (
            <div className="text-green-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}

          {/* Warning icon when there are errors */}
          {hasErrors && (
            <div className="text-yellow-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
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
          )}

          <div className="flex-1">
            {/* Status message */}
            <p
              className={`font-medium ${
                isBackgroundRefresh
                  ? "text-blue-800"
                  : hasErrors
                  ? "text-yellow-800"
                  : "text-[rgb(var(--color-text))]"
              }`}
            >
              {isBackgroundRefresh
                ? "Refreshing feeds in background..."
                : isComplete
                ? hasErrors
                  ? `Loading complete with ${errors.length} error${
                      errors.length !== 1 ? "s" : ""
                    }`
                  : "All feeds loaded successfully"
                : "Loading feeds..."}
            </p>

            {/* Progress bar */}
            <ProgressBar
              progress={progress}
              className="mt-2"
              color={hasErrors ? "warning" : "primary"}
              size="md"
            />

            {/* Feed count */}
            <p
              className={`text-sm mt-1 ${
                isBackgroundRefresh
                  ? "text-blue-600"
                  : hasErrors
                  ? "text-yellow-600"
                  : "text-[rgb(var(--color-textSecondary))]"
              }`}
            >
              {loadedFeeds} of {totalFeeds} feeds loaded
              {hasErrors && ` (${errors.length} failed)`}
            </p>

            {/* Error details */}
            {hasErrors && (
              <div className="mt-3 space-y-1">
                <p className="text-yellow-700 text-sm font-medium">
                  Failed feeds:
                </p>
                {errors.slice(0, 3).map((error, index) => (
                  <div key={index} className="text-yellow-600 text-xs">
                    • {error.feedTitle || new URL(error.url).hostname}
                  </div>
                ))}
                {errors.length > 3 && (
                  <div className="text-yellow-600 text-xs">
                    • ...and {errors.length - 3} more
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex space-x-3 mt-3">
              {hasErrors && onRetryErrors && (
                <button
                  onClick={onRetryErrors}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  Retry failed feeds
                </button>
              )}
              {!isComplete && onCancel && (
                <button
                  onClick={onCancel}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    isBackgroundRefresh
                      ? "bg-blue-100 hover:bg-blue-200 text-blue-800"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  }`}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CircularProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  className?: string;
}

/**
 * Circular progress indicator
 */
export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 40,
  strokeWidth = 4,
  color = "rgb(var(--color-accent))",
  backgroundColor = "rgb(156, 163, 175)", // gray-400
  showPercentage = false,
  className = "",
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset =
    circumference - (clampedProgress / 100) * circumference;

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Loading progress: ${Math.round(clampedProgress)}%`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-[rgb(var(--color-text))]">
            {Math.round(clampedProgress)}%
          </span>
        </div>
      )}
    </div>
  );
};

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: string;
  className?: string;
}

/**
 * Simple loading spinner
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "rgb(var(--color-accent))",
  className = "",
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  return (
    <div
      className={`animate-spin rounded-full border-t-2 border-b-2 ${sizeClasses[size]} ${className}`}
      style={{ borderColor: color }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
