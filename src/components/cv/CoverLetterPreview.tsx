import type { CvData } from "@/lib/cv-types";

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
  const parsed = parseCoverLetter(coverLetter);

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

// Parse cover letter text into structured sections
function parseCoverLetter(text: string) {
  if (!text) return { salutation: "", paragraphs: [] as string[], closing: "" };

  // Split by double newlines or single newlines for better parsing
  const lines = text
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

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Check if line is a skip phrase (salutation or closing)
    const isSkipPhrase = skipPhrases.some((phrase) => {
      // Check if line starts with or equals skip phrase
      return lower === phrase || lower.startsWith(phrase + " ") || lower.startsWith(phrase + ",");
    });

    if (isSkipPhrase) {
      // First skip phrase is salutation, last is closing
      if (!salutation) {
        salutation = line;
      }
      closing = line; // Keep updating, last one wins
      continue;
    }

    paragraphs.push(line);
  }

  return { salutation, paragraphs, closing };
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
