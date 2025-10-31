import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Article } from '../types';

interface FavoriteArticle {
  id: string; // Generated from article link
  title: string;
  link: string;
  pubDate: string; // Stored as ISO string
  sourceTitle: string;
  imageUrl?: string;
  description?: string;
  author?: string;
  categories?: string[];
  favoritedAt: string; // ISO timestamp when favorited
}

interface FavoritesData {
  articles: FavoriteArticle[];
  lastUpdated: string;
}

export interface UseFavoritesReturn {
  favorites: FavoriteArticle[];
  isFavorite: (article: Article) => boolean;
  addToFavorites: (article: Article) => void;
  removeFromFavorites: (article: Article) => void;
  toggleFavorite: (article: Article) => void;
  clearAllFavorites: () => void;
  getFavoritesCount: () => number;
  exportFavorites: () => string;
  importFavorites: (jsonData: string) => boolean;
  getFavoritesByCategory: (category?: string) => FavoriteArticle[];
  getFavoritesBySource: (source?: string) => FavoriteArticle[];
}

// Generate a unique ID for an article based on its link
const generateArticleId = (article: Article): string => {
  // Use a more robust ID generation that includes more unique data
  const uniqueString = `${article.link}-${article.title}`;
  // Use a simple hash function instead of base64 to avoid truncation issues
  let hash = 0;
  for (let i = 0; i < uniqueString.length; i++) {
    const char = uniqueString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
};

// Convert Article to FavoriteArticle
const articleToFavorite = (article: Article): FavoriteArticle => ({
  id: generateArticleId(article),
  title: article.title,
  link: article.link,
  pubDate: article.pubDate.toISOString(),
  sourceTitle: article.sourceTitle,
  imageUrl: article.imageUrl,
  description: article.description,
  author: article.author,
  categories: article.categories,
  favoritedAt: new Date().toISOString()
});

// Convert FavoriteArticle back to Article
export const favoriteToArticle = (favorite: FavoriteArticle): Article => ({
  title: favorite.title,
  link: favorite.link,
  pubDate: new Date(favorite.pubDate),
  sourceTitle: favorite.sourceTitle,
  imageUrl: favorite.imageUrl,
  description: favorite.description,
  author: favorite.author,
  categories: favorite.categories
});

export const useFavorites = (): UseFavoritesReturn => {
  const [favoritesData, setFavoritesData] = useLocalStorage<FavoritesData>('favorites-data', {
    articles: [],
    lastUpdated: new Date().toISOString()
  });

  const favorites = useMemo(() => favoritesData.articles, [favoritesData.articles]);

  const isFavorite = useCallback((article: Article): boolean => {
    const articleId = generateArticleId(article);
    return favorites.some(fav => fav.id === articleId);
  }, [favorites]);

  const addToFavorites = useCallback((article: Article): void => {
    if (isFavorite(article)) {
      return; // Already favorited
    }

    const favoriteArticle = articleToFavorite(article);
    setFavoritesData(prev => ({
      articles: [favoriteArticle, ...prev.articles], // Add to beginning for recent-first order
      lastUpdated: new Date().toISOString()
    }));
  }, [isFavorite, setFavoritesData]);

  const removeFromFavorites = useCallback((article: Article): void => {
    const articleId = generateArticleId(article);
    setFavoritesData(prev => ({
      articles: prev.articles.filter(fav => fav.id !== articleId),
      lastUpdated: new Date().toISOString()
    }));
  }, [setFavoritesData]);

  const toggleFavorite = useCallback((article: Article): void => {
    if (isFavorite(article)) {
      removeFromFavorites(article);
    } else {
      addToFavorites(article);
    }
  }, [isFavorite, addToFavorites, removeFromFavorites]);

  const clearAllFavorites = useCallback((): void => {
    setFavoritesData({
      articles: [],
      lastUpdated: new Date().toISOString()
    });
  }, [setFavoritesData]);

  const getFavoritesCount = useCallback((): number => {
    return favorites.length;
  }, [favorites.length]);

  const exportFavorites = useCallback((): string => {
    const exportData = {
      ...favoritesData,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(exportData, null, 2);
  }, [favoritesData]);

  const importFavorites = useCallback((jsonData: string): boolean => {
    try {
      const importedData = JSON.parse(jsonData);

      // Validate the imported data structure
      if (!importedData.articles || !Array.isArray(importedData.articles)) {
        throw new Error('Invalid favorites data format');
      }

      // Validate each article has required fields
      for (const article of importedData.articles) {
        if (!article.id || !article.title || !article.link || !article.pubDate) {
          throw new Error('Invalid article data in favorites');
        }
      }

      setFavoritesData({
        articles: importedData.articles,
        lastUpdated: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Failed to import favorites:', error);
      return false;
    }
  }, [setFavoritesData]);

  const getFavoritesByCategory = useCallback((category?: string): FavoriteArticle[] => {
    if (!category || category === 'All') {
      return favorites;
    }

    return favorites.filter(fav =>
      fav.categories?.some(cat => cat.toLowerCase() === category.toLowerCase())
    );
  }, [favorites]);

  const getFavoritesBySource = useCallback((source?: string): FavoriteArticle[] => {
    if (!source) {
      return favorites;
    }

    return favorites.filter(fav =>
      fav.sourceTitle.toLowerCase().includes(source.toLowerCase()) ||
      fav.author?.toLowerCase().includes(source.toLowerCase())
    );
  }, [favorites]);

  return {
    favorites,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    clearAllFavorites,
    getFavoritesCount,
    exportFavorites,
    importFavorites,
    getFavoritesByCategory,
    getFavoritesBySource
  };
};
