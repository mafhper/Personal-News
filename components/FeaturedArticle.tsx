import React from "react";
import type { Article } from "../types";
import { useArticleLayout } from "../hooks/useArticleLayout";
import { OptimizedImage } from "./OptimizedImage";
import { FavoriteButton } from "./FavoriteButton";

// ChatBubbleIcon removed as it's no longer used

export const FeaturedArticle: React.FC<{
  article: Article;
  timeFormat?: "12h" | "24h";
}> = ({ article, timeFormat = "24h" }) => {
  const { settings: layoutSettings } = useArticleLayout();
  return (
    <article
      className="h-full"
      role="article"
      aria-labelledby="featured-article-title"
    >
      <div className="relative group h-full">
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative h-full"
          aria-label={`Read featured article: ${article.title} from ${
            article.author || article.sourceTitle
          }`}
        >
          <OptimizedImage
            src={article.imageUrl}
            alt={`Featured image for article: ${article.title}`}
            className="rounded-lg shadow-2xl"
            fallbackText={article.sourceTitle}
            width={1200}
            height={800}
            priority={true}
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent rounded-lg"
            aria-hidden="true"
          ></div>

          {/* Source badge */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 bg-[rgb(var(--color-accent))]/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            {article.sourceTitle}
          </div>

          {/* Favorite button - positioned with adequate spacing inside image bounds */}
          <FavoriteButton
            article={article}
            size="large"
            position="overlay"
            className="absolute top-3 right-3 z-20 hover:scale-110 active:scale-95 transition-transform duration-200 ease-in-out"
          />

          <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8 xl:p-10 text-white">
            <h3
              id="featured-article-title"
              className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold leading-tight drop-shadow-lg group-hover:underline transition-all duration-300"
              style={{
                lineHeight: "1.1",
                textShadow: "0 4px 8px rgba(0,0,0,0.8)",
                maxWidth: "100%",
                overflowWrap: "break-word",
              }}
            >
              {article.title}
            </h3>
            <p className="mt-4 lg:mt-6 text-base lg:text-lg xl:text-xl text-gray-200 drop-shadow-md hidden md:block leading-relaxed max-w-4xl">
              {article.description}
            </p>
            <footer className="mt-4 lg:mt-6 flex items-center space-x-4 lg:space-x-6 text-xs lg:text-sm font-bold uppercase text-gray-300">
              <span
                aria-label={`Author: ${article.author || article.sourceTitle}`}
              >
                {article.author || article.sourceTitle}
              </span>
              <span className="text-gray-500" aria-hidden="true">
                |
              </span>
              <time
                dateTime={article.pubDate.toISOString()}
                aria-label={`Published on ${article.pubDate.toLocaleDateString()}`}
              >
                {layoutSettings.showPublicationTime
                  ? timeFormat === "12h"
                    ? `${article.pubDate.toLocaleDateString()} às ${article.pubDate.toLocaleTimeString(
                        "pt-BR",
                        { hour: "2-digit", minute: "2-digit", hour12: true }
                      )}`
                    : `${article.pubDate.toLocaleDateString()} às ${article.pubDate.toLocaleTimeString(
                        "pt-BR",
                        { hour: "2-digit", minute: "2-digit", hour12: false }
                      )}`
                  : article.pubDate.toLocaleDateString()}
              </time>
              {/* Comentários removidos conforme solicitado */}
            </footer>
          </div>
        </a>
      </div>
    </article>
  );
};
