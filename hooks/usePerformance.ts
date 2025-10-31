import { useState, useEffect, useRef, useCallback } from 'react';
import performanceUtils, { PerformanceSnapshot } from '../services/performanceUtils';
import { articleCache } from '../services/articleCache';

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  networkRequests: number;
  fps: number;
  longTasks: number;
  layoutShifts: number;
  isBackgrounded: boolean;
  backgroundedTime: number;
  lastUpdated: number;
}

export interface PerformanceConfig {
  enabled: boolean;
  sampleRate: number;
  maxMetrics: number;
  backgroundCleanup: boolean;
  monitoringInterval: number;
}

export interface NetworkBatchStats {
  totalBatches: number;
  pendingBatches: number;
  completedBatches: number;
  failedBatches: number;
  averageBatchTime: number;
}

const defaultConfig: PerformanceConfig = {
  enabled: import.meta.env.DEV,
  sampleRate: 1.0,
  maxMetrics: 100,
  backgroundCleanup: true,
  monitoringInterval: 10000 // 10 seconds
};

export const usePerformance = (config: Partial<PerformanceConfig> = {}) => {
  const finalConfig = { ...defaultConfig, ...config };
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    networkRequests: 0,
    fps: 0,
    longTasks: 0,
    layoutShifts: 0,
    isBackgrounded: false,
    backgroundedTime: 0,
    lastUpdated: Date.now()
  });

  const [snapshots, setSnapshots] = useState<PerformanceSnapshot[]>([]);
  const metricsHistory = useRef<PerformanceMetrics[]>([]);
  const renderStartTime = useRef<number>(0);
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start render timing
  const startRenderTiming = useCallback(() => {
    if (!finalConfig.enabled) return;
    renderStartTime.current = performance.now();
  }, [finalConfig.enabled]);

  // End render timing
  const endRenderTiming = useCallback(() => {
    if (!finalConfig.enabled || renderStartTime.current === 0) return;

    const renderTime = performance.now() - renderStartTime.current;
    setMetrics(prev => ({
      ...prev,
      renderTime,
      lastUpdated: Date.now()
    }));
    renderStartTime.current = 0;
  }, [finalConfig.enabled]);

  // Track network requests
  const trackNetworkRequest = useCallback(() => {
    if (!finalConfig.enabled) return;
    performanceUtils.trackNetworkRequest();

    setMetrics(prev => ({
      ...prev,
      networkRequests: performanceUtils.getNetworkRequestCount(),
      lastUpdated: Date.now()
    }));
  }, [finalConfig.enabled]);

  // Track cache hits/misses
  const trackCacheHit = useCallback(() => {
    if (!finalConfig.enabled) return;
    // This is now handled by the articleCache directly
  }, [finalConfig.enabled]);

  const trackCacheMiss = useCallback(() => {
    if (!finalConfig.enabled) return;
    // This is now handled by the articleCache directly
  }, [finalConfig.enabled]);

  // Create a network request batch
  const createNetworkBatch = useCallback((urls: string[]) => {
    if (!finalConfig.enabled) return null;
    return performanceUtils.createNetworkRequestBatch(urls);
  }, [finalConfig.enabled]);

  // Complete a network request batch
  const completeNetworkBatch = useCallback((batchId: string, results: any[], status: 'complete' | 'error' = 'complete') => {
    if (!finalConfig.enabled) return;
    performanceUtils.completeNetworkRequestBatch(batchId, results, status);
  }, [finalConfig.enabled]);

  // Get network batch statistics
  const getNetworkBatchStats = useCallback((): NetworkBatchStats => {
    const batches = performanceUtils.getNetworkRequestBatches();

    const pendingBatches = batches.filter(b => b.status === 'pending');
    const completedBatches = batches.filter(b => b.status === 'complete');
    const failedBatches = batches.filter(b => b.status === 'error');

    // Calculate average batch time for completed batches
    const completedTimes = completedBatches
      .filter(b => b.endTime !== undefined)
      .map(b => (b.endTime as number) - b.startTime);

    const averageBatchTime = completedTimes.length > 0
      ? completedTimes.reduce((sum, time) => sum + time, 0) / completedTimes.length
      : 0;

    return {
      totalBatches: batches.length,
      pendingBatches: pendingBatches.length,
      completedBatches: completedBatches.length,
      failedBatches: failedBatches.length,
      averageBatchTime
    };
  }, []);

  // Update metrics from performance snapshots
  const updateMetricsFromSnapshots = useCallback(() => {
    if (!finalConfig.enabled) return;

    const latestSnapshots = performanceUtils.getPerformanceSnapshots();
    if (latestSnapshots.length === 0) return;

    setSnapshots(latestSnapshots);

    // Get the most recent snapshot
    const latest = latestSnapshots[latestSnapshots.length - 1];

    setMetrics(prev => ({
      ...prev,
      memoryUsage: latest.memory?.used || 0,
      cacheHitRate: latest.cacheStats.hitRate * 100, // Convert to percentage
      networkRequests: latest.networkRequests,
      fps: latest.fps,
      longTasks: latest.longTasks,
      layoutShifts: latest.layoutShifts,
      isBackgrounded: performanceUtils.isBackgrounded(),
      backgroundedTime: performanceUtils.getBackgroundedTime(),
      lastUpdated: Date.now()
    }));
  }, [finalConfig.enabled]);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    return articleCache.getStats();
  }, []);

  // Perform manual cache cleanup
  const cleanupCache = useCallback(() => {
    articleCache.cleanup();
  }, []);

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    if (!finalConfig.enabled || metricsHistory.current.length === 0) {
      return null;
    }

    const history = metricsHistory.current;
    const avgRenderTime = history.reduce((sum, m) => sum + m.renderTime, 0) / history.length;
    const maxMemoryUsage = Math.max(...history.map(m => m.memoryUsage));
    const avgCacheHitRate = history.reduce((sum, m) => sum + m.cacheHitRate, 0) / history.length;
    const avgFps = history.reduce((sum, m) => sum + m.fps, 0) / history.length;

    return {
      averageRenderTime: avgRenderTime,
      maxMemoryUsage,
      averageCacheHitRate: avgCacheHitRate,
      totalNetworkRequests: performanceUtils.getNetworkRequestCount(),
      averageFps: avgFps,
      totalLongTasks: history.reduce((sum, m) => sum + m.longTasks, 0),
      totalLayoutShifts: history.reduce((sum, m) => sum + m.layoutShifts, 0),
      metricsCount: history.length
    };
  }, [finalConfig.enabled]);

  // Clear metrics
  const clearMetrics = useCallback(() => {
    if (!finalConfig.enabled) return;

    performanceUtils.resetNetworkRequestCount();
    performanceUtils.clearPerformanceSnapshots();
    articleCache.resetStats();
    metricsHistory.current = [];

    setMetrics({
      loadTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
      networkRequests: 0,
      fps: 0,
      longTasks: 0,
      layoutShifts: 0,
      isBackgrounded: performanceUtils.isBackgrounded(),
      backgroundedTime: performanceUtils.getBackgroundedTime(),
      lastUpdated: Date.now()
    });

    setSnapshots([]);
  }, [finalConfig.enabled]);

  // Start background monitoring
  const startBackgroundMonitoring = useCallback(() => {
    if (!finalConfig.enabled) return;
    performanceUtils.startBackgroundMonitoring();
  }, [finalConfig.enabled]);

  // Stop background monitoring
  const stopBackgroundMonitoring = useCallback(() => {
    if (!finalConfig.enabled) return;
    performanceUtils.stopBackgroundMonitoring();

    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
  }, [finalConfig.enabled]);

  // Measure page load time
  useEffect(() => {
    if (!finalConfig.enabled) return;

    const measureLoadTime = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        setMetrics(prev => ({
          ...prev,
          loadTime,
          lastUpdated: Date.now()
        }));
      }
    };

    if (document.readyState === 'complete') {
      measureLoadTime();
    } else {
      window.addEventListener('load', measureLoadTime);
      return () => window.removeEventListener('load', measureLoadTime);
    }
  }, [finalConfig.enabled]);

  // Setup periodic metrics updates
  useEffect(() => {
    if (!finalConfig.enabled) return;

    // Start background monitoring if not already started
    startBackgroundMonitoring();

    // Update metrics periodically
    const interval = setInterval(() => {
      updateMetricsFromSnapshots();
    }, finalConfig.monitoringInterval);

    monitoringIntervalRef.current = interval;

    return () => {
      clearInterval(interval);
      monitoringIntervalRef.current = null;
    };
  }, [finalConfig.enabled, finalConfig.monitoringInterval, startBackgroundMonitoring, updateMetricsFromSnapshots]);

  // Store metrics history
  useEffect(() => {
    if (!finalConfig.enabled) return;

    metricsHistory.current.push(metrics);

    // Keep only the last maxMetrics entries
    if (metricsHistory.current.length > finalConfig.maxMetrics) {
      metricsHistory.current = metricsHistory.current.slice(-finalConfig.maxMetrics);
    }
  }, [metrics, finalConfig.enabled, finalConfig.maxMetrics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
    };
  }, []);

  return {
    metrics,
    snapshots,
    metricsHistory: metricsHistory.current,
    startRenderTiming,
    endRenderTiming,
    trackNetworkRequest,
    trackCacheHit,
    trackCacheMiss,
    createNetworkBatch,
    completeNetworkBatch,
    getNetworkBatchStats,
    getCacheStats,
    cleanupCache,
    getPerformanceSummary,
    clearMetrics,
    startBackgroundMonitoring,
    stopBackgroundMonitoring,
    isEnabled: finalConfig.enabled,
    isBackgrounded: performanceUtils.isBackgrounded()
  };
};
