import { useRef, useEffect, RefObject } from 'react';

interface SwipeGesturesOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance for a swipe to be registered
  element?: HTMLElement | null; // Optional element to attach listeners to
}

/**
 * Hook for detecting swipe gestures on touch devices
 *
 * @param options Configuration options for swipe detection
 * @returns A ref that should be attached to the target element if not provided in options
 */
export function useSwipeGestures(options: SwipeGesturesOptions): RefObject<HTMLElement | null> {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
  } = options;

  // Create a ref for the element if not provided
  const elementRef = useRef<HTMLElement | null>(null);

  // Track touch positions
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    // Get the target element (either from options or ref)
    const targetElement = options.element || elementRef.current;
    if (!targetElement) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touchEnd = e.changedTouches[0];
      const deltaX = touchEnd.clientX - touchStartRef.current.x;
      const deltaY = touchEnd.clientY - touchStartRef.current.y;

      // Determine if the swipe was horizontal or vertical
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);

      if (isHorizontalSwipe) {
        if (deltaX > threshold && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < -threshold && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        if (deltaY > threshold && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < -threshold && onSwipeUp) {
          onSwipeUp();
        }
      }

      // Reset touch start position
      touchStartRef.current = null;
    };

    // Add event listeners
    targetElement.addEventListener('touchstart', handleTouchStart);
    targetElement.addEventListener('touchend', handleTouchEnd);

    // Clean up event listeners
    return () => {
      targetElement.removeEventListener('touchstart', handleTouchStart);
      targetElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [options.element, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);

  return elementRef;
}
