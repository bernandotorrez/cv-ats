/**
 * AI Extract Text — OCR gambar/halaman PDF via Gemini multimodal
 * Fallback saat ekstraksi teks client-side gagal (PDF berbasis gambar).
 *
 * POST /ai-extract-text
 * Body: { images: string[] (base64 png/jpg/webp, atau data URI), fileName: string }
 *
 * Akses: sama dengan kelayakan Upload CV (add-on aktif / kuota upload > 0 /
 * tier berbayar) TANPA mengonsumsi kuota upload; dibatasi kuota bulanan
 * terpisah (`extract_text`).
 */

import {
  CV_AI_MODEL,
  corsResponse,
  errorResponse,
  getAdminClient,
  getUserId,
  reserveQuota,
} from "../_shared/ai-common.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, createRateLimitedResponse } from "../_shared/rate-limit.ts";
import { limitText, readJsonBody, ValidationError } from "../_shared/validation.ts";

const AI_GATEWAY_URL = "https://ai.sumopod.com/v1/chat/completions";
const AI_API_KEY = Deno.env.get("AI_API_KEY") || "";

// renderPdfToImages() di frontend (src/lib/cv-text-extractor.ts) mengirim maks 10 halaman.
const MAX_IMAGES = 10;
const MAX_IMAGE_CHARS = 2_800_000; // ≈ 2 MB biner per gambar
const MAX_TOTAL_CHARS = 12_000_000; // ≈ 9 MB biner per request
const MONTHLY_EXTRACT_LIMIT = 60;
const PAID_TIERS = new Set(["starter", "pro", "pro_plus"]);

const UPLOAD_DENIED_MESSAGE =
  "Fitur Upload CV hanya untuk pengguna berbayar. Silakan Upgrade Tier atau beli fitur Upload CV.";

type ImageMime = "image/png" | "image/jpeg" | "image/webp";

/** Validasi satu gambar (data URI atau base64 mentah) → data URI yang aman. */
function toImageDataUri(value: unknown, index: number): string {
  if (typeof value !== "string" || !value) {
    throw new ValidationError(`Gambar halaman ${index + 1} tidak valid.`);
  }

  let declared: ImageMime | null = null;
  let b64 = value;
  const dataUri = value.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,/i);
  if (dataUri) {
    const m = dataUri[1].toLowerCase();
    declared = (m === "image/jpg" ? "image/jpeg" : m) as ImageMime;
    b64 = value.slice(dataUri[0].length);
  } else if (value.startsWith("data:")) {
    throw new ValidationError(`Format gambar halaman ${index + 1} tidak didukung.`);
  }

  if (b64.length > MAX_IMAGE_CHARS) {
    throw new ValidationError(`Gambar halaman ${index + 1} terlalu besar (maks ±2 MB).`);
  }
  if (b64.length < 100 || !/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) {
    throw new ValidationError(`Gambar halaman ${index + 1} tidak valid.`);
  }

  // Cek magic bytes dari prefix base64
  let sniffed: ImageMime | null = null;
  if (b64.startsWith("iVBORw0KGgo")) sniffed = "image/png";
  else if (b64.startsWith("/9j/")) sniffed = "image/jpeg";
  else if (b64.startsWith("UklGR") && atob(b64.slice(0, 16)).slice(8, 12) === "WEBP") {
    sniffed = "image/webp";
  }

  if (!sniffed || (declared && declared !== sniffed)) {
    throw new ValidationError(`Format gambar halaman ${index + 1} tidak didukung (PNG/JPEG/WebP).`);
  }
  return `data:${sniffed};base64,${b64}`;
}

/** Kelayakan Upload CV (logika sama dengan ai-parse-cv), tanpa mengonsumsi kuota. */
async function isUploadCvEligible(
  admin: ReturnType<typeof getAdminClient>,
  userId: string,
): Promise<boolean> {
  const { data: profile } = await admin
    .from("profiles")
    .select("has_upload_cv, upload_cv_end_date, quota_upload_cv")
    .eq("id", userId)
    .maybeSingle();

  let hasUploadCvAddon = profile?.has_upload_cv || false;
  if (profile?.upload_cv_end_date) {
    hasUploadCvAddon = new Date(profile.upload_cv_end_date) > new Date();
  }
  if (hasUploadCvAddon) return true;
  if ((profile?.quota_upload_cv || 0) > 0) return true;

  // Tier berbayar selalu mendapat alokasi upload bulanan (lazy reset di ai-parse-cv)
  const { data: sub } = await admin
    .from("user_subscriptions")
    .select("subscription_tiers!inner(slug)")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  const tierSlug = (sub as { subscription_tiers?: { slug?: string } } | null)?.subscription_tiers
    ?.slug;
  return Boolean(tierSlug && PAID_TIERS.has(tierSlug));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const userId = await getUserId(req);

    // Rate Limiting
    const rateLimitKey = `ai-extract-text:${userId}`;
    const rl = checkRateLimit(rateLimitKey, 30, 60 * 1000);
    if (!rl.allowed) {
      return createRateLimitedResponse(
        rl,
        JSON.stringify({ error: "Terlalu banyak request. Silakan coba lagi nanti." }),
        corsHeaders(req),
      );
    }

    const body = await readJsonBody(req, MAX_TOTAL_CHARS + 50_000);
    const { images } = body;
    limitText(body.fileName, 500, "nama file");

    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new ValidationError("Tidak ada gambar untuk diekstrak.");
    }
    if (images.length > MAX_IMAGES) {
      throw new ValidationError(`Maksimal ${MAX_IMAGES} halaman per request.`);
    }
    const imageUris = images.map((img, i) => toImageDataUri(img, i));
    const totalChars = imageUris.reduce((n, s) => n + s.length, 0);
    if (totalChars > MAX_TOTAL_CHARS) {
      throw new ValidationError("Total ukuran gambar terlalu besar.");
    }

    if (!AI_API_KEY) throw new Error("AI_API_KEY tidak dikonfigurasi.");

    const admin = getAdminClient();
    if (!(await isUploadCvEligible(admin, userId))) {
      return corsResponse({ error: UPLOAD_DENIED_MESSAGE }, 403, req);
    }

    // Kuota bulanan OCR (per request), dikembalikan jika layanan AI gagal total.
    const reservation = await reserveQuota(admin, userId, "extract_text", 800 * imageUris.length, {
      limit: MONTHLY_EXTRACT_LIMIT,
    });

    const extractedPages: string[] = [];
    let gatewaySuccesses = 0;

    try {
      for (let i = 0; i < imageUris.length; i++) {
        const prompt =
          i === 0
            ? `Ekstrak SEMUA teks dari gambar CV ini (halaman ${i + 1} dari ${imageUris.length}). Ini adalah CV profesional. Ekstrak teks apa adanya — nama, kontak, pengalaman kerja, pendidikan, skill, dll. JANGAN tambahkan komentar atau analisis. HANYA teks yang ada di CV. Jika halaman kosong atau tidak ada teks, jawab "[KOSONG]".`
            : `Ekstrak SEMUA teks dari gambar CV halaman ${i + 1} dari ${imageUris.length}. JANGAN tambahkan komentar. HANYA teks yang ada di halaman ini. Jika kosong, jawab "[KOSONG]".`;

        const res = await fetch(AI_GATEWAY_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${AI_API_KEY}`,
          },
          body: JSON.stringify({
            model: CV_AI_MODEL,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: imageUris[i] } },
                ],
              },
            ],
            temperature: 0.1,
            max_tokens: 3000,
          }),
        });

        if (!res.ok) {
          console.error(`AI Gateway error page ${i + 1}:`, await res.text().catch(() => ""));
          continue;
        }
        gatewaySuccesses++;

        const data = (await res.json()) as {
          choices: { message: { content: string } }[];
        };
        const result = data.choices?.[0]?.message?.content ?? "";
        const cleaned = result.replace(/^\[KOSONG\]$/i, "").trim();
        if (cleaned) extractedPages.push(cleaned);
      }
    } catch (e) {
      if (gatewaySuccesses === 0) await reservation.release();
      throw e;
    }

    // Layanan AI gagal di semua halaman → kuota dikembalikan.
    if (gatewaySuccesses === 0) {
      await reservation.release();
      throw new Error("Layanan AI sedang tidak tersedia. Silakan coba lagi nanti.");
    }

    const fullText = extractedPages.join("\n\n");

    if (!fullText.trim()) {
      throw new Error(
        "Tidak ada teks yang bisa diekstrak dari CV. Pastikan CV berisi teks yang terbaca.",
      );
    }

    return corsResponse({ text: fullText }, 200, req);
  } catch (e) {
    return errorResponse(e, req);
  }
});
