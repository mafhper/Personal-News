/**
 * OPML Export Service
 *
 * Service for generating OPML (Outline Processor Markup Language) files
 * from RSS feed collections with support for categorization and metadata.
 *
 * @author Personal News Dashboard
 * @version 1.0.0
 */

import type { FeedSource, FeedCategory } from "../types";
import { feedDuplicateDetector } from "./feedDuplicateDetector";

export interface OPMLExportOptions {
  title?: string;
  description?: string;
  ownerName?: string;
  ownerEmail?: string;
  includeCategories?: boolean;
  includeFeedMetadata?: boolean;
}

export interface OPMLValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class OPMLExportService {
  private static readonly DEFAULT_OPTIONS: Required<OPMLExportOptions> = {
    title: "Personal News Dashboard Feeds",
    description: "RSS feeds exported from Personal News Dashboard",
    ownerName: "Personal News Dashboard User",
    ownerEmail: "",
    includeCategories: true,
    includeFeedMetadata: true,
  };

  /**
   * Generate OPML XML content from feed collections
   */
  static async generateOPML(
    feeds: FeedSource[],
    categories: FeedCategory[] = [],
    options: OPMLExportOptions = {}
  ): Promise<string> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const now = new Date();

    // Remove duplicate feeds using enhanced detection
    const duplicateResult = await feedDuplicateDetector.removeDuplicates(
      feeds,
      {
        action: "keep_first",
      }
    );
    const deduplicatedFeeds = duplicateResult.uniqueFeeds;

    // Create OPML document structure
    const opmlDoc = this.createOPMLDocument(opts, now);

    // Add feeds organized by categories
    const body = this.createOPMLBody(deduplicatedFeeds, categories, opts);

    return this.formatXML(opmlDoc, body);
  }

  /**
   * Create OPML document header
   */
  private static createOPMLDocument(
    options: Required<OPMLExportOptions>,
    date: Date
  ): string {
    const dateString = date.toUTCString();

    return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>${this.escapeXML(options.title)}</title>
    <dateCreated>${dateString}</dateCreated>
    <dateModified>${dateString}</dateModified>
    <ownerName>${this.escapeXML(options.ownerName)}</ownerName>
    ${
      options.ownerEmail
        ? `<ownerEmail>${this.escapeXML(options.ownerEmail)}</ownerEmail>`
        : ""
    }
    <docs>http://dev.opml.org/spec2.html</docs>
    <expansionState></expansionState>
    <vertScrollState>1</vertScrollState>
    <windowTop>146</windowTop>
    <windowLeft>107</windowLeft>
    <windowBottom>468</windowBottom>
    <windowRight>560</windowRight>
  </head>`;
  }

  /**
   * Create OPML body with feeds organized by categories
   */
  private static createOPMLBody(
    feeds: FeedSource[],
    categories: FeedCategory[],
    options: Required<OPMLExportOptions>
  ): string {
    let body = "  <body>\n";

    if (options.includeCategories && categories.length > 0) {
      // Group feeds by category
      const feedsByCategory = this.groupFeedsByCategory(feeds, categories);

      // Add categorized feeds
      for (const category of categories.sort((a, b) => a.order - b.order)) {
        const categoryFeeds = feedsByCategory.get(category.id) || [];
        if (categoryFeeds.length > 0) {
          body += this.createCategoryOutline(category, categoryFeeds, options);
        }
      }

      // Add uncategorized feeds
      const uncategorizedFeeds = feeds.filter((feed) => !feed.categoryId);
      if (uncategorizedFeeds.length > 0) {
        body += this.createUncategorizedOutline(uncategorizedFeeds, options);
      }
    } else {
      // Add all feeds without categorization
      for (const feed of feeds) {
        body += this.createFeedOutline(feed, options);
      }
    }

    body += "  </body>\n";
    return body;
  }

  /**
   * Group feeds by their category ID
   */
  private static groupFeedsByCategory(
    feeds: FeedSource[],
    categories: FeedCategory[]
  ): Map<string, FeedSource[]> {
    const feedsByCategory = new Map<string, FeedSource[]>();

    // Initialize map with empty arrays for each category
    categories.forEach((category) => {
      feedsByCategory.set(category.id, []);
    });

    // Group feeds by category
    feeds.forEach((feed) => {
      if (feed.categoryId) {
        const categoryFeeds = feedsByCategory.get(feed.categoryId) || [];
        categoryFeeds.push(feed);
        feedsByCategory.set(feed.categoryId, categoryFeeds);
      }
    });

    return feedsByCategory;
  }

  /**
   * Create category outline with nested feeds
   */
  private static createCategoryOutline(
    category: FeedCategory,
    feeds: FeedSource[],
    options: Required<OPMLExportOptions>
  ): string {
    let outline = `    <outline text="${this.escapeXML(category.name)}"`;

    if (category.description) {
      outline += ` description="${this.escapeXML(category.description)}"`;
    }

    outline += ">\n";

    // Add feeds within this category
    for (const feed of feeds) {
      outline += this.createFeedOutline(feed, options, 6); // 6 spaces for nested indentation
    }

    outline += "    </outline>\n";
    return outline;
  }

  /**
   * Create outline for uncategorized feeds
   */
  private static createUncategorizedOutline(
    feeds: FeedSource[],
    options: Required<OPMLExportOptions>
  ): string {
    let outline = '    <outline text="Uncategorized">\n';

    for (const feed of feeds) {
      outline += this.createFeedOutline(feed, options, 6);
    }

    outline += "    </outline>\n";
    return outline;
  }

  /**
   * Create individual feed outline
   */
  private static createFeedOutline(
    feed: FeedSource,
    options: Required<OPMLExportOptions>,
    indentSpaces: number = 4
  ): string {
    const indent = " ".repeat(indentSpaces);
    const title = feed.customTitle || this.extractDomainFromUrl(feed.url);
    // Debug: removed

    let outline = `${indent}<outline`;
    outline += ` type="rss"`;
    outline += ` text="${this.escapeXML(title)}"`;
    outline += ` title="${this.escapeXML(title)}"`;
    outline += ` xmlUrl="${this.escapeXML(feed.url)}"`;

    // Add HTML URL (website URL derived from feed URL)
    const htmlUrl = this.deriveHtmlUrl(feed.url);
    if (htmlUrl) {
      outline += ` htmlUrl="${this.escapeXML(htmlUrl)}"`;
    }

    // Add category information as custom attribute
    if (feed.categoryId && options.includeFeedMetadata) {
      outline += ` category="${this.escapeXML(feed.categoryId)}"`;
    }

    outline += " />\n";
    return outline;
  }

  /**
   * Extract domain name from URL for use as default title
   */
  private static extractDomainFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, "");
    } catch (error) {
      // Fallback: use regex to extract domain
      const match = url.match(/^https?:\/\/(?:www\.)?([^\/]+)/);
      return match ? match[1] : url;
    }
  }

  /**
   * Derive HTML URL from RSS feed URL
   */
  private static deriveHtmlUrl(feedUrl: string): string | null {
    try {
      const url = new URL(feedUrl);

      // Handle WordPress-style query parameters first
      if (url.search) {
        const searchParams = new URLSearchParams(url.search);
        if (searchParams.has("feed")) {
          // WordPress feed URLs like ?feed=rss2, ?feed=atom, etc.
          return `${url.protocol}//${url.host}${
            url.pathname === "/" ? "" : url.pathname
          }`;
        }
      }

      // Common RSS feed patterns to convert to website URLs
      const feedPatterns = [
        { pattern: /\/rss\.xml$/, replacement: "" },
        { pattern: /\/feed\.xml$/, replacement: "" },
        { pattern: /\/atom\.xml$/, replacement: "" },
        { pattern: /\/rss\/?$/, replacement: "" },
        { pattern: /\/feed\/?$/, replacement: "" },
        { pattern: /\/feeds\/.*$/, replacement: "" },
        { pattern: /\/blog\/rss\.xml$/, replacement: "/blog" },
        { pattern: /\/blog\/feed\.xml$/, replacement: "/blog" },
        { pattern: /\/news\/rss\.xml$/, replacement: "/news" },
        { pattern: /\/news\/feeds\/.*$/, replacement: "/news" },
      ];

      let htmlPath = url.pathname;
      let patternMatched = false;

      for (const { pattern, replacement } of feedPatterns) {
        if (pattern.test(htmlPath)) {
          htmlPath = htmlPath.replace(pattern, replacement);
          patternMatched = true;
          break;
        }
      }

      // If no pattern matched, try to go to root
      if (!patternMatched) {
        htmlPath = "";
      }

      // Ensure we don't have double slashes and handle empty paths
      const finalPath = htmlPath === "" || htmlPath === "/" ? "" : htmlPath;

      return `${url.protocol}//${url.host}${finalPath}`;
    } catch (error) {
      return null;
    }
  }

  /**
   * Format complete XML document
   */
  private static formatXML(header: string, body: string): string {
    return `${header}\n${body}</opml>`;
  }

  /**
   * Escape XML special characters
   */
  private static escapeXML(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Validate OPML XML structure
   */
  static validateOPML(opmlContent: string): OPMLValidationResult {
    const result: OPMLValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      // Basic XML structure validation
      if (!opmlContent.trim().startsWith("<?xml")) {
        result.errors.push("OPML must start with XML declaration");
      }

      if (!opmlContent.includes("<opml")) {
        result.errors.push("Missing OPML root element");
      }

      if (!opmlContent.includes("<head>")) {
        result.errors.push("Missing OPML head section");
      }

      if (!opmlContent.includes("<body>")) {
        result.errors.push("Missing OPML body section");
      }

      // Check for required head elements
      if (!opmlContent.includes("<title>")) {
        result.warnings.push("Missing title in head section");
      }

      if (!opmlContent.includes("<dateCreated>")) {
        result.warnings.push("Missing dateCreated in head section");
      }

      // Check for proper outline structure
      const outlineMatches = opmlContent.match(/<outline[^>]*>/g);
      if (!outlineMatches || outlineMatches.length === 0) {
        result.warnings.push("No outline elements found");
      }

      // Validate XML structure using DOMParser if available
      if (typeof DOMParser !== "undefined") {
        const parser = new DOMParser();
        const doc = parser.parseFromString(opmlContent, "text/xml");
        const parseError = doc.querySelector("parsererror");

        if (parseError) {
          result.errors.push(`XML parsing error: ${parseError.textContent}`);
        }
      }

      result.isValid = result.errors.length === 0;
    } catch (error) {
      result.errors.push(
        `Validation error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      result.isValid = false;
    }

    return result;
  }

  /**
   * Create and trigger download of OPML file
   */
  static downloadOPML(
    opmlContent: string,
    filename: string = "feeds.opml"
  ): void {
    try {
      // Ensure filename has .opml extension
      if (!filename.toLowerCase().endsWith(".opml")) {
        filename += ".opml";
      }

      // Create blob with OPML content
      const blob = new Blob([opmlContent], {
        type: "application/xml;charset=utf-8",
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download OPML file:", error);
      throw new Error("Failed to download OPML file");
    }
  }

  /**
   * Generate filename with timestamp
   */
  static generateFilename(baseName: string = "feeds"): string {
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, "-");
    return `${baseName}-${timestamp}.opml`;
  }

  /**
   * Normalize URL for duplicate detection
   * Removes common variations that represent the same feed
   */
  private static normalizeUrl(url: string): string {
    try {
      // First, clean up the URL string
      let cleanUrl = url.trim();

      // Handle case variations
      const urlObj = new URL(cleanUrl);

      // Remove www. from hostname
      let hostname = urlObj.hostname.toLowerCase();
      if (hostname.startsWith("www.")) {
        hostname = hostname.substring(4);
      }

      // Remove trailing slash from pathname and normalize case
      let pathname = urlObj.pathname.toLowerCase();
      if (pathname.endsWith("/") && pathname.length > 1) {
        pathname = pathname.slice(0, -1);
      }

      // Remove common query parameters that don't affect feed content
      const searchParams = new URLSearchParams(urlObj.search);
      const paramsToRemove = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "ref",
        "source",
      ];
      paramsToRemove.forEach((param) => {
        searchParams.delete(param);
      });

      // Reconstruct the normalized URL
      const protocol = urlObj.protocol.toLowerCase();
      const normalizedUrl = `${protocol}//${hostname}${pathname}`;
      const queryString = searchParams.toString();

      return queryString ? `${normalizedUrl}?${queryString}` : normalizedUrl;
    } catch (error) {
      // If URL parsing fails, return the original URL in lowercase and trimmed
      return url.toLowerCase().trim();
    }
  }

  /**
   * Detect and return information about duplicate feeds in a collection
   * Useful for reporting duplicate detection results
   */
  static detectDuplicates(feeds: FeedSource[]): {
    duplicates: Array<{
      originalFeed: FeedSource;
      duplicateOf: FeedSource;
      normalizedUrl: string;
    }>;
    uniqueFeeds: FeedSource[];
    duplicateCount: number;
  } {
    const urlToFeed = new Map<string, FeedSource>();
    const duplicates: Array<{
      originalFeed: FeedSource;
      duplicateOf: FeedSource;
      normalizedUrl: string;
    }> = [];
    const uniqueFeeds: FeedSource[] = [];

    for (const feed of feeds) {
      const normalizedUrl = this.normalizeUrl(feed.url);
      const existingFeed = urlToFeed.get(normalizedUrl);

      if (existingFeed) {
        // This is a duplicate
        duplicates.push({
          originalFeed: feed,
          duplicateOf: existingFeed,
          normalizedUrl,
        });
      } else {
        // This is unique
        urlToFeed.set(normalizedUrl, feed);
        uniqueFeeds.push(feed);
      }
    }

    return {
      duplicates,
      uniqueFeeds,
      duplicateCount: duplicates.length,
    };
  }
}
