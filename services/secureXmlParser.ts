/**
 * Secure XML Parser for RSS feeds
 *
 * This module provides secure XML parsing functionality to prevent:
 * - CVE-2022-39353: Misinterpretation of malicious XML input
 * - CVE-2021-21366: Multiple root nodes in DOM
 *
 * Uses native browser DOMParser with comprehensive security validations.
 */

interface SecurityConfig {
  maxXmlSize: number;
  allowedRootElements: string[];
  blockedPatterns: RegExp[];
}

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  maxXmlSize: 10 * 1024 * 1024, // 10MB max
  allowedRootElements: ["rss", "feed", "rdf:rdf", "rdf"],
  blockedPatterns: [
    // Only block truly dangerous patterns, allow RSS-specific content
    /<!ENTITY[^>]*SYSTEM/i, // External system entity references (dangerous)
    /<!ENTITY[^>]*PUBLIC/i, // External public entity references (dangerous)
    /javascript:/gi, // JavaScript URLs
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, // Iframe tags
    /on\w+\s*=\s*["'][^"']*["']/gi, // Event handlers
    /data:text\/html/gi, // Data URLs with HTML
    /vbscript:/gi, // VBScript URLs
    /expression\s*\(/gi, // CSS expressions
    // Allow CDATA sections and internal DTD declarations (common in RSS)
    // /<!DOCTYPE.*\[/i, // Removed - allow internal DTD for RSS compatibility
    // /<!ENTITY/i, // Removed - allow internal entities for RSS compatibility
  ],
};

/**
 * Validates XML content for security issues
 */
function validateXmlSecurity(xmlString: string, config: SecurityConfig): void {
  // Check size limit
  if (xmlString.length > config.maxXmlSize) {
    throw new Error(
      `XML size exceeds security limit of ${config.maxXmlSize} bytes`
    );
  }

  // Check for malicious patterns
  for (const pattern of config.blockedPatterns) {
    if (pattern.test(xmlString)) {
      throw new Error(
        `Potentially malicious XML content detected: blocked pattern found`
      );
    }
  }
}

/**
 * Validates that XML has proper structure and allowed root elements
 */
function validateXmlStructure(doc: Document, config: SecurityConfig): void {
  // Check if we have a valid document element
  const documentElement = doc.documentElement;
  if (!documentElement) {
    throw new Error("No valid XML root element found");
  }

  // Validate that the root element is allowed
  const rootTagName = documentElement.tagName.toLowerCase();
  if (
    !config.allowedRootElements.some(
      (allowed) => rootTagName === allowed.toLowerCase()
    )
  ) {
    throw new Error(
      `Root element '${rootTagName}' is not in allowed list: ${config.allowedRootElements.join(
        ", "
      )}`
    );
  }

  // Check for multiple root elements (CVE-2021-21366 fix)
  const rootElements = Array.from(doc.childNodes).filter(
    (node) => node.nodeType === Node.ELEMENT_NODE
  );

  if (rootElements.length > 1) {
    throw new Error(
      `XML contains ${rootElements.length} root nodes, but only 1 is allowed`
    );
  }
}

/**
 * Sanitizes text content to prevent XSS and injection attacks
 */
function sanitizeTextContent(text: string | null): string {
  if (!text) return "";

  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove scripts
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "") // Remove iframes
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "") // Remove event handlers
    .replace(/javascript:/gi, "") // Remove javascript: URLs
    .replace(/vbscript:/gi, "") // Remove vbscript: URLs
    .replace(/data:text\/html/gi, "") // Remove data URLs with HTML
    .replace(/expression\s*\(/gi, "") // Remove CSS expressions
    .trim();
}

/**
 * Safely gets text content from an XML element with sanitization
 */
function getSecureTextContent(
  element: Element | null,
  tagName: string
): string {
  if (!element) return "";

  const node = element.querySelector(tagName);
  const textContent = node?.textContent || "";

  return sanitizeTextContent(textContent);
}

/**
 * Safely gets attribute value with sanitization
 */
function getSecureAttributeValue(
  element: Element | null,
  attributeName: string
): string {
  if (!element) return "";

  const value = element.getAttribute(attributeName) || "";
  return sanitizeTextContent(value);
}

/**
 * Securely parses XML string with comprehensive security validations
 */
export function parseSecureXml(
  xmlString: string,
  config: SecurityConfig = DEFAULT_SECURITY_CONFIG
): Document {
  try {
    // Input validation
    if (!xmlString || typeof xmlString !== "string") {
      throw new Error("Invalid XML input: must be a non-empty string");
    }

    const trimmedXml = xmlString.trim();
    if (!trimmedXml) {
      throw new Error("Invalid XML input: must be a non-empty string");
    }

    // Security validation (fixes CVE-2022-39353)
    validateXmlSecurity(trimmedXml, config);

    // Parse with native DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmedXml, "application/xml");

    // Check for parsing errors
    const parserError = doc.querySelector("parsererror");
    if (parserError) {
      throw new Error(`XML parsing error: ${parserError.textContent}`);
    }

    // Validate XML structure (fixes CVE-2021-21366)
    validateXmlStructure(doc, config);

    return doc;
  } catch (error) {
    console.error("Secure XML parsing error:", error);
    throw new Error(
      `Failed to parse XML securely: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Enhanced RSS-specific secure parsing
 */
export function parseSecureRssXml(xmlString: string): Document {
  const rssConfig: SecurityConfig = {
    ...DEFAULT_SECURITY_CONFIG,
    allowedRootElements: ["rss", "feed", "rdf:rdf", "rdf"],
  };

  return parseSecureXml(xmlString, rssConfig);
}

/**
 * Utility functions for secure content extraction
 */
export const secureXmlUtils = {
  getSecureTextContent,
  getSecureAttributeValue,
  sanitizeTextContent,
  validateXmlSecurity,
};

export { DEFAULT_SECURITY_CONFIG };
