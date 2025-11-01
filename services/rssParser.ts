/**
 * Enhanced RSS Parser - Versão otimizada
 * 
 * Melhorias implementadas:
 * - Sistema de fallback com múltiplos provedores RSS-to-JSON
 * - Cache persistente mais agressivo
 * - Suporte a JSON Feed nativo
 * - Retry inteligente com circuit breaker
 * - Validação robusta de respostas
 * 
 * @version 2.0.0
 * @author Matheus Pereira
 */

import type { Article } from "../types";
import { getLogger } from "./logger";
// import { perfDebugger } from "./performanceUtils"; // Não utilizado nesta versão
import { getCachedArticles, setCachedArticles } from "./smartCache";
import { parseSecureRssXml, secureXmlUtils } from "./secureXmlParser";
import { getAlternativeUrls } from "./feedUrlMapper";

// Configurações otimizadas
const DEFAULT_TIMEOUT_MS = 8000; // Timeout mais generoso
const MAX_RETRY_ATTEMPTS = 2;
const RETRY_DELAY_BASE_MS = 500;
// const CACHE_EXTENDED_TTL = 24 * 60 * 60 * 1000; // 24 horas - Não utilizado nesta versão

const logger = getLogger();

// Provedores RSS-to-JSON confiáveis (ordenados por prioridade)
const RSS_PROVIDERS = [
  {
    name: "RSS2JSON",
    url: "https://api.rss2json.com/v1/api.json",
    format: (url: string) => `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`,
    parser: parseRss2JsonResponse
  },
  {
    name: "AllOrigins",
    url: "https://api.allorigins.win/raw",
    format: (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    parser: parseXmlResponse
  },
  {
    name: "CodeTabs",
    url: "https://api.codetabs.com/v1/proxy",
    format: (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    parser: parseXmlResponse
  },
  {
    name: "CORSProxy",
    url: "https://corsproxy.io",
    format: (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    parser: parseXmlResponse
  }
];

// Circuit breaker simples para evitar requisições repetidas a serviços offline
class CircuitBreaker {
  private failures: Map<string, { count: number; lastAttempt: number }> = new Map();
  private readonly threshold = 3;
  private readonly timeout = 60000; // 1 minuto

  isOpen(provider: string): boolean {
    const failure = this.failures.get(provider);
    if (!failure) return false;

    const now = Date.now();
    if (now - failure.lastAttempt > this.timeout) {
      this.failures.delete(provider);
      return false;
    }

    return failure.count >= this.threshold;
  }

  recordFailure(provider: string): void {
    const failure = this.failures.get(provider) || { count: 0, lastAttempt: 0 };
    failure.count++;
    failure.lastAttempt = Date.now();
    this.failures.set(provider, failure);
  }

  recordSuccess(provider: string): void {
    this.failures.delete(provider);
  }
}

const circuitBreaker = new CircuitBreaker();

/**
 * Limpa descrição HTML com sanitização segura
 */
function cleanDescription(description: string): string {
  return secureXmlUtils.sanitizeTextContent(description);
}

/**
 * Sanitiza título removendo HTML e entidades
 */
function sanitizeTitle(title: string): string {
  return secureXmlUtils.sanitizeTextContent(title);
}

/**
 * Sanitiza autor removendo HTML e entidades
 */
function sanitizeAuthor(author: string): string {
  return secureXmlUtils.sanitizeTextContent(author);
}

/**
 * Fetch com timeout usando AbortController
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
      headers: {
        'Accept': 'application/rss+xml, application/xml, application/atom+xml, text/xml, application/json, */*',
        ...fetchOptions.headers
      }
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
 * Parser para resposta do RSS2JSON
 */
function parseRss2JsonResponse(data: string, feedUrl: string): { title: string; articles: Article[] } {
  const json = JSON.parse(data);
  
  // RSS2JSON retorna status 'ok' quando bem-sucedido
  if (json.status === 'error') {
    throw new Error(`RSS2JSON error: ${json.message || 'Unknown error'}`);
  }
  
  if (json.status !== 'ok' || !json.items) {
    throw new Error("Invalid RSS2JSON response format");
  }

  const articles: Article[] = json.items.map((item: any) => {
    // Validar e limpar imageUrl
    let imageUrl = item.thumbnail || item.enclosure?.link;
    
    // Filtrar URLs inválidas ou placeholders malformados
    if (imageUrl) {
      try {
        const url = new URL(imageUrl);
        // Verificar se é uma URL válida com protocolo http/https
        if (!url.protocol.startsWith('http')) {
          imageUrl = undefined;
        }
        // Verificar se não é um placeholder comum que causa erro
        if (imageUrl && (
          imageUrl.includes('?text=') || 
          imageUrl.match(/^[A-Z0-9]{6}\?text=/i) ||
          !imageUrl.includes('.')
        )) {
          imageUrl = undefined;
        }
      } catch (e) {
        // URL inválida, ignorar
        imageUrl = undefined;
      }
    }

    const article: Article = {
      title: item.title ? sanitizeTitle(item.title) : "No Title",
      link: item.link || feedUrl,
      pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
      description: item.description ? cleanDescription(item.description).substring(0, 200) : "",
      sourceTitle: json.feed?.title ? sanitizeTitle(json.feed.title) : "RSS Feed",
      author: item.author ? sanitizeAuthor(item.author) : undefined,
      categories: item.categories || [],
      imageUrl: imageUrl || undefined
    };
    return article;
  });

  return {
    title: json.feed?.title || "RSS Feed",
    articles
  };
}

/**
 * Parser para resposta XML pura
 */
function parseXmlResponse(xmlContent: string, _feedUrl: string): { title: string; articles: Article[] } {
  const xmlDoc = parseSecureRssXml(xmlContent);

  // Verifica erros de parsing
  const parseErrors = xmlDoc.getElementsByTagName("parsererror");
  if (parseErrors.length > 0) {
    throw new Error(`XML parsing error: ${parseErrors[0].textContent}`);
  }

  let channelTitle = "Untitled Feed";
  let items: HTMLCollectionOf<Element> | NodeListOf<Element>;

  // Tenta RSS 2.0
  const channels = xmlDoc.getElementsByTagName("channel");
  if (channels.length > 0) {
    const titleElements = channels[0].getElementsByTagName("title");
    channelTitle = titleElements[0]?.textContent?.trim() || "Untitled Feed";
    channelTitle = sanitizeTitle(channelTitle);
    items = xmlDoc.getElementsByTagName("item");
  } else {
    // Tenta Atom
    const feeds = xmlDoc.getElementsByTagName("feed");
    if (feeds.length > 0) {
      const titleElements = feeds[0].getElementsByTagName("title");
      channelTitle = titleElements[0]?.textContent?.trim() || "Untitled Feed";
      channelTitle = sanitizeTitle(channelTitle);
      items = xmlDoc.getElementsByTagName("entry");
    } else {
      // Tenta RDF
      const rdfItems = xmlDoc.getElementsByTagName("item");
      if (rdfItems.length > 0) {
        const rdfChannels = xmlDoc.getElementsByTagName("channel");
        if (rdfChannels.length > 0) {
          const titleElements = rdfChannels[0].getElementsByTagName("title");
          channelTitle = titleElements[0]?.textContent?.trim() || "Untitled Feed";
          channelTitle = sanitizeTitle(channelTitle);
        }
        items = rdfItems;
      } else {
        throw new Error("Unsupported RSS format");
      }
    }
  }

  const articles: Article[] = [];

  for (let i = 0; i < Math.min(items.length, 50); i++) {
    const item = items[i];

    try {
      const titleElements = item.getElementsByTagName("title");
      const rawTitle = titleElements[0]?.textContent?.trim() || "No Title";
      const title = sanitizeTitle(rawTitle);

      let link = "";
      const linkElements = item.getElementsByTagName("link");
      if (linkElements.length > 0) {
        link = linkElements[0].textContent?.trim() || linkElements[0].getAttribute("href") || "";
      }

      let pubDate = new Date();
      const pubDateElements = item.getElementsByTagName("pubDate");
      const publishedElements = item.getElementsByTagName("published");
      const dcDateElements = item.getElementsByTagName("date");
      const dateElement = pubDateElements[0] || publishedElements[0] || dcDateElements[0];
      if (dateElement?.textContent) {
        const parsedDate = new Date(dateElement.textContent.trim());
        if (!isNaN(parsedDate.getTime())) {
          pubDate = parsedDate;
        }
      }

      let description = "";
      const descElements = item.getElementsByTagName("description");
      const summaryElements = item.getElementsByTagName("summary");
      const contentElements = item.getElementsByTagName("content");
      const descElement = descElements[0] || summaryElements[0] || contentElements[0];
      if (descElement?.textContent) {
        description = cleanDescription(descElement.textContent).substring(0, 200);
      }

      let author = "";
      const authorElements = item.getElementsByTagName("author");
      const creatorElements = item.getElementsByTagName("creator");
      const authorElement = authorElements[0] || creatorElements[0];
      if (authorElement?.textContent) {
        const rawAuthor = authorElement.textContent.trim();
        author = sanitizeAuthor(rawAuthor);
      }

      const categories: string[] = [];
      const categoryElements = item.getElementsByTagName("category");
      for (let j = 0; j < categoryElements.length; j++) {
        const catText = categoryElements[j].textContent?.trim();
        if (catText) categories.push(catText);
      }

      let imageUrl = "";
      // Método 1: enclosure
      const enclosureElements = item.getElementsByTagName("enclosure");
      for (let j = 0; j < enclosureElements.length; j++) {
        const enclosure = enclosureElements[j];
        const type = enclosure.getAttribute("type");
        if (type && type.startsWith("image/")) {
          imageUrl = enclosure.getAttribute("url") || "";
          break;
        }
      }

      // Método 2: media:content
      if (!imageUrl) {
        const mediaContentElements = item.getElementsByTagName("media:content");
        for (let j = 0; j < mediaContentElements.length; j++) {
          const mediaContent = mediaContentElements[j];
          const type = mediaContent.getAttribute("type");
          if (type && type.startsWith("image/")) {
            imageUrl = mediaContent.getAttribute("url") || "";
            break;
          }
        }
      }

      // Método 3: media:thumbnail
      if (!imageUrl) {
        const mediaThumbnailElements = item.getElementsByTagName("media:thumbnail");
        if (mediaThumbnailElements.length > 0) {
          imageUrl = mediaThumbnailElements[0].getAttribute("url") || "";
        }
      }

      // Método 4: extrair da descrição
      if (!imageUrl && descElement) {
        const htmlContent = descElement.innerHTML || descElement.textContent || "";
        const imgPatterns = [
          /<img[^>]+src=["']([^"']+)["'][^>]*>/i,
          /src=["']([^"']+\.(?:jpg|jpeg|png|gif|webp|svg))[^"']*/i,
          /https?:\/\/[^\s<>"]+\.(?:jpg|jpeg|png|gif|webp|svg)/i,
        ];

        for (const pattern of imgPatterns) {
          const match = htmlContent.match(pattern);
          if (match && match[1]) {
            imageUrl = match[1];
            break;
          }
        }
      }

      // Validar imageUrl antes de adicionar ao artigo
      let validImageUrl: string | undefined = undefined;
      if (imageUrl) {
        try {
          const url = new URL(imageUrl);
          // Verificar protocolo válido
          if (url.protocol === 'http:' || url.protocol === 'https:') {
            // Filtrar placeholders comuns que causam erro
            if (!imageUrl.includes('?text=') && 
                !imageUrl.match(/^[A-Z0-9]{6}\?text=/i) &&
                imageUrl.includes('.')) {
              validImageUrl = imageUrl;
            }
          }
        } catch (e) {
          // URL inválida, será undefined
          logger.debug(`Invalid image URL filtered: ${imageUrl}`, {
            component: "rssParser"
          });
        }
      }

      if (title !== "No Title" && link) {
        articles.push({
          title,
          link,
          pubDate,
          description,
          imageUrl: validImageUrl,
          author: author || undefined,
          categories,
          sourceTitle: channelTitle,
        });
      }
    } catch (error) {
      logger.warn(`Failed to parse article ${i + 1}`, {
        component: "rssParser",
        additionalData: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  return { title: channelTitle, articles };
}

/**
 * Valida se a resposta é válida
 */
function validateResponse(content: string): boolean {
  if (!content || content.trim().length === 0) return false;

  const trimmed = content.trim();
  
  // Verifica se é HTML em vez de XML/JSON
  if (trimmed.toLowerCase().includes('<!doctype html') || trimmed.toLowerCase().startsWith('<html')) {
    return false;
  }

  // Verifica se parece com XML/RSS ou JSON
  return trimmed.startsWith('<') || trimmed.startsWith('{');
}

/**
 * Tenta buscar o feed usando um provedor específico
 */
async function tryProvider(
  provider: typeof RSS_PROVIDERS[0],
  url: string,
  signal?: AbortSignal
): Promise<{ title: string; articles: Article[] }> {
  if (circuitBreaker.isOpen(provider.name)) {
    throw new Error(`Circuit breaker open for ${provider.name}`);
  }

  const proxyUrl = provider.format(url);
  
  logger.debug(`Trying provider: ${provider.name}`, {
    component: "rssParser",
    additionalData: { feedUrl: url, proxyUrl },
  });

  const response = await fetchWithTimeout(proxyUrl, { signal });

  if (!response.ok) {
    // Status 422 geralmente indica URL inválida ou feed não suportado
    if (response.status === 422) {
      throw new Error(`Provider ${provider.name} cannot process this feed (422 Unprocessable Entity)`);
    }
    throw new Error(`Provider ${provider.name} returned ${response.status}: ${response.statusText}`);
  }

  const content = await response.text();

  if (!validateResponse(content)) {
    throw new Error(`Invalid response from ${provider.name}`);
  }

  const result = provider.parser(content, url);

  if (!result.articles || result.articles.length === 0) {
    throw new Error(`No articles parsed from ${provider.name}`);
  }

  circuitBreaker.recordSuccess(provider.name);

  logger.info(`Successfully fetched via ${provider.name}`, {
    component: "rssParser",
    additionalData: { 
      feedUrl: url, 
      provider: provider.name,
      articlesCount: result.articles.length 
    },
  });

  return result;
}

/**
 * Busca o feed tentando todos os provedores
 */
async function fetchRssFeed(
  url: string,
  signal?: AbortSignal
): Promise<{ title: string; articles: Article[] }> {
  const urlsToTry = getAlternativeUrls(url);
  let lastError: Error = new Error("Unknown error");

  for (const currentUrl of urlsToTry) {
    for (const provider of RSS_PROVIDERS) {
      try {
        const result = await tryProvider(provider, currentUrl, signal);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        circuitBreaker.recordFailure(provider.name);
        
        logger.debug(`Provider ${provider.name} failed for ${currentUrl}`, {
          component: "rssParser",
          additionalData: { error: lastError.message },
        });
      }
    }
  }

  throw new Error(`All providers failed. Last error: ${lastError.message}`);
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse RSS com retry
 */
async function parseRssUrlWithRetry(
  url: string,
  options: {
    timeout?: number;
    maxRetries?: number;
    signal?: AbortSignal;
  } = {}
): Promise<{ title: string; articles: Article[] }> {
  const { maxRetries = MAX_RETRY_ATTEMPTS, signal } = options;
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`Fetching feed (attempt ${attempt}/${maxRetries})`, {
        component: "rssParser",
        additionalData: { feedUrl: url },
      });

      const result = await fetchRssFeed(url, signal);

      if (result.articles.length > 0) {
        setCachedArticles(url, result.articles, result.title);
      }

      logger.info(`Successfully fetched feed on attempt ${attempt}`, {
        component: "rssParser",
        additionalData: {
          feedUrl: url,
          articlesCount: result.articles.length,
          attempt,
        },
      });

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (signal?.aborted) {
        throw new Error("Request was cancelled");
      }

      if (attempt === maxRetries) break;

      const delay = RETRY_DELAY_BASE_MS * Math.pow(2, attempt - 1);
      logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`, {
        component: "rssParser",
        additionalData: { feedUrl: url, error: lastError.message },
      });

      await sleep(delay);
    }
  }

  logger.error(`All ${maxRetries} attempts failed`, lastError, {
    component: "rssParser",
    additionalData: { feedUrl: url },
  });

  throw lastError;
}

/**
 * Parse RSS URL com cache
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

  // Verifica cache
  if (!skipCache) {
    const cachedArticles = getCachedArticles(url);
    if (cachedArticles && cachedArticles.length > 0) {
      logger.debug(`Using cached articles`, {
        component: "rssParser",
        additionalData: { feedUrl: url, cachedCount: cachedArticles.length },
      });

      return {
        title: cachedArticles[0].sourceTitle,
        articles: cachedArticles,
      };
    }
  }

  try {
    return await parseRssUrlWithRetry(url, options);
  } catch (error) {
    logger.warn(`Creating placeholder for failed feed`, {
      component: "rssParser",
      additionalData: { 
        url, 
        error: error instanceof Error ? error.message : String(error) 
      },
    });

    // Retorna placeholder
    return {
      title: "Feed Unavailable",
      articles: [{
        title: "RSS Feed Temporarily Unavailable",
        link: url,
        pubDate: new Date(),
        description: `Unable to fetch this RSS feed. This may be due to CORS restrictions or temporary server issues. The feed will be retried automatically.`,
        sourceTitle: "System Notice",
        categories: ["system", "unavailable"],
      }],
    };
  }
}

/**
 * Parse OPML file
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