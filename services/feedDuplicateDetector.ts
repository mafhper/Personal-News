/**
 * feedDuplicateDetector.ts
 *
 * Service for detecting and preventing duplicate RSS feeds across different URLs.
 * Implements URL normalization, content fingerprinting, and duplicate resolution.
 *
 * @author Personal News Dashboard
 * @version 1.0.0
 */

import type { FeedSource } from "../types";
import { feedValidator } from "./feedValidator";

export interface FeedFingerprint {
  url: string;
  normalizedUrl: string;
  title?: string;
  description?: string;
  link?: string;
  contentHash: string;
  lastUpdated: number;
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  duplicateOf?: FeedSource;
  confidence: number; // 0-1 score indicating confidence in duplicate detection
  reason: string;
  normalizedUrl?: string;
  contentFingerprint?: string;
}

export interface DuplicateGroup {
  feeds: FeedSource[];
  fingerprint: FeedFingerprint;
  confidence: number;
}

export interface DuplicateResolutionOptions {
  action: "keep_first" | "keep_last" | "merge" | "user_select";
  preferredFeed?: FeedSource;
  mergeCustomTitles?: boolean;
  mergeCategories?: boolean;
}

export class FeedDuplicateDetector {
  private fingerprintCache = new Map<string, FeedFingerprint>();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  /**
   * Normalize URL to detect feeds with different URLs but same content
   */
  normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);

      // Remove www. from hostname first
      if (urlObj.hostname.startsWith("www.")) {
        urlObj.hostname = urlObj.hostname.substring(4);
      }

      // Remove common tracking parameters
      const trackingParams = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "fbclid",
        "gclid",
        "ref",
        "source",
        "campaign",
      ];

      trackingParams.forEach((param) => {
        urlObj.searchParams.delete(param);
      });

      // Sort search parameters for consistency
      urlObj.searchParams.sort();

      // Convert to lowercase and remove trailing slash
      let normalized = urlObj.href.toLowerCase();
      if (
        normalized.endsWith("/") &&
        normalized !== "https://" &&
        normalized !== "http://"
      ) {
        normalized = normalized.slice(0, -1);
      }

      return normalized;
    } catch {
      // If URL parsing fails, return cleaned string
      return url.toLowerCase().trim().replace(/\/$/, "");
    }
  }

  /**
   * Generate content fingerprint from RSS channel metadata
   */
  async generateContentFingerprint(
    url: string
  ): Promise<FeedFingerprint | null> {
    try {
      // Check cache first
      const cached = this.fingerprintCache.get(url);
      if (cached && Date.now() - cached.lastUpdated < this.CACHE_TTL) {
        return cached;
      }

      // Validate feed to get metadata
      const validation = await feedValidator.validateFeed(url);

      if (!validation.isValid || !validation.title) {
        return null;
      }

      const normalizedUrl = this.normalizeUrl(url);

      // Create content hash from key metadata
      const contentData = {
        title: validation.title?.toLowerCase().trim(),
        description: validation.description?.toLowerCase().trim() || "",
        // Note: RSS link field would need to be extracted from feed content
        // For now, we'll use the normalized URL as part of the hash
        link: normalizedUrl,
      };

      const contentHash = await this.hashContent(JSON.stringify(contentData));

      const fingerprint: FeedFingerprint = {
        url,
        normalizedUrl,
        title: validation.title,
        description: validation.description,
        link: normalizedUrl, // Would be actual RSS link in full implementation
        contentHash,
        lastUpdated: Date.now(),
      };

      // Cache the fingerprint
      this.fingerprintCache.set(url, fingerprint);

      return fingerprint;
    } catch (error) {
      console.error("Failed to generate content fingerprint:", error);
      return null;
    }
  }

  /**
   * Simple hash function for content fingerprinting
   */
  private async hashContent(content: string): Promise<string> {
    // Use Web Crypto API if available, otherwise fallback to simple hash
    if (typeof crypto !== "undefined" && crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      } catch {
        // Fallback to simple hash
      }
    }

    // Simple hash function fallback
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Check if a feed is duplicate of existing feeds
   */
  async detectDuplicate(
    newFeedUrl: string,
    existingFeeds: FeedSource[]
  ): Promise<DuplicateDetectionResult> {
    const normalizedNewUrl = this.normalizeUrl(newFeedUrl);

    // First check: URL normalization
    for (const existingFeed of existingFeeds) {
      const normalizedExistingUrl = this.normalizeUrl(existingFeed.url);

      if (normalizedExistingUrl === normalizedNewUrl) {
        return {
          isDuplicate: true,
          duplicateOf: existingFeed,
          confidence: 1.0,
          reason: "Identical normalized URLs",
          normalizedUrl: normalizedNewUrl,
        };
      }
    }

    // Second check: Content fingerprinting
    const newFingerprint = await this.generateContentFingerprint(newFeedUrl);

    if (!newFingerprint) {
      return {
        isDuplicate: false,
        confidence: 0,
        reason: "Unable to generate content fingerprint",
      };
    }

    // Check against existing feeds' fingerprints
    for (const existingFeed of existingFeeds) {
      const existingFingerprint = await this.generateContentFingerprint(
        existingFeed.url
      );

      if (!existingFingerprint) continue;

      // Compare content hashes
      if (newFingerprint.contentHash === existingFingerprint.contentHash) {
        return {
          isDuplicate: true,
          duplicateOf: existingFeed,
          confidence: 0.95,
          reason: "Identical content fingerprint",
          contentFingerprint: newFingerprint.contentHash,
        };
      }

      // Compare titles (high confidence if exact match)
      if (newFingerprint.title && existingFingerprint.title) {
        const titleSimilarity = this.calculateStringSimilarity(
          newFingerprint.title.toLowerCase(),
          existingFingerprint.title.toLowerCase()
        );

        if (titleSimilarity > 0.9) {
          return {
            isDuplicate: true,
            duplicateOf: existingFeed,
            confidence: titleSimilarity,
            reason: `Very similar titles (${Math.round(
              titleSimilarity * 100
            )}% match)`,
          };
        }
      }
    }

    return {
      isDuplicate: false,
      confidence: 0,
      reason: "No duplicates detected",
    };
  }

  /**
   * Find all duplicate groups in a feed list
   */
  async findDuplicateGroups(feeds: FeedSource[]): Promise<DuplicateGroup[]> {
    const groups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    for (const feed of feeds) {
      if (processed.has(feed.url)) continue;

      const duplicates = [feed];
      const fingerprint = await this.generateContentFingerprint(feed.url);

      if (!fingerprint) {
        processed.add(feed.url);
        continue;
      }

      // Find all feeds that are duplicates of this one
      for (const otherFeed of feeds) {
        if (otherFeed.url === feed.url || processed.has(otherFeed.url))
          continue;

        const result = await this.detectDuplicate(otherFeed.url, [feed]);
        if (result.isDuplicate && result.confidence > 0.8) {
          duplicates.push(otherFeed);
          processed.add(otherFeed.url);
        }
      }

      processed.add(feed.url);

      // Only create group if there are actual duplicates
      if (duplicates.length > 1) {
        groups.push({
          feeds: duplicates,
          fingerprint,
          confidence: Math.max(...duplicates.map(() => 0.9)), // Simplified confidence calculation
        });
      }
    }

    return groups;
  }

  /**
   * Remove duplicates from feed list based on resolution options
   */
  async removeDuplicates(
    feeds: FeedSource[],
    options: DuplicateResolutionOptions = { action: "keep_first" }
  ): Promise<{
    uniqueFeeds: FeedSource[];
    removedDuplicates: Array<{
      originalFeed: FeedSource;
      duplicateOf: FeedSource;
      reason: string;
    }>;
  }> {
    const duplicateGroups = await this.findDuplicateGroups(feeds);
    const uniqueFeeds: FeedSource[] = [];
    const removedDuplicates: Array<{
      originalFeed: FeedSource;
      duplicateOf: FeedSource;
      reason: string;
    }> = [];

    const processedUrls = new Set<string>();

    for (const feed of feeds) {
      if (processedUrls.has(feed.url)) continue;

      // Find if this feed is part of a duplicate group
      const group = duplicateGroups.find((g) =>
        g.feeds.some((f) => f.url === feed.url)
      );

      if (group) {
        // Handle duplicate group
        let keepFeed: FeedSource;

        switch (options.action) {
          case "keep_first":
            keepFeed = group.feeds[0];
            break;
          case "keep_last":
            keepFeed = group.feeds[group.feeds.length - 1];
            break;
          case "user_select":
            keepFeed = options.preferredFeed || group.feeds[0];
            break;
          case "merge":
            // Create merged feed
            keepFeed = this.mergeFeeds(group.feeds, options);
            break;
          default:
            keepFeed = group.feeds[0];
        }

        uniqueFeeds.push(keepFeed);

        // Mark all feeds in group as processed and record removed ones
        for (const groupFeed of group.feeds) {
          processedUrls.add(groupFeed.url);
          if (groupFeed.url !== keepFeed.url) {
            removedDuplicates.push({
              originalFeed: groupFeed,
              duplicateOf: keepFeed,
              reason: `Duplicate detected with ${Math.round(
                group.confidence * 100
              )}% confidence`,
            });
          }
        }
      } else {
        // Not a duplicate, keep as is
        uniqueFeeds.push(feed);
        processedUrls.add(feed.url);
      }
    }

    return { uniqueFeeds, removedDuplicates };
  }

  /**
   * Merge multiple feeds into one, combining metadata
   */
  private mergeFeeds(
    feeds: FeedSource[],
    options: DuplicateResolutionOptions
  ): FeedSource {
    const baseFeed = feeds[0];

    // Merge custom titles if requested
    let customTitle = baseFeed.customTitle;
    if (options.mergeCustomTitles) {
      const titles = feeds
        .map((f) => f.customTitle)
        .filter(Boolean)
        .filter((title, index, arr) => arr.indexOf(title) === index); // Remove duplicates

      if (titles.length > 1) {
        customTitle = titles.join(" / ");
      } else if (titles.length === 1) {
        customTitle = titles[0];
      }
    }

    // Merge categories if requested
    let categoryId = baseFeed.categoryId;
    if (options.mergeCategories) {
      const categories = feeds
        .map((f) => f.categoryId)
        .filter(Boolean)
        .filter((cat, index, arr) => arr.indexOf(cat) === index); // Remove duplicates

      if (categories.length > 0) {
        categoryId = categories[0]; // Use first non-empty category
      }
    }

    return {
      url: baseFeed.url,
      customTitle,
      categoryId,
    };
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          );
        }
      }
    }

    const maxLength = Math.max(str1.length, str2.length);
    const distance = matrix[str2.length][str1.length];

    return (maxLength - distance) / maxLength;
  }

  /**
   * Clear fingerprint cache
   */
  clearCache(): void {
    this.fingerprintCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    const entries = Array.from(this.fingerprintCache.values());

    return {
      size: entries.length,
      oldestEntry:
        entries.length > 0 ? Math.min(...entries.map((e) => e.lastUpdated)) : 0,
      newestEntry:
        entries.length > 0 ? Math.max(...entries.map((e) => e.lastUpdated)) : 0,
    };
  }
}

// Export singleton instance
export const feedDuplicateDetector = new FeedDuplicateDetector();
