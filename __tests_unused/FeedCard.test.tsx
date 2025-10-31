/**
 * FeedCard.test.tsx
 *
 * Tests for the FeedCard component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { FeedCard } from "../components/FeedCard";
import { NotificationTestWrapper } from "./helpers/NotificationTestWrapper";
import type { FeedSource } from "../types";
import type { FeedValidationResult } from "../services/feedValidator";

const renderWithNotifications = (component: React.ReactElement) => {
  return render(component, { wrapper: NotificationTestWrapper });
};

describe("FeedCard", () => {
  const mockFeed: FeedSource = {
    url: "https://example.com/feed.xml",
    customTitle: "Test Feed",
  };

  const mockValidation: FeedValidationResult = {
    url: "https://example.com/feed.xml",
    status: "valid",
    isValid: true,
    title: "Test Feed Title",
    description: "Test feed description",
    lastChecked: new Date().toISOString(),
    totalRetries: 0,
    validationAttempts: [],
  };

  const mockProps = {
    feed: mockFeed,
    onEdit: vi.fn(),
    onRemove: vi.fn(),
    onRetry: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render feed card with basic information", () => {
    renderWithNotifications(<FeedCard {...mockProps} />);

    expect(screen.getByText("Test Feed")).toBeInTheDocument();
    expect(
      screen.getByText("https://example.com/feed.xml")
    ).toBeInTheDocument();
    expect(screen.getByText("Not checked")).toBeInTheDocument();
  });

  it("should render validation status correctly", () => {
    renderWithNotifications(
      <FeedCard {...mockProps} validation={mockValidation} />
    );

    expect(screen.getByText("Valid")).toBeInTheDocument();
    expect(screen.getByText("Test Feed Title")).toBeInTheDocument();
    expect(screen.getByText("Test feed description")).toBeInTheDocument();
  });

  it("should show loading state when validating", () => {
    renderWithNotifications(<FeedCard {...mockProps} isValidating={true} />);

    expect(screen.getByText("Validating...")).toBeInTheDocument();
  });

  it("should show discovery progress when discovering", () => {
    const discoveryProgress = {
      status: "Searching for feeds...",
      progress: 50,
    };

    renderWithNotifications(
      <FeedCard
        {...mockProps}
        isDiscovering={true}
        discoveryProgress={discoveryProgress}
      />
    );

    expect(screen.getAllByText("Searching for feeds...")).toHaveLength(2);
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("should handle edit button click", () => {
    renderWithNotifications(<FeedCard {...mockProps} />);

    const editButton = screen.getByTitle("Edit feed");
    fireEvent.click(editButton);

    expect(mockProps.onEdit).toHaveBeenCalledWith(mockFeed.url);
  });

  it("should handle remove button click", () => {
    renderWithNotifications(<FeedCard {...mockProps} />);

    const removeButton = screen.getByTitle("Remove feed");
    fireEvent.click(removeButton);

    expect(mockProps.onRemove).toHaveBeenCalledWith(mockFeed.url);
  });

  it("should handle retry button click", () => {
    renderWithNotifications(<FeedCard {...mockProps} />);

    const retryButton = screen.getByTitle("Retry validation");
    fireEvent.click(retryButton);

    expect(mockProps.onRetry).toHaveBeenCalledWith(mockFeed.url);
  });

  it("should show selection checkbox in select mode", () => {
    renderWithNotifications(
      <FeedCard {...mockProps} isSelectMode={true} onSelect={vi.fn()} />
    );

    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("should handle selection in select mode", () => {
    const onSelect = vi.fn();
    renderWithNotifications(
      <FeedCard {...mockProps} isSelectMode={true} onSelect={onSelect} />
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(onSelect).toHaveBeenCalledWith(mockFeed.url);
  });

  it("should show error message for invalid feeds", () => {
    const invalidValidation: FeedValidationResult = {
      ...mockValidation,
      status: "invalid",
      isValid: false,
      error: "Feed not found",
    };

    renderWithNotifications(
      <FeedCard {...mockProps} validation={invalidValidation} />
    );

    expect(screen.getByText("Invalid")).toBeInTheDocument();
    expect(screen.getByText("Feed not found")).toBeInTheDocument();
  });

  it("should disable buttons when validating", () => {
    renderWithNotifications(<FeedCard {...mockProps} isValidating={true} />);

    expect(screen.getByTitle("Retry validation")).toBeDisabled();
    expect(screen.getByTitle("Edit feed")).toBeDisabled();
    expect(screen.getByTitle("Remove feed")).toBeDisabled();
  });

  it("should truncate long URLs", () => {
    const longUrlFeed: FeedSource = {
      url: "https://very-long-domain-name-that-should-be-truncated.com/very/long/path/to/feed.xml",
    };

    renderWithNotifications(<FeedCard {...mockProps} feed={longUrlFeed} />);

    expect(screen.getByText(/\.\.\.$/)).toBeInTheDocument();
  });
});
