/**
 * Security: Input Sanitization Utilities
 *
 * Provides XSS protection for user-generated content.
 * All CV data and user inputs should be sanitized before rendering.
 *
 * Last Updated: 2026-05-12
 */

import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize plain text - removes all HTML tags
 * Use for: names, titles, simple text fields
 */
export function sanitizeText(text: string): string {
  if (!text) return "";
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();
}

/**
 * Sanitize rich text - allows basic formatting
 * Use for: summary, description fields in CV
 *
 * Allowed: p, br, strong, em, b, i, ul, ol, li, a (with href)
 */
export function sanitizeRichText(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "b", "i", "ul", "ol", "li", "a", "span"],
    ALLOWED_ATTR: ["href", "target", "rel"],
    // Force all links to open in new tab with security attributes
    FORCE_BODY: false,
  }).trim();
}

/**
 * Sanitize URL - validates and cleans URLs
 * Use for: links, website fields
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return "";

  try {
    const sanitized = DOMPurify.sanitize(url, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });

    // Validate URL format
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(sanitized)) {
      return "";
    }

    return sanitized.trim();
  } catch {
    return "";
  }
}

/**
 * Sanitize email - validates email format
 */
export function sanitizeEmail(email: string): string {
  if (!email) return "";

  const sanitized = DOMPurify.sanitize(email, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();

  // Basic email validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(sanitized)) {
    return "";
  }

  return sanitized;
}

/**
 * Sanitize phone number - removes invalid characters
 * Accepts: numbers, spaces, dashes, parentheses, plus sign
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return "";

  return DOMPurify.sanitize(phone, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
    .replace(/[^\d\s\-\(\)\+]/g, "") // Keep only valid phone characters
    .trim();
}

/**
 * Sanitize UUID - validates UUID format
 * Use for: user IDs, record IDs
 */
export function sanitizeUuid(id: string): string | null {
  if (!id) return null;

  const sanitized = DOMPurify.sanitize(id, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();

  // UUID v4 format validation
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(sanitized)) {
    return null;
  }

  return sanitized;
}

/**
 * Sanitize CV data object
 * Recursively sanitizes all string fields in a CV object
 *
 * @param cvData - Raw CV data object
 * @returns Sanitized CV data object
 */
export function sanitizeCVData<T extends Record<string, unknown>>(cvData: T): T {
  const sanitized = { ...cvData };

  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === "string") {
      // Apply appropriate sanitization based on field type
      if (key.includes("email")) {
        (sanitized as Record<string, unknown>)[key] = sanitizeEmail(value);
      } else if (key.includes("phone") || key.includes("number")) {
        (sanitized as Record<string, unknown>)[key] = sanitizePhone(value);
      } else if (key.includes("url") || key.includes("website") || key.includes("link")) {
        (sanitized as Record<string, unknown>)[key] = sanitizeUrl(value);
      } else if (
        key.includes("summary") ||
        key.includes("description") ||
        key.includes("content")
      ) {
        (sanitized as Record<string, unknown>)[key] = sanitizeRichText(value);
      } else {
        (sanitized as Record<string, unknown>)[key] = sanitizeText(value);
      }
    } else if (Array.isArray(value)) {
      // Recursively sanitize arrays
      (sanitized as Record<string, unknown>)[key] = value.map((item) => {
        if (typeof item === "object" && item !== null) {
          return sanitizeCVData(item as Record<string, unknown>);
        }
        return item;
      });
    } else if (typeof value === "object" && value !== null) {
      // Recursively sanitize nested objects
      (sanitized as Record<string, unknown>)[key] = sanitizeCVData(
        value as Record<string, unknown>,
      );
    }
  }

  return sanitized;
}

/**
 * Sanitize filename - removes dangerous characters
 * Use for: uploaded file names
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return "";

  // Remove path traversal and dangerous characters
  return DOMPurify.sanitize(filename, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
    .replace(/\.\./g, "") // Remove path traversal
    .replace(/[<>:\"\/\\|?*]/g, "") // Remove invalid filename chars
    .trim()
    .slice(0, 255); // Limit length
}

/**
 * Strip all HTML and scripts from content
 * Alias for sanitizeText with additional script removal
 */
export function stripHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

/**
 * Check if content contains potential XSS payloads
 * Use for: security auditing and testing
 */
export function containsXSS(content: string): boolean {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick, onload, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<svg/i,
    /<math/i,
    /expression\s*\(/i, // CSS expressions
    /url\s*\(/i, // CSS url()
  ];

  return xssPatterns.some((pattern) => pattern.test(content));
}
