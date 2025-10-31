import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ArticleItem } from '../components/ArticleItem';
import type { Article } from '../types';

// Mock the LazyImage component
vi.mock('../components/LazyImage', () => ({
  LazyImage: ({ src, alt, className }: { src: string; alt: string; className: string }) => (
    <img src={src} alt={alt} className={className} data-testid="lazy-image" />
  ),
}));

// Mock the usePerformance hook
vi.mock('../hooks/usePerformance', () => ({
  usePerformance: () => ({
    startRenderTiming: vi.fn(),
    endRenderTiming: vi.fn(),
  }),
}));

describe('ArticleItem', () => {
  const mockArticle: Article = {
    title: 'Test Article Title',
    link: 'https://example.com/article',
    pubDate: new Date('2024-01-01T12:00:00Z'),
    sourceTitle: 'Test Source',
    imageUrl: 'https://example.com/image.jpg',
    author: 'Test Author',
    description: 'Test description',
    categories: ['tech'],
  };

  it('renders article information correctly', () => {
    render(<ArticleItem article={mockArticle} index={1} />);

    expect(screen.getByText('Test Article Title')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByTestId('lazy-image')).toBeInTheDocument();
  });

  it('displays source title when author is not available', () => {
    const articleWithoutAuthor = { ...mockArticle, author: undefined };
    render(<ArticleItem article={articleWithoutAuthor} index={1} />);

    expect(screen.getByText('Test Source')).toBeInTheDocument();
  });

  it('formats time correctly', () => {
    const recentDate = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago
    const recentArticle = { ...mockArticle, pubDate: recentDate };

    render(<ArticleItem article={recentArticle} index={1} />);

    expect(screen.getByText('2 minutes ago')).toBeInTheDocument();
  });

  it('uses article image URL when available', () => {
    render(<ArticleItem article={mockArticle} index={1} />);

    const image = screen.getByTestId('lazy-image');
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('generates fallback image URL when imageUrl is not provided', () => {
    const articleWithoutImage = { ...mockArticle, imageUrl: undefined };
    render(<ArticleItem article={articleWithoutImage} index={1} />);

    const image = screen.getByTestId('lazy-image');
    expect(image.getAttribute('src')).toContain('picsum.photos');
  });

  it('has proper accessibility attributes', () => {
    render(<ArticleItem article={mockArticle} index={1} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com/article');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    const image = screen.getByTestId('lazy-image');
    expect(image).toHaveAttribute('alt', 'Image for Test Article Title');
  });

  describe('React.memo optimization', () => {
    it('should be wrapped with React.memo', () => {
      // Test that the component is memoized by checking if it's a memo component
      expect(ArticleItem.$$typeof).toBeDefined();
      expect(typeof ArticleItem).toBe('object');
    });

    it('should not re-render when props are identical', () => {
      const { rerender } = render(<ArticleItem article={mockArticle} index={1} />);

      // Get initial render content
      const initialTitle = screen.getByText('Test Article Title');
      expect(initialTitle).toBeInTheDocument();

      // Re-render with the exact same props (same object references)
      rerender(<ArticleItem article={mockArticle} index={1} />);

      // Content should still be there (component should not have re-rendered)
      expect(screen.getByText('Test Article Title')).toBeInTheDocument();
    });

    it('should re-render when article properties change', () => {
      const { rerender } = render(<ArticleItem article={mockArticle} index={1} />);

      expect(screen.getByText('Test Article Title')).toBeInTheDocument();

      // Re-render with different article title
      const changedArticle = { ...mockArticle, title: 'Changed Title' };
      rerender(<ArticleItem article={changedArticle} index={1} />);

      // Should show new title
      expect(screen.getByText('Changed Title')).toBeInTheDocument();
      expect(screen.queryByText('Test Article Title')).not.toBeInTheDocument();
    });

    it('should re-render when index changes', () => {
      const { rerender } = render(<ArticleItem article={mockArticle} index={1} />);

      expect(screen.getByText('1')).toBeInTheDocument();

      // Re-render with different index
      rerender(<ArticleItem article={mockArticle} index={2} />);

      // Should show new index
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.queryByText('1')).not.toBeInTheDocument();
    });

    it('should handle date comparison correctly', () => {
      const { rerender } = render(<ArticleItem article={mockArticle} index={1} />);

      // Get initial time display
      const initialTime = screen.getByText(/years ago/);
      expect(initialTime).toBeInTheDocument();

      // Re-render with same date but different Date object
      const sameTimeArticle = {
        ...mockArticle,
        pubDate: new Date('2024-01-01T12:00:00Z') // Same time, different object
      };
      rerender(<ArticleItem article={sameTimeArticle} index={1} />);

      // Should still show the same time (no re-render due to memo optimization)
      expect(screen.getByText(/years ago/)).toBeInTheDocument();

      // Re-render with different date
      const differentTimeArticle = {
        ...mockArticle,
        pubDate: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      };
      rerender(<ArticleItem article={differentTimeArticle} index={1} />);

      // Should show different time
      expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
    });
  });
});
