import React, { useState, useEffect } from "react";
import { SearchBar, SearchFilters } from "./SearchBar";
import { HeaderWeatherWidget } from "./HeaderWeatherWidget";
import { PaginationControls } from "./PaginationControls";
import { Article, FeedCategory } from "../types";
import { useFavorites } from "../hooks/useFavorites";

interface HeaderProps {
  onManageFeedsClick: () => void;
  onRefreshClick: () => void;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  onOpenSettings: () => void;
  articles: Article[];
  onSearch: (query: string, filters: SearchFilters) => void;
  onSearchResultsChange?: (results: Article[]) => void;
  onOpenFavorites: () => void;
  categories: FeedCategory[];
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const Header: React.FC<HeaderProps> = (props) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { getFavoritesCount } = useFavorites();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${isScrolled ? "bg-[rgb(var(--color-background))]/95 backdrop-blur-md shadow-lg" : "bg-[rgb(var(--color-background))]/80 backdrop-blur-sm"}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo e título */}
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-[rgb(var(--color-accent))] to-[rgb(var(--color-primary))] rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-lg font-semibold text-[rgb(var(--color-text))]">Personal News</span>
            </div>

            {/* Categorias - Desktop */}
            <div className="hidden lg:flex items-center space-x-2">
              {props.categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => props.onCategorySelect(category.id)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors ${props.selectedCategory === category.id ? "bg-[rgb(var(--color-accent))]/20 text-[rgb(var(--color-accent))]" : "text-gray-400 hover:text-white"}`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Ações do header */}
            <div className="flex items-center space-x-2">
              <HeaderWeatherWidget />
              
              {/* Botão Feeds - Sempre visível com dimensões consistentes */}
              <button 
                onClick={props.onManageFeedsClick} 
                className="hidden sm:flex items-center space-x-2 bg-[rgb(var(--color-accent))]/20 text-[rgb(var(--color-accent))] rounded-lg px-3 py-2 text-sm font-medium hover:bg-[rgb(var(--color-accent))]/30 transition-all duration-200 border border-[rgb(var(--color-accent))]/30 hover:border-[rgb(var(--color-accent))]/50"
                title="Gerenciar Feeds"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
                <span className="truncate">Feeds</span>
              </button>

              {/* Paginação - Sempre visível quando há múltiplas páginas */}
              {props.onPageChange && props.totalPages && props.totalPages > 1 && (
                <div className="hidden md:block">
                  <PaginationControls 
                    currentPage={props.currentPage || 0} 
                    totalPages={props.totalPages} 
                    onPageChange={props.onPageChange} 
                    compact={true} 
                  />
                </div>
              )}

              {/* Botão Refresh */}
              <button 
                onClick={props.onRefreshClick} 
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
                title="Atualizar feeds"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Botão Favoritos */}
              <button 
                onClick={props.onOpenFavorites} 
                className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
                title="Favoritos"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {getFavoritesCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {getFavoritesCount()}
                  </span>
                )}
              </button>

              {/* Botão Configurações */}
              <button 
                onClick={props.onOpenSettings} 
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
                title="Configurações"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.942 3.331.83 2.295 2.296a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.942 1.543-.83 3.331-2.296 2.295a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.942-3.331-.83-2.295-2.296a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.942-1.543.83-3.331 2.296-2.295a1.724 1.724 0 002.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Menu mobile */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
                title="Menu"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Espaçamento para o header fixo */}
      <div className="h-16"></div>

      {/* Menu mobile */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-16 left-0 right-0 bg-[rgb(var(--color-background))]/95 backdrop-blur-md border-b border-gray-700/20 z-20">
          <div className="px-4 py-4 space-y-4">
            {/* Barra de busca */}
            <SearchBar 
              articles={props.articles} 
              onSearch={props.onSearch} 
              onResultsChange={props.onSearchResultsChange} 
              placeholder="Buscar artigos..." 
              className="w-full" 
            />
            
            {/* Ações principais */}
            <div className="flex items-center justify-center space-x-3 py-2">
              <button 
                onClick={() => { props.onManageFeedsClick(); setMobileMenuOpen(false); }}
                className="flex items-center space-x-2 px-4 py-2 bg-[rgb(var(--color-accent))]/20 text-[rgb(var(--color-accent))] rounded-lg text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
                <span>Gerenciar Feeds</span>
              </button>
              
              <button 
                onClick={() => { props.onRefreshClick(); setMobileMenuOpen(false); }}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700/50 text-gray-300 rounded-lg text-sm hover:bg-gray-700"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Atualizar</span>
              </button>
            </div>

            {/* Paginação Mobile */}
            {props.onPageChange && props.totalPages && props.totalPages > 1 && (
              <div className="md:hidden">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Navegação</h3>
                <div className="flex justify-center">
                  <PaginationControls 
                    currentPage={props.currentPage || 0} 
                    totalPages={props.totalPages} 
                    onPageChange={props.onPageChange} 
                    compact={false} 
                  />
                </div>
              </div>
            )}

            {/* Categorias */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Categorias</h3>
              <div className="grid grid-cols-2 gap-2">
                {props.categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => { props.onCategorySelect(category.id); setMobileMenuOpen(false); }}
                    className={`p-3 text-sm rounded-lg flex items-center space-x-2 transition-colors ${props.selectedCategory === category.id ? "bg-[rgb(var(--color-accent))]/20 text-[rgb(var(--color-accent))]" : "text-gray-300 hover:text-white hover:bg-gray-800/50"}`}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }} />
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
