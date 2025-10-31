import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { FeaturedArticle } from "../components/FeaturedArticle";
import type { Article } from "../types";

// Mock the hooks
vi.mock("../hooks/useArticleLayout", () => ({
  useArticleLayout: () => ({
    settings: {
      showPublicationTime: true,
    },
  }),
}));

vi.mock("../hooks/useFavorites", () => ({
  useFavorites: () => ({
    isFavorite: vi.fn(() => false),
    toggleFavorite: vi.fn(),
  }),
}));

// Mock OptimizedImage component
vi.mock("../components/OptimizedImage", () => ({
  OptimizedImage: ({
    alt,
    fallbackText,
  }: {
    alt: string;
    fallbackText: string;
  }) => (
    <div data-testid="optimized-image" aria-label={alt}>
      {fallbackText}
    </div>
  ),
}));

const mockArticle: Article = {
  title: "Test Featured Article",
  description: "This is a test description for the featured article",
  link: "https://example.com/article",
  pubDate: new Date("2025-02-08T10:00:00Z"),
  imageUrl: "https://example.com/image.jpg",
  sourceTitle: "Test Source",
  author: "Test Author",
  guid: "test-guid-123",
};

describe("FeaturedArticle", () => {
  it("renders the article with all required elements", () => {
    render(<FeaturedArticle article={mockArticle} />);

    // Check if the article title is rendered
    expect(screen.getByText("Test Featured Article")).toBeInTheDocument();

    // Check if the description is rendered
    expect(
      screen.getByText("This is a test description for the featured article")
    ).toBeInTheDocument();

    // Check if the source badge is rendered (should appear twice - in image fallback and badge)
    const sourceElements = screen.getAllByText("Test Source");
    expect(sourceElements).toHaveLength(2);

    // Check if the author is rendered
    expect(screen.getByText("Test Author")).toBeInTheDocument();
  });

  it("includes a favorite button", () => {
    render(<FeaturedArticle article={mockArticle} />);

    // Check if the favorite button is rendered
    const favoriteButton = screen.getByRole("button", {
      name: /add to favorites/i,
    });
    expect(favoriteButton).toBeInTheDocument();
  });

  it("renders with correct accessibility attributes", () => {
    render(<FeaturedArticle article={mockArticle} />);

    // Check if the article has proper role
    const article = screen.getByRole("article");
    expect(article).toBeInTheDocument();

    // Check if the title has proper id
    const title = screen.getByRole("heading", { level: 3 });
    expect(title).toHaveAttribute("id", "featured-article-title");
  });

  it("renders the link with proper attributes", () => {
    render(<FeaturedArticle article={mockArticle} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com/article");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("supports different time formats", () => {
    render(<FeaturedArticle article={mockArticle} timeFormat="12h" />);

    // The time should be rendered (exact format may vary based on locale)
    const timeElement = screen.getByRole("time");
    expect(timeElement).toBeInTheDocument();
  });

  it("positions favorite button in top-right corner with responsive positioning", () => {
    render(<FeaturedArticle article={mockArticle} />);

    const favoriteButton = screen.getByRole("button", {
      name: /add to favorites/i,
    });

    // Check if the button has the correct positioning classes
    expect(favoriteButton).toHaveClass("absolute", "z-20");
    expect(favoriteButton).toHaveClass("top-3", "right-3");
  });

  it("ensures proper z-index layering", () => {
    render(<FeaturedArticle article={mockArticle} />);

    const favoriteButton = screen.getByRole("button", {
      name: /add to favorites/i,
    });

    // Favorite button should have higher z-index than source badge
    expect(favoriteButton).toHaveClass("z-20");

    // Source badge should have lower z-index
    const sourceBadge = screen.getAllByText("Test Source")[1]; // The badge, not the image fallback
    expect(sourceBadge).toHaveClass("z-10");
  });

  it("has proper transition animations", () => {
    render(<FeaturedArticle article={mockArticle} />);

    const favoriteButton = screen.getByRole("button", {
      name: /add to favorites/i,
    });

    // Check if the button has transition classes
    expect(favoriteButton).toHaveClass(
      "transition-transform",
      "duration-200",
      "ease-in-out"
    );
    expect(favoriteButton).toHaveClass("hover:scale-110", "active:scale-95");
  });
});
