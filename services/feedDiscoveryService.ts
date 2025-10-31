/**
 * feedDiscoveryService.ts
 *
 * Feed discovery service for automatic RSS feed detection from websites.
 * Implements HTML parsing, common path checking, and feed metadata extraction.
 *
 * @author Personal News Dashboard
 * @version 1.0.0
 */

export interface DiscoveredFeed {
  url: string;
  title?: string;
  description?: string;
  type: "rss" | "atom" | "rdf";
  discoveryMethod: "link-tag" | "meta-tag" | "common-path" | "content-scan";
  confidence: number; // 0-1 score based on discovery method and validation
  lastValidated?: number;
}

export interface FeedDiscoveryResult {
  originalUrl: string;
  discoveredFeeds: DiscoveredFeed[];
  discoveryMethods: string[];
  totalAttempts: number;
  successfulAttempts: number;
  discoveryTime: number;
  suggestions: string[];
}

export interface FeedDiscoveryService {
  discoverFromWebsite(url: string): Promise<FeedDiscoveryResult>;
  scanHtmlForFeeds(html: string, baseUrl: string): Promise<DiscoveredFeed[]>;
  tryCommonFeedPaths(baseUrl: string): Promise<DiscoveredFeed[]>;
  extractFeedMetadata(feedContent: string): Promise<{
    title?: string;
    description?: string;
    type: "rss" | "atom" | "rdf";
  }>;
}

class FeedDiscoveryServiceImpl implements FeedDiscoveryService {
  private readonly COMMON_FEED_PATHS = [
    "/rss.xml",
    "/feed.xml",
    "/atom.xml",
    "/rss",
    "/feed",
    "/feeds/all.atom.xml",
    "/feeds/posts/default",
    "/blog/rss.xml",
    "/blog/feed.xml",
    "/news/rss.xml",
    "/index.xml",
    "/feed/",
    "/rss/",
    "/feeds/",
    "/wp-rss2.php",
    "/wp-atom.php",
    "/wp-rdf.php",
  ];

  private readonly FEED_DISCOVERY_SELECTORS = [
    'link[type="application/rss+xml"]',
    'link[type="application/atom+xml"]',
    'link[type="application/rdf+xml"]',
    'link[rel="alternate"][type*="xml"]',
    'link[rel="alternate"][type*="rss"]',
    'link[rel="alternate"][type*="atom"]',
    'meta[property="og:rss"]',
    'meta[name="rss"]',
    'meta[name="feed"]',
  ];

  private readonly REQUEST_TIMEOUT = 10000; // 10 seconds
  private readonly MAX_CONCURRENT_REQUESTS = 5;

  /**
   * Main discovery method that attempts multiple strategies to find RSS feeds
   */
  async discoverFromWebsite(url: string): Promise<FeedDiscoveryResult> {
    const discoveryStartTime = Date.now();
    const normalizedUrl = this.normalizeUrl(url);

    const result: FeedDiscoveryResult = {
      originalUrl: url,
      discoveredFeeds: [],
      discoveryMethods: [],
      totalAttempts: 0,
      successfulAttempts: 0,
      discoveryTime: 0,
      suggestions: [],
    };

    try {
      // Strategy 1: Try common feed paths first (fastest)
      result.discoveryMethods.push("common-paths");
      const commonPathFeeds = await this.tryCommonFeedPaths(normalizedUrl);
      result.discoveredFeeds.push(...commonPathFeeds);
      result.totalAttempts += this.COMMON_FEED_PATHS.length;
      result.successfulAttempts += commonPathFeeds.length;

      // Strategy 2: Fetch and parse HTML for feed discovery links
      result.discoveryMethods.push("html-parsing");
      try {
        const htmlContent = await this.fetchWebsiteContent(normalizedUrl);
        const htmlFeeds = await this.scanHtmlForFeeds(
          htmlContent,
          normalizedUrl
        );

        // Avoid duplicates by checking URLs
        const existingUrls = new Set(result.discoveredFeeds.map((f) => f.url));
        const newHtmlFeeds = htmlFeeds.filter((f) => !existingUrls.has(f.url));

        result.discoveredFeeds.push(...newHtmlFeeds);
        result.totalAttempts += 1; // HTML fetch counts as one attempt
        result.successfulAttempts += newHtmlFeeds.length > 0 ? 1 : 0;
      } catch (error) {
        console.warn("HTML parsing failed:", error);
        result.suggestions.push(
          "Could not parse website HTML for feed discovery links"
        );
      }

      // Strategy 3: Content scanning for additional patterns (if needed)
      if (result.discoveredFeeds.length === 0) {
        result.discoveryMethods.push("content-scan");
        try {
          const contentFeeds = await this.scanContentForFeeds(normalizedUrl);
          result.discoveredFeeds.push(...contentFeeds);
          result.totalAttempts += 1;
          result.successfulAttempts += contentFeeds.length > 0 ? 1 : 0;
        } catch (error) {
          console.warn("Content scanning failed:", error);
        }
      }

      // Remove duplicates and sort by confidence
      result.discoveredFeeds = this.deduplicateAndSortFeeds(
        result.discoveredFeeds
      );

      // Generate suggestions based on results
      result.suggestions = this.generateDiscoverySuggestions(result);
    } catch (error: any) {
      console.error("Feed discovery failed:", error);
      result.suggestions.push(`Discovery failed: ${error.message}`);
    }

    result.discoveryTime = Date.now() - discoveryStartTime;
    return result;
  }

  /**
   * Scan HTML content for feed discovery links
   */
  async scanHtmlForFeeds(
    html: string,
    baseUrl: string
  ): Promise<DiscoveredFeed[]> {
    const discoveredFeeds: DiscoveredFeed[] = [];
    const processedUrls = new Set<string>();

    try {
      // Parse HTML using DOMParser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Check for parsing errors
      if (doc.querySelector("parsererror")) {
        throw new Error("Invalid HTML content");
      }

      // Scan for feed discovery links using selectors
      for (const selector of this.FEED_DISCOVERY_SELECTORS) {
        const elements = doc.querySelectorAll(selector);

        for (const element of elements) {
          const feedUrl = this.extractFeedUrl(element, baseUrl);
          if (feedUrl && !processedUrls.has(feedUrl)) {
            processedUrls.add(feedUrl);

            const discoveryMethod = selector.includes("meta")
              ? "meta-tag"
              : "link-tag";
            const confidence = this.calculateConfidence(
              discoveryMethod,
              element
            );

            // Try to extract additional metadata from the element
            const title =
              element.getAttribute("title") ||
              element.getAttribute("alt") ||
              element.textContent?.trim();

            const feed: DiscoveredFeed = {
              url: feedUrl,
              title: title || undefined,
              type: this.determineFeedType(element, feedUrl),
              discoveryMethod,
              confidence,
            };

            // Try to extract feed metadata if possible
            try {
              const metadata = await this.extractFeedMetadata(
                await this.fetchFeedContent(feedUrl)
              );
              feed.title = metadata.title || feed.title;
              feed.description = metadata.description;
              feed.type = metadata.type;
              feed.lastValidated = Date.now();
            } catch (error) {
              // Metadata extraction failed, but we still have the feed URL
              console.warn(`Failed to extract metadata for ${feedUrl}:`, error);
            }

            discoveredFeeds.push(feed);
          }
        }
      }
    } catch (error: any) {
      console.error("HTML scanning failed:", error);
      throw new Error(`Failed to scan HTML for feeds: ${error.message}`);
    }

    return discoveredFeeds;
  }

  /**
   * Try common feed paths on the website
   */
  async tryCommonFeedPaths(baseUrl: string): Promise<DiscoveredFeed[]> {
    const discoveredFeeds: DiscoveredFeed[] = [];
    const normalizedBaseUrl = this.normalizeUrl(baseUrl);

    // Create promises for concurrent requests (limited)
    const pathPromises = this.COMMON_FEED_PATHS.map(async (path) => {
      const feedUrl = new URL(path, normalizedBaseUrl).toString();

      try {
        const content = await this.fetchFeedContent(feedUrl);
        const metadata = await this.extractFeedMetadata(content);

        const feed: DiscoveredFeed = {
          url: feedUrl,
          title: metadata.title,
          description: metadata.description,
          type: metadata.type,
          discoveryMethod: "common-path",
          confidence: this.calculatePathConfidence(path),
          lastValidated: Date.now(),
        };

        return feed;
      } catch (error) {
        // Path doesn't exist or isn't a valid feed
        return null;
      }
    });

    // Execute requests with concurrency limit
    const results = await this.executeConcurrently(
      pathPromises,
      this.MAX_CONCURRENT_REQUESTS
    );

    // Filter out null results
    discoveredFeeds.push(...(results.filter(Boolean) as DiscoveredFeed[]));

    return discoveredFeeds;
  }

  /**
   * Extract feed metadata from feed content
   */
  async extractFeedMetadata(feedContent: string): Promise<{
    title?: string;
    description?: string;
    type: "rss" | "atom" | "rdf";
  }> {
    try {
      const parser = new DOMParser();
      let doc = parser.parseFromString(feedContent, "text/xml");

      // Check for parsing errors and try to recover
      const parseError = doc.querySelector("parsererror");
      if (parseError) {
        // Try to clean up common XML issues and parse again
        const cleanedContent = this.cleanupMalformedXML(feedContent);
        doc = parser.parseFromString(cleanedContent, "text/xml");

        // If still has errors, throw
        const secondParseError = doc.querySelector("parsererror");
        if (secondParseError) {
          throw new Error("Invalid XML content");
        }
      }

      // Determine feed type and extract metadata
      if (doc.querySelector("rss")) {
        // RSS 2.0 feed
        const title = doc.querySelector("channel > title")?.textContent?.trim();
        const description = doc
          .querySelector("channel > description")
          ?.textContent?.trim();

        return {
          title,
          description,
          type: "rss",
        };
      } else if (
        doc.querySelector('feed[xmlns*="atom"]') ||
        doc.querySelector('feed[xmlns="http://www.w3.org/2005/Atom"]')
      ) {
        // Atom feed
        const title = doc.querySelector("feed > title")?.textContent?.trim();
        const description = doc
          .querySelector("feed > subtitle")
          ?.textContent?.trim();

        return {
          title,
          description,
          type: "atom",
        };
      } else if (
        doc.querySelector("rdf\\:RDF, RDF") ||
        doc.querySelector(
          '[xmlns\\:rdf], [xmlns="http://www.w3.org/1999/02/22-rdf-syntax-ns#"]'
        )
      ) {
        // RSS 1.0 (RDF) feed
        const title = doc
          .querySelector("channel > title, item > title")
          ?.textContent?.trim();
        const description = doc
          .querySelector("channel > description, item > description")
          ?.textContent?.trim();

        return {
          title,
          description,
          type: "rdf",
        };
      } else {
        throw new Error("Unknown feed format");
      }
    } catch (error: any) {
      throw new Error(`Failed to extract feed metadata: ${error.message}`);
    }
  }

  /**
   * Fetch website content with timeout and error handling
   */
  private async fetchWebsiteContent(url: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.REQUEST_TIMEOUT
    );

    try {
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "User-Agent": "Personal News Dashboard Feed Discovery/1.0",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error(`Request timed out after ${this.REQUEST_TIMEOUT}ms`);
      }
      throw error;
    }
  }

  /**
   * Fetch feed content with timeout and error handling
   */
  private async fetchFeedContent(url: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.REQUEST_TIMEOUT
    );

    try {
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          Accept:
            "application/rss+xml, application/atom+xml, application/xml, text/xml",
          "User-Agent": "Personal News Dashboard Feed Discovery/1.0",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error(`Request timed out after ${this.REQUEST_TIMEOUT}ms`);
      }
      throw error;
    }
  }

  /**
   * Scan content for additional feed patterns
   */
  private async scanContentForFeeds(
    baseUrl: string
  ): Promise<DiscoveredFeed[]> {
    const discoveredFeeds: DiscoveredFeed[] = [];

    try {
      const content = await this.fetchWebsiteContent(baseUrl);

      // Look for feed URLs in content using regex patterns
      const feedUrlPatterns = [
        /href=["']([^"']*(?:rss|feed|atom)[^"']*)["']/gi,
        /url\s*=\s*["']([^"']*(?:rss|feed|atom)[^"']*)["']/gi,
        /(https?:\/\/[^\s<>"']*(?:rss|feed|atom)[^\s<>"']*)/gi,
      ];

      for (const pattern of feedUrlPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const potentialUrl = match[1];
          if (potentialUrl && this.isValidFeedUrl(potentialUrl)) {
            const absoluteUrl = new URL(potentialUrl, baseUrl).toString();

            try {
              const feedContent = await this.fetchFeedContent(absoluteUrl);
              const metadata = await this.extractFeedMetadata(feedContent);

              const feed: DiscoveredFeed = {
                url: absoluteUrl,
                title: metadata.title,
                description: metadata.description,
                type: metadata.type,
                discoveryMethod: "content-scan",
                confidence: 0.6, // Lower confidence for content scanning
                lastValidated: Date.now(),
              };

              discoveredFeeds.push(feed);
            } catch (error) {
              // URL found but not a valid feed
              continue;
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Content scanning failed:", error);
    }

    return discoveredFeeds;
  }

  /**
   * Extract feed URL from HTML element
   */
  private extractFeedUrl(element: Element, baseUrl: string): string | null {
    const href =
      element.getAttribute("href") ||
      element.getAttribute("content") ||
      element.getAttribute("value");

    if (!href) return null;

    try {
      // Convert relative URLs to absolute
      return new URL(href, baseUrl).toString();
    } catch (error) {
      return null;
    }
  }

  /**
   * Determine feed type from element attributes
   */
  private determineFeedType(
    element: Element,
    url: string
  ): "rss" | "atom" | "rdf" {
    const type = element.getAttribute("type")?.toLowerCase() || "";

    if (type.includes("atom")) return "atom";
    if (type.includes("rdf")) return "rdf";
    if (type.includes("rss")) return "rss";

    // Fallback to URL-based detection
    const urlLower = url.toLowerCase();
    if (urlLower.includes("atom")) return "atom";
    if (urlLower.includes("rdf")) return "rdf";

    return "rss"; // Default assumption
  }

  /**
   * Calculate confidence score based on discovery method and element attributes
   */
  private calculateConfidence(
    discoveryMethod: string,
    element: Element
  ): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence based on discovery method
    switch (discoveryMethod) {
      case "link-tag":
        confidence = 0.9;
        break;
      case "meta-tag":
        confidence = 0.7;
        break;
      case "common-path":
        confidence = 0.8;
        break;
      case "content-scan":
        confidence = 0.6;
        break;
    }

    // Boost confidence based on element attributes
    const type = element.getAttribute("type")?.toLowerCase() || "";
    if (type.includes("rss") || type.includes("atom") || type.includes("rdf")) {
      confidence += 0.1;
    }

    const rel = element.getAttribute("rel")?.toLowerCase() || "";
    if (rel.includes("alternate")) {
      confidence += 0.05;
    }

    const title = element.getAttribute("title") || "";
    if (
      title.toLowerCase().includes("rss") ||
      title.toLowerCase().includes("feed")
    ) {
      confidence += 0.05;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate confidence for common path discovery
   */
  private calculatePathConfidence(path: string): number {
    // Higher confidence for more standard paths
    const standardPaths = [
      "/rss.xml",
      "/feed.xml",
      "/atom.xml",
      "/rss",
      "/feed",
    ];
    if (standardPaths.includes(path)) {
      return 0.9;
    }

    const commonPaths = [
      "/feeds/all.atom.xml",
      "/blog/rss.xml",
      "/news/rss.xml",
    ];
    if (commonPaths.includes(path)) {
      return 0.8;
    }

    return 0.7; // Default for other paths
  }

  /**
   * Check if a URL looks like a valid feed URL
   */
  private isValidFeedUrl(url: string): boolean {
    const urlLower = url.toLowerCase();
    const feedIndicators = ["rss", "feed", "atom", "xml"];

    return feedIndicators.some(
      (indicator) =>
        urlLower.includes(indicator) &&
        (urlLower.startsWith("http") || urlLower.startsWith("/"))
    );
  }

  /**
   * Normalize URL by ensuring it has a protocol and removing trailing slashes
   */
  private normalizeUrl(url: string): string {
    let normalized = url.trim();

    // Add protocol if missing
    if (
      !normalized.startsWith("http://") &&
      !normalized.startsWith("https://")
    ) {
      normalized = "https://" + normalized;
    }

    // Remove trailing slash
    if (normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  }

  /**
   * Remove duplicate feeds and sort by confidence
   */
  private deduplicateAndSortFeeds(feeds: DiscoveredFeed[]): DiscoveredFeed[] {
    const uniqueFeeds = new Map<string, DiscoveredFeed>();

    // Keep the feed with highest confidence for each URL
    for (const feed of feeds) {
      const existing = uniqueFeeds.get(feed.url);
      if (!existing || feed.confidence > existing.confidence) {
        uniqueFeeds.set(feed.url, feed);
      }
    }

    // Sort by confidence (highest first)
    return Array.from(uniqueFeeds.values()).sort(
      (a, b) => b.confidence - a.confidence
    );
  }

  /**
   * Generate helpful suggestions based on discovery results
   */
  private generateDiscoverySuggestions(result: FeedDiscoveryResult): string[] {
    const suggestions: string[] = [];

    if (result.discoveredFeeds.length === 0) {
      suggestions.push("No RSS feeds found on this website");
      suggestions.push(
        "Try checking if the website provides RSS feeds in their footer or sidebar"
      );
      suggestions.push(
        "Look for 'RSS', 'Feed', or 'Subscribe' links on the website"
      );
    } else if (result.discoveredFeeds.length === 1) {
      suggestions.push("Found one RSS feed on this website");
    } else {
      suggestions.push(
        `Found ${result.discoveredFeeds.length} RSS feeds on this website`
      );
      suggestions.push("Choose the feed that best matches your interests");
    }

    // Add method-specific suggestions
    if (
      result.discoveryMethods.includes("html-parsing") &&
      result.discoveredFeeds.length > 0
    ) {
      suggestions.push(
        "Feeds discovered from website HTML meta tags and links"
      );
    }

    if (
      result.discoveryMethods.includes("common-paths") &&
      result.discoveredFeeds.length > 0
    ) {
      suggestions.push("Feeds found at common RSS feed locations");
    }

    return suggestions;
  }

  /**
   * Clean up malformed XML content to make it parseable
   */
  private cleanupMalformedXML(content: string): string {
    let cleaned = content;

    // Remove BOM if present
    if (cleaned.charCodeAt(0) === 0xfeff) {
      cleaned = cleaned.slice(1);
    }

    // Fix multiple XML declarations
    const xmlDeclMatches = cleaned.match(/<\?xml[^>]*\?>/g);
    if (xmlDeclMatches && xmlDeclMatches.length > 1) {
      // Keep only the first XML declaration
      cleaned = xmlDeclMatches[0] + cleaned.replace(/<\?xml[^>]*\?>/g, "");
    }

    // Fix unclosed CDATA sections
    cleaned = cleaned.replace(
      /<!\[CDATA\[([^]*?)(?:\]\]>|$)/g,
      "<![CDATA[$1]]>"
    );

    // Fix common encoding issues
    cleaned = cleaned
      .replace(/[\u2018\u2019]/g, "'") // Smart quotes to regular quotes
      .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
      .replace(/\u2014/g, "-") // Em dash to hyphen
      .replace(/\u2026/g, "...") // Ellipsis
      .replace(/\u00A0/g, " "); // Non-breaking space to regular space

    // Remove invalid XML characters (control characters except tab, newline, carriage return)
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

    // Try to fix missing channel structure for RSS
    if (cleaned.includes("<rss") && !cleaned.includes("<channel>")) {
      const rssMatch = cleaned.match(/(<rss[^>]*>)(.*?)(<\/rss>)/s);
      if (rssMatch) {
        const [, openTag, content, closeTag] = rssMatch;
        cleaned = `${openTag}<channel>${content}</channel>${closeTag}`;
      }
    }

    // Add missing RSS version attribute
    cleaned = cleaned.replace(
      /<rss(?!\s+version)([^>]*)>/g,
      '<rss version="2.0"$1>'
    );

    // Try to fix unclosed tags by looking for common patterns
    // Fix unclosed description tags specifically
    cleaned = cleaned.replace(
      /(<description[^>]*>)([^<]*?)(\s*<(?!\/description))/g,
      "$1$2</description>$3"
    );

    // Fix other common unclosed tags
    const commonTags = ["title", "link", "pubDate", "author"];
    commonTags.forEach((tag) => {
      const regex = new RegExp(
        `(<${tag}[^>]*>)([^<]*?)(\\s*<(?!\\/${tag})(?!${tag}))`,
        "g"
      );
      cleaned = cleaned.replace(regex, `$1$2</${tag}>$3`);
    });

    // Clean up excessive whitespace while preserving structure
    cleaned = cleaned.replace(/>\s+</g, "><").trim();

    return cleaned;
  }

  /**
   * Execute promises with concurrency limit
   */
  private async executeConcurrently<T>(
    promises: Promise<T>[],
    concurrencyLimit: number
  ): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < promises.length; i += concurrencyLimit) {
      const batch = promises.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.allSettled(batch);

      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          results.push(result.value);
        }
      }
    }

    return results;
  }
}

// Export singleton instance
export const feedDiscoveryService = new FeedDiscoveryServiceImpl();

// Export utility functions for components
export const getFeedTypeIcon = (type: "rss" | "atom" | "rdf"): string => {
  switch (type) {
    case "rss":
      return "📡";
    case "atom":
      return "⚛️";
    case "rdf":
      return "🔗";
    default:
      return "📄";
  }
};

export const getFeedTypeColor = (type: "rss" | "atom" | "rdf"): string => {
  switch (type) {
    case "rss":
      return "text-orange-500";
    case "atom":
      return "text-blue-500";
    case "rdf":
      return "text-green-500";
    default:
      return "text-gray-500";
  }
};

export const getDiscoveryMethodText = (
  method: DiscoveredFeed["discoveryMethod"]
): string => {
  switch (method) {
    case "link-tag":
      return "HTML Link Tag";
    case "meta-tag":
      return "HTML Meta Tag";
    case "common-path":
      return "Common Path";
    case "content-scan":
      return "Content Scan";
    default:
      return "Unknown";
  }
};

export const getConfidenceText = (confidence: number): string => {
  if (confidence >= 0.9) return "Very High";
  if (confidence >= 0.8) return "High";
  if (confidence >= 0.7) return "Medium";
  if (confidence >= 0.6) return "Low";
  return "Very Low";
};

export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.9) return "text-green-600";
  if (confidence >= 0.8) return "text-green-500";
  if (confidence >= 0.7) return "text-yellow-500";
  if (confidence >= 0.6) return "text-orange-500";
  return "text-red-500";
};
