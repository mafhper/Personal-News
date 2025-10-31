/**
 * Performance utility functions for easy integration with existing components
 * Implements requirements 7.1, 7.2, 7.3, 7.4
 */

import React from 'react';
import { performanceMonitor } from './performanceMonitor';

/**
 * Performance decorator for React components
 * Automatically tracks component render performance
 */
export function withPerformanceTracking<T extends React.ComponentType<any>>(
  Component: T,
  componentName?: string
): T {
  const WrappedComponent = (props: React.ComponentProps<T>) => {
    const name = componentName || Component.displayName || Component.name || 'Unknown Component';

    React.useEffect(() => {
      const id = performanceMonitor.trackApplication('app-load', `Render: ${name}`);

      // Complete tracking after render
      const timeoutId = setTimeout(() => {
        performanceMonitor.completeApplication(id, {
          componentName: name,
          propsCount: Object.keys(props).length
        });
      }, 0);

      return () => clearTimeout(timeoutId);
    }, []);

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withPerformanceTracking(${name})`;
  return WrappedComponent as T;
}

/**
 * Hook for tracking component lifecycle performance
 */
export function usePerformanceTracking(componentName: string, dependencies?: React.DependencyList) {
  const [renderCount, setRenderCount] = React.useState(0);
  const mountTimeRef = React.useRef<string | null>(null);

  // Track component mount
  React.useEffect(() => {
    const id = performanceMonitor.trackApplication('app-load', `Mount: ${componentName}`);
    mountTimeRef.current = id;

    return () => {
      if (mountTimeRef.current) {
        performanceMonitor.completeApplication(mountTimeRef.current, {
          componentName,
          totalRenders: renderCount
        });
      }
    };
  }, []);

  // Track re-renders
  React.useEffect(() => {
    setRenderCount(prev => prev + 1);

    if (renderCount > 0) { // Skip first render (mount)
      const id = performanceMonitor.trackApplication('app-load', `Re-render: ${componentName}`);

      setTimeout(() => {
        performanceMonitor.completeApplication(id, {
          componentName,
          renderNumber: renderCount,
          dependencyChange: true
        });
      }, 0);
    }
  }, dependencies);

  return {
    renderCount,
    trackCustomEvent: (eventName: string, metadata?: Record<string, any>) => {
      const id = performanceMonitor.trackApplication('app-load', `${componentName}: ${eventName}`);

      setTimeout(() => {
        performanceMonitor.completeApplication(id, {
          componentName,
          eventName,
          ...metadata
        });
      }, 0);
    }
  };
}

/**
 * Performance-aware fetch wrapper
 * Automatically tracks network request performance
 */
export async function performanceFetch(
  url: string,
  options?: RequestInit,
  metadata?: Record<string, any>
): Promise<Response> {
  const id = performanceMonitor.trackFeedLoading(url, {
    cacheHit: false,
    retryCount: 0,
    ...metadata
  });

  try {
    const response = await fetch(url, options);

    performanceMonitor.completeFeedLoading(id, 0, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      size: response.headers.get('content-length') || 'unknown'
    });

    return response;
  } catch (error) {
    performanceMonitor.markFailed(
      id,
      error instanceof Error ? error.message : String(error),
      { url, ...metadata }
    );
    throw error;
  }
}

/**
 * Track RSS feed parsing performance
 */
export async function trackFeedParsing<T>(
  feedUrl: string,
  parseFunction: () => Promise<T>,
  options?: {
    cacheHit?: boolean;
    retryCount?: number;
  }
): Promise<T> {
  const id = performanceMonitor.trackFeedLoading(feedUrl, options);

  try {
    const result = await parseFunction();

    // Extract article count if result has articles
    const articleCount = Array.isArray(result) ? result.length :
      (result && typeof result === 'object' && 'articles' in result) ?
        (result as any).articles?.length || 0 : 0;

    performanceMonitor.completeFeedLoading(id, articleCount, {
      resultType: typeof result,
      hasArticles: articleCount > 0
    });

    return result;
  } catch (error) {
    performanceMonitor.markFailed(
      id,
      error instanceof Error ? error.message : String(error),
      { feedUrl, ...options }
    );
    throw error;
  }
}

/**
 * Track pagination navigation performance
 */
export function trackPaginationNavigation(
  fromPage: number,
  toPage: number,
  totalArticles: number,
  navigationFunction: () => void | Promise<void>
): Promise<void> {
  const id = performanceMonitor.trackPagination(fromPage, toPage, totalArticles);

  const executeNavigation = async () => {
    try {
      const renderStart = performance.now();
      await navigationFunction();
      const renderEnd = performance.now();

      performanceMonitor.completePagination(id, renderEnd - renderStart);
    } catch (error) {
      performanceMonitor.markFailed(
        id,
        error instanceof Error ? error.message : String(error),
        { fromPage, toPage, totalArticles }
      );
      throw error;
    }
  };

  return executeNavigation();
}

/**
 * Track search performance
 */
export async function trackSearchPerformance<T>(
  searchTerm: string,
  searchFunction: () => Promise<T>
): Promise<T> {
  const id = performanceMonitor.trackApplication('search', `Search: "${searchTerm}"`);

  try {
    const result = await searchFunction();

    const resultCount = Array.isArray(result) ? result.length :
      (result && typeof result === 'object' && 'length' in result) ?
        (result as any).length : 0;

    performanceMonitor.completeApplication(id, {
      searchTerm,
      resultCount,
      searchTermLength: searchTerm.length
    });

    return result;
  } catch (error) {
    performanceMonitor.markFailed(
      id,
      error instanceof Error ? error.message : String(error),
      { searchTerm }
    );
    throw error;
  }
}

/**
 * Track theme change performance
 */
export function trackThemeChange(
  fromTheme: string,
  toTheme: string,
  changeFunction: () => void | Promise<void>
): Promise<void> {
  const id = performanceMonitor.trackApplication('theme-change', `Theme: ${fromTheme} → ${toTheme}`);

  const executeChange = async () => {
    try {
      await changeFunction();

      performanceMonitor.completeApplication(id, {
        fromTheme,
        toTheme,
        themeChangeType: fromTheme === toTheme ? 'refresh' : 'change'
      });
    } catch (error) {
      performanceMonitor.markFailed(
        id,
        error instanceof Error ? error.message : String(error),
        { fromTheme, toTheme }
      );
      throw error;
    }
  };

  return executeChange();
}

/**
 * Performance logging utilities
 */
export const PerformanceLogger = {
  /**
   * Log slow operations (> threshold ms)
   */
  logSlowOperations: (thresholdMs: number = 1000) => {
    const metrics = performanceMonitor.getAllMetrics();
    const slowOperations = [
      ...metrics.feeds.filter(m => (m.duration || 0) > thresholdMs),
      ...metrics.pagination.filter(m => (m.duration || 0) > thresholdMs),
      ...metrics.application.filter(m => (m.duration || 0) > thresholdMs)
    ];

    if (slowOperations.length > 0) {
      console.group('🐌 Slow Operations (>' + thresholdMs + 'ms)');
      slowOperations.forEach(op => {
        console.warn(`${op.name}: ${op.duration?.toFixed(2)}ms`, op.metadata);
      });
      console.groupEnd();
    }
  },

  /**
   * Log failed operations
   */
  logFailedOperations: () => {
    const metrics = performanceMonitor.getAllMetrics();
    const failedOperations = [
      ...metrics.feeds.filter(m => m.status === 'failed'),
      ...metrics.pagination.filter(m => m.status === 'failed'),
      ...metrics.application.filter(m => m.status === 'failed')
    ];

    if (failedOperations.length > 0) {
      console.group('❌ Failed Operations');
      failedOperations.forEach(op => {
        console.error(`${op.name}: ${op.error}`, op.metadata);
      });
      console.groupEnd();
    }
  },

  /**
   * Log performance trends
   */
  logPerformanceTrends: () => {
    const summary = performanceMonitor.getPerformanceSummary();

    console.group('📈 Performance Trends');

    if (summary.feeds.total > 0) {
      console.log(`Feed loading trend: ${summary.feeds.averageLoadTime.toFixed(2)}ms avg, ${summary.feeds.cacheHitRate.toFixed(1)}% cache hit rate`);
    }

    if (summary.pagination.total > 0) {
      console.log(`Pagination trend: ${summary.pagination.averageNavigationTime.toFixed(2)}ms avg navigation time`);
    }

    if (summary.application.memoryTrend.length > 0) {
      const memoryTrend = summary.application.memoryTrend;
      const memoryChange = memoryTrend[memoryTrend.length - 1] - memoryTrend[0];
      console.log(`Memory trend: ${memoryChange > 0 ? '+' : ''}${memoryChange.toFixed(2)}MB over last ${memoryTrend.length} operations`);
    }

    console.groupEnd();
  },

  /**
   * Export performance data for analysis
   */
  exportPerformanceData: () => {
    const data = {
      timestamp: new Date().toISOString(),
      summary: performanceMonitor.getPerformanceSummary(),
      metrics: performanceMonitor.getAllMetrics(),
      systemInfo: {
        userAgent: navigator.userAgent,
        memory: (performance as any).memory ? {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize,
          limit: (performance as any).memory.jsHeapSizeLimit
        } : null,
        connection: (navigator as any).connection?.effectiveType || 'unknown',
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown'
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📊 Performance data exported');
  }
};

export const perfDebugger = {
  log: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[PerfDebug] ${message}`, data);
    }
  },
  time: (label: string) => {
    if (import.meta.env.DEV) {
      console.time(label);
    }
  },
  timeEnd: (label: string) => {
    if (import.meta.env.DEV) {
      console.timeEnd(label);
    }
  }
};

/**
 * Legacy compatibility exports for existing components
 */
// Legacy compatibility state
let networkRequestCount = 0;
let networkRequestBatches: any[] = [];
let performanceSnapshots: PerformanceSnapshot[] = [];
let isBackgroundedState = false;
let backgroundedStartTime = 0;
let backgroundMonitoringInterval: NodeJS.Timeout | null = null;

export const performanceUtils = {
  getMemoryUsage: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize / 1024 / 1024, // MB
        total: memory.totalJSHeapSize / 1024 / 1024, // MB
        limit: memory.jsHeapSizeLimit / 1024 / 1024 // MB
      };
    }
    return null;
  },

  getPerformanceSummary: () => performanceMonitor.getPerformanceSummary(),

  clearMetrics: () => performanceMonitor.clearMetrics(),

  logSummary: () => performanceMonitor.logPerformanceSummary(),

  exportData: () => PerformanceLogger.exportPerformanceData(),

  // Network request tracking
  trackNetworkRequest: () => {
    networkRequestCount++;
  },

  getNetworkRequestCount: () => networkRequestCount,

  resetNetworkRequestCount: () => {
    networkRequestCount = 0;
  },

  createNetworkRequestBatch: (urls: string[]) => {
    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const batch = {
      id: batchId,
      urls,
      startTime: Date.now(),
      endTime: undefined,
      status: 'pending',
      results: []
    };
    networkRequestBatches.push(batch);
    return batchId;
  },

  completeNetworkRequestBatch: (batchId: string, results: any[], status: string) => {
    const batch = networkRequestBatches.find((b: any) => b.id === batchId);
    if (batch) {
      batch.endTime = Date.now();
      batch.status = status;
      batch.results = results;
    }
  },

  getNetworkRequestBatches: () => networkRequestBatches,

  // Performance snapshots
  getPerformanceSnapshots: () => performanceSnapshots,

  clearPerformanceSnapshots: () => {
    performanceSnapshots.length = 0;
  },

  // Background monitoring
  isBackgrounded: () => isBackgroundedState,

  getBackgroundedTime: () => {
    if (isBackgroundedState && backgroundedStartTime > 0) {
      return Date.now() - backgroundedStartTime;
    }
    return 0;
  },

  startBackgroundMonitoring: () => {
    if (backgroundMonitoringInterval) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isBackgroundedState = true;
        backgroundedStartTime = Date.now();
      } else {
        isBackgroundedState = false;
        backgroundedStartTime = 0;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    backgroundMonitoringInterval = setInterval(() => {
      const summary = performanceMonitor.getPerformanceSummary();
      const memory = performanceUtils.getMemoryUsage();

      const snapshot: PerformanceSnapshot = {
        timestamp: Date.now(),
        memory,
        feeds: summary.feeds,
        pagination: summary.pagination,
        application: summary.application,
        cacheStats: {
          hitRate: summary.feeds.cacheHitRate / 100 // Convert percentage to decimal
        },
        networkRequests: networkRequestCount,
        fps: 60, // Default FPS value
        longTasks: 0, // Default long tasks count
        layoutShifts: 0 // Default layout shifts count
      };

      performanceSnapshots.push(snapshot);

      // Keep only last 50 snapshots
      if (performanceSnapshots.length > 50) {
        performanceSnapshots.shift();
      }
    }, 5000); // Every 5 seconds
  },

  stopBackgroundMonitoring: () => {
    if (backgroundMonitoringInterval) {
      clearInterval(backgroundMonitoringInterval);
      backgroundMonitoringInterval = null;
    }
  }
};

/**
 * Performance snapshot interface for compatibility
 */
export interface PerformanceSnapshot {
  timestamp: number;
  memory: {
    used: number;
    total: number;
    limit: number;
  } | null;
  feeds: {
    total: number;
    successful: number;
    failed: number;
    averageLoadTime: number;
  };
  pagination: {
    total: number;
    averageNavigationTime: number;
  };
  application: {
    total: number;
    averageLoadTime: number;
  };
  cacheStats: {
    hitRate: number;
  };
  networkRequests: number;
  fps: number;
  longTasks: number;
  layoutShifts: number;
}

/**
 * Legacy withPerformanceMonitoring alias
 */
export const withPerformanceMonitoring = withPerformanceTracking;

/**
 * Default export for compatibility
 */
export default performanceUtils;

/**
 * Development-only performance debugging commands
 */
if (import.meta.env.DEV) {
  (window as any).perf = {
    monitor: performanceMonitor,
    logger: PerformanceLogger,
    summary: () => performanceMonitor.logPerformanceSummary(),
    clear: () => performanceMonitor.clearMetrics(),
    export: () => PerformanceLogger.exportPerformanceData(),
    slow: (threshold?: number) => PerformanceLogger.logSlowOperations(threshold),
    failed: () => PerformanceLogger.logFailedOperations(),
    trends: () => PerformanceLogger.logPerformanceTrends()
  };

  console.log('🔧 Performance debugging available via window.perf');
}
