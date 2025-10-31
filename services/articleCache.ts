import { Article } from '../types';

// Simple logger to avoid circular dependency with performanceUtils
const logger = {
  log: (message: string) => {
    if (import.meta.env.DEV) {
      console.log(`[PERF] ${message}`);
    }
  }
};

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  maxSize: number;
  evictions: number;
  oldestItemAge: number;
  newestItemAge: number;
  averageAge: number;
  memoryUsage: number | null;
}

export interface ArticleCacheOptions {
  maxSize: number;
  maxAge: number; // in milliseconds
  memoryLimit: number; // in MB
  autoCleanupInterval: number; // in milliseconds
}

const DEFAULT_OPTIONS: ArticleCacheOptions = {
  maxSize: 500, // Maximum number of articles to store
  maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  memoryLimit: 50, // 50 MB
  autoCleanupInterval: 5 * 60 * 1000, // 5 minutes
};

/**
 * LRU (Least Recently Used) Cache for articles
 * Implements automatic cleanup based on size, age, and memory usage
 */
export class ArticleCache {
  private cache: Map<string, { article: Article; timestamp: number }>;
  private options: ArticleCacheOptions;
  private stats: {
    hits: number;
    misses: number;
    evictions: number;
  };
  private cleanupInterval: number | null;

  constructor(options: Partial<ArticleCacheOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
    this.cleanupInterval = null;

    // Start automatic cleanup if enabled
    if (this.options.autoCleanupInterval > 0) {
      this.startAutoCleanup();
    }
  }

  /**
   * Generate a unique key for an article
   */
  private getKey(article: Article): string {
    return `${article.link}|${article.sourceTitle}`;
  }

  /**
   * Get an article from the cache
   */
  get(article: Article): Article | null;
  get(link: string, sourceTitle: string): Article | null;
  get(articleOrLink: Article | string, sourceTitle?: string): Article | null {
    let key: string;

    if (typeof articleOrLink === 'string' && sourceTitle) {
      key = `${articleOrLink}|${sourceTitle}`;
    } else if (typeof articleOrLink === 'object') {
      key = this.getKey(articleOrLink);
    } else {
      throw new Error('Invalid arguments to get()');
    }

    const cached = this.cache.get(key);

    if (cached) {
      // Update access time by deleting and re-adding
      this.cache.delete(key);
      this.cache.set(key, {
        article: cached.article,
        timestamp: cached.timestamp, // Keep original timestamp for age tracking
      });
      this.stats.hits++;
      return cached.article;
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Add an article to the cache
   */
  set(article: Article): void {
    const key = this.getKey(article);

    // Remove if it already exists
    this.cache.delete(key);

    // Add to cache with current timestamp
    this.cache.set(key, {
      article,
      timestamp: Date.now(),
    });

    // Check if we need to evict items
    this.enforceConstraints();
  }

  /**
   * Add multiple articles to the cache
   */
  setMany(articles: Article[]): void {
    articles.forEach(article => this.set(article));
  }

  /**
   * Check if an article exists in the cache
   */
  has(article: Article): boolean;
  has(link: string, sourceTitle: string): boolean;
  has(articleOrLink: Article | string, sourceTitle?: string): boolean {
    let key: string;

    if (typeof articleOrLink === 'string' && sourceTitle) {
      key = `${articleOrLink}|${sourceTitle}`;
    } else if (typeof articleOrLink === 'object') {
      key = this.getKey(articleOrLink);
    } else {
      throw new Error('Invalid arguments to has()');
    }

    return this.cache.has(key);
  }

  /**
   * Remove an article from the cache
   */
  delete(article: Article): boolean;
  delete(link: string, sourceTitle: string): boolean;
  delete(articleOrLink: Article | string, sourceTitle?: string): boolean {
    let key: string;

    if (typeof articleOrLink === 'string' && sourceTitle) {
      key = `${articleOrLink}|${sourceTitle}`;
    } else if (typeof articleOrLink === 'object') {
      key = this.getKey(articleOrLink);
    } else {
      throw new Error('Invalid arguments to delete()');
    }

    return this.cache.delete(key);
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
    logger.log('Article cache cleared');
  }

  /**
   * Get the number of articles in the cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get all articles in the cache
   */
  getAll(): Article[] {
    return Array.from(this.cache.values()).map(item => item.article);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const now = Date.now();
    let totalAge = 0;
    let oldestTimestamp = now;
    let newestTimestamp = 0;

    // Calculate age statistics
    this.cache.forEach(({ timestamp }) => {
      totalAge += (now - timestamp);
      if (timestamp < oldestTimestamp) oldestTimestamp = timestamp;
      if (timestamp > newestTimestamp) newestTimestamp = timestamp;
    });

    const size = this.cache.size;
    const averageAge = size > 0 ? totalAge / size : 0;
    const oldestItemAge = size > 0 ? now - oldestTimestamp : 0;
    const newestItemAge = size > 0 ? now - newestTimestamp : 0;

    // Get memory usage if available
    let memoryUsage: number | null = null;
    if ('memory' in performance) {
      memoryUsage = Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024)); // MB
    }

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.stats.hits + this.stats.misses > 0
        ? this.stats.hits / (this.stats.hits + this.stats.misses)
        : 0,
      size,
      maxSize: this.options.maxSize,
      evictions: this.stats.evictions,
      oldestItemAge,
      newestItemAge,
      averageAge,
      memoryUsage,
    };
  }

  /**
   * Enforce cache constraints (size, age, memory)
   */
  private enforceConstraints(): void {
    this.enforceMaxSize();
    this.enforceMaxAge();
    this.enforceMemoryLimit();
  }

  /**
   * Enforce maximum cache size
   */
  private enforceMaxSize(): void {
    if (this.cache.size <= this.options.maxSize) {
      return;
    }

    // Need to evict items - get the oldest ones first
    const itemsToEvict = this.cache.size - this.options.maxSize;

    if (itemsToEvict <= 0) {
      return;
    }

    // Get entries sorted by timestamp (oldest first)
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Remove the oldest entries
    for (let i = 0; i < itemsToEvict; i++) {
      if (i < entries.length) {
        this.cache.delete(entries[i][0]);
        this.stats.evictions++;
      }
    }

    logger.log(`Evicted ${itemsToEvict} articles from cache due to size limit`);
  }

  /**
   * Enforce maximum age of cache items
   */
  private enforceMaxAge(): void {
    if (this.options.maxAge <= 0) {
      return;
    }

    const now = Date.now();
    let evictionCount = 0;

    // Remove items older than maxAge
    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.options.maxAge) {
        this.cache.delete(key);
        this.stats.evictions++;
        evictionCount++;
      }
    });

    if (evictionCount > 0) {
      logger.log(`Evicted ${evictionCount} articles from cache due to age limit`);
    }
  }

  /**
   * Enforce memory usage limit
   */
  private enforceMemoryLimit(): void {
    if (this.options.memoryLimit <= 0 || !('memory' in performance)) {
      return;
    }

    const memory = (performance as any).memory;
    const usedMemoryMB = memory.usedJSHeapSize / (1024 * 1024);

    // If we're under the limit, no need to evict
    if (usedMemoryMB < this.options.memoryLimit) {
      return;
    }

    // We need to evict some items to reduce memory usage
    // Start by removing 10% of the cache, oldest items first
    const itemsToEvict = Math.max(1, Math.ceil(this.cache.size * 0.1));

    // Get entries sorted by timestamp (oldest first)
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Remove the oldest entries
    for (let i = 0; i < itemsToEvict && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
      this.stats.evictions++;
    }

    logger.log(`Evicted ${itemsToEvict} articles from cache due to memory limit (${usedMemoryMB.toFixed(2)}MB used)`);
  }

  /**
   * Start automatic cleanup interval
   */
  startAutoCleanup(): void {
    if (this.cleanupInterval !== null) {
      return;
    }

    this.cleanupInterval = window.setInterval(() => {
      this.cleanup();
    }, this.options.autoCleanupInterval);

    logger.log(`Started automatic cache cleanup every ${this.options.autoCleanupInterval / 1000} seconds`);
  }

  /**
   * Stop automatic cleanup interval
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval === null) {
      return;
    }

    clearInterval(this.cleanupInterval);
    this.cleanupInterval = null;

    logger.log('Stopped automatic cache cleanup');
  }

  /**
   * Run a manual cleanup
   */
  cleanup(): void {
    const beforeSize = this.cache.size;

    this.enforceMaxAge();
    this.enforceMemoryLimit();

    const afterSize = this.cache.size;
    const evicted = beforeSize - afterSize;

    if (evicted > 0) {
      logger.log(`Cache cleanup complete: ${evicted} articles evicted`);
    }
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }
}

// Create a singleton instance with default options
export const articleCache = new ArticleCache();

// Export default instance
export default articleCache;
