/**
 * Proxy Cache System
 * 
 * Caches working proxies to improve performance
 */

interface ProxyStatus {
  url: string;
  working: boolean;
  lastTested: number;
  successCount: number;
  failureCount: number;
}

class ProxyCache {
  private cache = new Map<string, ProxyStatus>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  markSuccess(proxyUrl: string): void {
    const status = this.cache.get(proxyUrl) || {
      url: proxyUrl,
      working: true,
      lastTested: Date.now(),
      successCount: 0,
      failureCount: 0,
    };

    status.working = true;
    status.lastTested = Date.now();
    status.successCount++;
    
    this.cache.set(proxyUrl, status);
  }

  markFailure(proxyUrl: string): void {
    const status = this.cache.get(proxyUrl) || {
      url: proxyUrl,
      working: false,
      lastTested: Date.now(),
      successCount: 0,
      failureCount: 0,
    };

    status.working = false;
    status.lastTested = Date.now();
    status.failureCount++;
    
    this.cache.set(proxyUrl, status);
  }

  isWorking(proxyUrl: string): boolean | null {
    const status = this.cache.get(proxyUrl);
    if (!status) return null;

    // Cache expired
    if (Date.now() - status.lastTested > this.CACHE_DURATION) {
      return null;
    }

    return status.working;
  }

  getSortedProxies(proxies: string[]): string[] {
    return [...proxies].sort((a, b) => {
      const statusA = this.cache.get(a);
      const statusB = this.cache.get(b);

      // Prioritize working proxies
      if (statusA?.working && !statusB?.working) return -1;
      if (!statusA?.working && statusB?.working) return 1;

      // Prioritize by success rate
      const successRateA = statusA ? statusA.successCount / (statusA.successCount + statusA.failureCount) : 0;
      const successRateB = statusB ? statusB.successCount / (statusB.successCount + statusB.failureCount) : 0;

      return successRateB - successRateA;
    });
  }

  getStats(): Record<string, ProxyStatus> {
    const stats: Record<string, ProxyStatus> = {};
    for (const [url, status] of this.cache.entries()) {
      stats[url] = { ...status };
    }
    return stats;
  }
}

export const proxyCache = new ProxyCache();