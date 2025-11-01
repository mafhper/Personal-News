import React, { useState, useEffect } from "react";
import { SearchBar, SearchFilters } from "./SearchBar";
import { HeaderWeatherWidget } from "./HeaderWeatherWidget";
import { PaginationControls } from "./PaginationControls";
import { Article, FeedCategory } from "../types";
import Logo from "./Logo";
import { HeaderIcons } from "./icons";

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
  onGoHome?: () => void;
}

const Header: React.FC<HeaderProps> = (props) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
              <Logo size="md" onClick={props.onOpenSettings} isClickable={true} />
              <button
                onClick={props.onGoHome}
                className="text-lg font-semibold text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-accent))] transition-colors cursor-pointer"
                title="Ir para a primeira página"
              >
                Personal News
              </button>
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
                <HeaderIcons.Feeds showBackground={false} size="sm" />
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
              <HeaderIcons.Refresh 
                onClick={props.onRefreshClick}
                title="Atualizar feeds"
                size="md"
              />

              {/* Botão Favoritos */}
              <HeaderIcons.Favorites 
                onClick={props.onOpenFavorites}
                title="Favoritos"
                size="md"
              />



              {/* Menu mobile */}
              <div className="lg:hidden">
                <HeaderIcons.Menu 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  title="Menu"
                  size="md"
                  isActive={mobileMenuOpen}
                />
              </div>
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
                <HeaderIcons.Feeds showBackground={false} size="sm" />
                <span>Gerenciar Feeds</span>
              </button>
              
              <button 
                onClick={() => { props.onRefreshClick(); setMobileMenuOpen(false); }}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700/50 text-gray-300 rounded-lg text-sm hover:bg-gray-700"
              >
                <HeaderIcons.Refresh showBackground={false} size="sm" />
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
