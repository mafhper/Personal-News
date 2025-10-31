import { useRef, useEffect, useCallback } from 'react';

interface FocusManagementOptions {
  trapFocus?: boolean;
  restoreFocus?: boolean;
  initialFocus?: string | HTMLElement;
  onEscape?: () => void;
}

interface FocusManagementReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  restoreFocus: () => void;
  setInitialFocus: () => void;
}

export const useFocusManagement = (
  isActive: boolean,
  options: FocusManagementOptions = {}
): FocusManagementReturn => {
  const {
    trapFocus = false,
    restoreFocus: shouldRestoreFocus = false,
    initialFocus,
    onEscape
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const isInitialized = useRef(false);

  // Store the previously focused element when component becomes active
  useEffect(() => {
    if (isActive && !isInitialized.current) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      isInitialized.current = true;
    } else if (!isActive) {
      isInitialized.current = false;
    }
  }, [isActive]);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(containerRef.current.querySelectorAll(focusableSelectors))
      .filter((element) => {
        const htmlElement = element as HTMLElement;
        return htmlElement.offsetParent !== null && // Element is visible
               !htmlElement.hasAttribute('aria-hidden') &&
               htmlElement.tabIndex !== -1;
      }) as HTMLElement[];
  }, []);

  // Set initial focus
  const setInitialFocus = useCallback(() => {
    if (!containerRef.current || !isActive) return;

    let elementToFocus: HTMLElement | null = null;

    if (typeof initialFocus === 'string') {
      // Try to find element by selector
      elementToFocus = containerRef.current.querySelector(initialFocus);
    } else if (initialFocus instanceof HTMLElement) {
      elementToFocus = initialFocus;
    }

    // Fallback to first focusable element
    if (!elementToFocus) {
      const focusableElements = getFocusableElements();
      elementToFocus = focusableElements[0] || null;
    }

    if (elementToFocus) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        elementToFocus?.focus();
      }, 0);
    }
  }, [isActive, initialFocus, getFocusableElements]);

  // Restore focus to previously active element
  const restoreFocus = useCallback(() => {
    if (shouldRestoreFocus && previousActiveElement.current) {
      // Small delay to ensure modal is closed
      setTimeout(() => {
        previousActiveElement.current?.focus();
        previousActiveElement.current = null;
      }, 0);
    }
  }, [shouldRestoreFocus]);

  // Handle focus trap
  useEffect(() => {
    if (!isActive || !trapFocus || !containerRef.current) return;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab: moving backwards
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: moving forwards
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onEscape) {
        onEscape();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isActive, trapFocus, onEscape, getFocusableElements]);

  // Set initial focus when component becomes active
  useEffect(() => {
    if (isActive) {
      setInitialFocus();
    }
  }, [isActive, setInitialFocus]);

  return {
    containerRef,
    restoreFocus,
    setInitialFocus
  };
};
