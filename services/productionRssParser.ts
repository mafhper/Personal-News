/**
 * Production RSS Parser for GitHub Pages
 * 
 * This parser works with static hosting by using:
 * 1. RSS2JSON API as primary method
 * 2. Multiple CORS proxies as fallback
 * 3. Relaxed XML validation for production
 * 4. Intelligent caching and retry logic
 */

import type { Article } from "../types";
import { getLogger } from "./logger";
import { perfDebugger } from "./performanceUtils";
import { getCachedArticles, setCachedArticles } from "./smartCache";

// Production-ready CORS proxies and APIs
const RSS_APIS = [
  {
    name: "RSS2JSON",
    url: "https://api.rss2json.com/v1/api.json?rss_url=",
    type: "json" as const,
    rateLimit: 10000, // 10k requests/day
  },
  {
    name: "AllOrigins",
    url: "https://api.allorigins.win/get?url=",
    type: "proxy" as const,
    rateLimit: 200, // 200 requests/hour
  },
  {
    name: "CorsProxy",
    url: "https://corsproxy.io/?",
    type: "proxy" as const,
    rateLimit: 100, // 100 requests/hour
  },
  {
    name: "ProxyCors",
    url: "https://proxy.cors.sh/",
    type: "proxy" as const,
    rateLimit: 1000, // 1k requests/day
  }
];

const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds for production
const MAX_RETRY_ATTEMPTS = 2; // Reduced retries for production
const RETRY_DELAY_BASE_MS = 2000; // 2 second base delay

const logger = getLogger();

/**
 * Enhanced fetch with timeout for production
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeout}ms`);
    }

    throw error;
  }
}

/**
 * Parse RSS using RSS2JSON API (returns JSON directly)
 */
async function parseRssWithRss2Json(feedUrl: string): Promise<Article[]> {
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
  
  const response = await fetchWithTimeout(apiUrl);
  
  if (!response.ok) {
    throw new Error(`RSS2JSON API failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.status !== 'ok') {
    throw new Error(`RSS2JSON API error: ${data.message || 'Unknown error'}`);
  }

  // Convert RSS2JSON format to our Article format
  const articles: Article[] = data.items.map((item: any) => ({
    title: item.title || 'No Title',
    link: item.link || '',
    pubDate: new Date(item.pubDate || Date.now()),
    description: cleanDescription(item.description || ''),
    imageUrl: item.enclosure?.link || item.thumbnail || undefined,
    author: item.author || undefined,
    categories: item.categories || [],
    sourceTitle: data.feed?.title || 'Unknown Feed',
  }));

  return articles;
}

/**
 * Parse RSS using CORS proxy (returns XML)
 */
async function parseRssWithProxy(feedUrl: string, proxyUrl: string): Promise<Article[]> {
  let fetchUrl: string;
  
  if (proxyUrl.includes("allorigins.win")) {
    fetchUrl = `${proxyUrl}${encodeURIComponent(feedUrl)}`;
  } else {
    fetchUrl = `${proxyUrl}${encodeURIComponent(feedUrl)}`;
  }

  const response = await fetchWithTimeout(fetchUrl);
  
  if (!response.ok) {
    throw new Error(`Proxy failed: ${response.status} ${response.statusText}`);
  }

  let xmlContent = await response.text();

  // Handle AllOrigins response format
  if (proxyUrl.includes("allorigins.win")) {
    try {
      const jsonResponse = JSON.parse(xmlContent);
      if (jsonResponse.contents) {
        xmlContent = jsonResponse.contents;
      } else {
        throw new Error("No contents in AllOrigins response");
      }
    } catch (e) {
      throw new Error(`Failed to parse AllOrigins response: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (!xmlContent.trim()) {
    throw new Error("Empty RSS feed received from proxy");
  }

  // Parse XML with relaxed validation for production
  return parseRssXmlProduction(xmlContent, feedUrl);
}

/**
 * Production XML parser with relaxed validation
 */
function parseRssXmlProduction(xmlContent: string, feedUrl: string): Article[] {
  // Use native DOMParser with minimal validation
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "application/xml");

  // Check for parsing errors
  const parseErrors = xmlDoc.getElementsByTagName("parsererror");
  if (parseErrors.length > 0) {
    throw new Error(`XML parsing error: ${parseErrors[0].textContent}`);
  }

  let channelTitle = "Unknown Feed";
  let items: HTMLCollectionOf<Element> | NodeListOf<Element>;

  // Try RSS 2.0 format first
  const channels = xmlDoc.getElementsByTagName("channel");
  if (channels.length > 0) {
    const titleElements = channels[0].getElementsByTagName("title");
    channelTitle = titleElements[0]?.textContent?.trim() || "Unknown Feed";
    items = xmlDoc.getElementsByTagName("item");
  } else {
    // Try Atom format
    const feeds = xmlDoc.getElementsByTagName("feed");
    if (feeds.length > 0) {
      const titleElements = feeds[0].getElementsByTagName("title");
      channelTitle = titleElements[0]?.textContent?.trim() || "Unknown Feed";
      items = xmlDoc.getElementsByTagName("entry");
    } else {
      // Try RDF format
      const rdfItems = xmlDoc.getElementsByTagName("item");
      if (rdfItems.length > 0) {
        items = rdfItems;
      } else {
        throw new Error("No RSS items found in feed");
      }
    }
  }

  const articles: Article[] = [];

  for (let i = 0; i < Math.min(items.length, 50); i++) { // Limit to 50 items for performance
    const item = items[i];

    try {
      // Extract title
      const titleElements = item.getElementsByTagName("title");
      const title = titleElements[0]?.textContent?.trim() || "No Title";

      // Extract link
      let link = "";
      const linkElements = item.getElementsByTagName("link");
      if (linkElements.length > 0) {
        link = linkElements[0].textContent?.trim() || linkElements[0].getAttribute("href") || "";
      }

      // Extract publication date
      let pubDate = new Date();
      const pubDateElements = item.getElementsByTagName("pubDate");
      const publishedElements = item.getElementsByTagName("published");
      const dcDateElements = item.getElementsByTagName("date");

      let dateElement = pubDateElements[0] || publishedElements[0] || dcDateElements[0];
      if (dateElement?.textContent) {
        const parsedDate = new Date(dateElement.textContent.trim());
        if (!isNaN(parsedDate.getTime())) {
          pubDate = parsedDate;
        }
      }

      // Extract description
      let description = "";
      const descElements = item.getElementsByTagName("description");
      const summaryElements = item.getElementsByTagName("summary");
      const contentElements = item.getElementsByTagName("content");

      let descElement = descElements[0] || summaryElements[0] || contentElements[0];
      if (descElement?.textContent) {
        description = cleanDescription(descElement.textContent).substring(0, 300);
      }

      // Extract author
      let author = "";
      const authorElements = item.getElementsByTagName("author");
      const creatorElements = item.getElementsByTagName("creator");

      let authorElement = authorElements[0] || creatorElements[0];
      if (authorElement?.textContent) {
        author = authorElement.textContent.trim();
      }

      // Extract categories
      const categories: string[] = [];
      const categoryElements = item.getElementsByTagName("category");
      for (let j = 0; j < Math.min(categoryElements.length, 5); j++) { // Limit categories
        const catText = categoryElements[j].textContent?.trim();
        if (catText) categories.push(catText);
      }

      // Extract image URL (simplified for performance)
      let imageUrl = "";
      const enclosureElements = item.getElementsByTagName("enclosure");
      for (let j = 0; j < enclosureElements.length; j++) {
        const enclosure = enclosureElements[j];
        const type = enclosure.getAttribute("type");
        if (type && type.startsWith("image/")) {
          imageUrl = enclosure.getAttribute("url") || "";
          break;
        }
      }

      // Only add valid articles
      if (title !== "No Title" && link) {
        articles.push({
          title,
          link,
          pubDate,
          description,
          imageUrl: imageUrl || undefined,
          author: author || undefined,
          categories,
          sourceTitle: channelTitle,
        });
      }
    } catch (error) {
      logger.warn(`Failed to parse article ${i + 1} from ${feedUrl}`, {
        component: "productionRssParser",
        additionalData: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  return articles;
}

/**
 * Clean HTML description text (simplified for production)
 */
function cleanDescription(description: string): string {
  if (!description) return "";

  return description
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove scripts
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "") // Remove iframes
    .replace(/<[^>]*>/g, "") // Remove all HTML tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate retry delay with exponential backoff
 */
function getRetryDelay(attempt: number): number {
  return RETRY_DELAY_BASE_MS * Math.pow(2, attempt - 1);
}

/**
 * Main RSS parsing function with multiple fallback methods
 */
async function parseRssUrlWithFallback(
  url: string,
  options: {
    timeout?: number;
    maxRetries?: number;
    signal?: AbortSignal;
  } = {}
): Promise<{ title: string; articles: Article[] }> {
  const { maxRetries = MAX_RETRY_ATTEMPTS, signal } = options;

  let lastError: Error = new Error("Unknown error");

  // Try each RSS API/proxy in order
  for (let apiIndex = 0; apiIndex < RSS_APIS.length; apiIndex++) {
    const api = RSS_APIS[apiIndex];
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.debug(`Trying ${api.name} (attempt ${attempt}/${maxRetries})`, {
          component: "productionRssParser",
          additionalData: { feedUrl: url, api: api.name, attempt },
        });

        perfDebugger.log(`Fetching RSS via ${api.name} (attempt ${attempt}): ${url}`);

        let articles: Article[];
        let title: string;

        if (api.type === "json") {
          // Use RSS2JSON API
          articles = await parseRssWithRss2Json(url);
          title = articles[0]?.sourceTitle || "Unknown Feed";
        } else {
          // Use CORS proxy
          articles = await parseRssWithProxy(url, api.url);
          title = articles[0]?.sourceTitle || "Unknown Feed";
        }

        // Cache successful results
        if (articles.length > 0) {
          setCachedArticles(url, articles, title);
        }

        logger.info(`Successfully fetched feed via ${api.name} on attempt ${attempt}`, {
          component: "productionRssParser",
          additionalData: {
            feedUrl: url,
            api: api.name,
            articlesCount: articles.length,
            attempt,
          },
        });

        return { title, articles };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if we should abort due to signal
        if (signal?.aborted) {
          throw new Error("Request was cancelled");
        }

        logger.warn(`${api.name} attempt ${attempt} failed`, {
          component: "productionRssParser",
          additionalData: {
            feedUrl: url,
            api: api.name,
            attempt,
            error: lastError.message,
          },
        });

        // Don't retry on the last attempt or last API
        if (attempt === maxRetries || apiIndex === RSS_APIS.length - 1) {
          break;
        }

        // Wait before retrying
        const delay = getRetryDelay(attempt);
        await sleep(delay);
      }
    }
  }

  // All APIs failed
  logger.error(`All RSS APIs failed for feed`, lastError, {
    component: "productionRssParser",
    additionalData: {
      feedUrl: url,
      apisAttempted: RSS_APIS.length,
      maxRetries,
    },
  });

  throw lastError;
}

/**
 * Main export function - works in both development and production
 */
export async function parseRssUrl(
  url: string,
  options: {
    timeout?: number;
    maxRetries?: number;
    signal?: AbortSignal;
    skipCache?: boolean;
  } = {}
): Promise<{ title: string; articles: Article[] }> {
  const { skipCache = false } = options;

  // Check cache first (unless skipping)
  if (!skipCache) {
    const cachedArticles = getCachedArticles(url);
    if (cachedArticles && cachedArticles.length > 0) {
      logger.debug(`Using cached articles for feed`, {
        component: "productionRssParser",
        additionalData: {
          feedUrl: url,
          cachedCount: cachedArticles.length,
        },
      });
      
      return {
        title: cachedArticles[0].sourceTitle || "Cached Feed",
        articles: cachedArticles,
      };
    }
  }

  // No cache hit or cache skipped, fetch from RSS APIs
  logger.info(`Fetching feed with production parser`, {
    component: "productionRssParser",
    additionalData: {
      feedUrl: url,
      timeout: options.timeout || DEFAULT_TIMEOUT_MS,
      maxRetries: options.maxRetries || MAX_RETRY_ATTEMPTS,
      skipCache,
    },
  });

  return await parseRssUrlWithFallback(url, options);
}