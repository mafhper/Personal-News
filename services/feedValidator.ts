/**
 * feedValidator.ts
 *
 * Enhanced RSS/Atom feed validation service with improved error handling,
 * retry logic, detailed validation attempt tracking, and CORS proxy management
 *
 * @author Personal News Dashboard
 * @version 2.1.0
 */

import { proxyManager } from "./proxyManager";
import { smartValidationCache } from "./smartValidationCache";
import {
  feedDiscoveryService,
  type DiscoveredFeed,
  type FeedDiscoveryResult,
} from "./feedDiscoveryService";

// Enhanced error classification system
export enum ValidationErrorType {
  NETWORK_ERROR = "network_error",
  CORS_ERROR = "cors_error",
  TIMEOUT_ERROR = "timeout_error",
  PARSE_ERROR = "parse_error",
  INVALID_FORMAT = "invalid_format",
  NOT_FOUND = "not_found",
  SERVER_ERROR = "server_error",
  UNKNOWN_ERROR = "unknown_error",
}

export interface ValidationError {
  type: ValidationErrorType;
  message: string;
  originalError?: Error;
  suggestions: string[];
  retryable: boolean;
  context?: {
    url?: string;
    method?: string;
    attempt?: number;
    statusCode?: number;
  };
}

export interface ValidationAttempt {
  attemptNumber: number;
  timestamp: number;
  method: "direct" | "retry" | "proxy";
  success: boolean;
  error?: ValidationError;
  responseTime?: number;
  statusCode?: number;
  retryDelay?: number;
  proxyUsed?: string;
}

export interface FeedValidationResult {
  url: string;
  isValid: boolean;
  status:
    | "valid"
    | "invalid"
    | "timeout"
    | "network_error"
    | "parse_error"
    | "checking"
    | "cors_error"
    | "not_found"
    | "server_error"
    | "discovery_required"
    | "discovery_in_progress";
  statusCode?: number;
  error?: string;
  responseTime?: number;
  lastChecked: number;
  title?: string;
  description?: string;
  // Enhanced fields
  validationAttempts: ValidationAttempt[];
  finalError?: ValidationError;
  suggestions: string[];
  totalRetries: number;
  totalValidationTime: number;
  // Discovery integration fields
  discoveredFeeds?: DiscoveredFeed[];
  discoveryResult?: FeedDiscoveryResult;
  finalMethod?: "direct" | "proxy" | "discovery";
  requiresUserSelection?: boolean;
}

export interface FeedValidationSummary {
  total: number;
  valid: number;
  invalid: number;
  checking: number;
  lastValidation: number;
}

class FeedValidatorService {
  private readonly INITIAL_TIMEOUT_MS = 5000;
  private readonly MAX_RETRIES = 3;
  private readonly BASE_RETRY_DELAY = 1000; // 1 second base delay

  /**
   * Enhanced feed validation with discovery integration
   * This method attempts discovery when direct validation fails
   */
  async validateFeedWithDiscovery(
    url: string,
    progressCallback?: (status: string, progress: number) => void
  ): Promise<FeedValidationResult> {
    const validationStartTime = Date.now();

    // Check cache first
    const cached = this.getCachedResult(url);
    if (cached && !cached.requiresUserSelection) {
      return cached;
    }

    const result: FeedValidationResult = {
      url,
      isValid: false,
      status: "checking",
      lastChecked: Date.now(),
      responseTime: 0,
      validationAttempts: [],
      suggestions: [],
      totalRetries: 0,
      totalValidationTime: 0,
    };

    progressCallback?.("Starting validation...", 10);

    // First attempt: Try direct validation
    const directResult = await this.validateFeed(url);
    result.validationAttempts = directResult.validationAttempts;
    result.totalRetries = directResult.totalRetries;

    if (directResult.isValid) {
      // Direct validation succeeded
      result.isValid = true;
      result.status = "valid";
      result.title = directResult.title;
      result.description = directResult.description;
      result.finalMethod = "direct";
      result.suggestions = directResult.suggestions;
      result.responseTime = directResult.responseTime;
      result.statusCode = directResult.statusCode;

      progressCallback?.("Validation successful", 100);

      result.totalValidationTime = Date.now() - validationStartTime;
      result.lastChecked = Date.now();

      // Cache the result
      const cacheKey = `validation:${url}`;
      smartValidationCache.set(cacheKey, result);

      return result;
    }

    progressCallback?.("Direct validation failed, attempting discovery...", 30);

    // Direct validation failed, attempt feed discovery
    result.status = "discovery_in_progress";

    try {
      const discoveryResult = await feedDiscoveryService.discoverFromWebsite(
        url
      );
      result.discoveryResult = discoveryResult;
      result.discoveredFeeds = discoveryResult.discoveredFeeds;

      progressCallback?.("Discovery completed", 70);

      if (discoveryResult.discoveredFeeds.length === 0) {
        // No feeds discovered - this should be treated as invalid
        result.status = "invalid";
        result.error =
          "Feed discovery failed: No RSS feeds found on this website";
        result.suggestions = [
          "Direct validation failed and feed discovery also failed",
          "No RSS feeds were found on this website",
          "Try checking if the website provides RSS feeds",
          "Look for 'RSS', 'Feed', or 'Subscribe' links on the website",
          ...discoveryResult.suggestions,
        ];
        result.finalMethod = "discovery";
        result.finalError = directResult.finalError || {
          type: ValidationErrorType.NOT_FOUND,
          message: "Feed discovery failed: No RSS feeds found on this website",
          suggestions: [
            "Direct validation failed and feed discovery also failed",
            "No RSS feeds were found on this website",
            "Try checking if the website provides RSS feeds",
            "Look for 'RSS', 'Feed', or 'Subscribe' links on the website",
          ],
          retryable: false,
          context: { url, method: "discovery" },
        };
      } else if (discoveryResult.discoveredFeeds.length === 1) {
        // Single feed discovered, validate it automatically
        const discoveredFeed = discoveryResult.discoveredFeeds[0];

        progressCallback?.("Validating discovered feed...", 90);

        const discoveredValidation = await this.validateFeed(
          discoveredFeed.url
        );

        if (discoveredValidation.isValid) {
          // Successfully validated discovered feed
          result.isValid = true;
          result.status = "valid";
          result.title = discoveredValidation.title || discoveredFeed.title;
          result.description =
            discoveredValidation.description || discoveredFeed.description;
          result.finalMethod = "discovery";
          result.suggestions = [
            `Feed discovered and validated from ${url}`,
            `Using discovered feed: ${discoveredFeed.url}`,
            `Discovery method: ${discoveredFeed.discoveryMethod}`,
            ...discoveryResult.suggestions,
          ];

          // Update the URL to the discovered feed URL for future reference
          result.url = discoveredFeed.url;

          // Ensure finalMethod is not overwritten
          result.finalMethod = "discovery";
        } else {
          // Discovered feed is also invalid
          result.status = "invalid";
          result.error = `Discovered feed is invalid: ${discoveredValidation.error}`;
          result.suggestions = [
            "A feed was discovered but it's not valid",
            `Discovered feed URL: ${discoveredFeed.url}`,
            ...discoveredValidation.suggestions,
            ...discoveryResult.suggestions,
          ];
          result.finalMethod = "discovery";
        }
      } else {
        // Multiple feeds discovered, requires user selection
        result.status = "discovery_required";
        result.requiresUserSelection = true;
        result.error = `Found ${discoveryResult.discoveredFeeds.length} RSS feeds - user selection required`;
        result.suggestions = [
          `Found ${discoveryResult.discoveredFeeds.length} RSS feeds on this website`,
          "Please select which feed you want to add",
          ...discoveryResult.suggestions,
        ];
        result.finalMethod = "discovery";
        result.finalError = directResult.finalError;
      }

      progressCallback?.("Discovery process completed", 100);
    } catch (discoveryError: any) {
      // Discovery failed - this should be treated as invalid, not discovery_required
      result.status = "invalid";
      result.error = `Feed discovery failed: ${discoveryError.message}`;
      result.suggestions = [
        "Direct validation failed and feed discovery also failed",
        "The URL might not be a valid website or RSS feed",
        "Please check the URL and try again",
        ...directResult.suggestions,
      ];
      result.finalMethod = "discovery";
      result.finalError = directResult.finalError || {
        type: ValidationErrorType.UNKNOWN_ERROR,
        message: `Feed discovery failed: ${discoveryError.message}`,
        originalError: discoveryError,
        suggestions: [
          "Direct validation failed and feed discovery also failed",
          "The URL might not be a valid website or RSS feed",
          "Please check the URL and try again",
        ],
        retryable: false,
        context: { url, method: "discovery" },
      };

      progressCallback?.("Discovery failed", 100);
    }

    result.totalValidationTime = Date.now() - validationStartTime;
    result.lastChecked = Date.now();

    // Cache the result
    const cacheKey = `validation:${url}`;
    smartValidationCache.set(cacheKey, result);

    return result;
  }

  /**
   * Enhanced feed validation with retry logic, proxy fallback, and detailed error tracking
   */
  async validateFeed(url: string): Promise<FeedValidationResult> {
    const validationStartTime = Date.now();

    // Check cache first
    const cached = this.getCachedResult(url);
    if (cached) {
      // Update responseTime for cached results to ensure it's always > 0
      if (cached.responseTime === 0) {
        cached.responseTime = 1; // Minimal response time for cached results
      }
      return cached;
    }

    const result: FeedValidationResult = {
      url,
      isValid: false,
      status: "checking",
      lastChecked: Date.now(),
      responseTime: 0,
      validationAttempts: [],
      suggestions: [],
      totalRetries: 0,
      totalValidationTime: 0,
    };

    let lastError: ValidationError | undefined;

    // First, attempt direct validation with exponential backoff retry
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      const attemptStartTime = Date.now();

      try {
        const attemptResult = await this.attemptValidation(url, attempt);

        const attemptRecord: ValidationAttempt = {
          attemptNumber: attempt,
          timestamp: attemptStartTime,
          method: attempt === 1 ? "direct" : "retry",
          success: attemptResult.success,
          responseTime: Date.now() - attemptStartTime,
          statusCode: attemptResult.statusCode,
        };

        if (attemptResult.success && attemptResult.feedData) {
          // Success case
          result.isValid = true;
          result.status = "valid";
          result.title = attemptResult.feedData.title;
          result.description = attemptResult.feedData.description;
          result.statusCode = attemptResult.statusCode;
          result.responseTime = Date.now() - attemptStartTime;
          result.suggestions = ["Feed validated successfully"];

          attemptRecord.success = true;
          attemptRecord.responseTime = result.responseTime;
          result.validationAttempts.push(attemptRecord);
          break;
        } else {
          // Failure case - record attempt and prepare for retry
          lastError = attemptResult.error!;
          attemptRecord.error = lastError;
          result.validationAttempts.push(attemptRecord);

          // Check if we should retry
          if (attempt < this.MAX_RETRIES && lastError.retryable) {
            const retryDelay = this.calculateRetryDelay(attempt);
            attemptRecord.retryDelay = retryDelay;
            result.totalRetries++;

            // Wait before next attempt
            await this.delay(retryDelay);
          } else {
            // If not retryable, break out of the retry loop
            if (!lastError.retryable) {
              break;
            }
          }
        }
      } catch (error: any) {
        // Unexpected error during attempt
        const validationError = this.classifyError(error, url, attempt);
        lastError = validationError;

        const attemptRecord: ValidationAttempt = {
          attemptNumber: attempt,
          timestamp: attemptStartTime,
          method: attempt === 1 ? "direct" : "retry",
          success: false,
          error: validationError,
          responseTime: Date.now() - attemptStartTime,
        };

        result.validationAttempts.push(attemptRecord);

        if (attempt < this.MAX_RETRIES && validationError.retryable) {
          const retryDelay = this.calculateRetryDelay(attempt);
          attemptRecord.retryDelay = retryDelay;
          result.totalRetries++;
          await this.delay(retryDelay);
        } else {
          // If not retryable, break out of the retry loop
          if (!validationError.retryable) {
            break;
          }
        }
      }
    }

    // If direct validation failed, try proxy validation for network-related errors
    if (
      !result.isValid &&
      lastError &&
      (lastError.type === ValidationErrorType.CORS_ERROR ||
        lastError.type === ValidationErrorType.NETWORK_ERROR ||
        lastError.type === ValidationErrorType.TIMEOUT_ERROR)
    ) {
      try {
        const proxyResult = await this.attemptProxyValidation(url);

        const proxyAttemptRecord: ValidationAttempt = {
          attemptNumber: result.validationAttempts.length + 1,
          timestamp: Date.now(),
          method: "proxy",
          success: proxyResult.success,
          responseTime: proxyResult.responseTime,
          proxyUsed: proxyResult.proxyUsed,
        };

        if (proxyResult.success && proxyResult.feedData) {
          // Proxy validation succeeded
          result.isValid = true;
          result.status = "valid";
          result.title = proxyResult.feedData.title;
          result.description = proxyResult.feedData.description;
          result.responseTime = proxyResult.responseTime;

          proxyAttemptRecord.success = true;
          result.validationAttempts.push(proxyAttemptRecord);

          // Update suggestions to indicate proxy was used
          result.suggestions = [
            "Feed validated successfully using proxy service",
            `Used ${proxyResult.proxyUsed} proxy to bypass CORS restrictions`,
          ];
        } else {
          // Proxy validation also failed
          proxyAttemptRecord.error = proxyResult.error;
          result.validationAttempts.push(proxyAttemptRecord);

          // Keep the original error but add proxy failure info
          if (proxyResult.error) {
            lastError = proxyResult.error;
          }
        }
      } catch (error: any) {
        // Proxy validation threw an exception
        const proxyError = this.classifyError(
          error,
          url,
          result.validationAttempts.length + 1
        );

        const proxyAttemptRecord: ValidationAttempt = {
          attemptNumber: result.validationAttempts.length + 1,
          timestamp: Date.now(),
          method: "proxy",
          success: false,
          error: proxyError,
          responseTime: 0,
        };

        result.validationAttempts.push(proxyAttemptRecord);
      }
    }

    // Set final result based on last attempt
    if (!result.isValid) {
      if (lastError) {
        result.finalError = lastError;
        result.status = this.mapErrorTypeToStatus(lastError.type);
        result.error = lastError.message;
        result.suggestions = lastError.suggestions;
      } else {
        // Fallback if no error was set (shouldn't happen, but just in case)
        result.status = "invalid";
        result.error = "Validation failed for unknown reason";
        result.suggestions = ["Please try again or check the feed URL"];
      }
    }

    result.totalValidationTime = Date.now() - validationStartTime;
    result.lastChecked = Date.now();

    // Ensure responseTime is always set to a positive value
    if (result.responseTime === 0) {
      result.responseTime = result.totalValidationTime;
    }

    // Cache the result using SmartValidationCache
    const cacheKey = `validation:${url}`;
    smartValidationCache.set(cacheKey, result);

    return result;
  }

  /**
   * Attempt proxy validation using the ProxyManager
   */
  private async attemptProxyValidation(url: string): Promise<{
    success: boolean;
    feedData?: { title: string; description: string };
    responseTime: number;
    proxyUsed?: string;
    error?: ValidationError;
  }> {
    const startTime = Date.now();

    try {
      const proxyResult = await proxyManager.tryProxiesWithFailover(url);
      const responseTime = Date.now() - startTime;

      // Validate the content received from proxy
      const feedValidation = this.validateFeedContent(proxyResult.content);

      if (feedValidation.isValid) {
        return {
          success: true,
          feedData: {
            title: feedValidation.title || "",
            description: feedValidation.description || "",
          },
          responseTime,
          proxyUsed: proxyResult.proxyUsed,
        };
      } else {
        return {
          success: false,
          responseTime,
          proxyUsed: proxyResult.proxyUsed,
          error: {
            type: ValidationErrorType.PARSE_ERROR,
            message:
              feedValidation.error || "Invalid feed format received from proxy",
            suggestions: [
              "The proxy returned content, but it's not a valid RSS/Atom feed",
              "Check if the URL points to a valid RSS or Atom feed",
              "The feed content might be corrupted during proxy transmission",
            ],
            retryable: false,
            context: {
              url,
              method: "proxy",
            },
          },
        };
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      return {
        success: false,
        responseTime,
        error: {
          type: ValidationErrorType.NETWORK_ERROR,
          message: `Proxy validation failed: ${error.message}`,
          originalError: error,
          suggestions: [
            "All proxy services failed to access the feed",
            "The feed server might be blocking proxy requests",
            "Try again later or check if the feed URL is correct",
          ],
          retryable: true,
          context: {
            url,
            method: "proxy",
          },
        },
      };
    }
  }

  /**
   * Attempt a single validation without retry logic
   */
  private async attemptValidation(
    url: string,
    attemptNumber: number
  ): Promise<{
    success: boolean;
    feedData?: { title: string; description: string };
    statusCode?: number;
    error?: ValidationError;
  }> {
    const timeout = this.INITIAL_TIMEOUT_MS + (attemptNumber - 1) * 1000; // Increase timeout with attempts

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          Accept:
            "application/rss+xml, application/atom+xml, application/xml, text/xml",
          "User-Agent": "Personal News Dashboard Feed Validator/2.0",
        },
      });

      clearTimeout(timeoutId);

      if (response.status === 200) {
        const text = await response.text();
        const feedValidation = this.validateFeedContent(text);

        if (feedValidation.isValid) {
          return {
            success: true,
            feedData: {
              title: feedValidation.title || "",
              description: feedValidation.description || "",
            },
            statusCode: response.status,
          };
        } else {
          return {
            success: false,
            statusCode: response.status,
            error: {
              type: ValidationErrorType.PARSE_ERROR,
              message: feedValidation.error || "Invalid feed format",
              suggestions: [
                "Check if the URL points to a valid RSS or Atom feed",
                "Verify the feed content is properly formatted XML",
              ],
              retryable: false,
              context: {
                url,
                attempt: attemptNumber,
                statusCode: response.status,
              },
            },
          };
        }
      } else {
        const errorType = this.getErrorTypeFromStatus(response.status);
        return {
          success: false,
          statusCode: response.status,
          error: {
            type: errorType,
            message: `HTTP ${response.status}: ${response.statusText}`,
            suggestions: this.getSuggestionsForStatusCode(response.status),
            retryable: this.isRetryableStatusCode(response.status),
            context: {
              url,
              attempt: attemptNumber,
              statusCode: response.status,
            },
          },
        };
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        return {
          success: false,
          error: {
            type: ValidationErrorType.TIMEOUT_ERROR,
            message: `Request timed out after ${timeout}ms`,
            suggestions: [
              "The server might be slow or overloaded",
              "Try again later when the server might be more responsive",
              "Check if the URL is correct and accessible",
            ],
            retryable: true,
            context: { url, attempt: attemptNumber },
          },
        };
      } else {
        return {
          success: false,
          error: this.classifyError(error, url, attemptNumber),
        };
      }
    }
  }

  /**
   * Calculate exponential backoff delay for retries
   */
  private calculateRetryDelay(attemptNumber: number): number {
    // Exponential backoff: base_delay * (2 ^ (attempt - 1)) + jitter
    const exponentialDelay =
      this.BASE_RETRY_DELAY * Math.pow(2, attemptNumber - 1);
    const jitter = Math.random() * 500; // Add up to 500ms jitter
    return Math.min(exponentialDelay + jitter, 10000); // Cap at 10 seconds
  }

  /**
   * Delay execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Classify errors into specific types with appropriate suggestions
   */
  private classifyError(
    error: Error,
    url: string,
    attemptNumber: number
  ): ValidationError {
    const errorMessage = error.message.toLowerCase();

    if (
      errorMessage.includes("cors") ||
      errorMessage.includes("cross-origin") ||
      errorMessage.includes("cross origin")
    ) {
      return {
        type: ValidationErrorType.CORS_ERROR,
        message: "CORS policy prevents direct access to this feed",
        originalError: error,
        suggestions: [
          "The feed server doesn't allow direct browser access",
          "This is a common issue with RSS feeds",
          "The system will try alternative methods to access the feed",
        ],
        retryable: false,
        context: { url, attempt: attemptNumber },
      };
    }

    if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
      return {
        type: ValidationErrorType.NETWORK_ERROR,
        message: "Network error occurred while fetching the feed",
        originalError: error,
        suggestions: [
          "Check your internet connection",
          "The server might be temporarily unavailable",
          "Try again in a few moments",
        ],
        retryable: true,
        context: { url, attempt: attemptNumber },
      };
    }

    if (errorMessage.includes("timeout") || errorMessage.includes("aborted")) {
      return {
        type: ValidationErrorType.TIMEOUT_ERROR,
        message: "Request timed out",
        originalError: error,
        suggestions: [
          "The server is taking too long to respond",
          "Try again later when the server might be more responsive",
        ],
        retryable: true,
        context: { url, attempt: attemptNumber },
      };
    }

    return {
      type: ValidationErrorType.UNKNOWN_ERROR,
      message: error.message || "An unknown error occurred",
      originalError: error,
      suggestions: [
        "An unexpected error occurred",
        "Please try again or check the feed URL",
      ],
      retryable: true,
      context: { url, attempt: attemptNumber },
    };
  }

  /**
   * Map error types to status strings
   */
  private mapErrorTypeToStatus(
    errorType: ValidationErrorType
  ): FeedValidationResult["status"] {
    switch (errorType) {
      case ValidationErrorType.NETWORK_ERROR:
        return "network_error";
      case ValidationErrorType.CORS_ERROR:
        return "cors_error";
      case ValidationErrorType.TIMEOUT_ERROR:
        return "timeout";
      case ValidationErrorType.PARSE_ERROR:
        return "parse_error";
      case ValidationErrorType.NOT_FOUND:
        return "not_found";
      case ValidationErrorType.SERVER_ERROR:
        return "server_error";
      case ValidationErrorType.INVALID_FORMAT:
        return "parse_error";
      default:
        return "invalid";
    }
  }

  /**
   * Get error type from HTTP status code
   */
  private getErrorTypeFromStatus(statusCode: number): ValidationErrorType {
    if (statusCode === 404) {
      return ValidationErrorType.NOT_FOUND;
    } else if (statusCode >= 500) {
      return ValidationErrorType.SERVER_ERROR;
    } else if (statusCode === 403 || statusCode === 401) {
      return ValidationErrorType.CORS_ERROR;
    } else {
      return ValidationErrorType.NETWORK_ERROR;
    }
  }

  /**
   * Get suggestions based on HTTP status code
   */
  private getSuggestionsForStatusCode(statusCode: number): string[] {
    switch (statusCode) {
      case 404:
        return [
          "The feed URL was not found on the server",
          "Check if the URL is correct",
          "The feed might have been moved or removed",
        ];
      case 403:
        return [
          "Access to this feed is forbidden",
          "The server might require authentication",
          "Try accessing the website directly to check if it's available",
        ];
      case 401:
        return [
          "Authentication is required to access this feed",
          "The feed might be private or require login",
        ];
      case 500:
      case 502:
      case 503:
      case 504:
        return [
          "The server is experiencing issues",
          "Try again later when the server might be working properly",
          "This is a temporary server problem",
        ];
      default:
        return [
          "An HTTP error occurred",
          "Check if the URL is correct and accessible",
        ];
    }
  }

  /**
   * Check if a status code indicates a retryable error
   */
  private isRetryableStatusCode(statusCode: number): boolean {
    // Retry on server errors and some client errors, but not on 404 or auth errors
    return statusCode >= 500 || statusCode === 408 || statusCode === 429;
  }

  /**
   * Validate a specific discovered feed (used when user selects from multiple options)
   */
  async validateDiscoveredFeed(
    discoveredFeed: DiscoveredFeed,
    originalUrl: string
  ): Promise<FeedValidationResult> {
    const validationResult = await this.validateFeed(discoveredFeed.url);

    // Enhance the result with discovery information
    const enhancedResult: FeedValidationResult = {
      ...validationResult,
      finalMethod: "discovery",
      discoveredFeeds: [discoveredFeed],
      suggestions: [
        `Feed selected from discovery results for ${originalUrl}`,
        `Discovery method: ${discoveredFeed.discoveryMethod}`,
        `Confidence: ${Math.round(discoveredFeed.confidence * 100)}%`,
        ...validationResult.suggestions,
      ],
    };

    // Cache the result with the original URL as key for future reference
    const cacheKey = `validation:${originalUrl}`;
    smartValidationCache.set(cacheKey, enhancedResult);

    return enhancedResult;
  }

  /**
   * Valida múltiplos feeds em paralelo
   */
  async validateFeeds(urls: string[]): Promise<FeedValidationResult[]> {
    const promises = urls.map((url) => this.validateFeed(url));
    return Promise.all(promises);
  }

  /**
   * Get validation history for a specific feed
   */
  getValidationHistory(url: string): ValidationAttempt[] {
    const result = this.getCachedResult(url);
    return result?.validationAttempts || [];
  }

  /**
   * Get detailed validation statistics
   */
  getValidationStats(url: string): {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    averageResponseTime: number;
    totalRetries: number;
    lastValidation: number;
  } | null {
    const result = this.getCachedResult(url);
    if (!result) return null;

    const attempts = result.validationAttempts;
    const successfulAttempts = attempts.filter((a) => a.success).length;
    const avgResponseTime =
      attempts.length > 0
        ? attempts.reduce((sum, a) => sum + (a.responseTime || 0), 0) /
          attempts.length
        : 0;

    return {
      totalAttempts: attempts.length,
      successfulAttempts,
      failedAttempts: attempts.length - successfulAttempts,
      averageResponseTime: Math.round(avgResponseTime),
      totalRetries: result.totalRetries,
      lastValidation: result.lastChecked,
    };
  }

  /**
   * Validate feed content with intelligent cleanup and parsing improvements
   */
  private validateFeedContent(content: string): {
    isValid: boolean;
    title?: string;
    description?: string;
    error?: string;
    feedType?: "rss" | "atom" | "rdf";
    cleanupApplied?: boolean;
  } {
    try {
      // First attempt: try parsing the content as-is
      let parseResult = this.attemptFeedParsing(content);

      if (parseResult.isValid) {
        return parseResult;
      }

      // Second attempt: apply content cleanup and try again
      const cleanedContent = this.cleanupFeedContent(content);
      if (cleanedContent !== content) {
        parseResult = this.attemptFeedParsing(cleanedContent);
        if (parseResult.isValid) {
          return {
            ...parseResult,
            cleanupApplied: true,
          };
        }
      }

      // If both attempts failed, return the original error
      return parseResult;
    } catch (error: any) {
      return {
        isValid: false,
        error: `Error processing content: ${error.message}`,
      };
    }
  }

  /**
   * Attempt to parse feed content with namespace-aware parsing
   */
  private attemptFeedParsing(content: string): {
    isValid: boolean;
    title?: string;
    description?: string;
    error?: string;
    feedType?: "rss" | "atom" | "rdf";
  } {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, "text/xml");

      // Check for parsing errors
      const parseError = doc.querySelector("parsererror");
      if (parseError) {
        return {
          isValid: false,
          error: "Invalid XML content",
        };
      }

      // Detect feed type with namespace awareness
      const feedType = this.detectFeedType(doc);

      if (!feedType) {
        return {
          isValid: false,
          error: "Not a valid RSS, Atom, or RDF feed",
        };
      }

      // Extract feed metadata based on type
      const metadata = this.extractFeedMetadata(doc, feedType);

      return {
        isValid: true,
        title: metadata.title,
        description: metadata.description,
        feedType,
      };
    } catch (error: any) {
      return {
        isValid: false,
        error: `Error parsing feed: ${error.message}`,
      };
    }
  }

  /**
   * Detect feed type with namespace-aware logic
   */
  private detectFeedType(doc: Document): "rss" | "atom" | "rdf" | null {
    const rootElement = doc.documentElement;

    if (!rootElement) {
      return null;
    }

    const tagName = rootElement.tagName.toLowerCase();
    const namespaceURI = rootElement.namespaceURI;

    // RSS 2.0 detection
    if (tagName === "rss") {
      return "rss";
    }

    // Atom feed detection (namespace-aware)
    if (tagName === "feed") {
      if (
        namespaceURI === "http://www.w3.org/2005/Atom" ||
        rootElement.getAttribute("xmlns") === "http://www.w3.org/2005/Atom" ||
        rootElement.getAttribute("xmlns")?.includes("atom")
      ) {
        return "atom";
      }
    }

    // RSS 1.0 (RDF) detection (namespace-aware)
    if (tagName === "rdf:rdf" || tagName === "rdf") {
      return "rdf";
    }

    // Additional RDF detection by checking for RDF namespace
    if (
      namespaceURI === "http://www.w3.org/1999/02/22-rdf-syntax-ns#" ||
      rootElement.getAttribute("xmlns:rdf") ===
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    ) {
      return "rdf";
    }

    // Fallback: check for RSS channel element
    if (doc.querySelector("channel")) {
      return "rss";
    }

    // Fallback: check for RDF channel with RSS namespace
    if (
      doc.querySelector("channel[*|about]") ||
      doc.querySelector("[*|about]") ||
      rootElement.getAttribute("xmlns")?.includes("rss")
    ) {
      return "rdf";
    }

    return null;
  }

  /**
   * Extract feed metadata based on feed type with namespace-aware selectors
   */
  private extractFeedMetadata(
    doc: Document,
    feedType: "rss" | "atom" | "rdf"
  ): {
    title: string;
    description: string;
  } {
    let title = "";
    let description = "";

    try {
      switch (feedType) {
        case "rss":
          // RSS 2.0 metadata extraction
          title = this.getTextContent(doc, [
            "channel > title",
            "rss > channel > title",
            "title",
          ]);
          description = this.getTextContent(doc, [
            "channel > description",
            "rss > channel > description",
            "description",
          ]);
          break;

        case "atom":
          // Atom feed metadata extraction with namespace handling
          title = this.getTextContent(doc, [
            "feed > title",
            "*|feed > *|title",
            "title",
          ]);
          description = this.getTextContent(doc, [
            "feed > subtitle",
            "*|feed > *|subtitle",
            "subtitle",
            "feed > summary",
            "*|feed > *|summary",
            "summary",
          ]);
          break;

        case "rdf":
          // RSS 1.0 (RDF) metadata extraction with namespace handling
          title = this.getTextContent(doc, [
            "channel > title",
            "*|channel > *|title",
            "[*|about] > title",
            "[*|about] > *|title",
            "title",
          ]);
          description = this.getTextContent(doc, [
            "channel > description",
            "*|channel > *|description",
            "[*|about] > description",
            "[*|about] > *|description",
            "description",
          ]);
          break;
      }
    } catch (error) {
      // If namespace-aware extraction fails, fall back to simple extraction
      title = doc.querySelector("title")?.textContent || "";
      description =
        doc.querySelector("description, subtitle, summary")?.textContent || "";
    }

    return {
      title: this.cleanText(title),
      description: this.cleanText(description),
    };
  }

  /**
   * Get text content using multiple selector fallbacks
   */
  private getTextContent(doc: Document, selectors: string[]): string {
    for (const selector of selectors) {
      try {
        const element = doc.querySelector(selector);
        if (element?.textContent?.trim()) {
          return element.textContent.trim();
        }
      } catch (error) {
        // Continue to next selector if this one fails
        continue;
      }
    }
    return "";
  }

  /**
   * Clean and sanitize text content
   */
  private cleanText(text: string): string {
    if (!text) return "";

    return text
      .trim()
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/[\r\n\t]/g, " ") // Remove line breaks and tabs
      .replace(/&lt;/g, "<") // Decode common HTML entities
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .substring(0, 500); // Limit length to prevent memory issues
  }

  /**
   * Clean up malformed RSS feed content
   */
  private cleanupFeedContent(content: string): string {
    let cleaned = content;

    try {
      // Remove BOM (Byte Order Mark) if present
      if (cleaned.charCodeAt(0) === 0xfeff) {
        cleaned = cleaned.slice(1);
      }

      // Fix common XML declaration issues
      cleaned = this.fixXMLDeclaration(cleaned);

      // Fix common namespace issues
      cleaned = this.fixNamespaceIssues(cleaned);

      // Fix common encoding issues
      cleaned = this.fixEncodingIssues(cleaned);

      // Fix malformed CDATA sections
      cleaned = this.fixCDATASections(cleaned);

      // Fix unclosed tags (basic cleanup)
      cleaned = this.fixUnClosedTags(cleaned);

      // Remove invalid characters
      cleaned = this.removeInvalidXMLCharacters(cleaned);

      // Fix common RSS structure issues
      cleaned = this.fixRSSStructureIssues(cleaned);
    } catch (error) {
      // If cleanup fails, return original content
      return content;
    }

    return cleaned;
  }

  /**
   * Fix XML declaration issues
   */
  private fixXMLDeclaration(content: string): string {
    // Remove multiple XML declarations
    const xmlDeclRegex = /<\?xml[^>]*\?>/gi;
    const matches = content.match(xmlDeclRegex);

    if (matches && matches.length > 1) {
      // Keep only the first XML declaration
      content = content.replace(xmlDeclRegex, "");
      content = matches[0] + "\n" + content;
    }

    // Fix XML declaration without proper encoding
    if (content.includes("<?xml") && !content.includes("encoding=")) {
      content = content.replace(
        /<\?xml([^>]*)\?>/i,
        '<?xml$1 encoding="UTF-8"?>'
      );
    }

    return content;
  }

  /**
   * Fix common namespace issues
   */
  private fixNamespaceIssues(content: string): string {
    // Add missing RSS namespace for RSS 1.0 feeds
    if (content.includes("<rdf:RDF") && !content.includes("xmlns:rss=")) {
      content = content.replace(
        "<rdf:RDF",
        '<rdf:RDF xmlns:rss="http://purl.org/rss/1.0/"'
      );
    }

    // Add missing RDF namespace
    if (content.includes("<rdf:") && !content.includes("xmlns:rdf=")) {
      content = content.replace(
        /<(rdf:RDF|RDF)/,
        '<$1 xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"'
      );
    }

    // Fix Atom namespace issues
    if (
      content.includes("<feed") &&
      !content.includes("xmlns=") &&
      (content.includes("<entry") || content.includes("<title"))
    ) {
      content = content.replace(
        "<feed",
        '<feed xmlns="http://www.w3.org/2005/Atom"'
      );
    }

    return content;
  }

  /**
   * Fix common encoding issues
   */
  private fixEncodingIssues(content: string): string {
    // Fix common encoding problems
    const encodingFixes = [
      // Fix smart quotes
      [/[\u2018\u2019]/g, "'"],
      [/[\u201C\u201D]/g, '"'],
      // Fix em dashes
      [/[\u2013\u2014]/g, "-"],
      // Fix ellipsis
      [/\u2026/g, "..."],
      // Fix non-breaking spaces
      [/\u00A0/g, " "],
    ];

    for (const [regex, replacement] of encodingFixes) {
      content = content.replace(regex, replacement as string);
    }

    return content;
  }

  /**
   * Fix malformed CDATA sections
   */
  private fixCDATASections(content: string): string {
    // Fix unclosed CDATA sections
    content = content.replace(
      /<!\[CDATA\[([^]*?)(?:\]\]>|$)/g,
      (match, cdataContent) => {
        if (match.endsWith("]]>")) {
          return match; // Already properly closed
        }
        return `<![CDATA[${cdataContent}]]>`;
      }
    );

    // Fix nested CDATA sections
    content = content.replace(
      /<!\[CDATA\[([^]*?)<!\[CDATA\[([^]*?)\]\]>([^]*?)\]\]>/g,
      "<![CDATA[$1$2$3]]>"
    );

    return content;
  }

  /**
   * Fix basic unclosed tag issues
   */
  private fixUnClosedTags(content: string): string {
    // This is a basic implementation - more sophisticated tag matching would require a full parser
    const selfClosingTags = ["br", "hr", "img", "input", "meta", "link"];

    for (const tag of selfClosingTags) {
      // Convert unclosed self-closing tags to proper format
      const regex = new RegExp(`<${tag}([^>]*[^/])>`, "gi");
      content = content.replace(regex, `<${tag}$1/>`);
    }

    return content;
  }

  /**
   * Remove invalid XML characters
   */
  private removeInvalidXMLCharacters(content: string): string {
    // Remove control characters except tab, newline, and carriage return
    // XML 1.0 valid characters: #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
    return content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  }

  /**
   * Fix common RSS structure issues
   */
  private fixRSSStructureIssues(content: string): string {
    // Ensure RSS feeds have proper channel structure
    if (content.includes("<rss") && !content.includes("<channel")) {
      // If RSS tag exists but no channel, wrap content in channel
      content = content.replace(
        /(<rss[^>]*>)([\s\S]*?)(<\/rss>)/,
        "$1<channel>$2</channel>$3"
      );
    }

    // Fix missing RSS version attribute
    if (content.includes("<rss") && !content.includes("version=")) {
      content = content.replace("<rss", '<rss version="2.0"');
    }

    return content;
  }

  /**
   * Obter resultado do cache se ainda válido
   */
  private getCachedResult(url: string): FeedValidationResult | null {
    const cacheKey = `validation:${url}`;
    const cached = smartValidationCache.get<FeedValidationResult>(cacheKey);
    return cached?.data || null;
  }

  /**
   * Limpar cache de validação
   */
  clearCache(): void {
    smartValidationCache.invalidatePattern("validation:*");
  }

  /**
   * Get cache statistics for validation results
   */
  getCacheStats() {
    return smartValidationCache.getStats();
  }

  /**
   * Manually refresh a cached validation result
   */
  refreshCachedResult(url: string): boolean {
    const cacheKey = `validation:${url}`;
    return smartValidationCache.refresh(cacheKey);
  }

  /**
   * Obter resumo da validação
   */
  getValidationSummary(urls: string[]): FeedValidationSummary {
    const results = urls
      .map((url) => this.getCachedResult(url))
      .filter(Boolean) as FeedValidationResult[];

    return {
      total: urls.length,
      valid: results.filter((r) => r.status === "valid").length,
      invalid: results.filter(
        (r) => r.status !== "valid" && r.status !== "checking"
      ).length,
      checking: results.filter((r) => r.status === "checking").length,
      lastValidation: Math.max(...results.map((r) => r.lastChecked), 0),
    };
  }

  /**
   * Obter status de um feed específico
   */
  getFeedStatus(url: string): FeedValidationResult | null {
    return this.getCachedResult(url);
  }

  /**
   * Forçar revalidação de um feed (limpar cache)
   */
  revalidateFeed(url: string): void {
    const cacheKey = `validation:${url}`;
    smartValidationCache.invalidate(cacheKey);
  }
}

// Instância singleton
export const feedValidator = new FeedValidatorService();

// Enhanced utility functions for components
export const getFeedStatusIcon = (
  status: FeedValidationResult["status"]
): string => {
  switch (status) {
    case "valid":
      return "✅";
    case "invalid":
      return "❌";
    case "timeout":
      return "⏱️";
    case "network_error":
      return "🌐";
    case "cors_error":
      return "🚫";
    case "not_found":
      return "🔍";
    case "server_error":
      return "🔧";
    case "parse_error":
      return "📄";
    case "checking":
      return "🔄";
    case "discovery_required":
      return "🔍";
    case "discovery_in_progress":
      return "🔄";
    default:
      return "❓";
  }
};

export const getFeedStatusColor = (
  status: FeedValidationResult["status"]
): string => {
  switch (status) {
    case "valid":
      return "text-green-500";
    case "invalid":
      return "text-red-500";
    case "timeout":
      return "text-yellow-500";
    case "network_error":
      return "text-orange-500";
    case "cors_error":
      return "text-red-400";
    case "not_found":
      return "text-gray-500";
    case "server_error":
      return "text-red-600";
    case "parse_error":
      return "text-purple-500";
    case "checking":
      return "text-blue-500";
    case "discovery_required":
      return "text-yellow-600";
    case "discovery_in_progress":
      return "text-blue-400";
    default:
      return "text-gray-500";
  }
};

export const getFeedStatusText = (
  status: FeedValidationResult["status"]
): string => {
  switch (status) {
    case "valid":
      return "Funcionando";
    case "invalid":
      return "Erro HTTP";
    case "timeout":
      return "Timeout";
    case "network_error":
      return "Erro de Rede";
    case "cors_error":
      return "Erro CORS";
    case "not_found":
      return "Não Encontrado";
    case "server_error":
      return "Erro do Servidor";
    case "parse_error":
      return "Feed Inválido";
    case "checking":
      return "Verificando...";
    case "discovery_required":
      return "Descoberta Necessária";
    case "discovery_in_progress":
      return "Descobrindo Feeds...";
    default:
      return "Não verificado";
  }
};

// New utility functions for enhanced validation features
export const getValidationSuggestions = (
  result: FeedValidationResult
): string[] => {
  return result.suggestions || [];
};

export const getValidationAttemptSummary = (
  result: FeedValidationResult
): string => {
  const attempts = result.validationAttempts.length;
  const retries = result.totalRetries;
  const totalTime = Math.round(result.totalValidationTime / 1000);

  if (attempts === 1) {
    return `Validated in ${totalTime}s`;
  } else {
    return `${attempts} attempts (${retries} retries) in ${totalTime}s`;
  }
};

export const getLastValidationError = (
  result: FeedValidationResult
): ValidationError | null => {
  return result.finalError || null;
};

export const isValidationRetryable = (
  result: FeedValidationResult
): boolean => {
  return result.finalError?.retryable || false;
};
