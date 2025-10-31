import { describe, it, expect } from 'vitest';
import { hexToRgb } from '../services/themeUtils';

describe('Color Conversion Functionality', () => {
  // All HEX colors used in the 6 new themes from the design document
  const themeHexColors = {
    // Noite Urbana
    '#1E88E5': '30 136 229',   // Original primary (adjusted in implementation)
    '#FFC107': '255 193 7',    // Original accent (adjusted in implementation)
    '#121212': '18 18 18',     // Background
    '#1E1E1E': '30 30 30',     // Surface
    '#FFFFFF': '255 255 255',  // Text
    '#B0B0B0': '176 176 176',  // Secondary text

    // Verde Noturno
    '#43A047': '67 160 71',    // Original primary (adjusted in implementation)
    '#FDD835': '253 216 53',   // Original accent (adjusted in implementation)
    '#0D0D0D': '13 13 13',     // Background
    '#1B1F1D': '27 31 29',     // Surface
    '#F1F1F1': '241 241 241',  // Text
    '#A8A8A8': '168 168 168',  // Secondary text

    // Roxo Nebuloso
    '#8E24AA': '142 36 170',   // Original primary (adjusted in implementation)
    '#FF4081': '255 64 129',   // Original accent (adjusted in implementation)
    '#101014': '16 16 20',     // Background
    '#1A1A23': '26 26 35',     // Surface
    '#E0E0E0': '224 224 224',  // Text
    '#9C9C9C': '156 156 156',  // Secondary text

    // Solar Clean
    '#1976D2': '25 118 210',   // Primary
    '#F4511E': '244 81 30',    // Original accent (adjusted in implementation)
    '#F5F5F5': '245 245 245',  // Surface
    '#212121': '33 33 33',     // Text
    '#616161': '97 97 97',     // Secondary text

    // Verão Pastel
    '#EC407A': '236 64 122',   // Original primary (adjusted in implementation)
    '#7E57C2': '126 87 194',   // Accent
    '#FFF8F0': '255 248 240',  // Background
    '#757575': '117 117 117',  // Original secondary text (adjusted in implementation)

    // Minimal Ice
    '#00ACC1': '0 172 193',    // Original primary (adjusted in implementation)
    '#FF7043': '255 112 67',   // Original accent (adjusted in implementation)
    '#F0F4F8': '240 244 248',  // Background
    '#1C1C1C': '28 28 28',     // Text
    '#5E5E5E': '94 94 94',     // Secondary text
  };

  describe('Theme Color Conversion', () => {
    it('should convert all theme HEX colors to correct RGB format', () => {
      Object.entries(themeHexColors).forEach(([hex, expectedRgb]) => {
        const result = hexToRgb(hex);
        expect(result).toBe(expectedRgb);
      });
    });

    it('should handle theme colors without # prefix', () => {
      Object.entries(themeHexColors).forEach(([hex, expectedRgb]) => {
        const hexWithoutHash = hex.substring(1);
        const result = hexToRgb(hexWithoutHash);
        expect(result).toBe(expectedRgb);
      });
    });

    it('should handle theme colors in lowercase', () => {
      Object.entries(themeHexColors).forEach(([hex, expectedRgb]) => {
        const result = hexToRgb(hex.toLowerCase());
        expect(result).toBe(expectedRgb);
      });
    });

    it('should handle theme colors in mixed case', () => {
      const mixedCaseColors = {
        '#1e88E5': '30 136 229',
        '#FfC107': '255 193 7',
        '#43a047': '67 160 71',
        '#8E24aa': '142 36 170',
        '#1976d2': '25 118 210',
        '#EC407a': '236 64 122',
      };

      Object.entries(mixedCaseColors).forEach(([hex, expectedRgb]) => {
        const result = hexToRgb(hex);
        expect(result).toBe(expectedRgb);
      });
    });
  });

  describe('RGB Output Format Validation', () => {
    it('should return RGB values in "R G B" string format', () => {
      const testColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF', '#000000'];

      testColors.forEach(color => {
        const result = hexToRgb(color);
        expect(typeof result).toBe('string');
        expect(result).toMatch(/^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/);
      });
    });

    it('should return RGB values in valid range (0-255)', () => {
      Object.values(themeHexColors).forEach(expectedRgb => {
        const [r, g, b] = expectedRgb.split(' ').map(Number);

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

    it('should use single space as separator between RGB values', () => {
      const testColors = ['#FF0000', '#00FF00', '#0000FF'];

      testColors.forEach(color => {
        const result = hexToRgb(color);
        const parts = result.split(' ');
        expect(parts).toHaveLength(3);

        // Ensure no extra spaces
        expect(result).not.toContain('  '); // No double spaces
        expect(result).not.toMatch(/^\s/);  // No leading space
        expect(result).not.toMatch(/\s$/);  // No trailing space
      });
    });

    it('should return consistent format for edge cases', () => {
      const edgeCases = {
        '#000000': '0 0 0',       // All zeros
        '#FFFFFF': '255 255 255', // All max values
        '#808080': '128 128 128', // Mid values
        '#010101': '1 1 1',       // Low values
        '#FEFEFE': '254 254 254', // High values
      };

      Object.entries(edgeCases).forEach(([hex, expectedRgb]) => {
        const result = hexToRgb(hex);
        expect(result).toBe(expectedRgb);
      });
    });
  });

  describe('3-Digit HEX Conversion', () => {
    it('should convert 3-digit HEX colors correctly', () => {
      const shortHexColors = {
        '#F00': '255 0 0',     // Red
        '#0F0': '0 255 0',     // Green
        '#00F': '0 0 255',     // Blue
        '#FFF': '255 255 255', // White
        '#000': '0 0 0',       // Black
        '#ABC': '170 187 204', // Gray-blue
        '#123': '17 34 51',    // Dark blue-gray
        '#DEF': '221 238 255', // Light blue
      };

      Object.entries(shortHexColors).forEach(([hex, expectedRgb]) => {
        const result = hexToRgb(hex);
        expect(result).toBe(expectedRgb);
      });
    });

    it('should handle 3-digit HEX without # prefix', () => {
      const shortHexColors = {
        'F00': '255 0 0',
        '0F0': '0 255 0',
        '00F': '0 0 255',
        'ABC': '170 187 204',
      };

      Object.entries(shortHexColors).forEach(([hex, expectedRgb]) => {
        const result = hexToRgb(hex);
        expect(result).toBe(expectedRgb);
      });
    });

    it('should produce same result for equivalent 3-digit and 6-digit HEX', () => {
      const equivalentPairs = [
        ['#F00', '#FF0000'],
        ['#0F0', '#00FF00'],
        ['#00F', '#0000FF'],
        ['#FFF', '#FFFFFF'],
        ['#000', '#000000'],
        ['#ABC', '#AABBCC'],
      ];

      equivalentPairs.forEach(([shortHex, longHex]) => {
        const shortResult = hexToRgb(shortHex);
        const longResult = hexToRgb(longHex);
        expect(shortResult).toBe(longResult);
      });
    });
  });

  describe('Error Handling for Invalid Inputs', () => {
    it('should throw error for invalid HEX format', () => {
      const invalidInputs = [
        '#GG0000',    // Invalid characters
        '#12345',     // Wrong length (5 chars)
        '#1234567',   // Wrong length (7 chars)
        'invalid',    // Not hex at all
        '',           // Empty string
        '#',          // Just hash
        '#12',        // Too short
        '#GGGGGG',    // All invalid chars
        '#12345G',    // Mix of valid/invalid
        'ZZZZZZ',     // Invalid without hash
      ];

      invalidInputs.forEach(invalidInput => {
        expect(() => hexToRgb(invalidInput)).toThrow('Invalid hex color format');
      });
    });

    it('should throw descriptive error messages', () => {
      expect(() => hexToRgb('#GG0000')).toThrow('Invalid hex color format: #GG0000. Expected format: #RRGGBB or #RGB');
      expect(() => hexToRgb('#12345')).toThrow('Invalid hex color format: #12345. Expected format: #RRGGBB or #RGB');
      expect(() => hexToRgb('invalid')).toThrow('Invalid hex color format: invalid. Expected format: #RRGGBB or #RGB');
    });

    it('should handle null and undefined inputs', () => {
      expect(() => hexToRgb(null as any)).toThrow();
      expect(() => hexToRgb(undefined as any)).toThrow();
    });

    it('should handle non-string inputs', () => {
      expect(() => hexToRgb(123 as any)).toThrow();
      expect(() => hexToRgb({} as any)).toThrow();
      expect(() => hexToRgb([] as any)).toThrow();
    });
  });

  describe('Boundary Value Testing', () => {
    it('should handle minimum RGB values correctly', () => {
      expect(hexToRgb('#000000')).toBe('0 0 0');
      expect(hexToRgb('#000001')).toBe('0 0 1');
      expect(hexToRgb('#000100')).toBe('0 1 0');
      expect(hexToRgb('#010000')).toBe('1 0 0');
    });

    it('should handle maximum RGB values correctly', () => {
      expect(hexToRgb('#FFFFFF')).toBe('255 255 255');
      expect(hexToRgb('#FFFFFE')).toBe('255 255 254');
      expect(hexToRgb('#FFFE00')).toBe('255 254 0');
      expect(hexToRgb('#FE0000')).toBe('254 0 0');
    });

    it('should handle mid-range RGB values correctly', () => {
      expect(hexToRgb('#808080')).toBe('128 128 128');
      expect(hexToRgb('#7F7F7F')).toBe('127 127 127');
      expect(hexToRgb('#818181')).toBe('129 129 129');
    });
  });

  describe('Performance and Consistency', () => {
    it('should return consistent results for repeated calls', () => {
      const testColor = '#1E88E5';
      const expectedResult = '30 136 229';

      // Call multiple times and ensure consistency
      for (let i = 0; i < 10; i++) {
        expect(hexToRgb(testColor)).toBe(expectedResult);
      }
    });

    it('should handle large batch of conversions', () => {
      const colors = Object.keys(themeHexColors);

      // Convert all theme colors multiple times
      for (let i = 0; i < 5; i++) {
        colors.forEach(hex => {
          const result = hexToRgb(hex);
          expect(result).toBe(themeHexColors[hex as keyof typeof themeHexColors]);
        });
      }
    });

    it('should not modify input string', () => {
      const originalHex = '#1E88E5';
      const hexCopy = originalHex;

      hexToRgb(originalHex);

      expect(originalHex).toBe(hexCopy);
    });
  });

  describe('Real-world Theme Integration', () => {
    it('should convert all colors used in theme definitions', () => {
      // These are the actual HEX colors that get converted in themeUtils.ts
      const actualThemeColors = [
        '#1E1E1E', '#121212', '#FFFFFF', '#B0B0B0',  // Noite Urbana
        '#1B1F1D', '#0D0D0D', '#F1F1F1', '#A8A8A8',  // Verde Noturno
        '#1A1A23', '#101014', '#E0E0E0', '#9C9C9C',  // Roxo Nebuloso
        '#1976D2', '#F5F5F5', '#212121', '#616161',  // Solar Clean
        '#FFFFFF', '#7E57C2', '#FFF8F0',             // Verão Pastel
        '#F0F4F8', '#1C1C1C', '#5E5E5E',             // Minimal Ice
      ];

      actualThemeColors.forEach(hex => {
        expect(() => hexToRgb(hex)).not.toThrow();
        const result = hexToRgb(hex);
        expect(result).toMatch(/^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/);
      });
    });

    it('should produce RGB values that can be used in CSS custom properties', () => {
      Object.entries(themeHexColors).forEach(([hex, expectedRgb]) => {
        const result = hexToRgb(hex);

        // Should be usable in CSS like: rgb(${result})
        const cssRgb = `rgb(${result})`;
        expect(cssRgb).toMatch(/^rgb\(\d{1,3}\s+\d{1,3}\s+\d{1,3}\)$/);

        // Should be usable in Tailwind CSS custom properties
        const tailwindVar = `--color-primary: ${result};`;
        expect(tailwindVar).toMatch(/^--color-primary: \d{1,3}\s+\d{1,3}\s+\d{1,3};$/);
      });
    });
  });
});
