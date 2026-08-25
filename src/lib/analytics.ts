/**
 * Visitor & Event Analytics Tracking System for CV Pintar
 * Tracks page views, device metrics, traffic sources, session duration, and user conversions.
 */

import { supabase } from "@/integrations/supabase/client";

// Storage Keys
const VISITOR_ID_KEY = "cvp_visitor_id";
const SESSION_ID_KEY = "cvp_session_id";
const FIRST_VISIT_KEY = "cvp_first_visit";

export interface AnalyticsEventPayload {
  eventName: string;
  pagePath?: string;
  pageTitle?: string;
  durationSeconds?: number;
  metadata?: Record<string, any>;
}

/**
 * Generate standard UUID v4
 */
function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create persistent visitor ID (persists across visits)
 */
export function getVisitorId(): string {
  if (typeof window === "undefined") return "server-visitor";
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = generateUuid();
      localStorage.setItem(VISITOR_ID_KEY, id);
      localStorage.setItem(FIRST_VISIT_KEY, new Date().toISOString());
    }
    return id;
  } catch {
    return generateUuid();
  }
}

/**
 * Get or create session ID (resets when browser tab/window is closed)
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "server-session";
  try {
    let id = sessionStorage.getItem(SESSION_ID_KEY);
    if (!id) {
      id = generateUuid();
      sessionStorage.setItem(SESSION_ID_KEY, id);
    }
    return id;
  } catch {
    return generateUuid();
  }
}

/**
 * Check if current visitor is first-time or returning
 */
export function isNewVisitor(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const firstVisit = localStorage.getItem(FIRST_VISIT_KEY);
    if (!firstVisit) return true;
    const firstDate = new Date(firstVisit).getTime();
    return Date.now() - firstDate < 24 * 60 * 60 * 1000;
  } catch {
    return true;
  }
}

/**
 * Detect device type (mobile, tablet, desktop)
 */
export function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined" || typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent.toLowerCase();
  
  const isTablet =
    /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(
      ua,
    ) ||
    (navigator.maxTouchPoints > 1 && /macintosh/.test(ua) && window.screen.width >= 768);

  if (isTablet) return "tablet";

  const isMobile =
    /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
      ua,
    ) || window.innerWidth < 768;

  return isMobile ? "mobile" : "desktop";
}

/**
 * Detect Operating System
 */
export function getOperatingSystem(): string {
  if (typeof window === "undefined" || typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent;

  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Android/.test(ua)) return "Android";
  if (/Mac OS X|Macintosh/.test(ua)) return "macOS";
  if (/Windows NT 10.0|Windows NT 11.0/.test(ua)) return "Windows";
  if (/Windows/.test(ua)) return "Windows";
  if (/Linux/.test(ua)) return "Linux";
  if (/CrOS/.test(ua)) return "Chrome OS";

  return "Other";
}

/**
 * Detect Web Browser
 */
export function getBrowserName(): string {
  if (typeof window === "undefined" || typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent;

  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/SamsungBrowser\//.test(ua)) return "Samsung Browser";

  return "Other";
}

/**
 * Categorize traffic referrer channel
 */
export function getReferrerChannel(): string {
  if (typeof document === "undefined") return "Direct / Akses Langsung";
  const ref = document.referrer.toLowerCase();

  if (!ref || ref === "") return "Direct / Akses Langsung";

  try {
    const currentHost = window.location.hostname.toLowerCase();
    const refUrl = new URL(ref);
    const refHost = refUrl.hostname.toLowerCase();

    if (refHost === currentHost || refHost.endsWith(`.${currentHost}`)) {
      return "Direct / Akses Langsung";
    }

    if (
      refHost.includes("google.") ||
      refHost.includes("bing.") ||
      refHost.includes("yahoo.") ||
      refHost.includes("duckduckgo.") ||
      refHost.includes("yandex.") ||
      refHost.includes("ecosia.")
    ) {
      return "Google / Search Engine";
    }

    if (
      refHost.includes("instagram.com") ||
      refHost.includes("tiktok.com") ||
      refHost.includes("linkedin.com") ||
      refHost.includes("twitter.com") ||
      refHost.includes("x.com") ||
      refHost.includes("facebook.com") ||
      refHost.includes("youtube.com") ||
      refHost.includes("t.me") ||
      refHost.includes("telegram")
    ) {
      return "Social Media";
    }

    if (refHost.includes("whatsapp") || refHost.includes("wa.me")) {
      return "WhatsApp";
    }

    return "Website Eksternal";
  } catch {
    return "Website Eksternal";
  }
}

/**
 * Friendly display name mapping for common paths
 */
export function getHumanPageTitle(path: string, fallbackTitle?: string): string {
  if (path === "/" || path === "") return "Beranda (Landing Page)";
  if (path.startsWith("/template")) return "Template CV ATS";
  if (path.startsWith("/harga")) return "Daftar Harga & Paket";
  if (path.startsWith("/fitur")) return "Fitur Unggulan";
  if (path.startsWith("/tryout-cpns") || path.startsWith("/tryout")) return "Tryout CPNS & BUMN";
  if (path.startsWith("/kontak")) return "Kontak & Dukungan CS";
  if (path.startsWith("/panduan-cv-ats")) return "Panduan CV ATS Friendly";
  if (path.startsWith("/tips-interview")) return "Tips Wawancara Kerja";
  if (path.startsWith("/blog")) return "Blog & Edukasi Karir";
  if (path.startsWith("/lowongan")) return "Lowongan Kerja Terbaru";
  if (path.startsWith("/private-coaching")) return "Private Coaching & Review";
  if (path.startsWith("/login")) return "Halaman Masuk (Login)";
  if (path.startsWith("/register")) return "Halaman Pendaftaran";
  if (path.startsWith("/dashboard")) return "User Dashboard";
  if (path.startsWith("/cv/")) return "CV Editor & Builder";
  if (path.startsWith("/admin/analytics") || path.startsWith("/admin/analitik")) return "Admin - Analitik Pengunjung";
  if (path.startsWith("/admin")) return "Admin Panel";
  if (path.startsWith("/score")) return "Cek Skor ATS CV";
  if (path.startsWith("/simulasi-wawancara")) return "Simulasi Wawancara AI";

  if (fallbackTitle && fallbackTitle !== "CV Pintar — Buat CV ATS Friendly dengan AI") {
    return fallbackTitle;
  }
  return path;
}

// Memory cache to prevent duplicate pageview within 2 seconds for exact same path
let lastLoggedPath = "";
let lastLoggedTime = 0;

/**
 * Track page view event
 */
export async function trackPageView(
  pathname?: string,
  pageTitle?: string,
  metadata?: Record<string, any>,
): Promise<void> {
  if (typeof window === "undefined") return;

  const currentPath = pathname || window.location.pathname;
  const now = Date.now();

  // Deduplicate rapid consecutive triggers
  if (currentPath === lastLoggedPath && now - lastLoggedTime < 2000) {
    return;
  }

  lastLoggedPath = currentPath;
  lastLoggedTime = now;

  const resolvedTitle = getHumanPageTitle(currentPath, pageTitle || document.title);

  await trackEvent({
    eventName: "page_view",
    pagePath: currentPath,
    pageTitle: resolvedTitle,
    metadata,
  });
}

/**
 * Generic event tracker
 */
export async function trackEvent(payload: AnalyticsEventPayload): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const currentPath = payload.pagePath || window.location.pathname;
    const currentTitle = payload.pageTitle || getHumanPageTitle(currentPath, document.title);
    const deviceType = getDeviceType();
    const browser = getBrowserName();
    const os = getOperatingSystem();
    const referrer = typeof document !== "undefined" ? document.referrer || "direct" : "direct";
    const referrerChannel = getReferrerChannel();

    // Get current auth user ID if available
    let userId: string | null = null;
    try {
      const { data } = await supabase.auth.getSession();
      userId = data?.session?.user?.id || null;
    } catch {
      // ignore auth check error
    }

    const row = {
      visitor_id: visitorId,
      session_id: sessionId,
      event_name: payload.eventName,
      page_path: currentPath,
      page_title: currentTitle,
      referrer: referrer.slice(0, 500),
      referrer_channel: referrerChannel,
      device_type: deviceType,
      browser,
      os,
      duration_seconds: payload.durationSeconds || 0,
      user_id: userId,
      metadata: payload.metadata || {},
    };

    // Insert into supabase asynchronously without blocking caller
    void (supabase as any)
      .from("visitor_events")
      .insert(row)
      .then(({ error }: { error: any }) => {
        if (error && import.meta.env.DEV) {
          console.warn("[Analytics] Tracking insert warning:", error.message);
        }
      });
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[Analytics] Failed to dispatch tracking event:", err);
    }
  }
}

/**
 * Track session duration update (heartbeat)
 */
export async function trackSessionHeartbeat(durationSeconds: number): Promise<void> {
  if (typeof window === "undefined" || durationSeconds <= 0) return;

  await trackEvent({
    eventName: "session_ping",
    durationSeconds,
    pagePath: window.location.pathname,
    pageTitle: getHumanPageTitle(window.location.pathname, document.title),
    metadata: { duration_seconds: durationSeconds },
  });
}
