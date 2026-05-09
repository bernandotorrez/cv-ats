import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageOrientation, convertInchesToTwip, BorderStyle, ShadingType } from "docx";
import type { CvData, TemplateId } from "./cv-types";

export interface ExportOptions {
  template: TemplateId;
  watermark?: boolean;
}

const FONT_NAME = "Inter";
const FONT_DISPLAY = "Plus Jakarta Sans";
const COLOR_PRIMARY = "468432";
const COLOR_TEXT = "111111";
const COLOR_MUTED = "444444";
const COLOR_HEADING_BORDER = "222222";
const COLOR_BG_BANDUNG = "468432";
const COLOR_SURABAYA_BORDER = "468432";
const COLOR_SURABAYA_HEADLINE = "468432";

function headingSection(text: string, spacing?: { before?: number; after?: number }): Paragraph[] {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: text.toUpperCase(),
          bold: true,
          size: 23, // 11.5pt * 2
          font: FONT_NAME,
          color: COLOR_TEXT,
        }),
      ],
      spacing: { before: spacing?.before ?? 280, after: spacing?.after ?? 40 },
    }),
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_HEADING_BORDER, space: 4 },
      },
      spacing: { after: 80 },
      children: [],
    }),
  ];
}

function bodyParagraph(text: string, options?: { spacing?: { before?: number; after?: number }; fontSize?: number }): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        size: options?.fontSize ?? 21, // 10.5pt * 2
        font: FONT_NAME,
        color: COLOR_TEXT,
      }),
    ],
    spacing: { before: options?.spacing?.before, after: options?.spacing?.after ?? 40 },
  });
}

function mutedParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        size: 19, // 9.5pt * 2
        font: FONT_NAME,
        color: COLOR_MUTED,
      }),
    ],
    spacing: { after: 20 },
  });
}

function boldParagraph(text: string, spacing?: { before?: number; after?: number }): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: 21,
        font: FONT_NAME,
        color: COLOR_TEXT,
      }),
    ],
    spacing: { before: spacing?.before, after: spacing?.after },
  });
}

// ─── Template-specific header builders ───────────────────────

function buildJakartaHeader(cv: CvData): Paragraph[] {
  const paras: Paragraph[] = [];
  const fullName = cv.personal.fullName || "Nama Lengkap";

  paras.push(
    new Paragraph({
      children: [
        new TextRun({ text: fullName, bold: true, size: 40, font: FONT_DISPLAY, color: COLOR_TEXT }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    })
  );

  if (cv.personal.headline) {
    paras.push(
      new Paragraph({
        children: [
          new TextRun({ text: cv.personal.headline, size: 22, font: FONT_NAME, color: COLOR_MUTED }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
      })
    );
  }

  const contactLine1 = [cv.personal.email, cv.personal.phone, cv.personal.location].filter(Boolean).join(" • ");
  const contactLine2 = [cv.personal.linkedin, cv.personal.website].filter(Boolean).join(" • ");

  if (contactLine1) paras.push(mutedParagraph(contactLine1));
  if (contactLine2) paras.push(mutedParagraph(contactLine2));

  return paras;
}

function buildBandungHeader(cv: CvData): Paragraph[] {
  const fullName = cv.personal.fullName || "Nama Lengkap";
  const contact = [cv.personal.email, cv.personal.phone, cv.personal.location, cv.personal.linkedin].filter(Boolean).join(" • ");

  return [
    new Paragraph({
      children: [
        new TextRun({ text: fullName, bold: true, size: 44, font: FONT_DISPLAY, color: "FFFFFF" }),
      ],
      shading: { type: ShadingType.SOLID, color: COLOR_BG_BANDUNG, fill: COLOR_BG_BANDUNG },
      spacing: { after: 40 },
    }),
    ...(cv.personal.headline
      ? [
          new Paragraph({
            children: [
              new TextRun({ text: cv.personal.headline, size: 22, font: FONT_NAME, color: "FFFFFF" }),
            ],
            shading: { type: ShadingType.SOLID, color: COLOR_BG_BANDUNG, fill: COLOR_BG_BANDUNG },
            spacing: { after: 60 },
          }),
        ]
      : []),
    new Paragraph({
      children: [
        new TextRun({ text: contact, size: 19, font: FONT_NAME, color: "FFFFFF" }),
      ],
      shading: { type: ShadingType.SOLID, color: COLOR_BG_BANDUNG, fill: COLOR_BG_BANDUNG },
      spacing: { after: 200 },
    }),
  ];
}

function buildSurabayaHeader(cv: CvData): Paragraph[] {
  const fullName = cv.personal.fullName || "Nama Lengkap";
  const contact = [cv.personal.email, cv.personal.phone, cv.personal.location, cv.personal.linkedin].filter(Boolean).join(" • ");

  return [
    new Paragraph({
      children: [
        new TextRun({ text: fullName, bold: true, size: 44, font: FONT_DISPLAY, color: COLOR_TEXT }),
      ],
      border: { left: { style: BorderStyle.SINGLE, size: 12, color: COLOR_SURABAYA_BORDER, space: 12 } },
      spacing: { after: 20 },
    }),
    ...(cv.personal.headline
      ? [
          new Paragraph({
            children: [
              new TextRun({ text: cv.personal.headline, bold: true, size: 22, font: FONT_NAME, color: COLOR_SURABAYA_HEADLINE }),
            ],
            spacing: { after: 40 },
          }),
        ]
      : []),
    new Paragraph({
      children: [
        new TextRun({ text: contact, size: 19, font: FONT_NAME, color: COLOR_MUTED }),
      ],
      spacing: { after: 120 },
    }),
  ];
}

function buildYogyaHeader(cv: CvData): Paragraph[] {
  const fullName = cv.personal.fullName || "Nama Lengkap";
  const contact = [cv.personal.email, cv.personal.phone, cv.personal.location, cv.personal.linkedin].filter(Boolean).join(" • ");

  return [
    new Paragraph({
      children: [
        new TextRun({ text: fullName, size: 48, font: FONT_DISPLAY, color: COLOR_TEXT }),
      ],
      spacing: { after: 20 },
    }),
    ...(cv.personal.headline
      ? [
          new Paragraph({
            children: [
              new TextRun({ text: cv.personal.headline, size: 22, font: FONT_NAME, color: "666666" }),
            ],
            spacing: { after: 60 },
          }),
        ]
      : []),
    new Paragraph({
      children: [
        new TextRun({ text: contact, size: 19, font: FONT_NAME, color: COLOR_MUTED }),
      ],
      spacing: { after: 40 },
    }),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC", space: 8 } },
      spacing: { after: 120 },
      children: [],
    }),
  ];
}

// ─── Main DOCX Generator ──────────────────────────────────────

export async function generateDocx(cv: CvData, options: ExportOptions): Promise<Blob> {
  const { template, watermark = false } = options;

  const sections: Paragraph[] = [];

  // Header based on template
  switch (template) {
    case "bandung":
      sections.push(...buildBandungHeader(cv));
      break;
    case "surabaya":
      sections.push(...buildSurabayaHeader(cv));
      break;
    case "yogya":
      sections.push(...buildYogyaHeader(cv));
      break;
    case "jakarta":
    default:
      sections.push(...buildJakartaHeader(cv));
      break;
  }

  // ─── Summary ──────────────────────────────────────────────────
  if (cv.personal.summary) {
    sections.push(...headingSection("Ringkasan Profil"));
    sections.push(bodyParagraph(cv.personal.summary, { spacing: { after: 80 } }));
  }

  // ─── Experience ────────────────────────────────────────────────
  if (cv.experiences.length > 0) {
    sections.push(...headingSection("Pengalaman Kerja"));

    for (const exp of cv.experiences) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${exp.position} — ${exp.company}`, bold: true, size: 21, font: FONT_NAME, color: COLOR_TEXT }),
          ],
          spacing: { before: 100, after: 20 },
        })
      );
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${exp.startDate} – ${exp.current ? "Sekarang" : exp.endDate}`, size: 19, font: FONT_NAME, color: COLOR_MUTED }),
          ],
          spacing: { after: exp.location ? 20 : 40 },
        })
      );
      if (exp.location) {
        sections.push(mutedParagraph(exp.location));
      }
      if (exp.description) {
        sections.push(bodyParagraph(exp.description, { spacing: { after: 60 } }));
      }
    }
  }

  // ─── Education ─────────────────────────────────────────────────
  if (cv.educations.length > 0) {
    sections.push(...headingSection("Pendidikan"));

    for (const edu of cv.educations) {
      const title = `${edu.degree}${edu.field ? `, ${edu.field}` : ""}`;
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: title, bold: true, size: 21, font: FONT_NAME, color: COLOR_TEXT }),
          ],
          spacing: { before: 100, after: 20 },
        })
      );
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: edu.school, size: 20, font: FONT_NAME, color: COLOR_TEXT }),
          ],
          spacing: { after: 20 },
        })
      );
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${edu.startDate} – ${edu.endDate}`, size: 19, font: FONT_NAME, color: COLOR_MUTED }),
          ],
          spacing: { after: 40 },
        })
      );
      if (edu.description) {
        sections.push(bodyParagraph(edu.description, { spacing: { after: 60 } }));
      }
    }
  }

  // ─── Skills ────────────────────────────────────────────────────
  if (cv.skills.length > 0) {
    sections.push(...headingSection("Keahlian"));
    sections.push(bodyParagraph(cv.skills.map(s => s.name).join(" • "), { spacing: { after: 80 } }));
  }

  // ─── Languages ────────────────────────────────────────────────
  if (cv.languages.length > 0) {
    sections.push(...headingSection("Bahasa"));
    sections.push(bodyParagraph(cv.languages.map(l => `${l.name} (${l.level})`).join(" • "), { spacing: { after: 80 } }));
  }

  // ─── Certificates ─────────────────────────────────────────────
  if (cv.certificates.length > 0) {
    sections.push(...headingSection("Sertifikat"));
    for (const cert of cv.certificates) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${cert.name}`, bold: true, size: 21, font: FONT_NAME, color: COLOR_TEXT }),
            new TextRun({ text: ` — ${cert.issuer} (${cert.date})`, size: 21, font: FONT_NAME, color: COLOR_TEXT }),
          ],
          spacing: { after: 40 },
        })
      );
    }
  }

  // ─── Watermark ────────────────────────────────────────────────
  if (watermark) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Dibuat dengan CV ATS Indonesia — cvats.id", size: 18, font: FONT_NAME, color: "999999" }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.PORTRAIT,
              width: convertInchesToTwip(8.27),
              height: convertInchesToTwip(11.69),
            },
            margin: {
              top: convertInchesToTwip(0.63),
              right: convertInchesToTwip(0.63),
              bottom: convertInchesToTwip(0.63),
              left: convertInchesToTwip(0.63),
            },
          },
        },
        children: sections,
      },
    ],
    creator: "CV ATS Indonesia",
    title: "CV",
    styles: {
      default: {
        document: {
          run: {
            font: FONT_NAME,
            size: 21,
            color: COLOR_TEXT,
          },
        },
      },
    },
  });

  return await Packer.toBlob(doc);
}

/**
 * Trigger browser download
 */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download CV as PDF (via print dialog)
 */
export function downloadPdf(cv: CvData, fileName: string = "CV.pdf") {
  window.print();
}
