/**
 * PDF Generation Edge Function
 * Generates PDF from CV data using html-to-pdf approach.
 * POST /generate-pdf
 */
import { corsHeaders } from "../_shared/cors.ts";
import { getUserId, getAdminClient } from "../_shared/ai-common.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const userId = await getUserId(req);
    const admin = getAdminClient();
    const {
      cvId,
      format = "pdf",
      withWatermark = false,
      html: directHtml,
      filename: directFilename,
    } = await req.json();

    // Support direct HTML input for cover letter PDFs (no cvId required)
    if (directHtml) {
      const filename = directFilename || `document-${Date.now()}.pdf`;
      const bucketName = "cv-pdfs";
      const fileName = `${userId}-${Date.now()}.html`;

      const { error: uploadError } = await admin.storage
        .from(bucketName)
        .upload(fileName, new Blob([directHtml], { type: "text/html" }), {
          contentType: "text/html",
          upsert: true,
        });

      if (uploadError) throw new Error("Gagal mengunggah file");

      const { data: urlData } = admin.storage.from(bucketName).getPublicUrl(fileName);

      return new Response(JSON.stringify({ url: urlData.publicUrl, fileName, format: "html" }), {
        status: 200,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // CV PDF generation requires cvId
    if (!cvId) throw new Error("cvId diperlukan");

    // Fetch CV data
    const { data: cv, error: cvError } = await admin
      .from("cvs")
      .select("*")
      .eq("id", cvId)
      .eq("user_id", userId)
      .single();

    if (cvError || !cv) throw new Error("CV tidak ditemukan");

    // Get user tier for watermark check
    const { data: sub } = await (admin as any)
      .from("user_subscriptions")
      .select("subscription_tiers!inner(slug)")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    const tier = sub?.subscription_tiers?.slug ?? "free";
    const shouldWatermark = tier === "free";

    // Generate PDF content as HTML
    const cvData = cv.data || {};
    const html = generateCvHtml(cv.title || "CV", cvData, cv.template_id, shouldWatermark);

    // Convert to PDF using a simple approach
    // In production, use a proper HTML-to-PDF service like Browserless, Puppeteer, or docx-templater
    // For now, return the HTML wrapped as a download
    const bucketName = "cv-pdfs";
    const fileName = `${cvId}-${Date.now()}.${format}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await admin.storage
      .from(bucketName)
      .upload(fileName, new Blob([html], { type: "text/html" }), {
        contentType: "text/html",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Gagal mengunggah file");
    }

    // Get public URL
    const { data: urlData } = admin.storage.from(bucketName).getPublicUrl(fileName);

    // Update CV with PDF URL and download count
    await admin
      .from("cvs")
      .update({
        pdf_url: urlData.publicUrl,
        pdf_generated_at: new Date().toISOString(),
        download_count: (cv.download_count || 0) + 1,
        last_downloaded_at: new Date().toISOString(),
      })
      .eq("id", cvId);

    return new Response(
      JSON.stringify({
        url: urlData.publicUrl,
        fileName,
        format,
        watermarked: shouldWatermark,
      }),
      {
        status: 200,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    const status =
      message === "Unauthorized: No valid auth token"
        ? 401
        : message === "CV tidak ditemukan"
          ? 404
          : 500;
    console.error("PDF generation error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
});

function generateCvHtml(
  title: string,
  data: Record<string, unknown>,
  templateId: string,
  watermark: boolean,
): string {
  // Route to template-specific generator
  switch (templateId) {
    case "surabaya":
      return generateSurabayaHtml(title, data, watermark);
    case "jakarta":
      return generateJakartaHtml(title, data, watermark);
    case "bandung":
      return generateBandungHtml(title, data, watermark);
    case "yogya":
      return generateYogyaHtml(title, data, watermark);
    case "medan":
      return generateMedanHtml(title, data, watermark);
    case "makassar":
      return generateMakassarHtml(title, data, watermark);
    case "semarang":
      return generateSemarangHtml(title, data, watermark);
    case "bali":
      return generateBaliHtml(title, data, watermark);
    default:
      return generateDefaultHtml(title, data, watermark);
  }
}

// ─── Surabaya Template (Minimalist with Bold Header) ───────────────

function generateSurabayaHtml(
  title: string,
  data: Record<string, unknown>,
  watermark: boolean,
): string {
  const personal = (data.personal as Record<string, string>) || {};
  const experiences = (data.experiences as Array<Record<string, unknown>>) || [];
  const educations = (data.educations as Array<Record<string, unknown>>) || [];
  const skills = (data.skills as Array<{ name: string; level?: string }>) || [];
  const languages = (data.languages as Array<Record<string, string>>) || [];
  const certificates = (data.certificates as Array<Record<string, string>>) || [];

  const contactParts = [personal.email, personal.phone, personal.location].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.4;
    color: #1a1a1a;
  }
  .header {
    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
    color: white;
    padding: 32px 40px;
    text-align: center;
  }
  .header h1 {
    font-size: 28pt;
    font-weight: 700;
    margin-bottom: 8px;
    letter-spacing: 0.5px;
  }
  .header .headline {
    font-size: 13pt;
    font-weight: 500;
    margin-bottom: 12px;
    opacity: 0.95;
  }
  .header .contact {
    font-size: 9.5pt;
    opacity: 0.9;
  }
  .content {
    padding: 32px 40px;
  }
  .section {
    margin-bottom: 24px;
  }
  .section-title {
    font-size: 12pt;
    font-weight: 700;
    color: #1e3a8a;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 2px solid #3b82f6;
    padding-bottom: 6px;
    margin-bottom: 12px;
  }
  .item {
    margin-bottom: 14px;
    page-break-inside: avoid;
  }
  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 4px;
  }
  .item-title {
    font-weight: 700;
    font-size: 11pt;
    color: #1a1a1a;
  }
  .item-subtitle {
    font-size: 10pt;
    color: #4b5563;
    margin-bottom: 2px;
  }
  .item-date {
    font-size: 9pt;
    color: #6b7280;
    font-weight: 500;
  }
  .item-desc {
    margin-top: 6px;
    white-space: pre-wrap;
    color: #374151;
    line-height: 1.5;
  }
  .skills-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .skill-item {
    padding: 6px 10px;
    background: #f3f4f6;
    border-radius: 4px;
    font-size: 9.5pt;
    text-align: center;
  }
  .watermark {
    position: fixed;
    bottom: 20px;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 7pt;
    color: #d1d5db;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(personal.fullName || "Nama Lengkap")}</h1>
    ${personal.headline ? `<div class="headline">${escapeHtml(personal.headline)}</div>` : ""}
    ${contactParts.length > 0 ? `<div class="contact">${contactParts.map(escapeHtml).join(" • ")}</div>` : ""}
  </div>
  
  <div class="content">
    ${
      personal.summary
        ? `
      <div class="section">
        <div class="section-title">Ringkasan Profesional</div>
        <div class="item-desc">${escapeHtml(personal.summary)}</div>
      </div>
    `
        : ""
    }
    
    ${
      experiences.length > 0
        ? `
      <div class="section">
        <div class="section-title">Pengalaman Kerja</div>
        ${experiences
          .map(
            (e: Record<string, unknown>) => `
          <div class="item">
            <div class="item-header">
              <div>
                <div class="item-title">${escapeHtml((e.position as string) || "")}</div>
                <div class="item-subtitle">${escapeHtml((e.company as string) || "")}${e.location ? ` • ${escapeHtml(e.location as string)}` : ""}</div>
              </div>
              <div class="item-date">${escapeHtml((e.startDate as string) || "")} – ${e.current ? "Sekarang" : escapeHtml((e.endDate as string) || "")}</div>
            </div>
            ${e.description ? `<div class="item-desc">${escapeHtml(e.description as string).replace(/\n/g, "<br>")}</div>` : ""}
          </div>
        `,
          )
          .join("")}
      </div>
    `
        : ""
    }
    
    ${
      educations.length > 0
        ? `
      <div class="section">
        <div class="section-title">Pendidikan</div>
        ${educations
          .map(
            (ed: Record<string, unknown>) => `
          <div class="item">
            <div class="item-header">
              <div>
                <div class="item-title">${escapeHtml((ed.degree as string) || "")}${ed.field ? `, ${escapeHtml(ed.field as string)}` : ""}</div>
                <div class="item-subtitle">${escapeHtml((ed.school as string) || "")}</div>
              </div>
              <div class="item-date">${escapeHtml((ed.startDate as string) || "")} – ${escapeHtml((ed.endDate as string) || "")}</div>
            </div>
            ${ed.description ? `<div class="item-desc">${escapeHtml(ed.description as string)}</div>` : ""}
          </div>
        `,
          )
          .join("")}
      </div>
    `
        : ""
    }
    
    ${
      skills.length > 0
        ? `
      <div class="section">
        <div class="section-title">Keahlian</div>
        <div class="skills-grid">
          ${skills
            .map(
              (s: { name: string; level?: string }) => `
            <div class="skill-item">${escapeHtml(s.name)}${s.level ? ` <span style="color: #6b7280;">(${s.level})</span>` : ""}</div>
          `,
            )
            .join("")}
        </div>
      </div>
    `
        : ""
    }
    
    ${
      languages.length > 0
        ? `
      <div class="section">
        <div class="section-title">Bahasa</div>
        <div>${languages.map((l: Record<string, string>) => `${escapeHtml(l.name)} (${escapeHtml(l.level)})`).join(" • ")}</div>
      </div>
    `
        : ""
    }
    
    ${
      certificates.length > 0
        ? `
      <div class="section">
        <div class="section-title">Sertifikat</div>
        ${certificates
          .map(
            (c: Record<string, string>) => `
          <div class="item">
            <div class="item-title">${escapeHtml(c.name)}</div>
            <div class="item-subtitle">${escapeHtml(c.issuer)} • ${escapeHtml(c.date)}</div>
          </div>
        `,
          )
          .join("")}
      </div>
    `
        : ""
    }
  </div>
  
  ${watermark ? '<div class="watermark">Dibuat dengan CV Pintar — cvpintar.web.id</div>' : ""}
</body>
</html>`;
}

// ─── Default/Jakarta Template (Classic Professional) ───────────────

function generateDefaultHtml(
  title: string,
  data: Record<string, unknown>,
  watermark: boolean,
): string {
  return generateJakartaHtml(title, data, watermark);
}

function generateJakartaHtml(
  title: string,
  data: Record<string, unknown>,
  watermark: boolean,
): string {
  const personal = (data.personal as Record<string, string>) || {};
  const experiences = (data.experiences as Array<Record<string, unknown>>) || [];
  const educations = (data.educations as Array<Record<string, unknown>>) || [];
  const skills = (data.skills as Array<{ name: string }>) || [];
  const languages = (data.languages as Array<Record<string, string>>) || [];
  const certificates = (data.certificates as Array<Record<string, string>>) || [];

  const experiencesHtml =
    experiences.length > 0
      ? `
    <div class="section">
      <h2>PENGALAMAN KERJA</h2>
      ${experiences
        .map(
          (e: Record<string, unknown>) => `
        <div class="item">
          <div class="item-header">
            <strong>${e.position || ""} — ${e.company || ""}</strong>
            <span class="date">${e.startDate || ""} – ${e.current ? "Sekarang" : e.endDate || ""}</span>
          </div>
          ${e.location ? `<div class="location">${e.location}</div>` : ""}
          <p class="desc">${((e.description as string) || "").replace(/\n/g, "<br>")}</p>
        </div>
      `,
        )
        .join("")}
    </div>
  `
      : "";

  const educationHtml =
    educations.length > 0
      ? `
    <div class="section">
      <h2>PENDIDIKAN</h2>
      ${educations
        .map(
          (ed: Record<string, unknown>) => `
        <div class="item">
          <div class="item-header">
            <strong>${ed.degree || ""}${ed.field ? `, ${ed.field}` : ""}</strong>
            <span class="date">${ed.startDate || ""} – ${ed.endDate || ""}</span>
          </div>
          <div>${ed.school || ""}</div>
          ${ed.description ? `<p class="desc">${ed.description}</p>` : ""}
        </div>
      `,
        )
        .join("")}
    </div>
  `
      : "";

  const skillsHtml =
    skills.length > 0
      ? `
    <div class="section">
      <h2>KEAHLIAN</h2>
      <p>${skills.map((s: { name: string }) => s.name).join(" • ")}</p>
    </div>
  `
      : "";

  const langsHtml =
    languages.length > 0
      ? `
    <div class="section">
      <h2>BAHASA</h2>
      <p>${languages.map((l: Record<string, string>) => `${l.name} (${l.level})`).join(" • ")}</p>
    </div>
  `
      : "";

  const certHtml =
    certificates.length > 0
      ? `
    <div class="section">
      <h2>SERTIFIKAT</h2>
      ${certificates
        .map(
          (c: Record<string, string>) => `
        <div class="item">
          <strong>${c.name}</strong> — ${c.issuer} <span class="date">(${c.date})</span>
        </div>
      `,
        )
        .join("")}
    </div>
  `
      : "";

  const contactParts = [
    personal.email,
    personal.phone,
    personal.location,
    personal.linkedin ? `linkedin.com/in/${personal.linkedin}` : "",
  ].filter(Boolean);
  const contactHtml =
    contactParts.length > 0 ? `<p class="contact">${contactParts.join(" • ")}</p>` : "";

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, Calibri, 'Times New Roman', sans-serif;
    font-size: 10.5pt;
    line-height: 1.5;
    color: #111;
    max-width: 210mm;
  }
  h1 { font-size: 20pt; font-weight: 800; margin-bottom: 6px; text-align: center; }
  h2 {
    font-size: 11pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1.5px solid #222;
    padding-bottom: 4px;
    margin: 16px 0 8px;
  }
  .headline { text-align: center; font-size: 11pt; color: #444; margin-bottom: 4px; }
  .contact { text-align: center; font-size: 9.5pt; color: #444; margin-bottom: 8px; }
  .section { margin-bottom: 8px; }
  .item { margin-bottom: 10px; }
  .item-header { display: flex; justify-content: space-between; font-weight: 700; }
  .date { font-weight: 500; font-size: 9.5pt; color: #555; }
  .location { font-size: 9.5pt; color: #555; }
  .desc { margin-top: 4px; white-space: pre-wrap; }
  .summary { white-space: pre-wrap; margin-bottom: 8px; }
  .watermark {
    position: fixed;
    bottom: 12mm;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 7pt;
    color: #ccc;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <h1>${escapeHtml(personal.fullName || "Nama Lengkap")}</h1>
  ${personal.headline ? `<p class="headline">${escapeHtml(personal.headline)}</p>` : ""}
  ${contactHtml}
  ${personal.summary ? `<div class="section"><p class="summary">${escapeHtml(personal.summary)}</p></div>` : ""}
  ${experiencesHtml}
  ${educationHtml}
  ${skillsHtml}
  ${langsHtml}
  ${certHtml}
  ${watermark ? '<div class="watermark">Dibuat dengan CV Pintar — cvpintar.web.id</div>' : ""}
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── Other Templates (Using Jakarta as base for now) ───────────────

function generateBandungHtml(
  title: string,
  data: Record<string, unknown>,
  watermark: boolean,
): string {
  return generateJakartaHtml(title, data, watermark);
}

function generateYogyaHtml(
  title: string,
  data: Record<string, unknown>,
  watermark: boolean,
): string {
  return generateJakartaHtml(title, data, watermark);
}

function generateMedanHtml(
  title: string,
  data: Record<string, unknown>,
  watermark: boolean,
): string {
  return generateJakartaHtml(title, data, watermark);
}

function generateMakassarHtml(
  title: string,
  data: Record<string, unknown>,
  watermark: boolean,
): string {
  return generateJakartaHtml(title, data, watermark);
}

function generateSemarangHtml(
  title: string,
  data: Record<string, unknown>,
  watermark: boolean,
): string {
  return generateJakartaHtml(title, data, watermark);
}

function generateBaliHtml(
  title: string,
  data: Record<string, unknown>,
  watermark: boolean,
): string {
  return generateJakartaHtml(title, data, watermark);
}
