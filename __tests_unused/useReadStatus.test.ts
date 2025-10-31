import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useReadStatus } from '../hooks/useReadStatus';
import type { Article } from '../types';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
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
  value: mockLocalStorage
});

// Mock articles for testing
const mockArticles: Article[] = [
  {
    title: 'Test Article 1',
    link: 'https://example.com/article1',
    pubDate: new Date('2024-01-01'),
    sourceTitle: 'Test Source',
    description: 'Test description 1',
    author: 'Test Author 1'
  },
  {
    title: 'Test Article 2',
    link: 'https://example.com/article2',
    pubDate: new Date('2024-01-02'),
    sourceTitle: 'Test Source',
    description: 'Test description 2',
    author: 'Test Author 2'
  },
  {
    title: 'Test Article 3',
    link: 'https://example.com/article3',
    pubDate: new Date('2024-01-03'),
    sourceTitle: 'Test Source',
    description: 'Test description 3',
    author: 'Test Author 3'
  }
];

describe('useReadStatus', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe('isArticleRead', () => {
    it('should return false for unread articles', () => {
      const { result } = renderHook(() => useReadStatus());

      expect(result.current.isArticleRead(mockArticles[0])).toBe(false);
    });

    it('should return true for read articles', () => {
      const { result } = renderHook(() => useReadStatus());

      act(() => {
        result.current.markAsRead(mockArticles[0]);
      });

      expect(result.current.isArticleRead(mockArticles[0])).toBe(true);
    });
  });

  describe('markAsRead', () => {
    it('should mark an article as read', () => {
      const { result } = renderHook(() => useReadStatus());

      act(() => {
        result.current.markAsRead(mockArticles[0]);
      });

      expect(result.current.isArticleRead(mockArticles[0])).toBe(true);
    });

    it('should persist read status in localStorage', () => {
      const { result } = renderHook(() => useReadStatus());

      act(() => {
        result.current.markAsRead(mockArticles[0]);
      });

      const storedData = JSON.parse(mockLocalStorage.getItem('article-read-status') || '{}');
      expect(storedData[mockArticles[0].link]).toEqual({
        isRead: true,
        readAt: expect.any(Number)
      });
    });
  });

  describe('markAsUnread', () => {
    it('should mark a read article as unread', () => {
      const { result } = renderHook(() => useReadStatus());

      act(() => {
        result.current.markAsRead(mockArticles[0]);
      });

      expect(result.current.isArticleRead(mockArticles[0])).toBe(true);

      act(() => {
        result.current.markAsUnread(mockArticles[0]);
      });

      expect(result.current.isArticleRead(mockArticles[0])).toBe(false);
    });
  });

  describe('toggleReadStatus', () => {
    it('should toggle from unread to read', () => {
      const { result } = renderHook(() => useReadStatus());

      expect(result.current.isArticleRead(mockArticles[0])).toBe(false);

      act(() => {
        result.current.toggleReadStatus(mockArticles[0]);
      });

      expect(result.current.isArticleRead(mockArticles[0])).toBe(true);
    });

    it('should toggle from read to unread', () => {
      const { result } = renderHook(() => useReadStatus());

      act(() => {
        result.current.markAsRead(mockArticles[0]);
      });

      expect(result.current.isArticleRead(mockArticles[0])).toBe(true);

      act(() => {
        result.current.toggleReadStatus(mockArticles[0]);
      });

      expect(result.current.isArticleRead(mockArticles[0])).toBe(false);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all articles as read', () => {
      const { result } = renderHook(() => useReadStatus());

      act(() => {
        result.current.markAllAsRead(mockArticles);
      });

      mockArticles.forEach(article => {
        expect(result.current.isArticleRead(article)).toBe(true);
      });
    });
  });

  describe('markAllAsUnread', () => {
    it('should mark all articles as unread', () => {
      const { result } = renderHook(() => useReadStatus());

      // First mark all as read
      act(() => {
        result.current.markAllAsRead(mockArticles);
      });

      // Then mark all as unread
      act(() => {
        result.current.markAllAsUnread(mockArticles);
      });

      mockArticles.forEach(article => {
        expect(result.current.isArticleRead(article)).toBe(false);
      });
    });
  });

  describe('getReadCount', () => {
    it('should return correct read count', () => {
      const { result } = renderHook(() => useReadStatus());

      expect(result.current.getReadCount(mockArticles)).toBe(0);

      act(() => {
        result.current.markAsRead(mockArticles[0]);
        result.current.markAsRead(mockArticles[1]);
      });

      expect(result.current.getReadCount(mockArticles)).toBe(2);
    });
  });

  describe('getUnreadCount', () => {
    it('should return correct unread count', () => {
      const { result } = renderHook(() => useReadStatus());

      expect(result.current.getUnreadCount(mockArticles)).toBe(3);

      act(() => {
        result.current.markAsRead(mockArticles[0]);
      });

      expect(result.current.getUnreadCount(mockArticles)).toBe(2);
    });
  });

  describe('clearOldReadStatus', () => {
    it('should clear old read status entries', () => {
      const { result } = renderHook(() => useReadStatus());

      // Mock Date.now to simulate old entries
      const originalDateNow = Date.now;
      const mockNow = 1000000000000; // Some timestamp
      Date.now = vi.fn(() => mockNow);

      act(() => {
        result.current.markAsRead(mockArticles[0]);
      });

      // Move time forward by 31 days
      Date.now = vi.fn(() => mockNow + (31 * 24 * 60 * 60 * 1000));

      act(() => {
        result.current.clearOldReadStatus(30);
      });

      expect(result.current.isArticleRead(mockArticles[0])).toBe(false);

      // Restore original Date.now
      Date.now = originalDateNow;
    });

    it('should not clear recent read status entries', () => {
      const { result } = renderHook(() => useReadStatus());

      act(() => {
        result.current.markAsRead(mockArticles[0]);
      });

      act(() => {
        result.current.clearOldReadStatus(30);
      });

      expect(result.current.isArticleRead(mockArticles[0])).toBe(true);
    });
  });

  describe('persistence', () => {
    it('should load existing read status from localStorage', () => {
      // Pre-populate localStorage
      const existingData = {
        [mockArticles[0].link]: {
          isRead: true,
          readAt: Date.now()
        }
      };
      mockLocalStorage.setItem('article-read-status', JSON.stringify(existingData));

      const { result } = renderHook(() => useReadStatus());

      expect(result.current.isArticleRead(mockArticles[0])).toBe(true);
      expect(result.current.isArticleRead(mockArticles[1])).toBe(false);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      mockLocalStorage.setItem('article-read-status', 'invalid-json');

      const { result } = renderHook(() => useReadStatus());

      expect(result.current.isArticleRead(mockArticles[0])).toBe(false);
    });
  });

  describe('performance', () => {
    it('should handle large numbers of articles efficiently', () => {
      const { result } = renderHook(() => useReadStatus());

      // Create a large number of articles
      const largeArticleList: Article[] = Array.from({ length: 1000 }, (_, i) => ({
        title: `Article ${i}`,
        link: `https://example.com/article${i}`,
        pubDate: new Date(),
        sourceTitle: 'Test Source',
        description: `Description ${i}`,
        author: `Author ${i}`
      }));

      const startTime = performance.now();

      act(() => {
        result.current.markAllAsRead(largeArticleList);
      });

      const endTime = performance.now();

      // Should complete within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);

      expect(result.current.getReadCount(largeArticleList)).toBe(1000);
    });
  });
});
