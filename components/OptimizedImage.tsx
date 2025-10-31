/**
 * OptimizedImage.tsx
 *
 * Componente de imagem otimizado que resolve problemas de:
 * - Flickering durante carregamento
 * - Layout shift
 * - Fallbacks robustos
 * - Performance
 *
 * @author Matheus Pereira
 * @version 1.0.0
 */

import React, { useState, useCallback } from 'react';

interface OptimizedImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackText: string;
  width: number;
  height: number;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  fallbackText,
  width,
  height,
  priority = false
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);
  const [fallbackLevel, setFallbackLevel] = useState(0);

  // Generate fallback URLs
  const generateFallbackUrl = useCallback((level: number, originalSrc?: string): string => {
    const encodedText = encodeURIComponent(fallbackText);
    const color1 = '374151'; // Gray-700
    const color2 = '9CA3AF'; // Gray-400

    switch (level) {
      case 0:
        // Original image
        return originalSrc || '';
      case 1:
        // Picsum with seed from original URL
        if (originalSrc) {
          return `https://picsum.photos/seed/${encodeURIComponent(originalSrc)}/${width}/${height}`;
        }
        return `https://picsum.photos/${width}/${height}?random=${Math.random()}`;
      case 2:
        // Placeholder with text
        return `https://via.placeholder.com/${width}x${height}/${color1}/${color2}?text=${encodedText}`;
      case 3:
      default:
        // Final fallback - simple colored placeholder
        return `https://via.placeholder.com/${width}x${height}/6B7280/F3F4F6?text=IMG`;
    }
  }, [fallbackText, width, height]);

  const handleImageLoad = useCallback(() => {
    setImageState('loaded');
  }, []);

  const handleImageError = useCallback(() => {
    const nextLevel = fallbackLevel + 1;
    const nextSrc = generateFallbackUrl(nextLevel, src);

    if (nextLevel <= 3) {
      setFallbackLevel(nextLevel);
      setCurrentSrc(nextSrc);
      setImageState('loading');
    } else {
      setImageState('error');
    }
  }, [fallbackLevel, generateFallbackUrl, src]);

  // Initialize current source
  React.useEffect(() => {
    if (src) {
      setCurrentSrc(src);
      setImageState('loading');
      setFallbackLevel(0);
    } else {
      // No source provided, go directly to placeholder
      setCurrentSrc(generateFallbackUrl(2, undefined));
      setImageState('loading');
      setFallbackLevel(2);
    }
  }, [src, generateFallbackUrl]);

  return (
    <div className={`relative overflow-hidden w-full h-full ${className}`}>
      {/* Loading placeholder - prevents layout shift */}
      {imageState === 'loading' && (
        <div className="absolute inset-0 bg-gray-700 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-xs font-medium">
            {fallbackLevel === 0 ? 'Loading...' : fallbackText}
          </div>
        </div>
      )}

      {/* Actual image */}
      <img
        src={currentSrc}
        alt={alt}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={priority ? 'eager' : 'lazy'}
      />

      {/* Error state */}
      {imageState === 'error' && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <div className="text-gray-500 text-xs font-medium text-center">
            <div className="mb-1">⚠️</div>
            <div>Image Error</div>
          </div>
        </div>
      )}
    </div>
  );
};
