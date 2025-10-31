/**
 * usePagination.ts
 *
 * Enhanced pagination hook with proper state management, URL persistence,
 * and keyboard navigation support. Fixes the current pagination issues
 * by providing centralized pagination logic with reset triggers.
 *
 * @author Matheus Pereira
 * @version 1.0.0
 */

import { useState, useCallback, useEffect, useMemo } from "react";

interface PaginationOptions {
  persistInUrl?: boolean;
  resetTriggers?: any[];
  urlParamName?: string;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  articlesPerPage: number;
  isNavigating: boolean;
}

interface PaginationActions {
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  resetPagination: () => void;
}

interface PaginationReturn extends PaginationState, PaginationActions {
  canGoNext: boolean;
  canGoPrev: boolean;
  startIndex: number;
  endIndex: number;
}

export const usePagination = (
  totalItems: number,
  itemsPerPage: number = 12,
  options: PaginationOptions = {}
): PaginationReturn => {
  const {
    persistInUrl = false,
    resetTriggers = [],
    urlParamName = "page",
  } = options;

  const [currentPage, setCurrentPage] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / itemsPerPage));
  }, [totalItems, itemsPerPage]);

  // Initialize from URL on mount if URL persistence is enabled
  useEffect(() => {
    if (persistInUrl && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const pageParam = urlParams.get(urlParamName);

      if (pageParam) {
        const page = parseInt(pageParam, 10) - 1; // Convert to 0-based
        if (page >= 0 && page < totalPages) {
          setCurrentPage(page);
        } else if (page >= totalPages && totalPages > 0) {
          // If URL page is beyond total pages, go to last page
          setCurrentPage(totalPages - 1);
        }
      }
    }
  }, [persistInUrl, urlParamName, totalPages]);

  // Update URL when page changes (if URL persistence is enabled)
  const updateUrl = useCallback(
    (page: number) => {
      if (persistInUrl && typeof window !== "undefined") {
        const url = new URL(window.location.href);

        if (page === 0) {
          // Remove page parameter for first page to keep URLs clean
          url.searchParams.delete(urlParamName);
        } else {
          url.searchParams.set(urlParamName, (page + 1).toString());
        }

        // Use replaceState to avoid adding to browser history
        window.history.replaceState({}, "", url.toString());
      }
    },
    [persistInUrl, urlParamName]
  );

  // Set page with validation and URL update
  const setPage = useCallback(
    (page: number) => {
      // Validate page bounds
      const validPage = Math.max(0, Math.min(page, totalPages - 1));

      if (validPage !== currentPage) {
        setIsNavigating(true);
        setCurrentPage(validPage);
        updateUrl(validPage);

        // Reset navigation state after a brief delay for smooth transitions
        const timeoutId = setTimeout(() => setIsNavigating(false), 150);

        // Cleanup timeout if component unmounts
        return () => clearTimeout(timeoutId);
      }
    },
    [currentPage, totalPages, updateUrl]
  );

  // Navigation functions
  const nextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setPage(currentPage + 1);
    }
  }, [currentPage, totalPages, setPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 0) {
      setPage(currentPage - 1);
    }
  }, [currentPage, setPage]);

  const resetPagination = useCallback(() => {
    setPage(0);
  }, [setPage]);

  // Reset pagination when triggers change
  useEffect(() => {
    if (resetTriggers.length > 0) {
      resetPagination();
    }
  }, resetTriggers); // eslint-disable-line react-hooks/exhaustive-deps

  // Ensure current page is valid when total pages change
  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setPage(totalPages - 1);
    }
  }, [currentPage, totalPages, setPage]);

  // Keyboard navigation support
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if no input is focused and no modifiers except shift
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        (activeElement as HTMLElement)?.contentEditable === "true";

      if (isInputFocused || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      switch (event.key) {
        case "ArrowLeft":
          if (currentPage > 0) {
            event.preventDefault();
            prevPage();
          }
          break;
        case "ArrowRight":
          if (currentPage < totalPages - 1) {
            event.preventDefault();
            nextPage();
          }
          break;
        case "Home":
          if (currentPage > 0) {
            event.preventDefault();
            setPage(0);
          }
          break;
        case "End":
          if (currentPage < totalPages - 1) {
            event.preventDefault();
            setPage(totalPages - 1);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, totalPages, nextPage, prevPage, setPage]);

  // Calculate start and end indices for current page
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return {
    // State
    currentPage,
    totalPages,
    articlesPerPage: itemsPerPage,
    isNavigating,

    // Actions
    setPage,
    nextPage,
    prevPage,
    resetPagination,

    // Computed properties
    canGoNext: currentPage < totalPages - 1,
    canGoPrev: currentPage > 0,
    startIndex,
    endIndex,
  };
};
