/**
 * smartCache.ts
 *
 * Smart caching system with TTL, persistence, and stale-while-revalidate strategy.
 * Provides enhanced caching capabilities for RSS feeds with automatic cleanup
 * and intelligent cache management.
 *
 * @author Matheus Pereira
 * @version 1.0.0
 */

import type { Article } from '../types';
import { logger } from './logger';

export interface CacheEntry {
  articles: Article[];
  timestamp: number;
  feedUrl: string;
  etag?: string;
  lastModified?: string;
  title: string;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheOptions {
  ttl?: number;
  maxEntries?: number;
  enablePersistence?: boolean;
  enableStaleWhileRevalidate?: number;
}

export interface CacheStats {
  totalEntries: number;
  totalArticles: number;
  cacheSize: number;
  hitRate: number;
  oldestEntry: number;
  newestEntry: number;
}

const DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes (reduzido de 15)
const DEFAULT_MAX_ENTRIES = 100; // Aumentado para mais feeds
const DEFAULT_STALE_WHILE_REVALIDATE = 2 * 60 * 60 * 1000; // 2 horas (aumentado)
const STORAGE_KEY = 'smart-feed-cache';


/**
 * Smart cache implementation with TTL and stale-while-revalidate
 */
export class SmartCache {
  private cache = new Map<string, CacheEntry>();
  private options: Required<CacheOptions>;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0,
  };

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || DEFAULT_TTL,
      maxEntries: options.maxEntries || DEFAULT_MAX_ENTRIES,
      enablePersistence: options.enablePersistence !== false,
      enableStaleWhileRevalidate: options.enableStaleWhileRevalidate || DEFAULT_STALE_WHILE_REVALIDATE,
    };

    // Load from localStorage if persistence is enabled
    if (this.options.enablePersistence) {
      this.loadFromStorage();
    }

    // Set up periodic cleanup
    this.setupPeriodicCleanup();
  }

  /**
   * Get cached articles for a feed URL
   */
  get(feedUrl: string): Article[] | null {
    const entry = this.cache.get(feedUrl);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

    // Check if cache is still fresh
    if (age <= this.options.ttl) {
      this.stats.hits++;
      logger.debug(`Cache hit for feed (fresh)`, {
        component: 'SmartCache',
        additionalData: {
          feedUrl,
          age: Math.round(age / 1000),
          ttl: Math.round(this.options.ttl / 1000),
          articlesCount: entry.articles.length,
        }
      });
      return entry.articles;
    }

    // Check if we can serve stale content
    if (age <= this.options.enableStaleWhileRevalidate) {
      this.stats.hits++;
      logger.debug(`Cache hit for feed (stale)`, {
        component: 'SmartCache',
        additionalData: {
          feedUrl,
          age: Math.round(age / 1000),
          staleLimit: Math.round(this.options.enableStaleWhileRevalidate / 1000),
          articlesCount: entry.articles.length,
        }
      });
      return entry.articles;
    }

    // Cache is too old, remove it
    this.cache.delete(feedUrl);
    this.stats.misses++;

    logger.debug(`Cache expired for feed`, {
      component: 'SmartCache',
      additionalData: {
        feedUrl,
        age: Math.round(age / 1000),
        staleLimit: Math.round(this.options.enableStaleWhileRevalidate / 1000),
      }
    });

    return null;
  }

  /**
   * Get stale content for stale-while-revalidate strategy
   */
  getStaleWhileRevalidate(feedUrl: string): Article[] | null {
    const entry = this.cache.get(feedUrl);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Return stale content if within stale-while-revalidate window
    if (age <= this.options.enableStaleWhileRevalidate) {
      entry.lastAccessed = now;

      logger.debug(`Serving stale content while revalidating`, {
        component: 'SmartCache',
        additionalData: {
          feedUrl,
          age: Math.round(age / 1000),
          articlesCount: entry.articles.length,
        }
      });

      return entry.articles;
    }

    return null;
  }

  /**
   * Check if cache entry is fresh (within TTL)
   */
  isFresh(feedUrl: string): boolean {
    const entry = this.cache.get(feedUrl);

    if (!entry) {
      return false;
    }

    const age = Date.now() - entry.timestamp;
    return age <= this.options.ttl;
  }

  /**
   * Check if cache entry is stale but still usable
   */
  isStale(feedUrl: string): boolean {
    const entry = this.cache.get(feedUrl);

    if (!entry) {
      return false;
    }

    const age = Date.now() - entry.timestamp;
    return age > this.options.ttl && age <= this.options.enableStaleWhileRevalidate;
  }

  /**
   * Set cached articles for a feed URL
   */
  set(
    feedUrl: string,
    articles: Article[],
    title: string,
    headers?: Headers
  ): void {
    const now = Date.now();

    // Create cache entry
    const entry: CacheEntry = {
      articles: articles.map(article => ({
        ...article,
        pubDate: new Date(article.pubDate), // Ensure Date objects
      })),
      timestamp: now,
      feedUrl,
      title,
      etag: headers?.get('etag') || undefined,
      lastModified: headers?.get('last-modified') || undefined,
      accessCount: 1,
      lastAccessed: now,
    };

    // Check if we need to evict entries
    if (this.cache.size >= this.options.maxEntries) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(feedUrl, entry);
    this.stats.sets++;

    logger.debug(`Cached articles for feed`, {
      component: 'SmartCache',
      additionalData: {
        feedUrl,
        articlesCount: articles.length,
        title,
        hasEtag: !!entry.etag,
        hasLastModified: !!entry.lastModified,
        cacheSize: this.cache.size,
      }
    });

    // Persist to storage if enabled
    if (this.options.enablePersistence) {
      this.persistToStorage();
    }
  }

  /**
   * Remove a specific cache entry
   */
  delete(feedUrl: string): boolean {
    const deleted = this.cache.delete(feedUrl);

    if (deleted) {
      logger.debug(`Removed cache entry for feed`, {
        component: 'SmartCache',
        additionalData: { feedUrl }
      });

      if (this.options.enablePersistence) {
        this.persistToStorage();
      }
    }

    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();

    logger.info(`Cleared all cache entries`, {
      component: 'SmartCache',
      additionalData: { clearedEntries: size }
    });

    if (this.options.enablePersistence) {
      this.persistToStorage();
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalArticles = entries.reduce((sum, entry) => sum + entry.articles.length, 0);
    const timestamps = entries.map(entry => entry.timestamp);

    const hitRate = this.stats.hits + this.stats.misses > 0
      ? this.stats.hits / (this.stats.hits + this.stats.misses)
      : 0;

    return {
      totalEntries: this.cache.size,
      totalArticles,
      cacheSize: this.estimateCacheSize(),
      hitRate,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0,
    };
  }

  /**
   * Get all cached feed URLs
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Check if a feed URL is cached
   */
  has(feedUrl: string): boolean {
    return this.cache.has(feedUrl);
  }

  /**
   * Get cache entry metadata (without articles)
   */
  getMetadata(feedUrl: string): Omit<CacheEntry, 'articles'> | null {
    const entry = this.cache.get(feedUrl);

    if (!entry) {
      return null;
    }

    const { articles, ...metadata } = entry;
    return metadata;
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;

      if (age > this.options.enableStaleWhileRevalidate) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      logger.info(`Cleaned up expired cache entries`, {
        component: 'SmartCache',
        additionalData: {
          expiredCount: expiredKeys.length,
          remainingCount: this.cache.size,
        }
      });

      if (this.options.enablePersistence) {
        this.persistToStorage();
      }
    }

    return expiredKeys.length;
  }

  /**
   * Evict least recently used entry
   */
  private evictLeastRecentlyUsed(): void {
    let lruKey: string | null = null;
    let lruTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.stats.evictions++;

      logger.debug(`Evicted LRU cache entry`, {
        component: 'SmartCache',
        additionalData: {
          evictedKey: lruKey,
          lastAccessed: new Date(lruTime).toISOString(),
        }
      });
    }
  }

  /**
   * Estimate cache size in bytes
   */
  private estimateCacheSize(): number {
    let size = 0;

    for (const entry of this.cache.values()) {
      // Rough estimation of entry size
      size += JSON.stringify(entry).length * 2; // UTF-16 characters
    }

    return size;
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        return;
      }

      const data = JSON.parse(stored);
      const now = Date.now();

      for (const [key, entryData] of data.entries || []) {
        // Convert article dates back to Date objects
        const entry: CacheEntry = {
          ...entryData,
          articles: entryData.articles.map((article: any) => ({
            ...article,
            pubDate: new Date(article.pubDate),
          })),
        };

        // Only load entries that are still within stale-while-revalidate window
        const age = now - entry.timestamp;
        if (age <= this.options.enableStaleWhileRevalidate) {
          this.cache.set(key, entry);
        }
      }

      logger.info(`Loaded cache from storage`, {
        component: 'SmartCache',
        additionalData: {
          loadedEntries: this.cache.size,
          totalStored: data.entries?.length || 0,
        }
      });

    } catch (error) {
      logger.error('Failed to load cache from storage', error as Error, {
        component: 'SmartCache'
      });

      // Clear corrupted storage
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Persist cache to localStorage
   */
  private persistToStorage(): void {
    try {
      const entries = Array.from(this.cache.entries()).map(([key, entry]) => [
        key,
        {
          ...entry,
          articles: entry.articles.map(article => ({
            ...article,
            pubDate: article.pubDate.toISOString(),
          })),
        },
      ]);

      const data = {
        entries,
        timestamp: Date.now(),
        version: '1.0.0',
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      logger.debug(`Persisted cache to storage`, {
        component: 'SmartCache',
        additionalData: {
          entriesCount: entries.length,
          estimatedSize: JSON.stringify(data).length,
        }
      });

    } catch (error) {
      logger.error('Failed to persist cache to storage', error as Error, {
        component: 'SmartCache',
        additionalData: {
          cacheSize: this.cache.size,
          estimatedSize: this.estimateCacheSize(),
        }
      });
    }
  }

  /**
   * Set up periodic cleanup
   */
  private setupPeriodicCleanup(): void {
    // Clean up every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }
}

// Export singleton instance
export const smartCache = new SmartCache({
  ttl: DEFAULT_TTL,
  maxEntries: DEFAULT_MAX_ENTRIES,
  enablePersistence: true,
  enableStaleWhileRevalidate: DEFAULT_STALE_WHILE_REVALIDATE,
});

// Export utility functions
export const getCachedArticles = (feedUrl: string): Article[] | null => {
  return smartCache.get(feedUrl);
};

export const setCachedArticles = (
  feedUrl: string,
  articles: Article[],
  title: string,
  headers?: Headers
): void => {
  smartCache.set(feedUrl, articles, title, headers);
};

export const isCacheFresh = (feedUrl: string): boolean => {
  return smartCache.isFresh(feedUrl);
};

export const getCacheStats = (): CacheStats => {
  return smartCache.getStats();
};

export const clearCache = (): void => {
  smartCache.clear();
};
