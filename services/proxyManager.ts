/**
 * proxyManager.ts
 *
 * Enhanced CORS proxy management system with multiple proxy configurations,
 * health monitoring, automatic failover, and performance tracking
 *
 * @author Personal News Dashboard
 * @version 1.0.0
 */

export interface ProxyConfig {
  url: string;
  name: string;
  responseTransform?: (response: string) => string;
  headers?: Record<string, string>;
  timeout?: number;
  priority: number;
  enabled: boolean;
}

export interface ProxyStats {
  success: number;
  failures: number;
  totalRequests: number;
  avgResponseTime: number;
  lastUsed: number;
  lastSuccess: number;
  lastFailure: number;
  consecutiveFailures: number;
  healthScore: number; // 0-1 score based on recent performance
}

export interface ProxyAttempt {
  proxyName: string;
  proxyUrl: string;
  targetUrl: string;
  timestamp: number;
  success: boolean;
  responseTime: number;
  error?: string;
  statusCode?: number;
}

export interface ProxyManagerConfig {
  maxRetries: number;
  healthCheckInterval: number;
  failureThreshold: number;
  recoveryThreshold: number;
  defaultTimeout: number;
}

export class ProxyManager {
  private readonly PROXY_CONFIGS: ProxyConfig[] = [
    {
      url: "https://api.allorigins.win/get?url=",
      name: "AllOrigins",
      responseTransform: (response: string) => {
        try {
          const parsed = JSON.parse(response);
          return parsed.contents || response;
        } catch {
          return response;
        }
      },
      headers: {
        Accept: "application/json",
      },
      timeout: 10000,
      priority: 1,
      enabled: true,
    },
    {
      url: "https://corsproxy.io/?",
      name: "CorsProxy.io",
      headers: {
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml",
        "User-Agent": "Personal News Dashboard/1.0",
      },
      timeout: 8000,
      priority: 2,
      enabled: true,
    },
    {
      url: "https://cors-anywhere.herokuapp.com/",
      name: "CORS Anywhere",
      headers: {
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml",
        "User-Agent": "Personal News Dashboard/1.0",
        "X-Requested-With": "XMLHttpRequest",
      },
      timeout: 12000,
      priority: 3,
      enabled: true,
    },
    {
      url: "https://api.codetabs.com/v1/proxy?quest=",
      name: "CodeTabs",
      responseTransform: (response: string) => {
        // CodeTabs sometimes wraps response in JSON
        try {
          const parsed = JSON.parse(response);
          if (parsed.data) return parsed.data;
          return response;
        } catch {
          return response;
        }
      },
      timeout: 15000,
      priority: 4,
      enabled: true,
    },
  ];

  private proxyStats = new Map<string, ProxyStats>();
  private proxyHealthCheck = new Map<string, boolean>();
  private config: ProxyManagerConfig;
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(config?: Partial<ProxyManagerConfig>) {
    this.config = {
      maxRetries: 3,
      healthCheckInterval: 5 * 60 * 1000, // 5 minutes
      failureThreshold: 3,
      recoveryThreshold: 2,
      defaultTimeout: 10000,
      ...config,
    };

    // Initialize stats for all proxies
    this.initializeProxyStats();

    // Start health monitoring
    this.startHealthMonitoring();
  }

  /**
   * Get available proxies sorted by health score and priority
   */
  getAvailableProxies(): ProxyConfig[] {
    return this.PROXY_CONFIGS.filter(
      (proxy) => proxy.enabled && this.isProxyHealthy(proxy.name)
    ).sort((a, b) => {
      const statsA = this.proxyStats.get(a.name);
      const statsB = this.proxyStats.get(b.name);

      // Sort by health score first, then by priority
      const healthScoreA = statsA?.healthScore || 0;
      const healthScoreB = statsB?.healthScore || 0;

      if (Math.abs(healthScoreA - healthScoreB) > 0.1) {
        return healthScoreB - healthScoreA; // Higher health score first
      }

      return a.priority - b.priority; // Lower priority number first
    });
  }

  /**
   * Try to fetch content through a specific proxy
   */
  async tryProxy(proxyConfig: ProxyConfig, targetUrl: string): Promise<string> {
    const startTime = Date.now();

    try {
      const proxyUrl = this.buildProxyUrl(proxyConfig, targetUrl);
      const timeout = proxyConfig.timeout || this.config.defaultTimeout;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(proxyUrl, {
        method: "GET",
        signal: controller.signal,
        headers: proxyConfig.headers || {},
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let content = await response.text();

      // Apply response transformation if configured
      if (proxyConfig.responseTransform) {
        content = proxyConfig.responseTransform(content);
      }

      // Record successful attempt
      this.recordProxyAttempt({
        proxyName: proxyConfig.name,
        proxyUrl,
        targetUrl,
        timestamp: startTime,
        success: true,
        responseTime,
        statusCode: response.status,
      });

      return content;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      // Record failed attempt
      this.recordProxyAttempt({
        proxyName: proxyConfig.name,
        proxyUrl: this.buildProxyUrl(proxyConfig, targetUrl),
        targetUrl,
        timestamp: startTime,
        success: false,
        responseTime,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Try multiple proxies with automatic failover
   */
  async tryProxiesWithFailover(targetUrl: string): Promise<{
    content: string;
    proxyUsed: string;
    attempts: ProxyAttempt[];
  }> {
    const availableProxies = this.getAvailableProxies();
    const attempts: ProxyAttempt[] = [];

    if (availableProxies.length === 0) {
      throw new Error("No healthy proxies available");
    }

    let lastError: Error | null = null;

    for (const proxy of availableProxies) {
      const startTime = Date.now();

      try {
        const content = await this.tryProxy(proxy, targetUrl);

        // Record successful attempt
        const attempt: ProxyAttempt = {
          proxyName: proxy.name,
          proxyUrl: this.buildProxyUrl(proxy, targetUrl),
          targetUrl,
          timestamp: startTime,
          success: true,
          responseTime: Date.now() - startTime,
        };
        attempts.push(attempt);

        return {
          content,
          proxyUsed: proxy.name,
          attempts,
        };
      } catch (error: any) {
        lastError = error;

        // Record failed attempt
        const attempt: ProxyAttempt = {
          proxyName: proxy.name,
          proxyUrl: this.buildProxyUrl(proxy, targetUrl),
          targetUrl,
          timestamp: startTime,
          success: false,
          responseTime: Date.now() - startTime,
          error: error.message,
        };
        attempts.push(attempt);

        // Mark proxy as potentially unhealthy if it fails
        this.markProxyStatus(proxy.name, false);

        // Continue to next proxy
        continue;
      }
    }

    // All proxies failed
    throw new Error(
      `All proxies failed. Last error: ${lastError?.message || "Unknown error"}`
    );
  }

  /**
   * Mark proxy status for health monitoring
   */
  markProxyStatus(proxyName: string, success: boolean): void {
    const stats = this.proxyStats.get(proxyName);
    if (!stats) return;

    if (success) {
      stats.consecutiveFailures = 0;
      stats.lastSuccess = Date.now();
    } else {
      stats.consecutiveFailures++;
      stats.lastFailure = Date.now();
    }

    // Update health status
    this.proxyHealthCheck.set(
      proxyName,
      stats.consecutiveFailures < this.config.failureThreshold
    );

    // Recalculate health score
    this.updateHealthScore(proxyName);
  }

  /**
   * Get proxy statistics
   */
  getProxyStats(): Map<string, ProxyStats> {
    return new Map(this.proxyStats);
  }

  /**
   * Get statistics for a specific proxy
   */
  getProxyStatsByName(proxyName: string): ProxyStats | undefined {
    return this.proxyStats.get(proxyName);
  }

  /**
   * Get overall proxy manager statistics
   */
  getOverallStats(): {
    totalProxies: number;
    healthyProxies: number;
    totalRequests: number;
    totalSuccesses: number;
    totalFailures: number;
    averageResponseTime: number;
  } {
    const stats = Array.from(this.proxyStats.values());

    return {
      totalProxies: this.PROXY_CONFIGS.length,
      healthyProxies: Array.from(this.proxyHealthCheck.values()).filter(Boolean)
        .length,
      totalRequests: stats.reduce((sum, s) => sum + s.totalRequests, 0),
      totalSuccesses: stats.reduce((sum, s) => sum + s.success, 0),
      totalFailures: stats.reduce((sum, s) => sum + s.failures, 0),
      averageResponseTime:
        stats.length > 0
          ? stats.reduce((sum, s) => sum + s.avgResponseTime, 0) / stats.length
          : 0,
    };
  }

  /**
   * Reset proxy statistics
   */
  resetStats(): void {
    this.initializeProxyStats();
  }

  /**
   * Disable a proxy
   */
  disableProxy(proxyName: string): void {
    const proxy = this.PROXY_CONFIGS.find((p) => p.name === proxyName);
    if (proxy) {
      proxy.enabled = false;
      this.proxyHealthCheck.set(proxyName, false);
    }
  }

  /**
   * Enable a proxy
   */
  enableProxy(proxyName: string): void {
    const proxy = this.PROXY_CONFIGS.find((p) => p.name === proxyName);
    if (proxy) {
      proxy.enabled = true;
      // Reset consecutive failures when re-enabling
      const stats = this.proxyStats.get(proxyName);
      if (stats) {
        stats.consecutiveFailures = 0;
      }
      this.proxyHealthCheck.set(proxyName, true);
    }
  }

  /**
   * Get current configuration
   */
  getConfiguration(): ProxyManagerConfig {
    return { ...this.config };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }

  // Private methods

  private initializeProxyStats(): void {
    this.PROXY_CONFIGS.forEach((proxy) => {
      this.proxyStats.set(proxy.name, {
        success: 0,
        failures: 0,
        totalRequests: 0,
        avgResponseTime: 0,
        lastUsed: 0,
        lastSuccess: 0,
        lastFailure: 0,
        consecutiveFailures: 0,
        healthScore: 1.0, // Start with perfect health
      });

      this.proxyHealthCheck.set(proxy.name, true);
    });
  }

  private buildProxyUrl(proxyConfig: ProxyConfig, targetUrl: string): string {
    return proxyConfig.url + encodeURIComponent(targetUrl);
  }

  private isProxyHealthy(proxyName: string): boolean {
    return this.proxyHealthCheck.get(proxyName) || false;
  }

  private recordProxyAttempt(attempt: ProxyAttempt): void {
    const stats = this.proxyStats.get(attempt.proxyName);
    if (!stats) return;

    stats.totalRequests++;
    stats.lastUsed = attempt.timestamp;

    if (attempt.success) {
      stats.success++;
      stats.lastSuccess = attempt.timestamp;
      stats.consecutiveFailures = 0;
    } else {
      stats.failures++;
      stats.lastFailure = attempt.timestamp;
      stats.consecutiveFailures++;
    }

    // Update average response time
    const totalResponseTime =
      stats.avgResponseTime * (stats.totalRequests - 1) + attempt.responseTime;
    stats.avgResponseTime = totalResponseTime / stats.totalRequests;

    // Update health score
    this.updateHealthScore(attempt.proxyName);
  }

  private updateHealthScore(proxyName: string): void {
    const stats = this.proxyStats.get(proxyName);
    if (!stats) return;

    // Calculate health score based on multiple factors
    let healthScore = 1.0;

    // Factor 1: Success rate (weight: 0.5)
    if (stats.totalRequests > 0) {
      const successRate = stats.success / stats.totalRequests;
      healthScore *= successRate;
    }

    // Factor 2: Consecutive failures (weight: 0.4)
    if (stats.consecutiveFailures >= this.config.failureThreshold) {
      healthScore *= 0.1; // Severely penalize proxies with too many consecutive failures
    } else {
      const failurePenalty =
        stats.consecutiveFailures / this.config.failureThreshold;
      healthScore *= 1 - 0.4 * failurePenalty;
    }

    // Factor 3: Response time (weight: 0.1)
    // Penalize slow responses (over 5 seconds)
    if (stats.avgResponseTime > 5000) {
      const timePenalty = Math.min((stats.avgResponseTime - 5000) / 10000, 1);
      healthScore *= 1 - 0.1 * timePenalty;
    }

    stats.healthScore = Math.max(0, Math.min(1, healthScore));
  }

  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  private performHealthCheck(): void {
    // Check if any unhealthy proxies should be re-enabled
    this.PROXY_CONFIGS.forEach((proxy) => {
      if (!proxy.enabled) return;

      const stats = this.proxyStats.get(proxy.name);
      const isCurrentlyHealthy = this.proxyHealthCheck.get(proxy.name);

      if (!isCurrentlyHealthy && stats) {
        // Check if proxy should be marked as healthy again
        const timeSinceLastFailure = Date.now() - stats.lastFailure;
        const recoveryTime = 5 * 60 * 1000; // 5 minutes

        if (timeSinceLastFailure > recoveryTime) {
          // Reset consecutive failures and mark as healthy
          stats.consecutiveFailures = 0;
          this.proxyHealthCheck.set(proxy.name, true);
          this.updateHealthScore(proxy.name);
        }
      }
    });
  }
}

// Singleton instance
export const proxyManager = new ProxyManager();

// Utility functions for components
export const getProxyStatusIcon = (isHealthy: boolean): string => {
  return isHealthy ? "🟢" : "🔴";
};

export const getProxyHealthColor = (healthScore: number): string => {
  if (healthScore >= 0.8) return "text-green-500";
  if (healthScore >= 0.6) return "text-yellow-500";
  if (healthScore >= 0.4) return "text-orange-500";
  return "text-red-500";
};

export const formatProxyStats = (stats: ProxyStats): string => {
  const successRate =
    stats.totalRequests > 0
      ? Math.round((stats.success / stats.totalRequests) * 100)
      : 0;
  return `${successRate}% success (${stats.totalRequests} requests)`;
};

export const getProxyRecommendation = (stats: ProxyStats): string => {
  if (stats.healthScore >= 0.8) return "Excellent";
  if (stats.healthScore >= 0.6) return "Good";
  if (stats.healthScore >= 0.4) return "Fair";
  return "Poor";
};
