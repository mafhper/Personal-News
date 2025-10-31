/**
 * FeedManagerControls.tsx
 *
 * Enhanced controls for the FeedManager component including search, filters,
 * sorting, and bulk actions.
 */

import React from "react";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Button } from "./ui/Button";
import { IconButton } from "./ui/IconButton";
import { Badge } from "./ui/Badge";
import { ActionIcons } from "./icons/ActionIcons";
import { StatusIcons } from "./icons/StatusIcons";

interface FeedManagerControlsProps {
  // Search and filter state
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;

  // View mode
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;

  // Selection state
  isSelectMode: boolean;
  onToggleSelectMode: () => void;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;

  // Bulk actions
  onBulkDelete: () => void;
  onBulkValidate: () => void;
  onBulkExport: () => void;

  // Other actions
  onClearFilters: () => void;
  onRefreshAll: () => void;

  // Loading states
  isValidating?: boolean;
  isLoading?: boolean;
}

export const FeedManagerControls: React.FC<FeedManagerControlsProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  isSelectMode,
  onToggleSelectMode,
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  onBulkValidate,
  onBulkExport,
  onClearFilters,
  onRefreshAll,
  isValidating = false,
  isLoading = false,
}) => {
  const hasActiveFilters = searchTerm || statusFilter !== "all";
  const hasSelection = selectedCount > 0;
  const isAllSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="space-y-4">
      {/* Top row: Search and main actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search input */}
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search feeds by URL, title, or description..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full"
            startIcon={<ActionIcons.Search />}
          />
        </div>

        {/* Main action buttons */}
        <div className="flex items-center gap-2">
          {/* Refresh all button */}
          <IconButton
            variant="ghost"
            onClick={onRefreshAll}
            disabled={isValidating || isLoading}
            title="Refresh all feeds"
            loading={isValidating}
          >
            <ActionIcons.Retry />
          </IconButton>

          {/* View mode toggle */}
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <IconButton
              variant={viewMode === "grid" ? "primary" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("grid")}
              title="Grid view"
              className="rounded-none border-0"
            >
              <ActionIcons.Grid />
            </IconButton>
            <IconButton
              variant={viewMode === "list" ? "primary" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("list")}
              title="List view"
              className="rounded-none border-0 border-l border-gray-300"
            >
              <ActionIcons.List />
            </IconButton>
          </div>

          {/* Select mode toggle */}
          <Button
            variant={isSelectMode ? "primary" : "secondary"}
            onClick={onToggleSelectMode}
            icon={<ActionIcons.CheckSquare />}
          >
            {isSelectMode ? "Cancel" : "Select"}
          </Button>
        </div>
      </div>

      {/* Second row: Filters and sorting */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Filters */}
        <div className="flex items-center gap-3">
          {/* Status filter */}
          <Select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="min-w-[120px]"
            options={[
              { value: "all", label: "All Status" },
              { value: "valid", label: "Valid" },
              { value: "invalid", label: "Invalid" },
              { value: "warning", label: "Warning" },
              { value: "unchecked", label: "Not Checked" },
            ]}
          />

          {/* Sort options */}
          <Select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="min-w-[140px]"
            options={[
              { value: "name", label: "Sort by Name" },
              { value: "status", label: "Sort by Status" },
              { value: "lastUpdated", label: "Sort by Last Updated" },
              { value: "dateAdded", label: "Sort by Date Added" },
            ]}
          />

          {/* Clear filters button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              icon={<ActionIcons.Close />}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Results count and active filters */}
        <div className="flex items-center gap-2">
          {/* Active filters badges */}
          {searchTerm && (
            <Badge variant="blue" className="text-xs">
              Search: "
              {searchTerm.length > 20
                ? `${searchTerm.substring(0, 20)}...`
                : searchTerm}
              "
            </Badge>
          )}
          {statusFilter !== "all" && (
            <Badge variant="gray" className="text-xs">
              Status: {statusFilter}
            </Badge>
          )}

          {/* Results count */}
          <span className="text-sm text-gray-500">
            {totalCount} feed{totalCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Selection bar (shown when in select mode) */}
      {isSelectMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            {/* Selection info */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedCount} of {totalCount} selected
              </span>

              {/* Select all/none toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={isAllSelected ? onClearSelection : onSelectAll}
                icon={
                  isAllSelected ? (
                    <ActionIcons.Square />
                  ) : (
                    <ActionIcons.CheckSquare />
                  )
                }
              >
                {isAllSelected ? "Deselect All" : "Select All"}
              </Button>
            </div>

            {/* Bulk actions */}
            {hasSelection && (
              <div className="flex items-center gap-2">
                {/* Bulk validate */}
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={onBulkValidate}
                  disabled={isValidating}
                  title={`Validate ${selectedCount} selected feeds`}
                >
                  <StatusIcons.Loading />
                </IconButton>

                {/* Bulk export */}
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={onBulkExport}
                  title={`Export ${selectedCount} selected feeds`}
                >
                  <ActionIcons.Export />
                </IconButton>

                {/* Bulk delete */}
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={onBulkDelete}
                  title={`Delete ${selectedCount} selected feeds`}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <ActionIcons.Delete />
                </IconButton>
              </div>
            )}
          </div>

          {/* Selection progress bar */}
          {totalCount > 0 && (
            <div className="mt-3">
              <div className="w-full bg-blue-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(selectedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
