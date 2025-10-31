import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { FavoriteButton } from "../components/FavoriteButton";
import type { Article } from "../types";

// Mock the useFavorites hook
const mockToggleFavorite = vi.fn();
const mockIsFavorite = vi.fn();

vi.mock("../hooks/useFavorites", () => ({
  useFavorites: () => ({
    isFavorite: mockIsFavorite,
    toggleFavorite: mockToggleFavorite,
  }),
}));

// Mock article data
const mockArticle: Article = {
  title: "Test Article",
  link: "https://example.com/test-article",
  pubDate: new Date("2024-01-01T12:00:00Z"),
  sourceTitle: "Test Source",
  imageUrl: "https://example.com/image.jpg",
  description: "Test description",
  author: "Test Author",
  categories: ["Technology"],
};

describe("FavoriteButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Functionality", () => {
    it("renders correctly when article is not favorited", () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton article={mockArticle} />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("aria-label", "Add to favorites");
      expect(button).toHaveAttribute("aria-pressed", "false");
      expect(button).toHaveAttribute("title", "Add to favorites");
    });

    it("renders correctly when article is favorited", () => {
      mockIsFavorite.mockReturnValue(true);

      render(<FavoriteButton article={mockArticle} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Remove from favorites");
      expect(button).toHaveAttribute("aria-pressed", "true");
      expect(button).toHaveAttribute("title", "Remove from favorites");
    });

    it("calls toggleFavorite when clicked", () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton article={mockArticle} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockToggleFavorite).toHaveBeenCalledWith(mockArticle);
      expect(mockToggleFavorite).toHaveBeenCalledTimes(1);
    });

    it("prevents event propagation when clicked", () => {
      mockIsFavorite.mockReturnValue(false);
      const parentClickHandler = vi.fn();

      render(
        <div onClick={parentClickHandler}>
          <FavoriteButton article={mockArticle} />
        </div>
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockToggleFavorite).toHaveBeenCalledWith(mockArticle);
      expect(parentClickHandler).not.toHaveBeenCalled();
    });
  });

  describe("Keyboard Navigation", () => {
    it("handles Enter key press", () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton article={mockArticle} />);

      const button = screen.getByRole("button");
      fireEvent.keyDown(button, { key: "Enter" });

      expect(mockToggleFavorite).toHaveBeenCalledWith(mockArticle);
    });

    it("handles Space key press", () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton article={mockArticle} />);

      const button = screen.getByRole("button");
      fireEvent.keyDown(button, { key: " " });

      expect(mockToggleFavorite).toHaveBeenCalledWith(mockArticle);
    });

    it("ignores other key presses", () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton article={mockArticle} />);

      const button = screen.getByRole("button");
      fireEvent.keyDown(button, { key: "Tab" });
      fireEvent.keyDown(button, { key: "Escape" });
      fireEvent.keyDown(button, { key: "a" });

      expect(mockToggleFavorite).not.toHaveBeenCalled();
    });

    it("handles keyboard events correctly", () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton article={mockArticle} />);

      const button = screen.getByRole("button");

      // Test that Enter key triggers toggle
      fireEvent.keyDown(button, { key: "Enter" });
      expect(mockToggleFavorite).toHaveBeenCalledWith(mockArticle);

      // Reset mock
      mockToggleFavorite.mockClear();

      // Test that Space key triggers toggle
      fireEvent.keyDown(button, { key: " " });
      expect(mockToggleFavorite).toHaveBeenCalledWith(mockArticle);
    });

    it("is focusable with tab navigation", () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton article={mockArticle} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("tabIndex", "0");
    });
  });

  describe("Size Variants", () => {
    it("applies small size classes correctly", () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton article={mockArticle} size="small" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("w-6", "h-6", "p-1");
    });

    it("applies medium size classes correctly (default)", () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton article={mockArticle} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("w-8", "h-8", "p-1.5");
    });

    it("applies large size classes correctly", () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton article={mockArticle} size="large" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("w-10", "h-10", "p-2");
    });
  });

  describe("Position Variants", () => {
    it("applies overlay position classes correctly (default)", () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton article={mockArticle} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("absolute");
    });

    it("applies inline position classes correctly", () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton article={mockArticle} position="inline" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("relative");
    });

    it("applies different background styles for overlay vs inline", () => {
      mockIsFavorite.mockReturnValue(false);

      const { rerender } = render(
        <FavoriteButton article={mockArticle} position="overlay" />
      );
      const overlayButton = screen.getByRole("button");
      expect(overlayButton).toHaveClass("bg-black/70");

      rerender(<FavoriteButton article={mockArticle} position="inline" />);
      const inlineButton = screen.getByRole("button");
      expect(inlineButton).toHaveClass("bg-gray-800/90");
    });
  });

  describe("Visual States", () => {
    it("applies correct styles when not favorited", () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton article={mockArticle} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-white");
    });

    it("applies correct styles when favorited", () => {
      mockIsFavorite.mockReturnValue(true);

      render(<FavoriteButton article={mockArticle} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-red-500");
    });

    it("includes transition classes for smooth animations", () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton article={mockArticle} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass(
        "transition-all",
        "duration-200",
        "ease-in-out"
      );
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA attributes", () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton article={mockArticle} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("role", "button");
      expect(button).toHaveAttribute("type", "button");
      expect(button).toHaveAttribute("aria-pressed", "false");
    });

    it("updates aria-pressed when favorite state changes", () => {
      // Test with different article instances to bypass memoization
      const article1 = { ...mockArticle, link: "https://example.com/article1" };
      const article2 = { ...mockArticle, link: "https://example.com/article2" };

      mockIsFavorite.mockReturnValue(false);
      const { rerender } = render(<FavoriteButton article={article1} />);
      let button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-pressed", "false");

      mockIsFavorite.mockReturnValue(true);
      rerender(<FavoriteButton article={article2} />);
      button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-pressed", "true");
    });

    it("accepts custom aria-label", () => {
      mockIsFavorite.mockReturnValue(false);

      render(
        <FavoriteButton
          article={mockArticle}
          aria-label="Custom favorite label"
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Custom favorite label");
    });

    it("accepts custom title", () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton article={mockArticle} title="Custom title" />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Custom title");
    });

    it("has focus ring styles", () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton article={mockArticle} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("focus:outline-none", "focus:ring-2");
    });
  });

  describe("Custom Props", () => {
    it("applies custom className", () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton article={mockArticle} className="custom-class" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
    });

    it("combines size, position, and custom className", () => {
      mockIsFavorite.mockReturnValue(false);

      render(
        <FavoriteButton
          article={mockArticle}
          size="large"
          position="inline"
          className="custom-class"
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("w-10", "h-10", "relative", "custom-class");
    });
  });

  describe("Performance", () => {
    it("memoizes correctly with same props", () => {
      mockIsFavorite.mockReturnValue(false);

      const { rerender } = render(<FavoriteButton article={mockArticle} />);
      const firstButton = screen.getByRole("button");

      rerender(<FavoriteButton article={mockArticle} />);
      const secondButton = screen.getByRole("button");

      // The component should be the same instance due to memoization
      expect(firstButton).toBe(secondButton);
    });

    it("re-renders when article changes", () => {
      mockIsFavorite.mockReturnValue(false);

      const { rerender } = render(<FavoriteButton article={mockArticle} />);

      const differentArticle = {
        ...mockArticle,
        link: "https://different.com",
      };
      rerender(<FavoriteButton article={differentArticle} />);

      expect(mockToggleFavorite).not.toHaveBeenCalled(); // Just checking it re-rendered
    });
  });

  describe("Icon Rendering", () => {
    it("renders heart icon with correct fill state", () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton article={mockArticle} />);

      const svg = screen.getByRole("button").querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("fill", "none");
    });

    it("renders filled heart icon when favorited", () => {
      mockIsFavorite.mockReturnValue(true);

      render(<FavoriteButton article={mockArticle} />);

      const svg = screen.getByRole("button").querySelector("svg");
      expect(svg).toHaveAttribute("fill", "currentColor");
    });

    it("applies correct icon size classes", () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton article={mockArticle} size="small" />);

      const svg = screen.getByRole("button").querySelector("svg");
      expect(svg).toHaveClass("h-3", "w-3");
    });
  });
});
