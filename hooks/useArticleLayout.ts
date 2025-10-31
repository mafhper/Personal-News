/**
 * useArticleLayout.ts
 *
 * Hook para gerenciar configurações de layout de artigos
 * Permite configurar quantos artigos mostrar em cada seção
 *
 * @author Matheus Pereira
 * @version 1.0.0
 */

import { useLocalStorage } from './useLocalStorage';

export interface ArticleLayoutSettings {
  topStoriesCount: 0 | 5 | 10 | 15 | 20;
  showPublicationTime: boolean;
  articlesPerPage: number;
}

const DEFAULT_SETTINGS: ArticleLayoutSettings = {
  topStoriesCount: 15,
  showPublicationTime: true,
  articlesPerPage: 21, // 1 featured + 5 recent + 15 top stories
};

export const useArticleLayout = () => {
  const [settings, setSettings] = useLocalStorage<ArticleLayoutSettings>(
    'article-layout-settings',
    DEFAULT_SETTINGS
  );

  const updateSettings = (newSettings: Partial<ArticleLayoutSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };

    // Recalculate articlesPerPage when topStoriesCount changes
    if ('topStoriesCount' in newSettings) {
      updatedSettings.articlesPerPage = 1 + 5 + updatedSettings.topStoriesCount; // featured + recent + top stories
    }

    setSettings(updatedSettings);
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    updateSettings,
    resetToDefaults,
  };
};
