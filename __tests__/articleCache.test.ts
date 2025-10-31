import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ArticleCache } from '../services/articleCache';
import { Article } from '../types';

// Mock performance.memory
const originalPerformance = global.performance;
beforeEach(() => {
  Object.defineProperty(global.performance, 'memory', {
    value: {
      usedJSHeapSize: 10 * 1024 * 1024, // 10MB
      totalJSHeapSize: 100 * 1024 * 1024, // 100MB
      jsHeapSizeLimit: 200 * 1024 * 1024, // 200MB
    },
    configurable: true,
  });
});

afterEach(() => {
  global.performance = originalPerformance;
  vi.restoreAllMocks();
});

// Helper to create mock articles
function createMockArticle(id: number): Article {
  return {
    title: `Article ${id}`,
    link: `https://example.com/article-${id}`,
    pubDate: new Date(),
    sourceTitle: `Source ${Math.floor(id / 10)}`,
    description: `Description for article ${id}`,
  };
}

describe('ArticleCache', () => {
  it('should store and retrieve articles', () => {
    const cache = new ArticleCache();
    const article = createMockArticle(1);

    cache.set(article);

    expect(cache.has(article)).toBe(true);
    expect(cache.get(article)).toEqual(article);
    expect(cache.size()).toBe(1);
  });

  it('should handle cache misses', () => {
    const cache = new ArticleCache();
    const article = createMockArticle(1);
    const missingArticle = createMockArticle(2);

    cache.set(article);

    expect(cache.has(missingArticle)).toBe(false);
    expect(cache.get(missingArticle)).toBeNull();
  });

  it('should enforce maximum size constraint', () => {
    const maxSize = 5;
    const cache = new ArticleCache({ maxSize });

    // Add more articles than the max size
    for (let i = 0; i < maxSize + 3; i++) {
      cache.set(createMockArticle(i));
    }

    // Cache should only contain maxSize items
    expect(cache.size()).toBe(maxSize);

    // The oldest items should have been evicted
    expect(cache.has(createMockArticle(0))).toBe(false);
    expect(cache.has(createMockArticle(1))).toBe(false);
    expect(cache.has(createMockArticle(2))).toBe(false);

    // The newest items should still be in the cache
    expect(cache.has(createMockArticle(maxSize + 2))).toBe(true);
  });

  it('should enforce maximum age constraint', () => {
    vi.useFakeTimers();

    const maxAge = 1000; // 1 second
    const cache = new ArticleCache({ maxAge });

    // Add an article
    cache.set(createMockArticle(1));
    expect(cache.size()).toBe(1);

    // Advance time beyond maxAge
    vi.advanceTimersByTime(maxAge + 100);

    // Force cleanup
    cache.cleanup();

    // Article should be evicted
    expect(cache.size()).toBe(0);

    vi.useRealTimers();
  });

  it('should track cache statistics', () => {
    const cache = new ArticleCache();
    const article = createMockArticle(1);

    // Add an article and access it
    cache.set(article);
    cache.get(article);
    cache.get(article);

    // Try to get a missing article
    cache.get(createMockArticle(2));

    const stats = cache.getStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBeCloseTo(2/3);
    expect(stats.size).toBe(1);
  });

  it('should delete articles from cache', () => {
    const cache = new ArticleCache();
    const article = createMockArticle(1);

    cache.set(article);
    expect(cache.has(article)).toBe(true);

    cache.delete(article);
    expect(cache.has(article)).toBe(false);
  });

  it('should clear the entire cache', () => {
    const cache = new ArticleCache();

    for (let i = 0; i < 5; i++) {
      cache.set(createMockArticle(i));
    }

    expect(cache.size()).toBe(5);

    cache.clear();
    expect(cache.size()).toBe(0);
  });

  it('should handle memory limit enforcement', () => {
    // Mock a high memory usage
    Object.defineProperty(global.performance, 'memory', {
      value: {
        usedJSHeapSize: 60 * 1024 * 1024, // 60MB (above our 50MB limit)
        totalJSHeapSize: 100 * 1024 * 1024,
        jsHeapSizeLimit: 200 * 1024 * 1024,
      },
      configurable: true,
    });

    const cache = new ArticleCache({ memoryLimit: 50 }); // 50MB limit

    // Add 10 articles
    for (let i = 0; i < 10; i++) {
      cache.set(createMockArticle(i));
    }

    // Force cleanup
    cache.cleanup();

    // Should have evicted some articles due to memory pressure
    expect(cache.size()).toBeLessThan(10);
  });

  it('should handle automatic cleanup', () => {
    vi.useFakeTimers();

    const autoCleanupInterval = 1000; // 1 second
    const maxAge = 500; // 0.5 seconds
    const cache = new ArticleCache({ autoCleanupInterval, maxAge });

    // Add an article
    cache.set(createMockArticle(1));
    expect(cache.size()).toBe(1);

    // Advance time beyond maxAge but before cleanup
    vi.advanceTimersByTime(maxAge + 100);
    expect(cache.size()).toBe(1); // Still there before cleanup

    // Advance time to trigger cleanup
    vi.advanceTimersByTime(autoCleanupInterval);
    expect(cache.size()).toBe(0); // Should be gone after cleanup

    vi.useRealTimers();
  });

  it('should handle bulk operations', () => {
    const cache = new ArticleCache();
    const articles = Array.from({ length: 5 }, (_, i) => createMockArticle(i));

    cache.setMany(articles);
    expect(cache.size()).toBe(5);

    const allArticles = cache.getAll();
    expect(allArticles.length).toBe(5);
  });

  it('should reset statistics', () => {
    const cache = new ArticleCache();
    const article = createMockArticle(1);

    cache.set(article);
    cache.get(article);
    cache.get(createMockArticle(2)); // Miss

    let stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);

    cache.resetStats();

    stats = cache.getStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
  });
});
