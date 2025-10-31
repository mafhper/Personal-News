/**
 * FeedProgressIndicator.tsx
 *
 * Component for displaying progress indicators during feed validation and discovery operations.
 */

import React from "react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { ActionIcons } from "./icons/ActionIcons";
import { StatusIcons } from "./icons/StatusIcons";

interface ProgressStep {
  id: string;
  label: string;
  status: "pending" | "active" | "completed" | "error";
  description?: string;
  error?: string;
}

interface FeedProgressIndicatorProps {
  isVisible: boolean;
  title: string;
  description?: string;
  steps: ProgressStep[];
  progress: number; // 0-100
  onCancel?: () => void;
  canCancel?: boolean;
  showDetails?: boolean;
  onToggleDetails?: () => void;
}

export const FeedProgressIndicator: React.FC<FeedProgressIndicatorProps> = ({
  isVisible,
  title,
  description,
  steps,
  progress,
  onCancel,
  canCancel = true,
  showDetails = false,
  onToggleDetails,
}) => {
  if (!isVisible) return null;

  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case "completed":
        return <StatusIcons.Success className="w-4 h-4 text-green-500" />;
      case "error":
        return <StatusIcons.Error className="w-4 h-4 text-red-500" />;
      case "active":
        return <StatusIcons.Loading className="w-4 h-4 text-blue-500" />;
      default:
        return (
          <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
        );
    }
  };

  const getStepBadgeVariant = (status: ProgressStep["status"]) => {
    switch (status) {
      case "completed":
        return "green";
      case "error":
        return "red";
      case "active":
        return "blue";
      default:
        return "gray";
    }
  };

  const activeStep = steps.find((step) => step.status === "active");
  const completedSteps = steps.filter(
    (step) => step.status === "completed"
  ).length;
  const hasErrors = steps.some((step) => step.status === "error");

  return (
    <Card className="border-blue-200 bg-blue-50" padding="lg">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <StatusIcons.Loading className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-blue-900">{title}</h3>
            </div>
            {description && (
              <p className="text-sm text-blue-700">{description}</p>
            )}
          </div>

          {canCancel && onCancel && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              icon={<ActionIcons.Close />}
            >
              Cancel
            </Button>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700">
              {activeStep ? activeStep.label : "Processing..."}
            </span>
            <span className="text-blue-600 font-medium">
              {Math.round(progress)}%
            </span>
          </div>

          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-blue-600">
            <span>
              {completedSteps} of {steps.length} steps completed
            </span>
            {hasErrors && (
              <Badge variant="red" className="text-xs">
                {steps.filter((s) => s.status === "error").length} error(s)
              </Badge>
            )}
          </div>
        </div>

        {/* Step details (collapsible) */}
        {onToggleDetails && (
          <div className="border-t border-blue-200 pt-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleDetails}
              icon={showDetails ? <ActionIcons.Hide /> : <ActionIcons.Show />}
              className="text-blue-700 hover:text-blue-800"
            >
              {showDetails ? "Hide Details" : "Show Details"}
            </Button>
          </div>
        )}

        {/* Detailed steps */}
        {showDetails && (
          <div className="space-y-2 border-t border-blue-200 pt-3">
            {steps.map((step, _index) => (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-2 rounded-md transition-colors ${
                  step.status === "active" ? "bg-blue-100" : "bg-transparent"
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">{getStepIcon(step)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {step.label}
                    </span>
                    <Badge
                      variant={getStepBadgeVariant(step.status) as any}
                      className="text-xs"
                    >
                      {step.status}
                    </Badge>
                  </div>

                  {step.description && (
                    <p className="text-xs text-gray-600 mb-1">
                      {step.description}
                    </p>
                  )}

                  {step.error && (
                    <p className="text-xs text-red-600 bg-red-50 p-1 rounded">
                      {step.error}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
