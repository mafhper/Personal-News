import React, { memo, useCallback } from "react";
import { useFavorites } from "../hooks/useFavorites";
import type { Article } from "../types";

interface HeartIconProps {
  filled?: boolean;
  className?: string;
}

const HeartIcon: React.FC<HeartIconProps> = memo(
  ({ filled = false, className = "" }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill={filled ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  )
);

HeartIcon.displayName = "HeartIcon";

export interface FavoriteButtonProps {
  article: Article;
  size?: "small" | "medium" | "large";
  position?: "overlay" | "inline";
  className?: string;
  "aria-label"?: string;
  title?: string;
}

const FavoriteButtonComponent: React.FC<FavoriteButtonProps> = ({
  article,
  size = "medium",
  position = "overlay",
  className = "",
  "aria-label": ariaLabel,
  title,
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFavorited = isFavorite(article);

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(article);
    },
    [toggleFavorite, article]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(article);
      }
    },
    [toggleFavorite, article]
  );

  // Size configurations
  const sizeClasses = {
    small: {
      container: "w-6 h-6 p-1",
      icon: "h-3 w-3",
    },
    medium: {
      container: "w-8 h-8 p-1.5",
      icon: "h-4 w-4",
    },
    large: {
      container: "w-10 h-10 p-2",
      icon: "h-5 w-5",
    },
  };

  // Position-specific styles
  const positionClasses = {
    overlay: "absolute",
    inline: "relative",
  };

  // Base styles that apply to all variants
  const baseClasses = `
    ${sizeClasses[size].container}
    ${positionClasses[position]}
    rounded-full
    transition-all duration-200 ease-in-out
    flex items-center justify-center
    focus:outline-none
    focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
    ${className}
  `;

  // Color and background styles based on state and position
  const stateClasses =
    position === "overlay"
      ? `
      bg-black/70 backdrop-blur-sm
      ${
        isFavorited
          ? "text-red-500 hover:text-red-400 focus:ring-red-500"
          : "text-white hover:text-red-500 focus:ring-white"
      }
      hover:bg-black/80
    `
      : `
      bg-gray-800/90 hover:bg-gray-700/90
      ${
        isFavorited
          ? "text-red-500 hover:text-red-400 focus:ring-red-500"
          : "text-gray-400 hover:text-red-500 focus:ring-gray-400"
      }
    `;

  // Generate accessible labels
  const defaultAriaLabel = isFavorited
    ? "Remove from favorites"
    : "Add to favorites";
  const defaultTitle = isFavorited
    ? "Remove from favorites"
    : "Add to favorites";

  return (
    <button
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={`${baseClasses} ${stateClasses}`}
      aria-label={ariaLabel || defaultAriaLabel}
      aria-pressed={isFavorited}
      title={title || defaultTitle}
      type="button"
      role="button"
      tabIndex={0}
    >
      <HeartIcon filled={isFavorited} className={sizeClasses[size].icon} />
    </button>
  );
};

// Custom comparison function for React.memo
const arePropsEqual = (
  prevProps: FavoriteButtonProps,
  nextProps: FavoriteButtonProps
): boolean => {
  return (
    prevProps.article.link === nextProps.article.link &&
    prevProps.size === nextProps.size &&
    prevProps.position === nextProps.position &&
    prevProps.className === nextProps.className &&
    prevProps["aria-label"] === nextProps["aria-label"] &&
    prevProps.title === nextProps.title
  );
};

export const FavoriteButton = memo(FavoriteButtonComponent, arePropsEqual);
