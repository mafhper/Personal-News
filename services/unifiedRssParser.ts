/**
 * Unified RSS Parser
 * 
 * Automatically detects environment and uses the appropriate parsing strategy:
 * - Development: Local proxy with fallback to production APIs
 * - Production/GitHub Pages: Production APIs with multiple fallbacks
 * - Hybrid: Intelligent switching based on availability
 */

import type { Article } from "../types";
import { getLogger } from "./logger";
import { perfDebugger } from "./performanceUtils";
import { getCachedArticles } from "./smartCache";
import { 
  detectEnvironment, 
  getRssParserConfig, 
  checkLocalProxyAvailability
} from "./environmentDetector";

// Import both parsers
import { parseRssUrl as parseRssUrlDev } from "./rssParser";
import { parseRssUrl as parseRssUrlProd } from "./productionRssParser";

const logger = getLogger();

/**
 * Unified RSS parsing function that adapts to environment
 */
export async function parseRssUrl(
  url: string,
  options: {
    timeout?: number;
    maxRetries?: number;
    signal?: AbortSignal;
    skipCache?: boolean;
    forceProduction?: boolean;
  } = {}
): Promise<{ title: string; articles: Article[] }> {
  
  const env = detectEnvironment();
  const config = getRssParserConfig();
  const { forceProduction = false } = options;
  
  // Merge options with environment config
  const finalOptions = {
    timeout: options.timeout || config.timeout,
    maxRetries: options.maxRetries || config.maxRetries,
    signal: options.signal,
    skipCache: options.skipCache || false,
  };

  logger.info(`Starting unified RSS parsing`, {
    component: "unifiedRssParser",
    additionalData: {
      feedUrl: url,
      environment: {
        isDevelopment: env.isDevelopment,
        isProduction: env.isProduction,
        isGitHubPages: env.isGitHubPages,
        useProductionParser: env.useProductionParser,
      },
      config,
      forceProduction,
    },
  });

  // Check cache first (unless skipping)
  if (!finalOptions.skipCache) {
    const cachedArticles = getCachedArticles(url);
    if (cachedArticles && cachedArticles.length > 0) {
      logger.debug(`Using cached articles for feed`, {
        component: "unifiedRssParser",
        additionalData: {
          feedUrl: url,
          cachedCount: cachedArticles.length,
        },
      });
      
      perfDebugger.log(`Using ${cachedArticles.length} cached articles for feed: ${url}`);
      
      return {
        title: cachedArticles[0].sourceTitle || "Cached Feed",
        articles: cachedArticles,
      };
    }
  }

  // Determine parsing strategy
  let useProductionParser = env.useProductionParser || forceProduction;
  
  // In development, check if local proxy is available
  if (env.isDevelopment && !forceProduction) {
    try {
      const localProxyAvailable = await checkLocalProxyAvailability();
      if (localProxyAvailable) {
        useProductionParser = false;
        logger.info(`Local proxy detected, using development parser`, {
          component: "unifiedRssParser",
          additionalData: { feedUrl: url },
        });
      } else {
        useProductionParser = true;
        logger.info(`Local proxy not available, switching to production parser`, {
          component: "unifiedRssParser",
          additionalData: { feedUrl: url },
        });
      }
    } catch (error) {
      // If proxy check fails, use production parser
      useProductionParser = true;
      logger.warn(`Proxy check failed, using production parser`, {
        component: "unifiedRssParser",
        additionalData: { 
          feedUrl: url,
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  // Parse using appropriate strategy
  try {
    let result: { title: string; articles: Article[] };
    
    if (useProductionParser) {
      perfDebugger.log(`Using production RSS parser for: ${url}`);
      result = await parseRssUrlProd(url, finalOptions);
    } else {
      perfDebugger.log(`Using development RSS parser for: ${url}`);
      result = await parseRssUrlDev(url, finalOptions);
    }

    logger.info(`Successfully parsed RSS feed`, {
      component: "unifiedRssParser",
      additionalData: {
        feedUrl: url,
        parser: useProductionParser ? 'production' : 'development',
        articlesCount: result.articles.length,
        title: result.title,
      },
    });

    return result;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error(`RSS parsing failed with ${useProductionParser ? 'production' : 'development'} parser`, error as Error, {
      component: "unifiedRssParser",
      additionalData: {
        feedUrl: url,
        parser: useProductionParser ? 'production' : 'development',
        error: errorMessage,
      },
    });

    // Try fallback strategy if not already tried
    if (!useProductionParser && env.isDevelopment) {
      logger.info(`Attempting fallback to production parser`, {
        component: "unifiedRssParser",
        additionalData: { feedUrl: url },
      });
      
      try {
        perfDebugger.log(`Fallback: Using production RSS parser for: ${url}`);
        const fallbackResult = await parseRssUrlProd(url, finalOptions);
        
        logger.info(`Fallback parsing successful`, {
          component: "unifiedRssParser",
          additionalData: {
            feedUrl: url,
            articlesCount: fallbackResult.articles.length,
          },
        });
        
        return fallbackResult;
      } catch (fallbackError) {
        const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        logger.error(`Fallback parsing also failed`, fallbackError as Error, {
          component: "unifiedRssParser",
          additionalData: { 
            feedUrl: url,
            fallbackError: fallbackErrorMessage
          },
        });
        
        // Throw original error
        throw error;
      }
    }

    // No fallback available or fallback already tried
    throw error;
  }
}

/**
 * Batch RSS parsing with environment-aware configuration
 */
export async function parseMultipleRssUrls(
  urls: string[],
  options: {
    timeout?: number;
    maxRetries?: number;
    signal?: AbortSignal;
    skipCache?: boolean;
    forceProduction?: boolean;
    onProgress?: (completed: number, total: number) => void;
  } = {}
): Promise<Array<{ url: string; result?: { title: string; articles: Article[] }; error?: string }>> {
  
  const config = getRssParserConfig();
  const { onProgress } = options;
  
  const results: Array<{ url: string; result?: { title: string; articles: Article[] }; error?: string }> = [];
  
  // Process in batches to avoid overwhelming APIs
  const batchSize = config.batchSize;
  const batchDelay = config.batchDelay;
  
  logger.info(`Starting batch RSS parsing`, {
    component: "unifiedRssParser",
    additionalData: {
      totalUrls: urls.length,
      batchSize,
      batchDelay,
    },
  });

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    
    logger.debug(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(urls.length / batchSize)}`, {
      component: "unifiedRssParser",
      additionalData: {
        batchUrls: batch,
        batchIndex: Math.floor(i / batchSize),
      },
    });

    // Process batch in parallel
    const batchPromises = batch.map(async (url) => {
      try {
        const result = await parseRssUrl(url, options);
        return { url, result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn(`Failed to parse RSS feed in batch`, {
          component: "unifiedRssParser",
          additionalData: {
            feedUrl: url,
            error: errorMessage,
          },
        });
        return { url, error: errorMessage };
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    
    // Process batch results
    batchResults.forEach((promiseResult, index) => {
      if (promiseResult.status === 'fulfilled') {
        results.push(promiseResult.value);
      } else {
        const url = batch[index];
        results.push({ 
          url, 
          error: promiseResult.reason instanceof Error ? promiseResult.reason.message : String(promiseResult.reason)
        });
      }
    });

    // Report progress
    if (onProgress) {
      onProgress(results.length, urls.length);
    }

    // Delay between batches (except for the last batch)
    if (i + batchSize < urls.length) {
      logger.debug(`Waiting ${batchDelay}ms before next batch`);
      await new Promise(resolve => setTimeout(resolve, batchDelay));
    }
  }

  const successCount = results.filter(r => r.result).length;
  const errorCount = results.filter(r => r.error).length;

  logger.info(`Batch RSS parsing completed`, {
    component: "unifiedRssParser",
    additionalData: {
      totalUrls: urls.length,
      successCount,
      errorCount,
      successRate: Math.round((successCount / urls.length) * 100),
    },
  });

  return results;
}

/**
 * Export OPML parsing (unchanged)
 */
export function parseOpml(fileContent: string): string[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(fileContent, "text/xml");

  const outlines = xmlDoc.getElementsByTagName("outline");
  const urls: string[] = [];

  for (let i = 0; i < outlines.length; i++) {
    const outline = outlines[i];
    const xmlUrl = outline.getAttribute("xmlUrl");
    if (xmlUrl) {
      urls.push(xmlUrl);
    }
  }

  return urls;
}