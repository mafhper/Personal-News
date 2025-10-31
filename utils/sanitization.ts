/**
 * Utilitários de sanitização para prevenir vazamento de HTML e XSS
 * 
 * Este módulo fornece funções para sanitizar conteúdo HTML que pode vir
 * de feeds RSS externos, prevenindo ataques XSS e vazamento de tags HTML.
 */

/**
 * Sanitiza texto removendo todas as tags HTML e decodificando entidades HTML
 * 
 * @param text - Texto que pode conter HTML
 * @returns Texto limpo sem tags HTML
 */
export function sanitizeHtmlContent(text: string | null | undefined): string {
  if (!text) return "";
  
  return text
    // Remove scripts e iframes primeiro (mais perigosos)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    // Remove event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    // Remove javascript: e data: URLs
    .replace(/javascript:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/data:text\/html/gi, "")
    // Remove todas as outras tags HTML
    .replace(/<[^>]*>/g, "")
    // Decodifica entidades HTML comuns
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    // Remove caracteres de controle
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();
}

/**
 * Sanitiza descrições de artigos com limite de tamanho
 * 
 * @param description - Descrição que pode conter HTML
 * @param maxLength - Tamanho máximo da descrição (padrão: 300)
 * @returns Descrição sanitizada e truncada
 */
export function sanitizeArticleDescription(description: string | null | undefined, maxLength: number = 300): string {
  const sanitized = sanitizeHtmlContent(description);
  
  if (sanitized.length <= maxLength) {
    return sanitized;
  }
  
  // Trunca no último espaço antes do limite para não cortar palavras
  const truncated = sanitized.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) { // Se o último espaço está próximo do limite
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Sanitiza títulos de feeds e artigos
 * 
 * @param title - Título que pode conter HTML
 * @returns Título sanitizado
 */
export function sanitizeTitle(title: string | null | undefined): string {
  return sanitizeHtmlContent(title);
}

/**
 * Sanitiza URLs removendo javascript: e outros protocolos perigosos
 * 
 * @param url - URL que pode ser maliciosa
 * @returns URL sanitizada ou string vazia se for perigosa
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return "";
  
  const cleanUrl = url.trim();
  
  // Lista de protocolos perigosos
  const dangerousProtocols = [
    'javascript:',
    'vbscript:',
    'data:text/html',
    'data:application/javascript',
    'data:text/javascript'
  ];
  
  const lowerUrl = cleanUrl.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return "";
    }
  }
  
  // Permite apenas http, https, ftp e mailto
  if (!/^(https?|ftp|mailto):/i.test(cleanUrl)) {
    // Se não tem protocolo, assume https
    if (!/^[a-z]+:/i.test(cleanUrl)) {
      return `https://${cleanUrl}`;
    }
    return "";
  }
  
  return cleanUrl;
}

/**
 * Sanitiza conteúdo de feeds RSS completo
 * 
 * @param feedContent - Objeto com propriedades que podem conter HTML
 * @returns Objeto com propriedades sanitizadas
 */
export function sanitizeFeedContent<T extends Record<string, any>>(feedContent: T): T {
  const sanitized = { ...feedContent } as any;
  
  // Sanitiza propriedades comuns de feeds
  if ('title' in sanitized && sanitized.title) {
    sanitized.title = sanitizeTitle(sanitized.title);
  }
  
  if ('description' in sanitized && sanitized.description) {
    sanitized.description = sanitizeArticleDescription(sanitized.description);
  }
  
  if ('link' in sanitized && sanitized.link) {
    sanitized.link = sanitizeUrl(sanitized.link);
  }
  
  if ('author' in sanitized && sanitized.author) {
    sanitized.author = sanitizeHtmlContent(sanitized.author);
  }
  
  if ('sourceTitle' in sanitized && sanitized.sourceTitle) {
    sanitized.sourceTitle = sanitizeTitle(sanitized.sourceTitle);
  }
  
  return sanitized as T;
}