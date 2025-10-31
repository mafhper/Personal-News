import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

interface KeyboardNavigationOptions {
  shortcuts?: KeyboardShortcut[];
  enableArrowNavigation?: boolean;
  containerRef?: React.RefObject<HTMLElement>;
  onArrowNavigation?: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

export const useKeyboardNavigation = (options: KeyboardNavigationOptions = {}) => {
  const {
    shortcuts = [],
    enableArrowNavigation = false,
    containerRef,
    onArrowNavigation
  } = options;

  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: Event) => {
    const keyboardEvent = event as KeyboardEvent;
    const { key, ctrlKey, shiftKey, altKey, metaKey } = keyboardEvent;

    // Check for shortcuts
    for (const shortcut of shortcutsRef.current) {
      const keyMatches = shortcut.key.toLowerCase() === key.toLowerCase();
      const ctrlMatches = (shortcut.ctrlKey ?? false) === ctrlKey;
      const shiftMatches = (shortcut.shiftKey ?? false) === shiftKey;
      const altMatches = (shortcut.altKey ?? false) === altKey;
      const metaMatches = (shortcut.metaKey ?? false) === metaKey;

      if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.action();
        return;
      }
    }

    // Handle arrow navigation
    if (enableArrowNavigation && onArrowNavigation) {
      switch (key) {
        case 'ArrowUp':
          event.preventDefault();
          onArrowNavigation('up');
          break;
        case 'ArrowDown':
          event.preventDefault();
          onArrowNavigation('down');
          break;
        case 'ArrowLeft':
          event.preventDefault();
          onArrowNavigation('left');
          break;
        case 'ArrowRight':
          event.preventDefault();
          onArrowNavigation('right');
          break;
      }
    }
  }, [enableArrowNavigation, onArrowNavigation]);

  // Set up event listeners
  useEffect(() => {
    const target = containerRef?.current || document;
    target.addEventListener('keydown', handleKeyDown);

    return () => {
      target.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, containerRef]);

  // Get focusable elements within container
  const getFocusableElements = useCallback((): HTMLElement[] => {
    const container = containerRef?.current || document;
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter((element) => {
        const htmlElement = element as HTMLElement;
        return htmlElement.offsetParent !== null && // Element is visible
               !htmlElement.hasAttribute('aria-hidden') &&
               htmlElement.tabIndex !== -1;
      }) as HTMLElement[];
  }, [containerRef]);

  // Navigate to next/previous focusable element
  const navigateToElement = useCallback((direction: 'next' | 'previous') => {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.findIndex(el => el === document.activeElement);

    let nextIndex: number;
    if (direction === 'next') {
      nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
    }

    if (focusableElements[nextIndex]) {
      focusableElements[nextIndex].focus();
    }
  }, [getFocusableElements]);

  // Focus first/last element
  const focusFirst = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements[0]) {
      focusableElements[0].focus();
    }
  }, [getFocusableElements]);

  const focusLast = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, [getFocusableElements]);

  return {
    navigateToElement,
    focusFirst,
    focusLast,
    getFocusableElements
  };
};
