import React, { useState, useMemo, useCallback } from "react";
import { Modal } from "./Modal";
import { LazyImage } from "./LazyImage";
import { useFavorites, favoriteToArticle } from "../hooks/useFavorites";
import { useNotificationReplacements } from "../hooks/useNotificationReplacements";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Badge } from "./ui/Badge";
import { IconButton } from "./ui/IconButton";
import { ActionIcons, StatusIcons } from "./icons";
// import type { Article } from '../types';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    favorites,
    removeFromFavorites,
    clearAllFavorites,
    exportFavorites,
    importFavorites,
    getFavoritesByCategory,
    getFavoritesBySource,
  } = useFavorites();

  // Hook para notificações integradas
  const { alertSuccess } = useNotificationReplacements();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [sortBy, setSortBy] = useState<"recent" | "title" | "source">("recent");
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Get unique categories and sources from favorites
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    favorites.forEach((fav) => {
      fav.categories?.forEach((cat) => categories.add(cat));
    });
    return ["All", ...Array.from(categories).sort()];
  }, [favorites]);

  const availableSources = useMemo(() => {
    const sources = new Set<string>();
    favorites.forEach((fav) => {
      sources.add(fav.sourceTitle);
      if (fav.author) sources.add(fav.author);
    });
    return ["All", ...Array.from(sources).sort()];
  }, [favorites]);

  // Filter and sort favorites
  const filteredFavorites = useMemo(() => {
    let filtered = favorites;

    // Apply category filter
    if (selectedCategory !== "All") {
      filtered = getFavoritesByCategory(selectedCategory);
    }

    // Apply source filter
    if (selectedSource && selectedSource !== "All") {
      filtered = getFavoritesBySource(selectedSource);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (fav) =>
          fav.title.toLowerCase().includes(query) ||
          fav.sourceTitle.toLowerCase().includes(query) ||
          fav.author?.toLowerCase().includes(query) ||
          fav.description?.toLowerCase().includes(query)
      );
    }

    // Sort results
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "source":
          return a.sourceTitle.localeCompare(b.sourceTitle);
        case "recent":
        default:
          return (
            new Date(b.favoritedAt).getTime() -
            new Date(a.favoritedAt).getTime()
          );
      }
    });

    return sorted;
  }, [
    favorites,
    selectedCategory,
    selectedSource,
    searchQuery,
    sortBy,
    getFavoritesByCategory,
    getFavoritesBySource,
  ]);

  const handleExport = useCallback(() => {
    const data = exportFavorites();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `favorites-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportFavorites]);

  const handleImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        const success = importFavorites(content);
        if (success) {
          await alertSuccess("Favorites imported successfully!");
        } else {
          await alertSuccess(
            "Failed to import favorites. Please check the file format."
          );
        }
      };
      reader.readAsText(file);

      // Reset the input
      event.target.value = "";
    },
    [importFavorites]
  );

  const handleRemoveFavorite = useCallback(
    (favorite: any) => {
      const article = favoriteToArticle(favorite);
      removeFromFavorites(article);
    },
    [removeFromFavorites]
  );

  const handleClearAll = useCallback(() => {
    clearAllFavorites();
    setShowConfirmClear(false);
  }, [clearAllFavorites]);

  const timeSince = (dateString: string): string => {
    const date = new Date(dateString);
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
    <Modal isOpen={isOpen} onClose={onClose}>
      <Card
        className="max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        elevation="lg"
      >
        {/* Header */}
        <div className="border-b border-gray-700 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <StatusIcons.Success className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-white">My Favorites</h2>
              <Badge variant="primary">{favorites.length} articles</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={handleExport}
                variant="secondary"
                size="sm"
                icon={<ActionIcons.Export />}
              >
                Export
              </Button>
              <label className="cursor-pointer">
                <span className="inline-flex items-center justify-center rounded-lg border font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2 bg-[rgb(var(--color-surface))] hover:bg-[rgb(var(--color-surface))]/80 text-[rgb(var(--color-text))] border-[rgb(var(--color-border))] h-8 px-3 text-sm gap-1.5">
                  <ActionIcons.Import />
                  Import
                </span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <Button
                onClick={() => setShowConfirmClear(true)}
                variant="danger"
                size="sm"
                icon={<ActionIcons.Delete />}
                disabled={favorites.length === 0}
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Search favorites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[rgb(var(--color-textSecondary))]">
                <ActionIcons.Search />
              </div>
            </div>

            {/* Category Filter */}
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={availableCategories.map((category) => ({
                value: category,
                label: category,
              }))}
            />

            {/* Source Filter */}
            <Select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              options={availableSources.map((source) => ({
                value: source,
                label: source,
              }))}
            />

            {/* Sort */}
            <Select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "recent" | "title" | "source")
              }
              options={[
                { value: "recent", label: "Most Recent" },
                { value: "title", label: "Title A-Z" },
                { value: "source", label: "Source A-Z" },
              ]}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredFavorites.length === 0 ? (
            <div className="text-center py-16">
              <StatusIcons.Success className="w-16 h-16 mx-auto text-gray-600 mb-6 text-red-500" />
              <h3 className="text-xl font-semibold text-[rgb(var(--color-textSecondary))] mb-3">
                {favorites.length === 0
                  ? "No favorites yet"
                  : "No matching favorites"}
              </h3>
              <p className="text-[rgb(var(--color-textSecondary))] max-w-md mx-auto">
                {favorites.length === 0
                  ? "Start favoriting articles to see them here. Click the heart icon on any article to add it to your favorites."
                  : "Try adjusting your search terms or filters to find what you're looking for."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredFavorites.map((favorite) => (
                <Card
                  key={favorite.id}
                  className="hover:border-gray-600 transition-all duration-200 hover:shadow-lg"
                  elevation="sm"
                >
                  <div className="flex items-start space-x-4">
                    <LazyImage
                      src={
                        favorite.imageUrl ||
                        `https://picsum.photos/seed/${favorite.link}/80/80`
                      }
                      alt={`Thumbnail for ${favorite.title}`}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <a
                            href={favorite.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white font-semibold hover:text-blue-400 transition-colors line-clamp-2 text-lg leading-tight"
                          >
                            {favorite.title}
                          </a>
                          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                            <Badge variant="secondary" className="text-xs">
                              {favorite.author || favorite.sourceTitle}
                            </Badge>
                            <span className="text-[rgb(var(--color-textSecondary))]">
                              {timeSince(favorite.pubDate)}
                            </span>
                            <span className="text-[rgb(var(--color-textSecondary))]">
                              Favorited {timeSince(favorite.favoritedAt)}
                            </span>
                          </div>
                          {favorite.description && (
                            <p className="text-[rgb(var(--color-textSecondary))] text-sm mt-3 line-clamp-2 leading-relaxed">
                              {favorite.description}
                            </p>
                          )}
                        </div>
                        <IconButton
                          onClick={() => handleRemoveFavorite(favorite)}
                          variant="ghost"
                          size="sm"
                          icon={
                            <StatusIcons.Success className="text-red-400" />
                          }
                          className="ml-4 text-red-400 hover:text-red-300 hover:bg-red-900/20 flex-shrink-0"
                          title="Remove from favorites"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Confirm Clear Dialog */}
        {showConfirmClear && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <Card className="max-w-md w-full mx-4" elevation="lg">
              <div className="flex items-center mb-4">
                <StatusIcons.Warning className="w-6 h-6 text-yellow-500 mr-3" />
                <h3 className="text-lg font-semibold text-white">
                  Clear All Favorites?
                </h3>
              </div>
              <p className="text-[rgb(var(--color-textSecondary))] mb-6 leading-relaxed">
                This will permanently remove all{" "}
                <strong>{favorites.length}</strong> favorites. This action
                cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleClearAll}
                  variant="danger"
                  className="flex-1"
                  icon={<ActionIcons.Delete />}
                >
                  Clear All
                </Button>
                <Button
                  onClick={() => setShowConfirmClear(false)}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}
      </Card>
    </Modal>
  );
};
