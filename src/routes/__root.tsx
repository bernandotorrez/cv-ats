import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";

import appCss from "../styles.css?url";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { BenixCsWidget } from "@/components/site/BenixCsWidget";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui/skeleton-loading";

const SITE_URL = "https://cvpintar.web.id";
const GOOGLE_TAG_ID = "G-HYFCCCP4SR";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Halaman tidak ditemukan</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman yang kamu cari tidak ada atau telah dipindahkan.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Halaman gagal dimuat
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Terjadi kesalahan. Silakan coba lagi atau kembali ke beranda.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Coba Lagi
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Beranda
          </a>
        </div>
      </div>
    </div>
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
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#468432" },
      { title: "CV Pintar — Buat CV ATS Friendly dengan AI" },
      {
        name: "description",
        content:
          "Bikin CV ATS friendly dalam 1 menit. Template gratis, saran AI Bahasa Indonesia, scoring otomatis, dan tips lolos screening HR & interview.",
      },
      { name: "author", content: "CV Pintar" },
      { name: "robots", content: "index, follow" },
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
      { rel: "canonical", href: SITE_URL },
      { rel: "alternate", hrefLang: "id", href: SITE_URL },
      { rel: "alternate", hrefLang: "x-default", href: SITE_URL },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap",
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
          gtag('config', '${GOOGLE_TAG_ID}');
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
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

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
  const isSharePage = routerState.location.pathname.startsWith("/share/");

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <a href="#main" className="skip-link">
          Lewati ke konten utama
        </a>
        <div className="flex min-h-screen flex-col">
          {!isSharePage && <SiteHeader />}
          <main id="main" className="flex-1">
            <Suspense fallback={<PageLoadingFallback />}>
              <Outlet />
            </Suspense>
          </main>
          {!isSharePage && <SiteFooter />}
        </div>
        <Toaster />
        <Analytics />
        <BenixCsWidget disabled={isSharePage} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
