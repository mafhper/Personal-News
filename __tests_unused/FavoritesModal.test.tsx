import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FavoritesModal } from '../components/FavoritesModal';
import { useFavorites } from '../hooks/useFavorites';
import type { Article } from '../types';

// Mock the useFavorites hook
import { vi } from 'vitest';
vi.mock('../hooks/useFavorites');
const mockUseFavorites = useFavorites as any;

// Mock the LazyImage component
vi.mock('../components/LazyImage', () => ({
  LazyImage: ({ src, alt, className }: { src: string; alt: string; className: string }) => (
    <img src={src} alt={alt} className={className} />
  )
}));

// Mock URL.createObjectURL and related APIs
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock FileReader
global.FileReader = class {
  onload: ((event: any) => void) | null = null;
  readAsText = vi.fn((file: File) => {
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: { result: '{"articles": [], "lastUpdated": "2024-01-01T00:00:00.000Z"}' } });
      }
    }, 0);
  });
} as any;

describe('FavoritesModal', () => {
  const mockFavorites = [
    {
      id: 'fav-1',
      title: 'Favorite Article 1',
      link: 'https://example.com/fav1',
      pubDate: '2024-01-01T00:00:00.000Z',
      sourceTitle: 'Tech Source',
      author: 'John Doe',
      description: 'This is a favorite article about technology',
      categories: ['Tech', 'News'],
      favoritedAt: '2024-01-01T12:00:00.000Z',
      imageUrl: 'https://example.com/image1.jpg'
    },
    {
      id: 'fav-2',
      title: 'Favorite Article 2',
      link: 'https://example.com/fav2',
      pubDate: '2024-01-02T00:00:00.000Z',
      sourceTitle: 'Science Source',
      description: 'This is a favorite article about science',
      categories: ['Science'],
      favoritedAt: '2024-01-02T12:00:00.000Z'
    }
  ];

  const defaultMockReturn = {
    favorites: mockFavorites,
    isFavorite: vi.fn(),
    addToFavorites: vi.fn(),
    removeFromFavorites: vi.fn(),
    toggleFavorite: vi.fn(),
    clearAllFavorites: vi.fn(),
    getFavoritesCount: vi.fn(() => mockFavorites.length),
    exportFavorites: vi.fn(() => JSON.stringify({ articles: mockFavorites, version: '1.0' })),
    importFavorites: vi.fn(() => true),
    getFavoritesByCategory: vi.fn((category) =>
      category === 'All' || !category ? mockFavorites :
      mockFavorites.filter(fav => fav.categories?.includes(category))
    ),
    getFavoritesBySource: vi.fn((source) =>
      !source ? mockFavorites :
      mockFavorites.filter(fav => fav.sourceTitle.includes(source) || fav.author?.includes(source))
    )
  };

  beforeEach(() => {
    mockUseFavorites.mockReturnValue(defaultMockReturn);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal rendering', () => {
    it('should not render when closed', () => {
      render(<FavoritesModal isOpen={false} onClose={vi.fn()} />);

      expect(screen.queryByText('My Favorites')).not.toBeInTheDocument();
    });

    it('should render when open', () => {
      render(<FavoritesModal isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByText('My Favorites')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Favorites count badge
    });

    it('should display favorites list', () => {
      render(<FavoritesModal isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByText('Favorite Article 1')).toBeInTheDocument();
      expect(screen.getByText('Favorite Article 2')).toBeInTheDocument();
      expect(screen.getByText('Tech Source')).toBeInTheDocument();
      expect(screen.getByText('Science Source')).toBeInTheDocument();
    });

    it('should show empty state when no favorites', () => {
      mockUseFavorites.mockReturnValue({
        ...defaultMockReturn,
        favorites: [],
        getFavoritesCount: jest.fn(() => 0)
      });

      render(<FavoritesModal isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByText('No favorites yet')).toBeInTheDocument();
      expect(screen.getByText('Start favoriting articles to see them here')).toBeInTheDocument();
    });
  });

  describe('Search functionality', () => {
    it('should filter favorites by search query', async () => {
      const user = userEvent.setup();
      render(<FavoritesModal isOpen={true} onClose={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText('Search favorites...');
      await user.type(searchInput, 'technology');

      expect(screen.getByText('Favorite Article 1')).toBeInTheDocument();
      expect(screen.queryByText('Favorite Article 2')).not.toBeInTheDocument();
    });

    it('should show no results message when search yields no results', async () => {
      const user = userEvent.setup();
      render(<FavoritesModal isOpen={true} onClose={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText('Search favorites...');
      await user.type(searchInput, 'nonexistent');

      expect(screen.getByText('No matching favorites')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
    });
  });

  describe('Category filtering', () => {
    it('should filter favorites by category', async () => {
      const user = userEvent.setup();
      render(<FavoritesModal isOpen={true} onClose={vi.fn()} />);

      const categorySelect = screen.getByDisplayValue('All');
      await user.selectOptions(categorySelect, 'Tech');

      expect(defaultMockReturn.getFavoritesByCategory).toHaveBeenCalledWith('Tech');
    });

    it('should show all categories in dropdown', () => {
      render(<FavoritesModal isOpen={true} onClose={vi.fn()} />);

      const categorySelect = screen.getByDisplayValue('All');
      expect(categorySelect).toBeInTheDocument();

      // Check if options are present
      expect(screen.getByRole('option', { name: 'All' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'News' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Science' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Tech' })).toBeInTheDocument();
    });
  });

  describe('Source filtering', () => {
    it('should filter favorites by source', async () => {
      const user = userEvent.setup();
      render(<FavoritesModal isOpen={true} onClose={vi.fn()} />);

      const sourceSelects = screen.getAllByDisplayValue('All');
      const sourceSelect = sourceSelects[1]; // Second "All" dropdown is for sources
      await user.selectOptions(sourceSelect, 'Tech Source');

      expect(defaultMockReturn.getFavoritesBySource).toHaveBeenCalledWith('Tech Source');
    });
  });

  describe('Sorting functionality', () => {
    it('should sort favorites by different criteria', async () => {
      const user = userEvent.setup();
      render(<FavoritesModal isOpen={true} onClose={vi.fn()} />);

      const sortSelect = screen.getByDisplayValue('Most Recent');

      await user.selectOptions(sortSelect, 'Title A-Z');
      // Verify the articles are displayed in title order
      const articles = screen.getAllByRole('link');
      expect(articles[0]).toHaveTextContent('Favorite Article 1');
      expect(articles[1]).toHaveTextContent('Favorite Article 2');
    });
  });

  describe('Remove favorites', () => {
    it('should remove favorite when remove button is clicked', async () => {
      const user = userEvent.setup();
      render(<FavoritesModal isOpen={true} onClose={vi.fn()} />);

      const removeButtons = screen.getAllByTitle('Remove from favorites');
      await user.click(removeButtons[0]);

      expect(defaultMockReturn.removeFromFavorites).toHaveBeenCalled();
    });
  });

  describe('Clear all functionality', () => {
    it('should show confirmation dialog when clear all is clicked', async () => {
      const user = userEvent.setup();
      render(<FavoritesModal isOpen={true} onClose={vi.fn()} />);

      const clearAllButton = screen.getByText('Clear All');
      await user.click(clearAllButton);

      expect(screen.getByText('Clear All Favorites?')).toBeInTheDocument();
      expect(screen.getByText(/This will permanently remove all 2 favorites/)).toBeInTheDocument();
    });

    it('should clear all favorites when confirmed', async () => {
      const user = userEvent.setup();
      render(<FavoritesModal isOpen={true} onClose={vi.fn()} />);

      const clearAllButton = screen.getByText('Clear All');
      await user.click(clearAllButton);

      const confirmButton = screen.getByRole('button', { name: 'Clear All' });
      await user.click(confirmButton);

      expect(defaultMockReturn.clearAllFavorites).toHaveBeenCalled();
    });

    it('should cancel clear all when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<FavoritesModal isOpen={true} onClose={vi.fn()} />);

      const clearAllButton = screen.getByText('Clear All');
      await user.click(clearAllButton);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(screen.queryByText('Clear All Favorites?')).not.toBeInTheDocument();
      expect(defaultMockReturn.clearAllFavorites).not.toHaveBeenCalled();
    });
  });

  describe('Export functionality', () => {
    it('should trigger download when export button is clicked', async () => {
      const user = userEvent.setup();

      // Mock document.createElement and related DOM methods
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn()
      };
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation();
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation();

      render(<FavoritesModal isOpen={true} onClose={vi.fn()} />);

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);

      expect(defaultMockReturn.exportFavorites).toHaveBeenCalled();
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });

  describe('Import functionality', () => {
    it('should handle file import', async () => {
      const user = userEvent.setup();
      render(<FavoritesModal isOpen={true} onClose={vi.fn()} />);

      const importInput = screen.getByLabelText(/Import/);
      const file = new File(['{"articles": []}'], 'favorites.json', { type: 'application/json' });

      await user.upload(importInput, file);

      await waitFor(() => {
        expect(defaultMockReturn.importFavorites).toHaveBeenCalled();
      });
    });
  });

  describe('Article links', () => {
    it('should render article links with correct attributes', () => {
      render(<FavoritesModal isOpen={true} onClose={vi.fn()} />);

      const articleLinks = screen.getAllByRole('link');

      expect(articleLinks[0]).toHaveAttribute('href', 'https://example.com/fav1');
      expect(articleLinks[0]).toHaveAttribute('target', '_blank');
      expect(articleLinks[0]).toHaveAttribute('rel', 'noopener noreferrer');

      expect(articleLinks[1]).toHaveAttribute('href', 'https://example.com/fav2');
      expect(articleLinks[1]).toHaveAttribute('target', '_blank');
      expect(articleLinks[1]).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Time display', () => {
    it('should display relative time for publication and favorite dates', () => {
      render(<FavoritesModal isOpen={true} onClose={vi.fn()} />);

      // Check that time-related text is displayed (exact text depends on current time)
      expect(screen.getByText(/ago/)).toBeInTheDocument();
      expect(screen.getByText(/Favorited/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<FavoritesModal isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByRole('button', { name: /Export/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Import/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Clear All/ })).toBeInTheDocument();

      const removeButtons = screen.getAllByTitle('Remove from favorites');
      expect(removeButtons).toHaveLength(2);
    });

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<FavoritesModal isOpen={true} onClose={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText('Search favorites...');

      // Tab to search input
      await user.tab();
      expect(searchInput).toHaveFocus();

      // Should be able to type in search
      await user.type(searchInput, 'test');
      expect(searchInput).toHaveValue('test');
    });
  });
});
