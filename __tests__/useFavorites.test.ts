import { renderHook, act } from '@testing-library/react';
import { useFavorites } from '../hooks/useFavorites';
import type { Article } from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock btoa for Node.js environment
global.btoa = (str: string) => Buffer.from(str).toString('base64');

describe('useFavorites', () => {
  const mockArticle1: Article = {
    title: 'Test Article 1',
    link: 'https://example.com/article1',
    pubDate: new Date('2024-01-01'),
    sourceTitle: 'Test Source',
    imageUrl: 'https://example.com/image1.jpg',
    description: 'Test description 1',
    author: 'Test Author',
    categories: ['Tech', 'News']
  };

  const mockArticle2: Article = {
    title: 'Test Article 2',
    link: 'https://example.com/article2',
    pubDate: new Date('2024-01-02'),
    sourceTitle: 'Another Source',
    description: 'Test description 2',
    categories: ['Science']
  };

  beforeEach(() => {
    localStorage.clear();
  });

  describe('Basic functionality', () => {
    it('should initialize with empty favorites', () => {
      const { result } = renderHook(() => useFavorites());

      expect(result.current.favorites).toEqual([]);
      expect(result.current.getFavoritesCount()).toBe(0);
    });

    it('should add article to favorites', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addToFavorites(mockArticle1);
      });

      expect(result.current.favorites).toHaveLength(1);
      expect(result.current.favorites[0].title).toBe('Test Article 1');
      expect(result.current.isFavorite(mockArticle1)).toBe(true);
      expect(result.current.getFavoritesCount()).toBe(1);
    });

    it('should not add duplicate favorites', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addToFavorites(mockArticle1);
      });

      expect(result.current.favorites).toHaveLength(1);

      act(() => {
        result.current.addToFavorites(mockArticle1); // Try to add again
      });

      expect(result.current.favorites).toHaveLength(1);
      expect(result.current.getFavoritesCount()).toBe(1);
    });

    it('should remove article from favorites', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addToFavorites(mockArticle1);
      });

      expect(result.current.isFavorite(mockArticle1)).toBe(true);

      act(() => {
        result.current.removeFromFavorites(mockArticle1);
      });

      expect(result.current.favorites).toHaveLength(0);
      expect(result.current.isFavorite(mockArticle1)).toBe(false);
      expect(result.current.getFavoritesCount()).toBe(0);
    });

    it('should toggle favorite status', () => {
      const { result } = renderHook(() => useFavorites());

      // Toggle on
      act(() => {
        result.current.toggleFavorite(mockArticle1);
      });

      expect(result.current.isFavorite(mockArticle1)).toBe(true);
      expect(result.current.getFavoritesCount()).toBe(1);

      // Toggle off
      act(() => {
        result.current.toggleFavorite(mockArticle1);
      });

      expect(result.current.isFavorite(mockArticle1)).toBe(false);
      expect(result.current.getFavoritesCount()).toBe(0);
    });

    it('should clear all favorites', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addToFavorites(mockArticle1);
        result.current.addToFavorites(mockArticle2);
      });

      expect(result.current.getFavoritesCount()).toBe(2);

      act(() => {
        result.current.clearAllFavorites();
      });

      expect(result.current.favorites).toHaveLength(0);
      expect(result.current.getFavoritesCount()).toBe(0);
    });
  });

  describe('Filtering functionality', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addToFavorites(mockArticle1);
        result.current.addToFavorites(mockArticle2);
      });
    });

    it('should filter favorites by category', () => {
      const { result } = renderHook(() => useFavorites());

      const techFavorites = result.current.getFavoritesByCategory('Tech');
      const scienceFavorites = result.current.getFavoritesByCategory('Science');
      const allFavorites = result.current.getFavoritesByCategory('All');

      expect(techFavorites).toHaveLength(1);
      expect(techFavorites[0].title).toBe('Test Article 1');

      expect(scienceFavorites).toHaveLength(1);
      expect(scienceFavorites[0].title).toBe('Test Article 2');

      expect(allFavorites).toHaveLength(2);
    });

    it('should filter favorites by source', () => {
      const { result } = renderHook(() => useFavorites());

      const testSourceFavorites = result.current.getFavoritesBySource('Test Source');
      const anotherSourceFavorites = result.current.getFavoritesBySource('Another Source');

      expect(testSourceFavorites).toHaveLength(1);
      expect(testSourceFavorites[0].title).toBe('Test Article 1');

      expect(anotherSourceFavorites).toHaveLength(1);
      expect(anotherSourceFavorites[0].title).toBe('Test Article 2');
    });

    it('should filter favorites by author', () => {
      const { result } = renderHook(() => useFavorites());

      const authorFavorites = result.current.getFavoritesBySource('Test Author');

      expect(authorFavorites).toHaveLength(1);
      expect(authorFavorites[0].title).toBe('Test Article 1');
    });
  });

  describe('Import/Export functionality', () => {
    it('should export favorites as JSON', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addToFavorites(mockArticle1);
      });

      const exportedData = result.current.exportFavorites();
      const parsedData = JSON.parse(exportedData);

      expect(parsedData.articles).toHaveLength(1);
      expect(parsedData.articles[0].title).toBe('Test Article 1');
      expect(parsedData.version).toBe('1.0');
      expect(parsedData.exportedAt).toBeDefined();
    });

    it('should import favorites from JSON', () => {
      const { result } = renderHook(() => useFavorites());

      const importData = {
        articles: [
          {
            id: 'test-id-1',
            title: 'Imported Article',
            link: 'https://example.com/imported',
            pubDate: '2024-01-01T00:00:00.000Z',
            sourceTitle: 'Imported Source',
            favoritedAt: '2024-01-01T00:00:00.000Z'
          }
        ],
        lastUpdated: '2024-01-01T00:00:00.000Z'
      };

      let success: boolean;
      act(() => {
        success = result.current.importFavorites(JSON.stringify(importData));
      });

      expect(success!).toBe(true);
      expect(result.current.favorites).toHaveLength(1);
      expect(result.current.favorites[0].title).toBe('Imported Article');
    });

    it('should handle invalid import data', () => {
      const { result } = renderHook(() => useFavorites());

      const invalidData = '{"invalid": "data"}';

      let success: boolean;
      act(() => {
        success = result.current.importFavorites(invalidData);
      });

      expect(success!).toBe(false);
      expect(result.current.favorites).toHaveLength(0);
    });

    it('should handle malformed JSON import', () => {
      const { result } = renderHook(() => useFavorites());

      const malformedJson = '{"articles": [invalid json}';

      let success: boolean;
      act(() => {
        success = result.current.importFavorites(malformedJson);
      });

      expect(success!).toBe(false);
      expect(result.current.favorites).toHaveLength(0);
    });
  });

  describe('Persistence', () => {
    it('should persist favorites to localStorage', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addToFavorites(mockArticle1);
      });

      const storedData = localStorage.getItem('favorites-data');
      expect(storedData).toBeTruthy();

      const parsedData = JSON.parse(storedData!);
      expect(parsedData.articles).toHaveLength(1);
      expect(parsedData.articles[0].title).toBe('Test Article 1');
    });

    it('should load favorites from localStorage on initialization', () => {
      // Pre-populate localStorage
      const initialData = {
        articles: [
          {
            id: 'test-id-1',
            title: 'Persisted Article',
            link: 'https://example.com/persisted',
            pubDate: '2024-01-01T00:00:00.000Z',
            sourceTitle: 'Persisted Source',
            favoritedAt: '2024-01-01T00:00:00.000Z'
          }
        ],
        lastUpdated: '2024-01-01T00:00:00.000Z'
      };

      localStorage.setItem('favorites-data', JSON.stringify(initialData));

      const { result } = renderHook(() => useFavorites());

      expect(result.current.favorites).toHaveLength(1);
      expect(result.current.favorites[0].title).toBe('Persisted Article');
    });
  });

  describe('Article ID generation', () => {
    it('should generate consistent IDs for same article', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addToFavorites(mockArticle1);
      });

      const firstId = result.current.favorites[0].id;

      act(() => {
        result.current.removeFromFavorites(mockArticle1);
      });

      act(() => {
        result.current.addToFavorites(mockArticle1);
      });

      const secondId = result.current.favorites[0].id;
      expect(firstId).toBe(secondId);
    });

    it('should generate different IDs for different articles', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addToFavorites(mockArticle1);
        result.current.addToFavorites(mockArticle2);
      });

      const id1 = result.current.favorites.find(f => f.title === 'Test Article 1')?.id;
      const id2 = result.current.favorites.find(f => f.title === 'Test Article 2')?.id;

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });
  });

  describe('Favorites ordering', () => {
    it('should add new favorites to the beginning of the list', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addToFavorites(mockArticle1);
      });

      act(() => {
        result.current.addToFavorites(mockArticle2);
      });

      expect(result.current.favorites[0].title).toBe('Test Article 2'); // Most recent first
      expect(result.current.favorites[1].title).toBe('Test Article 1');
    });
  });
});
