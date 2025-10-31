/**
 * LoadingStates.test.tsx
 *
 * Tests for loading state components to ensure they render correctly
 * and handle various loading scenarios.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  PaginationLoading,
  NavigationLoading,
  ContentLoading,
  LoadingButton,
  OverlayLoading,
  InlineLoading,
  PlaceholderLoading,
  ProgressiveArticleLoading,
  SmartLoading,
  MobileOptimizedLoading,
  TouchFriendlyLoadingButton,
} from "../components/LoadingStates";

describe("LoadingStates Components", () => {
  describe("PaginationLoading", () => {
    it("renders compact pagination loading", () => {
      const { container } = render(<PaginationLoading compact={true} />);

      const compactContainer = container.querySelector(
        ".flex.items-center.space-x-2"
      );
      expect(compactContainer).toBeInTheDocument();
      expect(compactContainer).toHaveClass("opacity-75");
    });

    it("renders full pagination loading", () => {
      const { container } = render(<PaginationLoading compact={false} />);

      const fullContainer = container.querySelector(
        ".flex.flex-col.sm\\:flex-row"
      );
      expect(fullContainer).toBeInTheDocument();
      expect(fullContainer).toHaveClass("opacity-75");
    });

    it("applies custom className", () => {
      const { container } = render(
        <PaginationLoading className="custom-class" />
      );

      const loadingContainer = container.firstChild as HTMLElement;
      expect(loadingContainer).toHaveClass("custom-class");
    });
  });

  describe("NavigationLoading", () => {
    it("renders both navigation buttons by default", () => {
      render(<NavigationLoading />);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(2);

      // Check that both buttons contain "Loading..." text
      buttons.forEach((button) => {
        expect(button).toHaveTextContent("Loading...");
      });
    });

    it("renders only previous button when direction is prev", () => {
      render(<NavigationLoading direction="prev" />);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toHaveTextContent("Loading...");
    });

    it("renders only next button when direction is next", () => {
      render(<NavigationLoading direction="next" />);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toHaveTextContent("Loading...");
    });

    it("buttons are disabled", () => {
      render(<NavigationLoading />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
        expect(button).toHaveClass("cursor-not-allowed");
      });
    });
  });

  describe("ContentLoading", () => {
    it("renders with default message", () => {
      render(<ContentLoading />);

      // Use getAllByText since there are multiple "Loading..." texts (spinner + main text)
      const loadingTexts = screen.getAllByText("Loading...");
      expect(loadingTexts.length).toBeGreaterThan(0);

      // Check that the main loading message is present
      const mainMessage = screen.getByText("Loading...", { selector: "p" });
      expect(mainMessage).toBeInTheDocument();
    });

    it("renders with custom message", () => {
      const customMessage = "Custom loading message";
      render(<ContentLoading message={customMessage} />);

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it("renders with type-specific message", () => {
      render(<ContentLoading type="articles" />);

      expect(screen.getByText("Loading articles...")).toBeInTheDocument();
    });

    it("shows spinner by default", () => {
      const { container } = render(<ContentLoading />);

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("hides spinner when showSpinner is false", () => {
      const { container } = render(<ContentLoading showSpinner={false} />);

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).not.toBeInTheDocument();
    });
  });

  describe("LoadingButton", () => {
    it("renders children when not loading", () => {
      render(<LoadingButton>Click me</LoadingButton>);

      expect(screen.getByText("Click me")).toBeInTheDocument();
    });

    it("shows loading text when loading", () => {
      render(
        <LoadingButton isLoading={true} loadingText="Processing...">
          Click me
        </LoadingButton>
      );

      expect(screen.getByText("Processing...")).toBeInTheDocument();
      expect(screen.queryByText("Click me")).not.toBeInTheDocument();
    });

    it("shows spinner when loading", () => {
      const { container } = render(
        <LoadingButton isLoading={true}>Click me</LoadingButton>
      );

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("is disabled when loading", () => {
      render(<LoadingButton isLoading={true}>Click me</LoadingButton>);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveClass("cursor-not-allowed");
    });

    it("is disabled when disabled prop is true", () => {
      render(<LoadingButton disabled={true}>Click me</LoadingButton>);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("calls onClick when clicked and not disabled", () => {
      const onClick = vi.fn();
      render(<LoadingButton onClick={onClick}>Click me</LoadingButton>);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledOnce();
    });

    it("does not call onClick when loading", () => {
      const onClick = vi.fn();
      render(
        <LoadingButton isLoading={true} onClick={onClick}>
          Click me
        </LoadingButton>
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("OverlayLoading", () => {
    it("does not render when not visible", () => {
      const { container } = render(<OverlayLoading isVisible={false} />);

      expect(container.firstChild).toBeNull();
    });

    it("renders when visible", () => {
      render(<OverlayLoading isVisible={true} />);

      const overlay = screen.getByRole("dialog");
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveAttribute("aria-modal", "true");
    });

    it("shows custom message", () => {
      const customMessage = "Processing your request...";
      render(<OverlayLoading isVisible={true} message={customMessage} />);

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it("shows progress when provided", () => {
      render(<OverlayLoading isVisible={true} progress={75} />);

      expect(screen.getByText("75% complete")).toBeInTheDocument();
    });

    it("shows cancel button when onCancel is provided", () => {
      const onCancel = vi.fn();
      render(<OverlayLoading isVisible={true} onCancel={onCancel} />);

      const cancelButton = screen.getByText("Cancel");
      expect(cancelButton).toBeInTheDocument();

      fireEvent.click(cancelButton);
      expect(onCancel).toHaveBeenCalledOnce();
    });

    it("has proper accessibility attributes", () => {
      render(<OverlayLoading isVisible={true} message="Loading..." />);

      const overlay = screen.getByRole("dialog");
      expect(overlay).toHaveAttribute("aria-modal", "true");

      const title = screen.getByRole("heading");
      expect(title).toHaveAttribute("id", "loading-title");
      expect(overlay).toHaveAttribute("aria-labelledby", "loading-title");
    });
  });

  describe("InlineLoading", () => {
    it("renders with spinner", () => {
      const { container } = render(<InlineLoading />);

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("renders with text when provided", () => {
      render(<InlineLoading text="Loading data..." />);

      expect(screen.getByText("Loading data...")).toBeInTheDocument();
    });

    it("applies correct size", () => {
      const { container } = render(<InlineLoading size="lg" />);

      const spinner = container.querySelector(".h-8.w-8");
      expect(spinner).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(<InlineLoading className="custom-class" />);

      const loadingContainer = container.firstChild as HTMLElement;
      expect(loadingContainer).toHaveClass("custom-class");
    });
  });

  describe("PlaceholderLoading", () => {
    it("renders with default dimensions", () => {
      const { container } = render(<PlaceholderLoading />);

      const placeholder = container.firstChild as HTMLElement;
      expect(placeholder).toHaveStyle({ width: "100%", height: "20px" });
    });

    it("renders with custom dimensions", () => {
      const { container } = render(
        <PlaceholderLoading width="200px" height="40px" />
      );

      const placeholder = container.firstChild as HTMLElement;
      expect(placeholder).toHaveStyle({ width: "200px", height: "40px" });
    });

    it("applies rounded corners by default", () => {
      const { container } = render(<PlaceholderLoading />);

      const placeholder = container.firstChild as HTMLElement;
      expect(placeholder).toHaveClass("rounded");
    });

    it("does not apply rounded corners when rounded is false", () => {
      const { container } = render(<PlaceholderLoading rounded={false} />);

      const placeholder = container.firstChild as HTMLElement;
      expect(placeholder).not.toHaveClass("rounded");
    });

    it("has proper accessibility attributes", () => {
      const { container } = render(<PlaceholderLoading />);

      const placeholder = container.firstChild as HTMLElement;
      expect(placeholder).toHaveAttribute("aria-hidden", "true");
    });

    it("applies animation classes", () => {
      const { container } = render(<PlaceholderLoading />);

      const placeholder = container.firstChild as HTMLElement;
      expect(placeholder).toHaveClass("animate-pulse");
    });
  });

  describe("ProgressiveArticleLoading", () => {
    it("renders with loading progress", () => {
      render(<ProgressiveArticleLoading loadedCount={3} totalCount={10} />);

      expect(screen.getByText("Loading articles...")).toBeInTheDocument();
      expect(screen.getByText("3/10")).toBeInTheDocument();
    });

    it("shows background refresh state", () => {
      render(
        <ProgressiveArticleLoading
          loadedCount={5}
          totalCount={10}
          isBackgroundRefresh={true}
        />
      );

      expect(screen.getByText("Refreshing articles...")).toBeInTheDocument();
    });

    it("calculates progress correctly", () => {
      const { container } = render(
        <ProgressiveArticleLoading loadedCount={7} totalCount={10} />
      );

      const progressBar = container.querySelector('[style*="width: 70%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it("handles zero total count", () => {
      const { container } = render(
        <ProgressiveArticleLoading loadedCount={0} totalCount={0} />
      );

      const progressBar = container.querySelector('[style*="width: 0%"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe("SmartLoading", () => {
    it("renders initial loading type", () => {
      render(<SmartLoading type="initial" />);

      expect(screen.getByText("Loading your news...")).toBeInTheDocument();
    });

    it("renders refresh loading type", () => {
      render(<SmartLoading type="refresh" />);

      expect(screen.getByText("Refreshing articles...")).toBeInTheDocument();
    });

    it("renders pagination loading type with minimal style", () => {
      const { container } = render(<SmartLoading type="pagination" />);

      expect(screen.getByText("Loading more articles...")).toBeInTheDocument();

      // Should be minimal (py-4 instead of py-8)
      const loadingContainer = container.querySelector(".py-4");
      expect(loadingContainer).toBeInTheDocument();
    });

    it("renders search loading type with minimal style", () => {
      render(<SmartLoading type="search" />);

      expect(screen.getByText("Searching articles...")).toBeInTheDocument();
    });

    it("shows custom message", () => {
      render(<SmartLoading type="initial" message="Custom loading message" />);

      expect(screen.getByText("Custom loading message")).toBeInTheDocument();
    });

    it("shows progress when provided", () => {
      render(<SmartLoading type="initial" progress={60} />);

      expect(screen.getByText("60% complete")).toBeInTheDocument();
    });

    it("shows cancel button when enabled", () => {
      const onCancel = vi.fn();
      render(
        <SmartLoading type="initial" showCancel={true} onCancel={onCancel} />
      );

      const cancelButton = screen.getByText("Cancel");
      expect(cancelButton).toBeInTheDocument();

      fireEvent.click(cancelButton);
      expect(onCancel).toHaveBeenCalledOnce();
    });

    it("does not show progress for minimal types", () => {
      render(<SmartLoading type="pagination" progress={50} />);

      expect(screen.queryByText("50% complete")).not.toBeInTheDocument();
    });
  });

  describe("MobileOptimizedLoading", () => {
    it("renders pull-refresh type with compact layout", () => {
      render(<MobileOptimizedLoading type="pull-refresh" />);

      expect(screen.getByText("Pull to refresh...")).toBeInTheDocument();

      // Should be compact layout
      const { container } = render(
        <MobileOptimizedLoading type="pull-refresh" />
      );
      const compactContainer = container.querySelector(".py-3");
      expect(compactContainer).toBeInTheDocument();
    });

    it("renders infinite-scroll type with compact layout", () => {
      render(<MobileOptimizedLoading type="infinite-scroll" />);

      expect(screen.getByText("Loading more...")).toBeInTheDocument();
    });

    it("renders page-transition type with full layout", () => {
      render(<MobileOptimizedLoading type="page-transition" />);

      expect(screen.getByText("Loading page...")).toBeInTheDocument();

      // Should be full layout
      const { container } = render(
        <MobileOptimizedLoading type="page-transition" />
      );
      const fullContainer = container.querySelector(".py-4");
      expect(fullContainer).toBeInTheDocument();
    });

    it("shows progress for page-transition when provided", () => {
      const { container } = render(
        <MobileOptimizedLoading type="page-transition" progress={75} />
      );

      const progressBar = container.querySelector('[style*="width: 75%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it("shows custom message", () => {
      render(
        <MobileOptimizedLoading
          type="pull-refresh"
          message="Custom refresh message"
        />
      );

      expect(screen.getByText("Custom refresh message")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <MobileOptimizedLoading
          type="pull-refresh"
          className="custom-mobile-class"
        />
      );

      const loadingContainer = container.firstChild as HTMLElement;
      expect(loadingContainer).toHaveClass("custom-mobile-class");
    });
  });

  describe("TouchFriendlyLoadingButton", () => {
    it("renders children when not loading", () => {
      render(<TouchFriendlyLoadingButton>Touch Me</TouchFriendlyLoadingButton>);

      expect(screen.getByText("Touch Me")).toBeInTheDocument();
    });

    it("shows loading text when loading", () => {
      render(
        <TouchFriendlyLoadingButton
          isLoading={true}
          loadingText="Processing..."
        >
          Touch Me
        </TouchFriendlyLoadingButton>
      );

      expect(screen.getByText("Processing...")).toBeInTheDocument();
      expect(screen.queryByText("Touch Me")).not.toBeInTheDocument();
    });

    it("shows spinner when loading", () => {
      const { container } = render(
        <TouchFriendlyLoadingButton isLoading={true}>
          Touch Me
        </TouchFriendlyLoadingButton>
      );

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("is disabled when loading", () => {
      render(
        <TouchFriendlyLoadingButton isLoading={true}>
          Touch Me
        </TouchFriendlyLoadingButton>
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveClass("cursor-not-allowed");
    });

    it("applies correct size classes", () => {
      const { container } = render(
        <TouchFriendlyLoadingButton size="lg">
          Large Button
        </TouchFriendlyLoadingButton>
      );

      const button = container.querySelector(".min-h-\\[52px\\]");
      expect(button).toBeInTheDocument();
    });

    it("applies correct variant classes", () => {
      const { container } = render(
        <TouchFriendlyLoadingButton variant="secondary">
          Secondary Button
        </TouchFriendlyLoadingButton>
      );

      const button = container.querySelector(".bg-gray-700");
      expect(button).toBeInTheDocument();
    });

    it("has touch-manipulation class for mobile optimization", () => {
      render(<TouchFriendlyLoadingButton>Touch Me</TouchFriendlyLoadingButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("touch-manipulation");
    });

    it("has minimum touch target size", () => {
      render(
        <TouchFriendlyLoadingButton size="sm">
          Small Button
        </TouchFriendlyLoadingButton>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("min-h-[36px]");
      expect(button).toHaveStyle({ minWidth: "60px" });
    });

    it("calls onClick when clicked and not disabled", () => {
      const onClick = vi.fn();
      render(
        <TouchFriendlyLoadingButton onClick={onClick}>
          Touch Me
        </TouchFriendlyLoadingButton>
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledOnce();
    });

    it("does not call onClick when loading", () => {
      const onClick = vi.fn();
      render(
        <TouchFriendlyLoadingButton isLoading={true} onClick={onClick}>
          Touch Me
        </TouchFriendlyLoadingButton>
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(onClick).not.toHaveBeenCalled();
    });

    it("has active scale effect when not disabled", () => {
      render(<TouchFriendlyLoadingButton>Touch Me</TouchFriendlyLoadingButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("active:scale-95");
    });
  });

  describe("Accessibility", () => {
    it("loading components have proper ARIA attributes", () => {
      render(<OverlayLoading isVisible={true} />);

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby", "loading-title");
    });

    it("placeholder components are hidden from screen readers", () => {
      const { container } = render(<PlaceholderLoading />);

      const placeholder = container.firstChild as HTMLElement;
      expect(placeholder).toHaveAttribute("aria-hidden", "true");
    });
  });
});
