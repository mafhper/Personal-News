/**
 * feedPreloader.ts
 * Sistema simplificado de pré-carregamento de feeds RSS
 */

import { parseRssUrl } from './rssParser';
import { isCacheFresh } from './smartCache';
import { getLogger } from './logger';
import type { FeedSource } from '../types';

const logger = getLogger();

interface FeedUsageStats {
  url: string;
  accessCount: number;
  lastAccessed: number;
  avgLoadTime: number;
  successRate: number;
}

class FeedPreloader {
  private usageStats = new Map<string, FeedUsageStats>();
  private isPreloading = false;
  private preloadController: AbortController | null = null;

  recordFeedAccess(url: string, loadTime: number, success: boolean) {
    const stats = this.usageStats.get(url) || {
      url,
      accessCount: 0,
      lastAccessed: 0,
      avgLoadTime: 0,
      successRate: 1,
    };

    stats.accessCount++;
    stats.lastAccessed = Date.now();
    stats.avgLoadTime = (stats.avgLoadTime + loadTime) / 2;
    stats.successRate = (stats.successRate + (success ? 1 : 0)) / 2;

    this.usageStats.set(url, stats);
    this.saveUsageStats();
  }

  async preloadLikelyFeeds(feeds: FeedSource[]) {
    if (this.isPreloading || feeds.length === 0) return;

    this.isPreloading = true;
    this.preloadController = new AbortController();

    try {
      const feedsToPreload = feeds.filter(feed => !isCacheFresh(feed.url)).slice(0, 5);
      
      if (feedsToPreload.length > 0) {
        logger.info(`Pré-carregando ${feedsToPreload.length} feeds`);
        
        const concurrentLimit = 3;
        for (let i = 0; i < feedsToPreload.length; i += concurrentLimit) {
          const batch = feedsToPreload.slice(i, i + concurrentLimit);
          
          await Promise.allSettled(
            batch.map(feed => this.preloadFeed(feed))
          );

          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    } catch (error) {
      logger.error('Erro no pré-carregamento', error as Error);
    } finally {
      this.isPreloading = false;
      this.preloadController = null;
    }
  }

  stopPreloading() {
    if (this.preloadController) {
      this.preloadController.abort();
    }
    this.isPreloading = false;
  }

  private async preloadFeed(feed: FeedSource) {
    if (isCacheFresh(feed.url)) return;

    const startTime = Date.now();
    
    try {
      await parseRssUrl(feed.url, {
        timeout: 5000,
        signal: this.preloadController?.signal,
      });

      const loadTime = Date.now() - startTime;
      this.recordFeedAccess(feed.url, loadTime, true);

    } catch (error) {
      const loadTime = Date.now() - startTime;
      this.recordFeedAccess(feed.url, loadTime, false);
    }
  }

  private saveUsageStats() {
    try {
      const stats = Array.from(this.usageStats.entries());
      localStorage.setItem('feed-usage-stats', JSON.stringify(stats));
    } catch (error) {
      // Silently fail
    }
  }

  loadUsageStats() {
    try {
      const stored = localStorage.getItem('feed-usage-stats');
      if (stored) {
        const stats = JSON.parse(stored);
        this.usageStats = new Map(stats);
      }
    } catch (error) {
      // Silently fail
    }
  }

  getUsageStats(): FeedUsageStats[] {
    return Array.from(this.usageStats.values());
  }
}

export const feedPreloader = new FeedPreloader();
feedPreloader.loadUsageStats();

let idleTimer: NodeJS.Timeout;

export const schedulePreload = (feeds: FeedSource[]) => {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    feedPreloader.preloadLikelyFeeds(feeds);
  }, 5000);
};