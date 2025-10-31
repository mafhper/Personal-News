
export interface FeedSource {
  url: string;
  categoryId?: string;
  customTitle?: string;
}

export interface FeedCategory {
  id: string;
  name: string;
  color: string;
  description?: string;
  order: number;
  isDefault?: boolean;
}



export interface Article {
  title: string;
  link: string;
  pubDate: Date;
  sourceTitle: string;
  imageUrl?: string;
  description?: string;
  author?: string;
  categories?: string[];
}

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
}

export type ThemeColor = 'blue' | 'green' | 'purple' | 'orange' | 'red';

export interface AppSettings {
  themeColor: ThemeColor;
  backgroundImage: string | null;
}

export interface UserSettings {
  themeColor: ThemeColor;
  backgroundImage: string | null;
  weatherCity: string;
  timeFormat: '12h' | '24h';
}

// Extended Theme System
export interface LayoutBreakpoint {
  name: string;
  minWidth: number;
  maxWidth?: number;
  columns: number;
  gap: string;
  padding: string;
  fontSize: string;
  lineHeight: string;
}

export interface AdaptiveLayoutConfig {
  breakpoints: LayoutBreakpoint[];
  containerQueries: boolean;
  fluidTypography: boolean;
  responsiveImages: boolean;
  adaptiveGrid: boolean;
}

export interface ExtendedTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  layout: 'compact' | 'comfortable' | 'spacious';
  density: 'low' | 'medium' | 'high';
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  shadows: boolean;
  animations: boolean;
  adaptiveLayout?: AdaptiveLayoutConfig;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  theme: ExtendedTheme;
  category: 'light' | 'dark' | 'colorful' | 'minimal';
}

export interface ThemeSettings {
  currentTheme: ExtendedTheme;
  customThemes: ExtendedTheme[];
  autoDetectSystemTheme: boolean;
  systemThemeOverride: 'light' | 'dark' | null;
  themeTransitions: boolean;
}
