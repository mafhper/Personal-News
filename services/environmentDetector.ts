/**
 * Environment Detection and Configuration
 * 
 * Detects the current environment and provides appropriate configuration
 * for RSS parsing, proxy usage, and other environment-specific features.
 */

export interface EnvironmentConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  isGitHubPages: boolean;
  isLocalhost: boolean;
  proxyUrl: string | null;
  useProductionParser: boolean;
  corsMode: 'local-proxy' | 'public-apis' | 'mixed';
}

/**
 * Detect current environment
 */
export function detectEnvironment(): EnvironmentConfig {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const port = typeof window !== 'undefined' ? window.location.port : '';
  
  // Check if running in development
  const isDevelopment = 
    hostname === 'localhost' || 
    hostname === '127.0.0.1' || 
    hostname.startsWith('192.168.') ||
    port === '5173' || 
    port === '3000' ||
    process.env.NODE_ENV === 'development';

  // Check if running on GitHub Pages
  const isGitHubPages = 
    hostname.endsWith('.github.io') ||
    hostname.includes('github.io');

  // Check if HTTPS is available (production indicator)
  const isSecure = protocol === 'https:';
  
  // Determine if this is production
  const isProduction = !isDevelopment || isSecure || isGitHubPages;
  
  // Check if localhost proxy is available (development only)
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  // Determine proxy configuration
  let proxyUrl: string | null = null;
  let corsMode: 'local-proxy' | 'public-apis' | 'mixed' = 'public-apis';
  
  if (isDevelopment && isLocalhost) {
    // Try to use local proxy in development
    proxyUrl = 'http://localhost:3001/rss?url=';
    corsMode = 'mixed'; // Try local first, fallback to public
  }
  
  // Determine which parser to use
  const useProductionParser = isProduction || !isLocalhost;

  return {
    isDevelopment,
    isProduction,
    isGitHubPages,
    isLocalhost,
    proxyUrl,
    useProductionParser,
    corsMode,
  };
}

/**
 * Get environment-specific RSS parser configuration
 */
export function getRssParserConfig() {
  const env = detectEnvironment();
  
  return {
    timeout: env.isDevelopment ? 8000 : 10000, // Longer timeout in production
    maxRetries: env.isDevelopment ? 3 : 2, // Fewer retries in production
    useLocalProxy: env.corsMode === 'local-proxy' || env.corsMode === 'mixed',
    useProductionApis: env.useProductionParser,
    batchSize: env.isDevelopment ? 5 : 3, // Smaller batches in production
    batchDelay: env.isDevelopment ? 1000 : 2000, // Longer delays in production
  };
}

/**
 * Check if local proxy is available
 */
export async function checkLocalProxyAvailability(): Promise<boolean> {
  const env = detectEnvironment();
  
  if (!env.isLocalhost || !env.proxyUrl) {
    return false;
  }
  
  try {
    const healthUrl = 'http://localhost:3001/health';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(healthUrl, { 
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Get appropriate CORS proxies based on environment
 */
export function getCorsProxies(): string[] {
  const env = detectEnvironment();
  
  const proxies: string[] = [];
  
  // Add local proxy if available in development
  if (env.proxyUrl && (env.corsMode === 'local-proxy' || env.corsMode === 'mixed')) {
    proxies.push(env.proxyUrl);
  }
  
  // Add public proxies (always available)
  proxies.push(
    'https://api.rss2json.com/v1/api.json?rss_url=',
    'https://api.allorigins.win/get?url=',
    'https://corsproxy.io/?',
    'https://proxy.cors.sh/'
  );
  
  return proxies;
}

/**
 * Log environment information for debugging
 */
export function logEnvironmentInfo() {
  const env = detectEnvironment();
  const config = getRssParserConfig();
  
  console.group('🌍 Environment Detection');
  console.log('Environment:', {
    isDevelopment: env.isDevelopment,
    isProduction: env.isProduction,
    isGitHubPages: env.isGitHubPages,
    isLocalhost: env.isLocalhost,
    corsMode: env.corsMode,
    useProductionParser: env.useProductionParser,
  });
  
  console.log('RSS Parser Config:', config);
  
  console.log('Available Proxies:', getCorsProxies());
  
  if (env.proxyUrl) {
    console.log('🔗 Local proxy URL:', env.proxyUrl);
  }
  
  console.groupEnd();
}

// Auto-log environment info in development
if (typeof window !== 'undefined' && detectEnvironment().isDevelopment) {
  setTimeout(logEnvironmentInfo, 1000);
}