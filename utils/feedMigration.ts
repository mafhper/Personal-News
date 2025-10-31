/**
 * Feed Migration Utilities
 * 
 * Handles migration of feed data when default feeds are updated
 */

import type { FeedSource } from '../types';
import { autoCategorizeFeeds } from './feedCategorization';

// Version of the default feeds - increment when updating default feeds
const CURRENT_FEEDS_VERSION = '2.0.0';
const FEEDS_VERSION_KEY = 'feeds-version';

// Current default feeds
const DEFAULT_FEEDS_V2: FeedSource[] = autoCategorizeFeeds([
  // Tech
  { url: "https://www.theverge.com/rss/index.xml" },
  { url: "https://www.wired.com/feed/rss" },
  { url: "https://techcrunch.com/feed/" },
  { url: "https://www.cnet.com/rss/all/" },
  { url: "https://tecnoblog.net/feed/" },
  { url: "https://meiobit.com/feed/" },
  { url: "https://www.xda-developers.com/feed/" },
  { url: "https://itsfoss.com/rss/" },
  { url: "https://arstechnica.com/feed/" },
  { url: "https://www.omgubuntu.co.uk/feed" },
  { url: "https://www.omglinux.com/feed/" },
  { url: "https://diolinux.com.br/feed" },
  // Entertainment
  { url: "https://www.polygon.com/feed/" },
  { url: "https://jogabilida.de/feed/" },
  // Science
  { url: "https://news.mit.edu/rss/feed" },
  // Reviews
  { url: "https://www.tomsguide.com/feeds.xml" },
]);

// Legacy default feeds (v1)
const LEGACY_DEFAULT_FEEDS = [
  "https://www.theverge.com/rss/index.xml",
  "https://www.wired.com/feed/rss"
];

/**
 * Check if feeds need migration
 */
export function needsFeedMigration(): boolean {
  const currentVersion = localStorage.getItem(FEEDS_VERSION_KEY);
  return currentVersion !== CURRENT_FEEDS_VERSION;
}

/**
 * Get the current feeds version
 */
export function getCurrentFeedsVersion(): string | null {
  return localStorage.getItem(FEEDS_VERSION_KEY);
}

/**
 * Set the feeds version
 */
export function setFeedsVersion(version: string): void {
  localStorage.setItem(FEEDS_VERSION_KEY, version);
}

/**
 * Check if current feeds are only the legacy defaults
 */
export function hasOnlyLegacyFeeds(currentFeeds: FeedSource[]): boolean {
  if (currentFeeds.length !== 2) {
    return false;
  }
  
  const currentUrls = currentFeeds.map(feed => feed.url).sort();
  const legacyUrls = LEGACY_DEFAULT_FEEDS.sort();
  
  return JSON.stringify(currentUrls) === JSON.stringify(legacyUrls);
}

/**
 * Migrate feeds to the latest version
 */
export function migrateFeeds(currentFeeds: FeedSource[]): {
  feeds: FeedSource[];
  migrated: boolean;
  reason: string;
} {
  const currentVersion = getCurrentFeedsVersion();
  
  // If no version is set, this is a legacy installation
  if (!currentVersion) {
    // Check if user only has the legacy default feeds
    if (hasOnlyLegacyFeeds(currentFeeds)) {
      // User hasn't customized feeds, safe to upgrade to new defaults
      setFeedsVersion(CURRENT_FEEDS_VERSION);
      return {
        feeds: DEFAULT_FEEDS_V2,
        migrated: true,
        reason: 'Upgraded from legacy default feeds to new curated collection'
      };
    } else {
      // User has customized feeds, just set version and auto-categorize existing feeds
      const categorizedFeeds = autoCategorizeFeeds(currentFeeds);
      setFeedsVersion(CURRENT_FEEDS_VERSION);
      return {
        feeds: categorizedFeeds,
        migrated: true,
        reason: 'Applied automatic categorization to existing custom feeds'
      };
    }
  }
  
  // If version is current, no migration needed
  if (currentVersion === CURRENT_FEEDS_VERSION) {
    return {
      feeds: currentFeeds,
      migrated: false,
      reason: 'Feeds are already up to date'
    };
  }
  
  // Future version migrations would go here
  // For now, just update version and auto-categorize
  const categorizedFeeds = autoCategorizeFeeds(currentFeeds);
  setFeedsVersion(CURRENT_FEEDS_VERSION);
  
  return {
    feeds: categorizedFeeds,
    migrated: true,
    reason: 'Updated feeds version and applied categorization'
  };
}

/**
 * Get default feeds for new installations
 */
export function getDefaultFeeds(): FeedSource[] {
  return DEFAULT_FEEDS_V2;
}

/**
 * Reset feeds to defaults (for user-initiated reset)
 */
export function resetToDefaultFeeds(): FeedSource[] {
  setFeedsVersion(CURRENT_FEEDS_VERSION);
  return DEFAULT_FEEDS_V2;
}

/**
 * Add new feeds to existing collection (avoiding duplicates)
 */
export function addFeedsToCollection(
  existingFeeds: FeedSource[], 
  newFeeds: FeedSource[]
): FeedSource[] {
  const existingUrls = new Set(existingFeeds.map(feed => feed.url));
  const feedsToAdd = newFeeds.filter(feed => !existingUrls.has(feed.url));
  
  return [...existingFeeds, ...feedsToAdd];
}

/**
 * Get migration status for debugging
 */
export function getMigrationStatus(): {
  currentVersion: string | null;
  latestVersion: string;
  needsMigration: boolean;
} {
  const currentVersion = getCurrentFeedsVersion();
  return {
    currentVersion,
    latestVersion: CURRENT_FEEDS_VERSION,
    needsMigration: needsFeedMigration()
  };
}