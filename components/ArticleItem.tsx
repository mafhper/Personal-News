import React, { memo, useEffect, useCallback } from "react";
import type { Article } from "../types";
import { LazyImage } from "./LazyImage";
import { usePerformance } from "../hooks/usePerformance";
import { useFavorites } from "../hooks/useFavorites";
import { useArticleLayout } from "../hooks/useArticleLayout";

const ChatBubbleIcon: React.FC = memo(() => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-3 w-3"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H9.828a1 1 0 00-.707.293l-2.828 2.828a1 1 0 01-1.414 0l-2.828-2.828A1 1 0 002.172 17H4a2 2 0 01-2-2V5z" />
  </svg>
));

ChatBubbleIcon.displayName = "ChatBubbleIcon";

const HeartIcon: React.FC<{ filled?: boolean }> = memo(({ filled = false }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-3 w-3"
    fill={filled ? "currentColor" : "none"}
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
));

HeartIcon.displayName = "HeartIcon";

interface ArticleItemProps {
  article: Article;
  index: number;
  timeFormat?: "12h" | "24h";
}

const ArticleItemComponent: React.FC<ArticleItemProps> = ({
  article,
  index,
  timeFormat = "24h",
}) => {
  const { startRenderTiming, endRenderTiming } = usePerformance();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { settings: layoutSettings } = useArticleLayout();

  // Start performance measurement
  useEffect(() => {
    startRenderTiming();
    return () => {
      endRenderTiming();
    };
  }, [startRenderTiming, endRenderTiming]);

  const isFavorited = isFavorite(article);

  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(article);
    },
    [toggleFavorite, article]
  );

  const timeSince = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <article className="h-full flex flex-col">
      {/* Grid layout optimized for cards */}
      <div className="flex flex-col h-full group">
        {/* Article image */}
        <div className="relative mb-4">
          <LazyImage
            src={
              article.imageUrl ||
              `https://picsum.photos/seed/${article.link}/400/200`
            }
            alt={`Thumbnail image for article: ${article.title}`}
            className="w-full h-32 lg:h-40 object-cover rounded-lg"
            srcSet={`${
              article.imageUrl ||
              `https://picsum.photos/seed/${article.link}/200/100`
            } 200w,
                                ${
                                  article.imageUrl ||
                                  `https://picsum.photos/seed/${article.link}/400/200`
                                } 400w,
                                ${
                                  article.imageUrl ||
                                  `https://picsum.photos/seed/${article.link}/600/300`
                                } 600w`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Article number overlay */}
          <div className="absolute top-2 left-2 bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
            {index}
          </div>

          {/* Favorite button overlay */}
          <button
            onClick={handleToggleFavorite}
            className={`absolute top-2 right-2 rounded-full bg-black/70 backdrop-blur-sm transition-all duration-200 ${
              isFavorited
                ? "text-red-500 hover:text-red-400"
                : "text-white hover:text-red-500"
            }`}
            style={{
              minWidth: "32px",
              minHeight: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6px",
            }}
            aria-label={
              isFavorited ? "Remove from favorites" : "Add to favorites"
            }
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <HeartIcon filled={isFavorited} />
          </button>
        </div>

        {/* Article content */}
        <div className="flex-1 flex flex-col">
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex flex-col group"
            aria-label={`Article: ${article.title} from ${
              article.author || article.sourceTitle
            }`}
          >
            {/* Source badge */}
            <div className="mb-2">
              <span className="inline-block bg-[rgb(var(--color-accent))]/20 text-[rgb(var(--color-accent))] px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide">
                {article.sourceTitle}
              </span>
            </div>

            {/* Title with better text wrapping */}
            <h4 className="font-bold text-base lg:text-lg leading-tight group-hover:underline text-gray-100 mb-3 line-clamp-3">
              {article.title}
            </h4>

            {/* Article metadata */}
            <div className="mt-auto space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
                {article.author && (
                  <span
                    className="truncate max-w-[120px]"
                    aria-label={`Author: ${article.author}`}
                    title={article.author}
                  >
                    {article.author}
                  </span>
                )}
                {/* Comentários removidos conforme solicitado */}
              </div>
              <time
                className="text-gray-500 text-xs block"
                dateTime={article.pubDate.toISOString()}
                aria-label={`Published ${timeSince(article.pubDate)}`}
              >
                {layoutSettings.showPublicationTime
                  ? (timeFormat === "12h"
                      ? `${article.pubDate.toLocaleDateString()} às ${article.pubDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: true })}`
                      : `${article.pubDate.toLocaleDateString()} às ${article.pubDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })}`)
                  : timeSince(article.pubDate)
                }
              </time>
            </div>
          </a>
        </div>
      </div>
    </article>
  );
};

// Custom comparison function for React.memo
const arePropsEqual = (
  prevProps: ArticleItemProps,
  nextProps: ArticleItemProps
): boolean => {
  // Compare index
  if (prevProps.index !== nextProps.index) {
    return false;
  }

  // Compare article properties that affect rendering
  const prevArticle = prevProps.article;
  const nextArticle = nextProps.article;

  return (
    prevArticle.title === nextArticle.title &&
    prevArticle.link === nextArticle.link &&
    prevArticle.pubDate.getTime() === nextArticle.pubDate.getTime() &&
    prevArticle.sourceTitle === nextArticle.sourceTitle &&
    prevArticle.imageUrl === nextArticle.imageUrl &&
    prevArticle.author === nextArticle.author
  );
};

// Export memoized component
export const ArticleItem = memo(ArticleItemComponent, arePropsEqual);
