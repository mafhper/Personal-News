/**
 * FeedDiscoveryModal.tsx
 *
 * Modal component for displaying feed discovery results and allowing user selection
 * when multiple feeds are discovered from a single URL.
 */

import React from "react";
import { Modal } from "./Modal";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { ActionIcons } from "./icons/ActionIcons";
import { StatusIcons } from "./icons/StatusIcons";
import { FeedIcons } from "./icons/FeedIcons";
import type { DiscoveredFeed } from "../services/feedDiscoveryService";

interface FeedDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalUrl: string;
  discoveredFeeds: DiscoveredFeed[];
  onSelectFeed: (feed: DiscoveredFeed) => void;
  isLoading?: boolean;
}

export const FeedDiscoveryModal: React.FC<FeedDiscoveryModalProps> = ({
  isOpen,
  onClose,
  originalUrl,
  discoveredFeeds,
  onSelectFeed,
  isLoading = false,
}) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "green";
    if (confidence >= 0.6) return "yellow";
    return "red";
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.6) return "Medium";
    return "Low";
  };

  const getMethodText = (method: string) => {
    switch (method) {
      case "direct":
        return "Direct RSS";
      case "link_discovery":
        return "Link Discovery";
      case "html_parsing":
        return "HTML Parsing";
      case "common_paths":
        return "Common Paths";
      default:
        return method;
    }
  };

  const handleSelectFeed = (feed: DiscoveredFeed) => {
    if (!isLoading) {
      onSelectFeed(feed);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        {/* Modal title */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">
            Multiple Feeds Discovered
          </h2>
        </div>
        {/* Header information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <StatusIcons.Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">
                Multiple RSS feeds found
              </h3>
              <p className="text-sm text-blue-700">
                We discovered {discoveredFeeds.length} RSS feeds from the URL
                you provided. Please select the feed you want to add:
              </p>
              <p className="text-xs text-blue-600 mt-2 font-mono break-all">
                {originalUrl}
              </p>
            </div>
          </div>
        </div>

        {/* Discovered feeds list */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {discoveredFeeds.map((feed, index) => (
            <Card
              key={`${feed.url}-${index}`}
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-blue-300"
              onClick={() => handleSelectFeed(feed)}
              padding="md"
            >
              <div className="flex items-start justify-between mb-3">
                {/* Feed type and confidence */}
                <div className="flex items-center gap-2">
                  <FeedIcons.RSS className="text-orange-500" />
                  <Badge
                    variant={getConfidenceColor(feed.confidence) as any}
                    className="text-xs"
                  >
                    {getConfidenceText(feed.confidence)} Confidence
                  </Badge>
                  <Badge variant="gray" className="text-xs">
                    {getMethodText(feed.discoveryMethod)}
                  </Badge>
                </div>

                {/* Select button */}
                <Button
                  size="sm"
                  variant="primary"
                  onClick={(e) => {
                    e?.stopPropagation();
                    handleSelectFeed(feed);
                  }}
                  disabled={isLoading}
                  icon={<ActionIcons.Add />}
                >
                  Select
                </Button>
              </div>

              {/* Feed title */}
              <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {feed.title || "Untitled Feed"}
              </h4>

              {/* Feed URL */}
              <p className="text-sm text-gray-600 mb-2 font-mono break-all">
                {feed.url.length > 80
                  ? `${feed.url.substring(0, 77)}...`
                  : feed.url}
              </p>

              {/* Feed description */}
              {feed.description && (
                <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">
                  {feed.description}
                </p>
              )}

              {/* Additional metadata */}
              <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-500">
                <span>Confidence: {Math.round(feed.confidence * 100)}%</span>
                {feed.type && <span>Type: {feed.type}</span>}
              </div>
            </Card>
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {discoveredFeeds.length} feed
            {discoveredFeeds.length !== 1 ? "s" : ""} found
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
