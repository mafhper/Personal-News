/**
 * FeedValidationErrorModal.tsx
 *
 * Modal component for displaying feed validation errors with actionable resolution options.
 */

import React from "react";
import { Modal } from "./Modal";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { ActionIcons } from "./icons/ActionIcons";
import { StatusIcons } from "./icons/StatusIcons";
import type { FeedValidationResult } from "../services/feedValidator";

interface FeedValidationErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedUrl: string;
  validationResult: FeedValidationResult;
  onRetry: () => void;
  onForceDiscovery: () => void;
  onAddAnyway: () => void;
  onEditUrl: () => void;
  isRetrying?: boolean;
  isDiscovering?: boolean;
}

export const FeedValidationErrorModal: React.FC<
  FeedValidationErrorModalProps
> = ({
  isOpen,
  onClose,
  feedUrl,
  validationResult,
  onRetry,
  onForceDiscovery,
  onAddAnyway,
  onEditUrl,
  isRetrying = false,
  isDiscovering = false,
}) => {
  const getErrorSeverity = () => {
    if (validationResult.status === "invalid") return "error";
    return "info";
  };

  const getSeverityIcon = () => {
    const severity = getErrorSeverity();
    switch (severity) {
      case "error":
        return <StatusIcons.Error className="w-5 h-5 text-red-600" />;
      default:
        return <StatusIcons.Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityColors = () => {
    const severity = getErrorSeverity();
    switch (severity) {
      case "error":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          text: "text-red-900",
          subtext: "text-red-700",
        };
      default:
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-900",
          subtext: "text-blue-700",
        };
    }
  };

  const colors = getSeverityColors();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Card className="max-w-2xl w-full">
        <div className="flex items-start space-x-4 mb-6">
          {getSeverityIcon()}
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Feed Validation Error
            </h2>
            <p className="text-gray-600">
              There was an issue validating the RSS feed at:
            </p>
            <code className="block mt-2 p-2 bg-gray-100 rounded text-sm break-all">
              {feedUrl}
            </code>
          </div>
        </div>

        <div
          className={`p-4 rounded-lg ${colors.bg} ${colors.border} border mb-6`}
        >
          <div className="flex items-center space-x-2 mb-2">
            <Badge variant="gray">{validationResult.status}</Badge>
            <span className={`text-sm font-medium ${colors.text}`}>
              {validationResult.error || "Validation failed"}
            </span>
          </div>

          {validationResult.finalError?.message && (
            <p className={`text-sm ${colors.subtext} mt-2`}>
              {validationResult.finalError.message}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={onRetry}
            variant="primary"
            icon={<ActionIcons.Retry />}
            loading={isRetrying}
            disabled={isDiscovering}
          >
            Retry Validation
          </Button>

          <Button
            onClick={onForceDiscovery}
            variant="secondary"
            icon={<ActionIcons.Search />}
            loading={isDiscovering}
            disabled={isRetrying}
          >
            Try Auto-Discovery
          </Button>

          <Button
            onClick={onEditUrl}
            variant="secondary"
            icon={<ActionIcons.Edit />}
          >
            Edit URL
          </Button>

          <Button
            onClick={onAddAnyway}
            variant="ghost"
            icon={<ActionIcons.Add />}
          >
            Add Anyway
          </Button>
        </div>
      </Card>
    </Modal>
  );
};
