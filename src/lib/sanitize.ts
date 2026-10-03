/**
 * Security: Input Sanitization Utilities
 *
 * Provides XSS protection for user-generated content.
 * All CV data and user inputs should be sanitized before rendering.
 *
 * SSR safety: `isomorphic-dompurify` is NOT used here. Under the Cloudflare
 * Workers build (resolve conditions workerd/worker/browser) it resolves to its
 * browser entry, which throws at import time when no DOM is available. We use
 * `dompurify` directly and only call it when a DOM exists (browser). On the
 * server the HTML helpers fall back to fully escaped text, which is always
 * safe to inject (tryout content is only rendered client-side anyway).
 *
 * Last Updated: 2026-10-04
 */

import DOMPurify, { type Config } from "dompurify";

function canPurify(): boolean {
  return (
    typeof window !== "undefined" &&
    !!DOMPurify &&
    DOMPurify.isSupported === true &&
    typeof DOMPurify.sanitize === "function"
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Server fallback for plain-text helpers (result is rendered as React text). */
function stripTagsFallback(value: string): string {
  return value.replace(/<[^>]*>/g, "");
}

function purifyText(dirty: string, config: Config): string {
  if (!canPurify()) return stripTagsFallback(dirty);
  return DOMPurify.sanitize(dirty, config);
}

/** For HTML that will be injected with dangerouslySetInnerHTML. */
function purifyHtml(dirty: string, config: Config): string {
  if (!canPurify()) return escapeHtml(stripTagsFallback(dirty));
  return DOMPurify.sanitize(dirty, config);
}

/**
 * Sanitize plain text - removes all HTML tags
 * Use for: names, titles, simple text fields
 */
export function sanitizeText(text: string): string {
  if (!text) return "";
  return purifyText(text, {
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
  return purifyHtml(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "b", "i", "ul", "ol", "li", "a", "span"],
    ALLOWED_ATTR: ["href", "target", "rel"],
    ALLOW_DATA_ATTR: false,
  }).trim();
}

const TRYOUT_ALLOWED_TAGS = [
  "p",
  "br",
  "hr",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "sub",
  "sup",
  "small",
  "mark",
  "span",
  "div",
  "blockquote",
  "code",
  "pre",
  "ul",
  "ol",
  "li",
  "h3",
  "h4",
  "h5",
  "h6",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "caption",
  "img",
];

/**
 * Sanitize HTML for tryout questions & explanations (admin / LLM generated).
 * Allows formatting, lists, tables and images; strips scripts, event handlers,
 * styles, forms, iframes, links and javascript: URLs.
 */
export function sanitizeTryoutHtml(html: string | null | undefined): string {
  if (!html) return "";
  return purifyHtml(html, {
    ALLOWED_TAGS: TRYOUT_ALLOWED_TAGS,
    ALLOWED_ATTR: ["src", "alt", "title", "colspan", "rowspan", "width", "height"],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  });
}

/**
 * Sanitize URL - validates and cleans URLs
 * Use for: links, website fields
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return "";

  try {
    const sanitized = purifyText(url, {
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

  const sanitized = purifyText(email, {
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

  return purifyText(phone, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
    .replace(/[^\d\s\-()+]/g, "") // Keep only valid phone characters
    .trim();
}

/**
 * Sanitize UUID - validates UUID format
 * Use for: user IDs, record IDs
 */
export function sanitizeUuid(id: string): string | null {
  if (!id) return null;

  const sanitized = id.trim();

  // UUID format validation
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
  return purifyText(filename, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
    .replace(/\.\./g, "") // Remove path traversal
    .replace(/[<>:"/\\|?*]/g, "") // Remove invalid filename chars
    .trim()
    .slice(0, 255); // Limit length
}

/**
 * Strip all HTML and scripts from content
 * Alias for sanitizeText with additional script removal
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  return purifyText(html, {
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
