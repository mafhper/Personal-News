/**
 * SkeletonLoader.test.tsx
 *
 * Tests for skeleton loading components to ensure they render correctly
 * and provide proper accessibility attributes.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  ArticleSkeleton,
  ArticleListSkeleton,
  PaginationSkeleton,
  HeaderSkeleton,
  ContentSkeleton,
  ProgressiveArticlesSkeleton,
  EnhancedPaginationSkeleton,
} from "../components/SkeletonLoader";

describe("SkeletonLoader Components", () => {
  describe("ArticleSkeleton", () => {
    it("renders article skeleton with proper structure", () => {
      const { container } = render(<ArticleSkeleton />);

      // Should render as an article element (using container since it's aria-hidden)
      const article = container.querySelector("article");
      expect(article).toBeInTheDocument();
      expect(article).toHaveAttribute("aria-hidden", "true");
    });

    it("has proper accessibility attributes", () => {
      const { container } = render(<ArticleSkeleton />);

      const article = container.querySelector("article");
      expect(article).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("ArticleListSkeleton", () => {
    it("renders default number of skeleton articles", () => {
      render(<ArticleListSkeleton />);

      // Should render section with proper heading
      const section = screen.getByRole("region");
      expect(section).toBeInTheDocument();
      expect(section).toHaveAttribute("aria-labelledby", "loading-articles");
      expect(section).toHaveAttribute("aria-live", "polite");
    });

    it("renders custom number of skeleton articles", () => {
      const customCount = 6;
      const { container } = render(<ArticleListSkeleton count={customCount} />);

      // Count the number of skeleton items by looking for article elements
      const skeletonItems = container.querySelectorAll(
        'article[aria-hidden="true"]'
      );
      expect(skeletonItems).toHaveLength(customCount);
    });

    it("renders with proper accessibility attributes", () => {
      render(<ArticleListSkeleton />);

      const section = screen.getByRole("region");
      expect(section).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("PaginationSkeleton", () => {
    it("renders compact pagination skeleton", () => {
      const { container } = render(<PaginationSkeleton compact={true} />);

      // Should have compact structure
      const compactContainer = container.querySelector(
        ".flex.items-center.space-x-2"
      );
      expect(compactContainer).toBeInTheDocument();
      expect(compactContainer).toHaveAttribute("aria-hidden", "true");
    });

    it("renders full pagination skeleton", () => {
      const { container } = render(<PaginationSkeleton compact={false} />);

      // Should have full structure with responsive elements
      const fullContainer = container.querySelector(
        ".flex.flex-col.sm\\:flex-row"
      );
      expect(fullContainer).toBeInTheDocument();
      expect(fullContainer).toHaveAttribute("aria-hidden", "true");
    });

    it("has proper accessibility attributes", () => {
      const { container } = render(<PaginationSkeleton />);

      const skeletonContainer = container.firstChild as HTMLElement;
      expect(skeletonContainer).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("HeaderSkeleton", () => {
    it("renders header skeleton with proper structure", () => {
      const { container } = render(<HeaderSkeleton />);

      const header = container.querySelector("header");
      expect(header).toBeInTheDocument();
      expect(header).toHaveAttribute("aria-hidden", "true");
    });

    it("has proper styling classes", () => {
      const { container } = render(<HeaderSkeleton />);

      const header = container.querySelector("header");
      expect(header).toHaveClass("bg-gray-800", "shadow-lg");
    });
  });

  describe("ContentSkeleton", () => {
    it("renders with default configuration", () => {
      const { container } = render(<ContentSkeleton />);

      const contentContainer = container.firstChild as HTMLElement;
      expect(contentContainer).toHaveClass("space-y-4");
      expect(contentContainer).toHaveAttribute("aria-hidden", "true");
    });

    it("renders with custom number of lines", () => {
      const customLines = 5;
      const { container } = render(<ContentSkeleton lines={customLines} />);

      // Count skeleton lines by looking for skeleton elements in the lines container
      const linesContainer = container.querySelector(".space-y-2");
      const lines = linesContainer?.querySelectorAll(".animate-pulse");
      expect(lines).toHaveLength(customLines);
    });

    it("renders with image when showImage is true", () => {
      const { container } = render(<ContentSkeleton showImage={true} />);

      // Should have an image skeleton - look for skeleton with specific height
      const imageSkeleton = container.querySelector('[style*="height: 200px"]');
      expect(imageSkeleton).toBeInTheDocument();
    });

    it("renders with header when showHeader is true", () => {
      const { container } = render(<ContentSkeleton showHeader={true} />);

      // Should have a header skeleton - look for skeleton with specific height
      const headerSkeleton = container.querySelector('[style*="height: 32px"]');
      expect(headerSkeleton).toBeInTheDocument();
    });

    it("has proper accessibility attributes", () => {
      const { container } = render(<ContentSkeleton />);

      const contentContainer = container.firstChild as HTMLElement;
      expect(contentContainer).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Skeleton animations", () => {
    it("applies pulse animation to skeleton elements", () => {
      const { container } = render(<ArticleSkeleton />);

      // Check for animate-pulse class
      const skeletonElements = container.querySelectorAll(".animate-pulse");
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe("Skeleton styling", () => {
    it("applies proper background color", () => {
      const { container } = render(<ArticleSkeleton />);

      // Check for gray background
      const skeletonElements = container.querySelectorAll(".bg-gray-700");
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it("applies rounded corners when specified", () => {
      const { container } = render(<ArticleSkeleton />);

      // Check for rounded classes
      const roundedElements = container.querySelectorAll(
        ".rounded-lg, .rounded-full, .rounded"
      );
      expect(roundedElements.length).toBeGreaterThan(0);
    });
  });

  describe("ProgressiveArticlesSkeleton", () => {
    it("renders progressive loading skeleton", () => {
      render(
        <ProgressiveArticlesSkeleton
          loadedCount={3}
          totalCount={10}
          articlesPerPage={6}
        />
      );

      const section = screen.getByRole("region");
      expect(section).toBeInTheDocument();
      expect(section).toHaveAttribute("aria-labelledby", "progressive-loading");
      expect(section).toHaveAttribute("aria-live", "polite");
    });

    it("shows progress indicator", () => {
      render(<ProgressiveArticlesSkeleton loadedCount={5} totalCount={10} />);

      expect(screen.getByText("5/10")).toBeInTheDocument();
    });

    it("applies different opacity to loaded vs unloaded skeletons", () => {
      const { container } = render(
        <ProgressiveArticlesSkeleton
          loadedCount={2}
          totalCount={5}
          articlesPerPage={5}
        />
      );

      // Check for different opacity classes
      const loadedSkeletons = container.querySelectorAll(".opacity-100");
      const unloadedSkeletons = container.querySelectorAll(".opacity-30");

      expect(loadedSkeletons.length).toBeGreaterThan(0);
      expect(unloadedSkeletons.length).toBeGreaterThan(0);
    });

    it("calculates progress correctly", () => {
      const { container } = render(
        <ProgressiveArticlesSkeleton loadedCount={7} totalCount={10} />
      );

      const progressBar = container.querySelector('[style*="width: 70%"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe("EnhancedPaginationSkeleton", () => {
    it("renders compact enhanced pagination skeleton", () => {
      const { container } = render(
        <EnhancedPaginationSkeleton compact={true} />
      );

      const compactContainer = container.querySelector(
        ".flex.items-center.space-x-2"
      );
      expect(compactContainer).toBeInTheDocument();
      expect(compactContainer).toHaveAttribute("aria-hidden", "true");
    });

    it("renders full enhanced pagination skeleton", () => {
      const { container } = render(
        <EnhancedPaginationSkeleton compact={false} />
      );

      const fullContainer = container.querySelector(
        ".flex.flex-col.sm\\:flex-row"
      );
      expect(fullContainer).toBeInTheDocument();
      expect(fullContainer).toHaveAttribute("aria-hidden", "true");
    });

    it("shows progress when enabled", () => {
      const { container } = render(
        <EnhancedPaginationSkeleton showProgress={true} progress={60} />
      );

      const progressBar = container.querySelector('[style*="width: 60%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it("shows compact progress when enabled", () => {
      const { container } = render(
        <EnhancedPaginationSkeleton
          compact={true}
          showProgress={true}
          progress={40}
        />
      );

      const progressBar = container.querySelector('[style*="width: 40%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it("does not show progress when disabled", () => {
      const { container } = render(
        <EnhancedPaginationSkeleton showProgress={false} />
      );

      const progressBar = container.querySelector(".bg-gray-700.rounded-full");
      expect(progressBar).not.toBeInTheDocument();
    });
  });
});
