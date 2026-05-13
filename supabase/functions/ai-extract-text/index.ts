/**
 * AI Extract Text — OCR gambar/halaman PDF via Gemini multimodal
 * Fallback saat ekstraksi teks client-side gagal (PDF berbasis gambar).
 *
 * POST /ai-extract-text
 * Body: { images: string[] (base64 png/jpg), fileName: string }
 */

import { getUserId, corsResponse, errorResponse } from "../_shared/ai-common.ts";
import { corsHeaders } from "../_shared/cors.ts";

const AI_GATEWAY_URL = "https://ai.sumopod.com/v1/chat/completions";
const AI_API_KEY = Deno.env.get("AI_API_KEY") || "";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    await getUserId(req);

    const { images, fileName } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error("Tidak ada gambar untuk diekstrak.");
    }

    if (images.length > 10) {
      throw new Error("Maksimal 10 halaman per request.");
    }

    if (!AI_API_KEY) throw new Error("AI_API_KEY tidak dikonfigurasi.");

    const extractedPages: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const imageBase64 = images[i];

      const prompt = i === 0
        ? `Ekstrak SEMUA teks dari gambar CV ini (halaman ${i + 1} dari ${images.length}). Ini adalah CV profesional. Ekstrak teks apa adanya — nama, kontak, pengalaman kerja, pendidikan, skill, dll. JANGAN tambahkan komentar atau analisis. HANYA teks yang ada di CV. Jika halaman kosong atau tidak ada teks, jawab "[KOSONG]".`
        : `Ekstrak SEMUA teks dari gambar CV halaman ${i + 1} dari ${images.length}. JANGAN tambahkan komentar. HANYA teks yang ada di halaman ini. Jika kosong, jawab "[KOSONG]".`;

      const res = await fetch(AI_GATEWAY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gemini/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: { url: `data:image/png;base64,${imageBase64}` },
                },
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

      const data = (await res.json()) as {
        choices: { message: { content: string } }[];
      };
      const result = data.choices?.[0]?.message?.content ?? "";
      const cleaned = result.replace(/^\[KOSONG\]$/i, "").trim();
      if (cleaned) extractedPages.push(cleaned);
    }

    const fullText = extractedPages.join("\n\n");

    if (!fullText.trim()) {
      throw new Error("Tidak ada teks yang bisa diekstrak dari CV. Pastikan CV berisi teks yang terbaca.");
    }

    return corsResponse({ text: fullText }, 200, req);
  } catch (e) {
    return errorResponse(e, req);
  }
});
