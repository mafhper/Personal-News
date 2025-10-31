/**
 * feedValidator.test.ts
 *
 * Testes para o serviço de validação de feeds RSS
 *
 * @author Personal News Dashboard
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { feedValidator, getFeedStatusIcon, getFeedStatusColor, getFeedStatusText } from '../services/feedValidator';

// Mock do fetch global
global.fetch = vi.fn();

describe('FeedValidator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    feedValidator.clearCache();
  });

  describe('validateFeed', () => {
    it('should validate a valid RSS feed', async () => {
      const mockRSSContent = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>Test Feed</title>
            <description>Test Description</description>
            <item>
              <title>Test Article</title>
              <description>Test article content</description>
            </item>
          </channel>
        </rss>`;

      (global.fetch as any).mockResolvedValueOnce({
        status: 200,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/rss+xml' : null
        },
        text: () => Promise.resolve(mockRSSContent)
      });

      const result = await feedValidator.validateFeed('https://example.com/rss.xml');

      expect(result.isValid).toBe(true);
      expect(result.status).toBe('valid');
      expect(result.title).toBe('Test Feed');
      expect(result.description).toBe('Test Description');
      expect(result.responseTime).toBeGreaterThan(0);
    });

    it('should validate a valid Atom feed', async () => {
      const mockAtomContent = `<?xml version="1.0" encoding="UTF-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Test Atom Feed</title>
          <subtitle>Test Atom Description</subtitle>
          <entry>
            <title>Test Entry</title>
            <summary>Test entry content</summary>
          </entry>
        </feed>`;

      (global.fetch as any).mockResolvedValueOnce({
        status: 200,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/atom+xml' : null
        },
        text: () => Promise.resolve(mockAtomContent)
      });

      const result = await feedValidator.validateFeed('https://example.com/atom.xml');

      expect(result.isValid).toBe(true);
      expect(result.status).toBe('valid');
      expect(result.title).toBe('Test Atom Feed');
      expect(result.description).toBe('Test Atom Description');
    });

    it('should handle HTTP errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: () => null
        }
      });

      const result = await feedValidator.validateFeed('https://example.com/notfound.xml');

      expect(result.isValid).toBe(false);
      expect(result.status).toBe('invalid');
      expect(result.statusCode).toBe(404);
      expect(result.error).toContain('HTTP 404');
    });

    it('should handle network timeouts', async () => {
      (global.fetch as any).mockImplementationOnce(() =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new DOMException('Aborted', 'AbortError')), 100);
        })
      );

      const result = await feedValidator.validateFeed('https://slow-example.com/rss.xml');

      expect(result.isValid).toBe(false);
      expect(result.status).toBe('timeout');
      expect(result.error).toContain('Timeout');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await feedValidator.validateFeed('https://unreachable.com/rss.xml');

      expect(result.isValid).toBe(false);
      expect(result.status).toBe('network_error');
      expect(result.error).toBe('Network error');
    });

    it('should handle invalid XML content', async () => {
      const invalidXML = 'This is not XML content';

      (global.fetch as any).mockResolvedValueOnce({
        status: 200,
        headers: {
          get: () => null
        },
        text: () => Promise.resolve(invalidXML)
      });

      const result = await feedValidator.validateFeed('https://example.com/invalid.xml');

      expect(result.isValid).toBe(false);
      expect(result.status).toBe('parse_error');
    });

    it('should handle non-feed XML content', async () => {
      const nonFeedXML = `<?xml version="1.0"?>
        <root>
          <data>This is valid XML but not a feed</data>
        </root>`;

      (global.fetch as any).mockResolvedValueOnce({
        status: 200,
        headers: {
          get: () => null
        },
        text: () => Promise.resolve(nonFeedXML)
      });

      const result = await feedValidator.validateFeed('https://example.com/notfeed.xml');

      expect(result.isValid).toBe(false);
      expect(result.status).toBe('parse_error');
      expect(result.error).toContain('Não é um feed RSS ou Atom válido');
    });
  });

  describe('validateFeeds', () => {
    it('should validate multiple feeds in parallel', async () => {
      const mockRSSContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Test Feed</title>
            <description>Test Description</description>
          </channel>
        </rss>`;

      (global.fetch as any)
        .mockResolvedValueOnce({
          status: 200,
          headers: { get: () => null },
          text: () => Promise.resolve(mockRSSContent)
        })
        .mockResolvedValueOnce({
          status: 404,
          statusText: 'Not Found',
          headers: { get: () => null }
        });

      const urls = ['https://example1.com/rss.xml', 'https://example2.com/rss.xml'];
      const results = await feedValidator.validateFeeds(urls);

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe('valid');
      expect(results[1].status).toBe('invalid');
    });
  });

  describe('cache functionality', () => {
    it('should cache validation results', async () => {
      const mockRSSContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel><title>Test</title><description>Test</description></channel>
        </rss>`;

      (global.fetch as any).mockResolvedValueOnce({
        status: 200,
        headers: { get: () => null },
        text: () => Promise.resolve(mockRSSContent)
      });

      // Primeira chamada
      const result1 = await feedValidator.validateFeed('https://example.com/rss.xml');

      // Segunda chamada (deve usar cache)
      const result2 = await feedValidator.validateFeed('https://example.com/rss.xml');

      expect(result1.status).toBe('valid');
      expect(result2.status).toBe('valid');
      expect(global.fetch).toHaveBeenCalledTimes(1); // Apenas uma chamada HTTP
    });

    it('should clear cache when requested', async () => {
      const mockRSSContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel><title>Test</title><description>Test</description></channel>
        </rss>`;

      (global.fetch as any).mockResolvedValue({
        status: 200,
        headers: { get: () => null },
        text: () => Promise.resolve(mockRSSContent)
      });

      // Primeira chamada
      await feedValidator.validateFeed('https://example.com/rss.xml');

      // Limpar cache
      feedValidator.clearCache();

      // Segunda chamada (deve fazer nova requisição)
      await feedValidator.validateFeed('https://example.com/rss.xml');

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('utility functions', () => {
    it('should return correct status icons', () => {
      expect(getFeedStatusIcon('valid')).toBe('✅');
      expect(getFeedStatusIcon('invalid')).toBe('❌');
      expect(getFeedStatusIcon('timeout')).toBe('⏱️');
      expect(getFeedStatusIcon('network_error')).toBe('🌐');
      expect(getFeedStatusIcon('parse_error')).toBe('📄');
      expect(getFeedStatusIcon('checking')).toBe('🔄');
    });

    it('should return correct status colors', () => {
      expect(getFeedStatusColor('valid')).toBe('text-green-500');
      expect(getFeedStatusColor('invalid')).toBe('text-red-500');
      expect(getFeedStatusColor('timeout')).toBe('text-yellow-500');
      expect(getFeedStatusColor('network_error')).toBe('text-orange-500');
      expect(getFeedStatusColor('parse_error')).toBe('text-purple-500');
      expect(getFeedStatusColor('checking')).toBe('text-blue-500');
    });

    it('should return correct status text', () => {
      expect(getFeedStatusText('valid')).toBe('Funcionando');
      expect(getFeedStatusText('invalid')).toBe('Erro HTTP');
      expect(getFeedStatusText('timeout')).toBe('Timeout');
      expect(getFeedStatusText('network_error')).toBe('Erro de Rede');
      expect(getFeedStatusText('parse_error')).toBe('Feed Inválido');
      expect(getFeedStatusText('checking')).toBe('Verificando...');
    });
  });

  describe('validation summary', () => {
    it('should provide correct validation summary', async () => {
      const mockRSSContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel><title>Test</title><description>Test</description></channel>
        </rss>`;

      (global.fetch as any)
        .mockResolvedValueOnce({
          status: 200,
          headers: { get: () => null },
          text: () => Promise.resolve(mockRSSContent)
        })
        .mockResolvedValueOnce({
          status: 404,
          statusText: 'Not Found',
          headers: { get: () => null }
        });

      const urls = ['https://valid.com/rss.xml', 'https://invalid.com/rss.xml'];
      await feedValidator.validateFeeds(urls);

      const summary = feedValidator.getValidationSummary(urls);

      expect(summary.total).toBe(2);
      expect(summary.valid).toBe(1);
      expect(summary.invalid).toBe(1);
      expect(summary.checking).toBe(0);
      expect(summary.lastValidation).toBeGreaterThan(0);
    });
  });
});
