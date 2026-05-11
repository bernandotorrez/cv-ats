/**
 * CORS Configuration — Dynamic Origin Policy
 * SECURITY: Allow origins based on environment and Supabase URL
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Get Supabase URL from environment (set in Supabase Dashboard → Edge Functions → Secrets)
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";

// Extract domain from Supabase URL for dynamic origin
function getSupabaseDomain(): string {
  try {
    const url = new URL(SUPABASE_URL);
    return url.hostname;
  } catch {
    return "supabase.co";
  }
}

const supabaseDomain = getSupabaseDomain();

// Production origins - your deployed frontend domains
const PRODUCTION_ORIGINS = [
  "https://cvpintar.web.id",
  "https://www.cvpintar.web.id",
  `https://nfdrkuvyowaydjkhfvrr.supabase.co`,
  "http://localhost:8080",
];

// Development origins - for local development
const DEV_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:8000",
  "http://localhost:8080",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:4173",
  "http://127.0.0.1:8000",
  "http://127.0.0.1:8080",
];

// Preview/staging origins - Lovable, Vercel preview URLs, etc.
const PREVIEW_ORIGINS = [
  // Lovable preview URLs
  /https:\/\/.*\.lovable\.app$/,
  /https:\/\/.*-.*\.preview\.lovable\.dev$/,
  // Vercel preview URLs
  /https:\/\/.*\.vercel\.app$/,
  /https:\/\/cv-sukses-nusantara-.*\.vercel\.app$/,
  /https:\/\/cv-sukses-nusantara-.*-.*\.vercel\.app$/,
  // Cloudflare Pages
  /https:\/\/.*\.pages\.dev$/,
  // Any supabase.co preview domain
  new RegExp(`https://.*\\.${supabaseDomain}`),
];

/**
 * Check if origin matches any preview pattern
 */
function isPreviewOrigin(origin: string): boolean {
  return PREVIEW_ORIGINS.some(pattern => {
    if (pattern instanceof RegExp) {
      return pattern.test(origin);
    }
    return pattern === origin;
  });
}

/**
 * Check if origin is in allowed list
 */
function isAllowedOrigin(origin: string, allowedOrigins: string[]): boolean {
  return allowedOrigins.includes(origin);
}

/**
 * Check if running in development mode
 * Development mode is detected by:
 * 1. Environment variable ALLOW_DEV_CORS=true (set in Supabase Edge Function secrets)
 * 2. Local Supabase CLI (detected by different methods)
 */
function isDevelopmentMode(): boolean {
  // Option 1: Explicit environment variable
  const allowDevCors = Deno.env.get("ALLOW_DEV_CORS");
  if (allowDevCors === "true") return true;
  
  // Option 2: Check if this is running via local Supabase CLI
  // Local Supabase CLI typically doesn't have proper deployment ID
  const deploymentId = Deno.env.get("DENO_DEPLOYMENT_ID");
  if (!deploymentId || deploymentId === "") return true;
  
  return false;
}

/**
 * Get allowed origins based on environment
 */
function getAllowedOrigins(): string[] {
  if (isDevelopmentMode()) {
    // Development: Allow all dev origins plus production origins
    return [...DEV_ORIGINS, ...PRODUCTION_ORIGINS];
  }
  
  // Production: Only allow specific production domains + preview URLs
  return [...PRODUCTION_ORIGINS];
}

/**
 * Get CORS headers for a request
 * Dynamically handles production, preview, and development origins
 */
export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigins = getAllowedOrigins();
  
  // Check if origin is in allowed list
  const isAllowed = isAllowedOrigin(origin, allowedOrigins);
  // Also check if it's a preview URL
  const isPreview = isPreviewOrigin(origin);
  // Check if it's a localhost origin (allow in dev mode)
  const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1");
  
  // Determine which origin to use
  let validOrigin: string;
  
  if (isAllowed || isPreview || (isLocalhost && isDevelopmentMode())) {
    // Use the actual origin from the request
    validOrigin = origin;
  } else {
    // Fallback to first production origin
    validOrigin = allowedOrigins[0] || PRODUCTION_ORIGINS[0] || "*";
    
    // Log rejected origin for debugging
    console.log(`CORS: Origin "${origin}" not in allowlist. Falling back to "${validOrigin}". isDevMode=${isDevelopmentMode()}`);
  }
  
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": validOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-requested-with",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
  
  // Only include credentials header when we have a specific origin (not wildcard)
  if (validOrigin !== "*") {
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  
  return headers;
}

/**
 * Static CORS headers for OPTIONS preflight requests
 * Used when we can't determine the request origin
 */
export const corsHeadersStatic: Record<string, string> = {
  "Access-Control-Allow-Origin": PRODUCTION_ORIGINS[0] || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-requested-with",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

/**
 * Wildcard CORS headers for development/testing
 * WARNING: Only use in development, never in production
 */
export function corsHeadersWildcard(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-requested-with",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}
