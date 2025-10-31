import type { ExtendedTheme, ThemePreset, ThemeSettings } from '../types';

// Color conversion utilities
export const hexToRgb = (hex: string): string => {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Validate hex format (3 or 6 characters)
  if (!/^[a-fA-F0-9]{3}$|^[a-fA-F0-9]{6}$/.test(cleanHex)) {
    throw new Error(`Invalid hex color format: ${hex}. Expected format: #RRGGBB or #RGB`);
  }

  let r: number, g: number, b: number;

  if (cleanHex.length === 3) {
    // Convert 3-digit hex to 6-digit
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else {
    // 6-digit hex
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }

  // Validate RGB values are in valid range
  if (isNaN(r) || isNaN(g) || isNaN(b) || r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
    throw new Error(`Invalid hex color conversion result: ${hex} -> ${r} ${g} ${b}`);
  }

  return `${r} ${g} ${b}`;
};

// Default theme presets with WCAG AA compliant colors
export const defaultThemePresets: ThemePreset[] = [
  // Temas Escuros (3)
  {
    id: 'noite-urbana',
    name: 'Noite Urbana',
    description: 'Tema escuro urbano com azul médio e acentos âmbar',
    category: 'dark',
    theme: {
      id: 'noite-urbana',
      name: 'Noite Urbana',
      colors: {
        primary: '18 102 204', // Darkened from #1E88E5 for better contrast
        secondary: hexToRgb('#1E1E1E'), // Derived from surface
        accent: '138 101 8', // Lightened slightly for better contrast with background
        background: hexToRgb('#121212'), // #121212
        surface: hexToRgb('#1E1E1E'), // #1E1E1E
        text: hexToRgb('#FFFFFF'), // #FFFFFF
        textSecondary: hexToRgb('#B0B0B0'), // #B0B0B0
        border: '75 85 99', // Standard border
        success: '16 185 129', // Standard success
        warning: '245 158 11', // Standard warning
        error: '239 68 68', // Standard error
      },
      layout: 'comfortable',
      density: 'medium',
      borderRadius: 'medium',
      shadows: true,
      animations: true,
    },
  },
  {
    id: 'verde-noturno',
    name: 'Verde Noturno',
    description: 'Tema escuro com verde natural e acentos solares',
    category: 'dark',
    theme: {
      id: 'verde-noturno',
      name: 'Verde Noturno',
      colors: {
        primary: '52 125 54', // Further lightened for better contrast with surface
        secondary: hexToRgb('#1B1F1D'), // Derived from surface
        accent: '122 105 17', // Further darkened from #FDD835 for white text contrast
        background: hexToRgb('#0D0D0D'), // #0D0D0D
        surface: hexToRgb('#1B1F1D'), // #1B1F1D
        text: hexToRgb('#F1F1F1'), // #F1F1F1
        textSecondary: hexToRgb('#A8A8A8'), // #A8A8A8
        border: '75 85 99', // Standard border
        success: '16 185 129', // Standard success
        warning: '245 158 11', // Standard warning
        error: '239 68 68', // Standard error
      },
      layout: 'comfortable',
      density: 'medium',
      borderRadius: 'medium',
      shadows: true,
      animations: true,
    },
  },
  {
    id: 'roxo-nebuloso',
    name: 'Roxo Nebuloso',
    description: 'Tema escuro místico com roxo vibrante e rosa neon',
    category: 'dark',
    theme: {
      id: 'roxo-nebuloso',
      name: 'Roxo Nebuloso',
      colors: {
        primary: '173 46 207', // Final adjustment for better contrast with surface
        secondary: hexToRgb('#1A1A23'), // Derived from surface
        accent: '204 51 102', // Darkened from #FF4081 for better contrast
        background: hexToRgb('#101014'), // #101014
        surface: hexToRgb('#1A1A23'), // #1A1A23
        text: hexToRgb('#E0E0E0'), // #E0E0E0
        textSecondary: hexToRgb('#9C9C9C'), // #9C9C9C
        border: '75 85 99', // Standard border
        success: '16 185 129', // Standard success
        warning: '245 158 11', // Standard warning
        error: '239 68 68', // Standard error
      },
      layout: 'comfortable',
      density: 'medium',
      borderRadius: 'medium',
      shadows: true,
      animations: true,
    },
  },

  // Temas Claros (3)
  {
    id: 'solar-clean',
    name: 'Solar Clean',
    description: 'Tema claro limpo com azul clássico e laranja queimado',
    category: 'light',
    theme: {
      id: 'solar-clean',
      name: 'Solar Clean',
      colors: {
        primary: hexToRgb('#1976D2'), // #1976D2
        secondary: hexToRgb('#F5F5F5'), // Derived from surface
        accent: '184 61 23', // Darkened from #F4511E for white text contrast
        background: hexToRgb('#FFFFFF'), // #FFFFFF
        surface: hexToRgb('#F5F5F5'), // #F5F5F5
        text: hexToRgb('#212121'), // #212121
        textSecondary: hexToRgb('#616161'), // #616161
        border: '156 163 175', // Darker border for better contrast
        success: '16 185 129', // Standard success
        warning: '245 158 11', // Standard warning
        error: '239 68 68', // Standard error
      },
      layout: 'comfortable',
      density: 'medium',
      borderRadius: 'medium',
      shadows: true,
      animations: true,
    },
  },
  {
    id: 'verao-pastel',
    name: 'Verão Pastel',
    description: 'Tema claro pastel com rosa vibrante e lilás suave',
    category: 'light',
    theme: {
      id: 'verao-pastel',
      name: 'Verão Pastel',
      colors: {
        primary: '178 48 92', // Darkened from #EC407A for white text contrast
        secondary: hexToRgb('#FFFFFF'), // Derived from surface
        accent: hexToRgb('#7E57C2'), // #7E57C2
        background: hexToRgb('#FFF8F0'), // #FFF8F0
        surface: hexToRgb('#FFFFFF'), // #FFFFFF
        text: hexToRgb('#212121'), // #212121
        textSecondary: '97 97 97', // Darkened from #757575 for better contrast
        border: '156 163 175', // Darker border for better contrast
        success: '16 185 129', // Standard success
        warning: '245 158 11', // Standard warning
        error: '239 68 68', // Standard error
      },
      layout: 'comfortable',
      density: 'medium',
      borderRadius: 'medium',
      shadows: true,
      animations: true,
    },
  },
  {
    id: 'minimal-ice',
    name: 'Minimal Ice',
    description: 'Tema claro minimalista com ciano frio e coral quente',
    category: 'light',
    theme: {
      id: 'minimal-ice',
      name: 'Minimal Ice',
      colors: {
        primary: '0 129 145', // Darkened from #00ACC1 for better contrast
        secondary: hexToRgb('#FFFFFF'), // Derived from surface
        accent: '184 81 49', // Darkened from #FF7043 for better contrast
        background: hexToRgb('#F0F4F8'), // #F0F4F8
        surface: hexToRgb('#FFFFFF'), // #FFFFFF
        text: hexToRgb('#1C1C1C'), // #1C1C1C
        textSecondary: hexToRgb('#5E5E5E'), // #5E5E5E
        border: '156 163 175', // Darker border for better contrast
        success: '16 185 129', // Standard success
        warning: '245 158 11', // Standard warning
        error: '239 68 68', // Standard error
      },
      layout: 'comfortable',
      density: 'medium',
      borderRadius: 'medium',
      shadows: true,
      animations: true,
    },
  },
];

// Default theme settings
export const defaultThemeSettings: ThemeSettings = {
  currentTheme: defaultThemePresets.find(preset => preset.id === 'solar-clean')?.theme || defaultThemePresets[0].theme,
  customThemes: [],
  autoDetectSystemTheme: true,
  systemThemeOverride: null,
  themeTransitions: true,
};

// Theme validation utilities
export const validateTheme = (theme: Partial<ExtendedTheme>): boolean => {
  const requiredFields = ['id', 'name', 'colors', 'layout', 'density', 'borderRadius'];
  const requiredColors = [
    'primary', 'secondary', 'accent', 'background', 'surface',
    'text', 'textSecondary', 'border', 'success', 'warning', 'error'
  ];

  // Check required fields
  for (const field of requiredFields) {
    if (!(field in theme)) {
      console.warn(`Theme validation failed: missing field "${field}"`);
      return false;
    }
  }

  // Check required colors
  if (theme.colors) {
    for (const color of requiredColors) {
      if (!(color in theme.colors)) {
        console.warn(`Theme validation failed: missing color "${color}"`);
        return false;
      }
    }
  }

  // Validate RGB color format
  if (theme.colors) {
    for (const [colorName, colorValue] of Object.entries(theme.colors)) {
      if (!isValidRGBString(colorValue)) {
        console.warn(`Theme validation failed: invalid RGB format for color "${colorName}": "${colorValue}"`);
        return false;
      }
    }
  }

  return true;
};

// Check if a string is a valid RGB format (e.g., "255 255 255")
const isValidRGBString = (rgb: string): boolean => {
  const rgbPattern = /^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/;
  if (!rgbPattern.test(rgb)) return false;

  const values = rgb.split(/\s+/).map(Number);
  return values.every(val => val >= 0 && val <= 255);
};

// WCAG Contrast Ratio Utilities
export const calculateLuminance = (rgb: string): number => {
  const [r, g, b] = rgb.split(/\s+/).map(Number);

  const sRGB = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
};

export const calculateContrastRatio = (color1: string, color2: string): number => {
  const lum1 = calculateLuminance(color1);
  const lum2 = calculateLuminance(color2);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
};

export const meetsWCAGAA = (foreground: string, background: string): boolean => {
  return calculateContrastRatio(foreground, background) >= 4.5;
};

export const meetsWCAGAAA = (foreground: string, background: string): boolean => {
  return calculateContrastRatio(foreground, background) >= 7;
};

// Enhanced theme accessibility validation for WCAG AA compliance
export const validateThemeAccessibility = (theme: ExtendedTheme): {
  isAccessible: boolean;
  issues: string[];
  suggestions: string[];
  contrastRatios: Record<string, number>;
} => {
  const issues: string[] = [];
  const suggestions: string[] = [];
  const contrastRatios: Record<string, number> = {};

  // WCAG AA requirements: 4.5:1 for normal text, 3:1 for large text and interactive elements
  const WCAG_AA_NORMAL = 4.5;
  const WCAG_AA_LARGE = 3.0;

  // Check text on background contrast (normal text requirement)
  const textBgRatio = calculateContrastRatio(theme.colors.text, theme.colors.background);
  contrastRatios.textOnBackground = textBgRatio;
  if (textBgRatio < WCAG_AA_NORMAL) {
    issues.push(`Texto principal no fundo não atende WCAG AA (${textBgRatio.toFixed(2)}:1, mínimo: ${WCAG_AA_NORMAL}:1)`);
    suggestions.push('Escureça o texto ou clareie o fundo para melhor contraste');
  }

  // Check secondary text on background contrast
  const secondaryTextBgRatio = calculateContrastRatio(theme.colors.textSecondary, theme.colors.background);
  contrastRatios.secondaryTextOnBackground = secondaryTextBgRatio;
  if (secondaryTextBgRatio < WCAG_AA_NORMAL) {
    issues.push(`Texto secundário no fundo não atende WCAG AA (${secondaryTextBgRatio.toFixed(2)}:1, mínimo: ${WCAG_AA_NORMAL}:1)`);
    suggestions.push('Escureça o texto secundário para melhor legibilidade');
  }

  // Check text on surface contrast
  const textSurfaceRatio = calculateContrastRatio(theme.colors.text, theme.colors.surface);
  contrastRatios.textOnSurface = textSurfaceRatio;
  if (textSurfaceRatio < WCAG_AA_NORMAL) {
    issues.push(`Texto em superfícies não atende WCAG AA (${textSurfaceRatio.toFixed(2)}:1, mínimo: ${WCAG_AA_NORMAL}:1)`);
    suggestions.push('Ajuste o contraste entre texto e superfícies');
  }

  // Check secondary text on surface contrast
  const secondaryTextSurfaceRatio = calculateContrastRatio(theme.colors.textSecondary, theme.colors.surface);
  contrastRatios.secondaryTextOnSurface = secondaryTextSurfaceRatio;
  if (secondaryTextSurfaceRatio < WCAG_AA_NORMAL) {
    issues.push(`Texto secundário em superfícies não atende WCAG AA (${secondaryTextSurfaceRatio.toFixed(2)}:1, mínimo: ${WCAG_AA_NORMAL}:1)`);
    suggestions.push('Ajuste o contraste entre texto secundário e superfícies');
  }

  // Check primary color accessibility (interactive elements)
  const primaryBgRatio = calculateContrastRatio(theme.colors.primary, theme.colors.background);
  contrastRatios.primaryOnBackground = primaryBgRatio;
  if (primaryBgRatio < WCAG_AA_LARGE) {
    issues.push(`Cor primária tem baixo contraste com o fundo (${primaryBgRatio.toFixed(2)}:1, mínimo: ${WCAG_AA_LARGE}:1)`);
    suggestions.push('Ajuste a cor primária para melhor visibilidade');
  }

  // Check accent color accessibility (interactive elements)
  const accentBgRatio = calculateContrastRatio(theme.colors.accent, theme.colors.background);
  contrastRatios.accentOnBackground = accentBgRatio;
  if (accentBgRatio < WCAG_AA_LARGE) {
    issues.push(`Cor de destaque tem baixo contraste com o fundo (${accentBgRatio.toFixed(2)}:1, mínimo: ${WCAG_AA_LARGE}:1)`);
    suggestions.push('Ajuste a cor de destaque para melhor visibilidade');
  }

  // Check primary color on surface (for buttons on cards)
  const primarySurfaceRatio = calculateContrastRatio(theme.colors.primary, theme.colors.surface);
  contrastRatios.primaryOnSurface = primarySurfaceRatio;
  if (primarySurfaceRatio < WCAG_AA_LARGE) {
    issues.push(`Cor primária em superfícies tem baixo contraste (${primarySurfaceRatio.toFixed(2)}:1, mínimo: ${WCAG_AA_LARGE}:1)`);
    suggestions.push('Ajuste o contraste entre cor primária e superfícies');
  }

  // Check accent color on surface
  const accentSurfaceRatio = calculateContrastRatio(theme.colors.accent, theme.colors.surface);
  contrastRatios.accentOnSurface = accentSurfaceRatio;
  if (accentSurfaceRatio < WCAG_AA_LARGE) {
    issues.push(`Cor de destaque em superfícies tem baixo contraste (${accentSurfaceRatio.toFixed(2)}:1, mínimo: ${WCAG_AA_LARGE}:1)`);
    suggestions.push('Ajuste o contraste entre cor de destaque e superfícies');
  }

  // Check if white text would work on primary/accent (for button text)
  const whiteOnPrimary = calculateContrastRatio('255 255 255', theme.colors.primary);
  contrastRatios.whiteOnPrimary = whiteOnPrimary;
  if (whiteOnPrimary < WCAG_AA_NORMAL) {
    issues.push(`Texto branco em botões primários não atende WCAG AA (${whiteOnPrimary.toFixed(2)}:1, mínimo: ${WCAG_AA_NORMAL}:1)`);
    suggestions.push('Escureça a cor primária ou use texto escuro em botões');
  }

  const whiteOnAccent = calculateContrastRatio('255 255 255', theme.colors.accent);
  contrastRatios.whiteOnAccent = whiteOnAccent;
  if (whiteOnAccent < WCAG_AA_NORMAL) {
    issues.push(`Texto branco em botões de destaque não atende WCAG AA (${whiteOnAccent.toFixed(2)}:1, mínimo: ${WCAG_AA_NORMAL}:1)`);
    suggestions.push('Escureça a cor de destaque ou use texto escuro em botões');
  }

  return {
    isAccessible: issues.length === 0,
    issues,
    suggestions,
    contrastRatios
  };
};

// Validate all theme presets for accessibility compliance
export const validateAllThemesAccessibility = (): {
  results: Record<string, ReturnType<typeof validateThemeAccessibility>>;
  summary: {
    totalThemes: number;
    accessibleThemes: number;
    failedThemes: string[];
    totalIssues: number;
  };
} => {
  const results: Record<string, ReturnType<typeof validateThemeAccessibility>> = {};
  const failedThemes: string[] = [];
  let totalIssues = 0;

  // Validate each theme preset
  defaultThemePresets.forEach(preset => {
    const validation = validateThemeAccessibility(preset.theme);
    results[preset.id] = validation;

    if (!validation.isAccessible) {
      failedThemes.push(preset.id);
      totalIssues += validation.issues.length;
    }
  });

  return {
    results,
    summary: {
      totalThemes: defaultThemePresets.length,
      accessibleThemes: defaultThemePresets.length - failedThemes.length,
      failedThemes,
      totalIssues
    }
  };
};

// Theme migration utilities
export const migrateTheme = (oldTheme: any, _version: string = '1.0'): ExtendedTheme | null => {
  try {
    // Handle migration from old theme format
    if (typeof oldTheme === 'string') {
      // Old format was just RGB string
      return createThemeFromAccentColor(oldTheme, 'Migrated Theme');
    }

    // If it's already in new format, validate and return
    if (validateTheme(oldTheme)) {
      return oldTheme as ExtendedTheme;
    }

    // Try to extract accent color and create new theme
    if (oldTheme.colors?.accent || oldTheme.accent) {
      const accentColor = oldTheme.colors?.accent || oldTheme.accent;
      return createThemeFromAccentColor(accentColor, oldTheme.name || 'Migrated Theme');
    }

    return null;
  } catch (error) {
    console.error('Theme migration failed:', error);
    return null;
  }
};

// Create a theme from a single accent color
export const createThemeFromAccentColor = (accentColor: string, name: string): ExtendedTheme => {
  // Parse RGB values
  const rgbValues = accentColor.split(/\s+/).map(Number);
  const [r, g, b] = rgbValues;

  // Generate complementary colors based on accent
  const isDark = (r * 0.299 + g * 0.587 + b * 0.114) < 128;

  return {
    id: `custom-${Date.now()}`,
    name,
    colors: {
      primary: accentColor,
      secondary: isDark ? '45 55 72' : '229 231 235',
      accent: accentColor,
      background: isDark ? '26 32 44' : '255 255 255',
      surface: isDark ? '45 55 72' : '249 250 251',
      text: isDark ? '247 250 252' : '17 24 39',
      textSecondary: isDark ? '160 174 192' : '107 114 128',
      border: isDark ? '75 85 99' : '209 213 219',
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
};

// Apply theme to CSS custom properties
export const applyThemeToDOM = (theme: ExtendedTheme): void => {
  const root = document.documentElement;

  // Apply color variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });

  // Apply layout variables
  const layoutSpacing = {
    compact: { padding: '0.5rem', gap: '0.5rem' },
    comfortable: { padding: '1rem', gap: '1rem' },
    spacious: { padding: '1.5rem', gap: '1.5rem' },
  };

  const spacing = layoutSpacing[theme.layout];
  root.style.setProperty('--layout-padding', spacing.padding);
  root.style.setProperty('--layout-gap', spacing.gap);

  // Apply density variables
  const densityValues = {
    low: { fontSize: '0.875rem', lineHeight: '1.25rem' },
    medium: { fontSize: '1rem', lineHeight: '1.5rem' },
    high: { fontSize: '1.125rem', lineHeight: '1.75rem' },
  };

  const density = densityValues[theme.density];
  root.style.setProperty('--density-font-size', density.fontSize);
  root.style.setProperty('--density-line-height', density.lineHeight);

  // Apply border radius
  const borderRadiusValues = {
    none: '0',
    small: '0.25rem',
    medium: '0.5rem',
    large: '1rem',
  };

  root.style.setProperty('--border-radius', borderRadiusValues[theme.borderRadius]);

  // Apply shadow and animation preferences
  root.style.setProperty('--shadows-enabled', theme.shadows ? '1' : '0');
  root.style.setProperty('--animations-enabled', theme.animations ? '1' : '0');

  // Set transition duration based on animation preference
  root.style.setProperty('--transition-duration', theme.animations ? '0.2s' : '0s');
};

// Get system theme preference
export const getSystemThemePreference = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark'; // Default fallback
};

// Find best matching preset for system preference
export const getSystemMatchingTheme = (preference: 'light' | 'dark'): ExtendedTheme => {
  const matchingPresets = defaultThemePresets.filter(preset =>
    preset.category === preference ||
    (preference === 'dark' && preset.category === 'colorful')
  );

  return matchingPresets.length > 0
    ? matchingPresets[0].theme
    : defaultThemePresets[0].theme;
};

// Enhanced auto-fix accessibility issues for comprehensive WCAG AA compliance
export const autoFixThemeAccessibility = (theme: ExtendedTheme): ExtendedTheme => {
  const fixedTheme = { ...theme, colors: { ...theme.colors } };
  const WCAG_AA_NORMAL = 4.5;
  const WCAG_AA_LARGE = 3.0;

  // Helper function to adjust color brightness
  const adjustColorBrightness = (rgb: string, factor: number): string => {
    const [r, g, b] = rgb.split(' ').map(Number);
    if (factor > 1) {
      // Lighten
      return `${Math.min(255, Math.round(r + (255 - r) * (factor - 1)))} ${Math.min(255, Math.round(g + (255 - g) * (factor - 1)))} ${Math.min(255, Math.round(b + (255 - b) * (factor - 1)))}`;
    } else {
      // Darken
      return `${Math.round(r * factor)} ${Math.round(g * factor)} ${Math.round(b * factor)}`;
    }
  };

  // Helper function to find optimal contrast color
  const findOptimalTextColor = (background: string, targetRatio: number = WCAG_AA_NORMAL): string => {
    const bgLuminance = calculateLuminance(background);

    // Try white first
    if (calculateContrastRatio('255 255 255', background) >= targetRatio) {
      return '255 255 255';
    }

    // Try black
    if (calculateContrastRatio('0 0 0', background) >= targetRatio) {
      return '0 0 0';
    }

    // If neither works, adjust based on background luminance
    if (bgLuminance > 0.5) {
      // Light background - use very dark text
      return '15 23 42';
    } else {
      // Dark background - use very light text
      return '248 250 252';
    }
  };

  // Fix text on background contrast
  const textBgRatio = calculateContrastRatio(fixedTheme.colors.text, fixedTheme.colors.background);
  if (textBgRatio < WCAG_AA_NORMAL) {
    fixedTheme.colors.text = findOptimalTextColor(fixedTheme.colors.background, WCAG_AA_NORMAL);
  }

  // Fix secondary text on background contrast
  const secondaryTextBgRatio = calculateContrastRatio(fixedTheme.colors.textSecondary, fixedTheme.colors.background);
  if (secondaryTextBgRatio < WCAG_AA_NORMAL) {
    const bgLuminance = calculateLuminance(fixedTheme.colors.background);
    if (bgLuminance > 0.5) {
      // Light background - use dark secondary text
      fixedTheme.colors.textSecondary = '51 65 85';
    } else {
      // Dark background - use light secondary text
      fixedTheme.colors.textSecondary = '156 163 175';
    }
  }

  // Fix text on surface contrast
  const textSurfaceRatio = calculateContrastRatio(fixedTheme.colors.text, fixedTheme.colors.surface);
  if (textSurfaceRatio < WCAG_AA_NORMAL) {
    // Adjust surface color to maintain text contrast
    const textLuminance = calculateLuminance(fixedTheme.colors.text);
    const surfaceLuminance = calculateLuminance(fixedTheme.colors.surface);

    if (textLuminance > surfaceLuminance) {
      // Text is lighter - darken surface
      fixedTheme.colors.surface = adjustColorBrightness(fixedTheme.colors.surface, 0.7);
    } else {
      // Text is darker - lighten surface
      fixedTheme.colors.surface = adjustColorBrightness(fixedTheme.colors.surface, 1.3);
    }
  }

  // Fix secondary text on surface contrast
  const secondaryTextSurfaceRatio = calculateContrastRatio(fixedTheme.colors.textSecondary, fixedTheme.colors.surface);
  if (secondaryTextSurfaceRatio < WCAG_AA_NORMAL) {
    const surfaceLuminance = calculateLuminance(fixedTheme.colors.surface);
    if (surfaceLuminance > 0.5) {
      // Light surface - darken secondary text
      fixedTheme.colors.textSecondary = '51 65 85';
    } else {
      // Dark surface - lighten secondary text
      fixedTheme.colors.textSecondary = '156 163 175';
    }
  }

  // Fix primary color contrast with background
  const primaryBgRatio = calculateContrastRatio(fixedTheme.colors.primary, fixedTheme.colors.background);
  if (primaryBgRatio < WCAG_AA_LARGE) {
    const bgLuminance = calculateLuminance(fixedTheme.colors.background);
    const primaryLuminance = calculateLuminance(fixedTheme.colors.primary);

    if (bgLuminance > 0.5) {
      // Light background - darken primary if needed
      if (primaryLuminance > 0.4) {
        fixedTheme.colors.primary = adjustColorBrightness(fixedTheme.colors.primary, 0.6);
      }
    } else {
      // Dark background - lighten primary if needed
      if (primaryLuminance < 0.3) {
        fixedTheme.colors.primary = adjustColorBrightness(fixedTheme.colors.primary, 1.6);
      }
    }
  }

  // Fix accent color contrast with background
  const accentBgRatio = calculateContrastRatio(fixedTheme.colors.accent, fixedTheme.colors.background);
  if (accentBgRatio < WCAG_AA_LARGE) {
    const bgLuminance = calculateLuminance(fixedTheme.colors.background);
    const accentLuminance = calculateLuminance(fixedTheme.colors.accent);

    if (bgLuminance > 0.5) {
      // Light background - darken accent if needed
      if (accentLuminance > 0.4) {
        fixedTheme.colors.accent = adjustColorBrightness(fixedTheme.colors.accent, 0.6);
      }
    } else {
      // Dark background - lighten accent if needed
      if (accentLuminance < 0.3) {
        fixedTheme.colors.accent = adjustColorBrightness(fixedTheme.colors.accent, 1.6);
      }
    }
  }

  // Fix primary color contrast with surface
  const primarySurfaceRatio = calculateContrastRatio(fixedTheme.colors.primary, fixedTheme.colors.surface);
  if (primarySurfaceRatio < WCAG_AA_LARGE) {
    const surfaceLuminance = calculateLuminance(fixedTheme.colors.surface);
    const primaryLuminance = calculateLuminance(fixedTheme.colors.primary);

    if (surfaceLuminance > 0.5) {
      // Light surface - darken primary if needed
      if (primaryLuminance > 0.4) {
        fixedTheme.colors.primary = adjustColorBrightness(fixedTheme.colors.primary, 0.7);
      }
    } else {
      // Dark surface - lighten primary if needed
      if (primaryLuminance < 0.3) {
        fixedTheme.colors.primary = adjustColorBrightness(fixedTheme.colors.primary, 1.5);
      }
    }
  }

  // Fix accent color contrast with surface
  const accentSurfaceRatio = calculateContrastRatio(fixedTheme.colors.accent, fixedTheme.colors.surface);
  if (accentSurfaceRatio < WCAG_AA_LARGE) {
    const surfaceLuminance = calculateLuminance(fixedTheme.colors.surface);
    const accentLuminance = calculateLuminance(fixedTheme.colors.accent);

    if (surfaceLuminance > 0.5) {
      // Light surface - darken accent if needed
      if (accentLuminance > 0.4) {
        fixedTheme.colors.accent = adjustColorBrightness(fixedTheme.colors.accent, 0.7);
      }
    } else {
      // Dark surface - lighten accent if needed
      if (accentLuminance < 0.3) {
        fixedTheme.colors.accent = adjustColorBrightness(fixedTheme.colors.accent, 1.5);
      }
    }
  }

  // Ensure white text works on primary/accent colors (for buttons)
  const whiteOnPrimary = calculateContrastRatio('255 255 255', fixedTheme.colors.primary);
  if (whiteOnPrimary < WCAG_AA_NORMAL) {
    // Darken primary to ensure white text is readable
    fixedTheme.colors.primary = adjustColorBrightness(fixedTheme.colors.primary, 0.5);
  }

  const whiteOnAccent = calculateContrastRatio('255 255 255', fixedTheme.colors.accent);
  if (whiteOnAccent < WCAG_AA_NORMAL) {
    // Darken accent to ensure white text is readable
    fixedTheme.colors.accent = adjustColorBrightness(fixedTheme.colors.accent, 0.5);
  }

  return fixedTheme;
};

// Generate theme variations
export const generateThemeVariations = (baseTheme: ExtendedTheme): ExtendedTheme[] => {
  const variations: ExtendedTheme[] = [];

  // High contrast variation
  const highContrast: ExtendedTheme = {
    ...baseTheme,
    id: `${baseTheme.id}-high-contrast`,
    name: `${baseTheme.name} (High Contrast)`,
    colors: {
      ...baseTheme.colors,
      text: calculateLuminance(baseTheme.colors.background) > 0.5 ? '0 0 0' : '255 255 255',
      textSecondary: calculateLuminance(baseTheme.colors.background) > 0.5 ? '31 41 55' : '203 213 225',
      border: calculateLuminance(baseTheme.colors.background) > 0.5 ? '107 114 128' : '156 163 175',
    }
  };
  variations.push(highContrast);

  // Soft variation (reduced contrast for comfort)
  const soft: ExtendedTheme = {
    ...baseTheme,
    id: `${baseTheme.id}-soft`,
    name: `${baseTheme.name} (Soft)`,
    colors: {
      ...baseTheme.colors,
      textSecondary: calculateLuminance(baseTheme.colors.background) > 0.5 ? '100 116 139' : '148 163 184',
    }
  };
  variations.push(soft);

  return variations;
};

// Color blindness simulation
export const simulateColorBlindness = (theme: ExtendedTheme, type: 'protanopia' | 'deuteranopia' | 'tritanopia'): ExtendedTheme => {
  const simulateColor = (rgb: string): string => {
    const [r, g, b] = rgb.split(' ').map(Number);

    let newR = r, newG = g, newB = b;

    switch (type) {
      case 'protanopia': // Red-blind
        newR = 0.567 * r + 0.433 * g;
        newG = 0.558 * r + 0.442 * g;
        newB = 0.242 * g + 0.758 * b;
        break;
      case 'deuteranopia': // Green-blind
        newR = 0.625 * r + 0.375 * g;
        newG = 0.7 * r + 0.3 * g;
        newB = 0.3 * g + 0.7 * b;
        break;
      case 'tritanopia': // Blue-blind
        newR = 0.95 * r + 0.05 * g;
        newG = 0.433 * g + 0.567 * b;
        newB = 0.475 * g + 0.525 * b;
        break;
    }

    return `${Math.round(Math.max(0, Math.min(255, newR)))} ${Math.round(Math.max(0, Math.min(255, newG)))} ${Math.round(Math.max(0, Math.min(255, newB)))}`;
  };

  return {
    ...theme,
    id: `${theme.id}-${type}`,
    name: `${theme.name} (${type})`,
    colors: {
      primary: simulateColor(theme.colors.primary),
      secondary: simulateColor(theme.colors.secondary),
      accent: simulateColor(theme.colors.accent),
      background: simulateColor(theme.colors.background),
      surface: simulateColor(theme.colors.surface),
      text: simulateColor(theme.colors.text),
      textSecondary: simulateColor(theme.colors.textSecondary),
      border: simulateColor(theme.colors.border),
      success: simulateColor(theme.colors.success),
      warning: simulateColor(theme.colors.warning),
      error: simulateColor(theme.colors.error),
    }
  };
};

// Export/Import utilities
export const exportTheme = (theme: ExtendedTheme): string => {
  return JSON.stringify(theme, null, 2);
};

export const importTheme = (themeJson: string): ExtendedTheme | null => {
  try {
    const theme = JSON.parse(themeJson);
    if (validateTheme(theme)) {
      return theme as ExtendedTheme;
    }
    return null;
  } catch (error) {
    console.error('Failed to import theme:', error);
    return null;
  }
};
