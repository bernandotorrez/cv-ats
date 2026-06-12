import { useEffect } from "react";

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

type BenixCsWidgetProps = {
  disabled?: boolean;
  hidden?: boolean;
};

export function BenixCsWidget({ disabled = false, hidden = false }: BenixCsWidgetProps) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    document.body.classList.toggle("benix-cs-widget-hidden", hidden);

    return () => {
      document.body.classList.remove("benix-cs-widget-hidden");
    };
  }, [hidden]);

  useEffect(() => {
    if (disabled || typeof window === "undefined") return;

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

    return () => {
      cancelled = true;
      retryTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
      script.onload = null;
    };
  }, [disabled, hidden]);

  return null;
}
