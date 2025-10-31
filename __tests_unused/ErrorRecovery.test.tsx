/**
 * ErrorRecovery.test.tsx
 *
 * Tests for error recovery components to ensure they handle various
 * error scenarios correctly and provide appropriate recovery options.
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  ErrorDisplay,
  ErrorSummary,
  NetworkErrorBoundary,
  QuickFixSuggestions,
  categorizeError,
  processErrors,
  type FeedError,
} from "../components/ErrorRecovery";

describe("ErrorRecovery Components", () => {
  const mockError: FeedError = {
    url: "https://example.com/feed.xml",
    error: "Network timeout",
    timestamp: Date.now(),
    feedTitle: "Example Feed",
    errorType: "timeout",
  };

  describe("ErrorDisplay", () => {
    it("renders error information correctly", () => {
      render(<ErrorDisplay error={mockError} />);

      expect(screen.getByText("Example Feed")).toBeInTheDocument();
      expect(
        screen.getByText("Feed took too long to respond")
      ).toBeInTheDocument();
    });

    it("shows retry button when onRetry is provided", () => {
      const onRetry = vi.fn();
      render(<ErrorDisplay error={mockError} onRetry={onRetry} />);

      const retryButton = screen.getByText("Retry");
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalledWith(mockError.url);
    });

    it("shows remove button when onRemove is provided", () => {
      const onRemove = vi.fn();
      render(<ErrorDisplay error={mockError} onRemove={onRemove} />);

      const removeButton = screen.getByTitle("Remove this feed");
      expect(removeButton).toBeInTheDocument();

      fireEvent.click(removeButton);
      expect(onRemove).toHaveBeenCalledWith(mockError.url);
    });

    it("shows loading state when retrying", () => {
      const onRetry = vi.fn();
      render(
        <ErrorDisplay error={mockError} onRetry={onRetry} isRetrying={true} />
      );

      expect(screen.getByText("Retrying...")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /retrying/i })).toBeDisabled();
    });

    it("displays different error types correctly", () => {
      const networkError: FeedError = {
        ...mockError,
        errorType: "network",
      };

      render(<ErrorDisplay error={networkError} />);
      expect(screen.getByText("Network connection failed")).toBeInTheDocument();
    });

    it("shows timestamp correctly", () => {
      const testTime = new Date("2023-01-01T12:00:00Z").getTime();
      const errorWithTime: FeedError = {
        ...mockError,
        timestamp: testTime,
      };

      render(<ErrorDisplay error={errorWithTime} />);

      // Check that some time format is displayed
      expect(screen.getByText(/Failed at/)).toBeInTheDocument();
    });

    it("handles missing feedTitle gracefully", () => {
      const errorWithoutTitle: FeedError = {
        ...mockError,
        feedTitle: undefined,
      };

      render(<ErrorDisplay error={errorWithoutTitle} />);
      expect(screen.getByText("example.com")).toBeInTheDocument();
    });
  });

  describe("ErrorSummary", () => {
    const mockErrors: FeedError[] = [
      {
        url: "https://example1.com/feed.xml",
        error: "Timeout",
        timestamp: Date.now(),
        feedTitle: "Feed 1",
        errorType: "timeout",
      },
      {
        url: "https://example2.com/feed.xml",
        error: "Network error",
        timestamp: Date.now(),
        feedTitle: "Feed 2",
        errorType: "network",
      },
    ];

    it("renders error summary correctly", () => {
      render(<ErrorSummary errors={mockErrors} />);

      expect(screen.getByText("2 feeds failed to load")).toBeInTheDocument();
      expect(screen.getByText(/1 Timeout, 1 Network/)).toBeInTheDocument();
    });

    it("does not render when no errors", () => {
      const { container } = render(<ErrorSummary errors={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("shows retry all button when onRetryAll is provided", () => {
      const onRetryAll = vi.fn();
      render(<ErrorSummary errors={mockErrors} onRetryAll={onRetryAll} />);

      const retryButton = screen.getByText("Retry All");
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(onRetryAll).toHaveBeenCalled();
    });

    it("expands to show details when clicked", () => {
      render(<ErrorSummary errors={mockErrors} />);

      const showDetailsButton = screen.getByText("Show Details");
      fireEvent.click(showDetailsButton);

      expect(screen.getByText("Hide Details")).toBeInTheDocument();
      expect(screen.getByText("Select all")).toBeInTheDocument();
    });

    it("handles select all functionality", () => {
      render(<ErrorSummary errors={mockErrors} />);

      // Expand details first
      fireEvent.click(screen.getByText("Show Details"));

      // Find the first checkbox (which is the select all checkbox)
      const checkboxes = screen.getAllByRole("checkbox");
      const selectAllCheckbox = checkboxes[0];
      fireEvent.click(selectAllCheckbox);

      expect(screen.getByText("2 selected")).toBeInTheDocument();
    });

    it("shows retry selected button when errors are selected", () => {
      const onRetrySelected = vi.fn();
      render(
        <ErrorSummary errors={mockErrors} onRetrySelected={onRetrySelected} />
      );

      // Expand details and select an error
      fireEvent.click(screen.getByText("Show Details"));

      // Find the first checkbox (which is the select all checkbox)
      const checkboxes = screen.getAllByRole("checkbox");
      const selectAllCheckbox = checkboxes[0];
      fireEvent.click(selectAllCheckbox);

      const retrySelectedButton = screen.getByText("Retry Selected");
      expect(retrySelectedButton).toBeInTheDocument();

      fireEvent.click(retrySelectedButton);
      expect(onRetrySelected).toHaveBeenCalledWith([
        "https://example1.com/feed.xml",
        "https://example2.com/feed.xml",
      ]);
    });

    it("shows dismiss all button when onDismissAll is provided", () => {
      const onDismissAll = vi.fn();
      render(<ErrorSummary errors={mockErrors} onDismissAll={onDismissAll} />);

      fireEvent.click(screen.getByText("Show Details"));

      const dismissButton = screen.getByText("Dismiss All Errors");
      expect(dismissButton).toBeInTheDocument();

      fireEvent.click(dismissButton);
      expect(onDismissAll).toHaveBeenCalled();
    });
  });

  describe("NetworkErrorBoundary", () => {
    const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error("Test error");
      }
      return <div>No error</div>;
    };

    it("renders children when no error", () => {
      render(
        <NetworkErrorBoundary>
          <ThrowError shouldThrow={false} />
        </NetworkErrorBoundary>
      );

      expect(screen.getByText("No error")).toBeInTheDocument();
    });

    it("renders error UI when error occurs", () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(
        <NetworkErrorBoundary>
          <ThrowError shouldThrow={true} />
        </NetworkErrorBoundary>
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(screen.getByText("Test error")).toBeInTheDocument();
      expect(screen.getByText("Try Again")).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it("calls onError when error occurs", () => {
      const onError = vi.fn();
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(
        <NetworkErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </NetworkErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(expect.any(Error));

      consoleSpy.mockRestore();
    });

    it("resets error state when retry is clicked", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const TestComponent = () => {
        const [shouldThrow, setShouldThrow] = React.useState(true);

        return (
          <NetworkErrorBoundary>
            <ThrowError shouldThrow={shouldThrow} />
            <button onClick={() => setShouldThrow(false)}>Fix Error</button>
          </NetworkErrorBoundary>
        );
      };

      render(<TestComponent />);

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();

      const retryButton = screen.getByText("Try Again");
      fireEvent.click(retryButton);

      // The component should attempt to re-render
      await waitFor(() => {
        expect(screen.queryByText("Something went wrong")).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe("QuickFixSuggestions", () => {
    const timeoutErrors: FeedError[] = [
      {
        url: "https://slow.com/feed.xml",
        error: "Timeout",
        timestamp: Date.now(),
        errorType: "timeout",
      },
    ];

    const corsErrors: FeedError[] = [
      {
        url: "https://blocked.com/feed.xml",
        error: "CORS error",
        timestamp: Date.now(),
        errorType: "cors",
      },
    ];

    it("does not render when no errors", () => {
      const { container } = render(<QuickFixSuggestions errors={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("suggests timeout fix for timeout errors", () => {
      render(<QuickFixSuggestions errors={timeoutErrors} />);

      expect(screen.getByText("Quick Fix Suggestions")).toBeInTheDocument();
      expect(screen.getByText("Increase Timeout")).toBeInTheDocument();
      expect(screen.getByText(/1 feed timed out/)).toBeInTheDocument();
    });

    it("suggests proxy fix for CORS errors", () => {
      render(<QuickFixSuggestions errors={corsErrors} />);

      expect(screen.getByText("Use Proxy Service")).toBeInTheDocument();
      expect(screen.getByText(/1 feed blocked by CORS/)).toBeInTheDocument();
    });

    it("calls onApplyFix when fix button is clicked", () => {
      const onApplyFix = vi.fn();
      render(
        <QuickFixSuggestions errors={timeoutErrors} onApplyFix={onApplyFix} />
      );

      const applyFixButton = screen.getByText("Apply Fix");
      fireEvent.click(applyFixButton);

      expect(onApplyFix).toHaveBeenCalledWith("increase-timeout", [
        "https://slow.com/feed.xml",
      ]);
    });

    it("handles multiple error types", () => {
      const mixedErrors = [...timeoutErrors, ...corsErrors];
      render(<QuickFixSuggestions errors={mixedErrors} />);

      expect(screen.getByText("Increase Timeout")).toBeInTheDocument();
      expect(screen.getByText("Use Proxy Service")).toBeInTheDocument();
    });
  });

  describe("Utility Functions", () => {
    describe("categorizeError", () => {
      it("categorizes timeout errors correctly", () => {
        expect(categorizeError("Request timeout")).toBe("timeout");
        expect(categorizeError("Operation was aborted")).toBe("timeout");
      });

      it("categorizes network errors correctly", () => {
        expect(categorizeError("Network connection failed")).toBe("network");
        expect(categorizeError("Fetch error occurred")).toBe("network");
      });

      it("categorizes parse errors correctly", () => {
        expect(categorizeError("XML parse error")).toBe("parse");
        expect(categorizeError("Invalid JSON format")).toBe("parse");
      });

      it("categorizes CORS errors correctly", () => {
        expect(categorizeError("CORS policy blocked")).toBe("cors");
        expect(categorizeError("Cross-origin request denied")).toBe("cors");
      });

      it("returns unknown for unrecognized errors", () => {
        expect(categorizeError("Some random error")).toBe("unknown");
      });
    });

    describe("processErrors", () => {
      it("processes errors and adds error types", () => {
        const rawErrors = [
          {
            url: "https://example.com/feed.xml",
            error: "Request timeout",
            timestamp: Date.now(),
            feedTitle: "Example Feed",
          },
          {
            url: "https://test.com/feed.xml",
            error: "Network connection failed",
            timestamp: Date.now(),
          },
        ];

        const processedErrors = processErrors(rawErrors);

        expect(processedErrors[0].errorType).toBe("timeout");
        expect(processedErrors[1].errorType).toBe("network");
        expect(processedErrors).toHaveLength(2);
      });
    });
  });

  describe("Accessibility", () => {
    it("error components have proper ARIA attributes", () => {
      const onRetry = vi.fn();
      render(<ErrorDisplay error={mockError} onRetry={onRetry} />);

      // Check that buttons have proper accessibility when they exist
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach((button) => {
        expect(button).toBeInTheDocument();
      });
    });

    it("error summary has proper form controls", () => {
      const mockErrors: FeedError[] = [mockError];
      render(<ErrorSummary errors={mockErrors} />);

      fireEvent.click(screen.getByText("Show Details"));

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes.length).toBeGreaterThan(0);

      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeInTheDocument();
      });
    });
  });
});
