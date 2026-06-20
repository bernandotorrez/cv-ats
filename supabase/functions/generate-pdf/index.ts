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
    const { cvId, format = "pdf", withWatermark = false, html: directHtml, filename: directFilename } = await req.json();

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

      const { data: urlData } = admin.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      return new Response(
        JSON.stringify({ url: urlData.publicUrl, fileName, format: "html" }),
        { status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
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
    const { data: urlData } = admin.storage
      .from(bucketName)
      .getPublicUrl(fileName);

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
    const status = message === "Unauthorized: No valid auth token"
      ? 401
      : message === "CV tidak ditemukan"
        ? 404
        : 500;
    console.error("PDF generation error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
    );
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
    case "malang":
      return generateMalangHtml(title, data, watermark);
    case "solo":
      return generateSoloHtml(title, data, watermark);
    case "denpasar":
      return generateDenpasarHtml(title, data, watermark);
    case "batu":
      return generateBatuHtml(title, data, watermark);
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

  const contactParts = [
    personal.email,
    personal.phone,
    personal.location,
  ].filter(Boolean);

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
    ${personal.summary ? `
      <div class="section">
        <div class="section-title">Ringkasan Profesional</div>
        <div class="item-desc">${escapeHtml(personal.summary)}</div>
      </div>
    ` : ""}
    
    ${experiences.length > 0 ? `
      <div class="section">
        <div class="section-title">Pengalaman Kerja</div>
        ${experiences.map((e: Record<string, unknown>) => `
          <div class="item">
            <div class="item-header">
              <div>
                <div class="item-title">${escapeHtml(e.position as string || "")}</div>
                <div class="item-subtitle">${escapeHtml(e.company as string || "")}${e.location ? ` • ${escapeHtml(e.location as string)}` : ""}</div>
              </div>
              <div class="item-date">${escapeHtml(e.startDate as string || "")} – ${e.current ? "Sekarang" : escapeHtml(e.endDate as string || "")}</div>
            </div>
            ${e.description ? `<div class="item-desc">${escapeHtml(e.description as string).replace(/\n/g, "<br>")}</div>` : ""}
          </div>
        `).join("")}
      </div>
    ` : ""}
    
    ${educations.length > 0 ? `
      <div class="section">
        <div class="section-title">Pendidikan</div>
        ${educations.map((ed: Record<string, unknown>) => `
          <div class="item">
            <div class="item-header">
              <div>
                <div class="item-title">${escapeHtml(ed.degree as string || "")}${ed.field ? `, ${escapeHtml(ed.field as string)}` : ""}</div>
                <div class="item-subtitle">${escapeHtml(ed.school as string || "")}</div>
              </div>
              <div class="item-date">${escapeHtml(ed.startDate as string || "")} – ${escapeHtml(ed.endDate as string || "")}</div>
            </div>
            ${ed.description ? `<div class="item-desc">${escapeHtml(ed.description as string)}</div>` : ""}
          </div>
        `).join("")}
      </div>
    ` : ""}
    
    ${skills.length > 0 ? `
      <div class="section">
        <div class="section-title">Keahlian</div>
        <div class="skills-grid">
          ${skills.map((s: { name: string; level?: string }) => `
            <div class="skill-item">${escapeHtml(s.name)}${s.level ? ` <span style="color: #6b7280;">(${s.level})</span>` : ""}</div>
          `).join("")}
        </div>
      </div>
    ` : ""}
    
    ${languages.length > 0 ? `
      <div class="section">
        <div class="section-title">Bahasa</div>
        <div>${languages.map((l: Record<string, string>) => `${escapeHtml(l.name)} (${escapeHtml(l.level)})`).join(" • ")}</div>
      </div>
    ` : ""}
    
    ${certificates.length > 0 ? `
      <div class="section">
        <div class="section-title">Sertifikat</div>
        ${certificates.map((c: Record<string, string>) => `
          <div class="item">
            <div class="item-title">${escapeHtml(c.name)}</div>
            <div class="item-subtitle">${escapeHtml(c.issuer)} • ${escapeHtml(c.date)}</div>
          </div>
        `).join("")}
      </div>
    ` : ""}
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

  const experiencesHtml = experiences.length > 0 ? `
    <div class="section">
      <h2>PENGALAMAN KERJA</h2>
      ${experiences.map((e: Record<string, unknown>) => `
        <div class="item">
          <div class="item-header">
            <strong>${e.position || ""} — ${e.company || ""}</strong>
            <span class="date">${e.startDate || ""} – ${e.current ? "Sekarang" : (e.endDate || "")}</span>
          </div>
          ${e.location ? `<div class="location">${e.location}</div>` : ""}
          <p class="desc">${(e.description as string || "").replace(/\n/g, "<br>")}</p>
        </div>
      `).join("")}
    </div>
  ` : "";

  const educationHtml = educations.length > 0 ? `
    <div class="section">
      <h2>PENDIDIKAN</h2>
      ${educations.map((ed: Record<string, unknown>) => `
        <div class="item">
          <div class="item-header">
            <strong>${ed.degree || ""}${ed.field ? `, ${ed.field}` : ""}</strong>
            <span class="date">${ed.startDate || ""} – ${ed.endDate || ""}</span>
          </div>
          <div>${ed.school || ""}</div>
          ${ed.description ? `<p class="desc">${ed.description}</p>` : ""}
        </div>
      `).join("")}
    </div>
  ` : "";

  const skillsHtml = skills.length > 0 ? `
    <div class="section">
      <h2>KEAHLIAN</h2>
      <p>${skills.map((s: { name: string }) => s.name).join(" • ")}</p>
    </div>
  ` : "";

  const langsHtml = languages.length > 0 ? `
    <div class="section">
      <h2>BAHASA</h2>
      <p>${languages.map((l: Record<string, string>) => `${l.name} (${l.level})`).join(" • ")}</p>
    </div>
  ` : "";

  const certHtml = certificates.length > 0 ? `
    <div class="section">
      <h2>SERTIFIKAT</h2>
      ${certificates.map((c: Record<string, string>) => `
        <div class="item">
          <strong>${c.name}</strong> — ${c.issuer} <span class="date">(${c.date})</span>
        </div>
      `).join("")}
    </div>
  ` : "";

  const contactParts = [
    personal.email,
    personal.phone,
    personal.location,
    personal.linkedin ? `linkedin.com/in/${personal.linkedin}` : "",
  ].filter(Boolean);
  const contactHtml = contactParts.length > 0
    ? `<p class="contact">${contactParts.join(" • ")}</p>`
    : "";

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

function generateBandungHtml(title: string, data: Record<string, unknown>, watermark: boolean): string {
  return generateJakartaHtml(title, data, watermark);
}

function generateYogyaHtml(title: string, data: Record<string, unknown>, watermark: boolean): string {
  return generateJakartaHtml(title, data, watermark);
}

function generateMedanHtml(title: string, data: Record<string, unknown>, watermark: boolean): string {
  return generateJakartaHtml(title, data, watermark);
}

function generateMakassarHtml(title: string, data: Record<string, unknown>, watermark: boolean): string {
  return generateJakartaHtml(title, data, watermark);
}

function generateSemarangHtml(title: string, data: Record<string, unknown>, watermark: boolean): string {
  return generateJakartaHtml(title, data, watermark);
}

function generateBaliHtml(title: string, data: Record<string, unknown>, watermark: boolean): string {
  return generateJakartaHtml(title, data, watermark);
}

// ─── Malang Template (Design Creative – Navy + Gold Two-Column) ─────────────

function generateMalangHtml(title: string, data: Record<string, unknown>, watermark: boolean): string {
  const personal = (data.personal as Record<string, string>) || {};
  const experiences = (data.experiences as Array<Record<string, unknown>>) || [];
  const educations = (data.educations as Array<Record<string, unknown>>) || [];
  const skills = (data.skills as Array<{ name: string; level?: string }>) || [];
  const languages = (data.languages as Array<Record<string, string>>) || [];
  const certificates = (data.certificates as Array<Record<string, string>>) || [];
  const internships = (data.internships as Array<Record<string, unknown>>) || [];
  const organizations = (data.organizations as Array<Record<string, unknown>>) || [];

  const getSkillPct = (level?: string) => {
    if (!level) return 78;
    const l = level.toLowerCase();
    if (l === "expert") return 95;
    if (l === "advanced") return 85;
    if (l === "intermediate") return 70;
    if (l === "beginner") return 45;
    return 78;
  };

  const getLangPct = (level?: string) => {
    if (!level) return 75;
    const l = level.toLowerCase();
    if (l === "native" || l === "expert" || l === "fluent") return 95;
    if (l === "advanced" || l === "professional" || l === "business") return 85;
    if (l === "intermediate" || l === "conversational") return 65;
    if (l === "beginner" || l === "basic" || l === "elementary") return 40;
    return 75;
  };

  const initials = (personal.fullName || "").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  // Skills as circular rings
  const skillsHtml = skills.length > 0 ? `<div class="sidebar-section"><h3>\u{1F4A1} KEAHLIAN</h3><div class="skills-grid">${
    skills.slice(0, 6).map(s => {
      const pct = getSkillPct(s.level);
      return `<div class="skill-ring-item"><div class="ring"><div class="ring-inner">${pct}%</div></div><div class="skill-label">${escapeHtml(s.name)}</div></div>`;
    }).join("")
  }</div></div>` : "";

  // Languages with gold bars
  const langsHtml = languages.length > 0 ? `<div class="sidebar-section"><h3>\u{1F310} BAHASA</h3>${
    languages.map(l => `
      <div class="lang-item">
        <div class="lang-row"><span class="lang-name">${escapeHtml(l.name)}</span><span class="lang-level">${escapeHtml(l.level)}</span></div>
        <div class="lang-bar"><div class="lang-bar-fill" style="width:${getLangPct(l.level)}%"></div></div>
      </div>`).join("")
  }</div>` : "";

  // Contact with gold icon circles
  const contactHtml = `
    <div class="sidebar-section">
      <h3>\u260E INFO KONTAK</h3>
      ${personal.email ? `<div class="contact-item"><span class="contact-icon">\u2709</span><span>${escapeHtml(personal.email)}</span></div>` : ""}
      ${personal.phone ? `<div class="contact-item"><span class="contact-icon">\u260E</span><span>${escapeHtml(personal.phone)}</span></div>` : ""}
      ${personal.location ? `<div class="contact-item"><span class="contact-icon">\u25CB</span><span>${escapeHtml(personal.location)}</span></div>` : ""}
      ${personal.linkedin ? `<div class="contact-item"><span class="contact-icon" style="font-size:6pt;font-weight:800">in</span><span>${escapeHtml(personal.linkedin)}</span></div>` : ""}
      ${personal.website ? `<div class="contact-item"><span class="contact-icon">\u25C9</span><span>${escapeHtml(personal.website)}</span></div>` : ""}
    </div>`;

  // Experience with dates on left
  const expHtml = experiences.length > 0 ? `
    <div class="main-section">
      <h2 class="section-title">\u2699 PENGALAMAN KERJA</h2>
      ${experiences.map(e => `
        <div class="entry">
          <div class="entry-date">${escapeHtml(e.startDate as string || "")}<br/>\u2013 ${e.current ? "Sekarang" : escapeHtml(e.endDate as string || "")}</div>
          <div class="entry-content">
            <strong>${escapeHtml(e.position as string || "")}</strong>
            <div class="entry-sub">${escapeHtml(e.company as string || "")}${e.location ? ` \u2022 ${escapeHtml(e.location as string)}` : ""}</div>
            ${e.description ? `<p class="entry-desc">${(e.description as string).replace(/\n/g, "<br>")}</p>` : ""}
          </div>
        </div>`).join("")}
    </div>` : "";

  const eduHtml = educations.length > 0 ? `
    <div class="main-section">
      <h2 class="section-title">\u{1F393} PENDIDIKAN</h2>
      ${educations.map(ed => `
        <div class="entry">
          <div class="entry-date">${escapeHtml(ed.startDate as string || "")}<br/>\u2013 ${escapeHtml(ed.endDate as string || "")}</div>
          <div class="entry-content">
            <strong>${escapeHtml(ed.degree as string || "")}${ed.field ? `, ${escapeHtml(ed.field as string)}` : ""}</strong>
            <div class="entry-sub">${escapeHtml(ed.school as string || "")}</div>
            ${ed.description ? `<p class="entry-desc">${escapeHtml(ed.description as string)}</p>` : ""}
          </div>
        </div>`).join("")}
    </div>` : "";

  const certHtml = certificates.length > 0 ? `
    <div class="main-section">
      <h2 class="section-title">\u2605 SERTIFIKAT</h2>
      ${certificates.map(c => `
        <div class="cert-item"><strong>${escapeHtml(c.name)}</strong> \u2014 ${escapeHtml(c.issuer)} (${escapeHtml(c.date)})</div>
      `).join("")}
    </div>` : "";

  const internHtml = internships.length > 0 ? `
    <div class="main-section">
      <h2 class="section-title">\u{1F4BC} RIWAYAT MAGANG</h2>
      ${internships.map(i => `
        <div class="entry">
          <div class="entry-date">${escapeHtml(i.startDate as string || "")}<br/>\u2013 ${escapeHtml(i.endDate as string || "")}</div>
          <div class="entry-content">
            <strong>${escapeHtml(i.position as string || "")}</strong>
            <div class="entry-sub">${escapeHtml(i.company as string || "")}</div>
            ${i.description ? `<p class="entry-desc">${(i.description as string).replace(/\n/g, "<br>")}</p>` : ""}
          </div>
        </div>`).join("")}
    </div>` : "";

  const orgHtml = organizations.length > 0 ? `
    <div class="main-section">
      <h2 class="section-title">\u2691 ORGANISASI</h2>
      ${organizations.map(o => `
        <div class="entry">
          <div class="entry-date">${escapeHtml(o.startDate as string || "")}<br/>\u2013 ${escapeHtml(o.endDate as string || "")}</div>
          <div class="entry-content">
            <strong>${escapeHtml(o.role as string || "")}</strong>
            <div class="entry-sub">${escapeHtml(o.name as string || "")}</div>
            ${o.description ? `<p class="entry-desc">${(o.description as string).replace(/\n/g, "<br>")}</p>` : ""}
          </div>
        </div>`).join("")}
    </div>` : "";

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Inter, 'Segoe UI', Arial, sans-serif; font-size: 10pt; line-height: 1.5; color: #2d3748; }
  .wrapper { display: flex; min-height: 297mm; }
  .sidebar { width: 72mm; flex-shrink: 0; background: #1a2744; color: #fff; overflow: hidden; }
  .profile-area { text-align: center; padding: 20px 14px 12px; position: relative; }
  .profile-shape { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); width: 100px; height: 100px; border-radius: 50% 50% 45% 55% / 55% 45% 55% 45%; background: linear-gradient(135deg, #d4943a, #e8b56a); z-index: 0; }
  .profile-circle { position: relative; z-index: 1; width: 80px; height: 80px; border-radius: 50%; background: #243354; border: 3px solid #fff; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 20pt; font-weight: 700; color: #d4943a; }
  .profile-name { font-size: 16pt; font-weight: 800; color: #d4943a; text-transform: uppercase; letter-spacing: 1px; margin-top: 12px; position: relative; z-index: 1; }
  .profile-title { font-size: 8pt; color: #fff; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 500; margin-top: 4px; padding: 0 12px; position: relative; z-index: 1; }
  .sidebar-content { padding: 8px 14px 14px; }
  .sidebar-section { margin-bottom: 14px; }
  .sidebar-section h3 { font-size: 9.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #d4943a; margin-bottom: 8px; }
  .contact-item { display: flex; gap: 8px; margin-bottom: 5px; align-items: flex-start; font-size: 8pt; color: #fff; }
  .contact-icon { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: #d4943a; color: #1a2744; font-size: 8pt; flex-shrink: 0; font-weight: 700; }
  .skills-grid { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
  .skill-ring-item { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 60px; }
  .ring { width: 50px; height: 50px; border-radius: 50%; background: conic-gradient(#d4943a 0% 78%, #243354 78% 100%); display: flex; align-items: center; justify-content: center; }
  .ring-inner { width: 40px; height: 40px; border-radius: 50%; background: #1a2744; display: flex; align-items: center; justify-content: center; font-size: 11pt; font-weight: 700; color: #d4943a; }
  .skill-label { font-size: 7pt; color: #fff; text-align: center; line-height: 1.3; font-weight: 500; }
  .lang-item { margin-bottom: 8px; }
  .lang-row { display: flex; justify-content: space-between; font-size: 8pt; color: #fff; margin-bottom: 1px; }
  .lang-name { font-weight: 600; }
  .lang-level { color: #e8b56a; font-size: 7.5pt; }
  .lang-bar { height: 6px; border-radius: 3px; background: #e2e8f0; overflow: hidden; margin-top: 3px; }
  .lang-bar-fill { height: 100%; border-radius: 3px; background: #d4943a; }
  .decorative-line { height: 2px; background: linear-gradient(90deg, #d4943a, #e8b56a, #d4943a); border-radius: 1px; margin-top: 6px; }
  .main-content { flex: 1; background: #fff; padding: 16px 18px; }
  .main-section { margin-bottom: 16px; }
  .section-title { font-size: 11pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #d4943a; border-bottom: 2px solid rgba(212,148,58,0.2); padding-bottom: 6px; margin-bottom: 10px; }
  .entry { display: flex; gap: 10px; margin-bottom: 12px; }
  .entry-date { width: 60px; flex-shrink: 0; font-size: 8pt; font-weight: 700; color: #2d3748; padding-top: 2px; }
  .entry-content { flex: 1; }
  .entry-content strong { font-size: 10pt; color: #2d3748; }
  .entry-sub { font-size: 9pt; color: #718096; font-style: italic; margin-bottom: 3px; }
  .entry-desc { font-size: 9pt; white-space: pre-wrap; color: #4a5568; line-height: 1.6; margin: 0; }
  .cert-item { font-size: 9pt; color: #4a5568; margin-bottom: 5px; padding-left: 10px; border-left: 3px solid #d4943a; }
  .cert-item strong { color: #2d3748; }
  .watermark { position: fixed; bottom: 12mm; left: 0; right: 0; text-align: center; font-size: 7pt; color: #ccc; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="wrapper">
    <div class="sidebar">
      <div class="profile-area">
        <div class="profile-shape"></div>
        <div class="profile-circle">${escapeHtml(initials)}</div>
        <div class="profile-name">${escapeHtml(personal.fullName || "Nama Lengkap")}</div>
        ${personal.headline ? `<div class="profile-title">${escapeHtml(personal.headline)}</div>` : ""}
      </div>
      <div class="sidebar-content">
        ${contactHtml}
        ${skillsHtml}
        ${langsHtml}
        <div class="decorative-line"></div>
      </div>
    </div>
    <div class="main-content">
      ${personal.summary ? `<div class="main-section"><h2 class="section-title">\u25C9 PROFIL</h2><p class="entry-desc" style="color:#4a5568">${escapeHtml(personal.summary).replace(/\n/g, "<br>")}</p></div>` : ""}
      ${expHtml}
      ${eduHtml}
      ${certHtml}
      ${internHtml}
      ${orgHtml}
    </div>
  </div>
  ${watermark ? '<div class="watermark">Dibuat dengan CV Pintar \u2014 cvpintar.web.id</div>' : ""}
</body>
</html>`;
}

// ─── Solo Template (Dark Tech Creative) ──────────────────────────

function generateSoloHtml(
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
  const internships = (data.internships as Array<Record<string, unknown>>) || [];
  const organizations = (data.organizations as Array<Record<string, unknown>>) || [];

  function skillPct(lv?: string): number {
    if (!lv) return 78; const l = lv.toLowerCase();
    if (l === "expert") return 95; if (l === "advanced") return 85;
    if (l === "intermediate") return 70; if (l === "beginner") return 45; return 78;
  }
  function langPct(lv?: string): number {
    if (!lv) return 75; const l = lv.toLowerCase();
    if (l === "native" || l === "expert" || l === "fluent") return 95;
    if (l === "advanced" || l === "professional") return 85;
    if (l === "intermediate" || l === "conversational") return 65;
    if (l === "beginner" || l === "basic") return 40; return 75;
  }

  const skillsHtml = skills.map(s =>
    `<span class="skill-tag">${escapeHtml(s.name)} <span class="skill-pct">${skillPct(s.level)}%</span></span>`
  ).join("");
  const langsHtml = languages.map(l =>
    `<div class="lang-row"><span class="lang-name">${escapeHtml(l.name)}</span><div class="lang-bar-bg"><div class="lang-bar-fill" style="width:${langPct(l.level)}%"></div></div><span class="lang-level">${escapeHtml(l.level)}</span></div>`
  ).join("");

  function tlEntry(e: Record<string, unknown>): string {
    return `<div class="tl-item"><div class="tl-dot"></div><div class="tl-date">${escapeHtml(e.startDate as string || "")} — ${e.current ? "Sekarang" : escapeHtml(e.endDate as string || "")}</div><div class="tl-title">${escapeHtml((e.position || e.role) as string || "")}</div><div class="tl-sub">${escapeHtml((e.company || e.name) as string || "")}${e.location ? ` \u2022 ${escapeHtml(e.location as string)}` : ""}</div>${e.description ? `<div class="tl-desc">${escapeHtml(e.description as string).replace(/\n/g, "<br>")}</div>` : ""}</div>`;
  }

  const expHtml = experiences.map(tlEntry).join("");
  const eduHtml = educations.map((e: Record<string, unknown>) =>
    `<div class="tl-item"><div class="tl-dot"></div><div class="tl-date">${escapeHtml(e.startDate as string || "")} — ${escapeHtml(e.endDate as string || "")}</div><div class="tl-title">${escapeHtml(e.degree as string || "")}${e.field ? `, ${escapeHtml(e.field as string)}` : ""}</div><div class="tl-sub">${escapeHtml(e.school as string || "")}</div>${e.description ? `<div class="tl-desc">${escapeHtml(e.description as string)}</div>` : ""}</div>`
  ).join("");
  const certHtml = certificates.map(c =>
    `<div class="cert-item"><strong>${escapeHtml(c.name)}</strong> — ${escapeHtml(c.issuer)} (${escapeHtml(c.date)})</div>`
  ).join("");
  const internHtml = internships.map(tlEntry).join("");
  const orgHtml = organizations.map(tlEntry).join("");
  const contactParts = [personal.email, personal.phone, personal.location, personal.linkedin, personal.website].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title>
<style>
@page{size:A4;margin:0}*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:10pt;line-height:1.4;background:#1a1a2e;color:#f0f0f5}
.page{padding:28px 32px}.header{border-bottom:2px solid #00d4aa;padding-bottom:14px;margin-bottom:18px}
.header h1{font-size:24pt;font-weight:900;color:#f0f0f5}.header .hl{font-size:11pt;color:#00d4aa;font-weight:600;margin-top:3px}
.header .ct{display:flex;flex-wrap:wrap;gap:12px;margin-top:8px;font-size:8.5pt;color:#8888a8}
.sec{margin-bottom:16px}.st{font-size:10.5pt;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#00d4aa;display:flex;align-items:center;gap:8px;margin-bottom:10px}
.st::before{content:'';display:inline-block;width:18px;height:2px;background:#00d4aa}
.st::after{content:'';flex:1;height:1px;background:linear-gradient(to right,rgba(0,212,170,.25),transparent)}
.tl-wrap{border-left:2px solid rgba(0,212,170,.3);padding-left:16px;margin-left:3px}
.tl-item{position:relative;padding-left:14px;margin-bottom:12px}.tl-dot{position:absolute;left:-3px;top:5px;width:8px;height:8px;border-radius:50%;background:#00d4aa}
.tl-date{font-size:8pt;font-weight:700;color:#00a88a;margin-bottom:2px}.tl-title{font-size:10pt;font-weight:700;color:#f0f0f5}
.tl-sub{font-size:9pt;color:#8888a8;font-style:italic;margin-bottom:3px}.tl-desc{font-size:9pt;color:#c8c8d8;white-space:pre-wrap;line-height:1.6;margin-top:2px}
.sk-wrap{display:flex;flex-wrap:wrap;gap:5px}.sk-tag{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;border:1px solid rgba(0,212,170,.3);background:rgba(0,212,170,.1);font-size:8.5pt;color:#f0f0f5}
.sk-pct{font-size:7pt;color:#00d4aa;font-weight:700}
.lg-row{display:flex;align-items:center;gap:6px;margin-bottom:5px;font-size:9pt;color:#c8c8d8}.lg-nm{min-width:80px}.lg-bg{width:60px;height:4px;border-radius:2px;background:#16213e}.lg-fl{height:100%;border-radius:2px;background:#00d4aa}.lg-lv{font-size:8pt;color:#00d4aa;font-weight:600}
.cert-item{font-size:9pt;color:#c8c8d8;margin-bottom:5px;padding-left:10px;border-left:3px solid #00d4aa}.cert-item strong{color:#f0f0f5}
.summary{font-size:9.5pt;line-height:1.7;color:#c8c8d8;white-space:pre-wrap}
.watermark{position:fixed;bottom:20px;left:0;right:0;text-align:center;font-size:7pt;color:#333}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="page">
<div class="header"><h1>${escapeHtml(personal.fullName || "Nama Lengkap")}</h1>${personal.headline ? `<div class="hl">${escapeHtml(personal.headline)}</div>` : ""}${contactParts.length ? `<div class="ct">${contactParts.map(c=>`<span>${escapeHtml(c)}</span>`).join("")}</div>` : ""}</div>
${personal.summary?`<div class="sec"><div class="st">PROFIL</div><p class="summary">${escapeHtml(personal.summary).replace(/\n/g,"<br>")}</p></div>`:""}
${experiences.length?`<div class="sec"><div class="st">PENGALAMAN KERJA</div><div class="tl-wrap">${expHtml}</div></div>`:""}
${educations.length?`<div class="sec"><div class="st">PENDIDIKAN</div><div class="tl-wrap">${eduHtml}</div></div>`:""}
${skills.length?`<div class="sec"><div class="st">KEAHLIAN</div><div class="sk-wrap">${skillsHtml}</div></div>`:""}
${languages.length?`<div class="sec"><div class="st">BAHASA</div>${langsHtml}</div>`:""}
${certificates.length?`<div class="sec"><div class="st">SERTIFIKAT</div>${certHtml}</div>`:""}
${internships.length?`<div class="sec"><div class="st">MAGANG</div><div class="tl-wrap">${internHtml}</div></div>`:""}
${organizations.length?`<div class="sec"><div class="st">ORGANISASI</div><div class="tl-wrap">${orgHtml}</div></div>`:""}
</div>${watermark?'<div class="watermark">Dibuat dengan CV Pintar \u2014 cvpintar.web.id</div>':""}
</body></html>`;
}

// ─── Denpasar Template (Editorial Creative) ─────────────────────

function generateDenpasarHtml(
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
  const internships = (data.internships as Array<Record<string, unknown>>) || [];
  const organizations = (data.organizations as Array<Record<string, unknown>>) || [];

  function skDots(lv?: string): number {
    if (!lv) return 4; const l = lv.toLowerCase();
    if (l === "expert") return 5; if (l === "advanced") return 4;
    if (l === "intermediate") return 3; if (l === "beginner") return 2; return 4;
  }
  function lgDots(lv?: string): number {
    if (!lv) return 4; const l = lv.toLowerCase();
    if (l === "native" || l === "fluent") return 5;
    if (l === "advanced" || l === "professional") return 4;
    if (l === "intermediate" || l === "conversational") return 3;
    if (l === "beginner" || l === "basic") return 2; return 4;
  }

  function dots(n: number, total = 5): string {
    return Array.from({length: total}).map((_,i)=> `<span class="dot ${i<n?'filled':''}"></span>`).join("");
  }

  const skillsHtml = skills.map(s => `<div class="sb-item"><div class="sb-name">${escapeHtml(s.name)}</div><div class="sb-dots">${dots(skDots(s.level))}</div></div>`).join("");
  const langsHtml = languages.map(l => `<div class="sb-item"><div class="sb-name">${escapeHtml(l.name)}</div><div class="sb-dots">${dots(lgDots(l.level))}</div></div>`).join("");

  function mainEntry(e: Record<string, unknown>): string {
    return `<div class="entry"><div class="entry-date">${escapeHtml(e.startDate as string || "")} — ${e.current ? "Sekarang" : escapeHtml(e.endDate as string || "")}</div><div class="entry-title">${escapeHtml((e.position || e.role) as string || "")}</div><div class="entry-sub">${escapeHtml((e.company || e.name) as string || "")}${e.location ? ` \u2022 ${escapeHtml(e.location as string)}` : ""}</div>${e.description ? `<p class="entry-desc">${escapeHtml(e.description as string).replace(/\n/g, "<br>")}</p>` : ""}</div>`;
  }

  const expHtml = experiences.map(mainEntry).join("");
  const eduHtml = educations.map((e: Record<string, unknown>) =>
    `<div class="entry"><div class="entry-date">${escapeHtml(e.startDate as string || "")} — ${escapeHtml(e.endDate as string || "")}</div><div class="entry-title">${escapeHtml(e.degree as string || "")}${e.field ? `, ${escapeHtml(e.field as string)}` : ""}</div><div class="entry-sub">${escapeHtml(e.school as string || "")}</div>${e.description ? `<p class="entry-desc">${escapeHtml(e.description as string)}</p>` : ""}</div>`
  ).join("");
  const certHtml = certificates.map(c =>
    `<div class="cert-item"><strong>${escapeHtml(c.name)}</strong> — ${escapeHtml(c.issuer)} (${escapeHtml(c.date)})</div>`
  ).join("");
  const internHtml = internships.map(mainEntry).join("");
  const orgHtml = organizations.map(mainEntry).join("");
  const contactParts = [personal.email, personal.phone, personal.location, personal.linkedin, personal.website].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title>
<style>
@page{size:A4;margin:0}*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:10pt;line-height:1.4;background:#faf5ef;color:#4a3728}
.header{padding:20px 24px 14px;border-bottom:3px solid #c75b39}
.header h1{font-size:24pt;font-weight:700;color:#2c1810;font-family:Georgia,'Times New Roman',serif}
.header .hl{font-size:10.5pt;color:#c75b39;font-weight:600;margin-top:3px;font-family:Georgia,serif;font-style:italic}
.header .ct{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px;font-size:8.5pt;color:#7a6455}
.wrapper{display:flex}.sidebar{width:30%;background:#f5ece2;padding:16px 14px;border-right:1px solid #d4c4b0}
.main{flex:1;padding:16px 20px}
.sb-title{font-size:8.5pt;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#c75b39;margin-bottom:8px;margin-top:0}
.sb-item{margin-bottom:5px}.sb-name{font-size:8.5pt;color:#4a3728}.sb-dots{display:flex;gap:3px;margin-top:2px}
.dot{width:7px;height:7px;border-radius:50%;background:#d4c4b0}.dot.filled{background:#c75b39}
.mh{font-size:11pt;font-weight:700;color:#c75b39;margin-bottom:4px;font-family:Georgia,serif}
.diamond{display:flex;align-items:center;gap:6px;margin:6px 0 10px}.diamond::before,.diamond::after{content:'';flex:1;height:1px;background:#d4c4b0}.diamond span{width:5px;height:5px;background:#c75b39;transform:rotate(45deg)}
.entry{margin-bottom:12px}.entry-date{font-size:8pt;font-weight:600;color:#d4764e;margin-bottom:2px}
.entry-title{font-size:10pt;font-weight:700;color:#2c1810}.entry-sub{font-size:9pt;color:#7a6455;font-style:italic;margin-bottom:3px}
.entry-desc{font-size:9pt;color:#4a3728;white-space:pre-wrap;line-height:1.6;margin:0}
.cert-item{font-size:9pt;color:#4a3728;margin-bottom:5px;padding-left:10px;border-left:3px solid #c75b39}.cert-item strong{color:#2c1810}
.summary{font-size:9.5pt;line-height:1.7;color:#4a3728;white-space:pre-wrap;margin:0}
.watermark{position:fixed;bottom:20px;left:0;right:0;text-align:center;font-size:7pt;color:#ccc}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="header"><h1>${escapeHtml(personal.fullName || "Nama Lengkap")}</h1>${personal.headline ? `<div class="hl">${escapeHtml(personal.headline)}</div>` : ""}${contactParts.length ? `<div class="ct">${contactParts.map(c=>`<span>${escapeHtml(c)}</span>`).join("")}</div>` : ""}</div>
<div class="wrapper"><div class="sidebar">
${skills.length?`<div class="sb-title">KEAHLIAN</div>${skillsHtml}`:""}
${languages.length?`<div class="sb-title" style="margin-top:14px">BAHASA</div>${langsHtml}`:""}
</div><div class="main">
${personal.summary?`<div class="mh">PROFIL</div><div class="diamond"><span></span></div><p class="summary">${escapeHtml(personal.summary).replace(/\n/g,"<br>")}</p>`:""}
${experiences.length?`<div style="margin-top:16px"><div class="mh">PENGALAMAN KERJA</div><div class="diamond"><span></span></div>${expHtml}</div>`:""}
${educations.length?`<div style="margin-top:16px"><div class="mh">PENDIDIKAN</div><div class="diamond"><span></span></div>${eduHtml}</div>`:""}
${certificates.length?`<div style="margin-top:16px"><div class="mh">SERTIFIKAT</div><div class="diamond"><span></span></div>${certHtml}</div>`:""}
${internships.length?`<div style="margin-top:16px"><div class="mh">MAGANG</div><div class="diamond"><span></span></div>${internHtml}</div>`:""}
${organizations.length?`<div style="margin-top:16px"><div class="mh">ORGANISASI</div><div class="diamond"><span></span></div>${orgHtml}</div>`:""}
</div></div>
${watermark?'<div class="watermark">Dibuat dengan CV Pintar \u2014 cvpintar.web.id</div>':""}
</body></html>`;
}

// ─── Batu Template (Gradient Modern Creative) ────────────────────

function generateBatuHtml(
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
  const internships = (data.internships as Array<Record<string, unknown>>) || [];
  const organizations = (data.organizations as Array<Record<string, unknown>>) || [];

  function skillPct(lv?: string): number {
    if (!lv) return 78; const l = lv.toLowerCase();
    if (l === "expert") return 95; if (l === "advanced") return 85;
    if (l === "intermediate") return 70; if (l === "beginner") return 45; return 78;
  }
  function langPct(lv?: string): number {
    if (!lv) return 75; const l = lv.toLowerCase();
    if (l === "native" || l === "expert" || l === "fluent") return 95;
    if (l === "advanced" || l === "professional") return 85;
    if (l === "intermediate" || l === "conversational") return 65;
    if (l === "beginner" || l === "basic") return 40; return 75;
  }

  const skillsHtml = skills.map(s => {
    const p = skillPct(s.level);
    return `<div class="sk-item"><div class="sk-head"><span>${escapeHtml(s.name)}</span><span class="sk-pct">${p}%</span></div><div class="sk-bg"><div class="sk-fill" style="width:${p}%"></div></div></div>`;
  }).join("");
  const langsHtml = languages.map(l => {
    const p = langPct(l.level);
    return `<div class="lg-item"><div class="lg-head"><span>${escapeHtml(l.name)}</span><span class="lg-lv">${escapeHtml(l.level)}</span></div><div class="sk-bg"><div class="sk-fill" style="width:${p}%"></div></div></div>`;
  }).join("");

  function cardEntry(e: Record<string, unknown>): string {
    return `<div class="card"><div class="card-head"><strong>${escapeHtml((e.position || e.role) as string || "")}</strong><span class="card-date">${escapeHtml(e.startDate as string || "")} — ${e.current ? "Sekarang" : escapeHtml(e.endDate as string || "")}</span></div><div class="card-sub">${escapeHtml((e.company || e.name) as string || "")}${e.location ? ` \u2022 ${escapeHtml(e.location as string)}` : ""}</div>${e.description ? `<p class="card-desc">${escapeHtml(e.description as string).replace(/\n/g, "<br>")}</p>` : ""}</div>`;
  }

  const expHtml = experiences.map(cardEntry).join("");
  const eduHtml = educations.map((e: Record<string, unknown>) =>
    `<div class="card"><div class="card-head"><strong>${escapeHtml(e.degree as string || "")}${e.field ? `, ${escapeHtml(e.field as string)}` : ""}</strong><span class="card-date">${escapeHtml(e.startDate as string || "")} — ${escapeHtml(e.endDate as string || "")}</span></div><div class="card-sub">${escapeHtml(e.school as string || "")}</div>${e.description ? `<p class="card-desc">${escapeHtml(e.description as string)}</p>` : ""}</div>`
  ).join("");
  const certHtml = certificates.map(c =>
    `<div class="card"><div class="card-desc"><strong>${escapeHtml(c.name)}</strong> — ${escapeHtml(c.issuer)} (${escapeHtml(c.date)})</div></div>`
  ).join("");
  const internHtml = internships.map(cardEntry).join("");
  const orgHtml = organizations.map(cardEntry).join("");
  const contactParts = [personal.email, personal.phone, personal.location, personal.linkedin, personal.website].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title>
<style>
@page{size:A4;margin:0}*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:10pt;line-height:1.4;background:#fff;color:#3d2c5e}
.header{background:linear-gradient(135deg,#7c3aed,#ec4899);padding:20px 22px;border-radius:0 0 16px 16px}
.header h1{font-size:24pt;font-weight:900;color:#fff}.header .hl{font-size:11pt;color:rgba(255,255,255,.9);font-weight:500;margin-top:3px}
.header .ct{display:flex;flex-wrap:wrap;gap:12px;margin-top:10px;font-size:8.5pt;color:rgba(255,255,255,.8)}
.content{padding:16px 20px}
.sec{margin-bottom:16px}.sec-title{font-size:11pt;font-weight:800;color:#7c3aed;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px}
.sec-bar{height:3px;border-radius:2px;background:linear-gradient(90deg,#7c3aed,#ec4899);width:50px;margin-bottom:10px}
.card{background:#faf8ff;border-radius:6px;padding:10px 12px;margin-bottom:8px;border-left:4px solid transparent;border-image:linear-gradient(135deg,#7c3aed,#ec4899) 1;box-shadow:0 1px 3px rgba(124,58,237,.06)}
.card-head{display:flex;justify-content:space-between;align-items:baseline}.card-head strong{font-size:10pt;color:#1f1235}
.card-date{font-size:8pt;color:#7c3aed;font-weight:600;flex-shrink:0}
.card-sub{font-size:9pt;color:#6b5b8a;font-style:italic;margin-bottom:4px}.card-desc{font-size:9pt;color:#3d2c5e;white-space:pre-wrap;line-height:1.6;margin:0}
.sk-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 16px}
.sk-item{margin-bottom:7px}.sk-head{display:flex;justify-content:space-between;margin-bottom:3px;font-size:8.5pt;color:#3d2c5e}.sk-pct{font-size:8pt;color:#7c3aed;font-weight:700}
.sk-bg{height:6px;border-radius:3px;background:#ede5f7;overflow:hidden}.sk-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#7c3aed,#ec4899)}
.lg-item{margin-bottom:6px}.lg-head{display:flex;justify-content:space-between;margin-bottom:2px;font-size:9pt;color:#3d2c5e}.lg-lv{font-size:8pt;color:#ec4899;font-weight:600}
.summary{font-size:9.5pt;line-height:1.7;color:#3d2c5e;white-space:pre-wrap;margin:0}
.watermark{position:fixed;bottom:20px;left:0;right:0;text-align:center;font-size:7pt;color:#ccc}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
${personal.fullName?`<div class="header"><h1>${escapeHtml(personal.fullName)}</h1>${personal.headline?`<div class="hl">${escapeHtml(personal.headline)}</div>`:""} ${contactParts.length?`<div class="ct">${contactParts.map(c=>`<span>${escapeHtml(c)}</span>`).join("")}</div>`:""}</div>`:""}
<div class="content">
${personal.summary?`<div class="sec"><div class="sec-title">PROFIL</div><div class="sec-bar"></div><p class="summary">${escapeHtml(personal.summary).replace(/\n/g,"<br>")}</p></div>`:""}
${experiences.length?`<div class="sec"><div class="sec-title">PENGALAMAN KERJA</div><div class="sec-bar"></div>${expHtml}</div>`:""}
${educations.length?`<div class="sec"><div class="sec-title">PENDIDIKAN</div><div class="sec-bar"></div>${eduHtml}</div>`:""}
${skills.length?`<div class="sec"><div class="sec-title">KEAHLIAN</div><div class="sec-bar"></div><div class="sk-grid">${skillsHtml}</div></div>`:""}
${languages.length?`<div class="sec"><div class="sec-title">BAHASA</div><div class="sec-bar"></div>${langsHtml}</div>`:""}
${certificates.length?`<div class="sec"><div class="sec-title">SERTIFIKAT</div><div class="sec-bar"></div>${certHtml}</div>`:""}
${internships.length?`<div class="sec"><div class="sec-title">MAGANG</div><div class="sec-bar"></div>${internHtml}</div>`:""}
${organizations.length?`<div class="sec"><div class="sec-title">ORGANISASI</div><div class="sec-bar"></div>${orgHtml}</div>`:""}
</div>${watermark?'<div class="watermark">Dibuat dengan CV Pintar \u2014 cvpintar.web.id</div>':""}
</body></html>`;
}
