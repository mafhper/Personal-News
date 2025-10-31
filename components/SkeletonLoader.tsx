/**
 * SkeletonLoader.tsx
 *
 * Skeleton loading components for articles and other content.
 * Provides visual placeholders while content is loading to improve
 * perceived performance and user experience.
 *
 * @author Matheus Pereira
 * @version 1.0.0
 */

import React from "react";

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
}

/**
 * Base skeleton component for creating loading placeholders
 */
const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  width = "100%",
  height = "1rem",
  rounded = false,
}) => {
  return (
    <div
      className={`animate-pulse bg-gray-700 ${
        rounded ? "rounded-lg" : "rounded"
      } ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
};

/**
 * Skeleton loader for individual article items
 */
export const ArticleSkeleton: React.FC = () => {
  return (
    <article className="h-full flex flex-col" aria-hidden="true">
      <div className="flex flex-col h-full">
        {/* Article image skeleton */}
        <div className="relative mb-4">
          <Skeleton className="w-full h-32 lg:h-40" rounded={true} />

          {/* Article number overlay skeleton */}
          <div className="absolute top-2 left-2">
            <Skeleton className="rounded-full" width="32px" height="32px" />
          </div>

          {/* Favorite button overlay skeleton */}
          <div className="absolute top-2 right-2">
            <Skeleton className="rounded-full" width="32px" height="32px" />
          </div>
        </div>

        {/* Article content skeleton */}
        <div className="flex-1 flex flex-col">
          {/* Source badge skeleton */}
          <div className="mb-2">
            <Skeleton width="80px" height="20px" rounded={true} />
          </div>

          {/* Title skeleton - multiple lines */}
          <div className="mb-3 space-y-2">
            <Skeleton height="20px" />
            <Skeleton height="20px" width="85%" />
            <Skeleton height="20px" width="60%" />
          </div>

          {/* Metadata skeleton */}
          <div className="mt-auto space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton width="100px" height="14px" />
            </div>
            <Skeleton width="80px" height="14px" />
          </div>
        </div>
      </div>
    </article>
  );
};

/**
 * Skeleton loader for article list
 */
export const ArticleListSkeleton: React.FC<{ count?: number }> = ({
  count = 12,
}) => {
  return (
    <section aria-labelledby="loading-articles" aria-live="polite">
      <div className="mb-4">
        <Skeleton width="150px" height="24px" />
      </div>
      <div className="space-y-5">
        {Array.from({ length: count }, (_, index) => (
          <div key={`skeleton-${index}`}>
            <ArticleSkeleton />
          </div>
        ))}
      </div>
    </section>
  );
};

/**
 * Skeleton loader for pagination controls
 */
export const PaginationSkeleton: React.FC<{ compact?: boolean }> = ({
  compact = false,
}) => {
  if (compact) {
    return (
      <div className="flex items-center space-x-2" aria-hidden="true">
        <Skeleton width="40px" height="40px" rounded={true} />
        <div className="flex items-center space-x-1">
          <Skeleton width="20px" height="16px" />
          <Skeleton width="8px" height="16px" />
          <Skeleton width="20px" height="16px" />
        </div>
        <Skeleton width="40px" height="40px" rounded={true} />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col sm:flex-row items-center gap-4"
      aria-hidden="true"
    >
      {/* Mobile pagination info skeleton */}
      <div className="flex items-center space-x-2 sm:hidden">
        <Skeleton width="120px" height="16px" />
      </div>

      {/* Navigation controls skeleton */}
      <div className="flex items-center space-x-2">
        <Skeleton width="80px" height="40px" rounded={true} />

        {/* Page numbers skeleton - visible on larger screens */}
        <div className="hidden sm:flex items-center space-x-1">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton
              key={`page-skeleton-${index}`}
              width="40px"
              height="40px"
              rounded={true}
            />
          ))}
        </div>

        <Skeleton width="80px" height="40px" rounded={true} />
      </div>

      {/* Desktop pagination info skeleton */}
      <div className="hidden sm:flex items-center space-x-2">
        <Skeleton width="120px" height="16px" />
      </div>
    </div>
  );
};

/**
 * Skeleton loader for header components
 */
export const HeaderSkeleton: React.FC = () => {
  return (
    <header className="bg-gray-800 shadow-lg" aria-hidden="true">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title skeleton */}
          <Skeleton width="200px" height="24px" />

          {/* Navigation skeleton */}
          <div className="flex items-center space-x-4">
            <Skeleton width="120px" height="32px" rounded={true} />
            <Skeleton width="40px" height="40px" rounded={true} />
            <Skeleton width="40px" height="40px" rounded={true} />
          </div>
        </div>
      </div>
    </header>
  );
};

/**
 * Generic content skeleton for various layouts
 */
export const ContentSkeleton: React.FC<{
  lines?: number;
  showImage?: boolean;
  showHeader?: boolean;
}> = ({ lines = 3, showImage = false, showHeader = false }) => {
  return (
    <div className="space-y-4" aria-hidden="true">
      {showHeader && <Skeleton width="60%" height="32px" />}
      {showImage && <Skeleton width="100%" height="200px" rounded={true} />}
      <div className="space-y-2">
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton
            key={`content-line-${index}`}
            width={index === lines - 1 ? "75%" : "100%"}
            height="16px"
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Progressive loading skeleton that shows articles loading in gradually
 */
export const ProgressiveArticlesSkeleton: React.FC<{
  loadedCount: number;
  totalCount: number;
  articlesPerPage?: number;
}> = ({ loadedCount, totalCount, articlesPerPage = 12 }) => {
  const skeletonCount = Math.min(articlesPerPage, totalCount);
  const loadedSkeletons = Math.min(loadedCount, skeletonCount);

  return (
    <section aria-labelledby="progressive-loading" aria-live="polite">
      <div className="space-y-5">
        {Array.from({ length: skeletonCount }, (_, index) => {
          const isLoaded = index < loadedSkeletons;
          const isLoading = index === loadedSkeletons;

          return (
            <div
              key={`progressive-skeleton-${index}`}
              className={`transition-all duration-500 ${
                isLoaded
                  ? "opacity-100 transform translate-y-0"
                  : isLoading
                  ? "opacity-75 transform translate-y-1 animate-pulse"
                  : "opacity-30 transform translate-y-2"
              }`}
            >
              <ArticleSkeleton />
            </div>
          );
        })}
      </div>

      {/* Progress indicator */}
      <div className="mt-6 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-sm text-[rgb(var(--color-textSecondary))]">
          <div className="w-32 bg-gray-700 rounded-full h-1">
            <div
              className="bg-[rgb(var(--color-accent))] h-1 rounded-full transition-all duration-300"
              style={{
                width: `${
                  totalCount > 0 ? (loadedCount / totalCount) * 100 : 0
                }%`,
              }}
            />
          </div>
          <span>
            {loadedCount}/{totalCount}
          </span>
        </div>
      </div>
    </section>
  );
};

/**
 * Enhanced pagination skeleton with loading states
 */
export const EnhancedPaginationSkeleton: React.FC<{
  compact?: boolean;
  showProgress?: boolean;
  progress?: number;
}> = ({ compact = false, showProgress = false, progress = 0 }) => {
  if (compact) {
    return (
      <div className="flex items-center space-x-2" aria-hidden="true">
        <Skeleton width="40px" height="40px" rounded={true} />
        <div className="flex items-center space-x-1">
          <Skeleton width="20px" height="16px" />
          <Skeleton width="8px" height="16px" />
          <Skeleton width="20px" height="16px" />
        </div>
        <Skeleton width="40px" height="40px" rounded={true} />
        {showProgress && (
          <div className="w-16 ml-2">
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
  }

  return (
    <div
      className="flex flex-col sm:flex-row items-center gap-4"
      aria-hidden="true"
    >
      {/* Mobile pagination info skeleton */}
      <div className="flex items-center space-x-2 sm:hidden">
        <Skeleton width="120px" height="16px" />
      </div>

      {/* Navigation controls skeleton */}
      <div className="flex items-center space-x-2">
        <Skeleton width="80px" height="40px" rounded={true} />

        {/* Page numbers skeleton - visible on larger screens */}
        <div className="hidden sm:flex items-center space-x-1">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton
              key={`enhanced-page-skeleton-${index}`}
              width="40px"
              height="40px"
              rounded={true}
            />
          ))}
        </div>

        <Skeleton width="80px" height="40px" rounded={true} />
      </div>

      {/* Desktop pagination info skeleton */}
      <div className="hidden sm:flex items-center space-x-2">
        <Skeleton width="120px" height="16px" />
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
