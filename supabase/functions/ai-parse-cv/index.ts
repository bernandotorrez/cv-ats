/**
 * AI Parse CV — Extract structured CvData from raw PDF/DOCX text
 * Menerima teks hasil ekstraksi client-side, mengembalikan Partial<CvData>
 *
 * POST /ai-parse-cv
 * Body: { rawText: string }
 */

import {
  aiComplete,
  checkAndTrackQuota,
  corsResponse,
  errorResponse,
  getAdminClient,
  getUserId,
  getLanguageInstruction,
  type CvUiLang,
} from "../_shared/ai-common.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const userId = await getUserId(req);
    const admin = getAdminClient();

    // Check user tier and has_upload_cv feature
    const { data: profile } = await admin
      .from("profiles")
      .select("has_upload_cv, upload_cv_end_date, quota_upload_cv, quota_upload_cv_reset_at")
      .eq("id", userId)
      .single();

    const { data: sub } = await admin
      .from("user_subscriptions")
      .select("subscription_tiers!inner(slug)")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    const tierSlug = (sub as any)?.subscription_tiers?.slug as string | undefined;
    const TIER_UPLOAD_CV_QUOTA: Record<string, number> = { starter: 10, pro: 20 };

    let hasUploadCvAddon = profile?.has_upload_cv || false;
    if (profile?.upload_cv_end_date) {
      hasUploadCvAddon = new Date(profile.upload_cv_end_date) > new Date();
    }

    // Lazy monthly reset for tier quota
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const lastReset = profile?.quota_upload_cv_reset_at
      ? new Date(profile.quota_upload_cv_reset_at)
      : null;
    const needsReset = !lastReset || lastReset < monthStart;

    let effectiveQuota = profile?.quota_upload_cv || 0;

    if (needsReset) {
      const tierAllocation = tierSlug ? TIER_UPLOAD_CV_QUOTA[tierSlug] : null;
      if (tierAllocation !== null && tierAllocation !== undefined) {
        effectiveQuota = tierAllocation;
        await admin
          .from("profiles")
          .update({
            quota_upload_cv: effectiveQuota,
            quota_upload_cv_reset_at: new Date().toISOString(),
          })
          .eq("id", userId);
      }
    }

    // A user can upload CV if they have the add-on OR they have quota > 0
    const canUpload = hasUploadCvAddon || effectiveQuota > 0;

    if (!canUpload) {
      throw new Error(
        "Fitur Upload CV hanya untuk pengguna berbayar. Silakan Upgrade Tier atau beli fitur Upload CV.",
      );
    }

    const { rawText, language } = await req.json();
    const lang: CvUiLang = language === "en" ? "en" : "id";

    if (!rawText || typeof rawText !== "string" || rawText.trim().length < 30) {
      throw new Error("Teks CV terlalu pendek. Pastikan file CV berisi data yang cukup.");
    }

    const cvText = rawText.trim();

    const parsePrompt = `Kamu adalah AI parser profesional untuk CV. Tugasmu: membaca teks CV mentah (hasil ekstraksi dari PDF/DOCX) dan mengubahnya menjadi JSON terstruktur.

ATURAN PARSING:
1. PERSONAL:
   - fullName: NAMA LENGKAP (wajib diisi kalau ada)
   - headline: Jabatan/profesi saat ini atau terakhir
   - email: Alamat email
   - phone: Nomor telepon
   - location: Kota/negara
   - summary: Ringkasan profil (jika ada di CV)
   - linkedin, website: jika ada

2. EXPERIENCES (array, kronologis TERBARU dulu):
   - company: Nama perusahaan
   - position: Jabatan
   - location: Lokasi kerja (opsional)
   - startDate: Format "YYYY-MM" atau "YYYY"
   - endDate: Format "YYYY-MM" atau "YYYY", kosongkan jika masih bekerja
   - current: true jika pekerjaan saat ini
   - description: Deskripsi pekerjaan, POLES jadi bullet points profesional dengan kata kerja aktif

3. EDUCATIONS (array, TERBARU dulu):
   - school: Nama institusi (lengkap, termasuk akronim kalau umum)
   - degree: Gelar (S1, S2, D3, SMA, dll)
   - field: Jurusan/bidang studi
   - startDate, endDate: Format "YYYY"

4. SKILLS (array):
   - name: Nama skill (spesifik, bukan generic)
   - level: "Beginner" | "Intermediate" | "Advanced" | "Expert"
   
5. LANGUAGES (array):
   - name: Nama bahasa
   - level: "Basic" | "Intermediate" | "Advanced" | "Native"

6. CERTIFICATES (array, jika ada):
   - name: Nama sertifikat
   - issuer: Penerbit
   - date: Format "YYYY-MM"

PENTING:
- JANGAN membuat data yang tidak ada di teks
- Untuk tanggal: gunakan perkiraan terbaik dari konteks
- Deskripsi WAJIB dipoles: gunakan bullet points (•) dengan kata kerja aktif
- Skill: gunakan nama spesifik (bukan "Microsoft Office", tapi "Microsoft Excel, Microsoft Word")
- ${lang === "en" ? "All text MUST be in English (except company names/skills that are originally in other languages)" : "Semua teks WAJIB Bahasa Indonesia (kecuali nama perusahaan/skill yang memang Bahasa Inggris)"}
- Output WAJIB JSON valid`;

    const result = await aiComplete(
      [
        { role: "system", content: parsePrompt },
        {
          role: "user",
          content: `CV TEXT:\n\n${cvText}\n\nParse CV ini menjadi JSON terstruktur sesuai format yang dijelaskan.`,
        },
      ],
      { temperature: 0.2, maxTokens: 4000, jsonMode: true },
      lang,
    );

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(result);
    } catch {
      const match = result.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          throw new Error("Gagal parse hasil AI. Silakan coba lagi.");
        }
      } else {
        throw new Error("Format respons AI tidak valid. Silakan coba lagi.");
      }
    }

    // Add IDs to array items
    const uid = () => Math.random().toString(36).slice(2, 10);
    const cvData: Record<string, unknown> = {};

    if (parsed.personal && typeof parsed.personal === "object") {
      cvData.personal = parsed.personal;
    }

    if (Array.isArray(parsed.experiences)) {
      cvData.experiences = parsed.experiences.map((exp: any) => ({
        ...exp,
        id: exp.id || uid(),
      }));
    }

    if (Array.isArray(parsed.educations)) {
      cvData.educations = parsed.educations.map((edu: any) => ({
        ...edu,
        id: edu.id || uid(),
      }));
    }

    if (Array.isArray(parsed.skills)) {
      cvData.skills = parsed.skills.map((sk: any) => ({
        ...sk,
        id: sk.id || uid(),
        level: sk.level || "Intermediate",
      }));
    }

    if (Array.isArray(parsed.languages)) {
      cvData.languages = parsed.languages.map((lang: any) => ({
        ...lang,
        id: lang.id || uid(),
        level: lang.level || "Intermediate",
      }));
    }

    if (Array.isArray(parsed.certificates)) {
      cvData.certificates = parsed.certificates.map((cert: any) => ({
        ...cert,
        id: cert.id || uid(),
      }));
    }

    await checkAndTrackQuota(admin, userId, "guided", 600);

    // If they don't have the addon, decrement the tier quota
    if (!hasUploadCvAddon && effectiveQuota > 0) {
      await admin
        .from("profiles")
        .update({ quota_upload_cv: effectiveQuota - 1 })
        .eq("id", userId);
    }

    return corsResponse({ success: true, cvData }, 200, req);
  } catch (e) {
    return errorResponse(e, req);
  }
});
