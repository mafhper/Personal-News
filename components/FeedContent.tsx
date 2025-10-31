/**
 * FeedContent.tsx
 *
 * Componente principal para exibição de artigos no Personal News Dashboard.
 * Organiza os artigos em seções: artigo em destaque, notícias recentes e top stories.
 * Suporta múltiplos layouts e paginação.
 *
 * @author Matheus Pereira
 * @version 2.0.0
 */

import React, { useMemo } from "react";
import type { Article } from "../types";
import { FeaturedArticle } from "./FeaturedArticle";
import { ArticleItem } from "./ArticleItem";
import { FavoriteButton } from "./FavoriteButton";
import { withPerformanceTracking } from "../services/performanceUtils";
import { useArticleLayout } from "../hooks/useArticleLayout";
import { SmallOptimizedImage } from "./SmallOptimizedImage";

interface FeedContentProps {
  articles: Article[];
  timeFormat: "12h" | "24h";
  // Removed unused pagination props
}

// Component for recent articles
const RecentArticleItem: React.FC<{
  article: Article;
  timeFormat: "12h" | "24h";
  showTime: boolean;
}> = ({ article, timeFormat, showTime }) => {
  return (
    <article className="recent-news-item border-b border-gray-700/30 last:border-b-0 relative">
      <div className="flex items-center h-full py-2">
        {/* Accent dot indicator */}
        <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[rgb(var(--color-accent))] mr-3"></div>

        {/* Image container with favorite button overlay */}
        <div className="relative flex-shrink-0 mr-3">
          <SmallOptimizedImage
            src={article.imageUrl}
            alt={`Thumbnail for ${article.title}`}
            className="rounded-md hover:opacity-90 transition-opacity recent-news-image"
            fallbackText={article.sourceTitle}
            size={64}
            height={64}
          />
          {/* Favorite Button - positioned with adequate spacing inside image bounds */}
          <FavoriteButton
            article={article}
            size="small"
            position="overlay"
            className="absolute top-1 right-1 z-10 hover:scale-110 transition-transform duration-200"
            aria-label={`Toggle favorite for ${article.title}`}
          />
        </div>

        {/* Content area - takes remaining space */}
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex-1 min-w-0 flex flex-col justify-center items-start"
          aria-label={`Read article: ${article.title}`}
        >
          {/* Header - Primeira linha: Site e Data/Hora */}
          <div className="flex items-center justify-start space-x-2 text-xs text-gray-400 mb-1 recent-news-meta w-full">
            <span className="text-[rgb(var(--color-accent))] font-medium uppercase tracking-wide">
              {article.sourceTitle}
            </span>
            {showTime && (
              <>
                <span>•</span>
                <time dateTime={article.pubDate.toISOString()}>
                  {timeFormat === "12h"
                    ? `${article.pubDate.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      })} ${article.pubDate.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}`
                    : `${article.pubDate.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      })} ${article.pubDate.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}`}
                </time>
              </>
            )}
          </div>

          {/* Header - Segunda linha: Autor */}
          {article.author && article.author.trim() !== "" && (
            <div className="text-xs text-gray-300 mb-2 recent-news-author w-full text-left">
              <span className="font-medium">Por: {article.author}</span>
            </div>
          )}

          {/* Título */}
          <h3 className="text-base lg:text-lg font-medium text-gray-200 group-hover:text-white line-clamp-2 leading-tight recent-news-title w-full text-left">
            {article.title}
          </h3>
        </a>
      </div>
    </article>
  );
};

const FeedContentComponent: React.FC<FeedContentProps> = ({
  articles,
  timeFormat,
}) => {
  const [topStoriesLayout, setTopStoriesLayout] = React.useState<
    "grid" | "list"
  >("grid");

  // Get layout settings
  const { settings: layoutSettings } = useArticleLayout();

  if (articles.length === 0) {
    return null;
  }

  // Memoize the featured article and other articles to prevent unnecessary re-renders
  const featuredArticle = useMemo(() => articles[0], [articles]);
  const otherArticles = useMemo(() => articles.slice(1), [articles]);

  // Dynamic article distribution based on user settings
  const recentArticles = useMemo(() => {
    // Always show exactly 5 recent articles if available
    return otherArticles.slice(0, Math.min(5, otherArticles.length));
  }, [otherArticles]);

  const topStoriesArticles = useMemo(() => {
    // Show configured number of top stories articles
    const startIndex = recentArticles.length;
    const endIndex = startIndex + layoutSettings.topStoriesCount;
    return otherArticles.slice(startIndex, endIndex);
  }, [otherArticles, recentArticles.length, layoutSettings.topStoriesCount]);

  return (
    <div
      className="space-y-8 lg:space-y-12"
      role="main"
      aria-label="News articles"
    >
      {/* Main content section - Featured article + Recent news summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8 xl:gap-12 lg:items-stretch">
        {/* Featured Article - Half width */}
        <section
          aria-labelledby="featured-article-heading"
          className="flex flex-col"
        >
          <h2 id="featured-article-heading" className="sr-only">
            Featured Article
          </h2>
          <div className="h-[50vh] md:h-[55vh] lg:h-[60vh] xl:h-[65vh] min-h-[400px] max-h-[600px] flex-1">
            <FeaturedArticle
              article={featuredArticle}
              timeFormat={timeFormat}
            />
          </div>
        </section>

        {/* Recent News Summary - Right side */}
        <aside
          className="flex flex-col h-[50vh] md:h-[55vh] lg:h-[60vh] xl:h-[65vh] min-h-[350px] max-h-[600px]"
          role="complementary"
          aria-labelledby="recent-news-heading"
        >
          <div className="flex items-center justify-between mb-4 lg:mb-6 recent-news-header">
            <h2
              id="recent-news-heading"
              className="text-xl lg:text-2xl font-bold text-[rgb(var(--color-accent))] uppercase tracking-wider"
            >
              Últimas Notícias
            </h2>
            <div className="text-sm text-gray-400">
              {recentArticles.length} artigos
            </div>
          </div>

          <div className="flex-1 overflow-hidden recent-news-container">
            {recentArticles.map((article, index) => (
              <RecentArticleItem
                key={article.link + index}
                article={article}
                timeFormat={timeFormat}
                showTime={layoutSettings.showPublicationTime}
              />
            ))}
          </div>
        </aside>
      </div>

      {/* Top Stories section - Below main content with layout options */}
      {layoutSettings.topStoriesCount > 0 && (
        <section aria-labelledby="top-stories-heading" className="w-full">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center justify-between sm:justify-start">
              <h2
                id="top-stories-heading"
                className="text-xl sm:text-2xl lg:text-3xl font-bold text-[rgb(var(--color-accent))] uppercase tracking-wider"
              >
                Top Stories
              </h2>
              <div className="text-sm text-gray-400 sm:hidden">
                {topStoriesArticles.length} artigos
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end space-x-4">
              <div className="hidden sm:block text-sm text-gray-400">
                {topStoriesArticles.length} artigos
              </div>
              {/* Layout toggle buttons */}
              <div className="flex bg-gray-800 rounded-md overflow-hidden">
                <button
                  onClick={() => setTopStoriesLayout("grid")}
                  className={`px-2 sm:px-3 py-2 text-xs font-medium transition-colors touch-target ${
                    topStoriesLayout === "grid"
                      ? "bg-[rgb(var(--color-accent))] text-white"
                      : "text-gray-300 hover:text-white hover:bg-gray-700"
                  }`}
                  style={{ minHeight: "44px", minWidth: "44px" }}
                  aria-label="Grid layout"
                  title="Exibição em grade"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setTopStoriesLayout("list")}
                  className={`px-2 sm:px-3 py-2 text-xs font-medium transition-colors touch-target ${
                    topStoriesLayout === "list"
                      ? "bg-[rgb(var(--color-accent))] text-white"
                      : "text-gray-300 hover:text-white hover:bg-gray-700"
                  }`}
                  style={{ minHeight: "44px", minWidth: "44px" }}
                  aria-label="List layout"
                  title="Exibição em lista"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Top Stories content with layout switching */}
          {topStoriesLayout === "grid" ? (
            /* Grid layout */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
              {topStoriesArticles.map((article, index) => (
                <div
                  key={article.link + index}
                  className="bg-gray-800/50 rounded-lg p-4 lg:p-6 border border-gray-700/50 hover:border-gray-600/50 grid-card group"
                >
                  <ArticleItem
                    article={article}
                    index={index + 2}
                    timeFormat={timeFormat}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* List layout */
            <div className="space-y-4">
              {topStoriesArticles.map((article, index) => (
                <article
                  key={article.link + index}
                  className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30 hover:bg-gray-800/50 hover:border-gray-600/50 transition-all duration-200"
                >
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-4 group"
                    aria-label={`Read article: ${article.title}`}
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold text-gray-300 group-hover:bg-[rgb(var(--color-accent))] group-hover:text-white transition-colors">
                      {index + 2}
                    </div>
                    <SmallOptimizedImage
                      src={article.imageUrl}
                      alt={`Thumbnail for ${article.title}`}
                      className="rounded-md"
                      fallbackText={article.sourceTitle}
                      size={64} // w-16 h-16 = 64px
                    />
                    <div className="flex-1 min-w-0">
                      <div className="mb-1">
                        <span className="inline-block bg-[rgb(var(--color-accent))]/20 text-[rgb(var(--color-accent))] px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide">
                          {article.sourceTitle}
                        </span>
                      </div>
                      <h3 className="text-base lg:text-lg font-medium text-gray-200 group-hover:text-white line-clamp-2 leading-tight">
                        {article.title}
                      </h3>
                      <div className="mt-2 flex items-center space-x-3 text-xs text-gray-400">
                        <time dateTime={article.pubDate.toISOString()}>
                          {layoutSettings.showPublicationTime
                            ? timeFormat === "12h"
                              ? `${article.pubDate.toLocaleDateString()} às ${article.pubDate.toLocaleTimeString(
                                  "pt-BR",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  }
                                )}`
                              : `${article.pubDate.toLocaleDateString()} às ${article.pubDate.toLocaleTimeString(
                                  "pt-BR",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false,
                                  }
                                )}`
                            : article.pubDate.toLocaleDateString()}
                        </time>
                        {article.author && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[120px]">
                              {article.author}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </a>
                </article>
              ))}
            </div>
          )}

          {/* Pagination controls removidos e movidos para o header */}
        </section>
      )}
    </div>
  );
};

// Export the component wrapped with performance monitoring
export const FeedContent = withPerformanceTracking(
  FeedContentComponent,
  "FeedContent"
);
