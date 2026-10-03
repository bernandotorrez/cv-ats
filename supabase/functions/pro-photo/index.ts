/**
 * Pro Photo — ubah foto kasual menjadi foto profesional via Kie AI.
 *
 * POST /pro-photo            Body: { imageUrl }  → { success, taskId }
 * GET  /pro-photo?taskId=…   → { status: "generating" | "success" | "failed", imageUrl?, error? }
 *
 * Keamanan:
 * - Kuota dikonsumsi ATOMIK (consume_profile_quota) sebelum task Kie dibuat,
 *   dan di-refund jika pembuatan task gagal (H3).
 * - Task ID diikat ke pemiliknya di tabel pro_photo_tasks (M8).
 * - imageUrl hanya boleh dari Supabase Storage project ini.
 */
import { corsHeaders } from "../_shared/cors.ts";
import { errorResponse, getAdminClient, getUserId } from "../_shared/ai-common.ts";
import { checkRateLimit, createRateLimitedResponse } from "../_shared/rate-limit.ts";
import { assertSafeUrlSyntax, readBodyLimited, safeFetch } from "../_shared/safe-fetch.ts";
import { limitText, readJsonBody, ValidationError } from "../_shared/validation.ts";

const KIE_BASE = "https://api.kie.ai/api/v1/jobs";
const TASK_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;
const MAX_RESULT_BYTES = 15 * 1024 * 1024;
const TIER_PHOTO_QUOTA: Record<string, number> = { starter: 2, pro: 5 };

type QuotaColumn = "quota_pro_photo" | "quota_pro_photo_purchased";

const PROMPT =
  "Convert this casual photo of a person into a highly professional business portrait headshot. The person should be facing directly forward with a straight, upright posture, looking directly at the camera. The composition should be a chest-up portrait only (cropped from the chest upward), similar to a professional passport or ID photo. The person should be wearing a clean, modern, and perfectly fitted professional dark suit with a collared white shirt and a matching professional tie (or a professional business blazer/blouse for a woman). The background should be a clean, slightly blurred professional studio background with neutral professional office colors (soft gray/blue). Face features, hairstyle, facial proportions, expression, and gender of the person must remain identical to the input photo. Use polished studio lighting, sharp focus, high-end DSLR camera quality, 8K resolution, and a photorealistic corporate portrait style and Remove Background then Change to White Colour";

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

/** imageUrl wajib berasal dari Supabase Storage project ini. */
function assertOwnStorageUrl(value: string): string {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) throw new Error("Konfigurasi server tidak lengkap.");
  const own = new URL(supabaseUrl);

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ValidationError("URL foto tidak valid.");
  }
  if (
    url.protocol !== own.protocol ||
    url.hostname !== own.hostname ||
    url.port !== own.port ||
    url.username ||
    url.password ||
    !url.pathname.startsWith("/storage/v1/")
  ) {
    throw new ValidationError("Foto harus diunggah terlebih dahulu ke CV Pintar.");
  }
  return url.toString();
}

/** Ekstrak URL hasil dari respons Kie AI. */
function extractResultUrl(result: unknown): string | null {
  let imageUrl: unknown = null;
  if (result) {
    if (typeof result === "string") {
      try {
        const parsed = JSON.parse(result);
        imageUrl =
          parsed.url ||
          parsed.image_url ||
          parsed.imageUrl ||
          parsed.images?.[0] ||
          parsed.resultUrls?.[0] ||
          parsed.result;
      } catch {
        if (result.startsWith("http")) imageUrl = result;
      }
    } else if (typeof result === "object") {
      const r = result as Record<string, unknown> & {
        images?: unknown[];
        resultUrls?: unknown[];
      };
      imageUrl =
        r.url || r.image_url || r.imageUrl || r.images?.[0] || r.resultUrls?.[0] || r.result;
    }
  }

  // Broad fallback search if still not found
  if (!imageUrl && result) {
    const str = typeof result === "string" ? result : JSON.stringify(result);
    const match = str?.match(/https?:\/\/[^"'\s\\]+/i);
    if (match) imageUrl = match[0].replace(/\\/g, "");
  }
  return typeof imageUrl === "string" ? imageUrl : null;
}

async function handleStatus(
  req: Request,
  admin: ReturnType<typeof getAdminClient>,
  userId: string,
  apiKey: string,
) {
  const taskId = new URL(req.url).searchParams.get("taskId") || "";
  if (!TASK_ID_PATTERN.test(taskId)) {
    return json(req, { error: "taskId tidak valid." }, 400);
  }

  // Kepemilikan task (M8)
  const { data: task, error: taskError } = await admin
    .from("pro_photo_tasks")
    .select("task_id")
    .eq("task_id", taskId)
    .eq("user_id", userId)
    .maybeSingle();
  if (taskError) {
    console.error("pro_photo_tasks lookup failed:", taskError);
    return json(req, { error: "Terjadi kesalahan. Silakan coba lagi." }, 500);
  }
  if (!task) return json(req, { error: "Task tidak ditemukan." }, 404);

  const statusRes = await fetch(`${KIE_BASE}/recordInfo?taskId=${encodeURIComponent(taskId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!statusRes.ok) {
    console.error(
      "Kie AI status check error:",
      statusRes.status,
      await statusRes.text().catch(() => ""),
    );
    return json(req, { error: "Gagal mengecek status foto AI." }, 502);
  }

  const statusData = await statusRes.json();
  const data = statusData?.data || {};
  const status = data.status ?? data.state;
  const result = data.result || data.resultJson;

  const isSuccess =
    status === 1 ||
    status === "success" ||
    status === "completed" ||
    status === "successed" ||
    status === "DONE";
  const isFailed =
    status === 2 ||
    status === 3 ||
    status === "failed" ||
    status === "fail" ||
    status === "error" ||
    status === "FAILED";

  if (isFailed) {
    console.error("Kie AI task failed:", taskId, data.failCode, data.failMsg);
    return json(req, {
      status: "failed",
      error: "Gagal membuat foto profesional. Silakan coba lagi.",
    });
  }
  if (!isSuccess) return json(req, { status: "generating" });

  const kieUrl = extractResultUrl(result);
  if (!kieUrl) {
    console.error(
      "Kie AI result without image URL:",
      taskId,
      JSON.stringify(statusData).slice(0, 1000),
    );
    return json(req, { status: "failed", error: "Hasil foto tidak ditemukan." });
  }

  // Simpan hasil ke storage user (URL Kie bersifat sementara)
  try {
    const fetched = await safeFetch(kieUrl, {
      timeoutMs: 20_000,
      maxRedirects: 3,
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const contentType = fetched.contentType.split(";")[0].trim();
    if (!fetched.ok || (contentType && !contentType.startsWith("image/"))) {
      await fetched.response.body?.cancel().catch(() => {});
      throw new Error(`Download failed: ${fetched.status} ${contentType}`);
    }
    const { bytes, truncated } = await readBodyLimited(fetched.response, MAX_RESULT_BYTES);
    if (truncated || bytes.byteLength === 0) throw new Error("Result image too large or empty");

    const uploadType = ["image/png", "image/jpeg", "image/webp"].includes(contentType)
      ? contentType
      : "image/png";
    const filePath = `${userId}/pro-photo-${taskId}.png`;
    const { error: uploadError } = await admin.storage
      .from("cv-photos")
      .upload(filePath, bytes, { contentType: uploadType, upsert: true });
    if (uploadError) throw uploadError;

    const { data: signedData } = await admin.storage
      .from("cv-photos")
      .createSignedUrl(filePath, 31536000); // 1 year
    if (!signedData?.signedUrl) throw new Error("Failed to create signed URL");

    return json(req, { status: "success", imageUrl: signedData.signedUrl });
  } catch (storageErr) {
    console.error("Failed to store pro-photo result:", storageErr);
  }

  // Fallback: kembalikan URL sementara Kie (hanya jika https & domain publik)
  try {
    assertSafeUrlSyntax(kieUrl);
    return json(req, { status: "success", imageUrl: kieUrl });
  } catch {
    return json(req, { status: "failed", error: "Gagal menyimpan foto profesional." });
  }
}

async function handleCreate(
  req: Request,
  admin: ReturnType<typeof getAdminClient>,
  userId: string,
  apiKey: string,
) {
  const body = await readJsonBody(req, 10_000);
  const rawImageUrl = limitText(body.imageUrl, 2_000, "imageUrl");
  if (!rawImageUrl) return json(req, { error: "Missing imageUrl" }, 400);
  const imageUrl = assertOwnStorageUrl(rawImageUrl);

  const { data: profile } = await admin
    .from("profiles")
    .select("quota_pro_photo_reset_at")
    .eq("id", userId)
    .single();

  // Lazy monthly reset untuk kuota tier
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const lastReset = profile?.quota_pro_photo_reset_at
    ? new Date(profile.quota_pro_photo_reset_at)
    : null;
  if (!lastReset || lastReset < monthStart) {
    const { data: sub } = await admin
      .from("user_subscriptions")
      .select("subscription_tiers!inner(slug)")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    const tierSlug = (sub as { subscription_tiers?: { slug?: string } } | null)?.subscription_tiers
      ?.slug;
    const tierAllocation = tierSlug ? TIER_PHOTO_QUOTA[tierSlug] : undefined;

    if (tierAllocation !== undefined) {
      // Kondisional: hanya satu request paralel yang melakukan reset bulan ini
      await admin
        .from("profiles")
        .update({
          quota_pro_photo: tierAllocation,
          quota_pro_photo_reset_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .or(
          `quota_pro_photo_reset_at.is.null,quota_pro_photo_reset_at.lt."${monthStart.toISOString()}"`,
        );
    }
  }

  // Konsumsi kuota secara atomik: kuota tier dulu, lalu kuota beli (add-on)
  let consumedColumn: QuotaColumn | null = null;
  for (const column of ["quota_pro_photo", "quota_pro_photo_purchased"] as const) {
    const { data: ok, error } = await admin.rpc("consume_profile_quota", {
      p_user: userId,
      p_column: column,
    });
    if (error) {
      console.error("consume_profile_quota failed:", error);
      return json(req, { error: "Gagal memverifikasi kuota. Silakan coba lagi." }, 500);
    }
    if (ok === true) {
      consumedColumn = column;
      break;
    }
  }

  if (!consumedColumn) {
    return json(
      req,
      { error: "Access Denied: Please buy Photo Pro Quota to use this feature." },
      403,
    );
  }

  const refund = async () => {
    const { error } = await admin.rpc("refund_profile_quota", {
      p_user: userId,
      p_column: consumedColumn,
    });
    if (error) console.error("refund_profile_quota failed:", error);
  };

  let taskId: string | null = null;
  try {
    const response = await fetch(`${KIE_BASE}/createTask`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/nano-banana-edit",
        input: {
          prompt: PROMPT,
          image_urls: [imageUrl],
          output_format: "png",
          aspect_ratio: "1:1",
        },
      }),
    });

    if (!response.ok) {
      console.error(
        "Kie AI createTask HTTP error:",
        response.status,
        await response.text().catch(() => ""),
      );
    } else {
      const resData = await response.json();
      if (resData.code !== 200 && resData.code !== 0 && resData.msg) {
        console.error("Kie AI createTask error:", resData.code, resData.msg);
      } else {
        const candidate = resData.data?.taskId || resData.taskId;
        if (typeof candidate === "string" && TASK_ID_PATTERN.test(candidate)) {
          taskId = candidate;
        } else {
          console.error(
            "Kie AI createTask: invalid/missing taskId:",
            JSON.stringify(resData).slice(0, 500),
          );
        }
      }
    }
  } catch (e) {
    console.error("Kie AI createTask request failed:", e);
  }

  if (!taskId) {
    await refund();
    return json(req, { error: "Gagal membuat tugas foto AI. Silakan coba lagi." }, 502);
  }

  const { error: insertError } = await admin
    .from("pro_photo_tasks")
    .insert({ task_id: taskId, user_id: userId });
  if (insertError) {
    console.error("Failed to record pro_photo_task:", insertError);
    await refund();
    return json(req, { error: "Terjadi kesalahan. Silakan coba lagi." }, 500);
  }

  return json(req, { success: true, taskId });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  try {
    const userId = await getUserId(req);

    // Rate Limiting
    const rateLimitKey = `pro-photo:${userId}`;
    const rl = checkRateLimit(rateLimitKey, 20, 60 * 1000);
    if (!rl.allowed) {
      return createRateLimitedResponse(
        rl,
        JSON.stringify({ error: "Terlalu banyak request. Silakan coba lagi nanti." }),
        corsHeaders(req),
      );
    }

    if (req.method !== "GET" && req.method !== "POST") {
      return json(req, { error: "Method not allowed" }, 405);
    }

    const apiKey = Deno.env.get("KIE_AI_KEY");
    if (!apiKey) {
      console.error("KIE_AI_KEY is not configured");
      return json(req, { error: "Layanan foto AI sedang tidak tersedia." }, 503);
    }

    const admin = getAdminClient();
    return req.method === "GET"
      ? await handleStatus(req, admin, userId, apiKey)
      : await handleCreate(req, admin, userId, apiKey);
  } catch (e) {
    return errorResponse(e, req);
  }
});
