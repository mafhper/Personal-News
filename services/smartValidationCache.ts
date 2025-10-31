/**
 * smartValidationCache.ts
 *
 * Smart validation cache manager with configurable TTL strategies,
 * memory management, statistics monitoring, and cache invalidation
 *
 * @author Personal News Dashboard
 * @version 1.0.0
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  key: string;
  size: number; // Estimated size in bytes
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number; // Total estimated size in bytes
  hitCount: number;
  missCount: number;
  hitRate: number;
  oldestEntry: number;
  newestEntry: number;
  averageAccessCount: number;
  memoryUsage: {
    used: number;
    limit: number;
    percentage: number;
  };
  ttlDistribution: {
    success: number;
    failure: number;
    discovery: number;
    custom: number;
  };
}

export interface CacheConfiguration {
  maxSize: number; // Maximum cache size in bytes
  maxEntries: number; // Maximum number of entries
  defaultSuccessTTL: number; // TTL for successful validations
  defaultFailureTTL: number; // TTL for failed validations
  discoveryTTL: number; // TTL for discovery results
  cleanupInterval: number; // Automatic cleanup interval in ms
  enableStats: boolean; // Whether to track statistics
}

export interface ValidationCacheManager {
  get<T>(key: string): CacheEntry<T> | null;
  set<T>(key: string, data: T, ttl?: number): void;
  invalidate(key: string): boolean;
  invalidatePattern(pattern: string): number;
  cleanup(): number;
  clear(): void;
  getStats(): CacheStats;
  configure(config: Partial<CacheConfiguration>): void;
  getConfiguration(): CacheConfiguration;
}

/**
 * Smart validation cache with different TTL strategies and memory management
 */
export class SmartValidationCache implements ValidationCacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = {
    hitCount: 0,
    missCount: 0,
  };

  private config: CacheConfiguration = {
    maxSize: 50 * 1024 * 1024, // 50MB default limit
    maxEntries: 10000, // Maximum 10k entries
    defaultSuccessTTL: 30 * 60 * 1000, // 30 minutes for successful validations
    defaultFailureTTL: 5 * 60 * 1000, // 5 minutes for failed validations
    discoveryTTL: 60 * 60 * 1000, // 1 hour for discovery results
    cleanupInterval: 5 * 60 * 1000, // Cleanup every 5 minutes
    enableStats: true,
  };

  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<CacheConfiguration>) {
    if (config) {
      this.configure(config);
    }
    this.startAutomaticCleanup();
  }

  /**
   * Get cached entry by key
   */
  get<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);

    if (!entry) {
      if (this.config.enableStats) {
        this.stats.missCount++;
      }
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      if (this.config.enableStats) {
        this.stats.missCount++;
      }
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

    if (this.config.enableStats) {
      this.stats.hitCount++;
    }

    return entry as CacheEntry<T>;
  }

  /**
   * Set cache entry with intelligent TTL determination
   */
  set<T>(key: string, data: T, customTTL?: number): void {
    const now = Date.now();
    const ttl = customTTL || this.determineTTL(key, data);
    const size = this.estimateSize(data);

    // Check if we need to make space
    this.ensureCapacity(size);

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl,
      accessCount: 0,
      lastAccessed: now,
      key,
      size,
    };

    this.cache.set(key, entry);
  }

  /**
   * Invalidate a specific cache entry
   */
  invalidate(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalidate entries matching a pattern (supports wildcards)
   */
  invalidatePattern(pattern: string): number {
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    let deletedCount = 0;

    for (const [key] of this.cache) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Manual cleanup of expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.hitCount = 0;
    this.stats.missCount = 0;
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());

    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const totalAccess = entries.reduce(
      (sum, entry) => sum + entry.accessCount,
      0
    );

    const timestamps = entries.map((entry) => entry.timestamp);
    const oldestEntry = timestamps.length > 0 ? Math.min(...timestamps) : 0;
    const newestEntry = timestamps.length > 0 ? Math.max(...timestamps) : 0;

    const totalRequests = this.stats.hitCount + this.stats.missCount;
    const hitRate = totalRequests > 0 ? this.stats.hitCount / totalRequests : 0;

    // TTL distribution analysis
    const ttlDistribution = {
      success: 0,
      failure: 0,
      discovery: 0,
      custom: 0,
    };

    entries.forEach((entry) => {
      if (entry.ttl === this.config.defaultSuccessTTL) {
        ttlDistribution.success++;
      } else if (entry.ttl === this.config.defaultFailureTTL) {
        ttlDistribution.failure++;
      } else if (entry.ttl === this.config.discoveryTTL) {
        ttlDistribution.discovery++;
      } else {
        ttlDistribution.custom++;
      }
    });

    return {
      totalEntries: this.cache.size,
      totalSize,
      hitCount: this.stats.hitCount,
      missCount: this.stats.missCount,
      hitRate: Math.round(hitRate * 100) / 100,
      oldestEntry,
      newestEntry,
      averageAccessCount:
        entries.length > 0 ? Math.round(totalAccess / entries.length) : 0,
      memoryUsage: {
        used: totalSize,
        limit: this.config.maxSize,
        percentage:
          this.config.maxSize > 0
            ? Math.round((totalSize / this.config.maxSize) * 100)
            : 0,
      },
      ttlDistribution,
    };
  }

  /**
   * Configure cache settings
   */
  configure(config: Partial<CacheConfiguration>): void {
    this.config = { ...this.config, ...config };

    // Restart cleanup timer if interval changed
    if (config.cleanupInterval !== undefined) {
      this.stopAutomaticCleanup();
      this.startAutomaticCleanup();
    }
  }

  /**
   * Get current configuration
   */
  getConfiguration(): CacheConfiguration {
    return { ...this.config };
  }

  /**
   * Force manual refresh of a cached entry
   */
  refresh(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      // Mark as expired to force refresh on next access
      entry.timestamp = 0;
      return true;
    }
    return false;
  }

  /**
   * Get cache keys matching a pattern
   */
  getKeys(pattern?: string): string[] {
    const keys = Array.from(this.cache.keys());

    if (!pattern) {
      return keys;
    }

    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    return keys.filter((key) => regex.test(key));
  }

  /**
   * Check if cache has a specific key (without updating access stats)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    const now = Date.now();
    return now - entry.timestamp <= entry.ttl;
  }

  /**
   * Get cache entry metadata without accessing the data
   */
  getMetadata(key: string): Omit<CacheEntry<any>, "data"> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const { data, ...metadata } = entry;
    return metadata;
  }

  /**
   * Determine appropriate TTL based on key and data
   */
  private determineTTL(key: string, data: any): number {
    // Discovery results get longer TTL
    if (key.includes("discovery:") || key.includes("feeds:")) {
      return this.config.discoveryTTL;
    }

    // Check if data indicates success or failure
    if (typeof data === "object" && data !== null) {
      if (data.isValid === true || data.success === true) {
        return this.config.defaultSuccessTTL;
      } else if (data.isValid === false || data.success === false) {
        return this.config.defaultFailureTTL;
      }
    }

    // Default to success TTL for unknown data types
    return this.config.defaultSuccessTTL;
  }

  /**
   * Estimate the size of data in bytes
   */
  private estimateSize(data: any): number {
    try {
      // Simple estimation based on JSON serialization
      const jsonString = JSON.stringify(data);
      return new Blob([jsonString]).size;
    } catch (error) {
      // Fallback estimation
      if (typeof data === "string") {
        return data.length * 2; // Assume UTF-16 encoding
      } else if (typeof data === "object" && data !== null) {
        return 1000; // Default estimate for objects
      } else {
        return 100; // Default for primitives
      }
    }
  }

  /**
   * Ensure cache has capacity for new entry
   */
  private ensureCapacity(newEntrySize: number): void {
    // Check entry count limit first
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLRU(0);
    }

    // Check size limit
    const currentSize = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.size,
      0
    );
    if (currentSize + newEntrySize > this.config.maxSize) {
      this.evictLRU(newEntrySize);
    }
  }

  /**
   * Evict least recently used entries to make space
   */
  private evictLRU(requiredSpace: number): void {
    const entries = Array.from(this.cache.entries());

    // Sort by last accessed time (oldest first)
    entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    let freedSpace = 0;

    for (const [key, entry] of entries) {
      this.cache.delete(key);
      freedSpace += entry.size;

      // Stop if we've freed enough space and are under entry limit
      if (
        freedSpace >= requiredSpace &&
        this.cache.size < this.config.maxEntries
      ) {
        break;
      }

      // Also stop if we've reached a reasonable number of entries
      if (this.cache.size <= Math.floor(this.config.maxEntries * 0.8)) {
        break;
      }
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startAutomaticCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop automatic cleanup timer
   */
  private stopAutomaticCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Cleanup resources when cache is destroyed
   */
  destroy(): void {
    this.stopAutomaticCleanup();
    this.clear();
  }
}

// Export singleton instance
export const smartValidationCache = new SmartValidationCache();

// Export factory function for custom instances
export function createSmartValidationCache(
  config?: Partial<CacheConfiguration>
): SmartValidationCache {
  return new SmartValidationCache(config);
}
