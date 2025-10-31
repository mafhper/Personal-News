/**
 * usePagination.test.ts
 *
 * Tests for the enhanced pagination hook to ensure proper state management,
 * URL persistence, and keyboard navigation functionality.
 *
 * @author Matheus Pereira
 * @version 1.0.0
 */

import { renderHook, act } from "@testing-library/react";
import { vi } from "vitest";
import { usePagination } from "../hooks/usePagination";

// Mock window.history for URL persistence tests
const mockReplaceState = vi.fn();
Object.defineProperty(window, "history", {
  value: {
    replaceState: mockReplaceState,
  },
  writable: true,
});

// Mock window.location for URL tests
delete (window as any).location;
window.location = {
  href: "http://localhost:3000",
  search: "",
} as any;

describe("usePagination", () => {
  beforeEach(() => {
    mockReplaceState.mockClear();
    window.location.search = "";
  });

  describe("Basic functionality", () => {
    it("should initialize with correct default values", () => {
      const { result } = renderHook(() => usePagination(100, 10));

      expect(result.current.currentPage).toBe(0);
      expect(result.current.totalPages).toBe(10);
      expect(result.current.articlesPerPage).toBe(10);
      expect(result.current.isNavigating).toBe(false);
      expect(result.current.canGoNext).toBe(true);
      expect(result.current.canGoPrev).toBe(false);
      expect(result.current.startIndex).toBe(0);
      expect(result.current.endIndex).toBe(10);
    });

    it("should handle edge case with zero items", () => {
      const { result } = renderHook(() => usePagination(0, 10));

      expect(result.current.currentPage).toBe(0);
      expect(result.current.totalPages).toBe(1);
      expect(result.current.canGoNext).toBe(false);
      expect(result.current.canGoPrev).toBe(false);
    });

    it("should handle edge case with items less than page size", () => {
      const { result } = renderHook(() => usePagination(5, 10));

      expect(result.current.currentPage).toBe(0);
      expect(result.current.totalPages).toBe(1);
      expect(result.current.canGoNext).toBe(false);
      expect(result.current.canGoPrev).toBe(false);
      expect(result.current.endIndex).toBe(5);
    });
  });

  describe("Navigation", () => {
    it("should navigate to next page correctly", () => {
      const { result } = renderHook(() => usePagination(100, 10));

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(1);
      expect(result.current.canGoNext).toBe(true);
      expect(result.current.canGoPrev).toBe(true);
      expect(result.current.startIndex).toBe(10);
      expect(result.current.endIndex).toBe(20);
    });

    it("should navigate to previous page correctly", () => {
      const { result } = renderHook(() => usePagination(100, 10));

      // Go to page 2 first
      act(() => {
        result.current.setPage(2);
      });

      // Then go back
      act(() => {
        result.current.prevPage();
      });

      expect(result.current.currentPage).toBe(1);
    });

    it("should not go beyond last page", () => {
      const { result } = renderHook(() => usePagination(25, 10)); // 3 pages total

      // Go to last page
      act(() => {
        result.current.setPage(2);
      });

      // Try to go beyond
      act(() => {
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(2);
      expect(result.current.canGoNext).toBe(false);
    });

    it("should not go before first page", () => {
      const { result } = renderHook(() => usePagination(100, 10));

      // Try to go before first page
      act(() => {
        result.current.prevPage();
      });

      expect(result.current.currentPage).toBe(0);
      expect(result.current.canGoPrev).toBe(false);
    });

    it("should set page directly with validation", () => {
      const { result } = renderHook(() => usePagination(100, 10));

      // Set valid page
      act(() => {
        result.current.setPage(5);
      });

      expect(result.current.currentPage).toBe(5);

      // Try to set invalid page (too high)
      act(() => {
        result.current.setPage(20);
      });

      expect(result.current.currentPage).toBe(9); // Should clamp to last page

      // Try to set invalid page (negative)
      act(() => {
        result.current.setPage(-1);
      });

      expect(result.current.currentPage).toBe(0); // Should clamp to first page
    });
  });

  describe("Reset functionality", () => {
    it("should reset to first page", () => {
      const { result } = renderHook(() => usePagination(100, 10));

      // Go to a different page
      act(() => {
        result.current.setPage(5);
      });

      // Reset
      act(() => {
        result.current.resetPagination();
      });

      expect(result.current.currentPage).toBe(0);
    });

    it("should reset when reset triggers change", () => {
      let trigger = "initial";
      const { result, rerender } = renderHook(
        ({ triggerValue }) => usePagination(100, 10, { resetTriggers: [triggerValue] }),
        { initialProps: { triggerValue: trigger } }
      );

      // Go to a different page
      act(() => {
        result.current.setPage(5);
      });

      expect(result.current.currentPage).toBe(5);

      // Change trigger
      trigger = "changed";
      rerender({ triggerValue: trigger });

      expect(result.current.currentPage).toBe(0);
    });
  });

  describe("URL persistence", () => {
    it("should update URL when persistInUrl is enabled", () => {
      const { result } = renderHook(() =>
        usePagination(100, 10, { persistInUrl: true })
      );

      act(() => {
        result.current.setPage(3);
      });

      expect(mockReplaceState).toHaveBeenCalledWith(
        {},
        "",
        expect.stringContaining("page=4") // 1-based in URL
      );
    });

    it("should remove page parameter for first page", () => {
      const { result } = renderHook(() =>
        usePagination(100, 10, { persistInUrl: true })
      );

      // Go to page 3
      act(() => {
        result.current.setPage(3);
      });

      // Go back to first page
      act(() => {
        result.current.setPage(0);
      });

      expect(mockReplaceState).toHaveBeenLastCalledWith(
        {},
        "",
        expect.not.stringContaining("page=")
      );
    });

    it("should use custom URL parameter name", () => {
      const { result } = renderHook(() =>
        usePagination(100, 10, { persistInUrl: true, urlParamName: "p" })
      );

      act(() => {
        result.current.setPage(2);
      });

      expect(mockReplaceState).toHaveBeenCalledWith(
        {},
        "",
        expect.stringContaining("p=3")
      );
    });

    it("should initialize from URL parameter", () => {
      window.location.search = "?page=5";

      const { result } = renderHook(() =>
        usePagination(100, 10, { persistInUrl: true })
      );

      expect(result.current.currentPage).toBe(4); // 0-based
    });

    it("should handle invalid URL parameter gracefully", () => {
      window.location.search = "?page=invalid";

      const { result } = renderHook(() =>
        usePagination(100, 10, { persistInUrl: true })
      );

      expect(result.current.currentPage).toBe(0);
    });

    it("should clamp URL parameter to valid range", () => {
      window.location.search = "?page=50"; // Beyond total pages

      const { result } = renderHook(() =>
        usePagination(25, 10, { persistInUrl: true }) // Only 3 pages
      );

      expect(result.current.currentPage).toBe(2); // Last valid page
    });
  });

  describe("Dynamic total items", () => {
    it("should adjust current page when total items decrease", () => {
      const { result, rerender } = renderHook(
        ({ totalItems }) => usePagination(totalItems, 10),
        { initialProps: { totalItems: 100 } }
      );

      // Go to last page
      act(() => {
        result.current.setPage(9);
      });

      expect(result.current.currentPage).toBe(9);

      // Reduce total items
      rerender({ totalItems: 25 }); // Now only 3 pages

      expect(result.current.currentPage).toBe(2); // Should adjust to last valid page
      expect(result.current.totalPages).toBe(3);
    });

    it("should maintain current page when total items increase", () => {
      const { result, rerender } = renderHook(
        ({ totalItems }) => usePagination(totalItems, 10),
        { initialProps: { totalItems: 25 } }
      );

      // Go to page 2
      act(() => {
        result.current.setPage(2);
      });

      expect(result.current.currentPage).toBe(2);

      // Increase total items
      rerender({ totalItems: 100 });

      expect(result.current.currentPage).toBe(2); // Should maintain current page
      expect(result.current.totalPages).toBe(10);
    });
  });

  describe("Navigation state", () => {
    it("should set isNavigating during page changes", async () => {
      const { result } = renderHook(() => usePagination(100, 10));

      act(() => {
        result.current.setPage(3);
      });

      expect(result.current.isNavigating).toBe(true);

      // Wait for navigation state to reset
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      expect(result.current.isNavigating).toBe(false);
    });
  });
});
