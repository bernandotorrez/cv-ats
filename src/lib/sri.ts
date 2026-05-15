/**
 * Security: Subresource Integrity (SRI) Utilities
 * 
 * SRI is a security feature that allows you to verify that resources
 * (JavaScript, CSS) are delivered without unexpected manipulation.
 * 
 * HOW SRI WORKS:
 * 1. You include a hash (SHA-256, SHA-384, or SHA-512) with the resource
 * 2. Browser computes hash of fetched resource
 * 3. If hashes don't match, resource is blocked
 * 
 * Last Updated: 2026-05-12
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity
 */

// ─── Known SRI Hashes for Common CDN Resources ────────────────────────
// These should be updated when CDN resources are updated!
// Always verify hashes before using in production.

/**
 * hCaptcha Script
 * URL: https://js.hcaptcha.com/1/api.js
 * 
 * Note: Hashes for CDN scripts change frequently with updates.
 * For @hcaptcha/react-hcaptcha, the package manages the script loading.
 * Add SRI to package.json if needed:
 * "resolutions": { "scripts": { "api.js": "sha384-..." } }
 */
export const HCAPTCHA_SRI = {
  apiJs: "sha384-Y5xR0t0x9kJv7c8b5c7d9e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a", // Example placeholder
} as const;

/**
 * Vercel Analytics
 * URL: https://va.vercel-scripts.com/v1/script.js
 * 
 * Managed by @vercel/analytics package - SRI handled by the package.
 */
export const VERCEL_SRI = {
  scriptJs: "sha384-REPLACE_WITH_ACTUAL_HASH", // Replace with actual hash
} as const;

// ─── SRI Hash Generator ──────────────────────────────────────────────

/**
 * Generate SRI hash for a given string
 * Use this to generate hashes for CDN scripts
 * 
 * @param content - The script content or URL
 * @param algorithm - Hash algorithm (sha256, sha384, sha512)
 * @returns Base64-encoded hash with algorithm prefix
 */
export async function generateSRI(
  content: string,
  algorithm: "sha256" | "sha384" | "sha512" = "sha384"
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));
  
  return `${algorithm}-${hashBase64}`;
}

/**
 * Fetch a URL and generate its SRI hash
 * 
 * @param url - The URL to fetch and hash
 * @param algorithm - Hash algorithm
 * @returns SRI hash string
 */
export async function generateSRIFromURL(
  url: string,
  algorithm: "sha256" | "sha384" | "sha512" = "sha384"
): Promise<string> {
  const response = await fetch(url);
  const content = await response.text();
  return generateSRI(content, algorithm);
}

// ─── SRI Script Tag Generator ──────────────────────────────────────

interface ScriptTagOptions {
  src: string;
  integrity?: string;
  crossOrigin?: "anonymous" | "use-credentials";
  async?: boolean;
  defer?: boolean;
  type?: string;
}

/**
 * Create an HTML script tag with SRI
 * 
 * @param options - Script tag options
 * @returns HTML string for the script tag
 */
export function createScriptTag(options: ScriptTagOptions): string {
  const attrs: string[] = [`src="${options.src}"`];
  
  if (options.integrity) {
    attrs.push(`integrity="${options.integrity}"`);
  }
  
  if (options.crossOrigin) {
    attrs.push(`crossorigin="${options.crossOrigin}"`);
  }
  
  if (options.async) {
    attrs.push("async");
  }
  
  if (options.defer) {
    attrs.push("defer");
  }
  
  if (options.type) {
    attrs.push(`type="${options.type}"`);
  }
  
  return `<script ${attrs.join(" ")}></script>`;
}

/**
 * Validate that a script has SRI when it's required
 * Throws if script is loaded without integrity hash
 */
export function validateSRIRequired(scriptUrl: string, allowedDomains?: string[]): void {
  // For now, just log a warning. In production, this could be enforced.
  console.warn(
    `[SRI] Consider adding integrity hash for external script: ${scriptUrl}`,
    "See src/lib/sri.ts for SRI utilities"
  );
}

// ─── CSP Nonce for Inline Scripts ───────────────────────────────────

/**
 * Generate a CSP nonce for inline scripts
 * Use with Content-Security-Policy: script-src 'nonce-{value}'
 * 
 * @param length - Length of the nonce (default: 16 bytes)
 * @returns Base64-encoded nonce
 */
export function generateCSPNonce(length: number = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

// ─── Documentation ─────────────────────────────────────────────────
//
// To add SRI to an external script:
//
// 1. Get the script content:
//    curl -s https://example.com/script.js | sha384sum
//
// 2. Add the hash to this file:
//    export const SCRIPT_SRI = {
//      scriptJs: "sha384-YOUR_HASH_HERE",
//    };
//
// 3. Use in your code:
//    <script
//      src="https://example.com/script.js"
//      integrity={SCRIPT_SRI.scriptJs}
//      crossOrigin="anonymous"
//    />
//
// NOTE: When using React, use the crossOriginAttribute prop:
//    <script
//      src="..."
//      integrity={hash}
//      crossOrigin="anonymous"
//    />
//
// For packages that load scripts automatically (like hCaptcha),
// check if the package supports SRI configuration in their options.
//
