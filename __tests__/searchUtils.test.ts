import { describe, it, expect, beforeEach } from 'vitest';
import { Article } from '../types';
import {
  buildSearchIndex,
  searchArticles,
  highlightSearchTerms,
  SearchIndex,
  SearchOptions
} from '../services/searchUtils';

describe('searchUtils', () => {
  let mockArticles: Article[];
  let searchIndex: SearchIndex;

  beforeEach(() => {
    mockArticles = [
      {
        title: 'React Performance Optimization Tips',
        link: 'https://example.com/react-tips',
        pubDate: new Date('2024-01-01'),
        sourceTitle: 'Tech Blog',
        description: 'Learn how to optimize React applications for better performance',
        categories: ['React', 'Performance', 'JavaScript'],
        author: 'John Doe'
      },
      {
        title: 'Vue.js vs React Comparison',
        link: 'https://example.com/vue-react',
        pubDate: new Date('2024-01-02'),
        sourceTitle: 'Dev Weekly',
        description: 'A comprehensive comparison between Vue.js and React frameworks',
        categories: ['Vue', 'React', 'Comparison'],
        author: 'Jane Smith'
      },
      {
        title: 'JavaScript ES2024 Features',
        link: 'https://example.com/js-features',
        pubDate: new Date('2024-01-03'),
        sourceTitle: 'JavaScript Today',
        description: 'Exploring the latest JavaScript features in ES2024',
        categories: ['JavaScript', 'ES2024', 'Features'],
        author: 'Bob Johnson'
      }
    ];

    searchIndex = buildSearchIndex(mockArticles);
  });

  describe('buildSearchIndex', () => {
    it('should create a search index with all required maps', () => {
      expect(searchIndex.articles).toBeInstanceOf(Map);
      expect(searchIndex.titleIndex).toBeInstanceOf(Map);
      expect(searchIndex.contentIndex).toBeInstanceOf(Map);
      expect(searchIndex.categoryIndex).toBeInstanceOf(Map);
      expect(searchIndex.sourceIndex).toBeInstanceOf(Map);
      expect(typeof searchIndex.lastUpdated).toBe('number');
    });

    it('should index all articles', () => {
      expect(searchIndex.articles.size).toBe(3);
    });

    it('should index title words correctly', () => {
      expect(searchIndex.titleIndex.has('react')).toBe(true);
      expect(searchIndex.titleIndex.has('performance')).toBe(true);
      expect(searchIndex.titleIndex.has('optimization')).toBe(true);
    });

    it('should index content words correctly', () => {
      expect(searchIndex.contentIndex.has('learn')).toBe(true);
      expect(searchIndex.contentIndex.has('optimize')).toBe(true);
      expect(searchIndex.contentIndex.has('applications')).toBe(true);
    });

    it('should index category words correctly', () => {
      expect(searchIndex.categoryIndex.has('react')).toBe(true);
      expect(searchIndex.categoryIndex.has('javascript')).toBe(true);
      expect(searchIndex.categoryIndex.has('performance')).toBe(true);
    });

    it('should index source words correctly', () => {
      expect(searchIndex.sourceIndex.has('tech')).toBe(true);
      expect(searchIndex.sourceIndex.has('blog')).toBe(true);
      expect(searchIndex.sourceIndex.has('weekly')).toBe(true);
    });

    it('should handle articles without optional fields', () => {
      const articlesWithoutOptional: Article[] = [
        {
          title: 'Simple Article',
          link: 'https://example.com/simple',
          pubDate: new Date(),
          sourceTitle: 'Simple Source'
        }
      ];

      const index = buildSearchIndex(articlesWithoutOptional);
      expect(index.articles.size).toBe(1);
      expect(index.titleIndex.has('simple')).toBe(true);
    });
  });

  describe('searchArticles', () => {
    it('should return empty results for empty query', () => {
      const results = searchArticles(searchIndex, '');
      expect(results).toHaveLength(0);
    });

    it('should return empty results for whitespace query', () => {
      const results = searchArticles(searchIndex, '   ');
      expect(results).toHaveLength(0);
    });

    it('should find articles by title', () => {
      const results = searchArticles(searchIndex, 'React');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].article.title).toContain('React');
      expect(results[0].matchedFields).toContain('title');
    });

    it('should find articles by content', () => {
      const results = searchArticles(searchIndex, 'optimize');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matchedFields).toContain('content');
    });

    it('should find articles by category', () => {
      const results = searchArticles(searchIndex, 'JavaScript');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matchedFields).toContain('category');
    });

    it('should find articles by source', () => {
      const results = searchArticles(searchIndex, 'Tech Blog');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matchedFields).toContain('source');
    });

    it('should rank results by relevance', () => {
      const results = searchArticles(searchIndex, 'React');
      expect(results[0].score).toBeGreaterThanOrEqual(results[1]?.score || 0);
    });

    it('should support fuzzy matching', () => {
      const results = searchArticles(searchIndex, 'Reakt'); // Misspelled "React"
      expect(results.length).toBeGreaterThan(0);
    });

    it('should respect search options', () => {
      const options: SearchOptions = {
        includeTitle: true,
        includeContent: false,
        includeCategories: false,
        includeSource: false
      };

      const results = searchArticles(searchIndex, 'optimize', options);
      // Should not find results since "optimize" is only in content
      expect(results).toHaveLength(0);
    });

    it('should handle multiple query words', () => {
      const results = searchArticles(searchIndex, 'React Performance');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].article.title).toContain('React');
      expect(results[0].article.title).toContain('Performance');
    });

    it('should adjust fuzzy threshold', () => {
      const strictResults = searchArticles(searchIndex, 'Reakt', { fuzzyThreshold: 0.9 });
      const lenientResults = searchArticles(searchIndex, 'Reakt', { fuzzyThreshold: 0.5 });

      expect(lenientResults.length).toBeGreaterThanOrEqual(strictResults.length);
    });
  });

  describe('highlightSearchTerms', () => {
    it('should highlight single search term', () => {
      const text = 'React is a JavaScript library';
      const highlighted = highlightSearchTerms(text, 'React');
      expect(highlighted).toBe('<mark>React</mark> is a JavaScript library');
    });

    it('should highlight multiple search terms', () => {
      const text = 'React is a JavaScript library';
      const highlighted = highlightSearchTerms(text, 'React JavaScript');
      expect(highlighted).toContain('<mark>React</mark>');
      expect(highlighted).toContain('<mark>JavaScript</mark>');
    });

    it('should be case insensitive', () => {
      const text = 'React is a JavaScript library';
      const highlighted = highlightSearchTerms(text, 'react');
      expect(highlighted).toBe('<mark>React</mark> is a JavaScript library');
    });

    it('should handle empty query', () => {
      const text = 'React is a JavaScript library';
      const highlighted = highlightSearchTerms(text, '');
      expect(highlighted).toBe(text);
    });

    it('should escape special regex characters', () => {
      const text = 'Price: $100 (USD)';
      const highlighted = highlightSearchTerms(text, '$100');
      expect(highlighted).toBe('Price: <mark>$100</mark> (USD)');
    });

    it('should handle terms not found in text', () => {
      const text = 'React is a JavaScript library';
      const highlighted = highlightSearchTerms(text, 'Vue');
      expect(highlighted).toBe(text);
    });
  });

  describe('edge cases', () => {
    it('should handle empty articles array', () => {
      const emptyIndex = buildSearchIndex([]);
      expect(emptyIndex.articles.size).toBe(0);

      const results = searchArticles(emptyIndex, 'test');
      expect(results).toHaveLength(0);
    });

    it('should handle articles with empty strings', () => {
      const articlesWithEmpty: Article[] = [
        {
          title: '',
          link: 'https://example.com/empty',
          pubDate: new Date(),
          sourceTitle: '',
          description: '',
          categories: [''],
          author: ''
        }
      ];

      const index = buildSearchIndex(articlesWithEmpty);
      expect(index.articles.size).toBe(1);

      const results = searchArticles(index, 'test');
      expect(results).toHaveLength(0);
    });

    it('should handle very long queries', () => {
      const longQuery = 'a'.repeat(1000);
      const results = searchArticles(searchIndex, longQuery);
      expect(results).toHaveLength(0);
    });

    it('should handle special characters in queries', () => {
      const results = searchArticles(searchIndex, 'React@#$%');
      // Should still find React-related articles
      expect(results.length).toBeGreaterThan(0);
    });
  });
});
