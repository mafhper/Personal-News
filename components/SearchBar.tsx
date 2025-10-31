import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Article } from '../types';
import { useSearch, useSearchHistory, useSearchSuggestions } from '../hooks/useSearch';
import { highlightSearchTerms } from '../services/searchUtils';

export interface SearchFilters {
  category?: string;
  dateRange?: 'today' | 'week' | 'month' | 'all';
  source?: string;
}

export interface SearchBarProps {
  articles: Article[];
  onSearch: (query: string, filters: SearchFilters) => void;
  onResultsChange?: (results: Article[]) => void;
  placeholder?: string;
  debounceMs?: number;
  showFilters?: boolean;
  className?: string;
}

const SearchIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const SearchBar: React.FC<SearchBarProps> = ({
  articles,
  onSearch,
  onResultsChange,
  placeholder = "Search articles... (Ctrl+K)",
  debounceMs = 300,
  showFilters = true,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    category: undefined,
    dateRange: 'all',
    source: undefined
  });
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    query,
    setQuery,
    results,
    isSearching,
    hasResults,
    searchIndex
  } = useSearch(articles, {
    debounceMs,
    includeTitle: true,
    includeContent: true,
    includeCategories: true,
    includeSource: true
  });

  const { searchHistory, addToHistory } = useSearchHistory();
  const suggestions = useSearchSuggestions(searchIndex, query, 5);

  // Get unique categories and sources for filters
  const availableCategories = React.useMemo(() => {
    const categories = new Set<string>();
    articles.forEach(article => {
      article.categories?.forEach(cat => categories.add(cat));
    });
    return Array.from(categories).sort();
  }, [articles]);

  const availableSources = React.useMemo(() => {
    const sources = new Set<string>();
    articles.forEach(article => {
      sources.add(article.sourceTitle);
    });
    return Array.from(sources).sort();
  }, [articles]);

  // Filter results based on current filters
  const filteredResults = React.useMemo(() => {
    let filtered = results.map(result => result.article);

    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(article =>
        article.categories?.includes(filters.category!)
      );
    }

    if (filters.source && filters.source !== 'all') {
      filtered = filtered.filter(article =>
        article.sourceTitle === filters.source
      );
    }

    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();

      switch (filters.dateRange) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(article =>
        new Date(article.pubDate) >= cutoffDate
      );
    }

    return filtered;
  }, [results, filters]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+K to open search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }

      // Escape to close search
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setQuery]);

  // Handle input keyboard navigation
  const handleInputKeyDown = (event: React.KeyboardEvent) => {
    const totalSuggestions = suggestions.length + searchHistory.length;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedSuggestionIndex(prev =>
          prev < totalSuggestions - 1 ? prev + 1 : -1
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedSuggestionIndex(prev =>
          prev > -1 ? prev - 1 : totalSuggestions - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          const allSuggestions = [...suggestions, ...searchHistory];
          const selectedSuggestion = allSuggestions[selectedSuggestionIndex];
          setQuery(selectedSuggestion);
          setSelectedSuggestionIndex(-1);
        } else if (query.trim()) {
          handleSearch();
        }
        break;
      case 'Tab':
        if (selectedSuggestionIndex >= 0) {
          event.preventDefault();
          const allSuggestions = [...suggestions, ...searchHistory];
          const selectedSuggestion = allSuggestions[selectedSuggestionIndex];
          setQuery(selectedSuggestion);
          setSelectedSuggestionIndex(-1);
        }
        break;
    }
  };

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      addToHistory(query);
      onSearch(query, filters);
      setIsOpen(false);
    }
  }, [query, filters, onSearch, addToHistory]);

  // Update results when filtered results change
  useEffect(() => {
    onResultsChange?.(filteredResults);
  }, [filteredResults, onResultsChange]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }));
  };

  const clearSearch = () => {
    setQuery('');
    setFilters({
      category: undefined,
      dateRange: 'all',
      source: undefined
    });
    setSelectedSuggestionIndex(-1);
    onResultsChange?.([]);
  };

  const renderHighlightedText = (text: string) => {
    if (!query.trim()) return text;
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: highlightSearchTerms(text, query)
        }}
      />
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:border-transparent"
          aria-label="Search articles"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
          {query && (
            <button
              onClick={clearSearch}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              aria-label="Clear search"
            >
              <CloseIcon />
            </button>
          )}
          {showFilters && (
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`p-1 transition-colors ${
                showFiltersPanel ? 'text-[rgb(var(--color-accent))]' : 'text-gray-400 hover:text-white'
              }`}
              aria-label="Toggle filters"
            >
              <FilterIcon />
            </button>
          )}
        </div>
      </div>

      {/* Search Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Filters Panel */}
          {showFiltersPanel && (
            <div className="p-4 border-b border-gray-600">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={filters.category || 'all'}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-accent))]"
                  >
                    <option value="all">All Categories</option>
                    {availableCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange || 'all'}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-accent))]"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Source
                  </label>
                  <select
                    value={filters.source || 'all'}
                    onChange={(e) => handleFilterChange('source', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-accent))]"
                  >
                    <option value="all">All Sources</option>
                    {availableSources.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Search Results */}
          {query.trim() && (
            <div>
              {isSearching && (
                <div className="p-4 text-center text-gray-400">
                  Searching...
                </div>
              )}

              {!isSearching && hasResults && (
                <div>
                  <div className="px-4 py-2 text-sm text-gray-400 border-b border-gray-700">
                    {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
                  </div>
                  {filteredResults.slice(0, 10).map((article, index) => (
                    <div
                      key={`${article.link}-${index}`}
                      className="p-4 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
                      onClick={() => window.open(article.link, '_blank')}
                    >
                      <h3 className="font-medium text-white mb-1">
                        {renderHighlightedText(article.title)}
                      </h3>
                      {article.description && (
                        <p className="text-sm text-gray-400 line-clamp-2">
                          {renderHighlightedText(article.description)}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>{article.sourceTitle}</span>
                        <span>{new Date(article.pubDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isSearching && !hasResults && (
                <div className="p-4 text-center text-gray-400">
                  No results found for "{query}"
                </div>
              )}
            </div>
          )}

          {/* Suggestions and History */}
          {!query.trim() && (suggestions.length > 0 || searchHistory.length > 0) && (
            <div>
              {suggestions.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-sm text-gray-400 border-b border-gray-700">
                    Suggestions
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion}
                      onClick={() => setQuery(suggestion)}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-700 text-white ${
                        selectedSuggestionIndex === index ? 'bg-gray-700' : ''
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {searchHistory.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-sm text-gray-400 border-b border-gray-700">
                    Recent Searches
                  </div>
                  {searchHistory.slice(0, 5).map((historyItem, index) => (
                    <button
                      key={historyItem}
                      onClick={() => setQuery(historyItem)}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-700 text-white ${
                        selectedSuggestionIndex === suggestions.length + index ? 'bg-gray-700' : ''
                      }`}
                    >
                      {historyItem}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!query.trim() && suggestions.length === 0 && searchHistory.length === 0 && (
            <div className="p-4 text-center text-gray-400">
              Start typing to search articles...
            </div>
          )}
        </div>
      )}
    </div>
  );
};
