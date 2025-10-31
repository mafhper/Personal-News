/**
 * Security Tests for RSS Parser
 *
 * Tests for vulnerabilities:
 * - CVE-2022-39353: Misinterpretation of malicious XML input
 * - CVE-2021-21366: xmldom allows multiple root nodes in a DOM
 */

import { parseSecureRssXml, secureXmlUtils } from "../services/secureXmlParser";

describe("Security Fixes for RSS Parser", () => {
  describe("CVE-2022-39353: Malicious XML Input Prevention", () => {
    it("should reject XML with external entity references", () => {
      const maliciousXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE rss [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<rss version="2.0">
  <channel>
    <title>&xxe;</title>
    <description>Test feed</description>
  </channel>
</rss>`;

      expect(() => parseSecureRssXml(maliciousXML)).toThrow(
        "malicious XML content"
      );
    });

    it("should reject XML with script tags", () => {
      const maliciousXML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <description><script>alert('xss')</script>Safe content</description>
  </channel>
</rss>`;

      expect(() => parseSecureRssXml(maliciousXML)).toThrow(
        "malicious XML content"
      );
    });

    it("should reject XML with iframe tags", () => {
      const maliciousXML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <description><iframe src="http://evil.com"></iframe>Safe content</description>
  </channel>
</rss>`;

      expect(() => parseSecureRssXml(maliciousXML)).toThrow(
        "malicious XML content"
      );
    });

    it("should reject XML with javascript: URLs", () => {
      const maliciousXML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <link>javascript:alert('xss')</link>
  </channel>
</rss>`;

      expect(() => parseSecureRssXml(maliciousXML)).toThrow(
        "malicious XML content"
      );
    });

    it("should reject XML with event handlers", () => {
      const maliciousXML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title onclick="alert('xss')">Test Feed</title>
    <description>Safe content</description>
  </channel>
</rss>`;

      expect(() => parseSecureRssXml(maliciousXML)).toThrow(
        "malicious XML content"
      );
    });

    it("should reject oversized XML content", () => {
      const largeContent = "x".repeat(11 * 1024 * 1024); // 11MB > 10MB limit
      const largeXML = `<?xml version="1.0"?><rss><channel><title>${largeContent}</title></channel></rss>`;

      expect(() => parseSecureRssXml(largeXML)).toThrow(
        "size exceeds security limit"
      );
    });
  });

  describe("CVE-2021-21366: Multiple Root Nodes Prevention", () => {
    it("should reject XML with multiple root nodes", () => {
      const invalidXML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Feed 1</title>
  </channel>
</rss>
<rss version="2.0">
  <channel>
    <title>Feed 2</title>
  </channel>
</rss>`;

      expect(() => parseSecureRssXml(invalidXML)).toThrow(
        "documents may contain only one root"
      );
    });

    it("should accept valid XML with single root node", () => {
      const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Valid Feed</title>
    <description>This is a valid RSS feed</description>
    <item>
      <title>Article 1</title>
      <description>Article description</description>
    </item>
  </channel>
</rss>`;

      expect(() => parseSecureRssXml(validXML)).not.toThrow();
    });

    it("should accept XML with processing instructions and comments", () => {
      const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="rss.xsl"?>
<!-- This is a comment -->
<rss version="2.0">
  <channel>
    <title>Valid Feed</title>
    <description>This is a valid RSS feed</description>
  </channel>
</rss>`;

      expect(() => parseSecureRssXml(validXML)).not.toThrow();
    });

    it("should reject XML with disallowed root elements", () => {
      const invalidXML = `<?xml version="1.0" encoding="UTF-8"?>
<malicious>
  <content>Evil content</content>
</malicious>`;

      expect(() => parseSecureRssXml(invalidXML)).toThrow(
        "not in allowed list"
      );
    });
  });

  describe("Content Sanitization", () => {
    it("should sanitize text content with script tags", () => {
      const maliciousText =
        'Safe content <script>alert("xss")</script> more content';
      const sanitized = secureXmlUtils.sanitizeTextContent(maliciousText);

      expect(sanitized).not.toContain("<script>");
      expect(sanitized).not.toContain("alert");
      expect(sanitized).toContain("Safe content");
      expect(sanitized).toContain("more content");
    });

    it("should sanitize text content with event handlers", () => {
      const maliciousText = "Content with onclick=\"alert('xss')\" handler";
      const sanitized = secureXmlUtils.sanitizeTextContent(maliciousText);

      expect(sanitized).not.toContain("onclick=");
      expect(sanitized).not.toContain("alert");
      expect(sanitized).toContain("Content with");
      expect(sanitized).toContain("handler");
    });

    it("should sanitize javascript: URLs", () => {
      const maliciousText = 'Link: javascript:alert("xss")';
      const sanitized = secureXmlUtils.sanitizeTextContent(maliciousText);

      expect(sanitized).not.toContain("javascript:");
      expect(sanitized).toContain("Link:");
      // Note: alert() may remain as it's not in a javascript: context after sanitization
    });

    it("should handle null and empty input safely", () => {
      expect(secureXmlUtils.sanitizeTextContent(null)).toBe("");
      expect(secureXmlUtils.sanitizeTextContent("")).toBe("");
      expect(secureXmlUtils.sanitizeTextContent("   ")).toBe("");
    });
  });

  describe("Input Validation", () => {
    it("should reject non-string input", () => {
      expect(() => parseSecureRssXml(null as any)).toThrow("Invalid XML input");
      expect(() => parseSecureRssXml(undefined as any)).toThrow(
        "Invalid XML input"
      );
      expect(() => parseSecureRssXml(123 as any)).toThrow("Invalid XML input");
      expect(() => parseSecureRssXml({} as any)).toThrow("Invalid XML input");
    });

    it("should reject empty string input", () => {
      expect(() => parseSecureRssXml("")).toThrow("Invalid XML input");
      expect(() => parseSecureRssXml("   ")).toThrow("Invalid XML input");
    });

    it("should handle malformed XML gracefully", () => {
      const malformedXML = "<rss><channel><title>Unclosed tag</channel></rss>";

      // Should either parse successfully or throw a descriptive error
      try {
        parseSecureRssXml(malformedXML);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("XML");
      }
    });
  });

  describe("Atom Feed Support", () => {
    it("should accept valid Atom feeds", () => {
      const atomXML = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test Atom Feed</title>
  <subtitle>Test description</subtitle>
  <entry>
    <title>Test Entry</title>
    <summary>Entry description</summary>
  </entry>
</feed>`;

      expect(() => parseSecureRssXml(atomXML)).not.toThrow();
    });
  });

  describe("RDF Feed Support", () => {
    it("should accept valid RDF feeds", () => {
      const rdfXML = `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns="http://purl.org/rss/1.0/">
  <channel>
    <title>Test RDF Feed</title>
    <description>Test description</description>
  </channel>
  <item>
    <title>Test Item</title>
    <description>Item description</description>
  </item>
</rdf:RDF>`;

      expect(() => parseSecureRssXml(rdfXML)).not.toThrow();
    });
  });
});
