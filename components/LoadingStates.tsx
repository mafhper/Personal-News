/**
 * LoadingStates.tsx
 *
 * Loading state components for various UI elements including pagination,
 * navigation, and content areas. Provides consistent loading experiences
 * across the application.
 *
 * @author Matheus Pereira
 * @version 1.0.0
 */

import React from "react";
import { LoadingSpinner } from "./ProgressIndicator";

interface PaginationLoadingProps {
  compact?: boolean;
  className?: string;
  showProgress?: boolean;
  progress?: number;
}

/**
 * Loading state for pagination controls during navigation
 */
export const PaginationLoading: React.FC<PaginationLoadingProps> = ({
  compact = false,
  className = "",
  showProgress = false,
  progress = 0,
}) => {
  if (compact) {
    return (
      <div className={`flex items-center space-x-2 opacity-75 ${className}`}>
        <div className="p-2 rounded-md bg-gray-700 animate-pulse">
          <div className="h-4 w-4 bg-gray-600 rounded"></div>
        </div>
        <div className="flex items-center space-x-1">
          <div className="h-4 w-5 bg-gray-700 rounded animate-pulse"></div>
          <div className="h-4 w-2 bg-gray-700 rounded animate-pulse"></div>
          <div className="h-4 w-5 bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="p-2 rounded-md bg-gray-700 animate-pulse">
          <div className="h-4 w-4 bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col sm:flex-row items-center gap-4 opacity-75 ${className}`}
    >
      {/* Mobile pagination info loading */}
      <div className="flex items-center space-x-2 sm:hidden">
        <div className="h-4 w-24 bg-gray-700 rounded animate-pulse"></div>
      </div>

      {/* Navigation controls loading */}
      <div className="flex items-center space-x-2">
        <div className="px-4 py-2 rounded-md bg-gray-700 animate-pulse">
          <div className="h-4 w-16 bg-gray-600 rounded"></div>
        </div>

        {/* Page numbers loading - visible on larger screens */}
        <div className="hidden sm:flex items-center space-x-1">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={`page-loading-${index}`}
              className="w-10 h-10 bg-gray-700 rounded-md animate-pulse"
            />
          ))}
        </div>

        <div className="px-4 py-2 rounded-md bg-gray-700 animate-pulse">
          <div className="h-4 w-16 bg-gray-600 rounded"></div>
        </div>
      </div>

      {/* Desktop pagination info loading */}
      <div className="hidden sm:flex items-center space-x-2">
        <div className="h-4 w-24 bg-gray-700 rounded animate-pulse"></div>
      </div>

      {/* Progress indicator when enabled */}
      {showProgress && (
        <div className="w-full sm:w-32 mt-2 sm:mt-0">
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div
              className="bg-[rgb(var(--color-accent))] h-1 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface NavigationLoadingProps {
  direction?: "next" | "prev" | "both";
  className?: string;
}

/**
 * Loading state for navigation buttons during page changes
 */
export const NavigationLoading: React.FC<NavigationLoadingProps> = ({
  direction = "both",
  className = "",
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {(direction === "prev" || direction === "both") && (
        <button
          disabled
          className="px-4 py-2 rounded-md bg-gray-700 text-gray-500 cursor-not-allowed flex items-center space-x-2"
        >
          <LoadingSpinner size="sm" />
          <span className="hidden sm:inline">Loading...</span>
        </button>
      )}

      {(direction === "next" || direction === "both") && (
        <button
          disabled
          className="px-4 py-2 rounded-md bg-gray-700 text-gray-500 cursor-not-allowed flex items-center space-x-2"
        >
          <LoadingSpinner size="sm" />
          <span className="hidden sm:inline">Loading...</span>
        </button>
      )}
    </div>
  );
};

interface ContentLoadingProps {
  type?: "articles" | "search" | "category" | "general";
  message?: string;
  showSpinner?: boolean;
  className?: string;
}

/**
 * Loading state for content areas
 */
export const ContentLoading: React.FC<ContentLoadingProps> = ({
  type = "general",
  message,
  showSpinner = true,
  className = "",
}) => {
  const getDefaultMessage = () => {
    switch (type) {
      case "articles":
        return "Loading articles...";
      case "search":
        return "Searching articles...";
      case "category":
        return "Loading category...";
      default:
        return "Loading...";
    }
  };

  const displayMessage = message || getDefaultMessage();

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 ${className}`}
    >
      {showSpinner && <LoadingSpinner size="lg" className="mb-4" />}
      <p className="text-[rgb(var(--color-textSecondary))] text-lg font-medium">
        {displayMessage}
      </p>
    </div>
  );
};

interface ButtonLoadingProps {
  children: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  loadingText?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * Button with loading state
 */
export const LoadingButton: React.FC<ButtonLoadingProps> = ({
  children,
  isLoading = false,
  disabled = false,
  loadingText = "Loading...",
  className = "",
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`flex items-center justify-center space-x-2 transition-all duration-200 ${
        disabled || isLoading
          ? "opacity-50 cursor-not-allowed"
          : "hover:opacity-80"
      } ${className}`}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      <span>{isLoading ? loadingText : children}</span>
    </button>
  );
};

interface OverlayLoadingProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
  onCancel?: () => void;
  className?: string;
}

/**
 * Full-screen overlay loading state
 */
export const OverlayLoading: React.FC<OverlayLoadingProps> = ({
  isVisible,
  message = "Loading...",
  progress,
  onCancel,
  className = "",
}) => {
  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-title"
    >
      <div className="bg-[rgb(var(--color-surface))] rounded-lg p-6 max-w-sm w-full mx-4 text-center">
        <LoadingSpinner size="xl" className="mx-auto mb-4" />
        <h2
          id="loading-title"
          className="text-[rgb(var(--color-text))] text-lg font-medium mb-2"
        >
          {message}
        </h2>

        {progress !== undefined && (
          <div className="mb-4">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-[rgb(var(--color-accent))] h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
            <p className="text-[rgb(var(--color-textSecondary))] text-sm mt-2">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}

        {onCancel && (
          <button
            onClick={onCancel}
            className="text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))] text-sm underline"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

interface InlineLoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

/**
 * Inline loading indicator for small spaces
 */
export const InlineLoading: React.FC<InlineLoadingProps> = ({
  size = "sm",
  text,
  className = "",
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <LoadingSpinner size={size} />
      {text && (
        <span className="text-[rgb(var(--color-textSecondary))] text-sm">
          {text}
        </span>
      )}
    </div>
  );
};

interface PlaceholderLoadingProps {
  width?: string;
  height?: string;
  className?: string;
  rounded?: boolean;
}

/**
 * Simple placeholder loading rectangle
 */
export const PlaceholderLoading: React.FC<PlaceholderLoadingProps> = ({
  width = "100%",
  height = "20px",
  className = "",
  rounded = true,
}) => {
  return (
    <div
      className={`bg-gray-700 animate-pulse ${
        rounded ? "rounded" : ""
      } ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
};

interface ProgressiveArticleLoadingProps {
  loadedCount: number;
  totalCount: number;
  isBackgroundRefresh?: boolean;
  className?: string;
}

/**
 * Loading indicator for progressive article loading
 */
export const ProgressiveArticleLoading: React.FC<
  ProgressiveArticleLoadingProps
> = ({
  loadedCount,
  totalCount,
  isBackgroundRefresh = false,
  className = "",
}) => {
  const progress = totalCount > 0 ? (loadedCount / totalCount) * 100 : 0;

  return (
    <div
      className={`flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 p-3 sm:p-4 rounded-lg ${
        isBackgroundRefresh
          ? "bg-blue-50 border border-blue-200"
          : "bg-gray-800 border border-gray-700"
      } ${className}`}
    >
      <div
        className={`animate-spin rounded-full border-t-2 border-b-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${
          isBackgroundRefresh
            ? "border-blue-500"
            : "border-[rgb(var(--color-accent))]"
        }`}
      />
      <div className="flex-1 w-full sm:w-auto">
        <p
          className={`text-sm sm:text-base font-medium ${
            isBackgroundRefresh
              ? "text-blue-800"
              : "text-[rgb(var(--color-text))]"
          }`}
        >
          {isBackgroundRefresh
            ? "Refreshing articles..."
            : "Loading articles..."}
        </p>
        <div className="flex items-center space-x-2 mt-2 sm:mt-1">
          <div className="flex-1 bg-gray-700 rounded-full h-1.5 sm:h-1">
            <div
              className={`h-1.5 sm:h-1 rounded-full transition-all duration-300 ${
                isBackgroundRefresh
                  ? "bg-blue-500"
                  : "bg-[rgb(var(--color-accent))]"
              }`}
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
          <span
            className={`text-xs sm:text-sm font-medium ${
              isBackgroundRefresh
                ? "text-blue-600"
                : "text-[rgb(var(--color-textSecondary))]"
            }`}
          >
            {loadedCount}/{totalCount}
          </span>
        </div>
      </div>
    </div>
  );
};

interface SmartLoadingProps {
  type: "initial" | "refresh" | "pagination" | "search";
  message?: string;
  progress?: number;
  showCancel?: boolean;
  onCancel?: () => void;
  className?: string;
}

/**
 * Smart loading component that adapts based on loading type
 */
export const SmartLoading: React.FC<SmartLoadingProps> = ({
  type,
  message,
  progress,
  showCancel = false,
  onCancel,
  className = "",
}) => {
  const getDefaultMessage = () => {
    switch (type) {
      case "initial":
        return "Loading your news...";
      case "refresh":
        return "Refreshing articles...";
      case "pagination":
        return "Loading more articles...";
      case "search":
        return "Searching articles...";
      default:
        return "Loading...";
    }
  };

  const displayMessage = message || getDefaultMessage();
  const isMinimal = type === "pagination" || type === "search";

  if (isMinimal) {
    return (
      <div
        className={`flex items-center justify-center space-x-2 py-4 ${className}`}
      >
        <LoadingSpinner size="sm" />
        <span className="text-[rgb(var(--color-textSecondary))] text-sm">
          {displayMessage}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center py-6 sm:py-8 px-4 ${className}`}
    >
      <LoadingSpinner size="lg" className="mb-4" />
      <h3 className="text-[rgb(var(--color-text))] text-base sm:text-lg font-medium mb-2 text-center">
        {displayMessage}
      </h3>

      {progress !== undefined && (
        <div className="w-full max-w-xs mb-4">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-[rgb(var(--color-accent))] h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
          <p className="text-[rgb(var(--color-textSecondary))] text-sm text-center mt-2">
            {Math.round(progress)}% complete
          </p>
        </div>
      )}

      {showCancel && onCancel && (
        <button
          onClick={onCancel}
          className="text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))] text-sm underline mt-2 touch-manipulation"
          style={{ minHeight: "32px", minWidth: "60px" }}
        >
          Cancel
        </button>
      )}
    </div>
  );
};

interface MobileOptimizedLoadingProps {
  type: "pull-refresh" | "infinite-scroll" | "page-transition";
  message?: string;
  progress?: number;
  className?: string;
}

/**
 * Mobile-optimized loading component with touch-friendly design
 */
export const MobileOptimizedLoading: React.FC<MobileOptimizedLoadingProps> = ({
  type,
  message,
  progress,
  className = "",
}) => {
  const getConfig = () => {
    switch (type) {
      case "pull-refresh":
        return {
          message: message || "Pull to refresh...",
          size: "md" as const,
          showProgress: false,
          compact: true,
        };
      case "infinite-scroll":
        return {
          message: message || "Loading more...",
          size: "sm" as const,
          showProgress: false,
          compact: true,
        };
      case "page-transition":
        return {
          message: message || "Loading page...",
          size: "md" as const,
          showProgress: progress !== undefined,
          compact: false,
        };
      default:
        return {
          message: message || "Loading...",
          size: "md" as const,
          showProgress: false,
          compact: false,
        };
    }
  };

  const config = getConfig();

  if (config.compact) {
    return (
      <div
        className={`flex items-center justify-center space-x-2 py-3 ${className}`}
      >
        <LoadingSpinner size={config.size} />
        <span className="text-[rgb(var(--color-textSecondary))] text-sm font-medium">
          {config.message}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center py-4 px-4 ${className}`}
    >
      <LoadingSpinner size={config.size} className="mb-3" />
      <p className="text-[rgb(var(--color-textSecondary))] text-sm font-medium text-center">
        {config.message}
      </p>

      {config.showProgress && progress !== undefined && (
        <div className="w-full max-w-xs mt-3">
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-[rgb(var(--color-accent))] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface TouchFriendlyLoadingButtonProps {
  children: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  loadingText?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  onClick?: () => void;
}

/**
 * Touch-friendly loading button optimized for mobile devices
 */
export const TouchFriendlyLoadingButton: React.FC<
  TouchFriendlyLoadingButtonProps
> = ({
  children,
  isLoading = false,
  disabled = false,
  loadingText = "Loading...",
  size = "md",
  variant = "primary",
  className = "",
  onClick,
}) => {
  const sizeClasses = {
    sm: "px-3 py-2 text-sm min-h-[36px]",
    md: "px-4 py-3 text-base min-h-[44px]",
    lg: "px-6 py-4 text-lg min-h-[52px]",
  };

  const variantClasses = {
    primary:
      "bg-[rgb(var(--color-accent))] text-white hover:opacity-90 active:opacity-80",
    secondary: "bg-gray-700 text-white hover:bg-gray-600 active:bg-gray-800",
    ghost:
      "bg-transparent text-[rgb(var(--color-text))] hover:bg-gray-800 active:bg-gray-700",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        flex items-center justify-center space-x-2 rounded-lg font-medium
        transition-all duration-200 touch-manipulation select-none
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${
          disabled || isLoading
            ? "opacity-50 cursor-not-allowed"
            : "active:scale-95"
        }
        ${className}
      `}
      style={{ minWidth: "60px" }}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      <span>{isLoading ? loadingText : children}</span>
    </button>
  );
};
