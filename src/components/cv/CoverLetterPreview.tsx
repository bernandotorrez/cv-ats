import type { CvData } from "@/lib/cv-types";
import { parseCoverLetter } from "@/lib/cv-export";

interface Props {
  coverLetter: string;
  cvData: CvData;
  company?: string;
  position?: string;
  scale?: number;
}

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PADDING_MM = 25;
const MARGIN_MM = 20;

export function CoverLetterPreview({ coverLetter, cvData, company, position, scale = 0.7 }: Props) {
  // Parse cover letter into structured sections
  const parsed = parseCoverLetter(coverLetter, cvData);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // If no parsed content, show raw text in a nice format
  const hasParsedContent = parsed.paragraphs.length > 0;

  return (
    <div
      className="cover-letter-preview-container relative mx-auto"
      style={{
        width: `${A4_WIDTH_MM * scale}mm`,
        transformOrigin: "top center",
      }}
    >
      <div
        className="cover-letter-preview bg-white text-[#111] shadow-lg print:!shadow-none"
        style={{
          width: `${A4_WIDTH_MM}mm`,
          minHeight: `${A4_HEIGHT_MM}mm`,
          padding: `${PADDING_MM}mm`,
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: "11pt",
          lineHeight: 1.5,
        }}
      >
        {/* Header / Sender Info - using div instead of p to avoid default margins */}
        <div style={{ marginBottom: "12mm" }}>
          <h1
            style={{
              fontSize: "16pt",
              fontWeight: "bold",
              margin: 0,
              marginBottom: "4px",
            }}
          >
            {cvData.personal.fullName || "Nama Lengkap"}
          </h1>
          <div style={{ fontSize: "10pt", color: "#444", lineHeight: 1.4 }}>
            {cvData.personal.email && (
              <span style={{ display: "block", margin: 0 }}>{cvData.personal.email}</span>
            )}
            {cvData.personal.phone && (
              <span style={{ display: "block", margin: 0 }}>{cvData.personal.phone}</span>
            )}
            {cvData.personal.location && (
              <span style={{ display: "block", margin: 0 }}>{cvData.personal.location}</span>
            )}
          </div>
        </div>

        {/* Date */}
        <div style={{ marginBottom: "12mm" }}>
          <span>{formatDate(new Date())}</span>
        </div>

        {/* Recipient */}
        {(company || position) && (
          <div style={{ marginBottom: "12mm" }}>
            <span style={{ display: "block" }}>Kepada Yth.,</span>
            <span style={{ display: "block", fontWeight: "bold" }}>
              HRD {company || "Perusahaan"}
            </span>
            {position && <span style={{ display: "block" }}>Posisi: {position}</span>}
          </div>
        )}

        {/* Salutation */}
        <div style={{ marginBottom: "6mm" }}>
          <span>{parsed.salutation || "Dengan hormat,"}</span>
        </div>

        {/* Body Paragraphs */}
        {hasParsedContent ? (
          <div style={{ textAlign: "justify", marginBottom: "8mm" }}>
            {parsed.paragraphs.map((para, idx) => (
              <p
                key={idx}
                style={{
                  margin: 0,
                  marginBottom: idx < parsed.paragraphs.length - 1 ? "8pt" : 0,
                }}
              >
                {para}
              </p>
            ))}
          </div>
        ) : (
          // Fallback: show raw cover letter text
          <div style={{ textAlign: "justify", marginBottom: "8mm", whiteSpace: "pre-wrap" }}>
            {coverLetter}
          </div>
        )}

        {/* Closing */}
        <div style={{ marginTop: "15mm" }}>
          <span>{parsed.closing || "Hormat saya,"}</span>
        </div>

        {/* Signature / Name */}
        <div style={{ marginTop: "30mm" }}>
          <span
            style={{
              display: "block",
              fontWeight: "bold",
              fontSize: "12pt",
            }}
          >
            {cvData.personal.fullName || "Nama Lengkap"}
          </span>
          {cvData.personal.headline && (
            <span style={{ display: "block", fontSize: "9pt", color: "#555" }}>
              {cvData.personal.headline}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}


// Print styles for cover letter
export const coverLetterPrintStyles = `
@media print {
  .cover-letter-preview-container {
    page-break-after: always;
    page-break-inside: avoid;
  }

  .cover-letter-preview {
    box-shadow: none !important;
    margin: 0 !important;
    padding: 20mm !important;
  }

  @page {
    size: A4;
    margin: 0;
  }
}
`;
