/**
 * FeedProgressIndicator.test.tsx
 *
 * Tests for the FeedProgressIndicator component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { FeedProgressIndicator } from "../components/FeedProgressIndicator";
import { NotificationTestWrapper } from "./helpers/NotificationTestWrapper";

const renderWithNotifications = (component: React.ReactElement) => {
  return render(component, { wrapper: NotificationTestWrapper });
};

describe("FeedProgressIndicator", () => {
  const mockSteps = [
    {
      id: "step1",
      label: "Validating URL",
      status: "completed" as const,
      description: "Checking if URL is accessible",
    },
    {
      id: "step2",
      label: "Parsing feed",
      status: "active" as const,
      description: "Analyzing feed content",
    },
    {
      id: "step3",
      label: "Extracting metadata",
      status: "pending" as const,
      description: "Getting feed information",
    },
  ];

  const mockProps = {
    isVisible: true,
    title: "Processing Feed",
    description: "Validating and processing your RSS feed",
    steps: mockSteps,
    progress: 60,
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render progress indicator when visible", () => {
    renderWithNotifications(<FeedProgressIndicator {...mockProps} />);

    expect(screen.getByText("Processing Feed")).toBeInTheDocument();
    expect(
      screen.getByText("Validating and processing your RSS feed")
    ).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
  });

  it("should not render when not visible", () => {
    renderWithNotifications(
      <FeedProgressIndicator {...mockProps} isVisible={false} />
    );

    expect(screen.queryByText("Processing Feed")).not.toBeInTheDocument();
  });

  it("should show active step label", () => {
    renderWithNotifications(<FeedProgressIndicator {...mockProps} />);

    expect(screen.getByText("Parsing feed")).toBeInTheDocument();
  });

  it("should show progress bar with correct width", () => {
    renderWithNotifications(<FeedProgressIndicator {...mockProps} />);

    const progressBar = document.querySelector(".bg-blue-600");
    expect(progressBar).toHaveStyle("width: 60%");
  });

  it("should show completed steps count", () => {
    renderWithNotifications(<FeedProgressIndicator {...mockProps} />);

    expect(screen.getByText("1 of 3 steps completed")).toBeInTheDocument();
  });

  it("should handle cancel action", () => {
    renderWithNotifications(<FeedProgressIndicator {...mockProps} />);

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it("should hide cancel button when canCancel is false", () => {
    renderWithNotifications(
      <FeedProgressIndicator {...mockProps} canCancel={false} />
    );

    expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
  });

  it("should toggle details visibility", () => {
    const onToggleDetails = vi.fn();
    renderWithNotifications(
      <FeedProgressIndicator
        {...mockProps}
        onToggleDetails={onToggleDetails}
        showDetails={false}
      />
    );

    const showDetailsButton = screen.getByText("Show Details");
    fireEvent.click(showDetailsButton);

    expect(onToggleDetails).toHaveBeenCalled();
  });

  it("should show detailed steps when showDetails is true", () => {
    renderWithNotifications(
      <FeedProgressIndicator
        {...mockProps}
        showDetails={true}
        onToggleDetails={vi.fn()}
      />
    );

    expect(screen.getByText("Validating URL")).toBeInTheDocument();
    expect(
      screen.getByText("Checking if URL is accessible")
    ).toBeInTheDocument();
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("should show error badge when steps have errors", () => {
    const stepsWithError = [
      ...mockSteps,
      {
        id: "step4",
        label: "Failed step",
        status: "error" as const,
        error: "Something went wrong",
      },
    ];

    renderWithNotifications(
      <FeedProgressIndicator {...mockProps} steps={stepsWithError} />
    );

    expect(screen.getByText("1 error(s)")).toBeInTheDocument();
  });

  it("should show error details in step when showDetails is true", () => {
    const stepsWithError = [
      {
        id: "error-step",
        label: "Failed step",
        status: "error" as const,
        error: "Network timeout occurred",
      },
    ];

    renderWithNotifications(
      <FeedProgressIndicator
        {...mockProps}
        steps={stepsWithError}
        showDetails={true}
        onToggleDetails={vi.fn()}
      />
    );

    expect(screen.getByText("Network timeout occurred")).toBeInTheDocument();
  });

  it("should show fallback text when no active step", () => {
    const completedSteps = mockSteps.map((step) => ({
      ...step,
      status: "completed" as const,
    }));

    renderWithNotifications(
      <FeedProgressIndicator {...mockProps} steps={completedSteps} />
    );

    expect(screen.getByText("Processing...")).toBeInTheDocument();
  });
});
