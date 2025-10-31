/**
 * performanceMetrics.ts
 * 
 * Sistema de métricas de performance para monitorar melhorias
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMetrics {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.setupObservers();
  }

  /**
   * Registra uma métrica personalizada
   */
  record(name: string, value: number, metadata?: Record<string, any>) {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      metadata,
    });

    // Mantém apenas as últimas 100 métricas
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Mede tempo de execução de uma função
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.record(name, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.record(`${name}_error`, duration);
      throw error;
    }
  }

  /**
   * Obtém métricas de carregamento de feeds
   */
  getFeedLoadingMetrics() {
    const feedMetrics = this.metrics.filter(m => 
      m.name.includes('feed') || m.name.includes('rss')
    );

    if (feedMetrics.length === 0) return null;

    const durations = feedMetrics.map(m => m.value);
    return {
      count: durations.length,
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      recent: durations.slice(-10),
    };
  }

  /**
   * Obtém métricas de cache
   */
  getCacheMetrics() {
    const cacheMetrics = this.metrics.filter(m => 
      m.name.includes('cache')
    );

    const hits = cacheMetrics.filter(m => m.name.includes('hit')).length;
    const misses = cacheMetrics.filter(m => m.name.includes('miss')).length;
    const total = hits + misses;

    return {
      hitRate: total > 0 ? hits / total : 0,
      totalRequests: total,
      hits,
      misses,
    };
  }

  /**
   * Obtém relatório completo de performance
   */
  getPerformanceReport() {
    return {
      feedLoading: this.getFeedLoadingMetrics(),
      cache: this.getCacheMetrics(),
      webVitals: this.getWebVitals(),
      timestamp: Date.now(),
    };
  }

  /**
   * Obtém Web Vitals
   */
  private getWebVitals() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (!navigation) return null;

    return {
      // First Contentful Paint
      fcp: this.getMetricValue('first-contentful-paint'),
      // Largest Contentful Paint  
      lcp: this.getMetricValue('largest-contentful-paint'),
      // Cumulative Layout Shift
      cls: this.getMetricValue('layout-shift'),
      // Time to Interactive
      tti: navigation.loadEventEnd - navigation.fetchStart,
      // DOM Content Loaded
      dcl: navigation.domContentLoadedEventEnd - navigation.fetchStart,
    };
  }

  /**
   * Obtém valor de métrica específica
   */
  private getMetricValue(name: string): number | null {
    const entries = performance.getEntriesByName(name);
    return entries.length > 0 ? entries[0].startTime : null;
  }

  /**
   * Configura observadores de performance
   */
  private setupObservers() {
    if (typeof PerformanceObserver === 'undefined') return;

    // Observer para Paint Timing
    try {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.record(entry.name, entry.startTime);
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);
    } catch (e) {
      // Silently fail if not supported
    }

    // Observer para Layout Shift
    try {
      const layoutObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.record('layout-shift', (entry as any).value);
        }
      });
      layoutObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(layoutObserver);
    } catch (e) {
      // Silently fail if not supported
    }
  }

  /**
   * Limpa observadores
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

export const performanceMetrics = new PerformanceMetrics();

// Cleanup ao descarregar a página
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    performanceMetrics.cleanup();
  });
}