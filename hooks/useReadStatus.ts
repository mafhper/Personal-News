import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Article } from '../types';

interface ReadStatusData {
  [articleLink: string]: {
    isRead: boolean;
    readAt: number; // timestamp
  };
}

export interface UseReadStatusReturn {
  isArticleRead: (article: Article) => boolean;
  markAsRead: (article: Article) => void;
  markAsUnread: (article: Article) => void;
  toggleReadStatus: (article: Article) => void;
  markAllAsRead: (articles: Article[]) => void;
  markAllAsUnread: (articles: Article[]) => void;
  getReadCount: (articles: Article[]) => number;
  getUnreadCount: (articles: Article[]) => number;
  clearOldReadStatus: (daysOld?: number) => void;
}

export const useReadStatus = (): UseReadStatusReturn => {
  const [readStatusData, setReadStatusData] = useLocalStorage<ReadStatusData>('article-read-status', {});

  const isArticleRead = useCallback((article: Article): boolean => {
    return readStatusData[article.link]?.isRead || false;
  }, [readStatusData]);

  const markAsRead = useCallback((article: Article) => {
    setReadStatusData(prev => ({
      ...prev,
      [article.link]: {
        isRead: true,
        readAt: Date.now()
      }
    }));
  }, [setReadStatusData]);

  const markAsUnread = useCallback((article: Article) => {
    setReadStatusData(prev => ({
      ...prev,
      [article.link]: {
        isRead: false,
        readAt: Date.now()
      }
    }));
  }, [setReadStatusData]);

  const toggleReadStatus = useCallback((article: Article) => {
    if (isArticleRead(article)) {
      markAsUnread(article);
    } else {
      markAsRead(article);
    }
  }, [isArticleRead, markAsRead, markAsUnread]);

  const markAllAsRead = useCallback((articles: Article[]) => {
    const now = Date.now();
    setReadStatusData(prev => {
      const updated = { ...prev };
      articles.forEach(article => {
        updated[article.link] = {
          isRead: true,
          readAt: now
        };
      });
      return updated;
    });
  }, [setReadStatusData]);

  const markAllAsUnread = useCallback((articles: Article[]) => {
    const now = Date.now();
    setReadStatusData(prev => {
      const updated = { ...prev };
      articles.forEach(article => {
        updated[article.link] = {
          isRead: false,
          readAt: now
        };
      });
      return updated;
    });
  }, [setReadStatusData]);

  const getReadCount = useCallback((articles: Article[]): number => {
    return articles.filter(article => isArticleRead(article)).length;
  }, [isArticleRead]);

  const getUnreadCount = useCallback((articles: Article[]): number => {
    return articles.filter(article => !isArticleRead(article)).length;
  }, [isArticleRead]);

  const clearOldReadStatus = useCallback((daysOld: number = 30) => {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    setReadStatusData(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(link => {
        if (updated[link].readAt < cutoffTime) {
          delete updated[link];
        }
      });
      return updated;
    });
  }, [setReadStatusData]);

  return useMemo(() => ({
    isArticleRead,
    markAsRead,
    markAsUnread,
    toggleReadStatus,
    markAllAsRead,
    markAllAsUnread,
    getReadCount,
    getUnreadCount,
    clearOldReadStatus
  }), [
    isArticleRead,
    markAsRead,
    markAsUnread,
    toggleReadStatus,
    markAllAsRead,
    markAllAsUnread,
    getReadCount,
    getUnreadCount,
    clearOldReadStatus
  ]);
};
