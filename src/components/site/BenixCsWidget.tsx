import { useEffect } from "react";

declare global {
  interface Window {
    BenixCSWidget?: {
      init: (config: {
        token: string;
        position?: "bottom-right" | "bottom-left";
        primaryColor?: string;
      }) => void;
    };
    __benixCsWidgetReady?: boolean;
  }
}

const BENIX_WIDGET_SCRIPT_ID = "benix-cs-widget-sdk";
const BENIX_WIDGET_SRC = "https://www.benixai.web.id/benix-cs-widget.js";

type BenixCsWidgetProps = {
  disabled?: boolean;
};

export function BenixCsWidget({ disabled = false }: BenixCsWidgetProps) {
  useEffect(() => {
    if (disabled || typeof window === "undefined") return;

    const token = import.meta.env.VITE_BENIX_CS_WIDGET_TOKEN;
    if (!token) {
      if (import.meta.env.DEV) {
        console.warn("VITE_BENIX_CS_WIDGET_TOKEN belum dikonfigurasi");
      }
      return;
    }

    const initWidget = () => {
      if (!window.BenixCSWidget || window.__benixCsWidgetReady) return;

      window.BenixCSWidget.init({
        token,
        position: "bottom-right",
        primaryColor: "#468432",
      });
      window.__benixCsWidgetReady = true;
    };

    const existingScript = document.getElementById(BENIX_WIDGET_SCRIPT_ID);
    if (existingScript) {
      initWidget();
      existingScript.addEventListener("load", initWidget, { once: true });
      return () => existingScript.removeEventListener("load", initWidget);
    }

    const script = document.createElement("script");
    script.id = BENIX_WIDGET_SCRIPT_ID;
    script.src = BENIX_WIDGET_SRC;
    script.async = true;
    script.onload = initWidget;
    document.body.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [disabled]);

  return null;
}
