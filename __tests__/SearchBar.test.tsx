import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchBar } from '../components/SearchBar';
import { Article } from '../types';

const mockArticles: Article[] = [
  {
    title: 'Test Article',
    link: 'https://example.com/test',
    pubDate: new Date('2024-01-15'),
    sourceTitle: 'Test Source',
    description: 'Test description',
    categories: ['Test']
  },
  {
    title: 'Another Article',
    link: 'https://example.com/another',
    pubDate: new Date('2024-01-16'),
    sourceTitle: 'Another Source',
    description: 'Another description',
    categories: ['Tech']
  }
];

describe('SearchBar Component', () => {
  let mockOnSearch: ReturnType<typeof vi.fn>;
  let mockOnResultsChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSearch = vi.fn();
    mockOnResultsChange = vi.fn();
  });

  it('renders without crashing', () => {
    expect(() => {
      render(
        <SearchBar
          articles={mockArticles}
          onSearch={mockOnSearch}
        />
      );
    }).not.toThrow();
  });

  it('displays search input with correct placeholder', () => {
    render(
      <SearchBar
        articles={mockArticles}
        onSearch={mockOnSearch}
        placeholder="Custom placeholder"
      />
    );

    const input = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Custom placeholder');
  });

  it('calls onSearch when Enter is pressed', async () => {
    render(
      <SearchBar
        articles={mockArticles}
        onSearch={mockOnSearch}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('test query', expect.any(Object));
    });
  });
});
