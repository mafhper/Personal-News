import React, { useState, useRef, useEffect, useCallback } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  retryAttempts?: number;
  retryDelay?: number;
  sizes?: string;
  srcSet?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  className = '',
  onLoad,
  onError,
  retryAttempts = 3,
  retryDelay = 1000,
  sizes = '(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw',
  srcSet,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Create intersection observer
  useEffect(() => {
    if (!imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1,
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Handle image loading with retry logic
  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    setCurrentAttempt(0);
    onLoad?.();
  }, [onLoad]);

  const handleImageError = useCallback(() => {
    if (currentAttempt < retryAttempts) {
      // Retry after delay
      setTimeout(() => {
        setCurrentAttempt(prev => prev + 1);
      }, retryDelay);
    } else {
      setHasError(true);
      onError?.();
    }
  }, [currentAttempt, retryAttempts, retryDelay, onError]);

  // Generate placeholder if not provided
  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    // Create a simple gradient placeholder
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#374151;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1f2937;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" />
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="Arial" font-size="12">Loading...</text>
      </svg>
    `)}`;
  };

  // Generate error placeholder
  const getErrorPlaceholder = () => {
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#374151" />
        <text x="50%" y="45%" text-anchor="middle" dy=".3em" fill="#ef4444" font-family="Arial" font-size="10">Failed</text>
        <text x="50%" y="60%" text-anchor="middle" dy=".3em" fill="#ef4444" font-family="Arial" font-size="10">to load</text>
      </svg>
    `)}`;
  };

  // Determine which source to show
  const getImageSrc = () => {
    if (hasError) {
      return getErrorPlaceholder();
    }
    if (isInView) {
      return src;
    }
    return getPlaceholder();
  };

  return (
    <img
      ref={imgRef}
      src={getImageSrc()}
      alt={alt}
      className={`transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-75'
      } ${className}`}
      onLoad={handleImageLoad}
      onError={handleImageError}
      loading="lazy" // Native lazy loading as fallback
      sizes={sizes}
      srcSet={srcSet}
    />
  );
};
