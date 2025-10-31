import React, { useState } from 'react';
import { usePerformance } from '../hooks/usePerformance';
import { performanceUtils } from '../services/performanceUtils';
import { performanceMonitor } from '../services/performanceMonitor';
import { PerformanceLogger } from '../services/performanceUtils';

interface PerformanceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'cache' | 'network' | 'benchmarks' | 'feeds'>('overview');
  const [benchmarkResults, setBenchmarkResults] = useState<any[]>([]);


  // Use the new performance monitoring system
  const summary = performanceMonitor.getPerformanceSummary();
  const memoryInfo = performanceUtils.getMemoryUsage();
  const allMetrics = performanceMonitor.getAllMetrics();

  // Legacy compatibility
  const {
    metrics,
    snapshots,

    clearMetrics,
    getCacheStats,
    getNetworkBatchStats,
    isEnabled
  } = usePerformance();

  const cacheStats = getCacheStats();
  const networkStats = getNetworkBatchStats();



  // Run performance benchmarks
  const runBenchmarks = async () => {
    const results = [];

    // Render performance test
    const renderStart = performance.now();
    for (let i = 0; i < 1000; i++) {
      // Simulate DOM operations
      const div = document.createElement('div');
      div.innerHTML = `<span>Test ${i}</span>`;
      document.body.appendChild(div);
      document.body.removeChild(div);
    }
    const renderTime = performance.now() - renderStart;
    results.push({ name: 'DOM Operations (1000x)', value: renderTime, unit: 'ms', status: renderTime < 100 ? 'good' : renderTime < 200 ? 'warning' : 'poor' });

    // Memory allocation test
    const memoryStart = performanceUtils.getMemoryUsage()?.used || 0;
    const largeArray = new Array(100000).fill(0).map((_, i) => ({ id: i, data: `item-${i}` }));
    const memoryEnd = performanceUtils.getMemoryUsage()?.used || 0;
    const memoryDiff = memoryEnd - memoryStart;
    results.push({ name: 'Memory Allocation (100k items)', value: memoryDiff, unit: 'MB', status: memoryDiff < 5 ? 'good' : memoryDiff < 10 ? 'warning' : 'poor' });

    // Cleanup
    largeArray.length = 0;

    // Network simulation test
    const networkStart = performance.now();
    try {
      await fetch('data:text/plain,test');
      const networkTime = performance.now() - networkStart;
      results.push({ name: 'Network Request', value: networkTime, unit: 'ms', status: networkTime < 50 ? 'good' : networkTime < 100 ? 'warning' : 'poor' });
    } catch (error) {
      results.push({ name: 'Network Request', value: 0, unit: 'ms', status: 'error' });
    }

    setBenchmarkResults(results);
  };

  const formatValue = (value: number, unit: string = 'ms') => {
    if (value === 0) return '0';
    return `${value.toFixed(2)}${unit}`;
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      case 'error': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  if (!isOpen || !isEnabled) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Performance Dashboard</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 px-6">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'feeds', label: 'Feed Performance' },
            { id: 'metrics', label: 'Metrics' },
            { id: 'cache', label: 'Cache' },
            { id: 'network', label: 'Network' },
            { id: 'benchmarks', label: 'Benchmarks' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Performance Score */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Performance Score</h3>
                <div className="text-3xl font-bold text-green-400">
                  {summary.application.total > 0 ? Math.round(100 - (summary.application.averageLoadTime / 100) * 100) : 'N/A'}
                </div>
                <p className="text-gray-400 text-sm">Based on render performance</p>
              </div>

              {/* Current Metrics */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Current Metrics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">FPS:</span>
                    <span className={metrics.fps < 30 ? 'text-red-400' : metrics.fps < 50 ? 'text-yellow-400' : 'text-green-400'}>
                      {metrics.fps.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Render Time:</span>
                    <span className={metrics.renderTime > 16 ? 'text-red-400' : 'text-green-400'}>
                      {formatValue(metrics.renderTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Memory:</span>
                    <span>{formatValue(metrics.memoryUsage, 'MB')}</span>
                  </div>
                </div>
              </div>

              {/* Cache Performance */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Cache Performance</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Hit Rate:</span>
                    <span className={cacheStats.hitRate > 0.8 ? 'text-green-400' : cacheStats.hitRate > 0.6 ? 'text-yellow-400' : 'text-red-400'}>
                      {(cacheStats.hitRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Size:</span>
                    <span>{cacheStats.size} / {cacheStats.maxSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Evictions:</span>
                    <span className={cacheStats.evictions > 10 ? 'text-yellow-400' : 'text-green-400'}>
                      {cacheStats.evictions}
                    </span>
                  </div>
                </div>
              </div>

              {/* Network Stats */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Network Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Requests:</span>
                    <span>{metrics.networkRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pending:</span>
                    <span className={networkStats.pendingBatches > 0 ? 'text-yellow-400' : 'text-green-400'}>
                      {networkStats.pendingBatches}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Failed:</span>
                    <span className={networkStats.failedBatches > 0 ? 'text-red-400' : 'text-green-400'}>
                      {networkStats.failedBatches}
                    </span>
                  </div>
                </div>
              </div>

              {/* Memory Details */}
              {memoryInfo && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Memory Usage</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400">Used:</span>
                        <span>{memoryInfo.used}MB</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(memoryInfo.used / memoryInfo.limit) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      Limit: {memoryInfo.limit}MB
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Trends */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Performance Trends</h3>
                <div className="space-y-2">
                  {summary && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg App Load:</span>
                        <span>{formatValue(summary.application.averageLoadTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Feeds:</span>
                        <span>{summary.feeds.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Pagination:</span>
                        <span>{summary.pagination.total}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Benchmarks Tab */}
          {activeTab === 'benchmarks' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">Performance Benchmarks</h3>
                <button
                  onClick={runBenchmarks}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Run Benchmarks
                </button>
              </div>

              {benchmarkResults.length > 0 && (
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="text-left p-4 text-white">Test</th>
                        <th className="text-left p-4 text-white">Result</th>
                        <th className="text-left p-4 text-white">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {benchmarkResults.map((result, index) => (
                        <tr key={index} className="border-t border-gray-700">
                          <td className="p-4 text-gray-300">{result.name}</td>
                          <td className="p-4 text-white">{formatValue(result.value, result.unit)}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(result.status)}`}>
                              {result.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {benchmarkResults.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  Click "Run Benchmarks" to test performance
                </div>
              )}
            </div>
          )}

          {/* Feed Performance Tab */}
          {activeTab === 'feeds' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">Feed Performance Analysis</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => PerformanceLogger.logSlowOperations(1000)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Show Slow Feeds
                  </button>
                  <button
                    onClick={() => PerformanceLogger.logFailedOperations()}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Show Failed Feeds
                  </button>
                </div>
              </div>

              {/* Feed Performance Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Total Feeds</h4>
                  <div className="text-2xl font-bold text-white">{summary.feeds.total}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Success Rate</h4>
                  <div className="text-2xl font-bold text-green-400">
                    {summary.feeds.total > 0 ? ((summary.feeds.successful / summary.feeds.total) * 100).toFixed(1) : 0}%
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Avg Load Time</h4>
                  <div className="text-2xl font-bold text-blue-400">
                    {formatValue(summary.feeds.averageLoadTime)}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Cache Hit Rate</h4>
                  <div className="text-2xl font-bold text-purple-400">
                    {summary.feeds.cacheHitRate.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Feed Performance Details */}
              {allMetrics.feeds.length > 0 && (
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="p-4 border-b border-gray-700">
                    <h4 className="text-lg font-semibold text-white">Feed Loading Details</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="text-left p-3 text-white">Feed URL</th>
                          <th className="text-left p-3 text-white">Status</th>
                          <th className="text-left p-3 text-white">Load Time</th>
                          <th className="text-left p-3 text-white">Articles</th>
                          <th className="text-left p-3 text-white">Cache</th>
                          <th className="text-left p-3 text-white">Retries</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allMetrics.feeds.slice(-20).reverse().map((feed, index) => (
                          <tr key={index} className="border-t border-gray-700 hover:bg-gray-750">
                            <td className="p-3 text-gray-300 max-w-xs truncate" title={feed.feedUrl}>
                              {feed.feedUrl}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                feed.status === 'completed' ? 'bg-green-900 text-green-300' :
                                feed.status === 'failed' ? 'bg-red-900 text-red-300' :
                                'bg-yellow-900 text-yellow-300'
                              }`}>
                                {feed.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-3 text-white">
                              <span className={
                                (feed.duration || 0) > 2000 ? 'text-red-400' :
                                (feed.duration || 0) > 1000 ? 'text-yellow-400' :
                                'text-green-400'
                              }>
                                {formatValue(feed.duration || 0)}
                              </span>
                            </td>
                            <td className="p-3 text-gray-300">{feed.articleCount || 0}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded text-xs ${
                                feed.cacheHit ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'
                              }`}>
                                {feed.cacheHit ? 'HIT' : 'MISS'}
                              </span>
                            </td>
                            <td className="p-3 text-gray-300">{feed.retryCount || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Performance Alerts */}
              {(summary.feeds.slowestFeed || summary.feeds.failed > 0) && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-3">Performance Alerts</h4>
                  <div className="space-y-2">
                    {summary.feeds.slowestFeed && summary.feeds.slowestFeed.duration && summary.feeds.slowestFeed.duration > 2000 && (
                      <div className="flex items-center gap-2 p-2 bg-yellow-900/50 rounded border-l-4 border-yellow-400">
                        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <div className="text-yellow-300 font-medium">Slow Feed Detected</div>
                          <div className="text-yellow-200 text-sm">
                            {summary.feeds.slowestFeed.feedUrl} took {formatValue(summary.feeds.slowestFeed.duration)}
                          </div>
                        </div>
                      </div>
                    )}

                    {summary.feeds.failed > 0 && (
                      <div className="flex items-center gap-2 p-2 bg-red-900/50 rounded border-l-4 border-red-400">
                        <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <div className="text-red-300 font-medium">Failed Feed Loads</div>
                          <div className="text-red-200 text-sm">
                            {summary.feeds.failed} feed{summary.feeds.failed !== 1 ? 's' : ''} failed to load
                          </div>
                        </div>
                      </div>
                    )}

                    {summary.feeds.cacheHitRate < 50 && summary.feeds.total > 5 && (
                      <div className="flex items-center gap-2 p-2 bg-orange-900/50 rounded border-l-4 border-orange-400">
                        <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <div className="text-orange-300 font-medium">Low Cache Hit Rate</div>
                          <div className="text-orange-200 text-sm">
                            Cache hit rate is {summary.feeds.cacheHitRate.toFixed(1)}%. Consider increasing cache duration.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {allMetrics.feeds.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  No feed performance data available. Load some feeds to see performance metrics.
                </div>
              )}
            </div>
          )}

          {/* Metrics Tab */}
          {activeTab === 'metrics' && (
            <div className="text-white">
              <h3 className="text-xl font-semibold mb-4">Detailed Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Performance Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Load Time:</span>
                      <span>{formatValue(metrics.loadTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Long Tasks:</span>
                      <span className={metrics.longTasks > 0 ? 'text-yellow-400' : 'text-green-400'}>
                        {metrics.longTasks}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Layout Shifts:</span>
                      <span className={metrics.layoutShifts > 5 ? 'text-red-400' : 'text-green-400'}>
                        {metrics.layoutShifts}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Resource Count</h4>
                  <div className="text-2xl font-bold text-blue-400">
                    {performance.getEntriesByType('resource').length}
                  </div>
                  <p className="text-gray-400 text-sm">Total resources loaded</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            Last updated: {new Date(metrics.lastUpdated).toLocaleTimeString()}
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearMetrics}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Clear Metrics
            </button>
            <button
              onClick={() => {
                const data = {
                  metrics,
                  summary,
                  memoryInfo,
                  cacheStats,
                  networkStats,
                  snapshots: snapshots.slice(-10),
                  timestamp: new Date().toISOString()
                };
                console.log('Performance Report:', data);
                // You could also download this as a JSON file
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `performance-report-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Export Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
