import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useFeedCategories } from '../hooks/useFeedCategories';
import type { FeedSource } from '../types';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock useLocalStorage hook
vi.mock('../hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn((key: string, defaultValue: any) => {
    const [value, setValue] = require('react').useState(defaultValue);
    return [value, setValue];
  }),
}));

describe('useFeedCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default categories', () => {
    const { result } = renderHook(() => useFeedCategories());

    expect(result.current.categories).toHaveLength(6);
    expect(result.current.categories[0]).toEqual({
      id: 'all',
      name: 'All',
      color: '#6B7280',
      order: 0,
      isDefault: true,
    });
  });

  it('should create a new category', () => {
    const { result } = renderHook(() => useFeedCategories());

    act(() => {
      const newCategory = result.current.createCategory('Custom Category', '#FF0000', 'Test description');
      expect(newCategory.name).toBe('Custom Category');
      expect(newCategory.color).toBe('#FF0000');
      expect(newCategory.description).toBe('Test description');
      expect(newCategory.isDefault).toBe(false);
    });

    expect(result.current.categories).toHaveLength(7);
    const customCategory = result.current.categories.find(c => c.name === 'Custom Category');
    expect(customCategory).toBeDefined();
    expect(customCategory?.isDefault).toBe(false);
  });

  it('should update an existing category', () => {
    const { result } = renderHook(() => useFeedCategories());

    act(() => {
      result.current.createCategory('Test Category', '#FF0000');
    });

    const testCategory = result.current.categories.find(c => c.name === 'Test Category');
    expect(testCategory).toBeDefined();

    act(() => {
      result.current.updateCategory(testCategory!.id, { name: 'Updated Category', color: '#00FF00' });
    });

    const updatedCategory = result.current.categories.find(c => c.id === testCategory!.id);
    expect(updatedCategory?.name).toBe('Updated Category');
    expect(updatedCategory?.color).toBe('#00FF00');
  });

  it('should delete a custom category', () => {
    const { result } = renderHook(() => useFeedCategories());

    act(() => {
      result.current.createCategory('To Delete', '#FF0000');
    });

    const categoryToDelete = result.current.categories.find(c => c.name === 'To Delete');
    expect(categoryToDelete).toBeDefined();

    act(() => {
      result.current.deleteCategory(categoryToDelete!.id);
    });

    const deletedCategory = result.current.categories.find(c => c.name === 'To Delete');
    expect(deletedCategory).toBeUndefined();
  });

  it('should not delete default categories', () => {
    const { result } = renderHook(() => useFeedCategories());

    expect(() => {
      act(() => {
        result.current.deleteCategory('all');
      });
    }).toThrow('Cannot delete default categories');
  });

  it('should reorder categories', () => {
    const { result } = renderHook(() => useFeedCategories());

    const originalOrder = result.current.categories.map(c => c.id);
    const newOrder = [originalOrder[1], originalOrder[0], ...originalOrder.slice(2)];

    act(() => {
      result.current.reorderCategories(newOrder);
    });

    const reorderedIds = result.current.categories.map(c => c.id);
    expect(reorderedIds.slice(0, 2)).toEqual([newOrder[0], newOrder[1]]);
  });

  it('should categorize feeds correctly', () => {
    const { result } = renderHook(() => useFeedCategories());

    const feeds: FeedSource[] = [
      { url: 'https://example.com/feed1.xml', categoryId: 'tech' },
      { url: 'https://example.com/feed2.xml', categoryId: 'science' },
      { url: 'https://example.com/feed3.xml' }, // uncategorized
    ];

    const categorizedFeeds = result.current.getCategorizedFeeds(feeds);

    expect(categorizedFeeds['tech']).toHaveLength(1);
    expect(categorizedFeeds['science']).toHaveLength(1);
    expect(categorizedFeeds['uncategorized']).toHaveLength(1);
    expect(categorizedFeeds['all']).toHaveLength(3);
  });

  it('should move feed to category', () => {
    const { result } = renderHook(() => useFeedCategories());

    const feeds: FeedSource[] = [
      { url: 'https://example.com/feed1.xml' },
      { url: 'https://example.com/feed2.xml', categoryId: 'tech' },
    ];

    const setFeeds = vi.fn();

    act(() => {
      result.current.moveFeedToCategory('https://example.com/feed1.xml', 'science', feeds, setFeeds);
    });

    expect(setFeeds).toHaveBeenCalledWith([
      { url: 'https://example.com/feed1.xml', categoryId: 'science' },
      { url: 'https://example.com/feed2.xml', categoryId: 'tech' },
    ]);
  });

  it('should export categories correctly', () => {
    const { result } = renderHook(() => useFeedCategories());

    act(() => {
      result.current.createCategory('Custom 1', '#FF0000');
      result.current.createCategory('Custom 2', '#00FF00');
    });

    const exportData = result.current.exportCategories();
    const parsed = JSON.parse(exportData);

    expect(parsed.categories).toHaveLength(2);
    expect(parsed.version).toBe('1.0');
    expect(parsed.exportDate).toBeDefined();
    expect(parsed.categories.every((c: any) => !c.isDefault)).toBe(true);
  });

  it('should import categories correctly', () => {
    const { result } = renderHook(() => useFeedCategories());

    const importData = {
      categories: [
        {
          id: 'imported-1',
          name: 'Imported Category',
          color: '#FF00FF',
          order: 10,
          description: 'Imported description',
        },
      ],
      version: '1.0',
      exportDate: new Date().toISOString(),
    };

    act(() => {
      const success = result.current.importCategories(JSON.stringify(importData));
      expect(success).toBe(true);
    });

    const importedCategory = result.current.categories.find(c => c.name === 'Imported Category');
    expect(importedCategory).toBeDefined();
    expect(importedCategory?.isDefault).toBe(false);
  });

  it('should handle invalid import data', () => {
    const { result } = renderHook(() => useFeedCategories());

    act(() => {
      const success1 = result.current.importCategories('invalid json');
      expect(success1).toBe(false);

      const success2 = result.current.importCategories('{"invalid": "data"}');
      expect(success2).toBe(false);

      const success3 = result.current.importCategories('{"categories": [{"invalid": "category"}]}');
      expect(success3).toBe(false);
    });
  });

  it('should reset to defaults', () => {
    const { result } = renderHook(() => useFeedCategories());

    act(() => {
      result.current.createCategory('Custom Category', '#FF0000');
    });

    expect(result.current.categories).toHaveLength(7);

    act(() => {
      result.current.resetToDefaults();
    });

    expect(result.current.categories).toHaveLength(6);
    expect(result.current.categories.every(c => c.isDefault)).toBe(true);
  });

  it('should get category by id', () => {
    const { result } = renderHook(() => useFeedCategories());

    const techCategory = result.current.getCategoryById('tech');
    expect(techCategory?.name).toBe('Tech');
    expect(techCategory?.id).toBe('tech');

    const nonExistentCategory = result.current.getCategoryById('non-existent');
    expect(nonExistentCategory).toBeUndefined();
  });

  it('should maintain category order', () => {
    const { result } = renderHook(() => useFeedCategories());

    const orders = result.current.categories.map(c => c.order);
    const sortedOrders = [...orders].sort((a, b) => a - b);
    expect(orders).toEqual(sortedOrders);
  });
});
