import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateTheme,
  migrateTheme,
  createThemeFromAccentColor,
  applyThemeToDOM,
  getSystemThemePreference,
  exportTheme,
  importTheme,
  defaultThemePresets,
  hexToRgb,
} from '../services/themeUtils';
import type { ExtendedTheme } from '../types';

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

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: query.includes('dark'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('themeUtils', () => {
  beforeEach(() => {
    mockSetProperty.mockClear();
  });

  describe('hexToRgb', () => {
    it('should convert 6-digit hex colors to RGB string format', () => {
      expect(hexToRgb('#FF0000')).toBe('255 0 0');
      expect(hexToRgb('#00FF00')).toBe('0 255 0');
      expect(hexToRgb('#0000FF')).toBe('0 0 255');
      expect(hexToRgb('#FFFFFF')).toBe('255 255 255');
      expect(hexToRgb('#000000')).toBe('0 0 0');
    });

    it('should convert 6-digit hex colors without # prefix', () => {
      expect(hexToRgb('FF0000')).toBe('255 0 0');
      expect(hexToRgb('00FF00')).toBe('0 255 0');
      expect(hexToRgb('0000FF')).toBe('0 0 255');
    });

    it('should convert 3-digit hex colors to RGB string format', () => {
      expect(hexToRgb('#F00')).toBe('255 0 0');
      expect(hexToRgb('#0F0')).toBe('0 255 0');
      expect(hexToRgb('#00F')).toBe('0 0 255');
      expect(hexToRgb('#FFF')).toBe('255 255 255');
      expect(hexToRgb('#000')).toBe('0 0 0');
    });

    it('should convert 3-digit hex colors without # prefix', () => {
      expect(hexToRgb('F00')).toBe('255 0 0');
      expect(hexToRgb('0F0')).toBe('0 255 0');
      expect(hexToRgb('00F')).toBe('0 0 255');
    });

    it('should handle lowercase hex colors', () => {
      expect(hexToRgb('#ff0000')).toBe('255 0 0');
      expect(hexToRgb('#00ff00')).toBe('0 255 0');
      expect(hexToRgb('#0000ff')).toBe('0 0 255');
      expect(hexToRgb('#abc123')).toBe('171 193 35');
    });

    it('should handle mixed case hex colors', () => {
      expect(hexToRgb('#Ff0000')).toBe('255 0 0');
      expect(hexToRgb('#00Ff00')).toBe('0 255 0');
      expect(hexToRgb('#AbC123')).toBe('171 193 35');
    });

    it('should convert specific theme colors accurately', () => {
      // Test colors from the design document
      expect(hexToRgb('#1E88E5')).toBe('30 136 229'); // Noite Urbana primary
      expect(hexToRgb('#FFC107')).toBe('255 193 7');   // Noite Urbana accent
      expect(hexToRgb('#121212')).toBe('18 18 18');    // Noite Urbana background
      expect(hexToRgb('#43A047')).toBe('67 160 71');   // Verde Noturno primary
      expect(hexToRgb('#8E24AA')).toBe('142 36 170');  // Roxo Nebuloso primary
      expect(hexToRgb('#1976D2')).toBe('25 118 210');  // Solar Clean primary
      expect(hexToRgb('#EC407A')).toBe('236 64 122');  // Verão Pastel primary
      expect(hexToRgb('#00ACC1')).toBe('0 172 193');   // Minimal Ice primary
    });

    it('should throw error for invalid hex format', () => {
      expect(() => hexToRgb('#GG0000')).toThrow('Invalid hex color format: #GG0000. Expected format: #RRGGBB or #RGB');
      expect(() => hexToRgb('#12345')).toThrow('Invalid hex color format: #12345. Expected format: #RRGGBB or #RGB');
      expect(() => hexToRgb('#1234567')).toThrow('Invalid hex color format: #1234567. Expected format: #RRGGBB or #RGB');
      expect(() => hexToRgb('invalid')).toThrow('Invalid hex color format: invalid. Expected format: #RRGGBB or #RGB');
      expect(() => hexToRgb('')).toThrow('Invalid hex color format: . Expected format: #RRGGBB or #RGB');
    });

    it('should throw error for non-hex characters', () => {
      expect(() => hexToRgb('#GGGGGG')).toThrow('Invalid hex color format');
      expect(() => hexToRgb('#12345G')).toThrow('Invalid hex color format');
      expect(() => hexToRgb('ZZZZZZ')).toThrow('Invalid hex color format');
    });

    it('should handle edge cases with valid hex values', () => {
      expect(hexToRgb('#808080')).toBe('128 128 128'); // Medium gray
      expect(hexToRgb('#7F7F7F')).toBe('127 127 127'); // Just below 128
      expect(hexToRgb('#010101')).toBe('1 1 1');       // Almost black
      expect(hexToRgb('#FEFEFE')).toBe('254 254 254'); // Almost white
    });

    it('should validate RGB output is in correct range', () => {
      const testColors = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#808080'];

      testColors.forEach(color => {
        const result = hexToRgb(color);
        const [r, g, b] = result.split(' ').map(Number);

        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThanOrEqual(255);
        expect(g).toBeGreaterThanOrEqual(0);
        expect(g).toBeLessThanOrEqual(255);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThanOrEqual(255);

        expect(Number.isInteger(r)).toBe(true);
        expect(Number.isInteger(g)).toBe(true);
        expect(Number.isInteger(b)).toBe(true);
      });
    });

    it('should produce consistent results for equivalent 3-digit and 6-digit hex', () => {
      expect(hexToRgb('#F00')).toBe(hexToRgb('#FF0000'));
      expect(hexToRgb('#0F0')).toBe(hexToRgb('#00FF00'));
      expect(hexToRgb('#00F')).toBe(hexToRgb('#0000FF'));
      expect(hexToRgb('#FFF')).toBe(hexToRgb('#FFFFFF'));
      expect(hexToRgb('#000')).toBe(hexToRgb('#000000'));
      expect(hexToRgb('#ABC')).toBe(hexToRgb('#AABBCC'));
    });
  });

  describe('validateTheme', () => {
    it('should validate a complete theme', () => {
      const validTheme = defaultThemePresets[0].theme;
      expect(validateTheme(validTheme)).toBe(true);
    });

    it('should reject theme missing required fields', () => {
      const invalidTheme = {
        id: 'test',
        name: 'Test Theme',
        // missing colors, layout, density, borderRadius
      };
      expect(validateTheme(invalidTheme)).toBe(false);
    });

    it('should reject theme with invalid RGB colors', () => {
      const invalidTheme = {
        id: 'test',
        name: 'Test Theme',
        colors: {
          primary: 'invalid-color',
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
      };
      expect(validateTheme(invalidTheme)).toBe(false);
    });

    it('should validate RGB color format correctly', () => {
      const validTheme = {
        id: 'test',
        name: 'Test Theme',
        colors: {
          primary: '255 255 255',
          secondary: '0 0 0',
          accent: '128 128 128',
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
      };
      expect(validateTheme(validTheme)).toBe(true);
    });
  });

  describe('createThemeFromAccentColor', () => {
    it('should create a dark theme from dark accent color', () => {
      const theme = createThemeFromAccentColor('20 20 20', 'Dark Test');
      expect(theme.name).toBe('Dark Test');
      expect(theme.colors.accent).toBe('20 20 20');
      expect(theme.colors.background).toBe('26 32 44'); // Dark background
    });

    it('should create a light theme from light accent color', () => {
      const theme = createThemeFromAccentColor('200 200 200', 'Light Test');
      expect(theme.name).toBe('Light Test');
      expect(theme.colors.accent).toBe('200 200 200');
      expect(theme.colors.background).toBe('255 255 255'); // Light background
    });

    it('should generate unique IDs', async () => {
      const theme1 = createThemeFromAccentColor('100 100 100', 'Test 1');
      // Add sufficient delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      const theme2 = createThemeFromAccentColor('100 100 100', 'Test 2');
      expect(theme1.id).not.toBe(theme2.id);
    });
  });

  describe('migrateTheme', () => {
    it('should migrate string theme to ExtendedTheme', () => {
      const oldTheme = '20 184 166';
      const migratedTheme = migrateTheme(oldTheme);
      expect(migratedTheme).toBeTruthy();
      expect(migratedTheme?.colors.accent).toBe('20 184 166');
      expect(migratedTheme?.name).toBe('Migrated Theme');
    });

    it('should return valid theme unchanged', () => {
      const validTheme = defaultThemePresets[0].theme;
      const result = migrateTheme(validTheme);
      expect(result).toEqual(validTheme);
    });

    it('should return null for invalid theme', () => {
      const invalidTheme = { invalid: 'data' };
      const result = migrateTheme(invalidTheme);
      expect(result).toBeNull();
    });
  });

  describe('applyThemeToDOM', () => {
    it('should apply theme colors to CSS custom properties', () => {
      const theme = defaultThemePresets[0].theme;
      applyThemeToDOM(theme);

      // Check that CSS custom properties were set
      expect(mockSetProperty).toHaveBeenCalledWith('--color-primary', theme.colors.primary);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-accent', theme.colors.accent);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-background', theme.colors.background);
    });

    it('should apply layout and density settings', () => {
      const theme: ExtendedTheme = {
        ...defaultThemePresets[0].theme,
        layout: 'spacious',
        density: 'high',
      };
      applyThemeToDOM(theme);

      expect(mockSetProperty).toHaveBeenCalledWith('--layout-padding', '1.5rem');
      expect(mockSetProperty).toHaveBeenCalledWith('--layout-gap', '1.5rem');
      expect(mockSetProperty).toHaveBeenCalledWith('--density-font-size', '1.125rem');
    });

    it('should apply border radius and feature toggles', () => {
      const theme: ExtendedTheme = {
        ...defaultThemePresets[0].theme,
        borderRadius: 'large',
        shadows: false,
        animations: false,
      };
      applyThemeToDOM(theme);

      expect(mockSetProperty).toHaveBeenCalledWith('--border-radius', '1rem');
      expect(mockSetProperty).toHaveBeenCalledWith('--shadows-enabled', '0');
      expect(mockSetProperty).toHaveBeenCalledWith('--animations-enabled', '0');
      expect(mockSetProperty).toHaveBeenCalledWith('--transition-duration', '0s');
    });
  });

  describe('getSystemThemePreference', () => {
    it('should return dark for dark system preference', () => {
      const preference = getSystemThemePreference();
      expect(preference).toBe('dark'); // Based on our mock
    });
  });

  describe('exportTheme and importTheme', () => {
    it('should export and import theme correctly', () => {
      const originalTheme = defaultThemePresets[0].theme;
      const exported = exportTheme(originalTheme);
      const imported = importTheme(exported);

      expect(imported).toEqual(originalTheme);
    });

    it('should return null for invalid JSON', () => {
      const result = importTheme('invalid json');
      expect(result).toBeNull();
    });

    it('should return null for invalid theme structure', () => {
      const invalidThemeJson = JSON.stringify({ invalid: 'theme' });
      const result = importTheme(invalidThemeJson);
      expect(result).toBeNull();
    });
  });

  describe('defaultThemePresets', () => {
    it('should have valid theme presets', () => {
      defaultThemePresets.forEach(preset => {
        expect(validateTheme(preset.theme)).toBe(true);
        expect(preset.id).toBeTruthy();
        expect(preset.name).toBeTruthy();
        expect(preset.description).toBeTruthy();
        expect(['light', 'dark', 'colorful', 'minimal']).toContain(preset.category);
      });
    });

    it('should have unique preset IDs', () => {
      const ids = defaultThemePresets.map(preset => preset.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
