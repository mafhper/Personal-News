
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LazyImage } from '../components/LazyImage';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock for testing intersection observer callback
let intersectionCallback: (entries: IntersectionObserverEntry[]) => void;

// Helper function to create mock intersection observer entry
const createMockEntry = (target: Element, isIntersecting: boolean): IntersectionObserverEntry => ({
  isIntersecting,
  target,
  boundingClientRect: {} as DOMRectReadOnly,
  intersectionRatio: isIntersecting ? 1 : 0,
  intersectionRect: {} as DOMRectReadOnly,
  rootBounds: null,
  time: Date.now(),
});

beforeEach(() => {
  mockIntersectionObserver.mockClear();
  mockIntersectionObserver.mockImplementation((callback) => {
    intersectionCallback = callback;
    return {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };
  });
});

describe('LazyImage', () => {
  const defaultProps = {
    src: 'https://example.com/image.jpg',
    alt: 'Test image',
  };

  it('renders with placeholder initially', () => {
    render(<LazyImage {...defaultProps} />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', 'Test image');
    // Should show placeholder initially
    expect(img.getAttribute('src')).toContain('data:image/svg+xml');
  });

  it('loads image when in view', async () => {
    render(<LazyImage {...defaultProps} />);
    const img = screen.getByRole('img');

    // Simulate intersection observer triggering
    await act(async () => {
      intersectionCallback([createMockEntry(img, true)]);
    });

    await waitFor(() => {
      expect(img.getAttribute('src')).toBe(defaultProps.src);
    });
  });

  it('calls onLoad callback when image loads successfully', async () => {
    const onLoad = vi.fn();
    render(<LazyImage {...defaultProps} onLoad={onLoad} />);
    const img = screen.getByRole('img');

    // Simulate intersection observer triggering
    await act(async () => {
      intersectionCallback([createMockEntry(img, true)]);
    });

    // Simulate successful image load
    await act(async () => {
      fireEvent.load(img);
    });

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalledTimes(1);
    });
  });

  it('handles image load errors with retry logic', async () => {
    const onError = vi.fn();
    render(<LazyImage {...defaultProps} onError={onError} retryAttempts={1} retryDelay={10} />);
    const img = screen.getByRole('img');

    // Simulate intersection observer triggering
    act(() => {
      intersectionCallback([createMockEntry(img, true)]);
    });

    // Simulate multiple image load errors to exhaust retries
    act(() => {
      fireEvent.error(img);
    });

    // Wait for retry timeout and final error
    await waitFor(() => {
      fireEvent.error(img);
      expect(onError).toHaveBeenCalledTimes(1);
    }, { timeout: 100 });
  });

  it('shows error placeholder after all retries fail', async () => {
    render(<LazyImage {...defaultProps} retryAttempts={0} retryDelay={10} />);
    const img = screen.getByRole('img');

    // Simulate intersection observer triggering
    act(() => {
      intersectionCallback([createMockEntry(img, true)]);
    });

    // Simulate image load error (no retries, should fail immediately)
    act(() => {
      fireEvent.error(img);
    });

    // Check that error placeholder is shown
    await waitFor(() => {
      const src = img.getAttribute('src');
      expect(src).toContain('data:image/svg+xml');
      // Decode base64 to check content
      if (src && src.includes('base64,')) {
        const base64Content = src.split('base64,')[1];
        const decodedContent = atob(base64Content);
        expect(decodedContent).toContain('Failed');
      }
    });
  });

  it('uses custom placeholder when provided', () => {
    const customPlaceholder = 'https://example.com/placeholder.jpg';
    render(<LazyImage {...defaultProps} placeholder={customPlaceholder} />);
    const img = screen.getByRole('img');

    expect(img.getAttribute('src')).toBe(customPlaceholder);
  });

  it('applies custom className', () => {
    const customClass = 'custom-image-class';
    render(<LazyImage {...defaultProps} className={customClass} />);
    const img = screen.getByRole('img');

    expect(img).toHaveClass(customClass);
  });

  it('sets up intersection observer with correct options', () => {
    render(<LazyImage {...defaultProps} />);

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );
  });

  it('disconnects intersection observer after image comes into view', () => {
    const mockDisconnect = vi.fn();
    const mockObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: mockDisconnect,
    };

    mockIntersectionObserver.mockImplementation((callback) => {
      intersectionCallback = callback;
      return mockObserver;
    });

    render(<LazyImage {...defaultProps} />);
    const img = screen.getByRole('img');

    // Simulate intersection observer triggering
    act(() => {
      intersectionCallback([createMockEntry(img, true)]);
    });

    expect(mockDisconnect).toHaveBeenCalled();
  });
});
