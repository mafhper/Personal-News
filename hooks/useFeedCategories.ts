import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { FeedCategory, FeedSource } from '../types';

const DEFAULT_CATEGORIES: FeedCategory[] = [
  { id: 'all', name: 'All', color: '#6B7280', order: 0, isDefault: true },
  { id: 'tech', name: 'Tech', color: '#3B82F6', order: 1, isDefault: true },
  { id: 'reviews', name: 'Reviews', color: '#10B981', order: 2, isDefault: true },
  { id: 'science', name: 'Science', color: '#8B5CF6', order: 3, isDefault: true },
  { id: 'entertainment', name: 'Entertainment', color: '#F59E0B', order: 4, isDefault: true },
  { id: 'ai', name: 'AI', color: '#EF4444', order: 5, isDefault: true },
];

export interface UseFeedCategoriesReturn {
  categories: FeedCategory[];
  createCategory: (name: string, color: string, description?: string) => FeedCategory;
  updateCategory: (id: string, updates: Partial<FeedCategory>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (categoryIds: string[]) => void;
  getCategoryById: (id: string) => FeedCategory | undefined;
  getCategorizedFeeds: (feeds: FeedSource[]) => Record<string, FeedSource[]>;
  moveFeedToCategory: (feedUrl: string, categoryId: string, feeds: FeedSource[], setFeeds: (feeds: FeedSource[]) => void) => void;
  exportCategories: () => string;
  importCategories: (data: string) => boolean;
  resetToDefaults: () => void;
}

export const useFeedCategories = (): UseFeedCategoriesReturn => {
  const [categories, setCategories] = useLocalStorage<FeedCategory[]>('feed-categories', DEFAULT_CATEGORIES);

  const createCategory = useCallback((name: string, color: string, description?: string): FeedCategory => {
    const newCategory: FeedCategory = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      color,
      description,
      order: 0, // Will be updated in the setter function
      isDefault: false,
    };

    setCategories(prev => {
      const maxOrder = Math.max(...prev.map(c => c.order));
      const categoryWithOrder = { ...newCategory, order: maxOrder + 1 };
      return [...prev, categoryWithOrder];
    });

    return newCategory;
  }, [setCategories]);

  const updateCategory = useCallback((id: string, updates: Partial<FeedCategory>) => {
    setCategories(prev => prev.map(category =>
      category.id === id ? { ...category, ...updates } : category
    ));
  }, [setCategories]);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => {
      const category = prev.find(c => c.id === id);
      if (category?.isDefault) {
        throw new Error('Cannot delete default categories');
      }
      return prev.filter(category => category.id !== id);
    });
  }, [setCategories]);

  const reorderCategories = useCallback((categoryIds: string[]) => {
    setCategories(prev => {
      const reordered = categoryIds.map((id, index) => {
        const category = prev.find(c => c.id === id);
        return category ? { ...category, order: index } : null;
      }).filter(Boolean) as FeedCategory[];

      // Add any categories that weren't in the reorder list
      const missingCategories = prev.filter(c => !categoryIds.includes(c.id));
      return [...reordered, ...missingCategories];
    });
  }, [setCategories]);

  const getCategoryById = useCallback((id: string): FeedCategory | undefined => {
    return categories.find(category => category.id === id);
  }, [categories]);

  const getCategorizedFeeds = useCallback((feeds: FeedSource[]): Record<string, FeedSource[]> => {
    const result: Record<string, FeedSource[]> = {};

    // Initialize all categories with empty arrays
    categories.forEach(category => {
      result[category.id] = [];
    });

    // Add uncategorized feeds to 'all' category
    result['uncategorized'] = [];

    feeds.forEach(feed => {
      if (feed.categoryId && result[feed.categoryId]) {
        result[feed.categoryId].push(feed);
      } else {
        result['uncategorized'].push(feed);
      }

      // All feeds also go to 'all' category
      if (result['all']) {
        result['all'].push(feed);
      }
    });

    return result;
  }, [categories]);

  const moveFeedToCategory = useCallback((
    feedUrl: string,
    categoryId: string,
    feeds: FeedSource[],
    setFeeds: (feeds: FeedSource[]) => void
  ) => {
    const updatedFeeds = feeds.map(feed =>
      feed.url === feedUrl
        ? { ...feed, categoryId: categoryId === 'uncategorized' ? undefined : categoryId }
        : feed
    );
    setFeeds(updatedFeeds);
  }, []);

  const exportCategories = useCallback((): string => {
    const exportData = {
      categories: categories.filter(c => !c.isDefault),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(exportData, null, 2);
  }, [categories]);

  const importCategories = useCallback((data: string): boolean => {
    try {
      const importData = JSON.parse(data);

      if (!importData.categories || !Array.isArray(importData.categories)) {
        return false;
      }

      const validCategories = importData.categories.filter((cat: any) =>
        cat.id && cat.name && cat.color && typeof cat.order === 'number'
      );

      if (validCategories.length === 0) {
        return false;
      }

      // Merge with existing categories, avoiding duplicates
      setCategories(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const newCategories = validCategories.filter((cat: FeedCategory) => !existingIds.has(cat.id));

        // Adjust order to avoid conflicts
        const maxOrder = Math.max(...prev.map(c => c.order));
        const adjustedCategories = newCategories.map((cat: FeedCategory, index: number) => ({
          ...cat,
          order: maxOrder + index + 1,
          isDefault: false
        }));

        return [...prev, ...adjustedCategories];
      });

      return true;
    } catch (error) {
      console.error('Failed to import categories:', error);
      return false;
    }
  }, [setCategories]);

  const resetToDefaults = useCallback(() => {
    setCategories(DEFAULT_CATEGORIES);
  }, [setCategories]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.order - b.order);
  }, [categories]);

  return {
    categories: sortedCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    getCategoryById,
    getCategorizedFeeds,
    moveFeedToCategory,
    exportCategories,
    importCategories,
    resetToDefaults,
  };
};
