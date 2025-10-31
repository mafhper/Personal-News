import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSearchHistory } from '../hooks/useSearch';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('useSearchHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should initialize with empty history', () => {
    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.searchHistory).toHaveLength(0);
  });

  it('should load history from localStorage', () => {
    const savedHistory = ['React', 'Vue', 'Angular'];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedHistory));

    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.searchHistory).toEqual(savedHistory);
  });

  it('should handle localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.searchHistory).toHaveLength(0);
  });
});
