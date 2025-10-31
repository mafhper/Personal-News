import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { ExtendedTheme, ThemeSettings } from '../types';
import {
  defaultThemeSettings,
  defaultThemePresets,
  validateTheme,
  migrateTheme,
  applyThemeToDOM,
  getSystemThemePreference,
  getSystemMatchingTheme,
} from '../services/themeUtils';

export const useExtendedTheme = () => {
  const [themeSettings, setThemeSettings] = useLocalStorage<ThemeSettings>(
    'extended-theme-settings',
    defaultThemeSettings
  );

  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>(
    getSystemThemePreference()
  );

  // Migrate old theme data if needed
  useEffect(() => {
    const oldThemeColor = localStorage.getItem('theme-color');
    if (oldThemeColor && themeSettings.customThemes.length === 0) {
      try {
        const parsedColor = JSON.parse(oldThemeColor);
        const migratedTheme = migrateTheme(parsedColor);
        if (migratedTheme) {
          setThemeSettings(prev => ({
            ...prev,
            currentTheme: migratedTheme,
            customThemes: [migratedTheme],
          }));
          // Clean up old storage
          localStorage.removeItem('theme-color');
        }
      } catch (error) {
        console.warn('Failed to migrate old theme:', error);
      }
    }
  }, [themeSettings.customThemes.length, setThemeSettings]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Auto-apply system theme if enabled
  useEffect(() => {
    if (themeSettings.autoDetectSystemTheme && !themeSettings.systemThemeOverride) {
      const systemTheme = getSystemMatchingTheme(systemPreference);
      if (systemTheme.id !== themeSettings.currentTheme.id) {
        setThemeSettings(prev => ({
          ...prev,
          currentTheme: systemTheme,
        }));
      }
    }
  }, [systemPreference, themeSettings.autoDetectSystemTheme, themeSettings.systemThemeOverride, themeSettings.currentTheme.id, setThemeSettings]);

  // Apply theme to DOM whenever current theme changes
  useEffect(() => {
    if (validateTheme(themeSettings.currentTheme)) {
      applyThemeToDOM(themeSettings.currentTheme);
    }
  }, [themeSettings.currentTheme]);

  // Theme management functions
  const setCurrentTheme = useCallback((theme: ExtendedTheme) => {
    if (validateTheme(theme)) {
      setThemeSettings(prev => ({
        ...prev,
        currentTheme: theme,
        systemThemeOverride: prev.autoDetectSystemTheme ?
          (theme.id.includes('light') ? 'light' : 'dark') : null,
      }));
    }
  }, [setThemeSettings]);

  const addCustomTheme = useCallback((theme: ExtendedTheme) => {
    if (validateTheme(theme)) {
      setThemeSettings(prev => ({
        ...prev,
        customThemes: [...prev.customThemes.filter(t => t.id !== theme.id), theme],
      }));
    }
  }, [setThemeSettings]);

  const removeCustomTheme = useCallback((themeId: string) => {
    setThemeSettings(prev => ({
      ...prev,
      customThemes: prev.customThemes.filter(t => t.id !== themeId),
      currentTheme: prev.currentTheme.id === themeId ?
        defaultThemePresets[0].theme : prev.currentTheme,
    }));
  }, [setThemeSettings]);

  const updateThemeSettings = useCallback((updates: Partial<ThemeSettings>) => {
    setThemeSettings(prev => ({ ...prev, ...updates }));
  }, [setThemeSettings]);

  const resetToDefaults = useCallback(() => {
    setThemeSettings(defaultThemeSettings);
  }, [setThemeSettings]);

  const getAllThemes = useCallback(() => {
    return [
      ...defaultThemePresets.map(preset => preset.theme),
      ...themeSettings.customThemes,
    ];
  }, [themeSettings.customThemes]);

  const getThemeById = useCallback((id: string): ExtendedTheme | undefined => {
    return getAllThemes().find(theme => theme.id === id);
  }, [getAllThemes]);

  const duplicateTheme = useCallback((sourceTheme: ExtendedTheme, newName: string) => {
    const duplicatedTheme: ExtendedTheme = {
      ...sourceTheme,
      id: `custom-${Date.now()}`,
      name: newName,
    };
    addCustomTheme(duplicatedTheme);
    return duplicatedTheme;
  }, [addCustomTheme]);

  return {
    // Current state
    themeSettings,
    currentTheme: themeSettings.currentTheme,
    systemPreference,

    // Theme collections
    defaultPresets: defaultThemePresets,
    customThemes: themeSettings.customThemes,
    allThemes: getAllThemes(),

    // Theme management
    setCurrentTheme,
    addCustomTheme,
    removeCustomTheme,
    duplicateTheme,
    getThemeById,

    // Settings management
    updateThemeSettings,
    resetToDefaults,

    // Utilities
    validateTheme,
    applyThemeToDOM,
  };
};
