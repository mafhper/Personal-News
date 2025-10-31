import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Article } from '../types';
import { ArticleItem } from './ArticleItem';
import { useSwipeGestures } from '../hooks/useSwipeGestures';

interface VirtualizedArticleListProps {
  articles: Article[];
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  onNextPage?: () => void;
  onPrevPage?: () => void;
}

interface VirtualItem {
  index: number;
  start: number;
  end: number;
}

export const VirtualizedArticleList: React.FC<VirtualizedArticleListProps> = ({
  articles,
  itemHeight = 120, // Estimated height of each ArticleItem
  containerHeight = 600, // Height of the scrollable container
  overscan = 5, // Number of items to render outside visible area
  onScroll,
  onNextPage,
  onPrevPage,
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate total height of all items
  const totalHeight = articles.length * itemHeight;

  // Calculate which items should be visible
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      articles.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, articles.length]);

  // Generate virtual items for rendering
  const virtualItems = useMemo((): VirtualItem[] => {
    const items: VirtualItem[] = [];

    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      items.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight,
      });
    }

    return items;
  }, [visibleRange, itemHeight]);

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    setIsScrolling(true);
    onScroll?.(scrollTop);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set scrolling to false after scroll ends
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [onScroll]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!scrollElementRef.current) return;

    const { key } = event;
    const currentScrollTop = scrollElementRef.current.scrollTop;

    switch (key) {
      case 'ArrowDown':
        event.preventDefault();
        scrollElementRef.current.scrollTop = Math.min(
          currentScrollTop + itemHeight,
          totalHeight - containerHeight
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        scrollElementRef.current.scrollTop = Math.max(currentScrollTop - itemHeight, 0);
        break;
      case 'PageDown':
        event.preventDefault();
        scrollElementRef.current.scrollTop = Math.min(
          currentScrollTop + containerHeight,
          totalHeight - containerHeight
        );
        break;
      case 'PageUp':
        event.preventDefault();
        scrollElementRef.current.scrollTop = Math.max(currentScrollTop - containerHeight, 0);
        break;
      case 'Home':
        event.preventDefault();
        scrollElementRef.current.scrollTop = 0;
        break;
      case 'End':
        event.preventDefault();
        scrollElementRef.current.scrollTop = totalHeight - containerHeight;
        break;
    }
  }, [itemHeight, containerHeight, totalHeight]);

  // Scroll to specific item
  const scrollToItem = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    if (!scrollElementRef.current) return;

    let scrollTop = index * itemHeight;

    if (align === 'center') {
      scrollTop = scrollTop - containerHeight / 2 + itemHeight / 2;
    } else if (align === 'end') {
      scrollTop = scrollTop - containerHeight + itemHeight;
    }

    scrollTop = Math.max(0, Math.min(scrollTop, totalHeight - containerHeight));
    scrollElementRef.current.scrollTop = scrollTop;
  }, [itemHeight, containerHeight, totalHeight]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Create a separate ref for imperative handle
  const imperativeRef = useRef<{
    scrollToItem: (index: number, align?: 'start' | 'center' | 'end') => void;
    scrollTop: number;
    scrollHeight: number;
  }>(null);

  // Update imperative ref when scroll changes
  useEffect(() => {
    if (imperativeRef.current) {
      imperativeRef.current = {
        scrollToItem,
        scrollTop: scrollElementRef.current?.scrollTop || 0,
        scrollHeight: totalHeight,
      };
    }
  }, [scrollToItem, totalHeight]);

  // Implement swipe gestures for mobile navigation
  const swipeRef = useSwipeGestures({
    onSwipeLeft: () => {
      // Navigate to next page on swipe left
      if (onNextPage) {
        onNextPage();
        // Show visual feedback for swipe
        if (scrollElementRef.current) {
          const feedback = document.createElement('div');
          feedback.className = 'swipe-feedback swipe-left';
          feedback.setAttribute('aria-hidden', 'true');
          scrollElementRef.current.appendChild(feedback);
          setTimeout(() => feedback.remove(), 500);
        }
      }
    },
    onSwipeRight: () => {
      // Navigate to previous page on swipe right
      if (onPrevPage) {
        onPrevPage();
        // Show visual feedback for swipe
        if (scrollElementRef.current) {
          const feedback = document.createElement('div');
          feedback.className = 'swipe-feedback swipe-right';
          feedback.setAttribute('aria-hidden', 'true');
          scrollElementRef.current.appendChild(feedback);
          setTimeout(() => feedback.remove(), 500);
        }
      }
    },
    threshold: 70, // Higher threshold for more intentional swipes
    element: scrollElementRef.current
  });

  return (
    <div>
      <h3 className="text-lg font-bold text-[rgb(var(--color-accent))] mb-4 uppercase tracking-wider">
        Top Stories
      </h3>

      <div
        ref={(el) => {
          scrollElementRef.current = el;
          swipeRef.current = el;
        }}
        className="relative overflow-auto focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:ring-opacity-50 rounded-md swipe-container"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="list"
        aria-label="Article list"
        data-testid="virtualized-list"
      >
        {/* Total height spacer */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Rendered items */}
          {virtualItems.map((virtualItem) => {
            const article = articles[virtualItem.index];
            if (!article) return null;

            return (
              <div
                key={`${article.link}-${virtualItem.index}`}
                style={{
                  position: 'absolute',
                  top: virtualItem.start,
                  left: 0,
                  right: 0,
                  height: itemHeight,
                }}
                role="listitem"
              >
                <div className="px-4 py-2 h-full">
                  <ArticleItem
                    article={article}
                    index={virtualItem.index + 1}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrolling indicator */}
        {isScrolling && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
            Scrolling...
          </div>
        )}
      </div>

      {/* Scroll info for debugging (only in development) */}
      {import.meta.env.DEV && (
        <div className="mt-2 text-xs text-gray-500">
          Visible: {visibleRange.startIndex + 1}-{visibleRange.endIndex + 1} of {articles.length} |
          Rendered: {virtualItems.length} items |
          Scroll: {Math.round(scrollTop)}px
        </div>
      )}
    </div>
  );
};
