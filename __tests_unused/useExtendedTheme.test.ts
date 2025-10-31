import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExtendedTheme } from '../hooks/useExtendedTheme';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
const mockMatchMedia = vi.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

// Mock DOM methods
const mockSetProperty = vi.fn();
Object.defineProperty(document, 'documentElement', {
  value: {
    style: {
      setProperty: mockSetProperty,
    },
  },
  writable: true,
});

describe('useExtendedTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);

    // Default matchMedia mock for dark theme
    mockMatchMedia.mockImplementation(query => ({
      matches: query.includes('dark'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default theme settings', () => {
    const { result } = renderHook(() => useExtendedTheme());

    expect(result.current.themeSettings).toBeDefined();
    expect(result.current.currentTheme).toBeDefined();
    expect(result.current.defaultPresets).toBeDefined();
    expect(result.current.customThemes).toEqual([]);
  });

  it('should detect system theme preference', () => {
    const { result } = renderHook(() => useExtendedTheme());

    expect(result.current.systemPreference).toBe('dark');
  });

  it('should switch to light theme when system preference changes', () => {
    // Mock light theme preference
    mockMatchMedia.mockImplementation(query => ({
      matches: query.includes('light') || !query.includes('dark'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useExtendedTheme());

    expect(result.current.systemPreference).toBe('light');
  });

  it('should apply theme to DOM', () => {
    const { result } = renderHook(() => useExtendedTheme());

    // Theme should be applied to DOM on initialization
    expect(mockSetProperty).toHaveBeenCalled();

    // Check that color properties were set
    expect(mockSetProperty).toHaveBeenCalledWith(
      expect.stringMatching(/--color-/),
      expect.any(String)
    );
  });

  it('should set current theme', () => {
    const { result } = renderHook(() => useExtendedTheme());

    const newTheme = {
      ...result.current.defaultPresets[1].theme,
      id: 'test-theme',
    };

    act(() => {
      result.current.setCurrentTheme(newTheme);
    });

    expect(result.current.currentTheme.id).toBe('test-theme');
  });

  it('should add custom theme', () => {
    const { result } = renderHook(() => useExtendedTheme());

    const customTheme = {
      ...result.current.defaultPresets[0].theme,
      id: 'custom-theme',
      name: 'Custom Theme',
    };

    act(() => {
      result.current.addCustomTheme(customTheme);
    });

    expect(result.current.customThemes).toContainEqual(customTheme);
  });

  it('should remove custom theme', () => {
    const { result } = renderHook(() => useExtendedTheme());

    const customTheme = {
      ...result.current.defaultPresets[0].theme,
      id: 'custom-theme',
      name: 'Custom Theme',
    };

    act(() => {
      result.current.addCustomTheme(customTheme);
    });

    expect(result.current.customThemes).toContainEqual(customTheme);

    act(() => {
      result.current.removeCustomTheme('custom-theme');
    });

    expect(result.current.customThemes).not.toContainEqual(customTheme);
  });

  it('should duplicate theme', () => {
    const { result } = renderHook(() => useExtendedTheme());

    const sourceTheme = result.current.defaultPresets[0].theme;

    act(() => {
      result.current.duplicateTheme(sourceTheme, 'Duplicated Theme');
    });

    const duplicatedTheme = result.current.customThemes.find(
      theme => theme.name === 'Duplicated Theme'
    );

    expect(duplicatedTheme).toBeDefined();
    expect(duplicatedTheme?.colors).toEqual(sourceTheme.colors);
    expect(duplicatedTheme?.id).not.toBe(sourceTheme.id);
  });

  it('should update theme settings', () => {
    const { result } = renderHook(() => useExtendedTheme());

    act(() => {
      result.current.updateThemeSettings({
        autoDetectSystemTheme: false,
        themeTransitions: false,
      });
    });

    expect(result.current.themeSettings.autoDetectSystemTheme).toBe(false);
    expect(result.current.themeSettings.themeTransitions).toBe(false);
  });

  it('should reset to defaults', () => {
    const { result } = renderHook(() => useExtendedTheme());

    // Make some changes
    act(() => {
      result.current.updateThemeSettings({
        autoDetectSystemTheme: false,
        themeTransitions: false,
      });
    });

    // Reset to defaults
    act(() => {
      result.current.resetToDefaults();
    });

    expect(result.current.themeSettings.autoDetectSystemTheme).toBe(true);
    expect(result.current.themeSettings.themeTransitions).toBe(true);
  });

  it('should get theme by ID', () => {
    const { result } = renderHook(() => useExtendedTheme());

    const firstPreset = result.current.defaultPresets[0];
    const foundTheme = result.current.getThemeById(firstPreset.id);

    expect(foundTheme).toEqual(firstPreset.theme);
  });

  it('should return all themes', () => {
    const { result } = renderHook(() => useExtendedTheme());

    const customTheme = {
      ...result.current.defaultPresets[0].theme,
      id: 'custom-theme',
      name: 'Custom Theme',
    };

    act(() => {
      result.current.addCustomTheme(customTheme);
    });

    const allThemes = result.current.allThemes;

    expect(allThemes.length).toBeGreaterThan(result.current.defaultPresets.length);
    expect(allThemes).toContainEqual(customTheme);
  });

  it('should migrate old theme data', () => {
    // Mock old theme data in localStorage
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'theme-color') {
        return JSON.stringify('255 0 0');
      }
      if (key === 'extended-theme-settings') {
        return JSON.stringify({
          currentTheme: {
            id: 'default',
            name: 'Default',
            colors: {
              primary: '20 184 166',
              secondary: '45 55 72',
              accent: '20 184 166',
              background: '26 32 44',
              surface: '45 55 72',
              text: '247 250 252',
              textSecondary: '160 174 192',
              border: '75 85 99',
              success: '16 185 129',
              warning: '245 158 11',
              error: '239 68 68',
            },
            layout: 'comfortable',
            density: 'medium',
            borderRadius: 'medium',
            shadows: true,
            animations: true,
          },
          customThemes: [],
          autoDetectSystemTheme: true,
          systemThemeOverride: null,
          themeTransitions: true,
        });
      }
      return null;
    });

    const { result } = renderHook(() => useExtendedTheme());

    // Should have loaded the theme settings
    expect(result.current.themeSettings.autoDetectSystemTheme).toBe(true);
    expect(result.current.themeSettings.themeTransitions).toBe(true);
  });

  it('should handle system theme changes', () => {
    let mediaQueryCallback: ((e: MediaQueryListEvent) => void) | null = null;

    mockMatchMedia.mockImplementation(query => ({
      matches: query.includes('dark'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event, callback) => {
        if (event === 'change') {
          mediaQueryCallback = callback;
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useExtendedTheme());

    expect(result.current.systemPreference).toBe('dark');

    // Simulate system theme change to light
    if (mediaQueryCallback) {
      act(() => {
        mediaQueryCallback({ matches: false } as MediaQueryListEvent);
      });
    }

    expect(result.current.systemPreference).toBe('light');
  });
});
