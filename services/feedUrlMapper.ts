/**
 * Feed URL Mapper
 * 
 * Maps problematic feed URLs to working alternatives
 */

export interface FeedMapping {
  original: string;
  alternatives: string[];
  notes?: string;
}

export const FEED_MAPPINGS: FeedMapping[] = [
  {
    original: 'http://feeds.feedburner.com/tecnoblog',
    alternatives: [
      'https://tecnoblog.net/feed/',
      'https://tecnoblog.net/rss/',
    ],
    notes: 'FeedBurner redirect to direct feed'
  },
  {
    original: 'http://feeds.feedburner.com/Techcrunch',
    alternatives: [
      'https://techcrunch.com/feed/',
    ],
    notes: 'FeedBurner redirect to direct feed'
  },
  {
    original: 'http://feeds.feedburner.com/blogdoiphone/rss',
    alternatives: [
      'https://blogdoiphone.com/feed/',
    ],
    notes: 'FeedBurner redirect to direct feed'
  },
  {
    original: 'http://macmagazine.com.br/feed/',
    alternatives: [
      'https://macmagazine.com.br/feed/',
    ],
    notes: 'HTTP to HTTPS redirect'
  },
  {
    original: 'http://feeds2.feedburner.com/canaltechbr',
    alternatives: [
      'https://canaltech.com.br/rss/',
      'https://canaltech.com.br/feed/',
    ],
    notes: 'FeedBurner redirect to direct feed'
  },
  {
    original: 'http://feeds.feedburner.com/guiadopc',
    alternatives: [
      'https://guiadopc.com.br/feed/',
    ],
    notes: 'FeedBurner redirect to direct feed'
  },
  {
    original: 'http://meiobit.com/index.xml',
    alternatives: [
      'https://meiobit.com/feed/',
      'https://meiobit.com/index.xml',
    ],
    notes: 'HTTP to HTTPS redirect'
  },
  {
    original: 'http://feeds.feedburner.com/design-milk',
    alternatives: [
      'https://design-milk.com/feed/',
    ],
    notes: 'FeedBurner redirect to direct feed'
  },
  {
    original: 'http://feeds.feedburner.com/core77/blog',
    alternatives: [
      'https://www.core77.com/rss/object.xml',
    ],
    notes: 'FeedBurner redirect to direct feed'
  },
  {
    original: 'http://feeds.feedburner.com/dezeen',
    alternatives: [
      'https://www.dezeen.com/feed/',
    ],
    notes: 'FeedBurner redirect to direct feed'
  },
  {
    original: 'http://feeds.feedburner.com/JustCreativeDesignBlog',
    alternatives: [
      'https://justcreative.com/feed/',
    ],
    notes: 'FeedBurner redirect to direct feed'
  },
  {
    original: 'http://feeds2.feedburner.com/thenextweb',
    alternatives: [
      'https://thenextweb.com/feed/',
    ],
    notes: 'FeedBurner redirect to direct feed'
  },
  {
    original: 'http://feeds.feedburner.com/brainstorm9',
    alternatives: [
      'https://www.brainstorm9.com/feed/',
    ],
    notes: 'FeedBurner redirect to direct feed'
  },
];

/**
 * Get alternative URLs for a given feed URL
 */
export function getAlternativeUrls(url: string): string[] {
  const alternatives: string[] = [url];
  
  // Check for exact matches in our mapping
  const mapping = FEED_MAPPINGS.find(m => m.original === url);
  if (mapping) {
    alternatives.push(...mapping.alternatives);
  }
  
  // Try HTTPS version if HTTP
  if (url.startsWith('http://')) {
    const httpsUrl = url.replace('http://', 'https://');
    if (!alternatives.includes(httpsUrl)) {
      alternatives.push(httpsUrl);
    }
  }
  
  // Remove duplicates
  return [...new Set(alternatives)];
}

/**
 * Check if a URL is known to be problematic
 */
export function isProblematicUrl(url: string): boolean {
  return FEED_MAPPINGS.some(m => m.original === url);
}

/**
 * Get notes for a problematic URL
 */
export function getUrlNotes(url: string): string | undefined {
  const mapping = FEED_MAPPINGS.find(m => m.original === url);
  return mapping?.notes;
}