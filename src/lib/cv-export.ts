import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageOrientation,
  convertInchesToTwip,
  BorderStyle,
  ShadingType,
} from "docx";
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
const COLOR_MEDAN_NAVY = "1a365d";
const COLOR_MEDAN_SUBTITLE = "2d3748";
const COLOR_MEDAN_CONTACT = "4a5568";
const COLOR_MAKASSAR_NAME = "1e3a8a";
const COLOR_MAKASSAR_HEADLINE = "3b82f6";
const COLOR_MAKASSAR_ACCENT = "1e40af";
const COLOR_SEMARANG_BG = "059669";
const COLOR_SEMARANG_BG2 = "047857";
const COLOR_BALI_ACCENT = "0891b2";
const COLOR_BALI_HEADING = "0f172a";
const COLOR_MALANG_PRIMARY = "1e40af";
const COLOR_MALANG_TEXT = "1e3a8a";
const COLOR_UBUD_PRIMARY = "8b5cf6";
const COLOR_UBUD_TEXT = "0f172a";

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

function bodyParagraph(
  text: string,
  options?: { spacing?: { before?: number; after?: number }; fontSize?: number },
): Paragraph {
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
        new TextRun({
          text: fullName,
          bold: true,
          size: 40,
          font: FONT_DISPLAY,
          color: COLOR_TEXT,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    }),
  );

  if (cv.personal.headline) {
    paras.push(
      new Paragraph({
        children: [
          new TextRun({
            text: cv.personal.headline,
            size: 22,
            font: FONT_NAME,
            color: COLOR_MUTED,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
      }),
    );
  }

  const contactLine1 = [cv.personal.email, cv.personal.phone, cv.personal.location]
    .filter(Boolean)
    .join(" • ");
  const contactLine2 = [cv.personal.linkedin, cv.personal.website].filter(Boolean).join(" • ");

  if (contactLine1) paras.push(mutedParagraph(contactLine1));
  if (contactLine2) paras.push(mutedParagraph(contactLine2));

  return paras;
}

function buildBandungHeader(cv: CvData): Paragraph[] {
  const fullName = cv.personal.fullName || "Nama Lengkap";
  const contact = [cv.personal.email, cv.personal.phone, cv.personal.location, cv.personal.linkedin]
    .filter(Boolean)
    .join(" • ");

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
              new TextRun({
                text: cv.personal.headline,
                size: 22,
                font: FONT_NAME,
                color: "FFFFFF",
              }),
            ],
            shading: { type: ShadingType.SOLID, color: COLOR_BG_BANDUNG, fill: COLOR_BG_BANDUNG },
            spacing: { after: 60 },
          }),
        ]
      : []),
    new Paragraph({
      children: [new TextRun({ text: contact, size: 19, font: FONT_NAME, color: "FFFFFF" })],
      shading: { type: ShadingType.SOLID, color: COLOR_BG_BANDUNG, fill: COLOR_BG_BANDUNG },
      spacing: { after: 200 },
    }),
  ];
}

function buildSurabayaHeader(cv: CvData): Paragraph[] {
  const fullName = cv.personal.fullName || "Nama Lengkap";
  const contact = [cv.personal.email, cv.personal.phone, cv.personal.location, cv.personal.linkedin]
    .filter(Boolean)
    .join(" • ");

  return [
    new Paragraph({
      children: [
        new TextRun({
          text: fullName,
          bold: true,
          size: 44,
          font: FONT_DISPLAY,
          color: COLOR_TEXT,
        }),
      ],
      border: {
        left: { style: BorderStyle.SINGLE, size: 12, color: COLOR_SURABAYA_BORDER, space: 12 },
      },
      spacing: { after: 20 },
    }),
    ...(cv.personal.headline
      ? [
          new Paragraph({
            children: [
              new TextRun({
                text: cv.personal.headline,
                bold: true,
                size: 22,
                font: FONT_NAME,
                color: COLOR_SURABAYA_HEADLINE,
              }),
            ],
            spacing: { after: 40 },
          }),
        ]
      : []),
    new Paragraph({
      children: [new TextRun({ text: contact, size: 19, font: FONT_NAME, color: COLOR_MUTED })],
      spacing: { after: 120 },
    }),
  ];
}

function buildYogyaHeader(cv: CvData): Paragraph[] {
  const fullName = cv.personal.fullName || "Nama Lengkap";
  const contact = [cv.personal.email, cv.personal.phone, cv.personal.location, cv.personal.linkedin]
    .filter(Boolean)
    .join(" • ");

  return [
    new Paragraph({
      children: [new TextRun({ text: fullName, size: 48, font: FONT_DISPLAY, color: COLOR_TEXT })],
      spacing: { after: 20 },
    }),
    ...(cv.personal.headline
      ? [
          new Paragraph({
            children: [
              new TextRun({
                text: cv.personal.headline,
                size: 22,
                font: FONT_NAME,
                color: "666666",
              }),
            ],
            spacing: { after: 60 },
          }),
        ]
      : []),
    new Paragraph({
      children: [new TextRun({ text: contact, size: 19, font: FONT_NAME, color: COLOR_MUTED })],
      spacing: { after: 40 },
    }),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC", space: 8 } },
      spacing: { after: 120 },
      children: [],
    }),
  ];
}

function buildMedanHeader(cv: CvData): Paragraph[] {
  const fullName = cv.personal.fullName || "Nama Lengkap";
  const contactLine1 = [cv.personal.email, cv.personal.phone, cv.personal.location]
    .filter(Boolean)
    .join(" • ");
  const contactLine2 = [cv.personal.linkedin, cv.personal.website].filter(Boolean).join(" • ");

  const paras: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: fullName,
          bold: true,
          size: 36,
          font: FONT_DISPLAY,
          color: COLOR_MEDAN_NAVY,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    }),
  ];

  if (cv.personal.headline) {
    paras.push(
      new Paragraph({
        children: [
          new TextRun({
            text: cv.personal.headline,
            size: 20,
            font: FONT_NAME,
            color: COLOR_MEDAN_SUBTITLE,
            bold: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
      }),
    );
  }

  if (contactLine1) {
    paras.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactLine1,
            size: 18,
            font: FONT_NAME,
            color: COLOR_MEDAN_CONTACT,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 20 },
      }),
    );
  }
  if (contactLine2) {
    paras.push(
      new Paragraph({
        children: [new TextRun({ text: contactLine2, size: 17, font: FONT_NAME, color: "718096" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 20 },
      }),
    );
  }

  // Navy bottom border
  paras.push(
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_MEDAN_NAVY, space: 4 } },
      spacing: { after: 120 },
      children: [],
    }),
  );

  return paras;
}

function buildMakassarHeader(cv: CvData): Paragraph[] {
  const fullName = cv.personal.fullName || "Nama Lengkap";
  const contact = [cv.personal.email, cv.personal.phone, cv.personal.location, cv.personal.linkedin]
    .filter(Boolean)
    .join(" • ");

  const paras: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: fullName,
          bold: true,
          size: 36,
          font: FONT_DISPLAY,
          color: COLOR_MAKASSAR_NAME,
        }),
      ],
      spacing: { after: 40 },
    }),
  ];

  if (cv.personal.headline) {
    paras.push(
      new Paragraph({
        children: [
          new TextRun({
            text: cv.personal.headline,
            size: 20,
            font: FONT_NAME,
            color: COLOR_MAKASSAR_HEADLINE,
          }),
        ],
        spacing: { after: 40 },
      }),
    );
  }

  // Blue accent line
  paras.push(
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 3, color: COLOR_MAKASSAR_ACCENT, space: 4 },
      },
      spacing: { after: 40 },
      children: [],
    }),
  );

  if (contact) {
    paras.push(
      new Paragraph({
        children: [new TextRun({ text: contact, size: 18, font: FONT_NAME, color: COLOR_MUTED })],
        spacing: { after: 120 },
      }),
    );
  }

  return paras;
}

function buildSemarangHeader(cv: CvData): Paragraph[] {
  const fullName = cv.personal.fullName || "Nama Lengkap";
  const contact = [cv.personal.email, cv.personal.phone, cv.personal.location]
    .filter(Boolean)
    .join(" • ");

  const paras: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({ text: fullName, bold: true, size: 40, font: FONT_DISPLAY, color: "FFFFFF" }),
      ],
      shading: { type: ShadingType.SOLID, color: COLOR_SEMARANG_BG, fill: COLOR_SEMARANG_BG },
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    }),
  ];

  if (cv.personal.headline) {
    paras.push(
      new Paragraph({
        children: [
          new TextRun({ text: cv.personal.headline, size: 21, font: FONT_NAME, color: "FFFFFF" }),
        ],
        shading: { type: ShadingType.SOLID, color: COLOR_SEMARANG_BG, fill: COLOR_SEMARANG_BG },
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
      }),
    );
  }

  paras.push(
    new Paragraph({
      children: [new TextRun({ text: contact, size: 18, font: FONT_NAME, color: "FFFFFF" })],
      shading: { type: ShadingType.SOLID, color: COLOR_SEMARANG_BG, fill: COLOR_SEMARANG_BG },
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
  );

  return paras;
}

function buildBaliHeader(cv: CvData): Paragraph[] {
  const fullName = cv.personal.fullName || "Nama Lengkap";
  const contact = [cv.personal.email, cv.personal.phone, cv.personal.location, cv.personal.linkedin]
    .filter(Boolean)
    .join(" • ");

  const paras: Paragraph[] = [];

  // Cyan accent strip (simulated as a thin colored paragraph border)
  paras.push(
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BALI_ACCENT, space: 4 },
      },
      spacing: { after: 100 },
      children: [],
    }),
  );

  paras.push(
    new Paragraph({
      children: [
        new TextRun({
          text: fullName,
          bold: true,
          size: 44,
          font: FONT_DISPLAY,
          color: COLOR_BALI_HEADING,
        }),
      ],
      spacing: { after: 40 },
    }),
  );

  if (cv.personal.headline) {
    paras.push(
      new Paragraph({
        children: [
          new TextRun({
            text: cv.personal.headline,
            size: 22,
            font: FONT_NAME,
            color: COLOR_BALI_ACCENT,
            bold: true,
          }),
        ],
        spacing: { after: 60 },
      }),
    );
  }

  if (contact) {
    paras.push(
      new Paragraph({
        children: [new TextRun({ text: contact, size: 18, font: FONT_NAME, color: "64748b" })],
        spacing: { after: 120 },
      }),
    );
  }

  return paras;
}

function buildMalangHeader(cv: CvData): Paragraph[] {
  const fullName = cv.personal.fullName || "Nama Lengkap";
  const contact = [cv.personal.email, cv.personal.phone, cv.personal.location, cv.personal.linkedin]
    .filter(Boolean)
    .join(" • ");

  const paras: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: fullName,
          bold: true,
          size: 40,
          font: FONT_DISPLAY,
          color: COLOR_MALANG_TEXT,
        }),
      ],
      spacing: { after: 40 },
    }),
  ];

  if (cv.personal.headline) {
    paras.push(
      new Paragraph({
        children: [
          new TextRun({
            text: cv.personal.headline,
            size: 22,
            font: FONT_NAME,
            color: COLOR_MALANG_PRIMARY,
            bold: true,
          }),
        ],
        spacing: { after: 60 },
      }),
    );
  }

  if (contact) {
    paras.push(
      new Paragraph({
        children: [new TextRun({ text: contact, size: 18, font: FONT_NAME, color: "64748b" })],
        spacing: { after: 120 },
      }),
    );
  }

  // Underline border in Malang primary color
  paras.push(
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_MALANG_PRIMARY, space: 4 },
      },
      spacing: { after: 120 },
      children: [],
    }),
  );

  return paras;
}

function buildUbudHeader(cv: CvData): Paragraph[] {
  const fullName = cv.personal.fullName || "Nama Lengkap";
  const contact = [cv.personal.email, cv.personal.phone, cv.personal.location, cv.personal.linkedin]
    .filter(Boolean)
    .join(" • ");

  const paras: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: fullName,
          bold: true,
          size: 40,
          font: FONT_DISPLAY,
          color: COLOR_UBUD_TEXT,
        }),
      ],
      spacing: { after: 40 },
    }),
  ];

  if (cv.personal.headline) {
    paras.push(
      new Paragraph({
        children: [
          new TextRun({
            text: cv.personal.headline,
            size: 22,
            font: FONT_NAME,
            color: COLOR_UBUD_PRIMARY,
            bold: true,
          }),
        ],
        spacing: { after: 60 },
      }),
    );
  }

  if (contact) {
    paras.push(
      new Paragraph({
        children: [new TextRun({ text: contact, size: 18, font: FONT_NAME, color: "64748b" })],
        spacing: { after: 120 },
      }),
    );
  }

  // Underline border in Ubud primary color
  paras.push(
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_UBUD_PRIMARY, space: 4 },
      },
      spacing: { after: 120 },
      children: [],
    }),
  );

  return paras;
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
    case "medan":
      sections.push(...buildMedanHeader(cv));
      break;
    case "makassar":
      sections.push(...buildMakassarHeader(cv));
      break;
    case "semarang":
      sections.push(...buildSemarangHeader(cv));
      break;
    case "bali":
      sections.push(...buildBaliHeader(cv));
      break;
    case "malang":
      sections.push(...buildMalangHeader(cv));
      break;
    case "ubud":
      sections.push(...buildUbudHeader(cv));
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
            new TextRun({
              text: `${exp.position} — ${exp.company}`,
              bold: true,
              size: 21,
              font: FONT_NAME,
              color: COLOR_TEXT,
            }),
          ],
          spacing: { before: 100, after: 20 },
        }),
      );
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${exp.startDate} – ${exp.current ? "Sekarang" : exp.endDate}`,
              size: 19,
              font: FONT_NAME,
              color: COLOR_MUTED,
            }),
          ],
          spacing: { after: exp.location ? 20 : 40 },
        }),
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
        }),
      );
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: edu.school, size: 20, font: FONT_NAME, color: COLOR_TEXT }),
          ],
          spacing: { after: 20 },
        }),
      );
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${edu.startDate} – ${edu.endDate}`,
              size: 19,
              font: FONT_NAME,
              color: COLOR_MUTED,
            }),
          ],
          spacing: { after: 40 },
        }),
      );
      if (edu.description) {
        sections.push(bodyParagraph(edu.description, { spacing: { after: 60 } }));
      }
    }
  }

  // ─── Skills ────────────────────────────────────────────────────
  if (cv.skills.length > 0) {
    sections.push(...headingSection("Keahlian"));
    sections.push(
      bodyParagraph(cv.skills.map((s) => s.name).join(" • "), { spacing: { after: 80 } }),
    );
  }

  // ─── Internship ────────────────────────────────────────────────
  const internships = cv.internships || [];
  if (internships.length > 0) {
    sections.push(...headingSection("Magang"));

    for (const item of internships) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${item.position} — ${item.company}`,
              bold: true,
              size: 21,
              font: FONT_NAME,
              color: COLOR_TEXT,
            }),
          ],
          spacing: { before: 100, after: 20 },
        }),
      );
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${item.startDate} – ${item.endDate}`,
              size: 19,
              font: FONT_NAME,
              color: COLOR_MUTED,
            }),
          ],
          spacing: { after: 40 },
        }),
      );
      if (item.description) {
        sections.push(bodyParagraph(item.description, { spacing: { after: 60 } }));
      }
    }
  }

  // ─── Organization ──────────────────────────────────────────────
  const organizations = cv.organizations || [];
  if (organizations.length > 0) {
    sections.push(...headingSection("Organisasi"));

    for (const item of organizations) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${item.role} — ${item.name}`,
              bold: true,
              size: 21,
              font: FONT_NAME,
              color: COLOR_TEXT,
            }),
          ],
          spacing: { before: 100, after: 20 },
        }),
      );
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${item.startDate} – ${item.endDate}`,
              size: 19,
              font: FONT_NAME,
              color: COLOR_MUTED,
            }),
          ],
          spacing: { after: 40 },
        }),
      );
      if (item.description) {
        sections.push(bodyParagraph(item.description, { spacing: { after: 60 } }));
      }
    }
  }

  // ─── Languages ────────────────────────────────────────────────
  if (cv.languages.length > 0) {
    sections.push(...headingSection("Bahasa"));
    sections.push(
      bodyParagraph(cv.languages.map((l) => `${l.name} (${l.level})`).join(" • "), {
        spacing: { after: 80 },
      }),
    );
  }

  // ─── Certificates ─────────────────────────────────────────────
  if (cv.certificates.length > 0) {
    sections.push(...headingSection("Sertifikat"));
    for (const cert of cv.certificates) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${cert.name}`,
              bold: true,
              size: 21,
              font: FONT_NAME,
              color: COLOR_TEXT,
            }),
            new TextRun({
              text: ` — ${cert.issuer} (${cert.date})`,
              size: 21,
              font: FONT_NAME,
              color: COLOR_TEXT,
            }),
          ],
          spacing: { after: 40 },
        }),
      );
    }
  }

  // ─── Watermark ────────────────────────────────────────────────
  if (watermark) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "cvpintar.web.id",
            size: 17,
            font: FONT_NAME,
            color: "000000",
          }),
          new TextRun({
            text: "\t\t\t\t\t\t\t\t\t\t\t\tpowered by CV Pintar",
            size: 17,
            font: FONT_NAME,
            color: "000000",
          }),
        ],
        alignment: AlignmentType.BOTH,
        spacing: { before: 400 },
      }),
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
    creator: "CV Pintar",
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
 * Download CV as a real PDF file (rendered client-side, not via window.print()).
 *
 * iOS Safari's print dialog has no "headers and footers" toggle like desktop
 * Chrome/Edge, so anything printed through window.print() always gets a page
 * URL/title footer stamped on by AirPrint itself — that's OS/browser chrome,
 * not something CSS can suppress. Generating an actual PDF file sidesteps it
 * entirely: printing a PDF document never adds that footer.
 */
export async function downloadPdf(_cv: CvData, fileName: string = "CV.pdf"): Promise<void> {
  const printSource =
    document.querySelector<HTMLElement>(".cv-print-document .cv-print-area") ||
    document.querySelector<HTMLElement>(".cv-print-area");

  if (!printSource) {
    window.print();
    return;
  }

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;

  // Render a de-chromed clone off-screen at a fixed real-world width so the
  // editor's card border/shadow/zoom (or a hidden mobile tab) never leaks
  // into the exported page — mirrors the print stylesheet the app already
  // ships, but with an explicit width since html2canvas needs real layout
  // (unlike @page print sizing, it can't fall back to page-box metrics).
  const sandbox = document.createElement("div");
  sandbox.style.position = "fixed";
  sandbox.style.top = "0";
  sandbox.style.left = "-99999px";
  sandbox.style.width = `${A4_WIDTH_MM}mm`;
  sandbox.style.background = "#ffffff";
  sandbox.style.zIndex = "-1";

  const style = document.createElement("style");
  style.textContent = `
    .cv-pdf-sandbox * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    .cv-pdf-sandbox .cv-print-area {
      display: block !important;
      padding: 0 !important;
      background: #ffffff !important;
      overflow: visible !important;
    }

    .cv-pdf-sandbox .cv-print-area > div,
    .cv-pdf-sandbox .cv-preview-container,
    .cv-pdf-sandbox .cv-preview {
      display: block !important;
      width: ${A4_WIDTH_MM}mm !important;
      height: auto !important;
      min-width: 0 !important;
      min-height: 0 !important;
      margin: 0 !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      transform: none !important;
      overflow: visible !important;
    }

    .cv-pdf-sandbox .cv-preview {
      padding: 11mm 16mm !important;
    }

    .cv-pdf-sandbox .cv-preview-watermark {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      width: 100% !important;
      margin-top: 8mm !important;
      color: #000000 !important;
      font-size: 8.5pt !important;
      line-height: 1.2 !important;
    }
  `;

  const clonedCv = printSource.cloneNode(true) as HTMLElement;
  sandbox.className = "cv-pdf-sandbox";
  sandbox.appendChild(style);
  sandbox.appendChild(clonedCv);
  document.body.appendChild(sandbox);

  try {
    // Let web fonts settle before rasterizing so text isn't measured with
    // fallback-font metrics.
    await (document.fonts?.ready ?? Promise.resolve());
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );

    const canvas = await html2canvas(clonedCv, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageHeightPx = Math.round((A4_HEIGHT_MM / A4_WIDTH_MM) * canvas.width);

    let renderedPx = 0;
    let isFirstPage = true;
    while (renderedPx < canvas.height) {
      const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx);
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeightPx;
      const ctx = pageCanvas.getContext("2d");
      if (!ctx) break;
      ctx.drawImage(
        canvas,
        0,
        renderedPx,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        sliceHeightPx,
      );

      const imgData = pageCanvas.toDataURL("image/jpeg", 0.95);
      const sliceHeightMm = (sliceHeightPx / canvas.width) * A4_WIDTH_MM;

      if (!isFirstPage) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, A4_WIDTH_MM, sliceHeightMm);

      renderedPx += sliceHeightPx;
      isFirstPage = false;
    }

    pdf.save(fileName);
  } finally {
    sandbox.remove();
  }
}

// ─── Cover Letter DOCX Generator ─────────────────────────────

export function parseCoverLetter(text: string, cvData?: CvData) {
  if (!text) return { salutation: "", paragraphs: [] as string[], closing: "" };

  // Strip markdown bold markers from the text
  const cleanText = text.replace(/\*\*/g, "");

  const lines = cleanText
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let salutation = "";
  let closing = "";
  const paragraphs: string[] = [];
  const skipPhrases = [
    "kepada yth",
    "kepada yang terhormat",
    "yang terhormat",
    "kepada hrd",
    "dengan hormat",
    "hormat saya",
    "salam hormat",
    "terhormat",
  ];

  // Clean values for comparison
  const nameClean = cvData?.personal?.fullName?.trim().toLowerCase() || "";
  const emailClean = cvData?.personal?.email?.trim().toLowerCase() || "";
  const phoneClean = cvData?.personal?.phone?.trim().toLowerCase() || "";
  const phoneDigits = phoneClean.replace(/\D/g, "");

  for (const line of lines) {
    const lower = line.toLowerCase();
    const cleanLine = lower.trim();

    // Skip candidate details if present at the end or beginning
    if (nameClean && cleanLine === nameClean) continue;
    if (emailClean && cleanLine === emailClean) continue;
    if (phoneClean && cleanLine === phoneClean) continue;
    if (phoneDigits && cleanLine.replace(/\D/g, "") === phoneDigits) continue;

    const isSkipPhrase = skipPhrases.some((phrase) => {
      return lower === phrase || lower.startsWith(phrase + " ") || lower.startsWith(phrase + ",");
    });

    if (isSkipPhrase) {
      if (!salutation) {
        salutation = line;
      }
      closing = line;
      continue;
    }

    paragraphs.push(line);
  }

  return { salutation, paragraphs, closing };
}

export async function generateCoverLetterDocx(
  coverLetter: string,
  cvData: CvData,
  company?: string,
  position?: string,
): Promise<Blob> {
  const sections: Paragraph[] = [];
  const parsed = parseCoverLetter(coverLetter, cvData);

  // 1. Sender Info
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: cvData.personal.fullName || "Nama Lengkap",
          bold: true,
          size: 28, // 14pt * 2
          font: "Times New Roman",
        }),
      ],
      spacing: { after: 80 },
    }),
  );

  const contactDetails: string[] = [];
  if (cvData.personal.email) contactDetails.push(cvData.personal.email);
  if (cvData.personal.phone) contactDetails.push(cvData.personal.phone);
  if (cvData.personal.location) contactDetails.push(cvData.personal.location);

  if (contactDetails.length > 0) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactDetails.join("  |  "),
            size: 20, // 10pt * 2
            color: "555555",
            font: "Times New Roman",
          }),
        ],
        spacing: { after: 240 },
      }),
    );
  }

  // Divider line
  sections.push(
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: "cccccc", space: 1 },
      },
      spacing: { after: 240 },
      children: [],
    }),
  );

  // 2. Date
  const formattedDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: formattedDate,
          size: 24, // 12pt * 2
          font: "Times New Roman",
        }),
      ],
      spacing: { after: 240 },
    }),
  );

  // 3. Recipient
  if (company || position) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Kepada Yth.,",
            size: 24,
            font: "Times New Roman",
          }),
        ],
      }),
    );
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `HRD ${company || "Perusahaan"}`,
            bold: true,
            size: 24,
            font: "Times New Roman",
          }),
        ],
        spacing: position ? undefined : { after: 240 },
      }),
    );

    if (position) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Posisi: ${position}`,
              size: 24,
              font: "Times New Roman",
            }),
          ],
          spacing: { after: 240 },
        }),
      );
    }
  }

  // 4. Salutation
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: parsed.salutation || "Dengan hormat,",
          size: 24,
          font: "Times New Roman",
        }),
      ],
      spacing: { after: 120 },
    }),
  );

  // 5. Body Paragraphs
  const bodyParagraphs = parsed.paragraphs.length > 0 ? parsed.paragraphs : [coverLetter];
  for (const para of bodyParagraphs) {
    sections.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [
          new TextRun({
            text: para,
            size: 24,
            font: "Times New Roman",
          }),
        ],
        spacing: { after: 160 },
      }),
    );
  }

  // 6. Closing
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: parsed.closing || "Hormat saya,",
          size: 24,
          font: "Times New Roman",
        }),
      ],
      spacing: { before: 240, after: 600 },
    }),
  );

  // 7. Signature
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: cvData.personal.fullName || "Nama Lengkap",
          bold: true,
          size: 24,
          font: "Times New Roman",
        }),
      ],
    }),
  );

  if (cvData.personal.headline) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: cvData.personal.headline,
            size: 18,
            color: "555555",
            font: "Times New Roman",
          }),
        ],
      }),
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
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children: sections,
      },
    ],
    creator: "CV Pintar",
    title: "Cover Letter",
    styles: {
      default: {
        document: {
          run: {
            font: "Times New Roman",
            size: 24,
            color: "000000",
          },
        },
      },
    },
  });

  return await Packer.toBlob(doc);
}
