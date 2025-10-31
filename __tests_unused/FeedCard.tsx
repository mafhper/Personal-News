/**
 * FeedCard.tsx
 *
 * Modern card componenying RSS feedrmation with Material-UI styling.
 * Features visual status indicators, hover states, and interactive feedback.
 */

import React from "react";
import type { FeedSource } from "../types";
import type { FeedValidationResult } from "../services/feedValidator";
import { Card } from "./ui/Card";

import { IconButton } from "./ui/IconButton";
import { Badge } from "./ui/Badge";
import { FeedIcons } from "./icons/FeedIcons";
import { ActionIcons } from "./icons/ActionIcons";
import { StatusIcons } from "./icons/StatusIcons";

interface FeedCardProps {
  feed: FeedSource;
  validation?: FeedValidationResult;
  onEdit: (url: string) => void;
  onRemove: (url: string) => void;
  onRetry: (url: string) => void;
  onForceDiscovery?: (url: string) => void;
  onClearCache?: (url: string) => void;
  isSelected?: boolean;
  onSelect?: (url: string) => void;
  isSelectMode?: boolean;
  isValidating?: boolean;
  discoveryProgress?: {
    status: string;
    progress: number;
  };
  isDiscovering?: boolean;
}

export const FeedCard: React.FC<FeedCardProps> = ({
  feed,
  validation,
  onEdit,
  onRemove,
  onRetry,
  onForceDiscovery,
  onClearCache,
  isSelected = false,
  onSelect,
  isSelectMode = false,
  isValidating = false,
  discoveryProgress,
  isDiscovering = false,
}) => {
  const getStatusInfo = () => {
    if (isDiscovering && discoveryProgress) {
      return {
        icon: <StatusIcons.Loading />,
        color: "blue" as const,
        text: discoveryProgress.status,
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      };
    }

    if (isValidating) {
      return {
        icon: <StatusIcons.Loading />,
        color: "blue" as const,
        text: "Validating...",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      };
    }

    if (!validation) {
      return {
        icon: <StatusIcons.Unknown />,
        color: "gray" as const,
        text: "Not checked",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
      };
    }

    switch (validation.status) {
      case "valid":
        return {
          icon: <StatusIcons.Success />,
          color: "green" as const,
          text: "Valid",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        };
      case "invalid":
        return {
          icon: <StatusIcons.Error />,
          color: "red" as const,
          text: "Invalid",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        };

      default:
        return {
          icon: <StatusIcons.Unknown />,
          color: "gray" as const,
          text: "Unknown",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        };
    }
  };

  const statusInfo = getStatusInfo();
  const displayTitle = validation?.title || feed.customTitle || "Untitled Feed";
  const displayUrl =
    feed.url.length > 50 ? `${feed.url.substring(0, 47)}...` : feed.url;

  const handleCardClick = () => {
    if (isSelectMode && onSelect) {
      onSelect(feed.url);
    }
  };

  const handleRemoveClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onRemove(feed.url);
  };

  const handleEditClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onEdit(feed.url);
  };

  const handleRetryClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onRetry(feed.url);
  };

  const handleForceDiscoveryClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onForceDiscovery) {
      onForceDiscovery(feed.url);
    }
  };

  const handleClearCacheClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onClearCache) {
      onClearCache(feed.url);
    }
  };

  return (
    <Card
      className={`
        relative transition-all duration-200 cursor-pointer
        ${statusInfo.bgColor} ${statusInfo.borderColor}
        ${
          isSelectMode
            ? "hover:shadow-md"
            : "hover:shadow-lg hover:-translate-y-0.5"
        }
        ${isSelected ? "ring-2 ring-blue-500 shadow-md" : ""}
        ${isDiscovering ? "animate-pulse" : ""}
      `}
      onClick={handleCardClick}
      padding="lg"
    >
      {/* Selection checkbox for select mode */}
      {isSelectMode && (
        <div className="absolute top-3 left-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect?.(feed.url)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Status badge */}
      <div className="flex items-start justify-between mb-3">
        <Badge variant={statusInfo.color} className="flex items-center gap-1.5">
          {statusInfo.icon}
          <span className="text-xs font-medium">{statusInfo.text}</span>
        </Badge>

        {/* Feed type icon */}
        <div className="text-gray-400">
          <FeedIcons.RSS />
        </div>
      </div>

      {/* Feed title */}
      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
        {displayTitle}
      </h3>

      {/* Feed URL */}
      <p className="text-sm text-gray-600 mb-3 font-mono break-all">
        {displayUrl}
      </p>

      {/* Feed description (if available) */}
      {validation?.description && (
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
          {validation.description}
        </p>
      )}

      {/* Discovery progress bar */}
      {isDiscovering && discoveryProgress && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">
              {discoveryProgress.status}
            </span>
            <span className="text-xs text-gray-500">
              {Math.round(discoveryProgress.progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${discoveryProgress.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Feed metadata */}
      {validation && (
        <div className="flex flex-wrap gap-2 mb-4 text-xs text-gray-500">
          {validation.lastChecked && (
            <span>
              Last checked:{" "}
              {new Date(validation.lastChecked).toLocaleDateString()}
            </span>
          )}
          {validation.totalRetries > 0 && (
            <span>Retries: {validation.totalRetries}</span>
          )}
        </div>
      )}

      {/* Error message */}
      {validation?.error && validation.status !== "valid" && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-xs text-red-700 leading-relaxed">
            {validation.error}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="flex items-center gap-1">
          {/* Retry button */}
          <IconButton
            variant="ghost"
            size="sm"
            onClick={handleRetryClick}
            disabled={isValidating || isDiscovering}
            title="Retry validation"
          >
            <ActionIcons.Retry />
          </IconButton>

          {/* Force discovery button */}
          {onForceDiscovery && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={handleForceDiscoveryClick}
              disabled={isValidating || isDiscovering}
              title="Force feed discovery"
            >
              <ActionIcons.Search />
            </IconButton>
          )}

          {/* Clear cache button */}
          {onClearCache && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={handleClearCacheClick}
              disabled={isValidating || isDiscovering}
              title="Clear cache"
            >
              <ActionIcons.Refresh />
            </IconButton>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Edit button */}
          <IconButton
            variant="ghost"
            size="sm"
            onClick={handleEditClick}
            disabled={isValidating || isDiscovering}
            title="Edit feed"
          >
            <ActionIcons.Edit />
          </IconButton>

          {/* Remove button */}
          <IconButton
            variant="ghost"
            size="sm"
            onClick={handleRemoveClick}
            disabled={isValidating || isDiscovering}
            title="Remove feed"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <ActionIcons.Delete />
          </IconButton>
        </div>
      </div>
    </Card>
  );
};
