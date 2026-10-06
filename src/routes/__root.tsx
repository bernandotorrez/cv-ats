import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useEffect, useMemo } from "react";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";

import appCss from "../styles.css?url";
import interLatinFont from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";
import jakartaLatinFont from "@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2?url";
import { SiteHeader } from "@/components/site/SiteHeader";
import { RefreshCw, SearchX, TriangleAlert, WifiOff } from "lucide-react";
import { ErrorState } from "@/components/site/ErrorState";
import { goBackAction } from "@/components/site/error-actions";
import { SiteFooter } from "@/components/site/SiteFooter";
import { BenixCsWidget } from "@/components/site/BenixCsWidget";
import { FakeBuyerCard } from "@/components/site/FakeBuyerCard";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui/skeleton-loading";

const SITE_URL = "https://cvpintar.web.id";
const GOOGLE_TAG_ID = "G-HYFCCCP4SR";

function NotFoundComponent() {
  return (
    <ErrorState
      code="404"
      icon={SearchX}
      eyebrow="Error 404 · Halaman tidak ditemukan"
      title={
        <>
          Ups, halaman ini <span className="text-green-700">tidak ada.</span>
        </>
      }
      description="Mungkin link-nya salah ketik, sudah dipindahkan, atau halamannya sudah tidak tersedia. Yuk lanjut dari halaman lain."
      primary={{ label: "Ke Beranda", to: "/" }}
      secondary={goBackAction()}
      showSuggestions
    />
  );
}

/** Chunk files from an older deploy are gone — a reload fetches the new version. */
const CHUNK_ERROR_RE =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Loading chunk [\w-]+ failed/i;

function ErrorComponent({ error: rawError, reset }: ErrorComponentProps) {
  const error = rawError instanceof Error ? rawError : new Error(String(rawError));
  console.error(error);
  const router = useRouter();
  const retry = () => {
    router.invalidate();
    reset();
  };

  const isChunkError = CHUNK_ERROR_RE.test(error.message);
  const isOffline = typeof navigator !== "undefined" && navigator.onLine === false;

  if (isChunkError) {
    return (
      <ErrorState
        standalone
        icon={RefreshCw}
        eyebrow="Versi baru tersedia"
        title={
          <>
            CV Pintar baru saja <span className="text-green-700">diperbarui.</span>
          </>
        }
        description="Muat ulang halaman untuk memakai versi terbaru. Data yang sudah tersimpan tetap aman."
        primary={{ label: "Muat Ulang", icon: RefreshCw, onClick: () => window.location.reload() }}
      />
    );
  }

  if (isOffline) {
    return (
      <ErrorState
        standalone
        icon={WifiOff}
        eyebrow="Koneksi terputus"
        title={
          <>
            Sepertinya kamu sedang <span className="text-green-700">offline.</span>
          </>
        }
        description="Periksa koneksi internet kamu, lalu coba lagi. Perubahan CV yang sudah tersimpan tidak akan hilang."
        primary={{ label: "Coba Lagi", icon: RefreshCw, onClick: retry }}
        secondary={{ label: "Ke Beranda", to: "/" }}
      />
    );
  }

  return (
    <ErrorState
      standalone
      code="500"
      icon={TriangleAlert}
      eyebrow="Terjadi kesalahan"
      title={
        <>
          Ada yang tidak beres <span className="text-green-700">di sisi kami.</span>
        </>
      }
      description="Halaman ini gagal dimuat. Coba lagi sebentar; kalau masih terjadi, hubungi kami di cs@cvpintar.web.id."
      primary={{ label: "Coba Lagi", icon: RefreshCw, onClick: retry }}
      secondary={{ label: "Ke Beranda", to: "/" }}
    >
      {import.meta.env.DEV && (
        <details className="mt-8 w-full max-w-xl rounded-xl border border-red-200 bg-red-50 p-4 text-left text-sm text-red-900">
          <summary className="cursor-pointer font-semibold">
            Detail error (hanya di development)
          </summary>
          <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words text-xs">
            {error.stack || error.message}
          </pre>
        </details>
      )}
    </ErrorState>
  );
}

function PageLoadingFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-1.5">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-3 rounded-full" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: ({ match, matches }) => {
    // 404 global: root match ditandai _notFound (status tetap "success"); 404 dari route anak: salah satu match berstatus "notFound"
    const isNotFound =
      match.status === "notFound" ||
      match._notFound === true ||
      matches.some((m) => m.status === "notFound" || m._notFound === true);
    const hasError = matches.some((m) => m.status === "error");
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { name: "theme-color", content: "#15803d" },
        {
          title: isNotFound
            ? "Halaman tidak ditemukan — CV Pintar"
            : hasError
              ? "Terjadi kesalahan — CV Pintar"
              : "CV Pintar — Buat CV ATS Friendly dengan AI",
        },
        {
          name: "description",
          content:
            "Bikin CV ATS friendly dalam 1 menit. Template gratis, saran AI Bahasa Indonesia, scoring otomatis, dan tips lolos screening HR & interview.",
        },
        { name: "author", content: "CV Pintar" },
        // Halaman 404 tidak boleh diindeks mesin pencari
        {
          name: "robots",
          content: isNotFound || hasError ? "noindex, follow" : "index, follow",
        },
        { property: "og:site_name", content: "CV Pintar" },
        { property: "og:locale", content: "id_ID" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { property: "og:title", content: "CV Pintar — Buat CV ATS Friendly dengan AI" },
        { name: "twitter:title", content: "CV Pintar — Buat CV ATS Friendly dengan AI" },
        {
          property: "og:description",
          content:
            "Bikin CV ATS friendly dalam 1 menit. Template gratis, saran AI Bahasa Indonesia, scoring otomatis, dan tips lolos screening HR & interview.",
        },
        {
          name: "twitter:description",
          content:
            "Bikin CV ATS friendly dalam 1 menit. Template gratis, saran AI Bahasa Indonesia, scoring otomatis, dan tips lolos screening HR & interview.",
        },
        {
          property: "og:image",
          content:
            "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/44765322-b45b-44f5-a6ac-752e6e50e35e",
        },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: "CV Pintar — Buat CV ATS Friendly dengan AI" },
        {
          name: "twitter:image",
          content:
            "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/44765322-b45b-44f5-a6ac-752e6e50e35e",
        },
        { name: "twitter:image:alt", content: "CV Pintar — Buat CV ATS Friendly dengan AI" },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "alternate", hrefLang: "id", href: SITE_URL },
        { rel: "alternate", hrefLang: "x-default", href: SITE_URL },
        { rel: "icon", href: "/favicon.ico", sizes: "any" },
        { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
        // Preload font latin (dipakai hampir semua teks) agar teks tampil tanpa menunggu CSS selesai di-parse
        {
          rel: "preload",
          href: interLatinFont,
          as: "font",
          type: "font/woff2",
          crossOrigin: "anonymous",
        },
        {
          rel: "preload",
          href: jakartaLatinFont,
          as: "font",
          type: "font/woff2",
          crossOrigin: "anonymous",
        },
      ],
      scripts: [
        {
          async: true,
          src: `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`,
        },
        {
          children: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          // Google Signals / personalisasi iklan dimatikan: fitur itu memanggil google.<tld>/ads/ga-audiences
          // dan stats.g.doubleclick.net yang tidak diizinkan CSP (dan memang tidak dipakai di sini).
          gtag('config', '${GOOGLE_TAG_ID}', {
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
          });
        `,
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "CV Pintar",
            url: SITE_URL,
            logo: `${SITE_URL}/favicon.ico`,
            sameAs: [],
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "CV Pintar",
            url: SITE_URL,
            inLanguage: "id-ID",
          }),
        },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

// Query params yang dianggap tracking/marketing dan harus di-strip dari canonical
const TRACKING_PARAMS = new Set([
  "ref",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "msclkid",
]);

function CanonicalUpdater() {
  const { location } = useRouterState();
  const canonicalUrl = useMemo(() => {
    const params = new URLSearchParams(location.search);
    for (const key of [...params.keys()]) {
      if (TRACKING_PARAMS.has(key)) params.delete(key);
    }
    const cleanSearch = params.toString();
    return SITE_URL + location.pathname + (cleanSearch ? `?${cleanSearch}` : "");
  }, [location.pathname, location.search]);

  useEffect(() => {
    // Update atau buat tag <link rel="canonical"> di <head>
    let el = document.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (!el) {
      el = document.createElement("link");
      el.rel = "canonical";
      document.head.appendChild(el);
    }
    el.href = canonicalUrl;
  }, [canonicalUrl]);

  return null;
}

function ScrollToTop() {
  const { location } = useRouterState();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname]);
  return null;
}

import { trackPageView, trackEvent, trackSessionHeartbeat, isAdminPath } from "@/lib/analytics";

function VisitorAnalyticsTracker() {
  const { location } = useRouterState();
  const isAdmin = isAdminPath(location.pathname);

  useEffect(() => {
    if (isAdmin) return;
    // Record page view on path change (excluding admin)
    trackPageView(location.pathname, document.title);
  }, [location.pathname, isAdmin]);

  useEffect(() => {
    if (isAdmin) return;
    // Track session duration milestones (15s, 45s, 90s, 180s, 300s)
    const startTime = Date.now();
    const intervals = [15, 45, 90, 180, 300];
    const timers = intervals.map((sec) =>
      window.setTimeout(() => {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        trackSessionHeartbeat(elapsed);
      }, sec * 1000),
    );

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [location.pathname, isAdmin]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (isAdminPath(window.location.pathname)) return;

      const target = (e.target as HTMLElement)?.closest?.(
        "[data-analytics-event], a[href*='wa.me'], a[href*='whatsapp']",
      );
      if (!target) return;

      const eventAttr = target.getAttribute("data-analytics-event");
      const href = target.getAttribute("href") || "";

      if (eventAttr) {
        trackEvent({
          eventName: eventAttr,
          metadata: {
            text: target.textContent?.trim().slice(0, 50),
            id: target.id || undefined,
          },
        });
      } else if (href.includes("wa.me") || href.includes("whatsapp")) {
        trackEvent({
          eventName: "click_whatsapp",
          metadata: {
            href: href.slice(0, 100),
            text: target.textContent?.trim().slice(0, 50),
          },
        });
      }
    };

    document.addEventListener("click", handleGlobalClick, { passive: true });
    return () => {
      document.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  return null;
}

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const isSharePage = pathname.startsWith("/share/") || pathname.startsWith("/portfolio/");
  const isCvBuilderPage = /^\/cv\/[^/]+\/?$/.test(pathname);
  const authenticatedRoutePrefixes = [
    "/admin",
    "/akun",
    "/analitik",
    "/compare",
    "/cv",
    "/cv-review",
    "/dashboard",
    "/job-match",
    "/lamaran",
    "/pembayaran",
    "/referral",
    "/score",
    "/simulasi-wawancara",
    "/tools",
    "/tryout",
  ];
  const isAuthenticatedRoute = authenticatedRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CanonicalUpdater />
        <ScrollToTop />
        <VisitorAnalyticsTracker />
        <a href="#main" className="skip-link">
          Lewati ke konten utama
        </a>
        <div className="flex min-h-screen flex-col">
          {/* CV builder punya header sendiri (EditorToolbar) dan tampil layar penuh */}
          {!isSharePage && !isCvBuilderPage && <SiteHeader />}
          <main id="main" className="flex-1">
            <Suspense fallback={<PageLoadingFallback />}>
              <Outlet />
            </Suspense>
          </main>
          {!isSharePage && !isCvBuilderPage && <SiteFooter />}
        </div>
        <Toaster />
        <Analytics />
        <BenixCsWidget disabled={isSharePage || isAuthenticatedRoute} hidden={isCvBuilderPage} />
        <FakeBuyerCard disabled={isSharePage || isAuthenticatedRoute} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
