/**
 * Debug utilities for feed migration
 * 
 * Use in browser console to debug migration issues
 */

import { getMigrationStatus, migrateFeeds, resetToDefaultFeeds } from './feedMigration';
import type { FeedSource } from '../types';

// Make functions available globally for debugging
declare global {
  interface Window {
    debugMigration: {
      getStatus: () => void;
      getCurrentFeeds: () => FeedSource[];
      testMigration: () => void;
      forceReset: () => void;
      clearStorage: () => void;
    };
  }
}

const debugMigration = {
  /**
   * Get current migration status
   */
  getStatus() {
    const status = getMigrationStatus();
    console.log('🔍 Migration Status:', status);
    
    const currentFeeds = JSON.parse(localStorage.getItem('rss-feeds') || '[]');
    console.log('📡 Current Feeds:', currentFeeds);
    console.log(`📊 Feed Count: ${currentFeeds.length}`);
    
    return status;
  },

  /**
   * Get current feeds from localStorage
   */
  getCurrentFeeds(): FeedSource[] {
    const feeds = JSON.parse(localStorage.getItem('rss-feeds') || '[]');
    console.log('📡 Current Feeds:', feeds);
    return feeds;
  },

  /**
   * Test migration logic without applying changes
   */
  testMigration() {
    const currentFeeds = this.getCurrentFeeds();
    const result = migrateFeeds(currentFeeds);
    
    console.log('🧪 Migration Test Result:', result);
    console.log(`📊 Would change from ${currentFeeds.length} to ${result.feeds.length} feeds`);
    
    return result;
  },

  /**
   * Force reset to default feeds
   */
  forceReset() {
    const defaultFeeds = resetToDefaultFeeds();
    localStorage.setItem('rss-feeds', JSON.stringify(defaultFeeds));
    
    console.log('🔄 Forced reset to defaults');
    console.log(`📊 New feed count: ${defaultFeeds.length}`);
    console.log('🔄 Reload the page to see changes');
    
    return defaultFeeds;
  },

  /**
   * Clear all storage related to feeds
   */
  clearStorage() {
    // Remove feed-related items
    localStorage.removeItem('rss-feeds');
    localStorage.removeItem('feeds-version');
    localStorage.removeItem('feed-categories');
    
    // Clear validation cache
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('validation:') || key.startsWith('smart-feed-cache')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('🗑️ Storage cleared');
    console.log('🔄 Reload the page to see default feeds');
  }
};

// Make available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.debugMigration = debugMigration;
  console.log('🛠️ Debug migration tools available at window.debugMigration');
}

export { debugMigration };