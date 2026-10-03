/**
 * SSRF-safe fetch untuk URL yang diberikan user (H5).
 *
 * - Hanya https (http hanya jika `allowHttp`), hanya port default.
 * - Tolak hostname IP literal, single-label, localhost/.local/.internal, dsb.
 * - Resolve DNS (A + AAAA) dan tolak alamat privat/loopback/link-local/CGNAT/
 *   multicast/reserved; IPv6 hanya global unicast (2000::/3) yang diizinkan.
 * - `redirect: "manual"` — setiap hop divalidasi ulang (maks `maxRedirects`).
 * - Timeout total & body dibaca sebagai stream, berhenti di `maxBytes`.
 *
 * Residual risk: DNS rebinding (TOCTOU) — fetch() melakukan resolusi DNS
 * sendiri setelah validasi, sehingga domain dengan TTL sangat pendek secara
 * teoritis bisa berganti ke IP internal di antara validasi & koneksi.
 */

export class SafeFetchError extends Error {}

export interface SafeFetchOptions {
  maxBytes?: number;
  timeoutMs?: number;
  maxRedirects?: number;
  allowHttp?: boolean;
  headers?: HeadersInit;
}

export interface SafeFetchResult {
  ok: boolean;
  status: number;
  url: string;
  contentType: string;
  response: Response;
}

const BLOCKED_HOSTNAMES = new Set(["localhost", "metadata", "metadata.google.internal"]);
const BLOCKED_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".intranet",
  ".lan",
  ".home",
  ".corp",
  ".localdomain",
  ".home.arpa",
  ".arpa",
];

// ─── IP classification ────────────────────────────────────────────

function parseIPv4(ip: string): number | null {
  const m = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  if (parts.some((p) => p > 255)) return null;
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function inV4(ip: number, base: string, bits: number): boolean {
  const b = parseIPv4(base)!;
  if (bits === 0) return true;
  const mask = (0xffffffff << (32 - bits)) >>> 0;
  return (ip & mask) >>> 0 === (b & mask) >>> 0;
}

const BLOCKED_V4: Array<[string, number]> = [
  ["0.0.0.0", 8], // "this" network
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // CGNAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local / cloud metadata
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // TEST-NET-1
  ["192.88.99.0", 24], // 6to4 relay anycast
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // TEST-NET-2
  ["203.0.113.0", 24], // TEST-NET-3
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved + broadcast
];

export function isBlockedIPv4(ip: string): boolean {
  const n = parseIPv4(ip);
  if (n === null) return true; // tidak bisa di-parse → tolak
  return BLOCKED_V4.some(([base, bits]) => inV4(n, base, bits));
}

/** Parse IPv6 menjadi 8 grup 16-bit (mendukung "::" dan IPv4 tertanam). */
function parseIPv6(input: string): number[] | null {
  let ip = input.toLowerCase();
  if (ip.startsWith("[") && ip.endsWith("]")) ip = ip.slice(1, -1);
  const zone = ip.indexOf("%");
  if (zone !== -1) ip = ip.slice(0, zone);

  // IPv4 tertanam di akhir (mis. ::ffff:10.0.0.1)
  let tail: number[] = [];
  const lastColon = ip.lastIndexOf(":");
  const maybeV4 = ip.slice(lastColon + 1);
  if (maybeV4.includes(".")) {
    const v4 = parseIPv4(maybeV4);
    if (v4 === null) return null;
    tail = [v4 >>> 16, v4 & 0xffff];
    ip = ip.slice(0, lastColon + 1) + "0:0";
  }

  const halves = ip.split("::");
  if (halves.length > 2) return null;
  const toGroups = (s: string) => (s ? s.split(":") : []);
  const head = toGroups(halves[0]);
  const rest = halves.length === 2 ? toGroups(halves[1]) : [];
  const missing = 8 - head.length - rest.length;
  if (halves.length === 1 && missing !== 0) return null;
  if (halves.length === 2 && missing < 1) return null;
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill("0"), ...rest];
  if (groups.length !== 8) return null;
  const nums: number[] = [];
  for (const g of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(g)) return null;
    nums.push(parseInt(g, 16));
  }
  if (tail.length) {
    nums[6] = tail[0];
    nums[7] = tail[1];
  }
  return nums;
}

export function isBlockedIPv6(ip: string): boolean {
  const g = parseIPv6(ip);
  if (!g) return true;

  // IPv4-mapped (::ffff:a.b.c.d) → nilai berdasarkan IPv4-nya
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) {
    const v4 = `${g[6] >>> 8}.${g[6] & 0xff}.${g[7] >>> 8}.${g[7] & 0xff}`;
    return isBlockedIPv4(v4);
  }

  // Hanya global unicast 2000::/3. Ini otomatis menolak ::, ::1, ::/96,
  // 64:ff9b::/96 (NAT64), 100::/64, fc00::/7 (ULA), fe80::/10 (link-local),
  // fec0::/10, ff00::/8 (multicast).
  if ((g[0] & 0xe000) !== 0x2000) return true;

  if (g[0] === 0x2001 && g[1] === 0x0db8) return true; // dokumentasi
  if (g[0] === 0x2001 && g[1] === 0x0000) return true; // Teredo (IPv4 tertanam)
  if (g[0] === 0x2001 && g[1] < 0x0200) return true; // IETF protocol assignments 2001::/23
  if (g[0] === 0x2002) return true; // 6to4 (IPv4 tertanam)
  return false;
}

function isIpLiteral(hostname: string): boolean {
  return hostname.startsWith("[") || hostname.includes(":") || parseIPv4(hostname) !== null;
}

// ─── URL validation ───────────────────────────────────────────────

/**
 * Validasi sintaks URL (tanpa DNS). Melempar SafeFetchError jika ditolak.
 * Aman dipanggil sebelum reservasi kuota.
 */
export function assertSafeUrlSyntax(value: string, allowHttp = false): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new SafeFetchError("URL tidak valid.");
  }

  const protocolOk = url.protocol === "https:" || (allowHttp && url.protocol === "http:");
  if (!protocolOk) throw new SafeFetchError("URL harus menggunakan https.");
  if (url.username || url.password) throw new SafeFetchError("URL tidak boleh berisi kredensial.");
  if (url.port !== "") throw new SafeFetchError("URL tidak boleh memakai port khusus.");

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host || isIpLiteral(host)) throw new SafeFetchError("URL harus memakai nama domain.");
  if (!host.includes(".")) throw new SafeFetchError("Domain URL tidak valid.");
  if (BLOCKED_HOSTNAMES.has(host) || BLOCKED_SUFFIXES.some((s) => host.endsWith(s))) {
    throw new SafeFetchError("Domain URL tidak diizinkan.");
  }
  return url;
}

async function assertPublicDns(hostname: string): Promise<void> {
  const host = hostname.replace(/\.$/, "");
  const resolve = (
    Deno as unknown as {
      resolveDns?: (q: string, t: "A" | "AAAA") => Promise<string[]>;
    }
  ).resolveDns;
  if (typeof resolve !== "function") {
    // Fail closed: tanpa resolver kita tidak bisa memastikan IP publik.
    throw new SafeFetchError("Resolusi DNS tidak tersedia.");
  }

  const [a, aaaa] = await Promise.allSettled([resolve(host, "A"), resolve(host, "AAAA")]);
  const v4 = a.status === "fulfilled" ? a.value : [];
  const v6 = aaaa.status === "fulfilled" ? aaaa.value : [];

  if (v4.length === 0 && v6.length === 0) {
    throw new SafeFetchError("Domain URL tidak ditemukan.");
  }
  if (v4.some(isBlockedIPv4) || v6.some(isBlockedIPv6)) {
    throw new SafeFetchError("Domain URL mengarah ke alamat yang tidak diizinkan.");
  }
}

// ─── Fetch ────────────────────────────────────────────────────────

/**
 * Fetch dengan validasi SSRF di setiap hop. Body TIDAK dibaca — gunakan
 * `readBodyLimited` untuk membacanya dengan batas ukuran.
 */
export async function safeFetch(
  input: string,
  options: SafeFetchOptions = {},
): Promise<SafeFetchResult> {
  const { timeoutMs = 10_000, maxRedirects = 3, allowHttp = false, headers } = options;
  const signal = AbortSignal.timeout(timeoutMs);

  let current = assertSafeUrlSyntax(input, allowHttp);
  for (let hop = 0; ; hop++) {
    await assertPublicDns(current.hostname);

    let res: Response;
    try {
      res = await fetch(current.toString(), { headers, redirect: "manual", signal });
    } catch (e) {
      if (e instanceof DOMException && (e.name === "TimeoutError" || e.name === "AbortError")) {
        throw new SafeFetchError("Waktu mengambil URL habis.");
      }
      throw new SafeFetchError("Gagal menghubungi URL.");
    }

    if (res.status >= 300 && res.status < 400 && res.headers.has("location")) {
      await res.body?.cancel().catch(() => {});
      if (hop >= maxRedirects) throw new SafeFetchError("Terlalu banyak redirect.");
      let next: URL;
      try {
        next = new URL(res.headers.get("location")!, current);
      } catch {
        throw new SafeFetchError("Redirect tidak valid.");
      }
      current = assertSafeUrlSyntax(next.toString(), allowHttp);
      continue;
    }

    return {
      ok: res.ok,
      status: res.status,
      url: current.toString(),
      contentType: (res.headers.get("content-type") || "").toLowerCase(),
      response: res,
    };
  }
}

/** Baca body sebagai stream, berhenti (dan potong) di `maxBytes`. */
export async function readBodyLimited(
  res: Response,
  maxBytes: number,
): Promise<{ bytes: Uint8Array; truncated: boolean }> {
  if (!res.body) return { bytes: new Uint8Array(0), truncated: false };
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let truncated = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      const room = maxBytes - total;
      if (value.byteLength >= room) {
        if (room > 0) chunks.push(value.subarray(0, room));
        total += Math.max(room, 0);
        truncated = value.byteLength > room;
        break;
      }
      chunks.push(value);
      total += value.byteLength;
    }
  } finally {
    await reader.cancel().catch(() => {});
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.byteLength;
  }
  return { bytes, truncated };
}

const TEXT_CONTENT_TYPE = /^(text\/|application\/(xhtml\+xml|xml|json|ld\+json))/;

/**
 * Ambil URL publik sebagai teks dengan proteksi SSRF.
 * Melempar SafeFetchError untuk URL yang ditolak, status non-2xx,
 * content-type non-teks, atau kegagalan jaringan.
 */
export async function safeFetchText(
  url: string,
  options: SafeFetchOptions = {},
): Promise<{ text: string; url: string; truncated: boolean }> {
  const { maxBytes = 1_000_000 } = options;
  const result = await safeFetch(url, options);
  if (!result.ok) {
    await result.response.body?.cancel().catch(() => {});
    throw new SafeFetchError(`URL mengembalikan status ${result.status}.`);
  }
  if (result.contentType && !TEXT_CONTENT_TYPE.test(result.contentType)) {
    await result.response.body?.cancel().catch(() => {});
    throw new SafeFetchError("Konten URL bukan teks/HTML.");
  }
  const { bytes, truncated } = await readBodyLimited(result.response, maxBytes);
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  return { text, url: result.url, truncated };
}
