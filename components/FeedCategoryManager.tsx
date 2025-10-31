/**
 * FeedCategoryManager.tsx
 *
 * Componente para gerenciamento de categorias de feeds no Personal News Dashboard.
 * Permite criar, editar, excluir e reorganizar categorias, além de arrastar feeds entre categorias.
 * Suporta importação e exportação de configurações de categorias.
 *
 * @author Matheus Pereira
 * @version 2.0.0
 */

import React, { useState, useRef, useCallback } from "react";
import { useFeedCategories } from "../hooks/useFeedCategories";
import { useLogger } from "../services/logger";
import type { FeedSource, FeedCategory } from "../types";
import { useNotificationReplacements } from "../hooks/useNotificationReplacements";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Badge } from "./ui/Badge";
import { IconButton } from "./ui/IconButton";
import { ActionIcons, StatusIcons } from "./icons";

interface FeedCategoryManagerProps {
  feeds: FeedSource[];
  setFeeds: (feeds: FeedSource[]) => void;
  onClose: () => void;
}

interface DragState {
  draggedItem: { type: "feed" | "category"; id: string; data: any } | null;
  dragOverCategory: string | null;
}

export const FeedCategoryManager: React.FC<FeedCategoryManagerProps> = ({
  feeds,
  setFeeds,
  onClose,
}) => {
  const logger = useLogger("FeedCategoryManager");
  const {
    categories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    getCategorizedFeeds,
    moveFeedToCategory,
    exportCategories,
    importCategories,
    resetToDefaults,
  } = useFeedCategories();

  // Hook para notificações integradas
  const { alertSuccess, alertError, confirmDanger } =
    useNotificationReplacements();

  const [dragState, setDragState] = useState<DragState>({
    draggedItem: null,
    dragOverCategory: null,
  });
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryForm, setEditingCategoryForm] = useState({
    name: "",
    color: "#3B82F6",
    description: "",
  });
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: "",
    color: "#3B82F6",
    description: "",
  });
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categorizedFeeds = getCategorizedFeeds(feeds);

  const handleDragStart = useCallback(
    (e: React.DragEvent, type: "feed" | "category", id: string, data: any) => {
      setDragState((prev) => ({
        ...prev,
        draggedItem: { type, id, data },
      }));
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, categoryId: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragState((prev) => ({
        ...prev,
        dragOverCategory: categoryId,
      }));
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    setDragState((prev) => ({
      ...prev,
      dragOverCategory: null,
    }));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetCategoryId: string) => {
      e.preventDefault();

      if (!dragState.draggedItem) return;

      const { type, id, data } = dragState.draggedItem;

      if (type === "feed") {
        moveFeedToCategory(data.url, targetCategoryId, feeds, setFeeds);
      } else if (type === "category") {
        // Handle category reordering
        const targetCategory = categories.find(
          (c) => c.id === targetCategoryId
        );
        const draggedCategory = categories.find((c) => c.id === id);

        if (targetCategory && draggedCategory) {
          const newOrder = [...categories]
            .sort((a, b) => a.order - b.order)
            .map((c) => c.id);

          const draggedIndex = newOrder.indexOf(id);
          const targetIndex = newOrder.indexOf(targetCategoryId);

          newOrder.splice(draggedIndex, 1);
          newOrder.splice(targetIndex, 0, id);

          reorderCategories(newOrder);
        }
      }

      setDragState({
        draggedItem: null,
        dragOverCategory: null,
      });
    },
    [
      dragState.draggedItem,
      categories,
      feeds,
      setFeeds,
      moveFeedToCategory,
      reorderCategories,
    ]
  );

  const handleCreateCategory = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (newCategoryForm.name.trim()) {
        createCategory(
          newCategoryForm.name.trim(),
          newCategoryForm.color,
          newCategoryForm.description.trim() || undefined
        );
        setNewCategoryForm({ name: "", color: "#3B82F6", description: "" });
        setShowNewCategoryForm(false);
      }
    },
    [newCategoryForm, createCategory]
  );

  const handleStartEditCategory = useCallback((category: FeedCategory) => {
    setEditingCategory(category.id);
    setEditingCategoryForm({
      name: category.name,
      color: category.color,
      description: category.description || "",
    });
  }, []);

  const handleSaveEditCategory = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (editingCategory && editingCategoryForm.name.trim()) {
        updateCategory(editingCategory, {
          name: editingCategoryForm.name.trim(),
          color: editingCategoryForm.color,
          description: editingCategoryForm.description.trim() || undefined,
        });
        setEditingCategory(null);
        setEditingCategoryForm({ name: "", color: "#3B82F6", description: "" });
      }
    },
    [editingCategory, editingCategoryForm, updateCategory]
  );

  const handleCancelEditCategory = useCallback(() => {
    setEditingCategory(null);
    setEditingCategoryForm({ name: "", color: "#3B82F6", description: "" });
  }, []);

  const handleDeleteCategory = useCallback(
    async (categoryId: string) => {
      const category = categories.find((c) => c.id === categoryId);
      const feedsInCategory = categorizedFeeds[categoryId] || [];
      const feedCount = feedsInCategory.length;

      let confirmMessage = `Tem certeza que deseja excluir a categoria "${category?.name}"?`;

      if (feedCount > 0) {
        confirmMessage += `\n\nEsta ação irá mover ${feedCount} feed${
          feedCount > 1 ? "s" : ""
        } para "Não categorizados":`;
        feedsInCategory.slice(0, 3).forEach((feed) => {
          confirmMessage += `\n• ${feed.customTitle || feed.url}`;
        });
        if (feedCount > 3) {
          confirmMessage += `\n• ... e mais ${feedCount - 3} feed${
            feedCount - 3 > 1 ? "s" : ""
          }`;
        }
      }

      if (await confirmDanger(confirmMessage)) {
        // Move feeds from deleted category to uncategorized
        feedsInCategory.forEach((feed) => {
          moveFeedToCategory(feed.url, "uncategorized", feeds, setFeeds);
        });

        deleteCategory(categoryId);

        // Show success message
        const successMessage =
          feedCount > 0
            ? `Categoria "${
                category?.name
              }" excluída com sucesso. ${feedCount} feed${
                feedCount > 1 ? "s foram movidos" : " foi movido"
              } para "Não categorizados".`
            : `Categoria "${category?.name}" excluída com sucesso.`;

        // Use a timeout to show the message after the UI updates
        setTimeout(async () => {
          await alertSuccess(successMessage);
        }, 100);
      }
    },
    [
      categories,
      categorizedFeeds,
      feeds,
      setFeeds,
      moveFeedToCategory,
      deleteCategory,
    ]
  );

  const handleExportCategories = useCallback(() => {
    const data = exportCategories();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feed-categories-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportCategories]);

  const handleImportCategories = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          const content = await file.text();
          const success = importCategories(content);
          if (success) {
            await alertSuccess("Categories imported successfully!");
          } else {
            await alertError(
              "Failed to import categories. Please check the file format."
            );
          }
        } catch (error) {
          await alertError("Failed to read the file.");
          logger.error(
            "Failed to read categories import file",
            error as Error,
            {
              additionalData: {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
              },
            }
          );
        }
      }
    },
    [importCategories]
  );

  const handleResetToDefaults = useCallback(async () => {
    if (
      await confirmDanger(
        "Are you sure you want to reset to default categories? This will remove all custom categories and reset feed assignments."
      )
    ) {
      resetToDefaults();
      // Reset all feed categories
      const resetFeeds = feeds.map((feed) => ({
        ...feed,
        categoryId: undefined,
      }));
      setFeeds(resetFeeds);
    }
  }, [resetToDefaults, feeds, setFeeds]);

  return (
    <div
      className="w-full max-w-7xl mx-auto p-4 sm:p-6"
      role="dialog"
      aria-labelledby="category-manager-title"
    >
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4">
        <div className="flex items-center space-x-3">
          <StatusIcons.Theme className="w-8 h-8 text-blue-500" />
          <div>
            <h2
              id="category-manager-title"
              className="text-2xl font-bold text-white"
            >
              Feed Category Manager
            </h2>
            <p className="text-[rgb(var(--color-textSecondary))] text-sm mt-1">
              Organize your feeds into categories with drag and drop
            </p>
          </div>
        </div>
        <IconButton
          onClick={onClose}
          variant="ghost"
          size="sm"
          icon={<ActionIcons.Close />}
          aria-label="Close category manager"
        />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Button
          onClick={() => setShowNewCategoryForm(true)}
          variant="primary"
          icon={<ActionIcons.Add />}
        >
          Create Category
        </Button>
        <Button
          onClick={handleExportCategories}
          variant="secondary"
          icon={<ActionIcons.Export />}
        >
          Export Categories
        </Button>
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="secondary"
          icon={<ActionIcons.Import />}
        >
          Import Categories
        </Button>
        <Button
          onClick={handleResetToDefaults}
          variant="danger"
          icon={<ActionIcons.Refresh />}
        >
          Reset to Defaults
        </Button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportCategories}
        accept=".json"
        className="hidden"
      />

      {/* New category form */}
      {showNewCategoryForm && (
        <Card className="mb-8" elevation="md">
          <div className="flex items-center mb-6">
            <ActionIcons.Add className="w-5 h-5 mr-2 text-blue-500" />
            <h3 className="text-lg font-semibold text-white">
              Create New Category
            </h3>
          </div>
          <form onSubmit={handleCreateCategory} className="space-y-6">
            <div>
              <label
                htmlFor="category-name"
                className="block text-sm font-medium text-[rgb(var(--color-text))] mb-2"
              >
                Category Name
              </label>
              <Input
                id="category-name"
                type="text"
                value={newCategoryForm.name}
                onChange={(e) =>
                  setNewCategoryForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Enter category name"
                required
              />
            </div>
            <div>
              <label
                htmlFor="category-color"
                className="block text-sm font-medium text-[rgb(var(--color-text))] mb-2"
              >
                Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  id="category-color"
                  type="color"
                  value={newCategoryForm.color}
                  onChange={(e) =>
                    setNewCategoryForm((prev) => ({
                      ...prev,
                      color: e.target.value,
                    }))
                  }
                  className="w-12 h-12 bg-gray-700 rounded-lg border border-[rgb(var(--color-border))] cursor-pointer"
                />
                <div className="flex items-center space-x-2">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-[rgb(var(--color-border))]"
                    style={{ backgroundColor: newCategoryForm.color }}
                  />
                  <span className="text-sm text-[rgb(var(--color-text))]">Preview</span>
                </div>
              </div>
            </div>
            <div>
              <label
                htmlFor="category-description"
                className="block text-sm font-medium text-[rgb(var(--color-text))] mb-2"
              >
                Description (optional)
              </label>
              <textarea
                id="category-description"
                value={newCategoryForm.description}
                onChange={(e) =>
                  setNewCategoryForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full bg-[rgb(var(--color-surface))] text-white rounded-lg px-4 py-3 border border-[rgb(var(--color-border))] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="Enter a description for this category..."
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="submit"
                variant="primary"
                icon={<ActionIcons.Save />}
              >
                Create Category
              </Button>
              <Button
                type="button"
                onClick={() => setShowNewCategoryForm(false)}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Edit category form */}
      {editingCategory && (
        <Card className="mb-8 ring-2 ring-blue-500" elevation="md">
          <div className="flex items-center mb-6">
            <ActionIcons.Edit className="w-5 h-5 mr-2 text-blue-500" />
            <h3 className="text-lg font-semibold text-white">Edit Category</h3>
          </div>
          <form onSubmit={handleSaveEditCategory} className="space-y-6">
            <div>
              <label
                htmlFor="edit-category-name"
                className="block text-sm font-medium text-[rgb(var(--color-text))] mb-2"
              >
                Category Name
              </label>
              <Input
                id="edit-category-name"
                type="text"
                value={editingCategoryForm.name}
                onChange={(e) =>
                  setEditingCategoryForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                required
                autoFocus
              />
            </div>
            <div>
              <label
                htmlFor="edit-category-color"
                className="block text-sm font-medium text-[rgb(var(--color-text))] mb-2"
              >
                Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  id="edit-category-color"
                  type="color"
                  value={editingCategoryForm.color}
                  onChange={(e) =>
                    setEditingCategoryForm((prev) => ({
                      ...prev,
                      color: e.target.value,
                    }))
                  }
                  className="w-12 h-12 bg-gray-700 rounded-lg border border-[rgb(var(--color-border))] cursor-pointer"
                />
                <div className="flex items-center space-x-2">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-[rgb(var(--color-border))]"
                    style={{ backgroundColor: editingCategoryForm.color }}
                  />
                  <span className="text-sm text-[rgb(var(--color-text))]">Preview</span>
                </div>
              </div>
            </div>
            <div>
              <label
                htmlFor="edit-category-description"
                className="block text-sm font-medium text-[rgb(var(--color-text))] mb-2"
              >
                Description (optional)
              </label>
              <textarea
                id="edit-category-description"
                value={editingCategoryForm.description}
                onChange={(e) =>
                  setEditingCategoryForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full bg-[rgb(var(--color-surface))] text-white rounded-lg px-4 py-3 border border-[rgb(var(--color-border))] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="Enter a description for this category..."
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="submit"
                variant="primary"
                icon={<ActionIcons.Save />}
              >
                Save Changes
              </Button>
              <Button
                type="button"
                onClick={handleCancelEditCategory}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Categories and feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card
            key={category.id}
            className={`transition-all ${
              dragState.dragOverCategory === category.id
                ? "ring-2 ring-blue-500 bg-blue-500/10"
                : ""
            }`}
            onDragOver={(e) => handleDragOver(e, category.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, category.id)}
            elevation="sm"
          >
            {/* Category header */}
            <div
              className="flex items-center justify-between mb-4 cursor-move"
              draggable={!category.isDefault}
              onDragStart={(e) =>
                handleDragStart(e, "category", category.id, category)
              }
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-5 h-5 rounded-full shadow-sm"
                  style={{ backgroundColor: category.color }}
                />
                <h3 className="font-semibold text-white text-lg">
                  {category.name}
                </h3>
                {category.isDefault && (
                  <Badge variant="secondary" className="text-xs">
                    default
                  </Badge>
                )}
              </div>

              {!category.isDefault && (
                <div className="flex space-x-1">
                  <IconButton
                    onClick={() => handleStartEditCategory(category)}
                    variant="ghost"
                    size="sm"
                    icon={<ActionIcons.Edit />}
                    aria-label={`Edit ${category.name} category`}
                  />
                  <IconButton
                    onClick={() => handleDeleteCategory(category.id)}
                    variant="ghost"
                    size="sm"
                    icon={<ActionIcons.Delete />}
                    className="text-red-400 hover:text-red-300"
                    aria-label={`Delete ${category.name} category`}
                  />
                </div>
              )}
            </div>

            {category.description && (
              <p className="text-[rgb(var(--color-textSecondary))] text-sm mb-4 leading-relaxed">
                {category.description}
              </p>
            )}

            {/* Feeds in category */}
            <div className="space-y-3 min-h-[120px]">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {categorizedFeeds[category.id]?.length || 0} feeds
                </Badge>
                {(categorizedFeeds[category.id]?.length || 0) > 0 && (
                  <span className="text-xs text-gray-500">Drag to reorder</span>
                )}
              </div>

              {(categorizedFeeds[category.id] || []).map((feed) => (
                <div
                  key={feed.url}
                  className="bg-[rgb(var(--color-surface))] p-3 rounded-lg cursor-move hover:bg-gray-700 transition-all duration-200 border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-border))]"
                  draggable
                  onDragStart={(e) =>
                    handleDragStart(e, "feed", feed.url, feed)
                  }
                >
                  <div
                    className="text-sm text-white font-medium truncate mb-1"
                    title={feed.url}
                  >
                    {feed.customTitle || feed.url}
                  </div>
                  <div className="text-xs text-[rgb(var(--color-textSecondary))] truncate">
                    {feed.url}
                  </div>
                </div>
              ))}

              {category.id === "uncategorized" &&
                (categorizedFeeds.uncategorized || []).map((feed) => (
                  <div
                    key={feed.url}
                    className="bg-[rgb(var(--color-surface))] p-3 rounded-lg cursor-move hover:bg-gray-700 transition-all duration-200 border-l-4 border-yellow-500 border-t border-r border-b border-[rgb(var(--color-border))]"
                    draggable
                    onDragStart={(e) =>
                      handleDragStart(e, "feed", feed.url, feed)
                    }
                  >
                    <div
                      className="text-sm text-white font-medium truncate mb-1"
                      title={feed.url}
                    >
                      {feed.customTitle || feed.url}
                    </div>
                    <div className="text-xs text-[rgb(var(--color-textSecondary))] truncate">
                      {feed.url}
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        ))}

        {/* Uncategorized feeds */}
        {(categorizedFeeds.uncategorized || []).length > 0 && (
          <Card
            className={`border-2 border-dashed border-yellow-500 transition-all ${
              dragState.dragOverCategory === "uncategorized"
                ? "ring-2 ring-blue-500 bg-blue-500/10"
                : ""
            }`}
            onDragOver={(e) => handleDragOver(e, "uncategorized")}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, "uncategorized")}
            elevation="sm"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-5 h-5 rounded-full bg-yellow-500 shadow-sm" />
              <h3 className="font-semibold text-white text-lg">
                Uncategorized
              </h3>
              <Badge
                variant="secondary"
                className="bg-yellow-500/20 text-yellow-300 border-yellow-500"
              >
                needs organization
              </Badge>
            </div>

            <div className="space-y-3">
              <Badge variant="secondary" className="text-xs">
                {categorizedFeeds.uncategorized?.length || 0} feeds
              </Badge>

              {(categorizedFeeds.uncategorized || []).map((feed) => (
                <div
                  key={feed.url}
                  className="bg-[rgb(var(--color-surface))] p-3 rounded-lg cursor-move hover:bg-gray-700 transition-all duration-200 border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-border))]"
                  draggable
                  onDragStart={(e) =>
                    handleDragStart(e, "feed", feed.url, feed)
                  }
                >
                  <div
                    className="text-sm text-white font-medium truncate mb-1"
                    title={feed.url}
                  >
                    {feed.customTitle || feed.url}
                  </div>
                  <div className="text-xs text-[rgb(var(--color-textSecondary))] truncate">
                    {feed.url}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Instructions */}
      <Card className="mt-8" elevation="sm">
        <div className="flex items-center mb-4">
          <StatusIcons.Info className="w-5 h-5 mr-2 text-blue-500" />
          <h4 className="font-semibold text-white">How to Use</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[rgb(var(--color-text))]">
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Drag feeds between categories to organize them</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>
                Drag categories to reorder them (custom categories only)
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Click the edit icon to rename custom categories</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Export/import categories to share configurations</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Default categories cannot be deleted or reordered</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Use color coding to visually distinguish categories</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
