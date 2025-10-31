/**
 * Suggested Feeds
 * 
 * Curated list of high-quality RSS feeds organized by category
 */

import type { FeedSource } from '../types';

export interface SuggestedFeedCategory {
  id: string;
  name: string;
  description: string;
  feeds: SuggestedFeed[];
}

export interface SuggestedFeed extends FeedSource {
  title: string;
  description: string;
  language: 'pt' | 'en';
  quality: 'high' | 'medium';
  updateFrequency: 'daily' | 'weekly' | 'hourly';
}

export const SUGGESTED_FEEDS: SuggestedFeedCategory[] = [
  {
    id: 'tech',
    name: 'Tecnologia',
    description: 'Notícias e análises sobre tecnologia, gadgets e inovação',
    feeds: [
      {
        url: 'https://www.theverge.com/rss/index.xml',
        title: 'The Verge',
        description: 'Tecnologia, ciência, arte e cultura. Cobertura completa do mundo tech.',
        language: 'en',
        quality: 'high',
        updateFrequency: 'hourly',
        categoryId: 'tech',
        customTitle: 'The Verge'
      },
      {
        url: 'https://www.wired.com/feed/rss',
        title: 'Wired',
        description: 'Como a tecnologia está transformando o mundo.',
        language: 'en',
        quality: 'high',
        updateFrequency: 'daily',
        categoryId: 'tech',
        customTitle: 'Wired'
      },
      {
        url: 'https://techcrunch.com/feed/',
        title: 'TechCrunch',
        description: 'Startups, venture capital e tecnologia emergente.',
        language: 'en',
        quality: 'high',
        updateFrequency: 'hourly',
        categoryId: 'tech',
        customTitle: 'TechCrunch'
      },
      {
        url: 'https://www.cnet.com/rss/all/',
        title: 'CNET',
        description: 'Reviews de produtos, notícias tech e guias de compra.',
        language: 'en',
        quality: 'high',
        updateFrequency: 'daily',
        categoryId: 'tech',
        customTitle: 'CNET'
      },
      {
        url: 'https://tecnoblog.net/feed/',
        title: 'Tecnoblog',
        description: 'O maior blog de tecnologia do Brasil.',
        language: 'pt',
        quality: 'high',
        updateFrequency: 'daily',
        categoryId: 'tech',
        customTitle: 'Tecnoblog'
      },
      {
        url: 'https://meiobit.com/feed/',
        title: 'Meio Bit',
        description: 'Tecnologia com humor e irreverência.',
        language: 'pt',
        quality: 'high',
        updateFrequency: 'daily',
        categoryId: 'tech',
        customTitle: 'Meio Bit'
      },
      {
        url: 'https://www.xda-developers.com/feed/',
        title: 'XDA Developers',
        description: 'Android, desenvolvimento e customização mobile.',
        language: 'en',
        quality: 'high',
        updateFrequency: 'daily',
        categoryId: 'tech',
        customTitle: 'XDA Developers'
      },
      {
        url: 'https://itsfoss.com/rss/',
        title: "It's FOSS",
        description: 'Linux, open source e software livre.',
        language: 'en',
        quality: 'high',
        updateFrequency: 'daily',
        categoryId: 'tech',
        customTitle: "It's FOSS"
      },
      {
        url: 'https://arstechnica.com/feed/',
        title: 'Ars Technica',
        description: 'Análises técnicas profundas e notícias de tecnologia.',
        language: 'en',
        quality: 'high',
        updateFrequency: 'daily',
        categoryId: 'tech',
        customTitle: 'Ars Technica'
      },
      {
        url: 'https://www.omgubuntu.co.uk/feed',
        title: 'OMG! Ubuntu!',
        description: 'Notícias, dicas e tutoriais sobre Ubuntu Linux.',
        language: 'en',
        quality: 'high',
        updateFrequency: 'daily',
        categoryId: 'tech',
        customTitle: 'OMG! Ubuntu!'
      },
      {
        url: 'https://www.omglinux.com/feed/',
        title: 'OMG! Linux',
        description: 'Notícias e novidades do mundo Linux.',
        language: 'en',
        quality: 'high',
        updateFrequency: 'daily',
        categoryId: 'tech',
        customTitle: 'OMG! Linux'
      },
      {
        url: 'https://diolinux.com.br/feed',
        title: 'Diolinux',
        description: 'Linux, open source e tecnologia em português.',
        language: 'pt',
        quality: 'high',
        updateFrequency: 'daily',
        categoryId: 'tech',
        customTitle: 'Diolinux'
      }
    ]
  },
  {
    id: 'entertainment',
    name: 'Entretenimento',
    description: 'Games, cultura pop e entretenimento digital',
    feeds: [
      {
        url: 'https://www.polygon.com/feed/',
        title: 'Polygon',
        description: 'Games, entretenimento e cultura nerd.',
        language: 'en',
        quality: 'high',
        updateFrequency: 'daily',
        categoryId: 'entertainment',
        customTitle: 'Polygon'
      },
      {
        url: 'https://jogabilida.de/feed/',
        title: 'Jogabilidade',
        description: 'O maior portal de games do Brasil.',
        language: 'pt',
        quality: 'high',
        updateFrequency: 'daily',
        categoryId: 'entertainment',
        customTitle: 'Jogabilidade'
      }
    ]
  },
  {
    id: 'science',
    name: 'Ciência',
    description: 'Descobertas científicas, pesquisa e inovação',
    feeds: [
      {
        url: 'https://news.mit.edu/rss/feed',
        title: 'MIT News',
        description: 'Pesquisas e descobertas do MIT.',
        language: 'en',
        quality: 'high',
        updateFrequency: 'daily',
        categoryId: 'science',
        customTitle: 'MIT News'
      }
    ]
  },
  {
    id: 'reviews',
    name: 'Reviews',
    description: 'Análises e reviews de produtos e serviços',
    feeds: [
      {
        url: 'https://www.tomsguide.com/feeds.xml',
        title: "Tom's Guide",
        description: 'Reviews detalhados de produtos tech e guias de compra.',
        language: 'en',
        quality: 'high',
        updateFrequency: 'daily',
        categoryId: 'reviews',
        customTitle: "Tom's Guide"
      }
    ]
  }
];

/**
 * Get all suggested feeds as a flat array
 */
export function getAllSuggestedFeeds(): SuggestedFeed[] {
  return SUGGESTED_FEEDS.flatMap(category => category.feeds);
}

/**
 * Get suggested feeds by category
 */
export function getSuggestedFeedsByCategory(categoryId: string): SuggestedFeed[] {
  const category = SUGGESTED_FEEDS.find(cat => cat.id === categoryId);
  return category?.feeds || [];
}

/**
 * Get suggested feeds by language
 */
export function getSuggestedFeedsByLanguage(language: 'pt' | 'en'): SuggestedFeed[] {
  return getAllSuggestedFeeds().filter(feed => feed.language === language);
}

/**
 * Get high-quality suggested feeds
 */
export function getHighQualitySuggestedFeeds(): SuggestedFeed[] {
  return getAllSuggestedFeeds().filter(feed => feed.quality === 'high');
}

/**
 * Search suggested feeds by title or description
 */
export function searchSuggestedFeeds(query: string): SuggestedFeed[] {
  const lowercaseQuery = query.toLowerCase();
  return getAllSuggestedFeeds().filter(feed => 
    feed.title.toLowerCase().includes(lowercaseQuery) ||
    feed.description.toLowerCase().includes(lowercaseQuery)
  );
}