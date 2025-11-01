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
  
  let cleanText = text;
  
  // Múltiplas passadas para garantir que todas as entidades codificadas sejam tratadas
  for (let i = 0; i < 5; i++) {
    const beforeClean = cleanText;
    
    // Primeiro decodifica &amp; para & para lidar com entidades duplamente codificadas
    cleanText = cleanText.replace(/&amp;/g, "&");
    
    // Decodifica entidades HTML para detectar tags codificadas
    cleanText = cleanText
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, "/")
      .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    
    // Remove todas as tags HTML (incluindo as decodificadas)
    cleanText = cleanText
      // Remove scripts e iframes primeiro (mais perigosos)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      // Remove event handlers
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
      // Remove javascript: e data: URLs
      .replace(/javascript:/gi, "")
      .replace(/vbscript:/gi, "")
      .replace(/data:text\/html/gi, "")
      // Remove todas as tags HTML (incluindo fragmentos incompletos)
      .replace(/<[^>]*>/g, "")
      // Remove fragmentos de tags HTML incompletos (como <img sem fechamento)
      .replace(/<[^<]*$/g, "");
    
    // Se não houve mudanças, podemos parar
    if (cleanText === beforeClean) {
      break;
    }
  }
  
  // Por último, decodifica entidades HTML restantes e limpa
  cleanText = cleanText
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    // Remove caracteres de controle
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();
    
  return cleanText;
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
 * Verifica se o texto contém HTML (incluindo entidades codificadas)
 * 
 * @param text - Texto a ser verificado
 * @returns true se contém HTML, false caso contrário
 */
export function containsHtml(text: string | null | undefined): boolean {
  if (!text) return false;
  
  // Verifica tags HTML diretas
  if (/<[^>]*>/g.test(text)) {
    return true;
  }
  
  // Verifica entidades HTML codificadas que representam tags
  if (/&lt;[^&]*&gt;/g.test(text)) {
    return true;
  }
  
  // Verifica entidades duplamente codificadas (&amp;lt; e &amp;gt;)
  if (/&amp;lt;[^&]*&amp;gt;/g.test(text)) {
    return true;
  }
  
  // Verifica entidades duplamente codificadas incompletas (como &amp;lt; sem fechamento)
  if (/&amp;lt;/g.test(text)) {
    return true;
  }
  
  // Verifica outras formas de codificação HTML numérica
  if (/&#60;[^&#]*&#62;/g.test(text)) {
    return true;
  }
  
  // Verifica entidades numéricas incompletas
  if (/&#60;/g.test(text)) {
    return true;
  }
  
  return false;
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