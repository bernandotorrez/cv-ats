/**
 * Meta Pixel (browser) + atribusi iklan.
 *
 * - Pixel hanya aktif bila VITE_META_PIXEL_ID diisi. Tanpa itu semua fungsi di sini no-op.
 * - Atribusi (UTM & fbclid) tetap disimpan walau Pixel nonaktif, supaya bisa dilampirkan
 *   ke order lewat getMetaTrackingContext() dan dibaca server (payment-create).
 * - Pixel dimuat lazy: baru saat ada event pertama, bukan di setiap halaman.
 * - Pembelian (Purchase) juga dikirim server-side lewat Conversions API
 *   (supabase/functions/_shared/meta-capi.ts) dengan event_id yang sama = order_id,
 *   supaya Meta tidak menghitungnya dua kali.
 */

type Fbq = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  loaded: boolean;
  version: string;
  push: Fbq;
  disablePushState?: boolean;
  allowDuplicatePageViews?: boolean;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

const RAW_PIXEL_ID = String(import.meta.env.VITE_META_PIXEL_ID ?? "").trim();
/** Pixel ID Meta berupa angka (umumnya 15 - 16 digit); nilai lain dianggap belum dikonfigurasi. */
export const META_PIXEL_ID = /^\d{8,20}$/.test(RAW_PIXEL_ID) ? RAW_PIXEL_ID : "";
export const META_PIXEL_ENABLED = META_PIXEL_ID !== "";

const FBEVENTS_SRC = "https://connect.facebook.net/en_US/fbevents.js";

/** Pasang base code Pixel sekali. Return false bila Pixel nonaktif / bukan di browser. */
export function loadMetaPixel(): boolean {
  if (!META_PIXEL_ENABLED || typeof window === "undefined") return false;
  if (window.fbq) return true;

  // Salinan base code resmi Meta (di-inline agar tidak butuh script inline di CSP).
  const fbq = function () {
    // eslint-disable-next-line prefer-rest-params
    const args = arguments;
    if (fbq.callMethod) fbq.callMethod(...(Array.from(args) as unknown[]));
    else fbq.queue.push(args);
  } as Fbq;
  if (!window._fbq) window._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  // Halaman berpindah lewat router (SPA): PageView dikirim manual dari MetaPixelTracker.
  fbq.disablePushState = true;
  fbq.allowDuplicatePageViews = true;
  window.fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = FBEVENTS_SRC;
  const first = document.getElementsByTagName("script")[0];
  if (first?.parentNode) first.parentNode.insertBefore(script, first);
  else document.head.appendChild(script);

  // Matikan konfigurasi otomatis (advanced matching otomatis & pembacaan field form),
  // supaya email di form login/daftar tidak ikut terbaca Pixel. Pencocokan pembeli
  // dilakukan server-side lewat Conversions API.
  fbq("set", "autoConfig", false, META_PIXEL_ID);
  fbq("init", META_PIXEL_ID);
  return true;
}

/** Kirim event standar Meta. `eventID` dipakai untuk dedupe dengan Conversions API. */
export function trackMeta(event: string, params?: Record<string, unknown>, eventID?: string) {
  if (!loadMetaPixel() || !window.fbq) return;
  if (eventID) window.fbq("track", event, params ?? {}, { eventID });
  else window.fbq("track", event, params ?? {});
}

/** Beri waktu singkat agar event terkirim sebelum halaman berpindah (mis. redirect ke gateway). */
export function flushMetaPixel(ms = 300): Promise<void> {
  if (!META_PIXEL_ENABLED) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Atribusi iklan ──────────────────────────────────────────────────────────

const ATTR_KEY = "cvp_attribution";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
type UtmKey = (typeof UTM_KEYS)[number];

export type Attribution = {
  fbclid?: string;
  utm?: Partial<Record<UtmKey, string>>;
  ts: number;
};

const clean = (v: string | null, max = 100): string | undefined => {
  if (!v) return undefined;
  const s = v.trim().slice(0, max);
  return /^[\w .:/+@%~=,-]+$/.test(s) ? s : undefined;
};

function readAttribution(): Attribution | null {
  try {
    const raw = localStorage.getItem(ATTR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attribution;
    return typeof parsed?.ts === "number" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Simpan fbclid & UTM dari URL landing (klik iklan terakhir menang).
 * Panggil sekali saat aplikasi dimuat; aman dipanggil berulang.
 */
export function captureAttribution() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const fbclid = clean(params.get("fbclid"), 300);
  const utm: Partial<Record<UtmKey, string>> = {};
  for (const key of UTM_KEYS) {
    const v = clean(params.get(key));
    if (v) utm[key] = v;
  }
  if (!fbclid && Object.keys(utm).length === 0) return;
  try {
    const attr: Attribution = { ts: Date.now() };
    if (fbclid) attr.fbclid = fbclid;
    if (Object.keys(utm).length) attr.utm = utm;
    localStorage.setItem(ATTR_KEY, JSON.stringify(attr));
  } catch {
    // storage tidak tersedia: abaikan
  }
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export type MetaTrackingContext = {
  fbp?: string;
  fbc?: string;
  event_source_url?: string;
  utm?: Partial<Record<UtmKey, string>>;
};

/**
 * Konteks atribusi untuk dilampirkan ke order (dipakai Conversions API).
 * Hanya origin + path yang dikirim sebagai event_source_url (tanpa query).
 */
export function getMetaTrackingContext(): MetaTrackingContext {
  if (typeof window === "undefined") return {};
  const attr = readAttribution();
  const fbp = readCookie("_fbp");
  const fbc = readCookie("_fbc") || (attr?.fbclid ? `fb.1.${attr.ts}.${attr.fbclid}` : undefined);
  const ctx: MetaTrackingContext = {
    event_source_url: `${window.location.origin}${window.location.pathname}`,
  };
  if (fbp) ctx.fbp = fbp;
  if (fbc) ctx.fbc = fbc;
  if (attr?.utm) ctx.utm = attr.utm;
  return ctx;
}

// ─── Event bisnis ────────────────────────────────────────────────────────────

const categoryOf = (productType: string) => (productType === "tryout" ? "tryout" : productType);

/** Mulai checkout: dipanggil setelah order dibuat di server. */
export function trackMetaInitiateCheckout(p: {
  orderId: string;
  product: string;
  productName?: string;
  value?: number;
  quantity?: number;
}) {
  trackMeta(
    "InitiateCheckout",
    {
      currency: "IDR",
      ...(typeof p.value === "number" ? { value: p.value } : {}),
      content_type: "product",
      content_ids: [p.product],
      content_category: categoryOf(p.product.split(":")[0]),
      ...(p.productName ? { content_name: p.productName } : {}),
      num_items: p.quantity ?? 1,
    },
    `ic-${p.orderId}`,
  );
}

/**
 * Pembelian lunas, dari halaman /payment/success. Sekali per order per browser.
 * event_id = order_id, sama dengan yang dikirim server (Conversions API).
 */
export function trackMetaPurchaseOnce(order: {
  order_id: string;
  product_type: string;
  product_name: string;
  amount_idr: number;
}) {
  if (!META_PIXEL_ENABLED) return;
  const key = `cvp_meta_purchase_${order.order_id}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch {
    return;
  }
  trackMeta(
    "Purchase",
    {
      currency: "IDR",
      value: order.amount_idr,
      content_type: "product",
      content_ids: [order.product_type],
      content_category: categoryOf(order.product_type),
      content_name: order.product_name,
    },
    order.order_id,
  );
}

/** Akun baru, sekali per akun per browser. */
export function trackMetaRegistrationOnce(userId: string, createdAt: string | undefined) {
  if (!META_PIXEL_ENABLED) return;
  const created = createdAt ? Date.parse(createdAt) : NaN;
  if (!Number.isFinite(created) || Date.now() - created > 3 * 24 * 60 * 60 * 1000) return;
  const key = `cvp_meta_reg_${userId}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch {
    return;
  }
  trackMeta("CompleteRegistration", { content_name: "Akun CV Pintar", status: true });
}

/**
 * Halaman yang boleh mengirim PageView/ViewContent ke Meta. Sengaja allowlist:
 * halaman CV pribadi, share link, admin, dan pembayaran tidak ikut terkirim.
 */
const PAGEVIEW_PATHS = [
  /^\/$/,
  /^\/tryout-cpns\/?$/,
  /^\/belajar-skd(\/[^/]+)?\/?$/,
  /^\/harga\/?$/,
  /^\/register\/?$/,
  /^\/login\/?$/,
  /^\/tryout\/beli\/?$/,
];

export function shouldTrackPageView(pathname: string): boolean {
  return PAGEVIEW_PATHS.some((re) => re.test(pathname));
}

/** Parameter ViewContent untuk halaman produk/konten utama iklan. */
export function viewContentFor(pathname: string): Record<string, unknown> | null {
  if (/^\/tryout-cpns\/?$/.test(pathname)) {
    return {
      content_name: "Tryout SKD CPNS",
      content_category: "tryout",
      content_ids: ["tryout:skd"],
      content_type: "product",
    };
  }
  if (/^\/belajar-skd(\/|$)/.test(pathname)) {
    return {
      content_name: "Belajar SKD",
      content_category: "belajar-skd",
      content_ids: ["belajar-skd"],
      content_type: "product",
    };
  }
  return null;
}
