import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

declare global {
  interface Window {
    BenixCSWidget?: {
      init: (config: {
        token?: string;
        position?: "bottom-right" | "bottom-left";
        primaryColor?: string;
      }) => void;
    };
    __benixCsWidgetReady?: boolean;
  }
}

const BENIX_WIDGET_SCRIPT_ID = "benix-cs-widget-sdk";
const BENIX_WIDGET_SRC = "https://www.benixai.web.id/benix-cs-widget.js";
const BENIX_WIDGET_SELECTORS = [
  '[id*="benix" i]',
  '[class*="benix" i]',
  'iframe[src*="benixai.web.id" i]',
  'iframe[src*="benix-cs-widget" i]',
].join(",");

/**
 * SECURITY: the Benix widget is a third-party script with full access to the
 * page (including the Supabase session in localStorage). Only load it on public
 * marketing pages for signed-out visitors — never on authenticated areas
 * (dashboard, admin, tryout, CV editor), payment pages, auth pages (password
 * entry), or shared CV pages.
 */
const BENIX_BLOCKED_PREFIXES = [
  // authenticated area (src/routes/_authenticated/*)
  "/admin",
  "/akun",
  "/analitik",
  "/compare",
  "/cv",
  "/cv-review",
  "/dashboard",
  "/job-match",
  "/lamaran",
  "/referral",
  "/score",
  "/simulasi-wawancara",
  "/tools",
  "/tryout",
  // payment
  "/payment",
  // auth flows
  "/login",
  "/register",
  "/lupa-password",
  "/reset-password",
  "/verify-email",
  "/auth",
  // shared CVs
  "/share",
  "/portfolio",
  // server routes
  "/api",
];

function isBenixWidgetAllowedPath(pathname: string): boolean {
  const path = (pathname || "/").toLowerCase();
  // Segment-exact match: "/tryout" and "/tryout/..." are blocked, while the
  // public marketing page "/tryout-cpns" is not.
  return !BENIX_BLOCKED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

type BenixCsWidgetProps = {
  disabled?: boolean;
  hidden?: boolean;
};

export function BenixCsWidget({ disabled = false, hidden = false }: BenixCsWidgetProps) {
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  // Only on public marketing pages, and never for signed-in users (their
  // session token lives in localStorage).
  const blocked = disabled || !isBenixWidgetAllowedPath(pathname) || loading || Boolean(user);

  // If the script was already loaded on a public page and the visitor moves to a
  // blocked page (client-side navigation or sign-in), a third-party script cannot
  // be unloaded — do a one-time full reload so the blocked page runs without it.
  useEffect(() => {
    if (!blocked || typeof window === "undefined") return;
    if (document.getElementById(BENIX_WIDGET_SCRIPT_ID) || window.BenixCSWidget) {
      window.location.reload();
    }
  }, [blocked]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.body.classList.toggle("benix-cs-widget-hidden", hidden);

    return () => {
      document.body.classList.remove("benix-cs-widget-hidden");
    };
  }, [hidden]);

  useEffect(() => {
    if (blocked || typeof window === "undefined") return;

    const token = import.meta.env.VITE_BENIX_CS_WIDGET_TOKEN;

    const hasWidgetDom = () =>
      Array.from(document.querySelectorAll(BENIX_WIDGET_SELECTORS)).some(
        (element) => element.id !== BENIX_WIDGET_SCRIPT_ID && element.tagName !== "SCRIPT",
      );

    const initWidget = () => {
      if (!window.BenixCSWidget) return false;
      if (window.__benixCsWidgetReady && hasWidgetDom()) return true;

      try {
        window.BenixCSWidget.init({
          ...(token ? { token } : {}),
          position: "bottom-right",
          primaryColor: "#468432",
        });
        window.__benixCsWidgetReady = true;
        return true;
      } catch (error) {
        window.__benixCsWidgetReady = false;
        if (import.meta.env.DEV) {
          console.warn("Gagal menginisialisasi Benix CS widget", error);
        }
        return false;
      }
    };

    let cancelled = false;
    const retryTimeouts: number[] = [];
    const retryInit = (attempt = 0) => {
      if (cancelled || initWidget() || attempt >= 20) return;

      retryTimeouts.push(window.setTimeout(() => retryInit(attempt + 1), 250));
    };

    const existingScript = document.getElementById(BENIX_WIDGET_SCRIPT_ID);
    if (existingScript) {
      retryInit();
      existingScript.addEventListener("load", () => retryInit(), { once: true });
      return () => {
        cancelled = true;
        retryTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
      };
    }

    const script = document.createElement("script");
    script.id = BENIX_WIDGET_SCRIPT_ID;
    script.src = BENIX_WIDGET_SRC;
    script.async = true;
    script.onload = () => retryInit();
    document.body.appendChild(script);
    retryInit();

    const handleWidgetClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest?.(BENIX_WIDGET_SELECTORS)) {
        import("@/lib/analytics").then(({ trackEvent }) => {
          trackEvent({
            eventName: "click_whatsapp",
            metadata: { source: "benix_cs_widget" },
          });
        });
      }
    };

    document.addEventListener("click", handleWidgetClick, { passive: true });

    return () => {
      cancelled = true;
      retryTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
      script.onload = null;
      document.removeEventListener("click", handleWidgetClick);
    };
  }, [blocked, hidden]);

  return null;
}
