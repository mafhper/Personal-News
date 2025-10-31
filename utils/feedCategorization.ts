/**
 * Feed Categorization Utilities
 * 
 * Automatically categorizes feeds based on their domain and content type
 */

export interface FeedCategoryMapping {
  domain: string;
  categoryId: string;
  customTitle?: string;
}

export const FEED_CATEGORY_MAPPINGS: FeedCategoryMapping[] = [
  // Tech feeds
  { domain: 'theverge.com', categoryId: 'tech', customTitle: 'The Verge' },
  { domain: 'wired.com', categoryId: 'tech', customTitle: 'Wired' },
  { domain: 'techcrunch.com', categoryId: 'tech', customTitle: 'TechCrunch' },
  { domain: 'cnet.com', categoryId: 'tech', customTitle: 'CNET' },
  { domain: 'tecnoblog.net', categoryId: 'tech', customTitle: 'Tecnoblog' },
  { domain: 'meiobit.com', categoryId: 'tech', customTitle: 'Meio Bit' },
  { domain: 'xda-developers.com', categoryId: 'tech', customTitle: 'XDA Developers' },
  { domain: 'itsfoss.com', categoryId: 'tech', customTitle: "It's FOSS" },
  { domain: 'arstechnica.com', categoryId: 'tech', customTitle: 'Ars Technica' },
  { domain: 'omgubuntu.co.uk', categoryId: 'tech', customTitle: 'OMG! Ubuntu!' },
  { domain: 'omglinux.com', categoryId: 'tech', customTitle: 'OMG! Linux' },
  { domain: 'diolinux.com.br', categoryId: 'tech', customTitle: 'Diolinux' },
  
  // Entertainment feeds
  { domain: 'polygon.com', categoryId: 'entertainment', customTitle: 'Polygon' },
  { domain: 'jogabilida.de', categoryId: 'entertainment', customTitle: 'Jogabilidade' },
  
  // Science feeds
  { domain: 'news.mit.edu', categoryId: 'science', customTitle: 'MIT News' },
  
  // Reviews feeds
  { domain: 'tomsguide.com', categoryId: 'reviews', customTitle: "Tom's Guide" },
];

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Get category ID for a feed URL
 */
export function getCategoryForFeed(url: string): string | undefined {
  const domain = extractDomain(url);
  const mapping = FEED_CATEGORY_MAPPINGS.find(m => m.domain === domain);
  return mapping?.categoryId;
}

/**
 * Get custom title for a feed URL
 */
export function getCustomTitleForFeed(url: string): string | undefined {
  const domain = extractDomain(url);
  const mapping = FEED_CATEGORY_MAPPINGS.find(m => m.domain === domain);
  return mapping?.customTitle;
}

/**
 * Auto-categorize a list of feeds
 */
export function autoCategorizeFeeds<T extends { url: string; categoryId?: string; customTitle?: string }>(
  feeds: T[]
): T[] {
  return feeds.map(feed => {
    // Don't override existing categorization
    if (feed.categoryId) {
      return feed;
    }

    const categoryId = getCategoryForFeed(feed.url);
    const customTitle = getCustomTitleForFeed(feed.url);

    return {
      ...feed,
      ...(categoryId && { categoryId }),
      ...(customTitle && !feed.customTitle && { customTitle }),
    };
  });
}

/**
 * Get feeds by category
 */
export function getFeedsByCategory<T extends { url: string; categoryId?: string }>(
  feeds: T[],
  categoryId: string
): T[] {
  if (categoryId === 'all') {
    return feeds;
  }
  
  return feeds.filter(feed => feed.categoryId === categoryId);
}

/**
 * Get available categories from feeds
 */
export function getAvailableCategories<T extends { categoryId?: string }>(feeds: T[]): string[] {
  const categories = new Set<string>();
  
  feeds.forEach(feed => {
    if (feed.categoryId) {
      categories.add(feed.categoryId);
    }
  });
  
  return Array.from(categories);
}