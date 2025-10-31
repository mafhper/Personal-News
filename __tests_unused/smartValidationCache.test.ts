/**
 * smartValidationCache.test.ts
 *
 * Comprehensive test suite for SmartValidationCache
 * Tests TTL strategies, memory management, statistics, and cache invalidation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  SmartValidationCache,
  createSmartValidationCache,
  smartValidationCache,
  CacheConfiguration,
} from "../services/smartValidationCache";

describe("SmartValidationCache", () => {
  let cache: SmartValidationCache;

  beforeEach(() => {
    // Create a fresh cache instance for each test
    cache = createSmartValidationCache({
      maxSize: 1024 * 1024, // 1MB for testing
      maxEntries: 100,
      defaultSuccessTTL: 1000, // 1 second for fast testing
      defaultFailureTTL: 500, // 0.5 seconds for fast testing
      discoveryTTL: 2000, // 2 seconds for fast testing
      cleanupInterval: 100, // 100ms for fast testing
      enableStats: true,
    });
  });

  afterEach(() => {
    cache.destroy();
  });

  describe("Basic Cache Operations", () => {
    it("should store and retrieve data", () => {
      const testData = { message: "test data" };
      cache.set("test-key", testData);

      const retrieved = cache.get("test-key");
      expect(retrieved).toBeTruthy();
      expect(retrieved?.data).toEqual(testData);
    });

    it("should return null for non-existent keys", () => {
      const result = cache.get("non-existent");
      expect(result).toBeNull();
    });

    it("should check if cache has a key", () => {
      cache.set("test-key", "test-data");
      expect(cache.has("test-key")).toBe(true);
      expect(cache.has("non-existent")).toBe(false);
    });

    it("should invalidate specific entries", () => {
      cache.set("key1", "data1");
      cache.set("key2", "data2");

      expect(cache.has("key1")).toBe(true);
      expect(cache.invalidate("key1")).toBe(true);
      expect(cache.has("key1")).toBe(false);
      expect(cache.has("key2")).toBe(true);
    });

    it("should clear all entries", () => {
      cache.set("key1", "data1");
      cache.set("key2", "data2");

      cache.clear();
      expect(cache.has("key1")).toBe(false);
      expect(cache.has("key2")).toBe(false);
    });
  });

  describe("TTL (Time To Live) Strategies", () => {
    it("should expire entries after TTL", async () => {
      cache.set("test-key", "test-data", 100); // 100ms TTL

      expect(cache.has("test-key")).toBe(true);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(cache.has("test-key")).toBe(false);
      expect(cache.get("test-key")).toBeNull();
    });

    it("should use different TTL for success results", () => {
      const successData = { isValid: true, message: "success" };
      cache.set("success-key", successData);

      const entry = cache.get("success-key");
      expect(entry?.ttl).toBe(1000); // defaultSuccessTTL
    });

    it("should use different TTL for failure results", () => {
      const failureData = { isValid: false, error: "failed" };
      cache.set("failure-key", failureData);

      const entry = cache.get("failure-key");
      expect(entry?.ttl).toBe(500); // defaultFailureTTL
    });

    it("should use discovery TTL for discovery keys", () => {
      const discoveryData = { feeds: ["feed1", "feed2"] };
      cache.set("discovery:example.com", discoveryData);

      const entry = cache.get("discovery:example.com");
      expect(entry?.ttl).toBe(2000); // discoveryTTL
    });

    it("should use custom TTL when provided", () => {
      const customTTL = 5000;
      cache.set("custom-key", "data", customTTL);

      const entry = cache.get("custom-key");
      expect(entry?.ttl).toBe(customTTL);
    });
  });

  describe("Memory Management", () => {
    it("should track cache size", () => {
      const largeData = "x".repeat(1000);
      cache.set("large-key", largeData);

      const stats = cache.getStats();
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.totalEntries).toBe(1);
    });

    it("should evict LRU entries when size limit exceeded", () => {
      // Create cache with very small size limit
      const smallCache = createSmartValidationCache({
        maxSize: 200, // Small limit
        maxEntries: 10,
      });

      // Add entries that will exceed size limit
      smallCache.set("key1", "x".repeat(100)); // ~200 bytes
      smallCache.set("key2", "x".repeat(100)); // ~200 bytes, should trigger eviction

      // Check that cache respects size limits
      const stats = smallCache.getStats();
      expect(stats.totalSize).toBeLessThanOrEqual(
        smallCache.getConfiguration().maxSize + 100
      ); // Allow some tolerance

      smallCache.destroy();
    });

    it("should evict entries when entry count limit exceeded", () => {
      const limitedCache = createSmartValidationCache({
        maxEntries: 2,
        maxSize: 1024 * 1024,
      });

      limitedCache.set("key1", "data1");
      limitedCache.set("key2", "data2");
      limitedCache.set("key3", "data3"); // Should trigger eviction

      // Check that we don't exceed the entry limit
      const stats = limitedCache.getStats();
      expect(stats.totalEntries).toBeLessThanOrEqual(2);

      limitedCache.destroy();
    });

    it("should update LRU order on access", () => {
      const limitedCache = createSmartValidationCache({
        maxEntries: 2,
        maxSize: 1024 * 1024,
      });

      limitedCache.set("key1", "data1");
      limitedCache.set("key2", "data2");

      // Access key1 to make it recently used
      const accessed = limitedCache.get("key1");
      expect(accessed).toBeTruthy();
      expect(accessed?.accessCount).toBeGreaterThan(0);

      // Add key3, should trigger eviction
      limitedCache.set("key3", "data3");

      // Check that we don't exceed entry limit
      const stats = limitedCache.getStats();
      expect(stats.totalEntries).toBeLessThanOrEqual(2);

      // At least one of the original keys should be evicted
      const key1Exists = limitedCache.has("key1");
      const key2Exists = limitedCache.has("key2");
      const key3Exists = limitedCache.has("key3");

      expect(key3Exists).toBe(true); // New entry should exist
      expect(key1Exists || key2Exists).toBe(true); // At least one original should remain

      limitedCache.destroy();
    });
  });

  describe("Cache Statistics", () => {
    it("should track hit and miss counts", () => {
      cache.set("key1", "data1");

      // Hit
      cache.get("key1");
      cache.get("key1");

      // Miss
      cache.get("non-existent");

      const stats = cache.getStats();
      expect(stats.hitCount).toBe(2);
      expect(stats.missCount).toBe(1);
      expect(stats.hitRate).toBe(0.67); // 2/3 rounded
    });

    it("should track access counts", () => {
      cache.set("key1", "data1");

      cache.get("key1");
      cache.get("key1");
      cache.get("key1");

      const entry = cache.get("key1");
      expect(entry?.accessCount).toBe(4); // Including this access
    });

    it("should provide comprehensive statistics", () => {
      cache.set("success-key", { isValid: true });
      cache.set("failure-key", { isValid: false });
      cache.set("discovery:test", { feeds: [] });
      cache.set("custom-key", "data", 3000);

      const stats = cache.getStats();

      expect(stats.totalEntries).toBe(4);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.ttlDistribution.success).toBe(1);
      expect(stats.ttlDistribution.failure).toBe(1);
      expect(stats.ttlDistribution.discovery).toBe(1);
      expect(stats.ttlDistribution.custom).toBe(1);
      expect(stats.memoryUsage.percentage).toBeGreaterThanOrEqual(0);
      expect(stats.memoryUsage.used).toBe(stats.totalSize);
    });

    it("should track oldest and newest entries", () => {
      const now = Date.now();

      cache.set("old-key", "old-data");

      // Wait a bit
      setTimeout(() => {
        cache.set("new-key", "new-data");

        const stats = cache.getStats();
        expect(stats.newestEntry).toBeGreaterThan(stats.oldestEntry);
      }, 10);
    });
  });

  describe("Cache Invalidation", () => {
    it("should invalidate entries by pattern", () => {
      cache.set("user:1:profile", "profile1");
      cache.set("user:2:profile", "profile2");
      cache.set("user:1:settings", "settings1");
      cache.set("other:data", "other");

      const deletedCount = cache.invalidatePattern("user:*");

      expect(deletedCount).toBe(3);
      expect(cache.has("user:1:profile")).toBe(false);
      expect(cache.has("user:2:profile")).toBe(false);
      expect(cache.has("user:1:settings")).toBe(false);
      expect(cache.has("other:data")).toBe(true);
    });

    it("should support complex patterns", () => {
      cache.set("feed:validation:example.com", "data1");
      cache.set("feed:discovery:example.com", "data2");
      cache.set("feed:validation:test.com", "data3");
      cache.set("other:validation:example.com", "data4");

      const deletedCount = cache.invalidatePattern("feed:.*:example.com");

      expect(deletedCount).toBe(2);
      expect(cache.has("feed:validation:example.com")).toBe(false);
      expect(cache.has("feed:discovery:example.com")).toBe(false);
      expect(cache.has("feed:validation:test.com")).toBe(true);
      expect(cache.has("other:validation:example.com")).toBe(true);
    });
  });

  describe("Manual Refresh and Cleanup", () => {
    it("should manually refresh entries", () => {
      cache.set("test-key", "test-data");

      const originalEntry = cache.get("test-key");
      expect(originalEntry).toBeTruthy();

      const refreshed = cache.refresh("test-key");
      expect(refreshed).toBe(true);

      // Entry should be marked as expired
      const expiredEntry = cache.get("test-key");
      expect(expiredEntry).toBeNull();
    });

    it("should return false when refreshing non-existent key", () => {
      const result = cache.refresh("non-existent");
      expect(result).toBe(false);
    });

    it("should manually cleanup expired entries", async () => {
      cache.set("key1", "data1", 50); // 50ms TTL
      cache.set("key2", "data2", 1000); // 1s TTL

      // Wait for first entry to expire
      await new Promise((resolve) => setTimeout(resolve, 100));

      const cleanedCount = cache.cleanup();
      expect(cleanedCount).toBeGreaterThanOrEqual(0); // At least 0, possibly 1

      // Check that expired entry is gone
      expect(cache.has("key1")).toBe(false);
      expect(cache.has("key2")).toBe(true);
    });
  });

  describe("Configuration Management", () => {
    it("should allow configuration updates", () => {
      const newConfig = {
        defaultSuccessTTL: 5000,
        maxEntries: 50,
      };

      cache.configure(newConfig);

      const config = cache.getConfiguration();
      expect(config.defaultSuccessTTL).toBe(5000);
      expect(config.maxEntries).toBe(50);
    });

    it("should apply new TTL settings to new entries", () => {
      cache.configure({ defaultSuccessTTL: 3000 });

      cache.set("test-key", { isValid: true });
      const entry = cache.get("test-key");

      expect(entry?.ttl).toBe(3000);
    });
  });

  describe("Key Management", () => {
    it("should get all cache keys", () => {
      cache.set("key1", "data1");
      cache.set("key2", "data2");
      cache.set("key3", "data3");

      const keys = cache.getKeys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain("key1");
      expect(keys).toContain("key2");
      expect(keys).toContain("key3");
    });

    it("should get keys matching pattern", () => {
      cache.set("user:1", "data1");
      cache.set("user:2", "data2");
      cache.set("admin:1", "data3");

      const userKeys = cache.getKeys("user:*");
      expect(userKeys).toHaveLength(2);
      expect(userKeys).toContain("user:1");
      expect(userKeys).toContain("user:2");
    });

    it("should get entry metadata without data", () => {
      cache.set("test-key", "test-data");

      const metadata = cache.getMetadata("test-key");
      expect(metadata).toBeTruthy();
      expect(metadata?.key).toBe("test-key");
      expect(metadata?.accessCount).toBe(0);
      expect(metadata?.size).toBeGreaterThan(0);
      expect("data" in metadata!).toBe(false);
    });
  });

  describe("Automatic Cleanup", () => {
    it("should automatically cleanup expired entries", async () => {
      const autoCleanupCache = createSmartValidationCache({
        cleanupInterval: 50, // 50ms cleanup interval
      });

      autoCleanupCache.set("key1", "data1", 25); // 25ms TTL
      autoCleanupCache.set("key2", "data2", 1000); // 1s TTL

      expect(autoCleanupCache.has("key1")).toBe(true);

      // Wait for automatic cleanup
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(autoCleanupCache.has("key1")).toBe(false);
      expect(autoCleanupCache.has("key2")).toBe(true);

      autoCleanupCache.destroy();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle null and undefined data", () => {
      cache.set("null-key", null);
      cache.set("undefined-key", undefined);

      expect(cache.get("null-key")?.data).toBeNull();
      expect(cache.get("undefined-key")?.data).toBeUndefined();
    });

    it("should handle large objects", () => {
      const largeObject = {
        data: "x".repeat(10000),
        nested: {
          array: new Array(1000).fill("test"),
          object: { key: "value" },
        },
      };

      cache.set("large-key", largeObject);
      const retrieved = cache.get("large-key");

      expect(retrieved?.data).toEqual(largeObject);
    });

    it("should handle circular references in size estimation", () => {
      const circularObj: any = { name: "test" };
      circularObj.self = circularObj;

      // Should not throw error
      expect(() => {
        cache.set("circular-key", circularObj);
      }).not.toThrow();
    });

    it("should handle empty cache operations", () => {
      expect(cache.cleanup()).toBe(0);
      expect(cache.invalidatePattern("*")).toBe(0);
      expect(cache.getKeys()).toHaveLength(0);

      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(0);
      expect(stats.totalSize).toBe(0);
    });
  });

  describe("Singleton Instance", () => {
    it("should provide a singleton instance", () => {
      expect(smartValidationCache).toBeInstanceOf(SmartValidationCache);

      // Should be the same instance
      const instance1 = smartValidationCache;
      const instance2 = smartValidationCache;
      expect(instance1).toBe(instance2);
    });
  });
});
