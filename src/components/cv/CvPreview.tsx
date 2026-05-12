import type { CvData, TemplateId } from "@/lib/cv-types";
import { useMemo } from "react";
import type { SectionDef } from "./editor/SectionsNav";
import {
  JakartaTemplate,
  BandungTemplate,
  SurabayaTemplate,
  YogyaTemplate,
  MedanTemplate,
  MakassarTemplate,
  SemarangTemplate,
  BaliTemplate,
} from "./templates";

function formatDescription(text: string): string {
  if (!text) return text;
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith("- ")) {
        const indent = line.length - trimmed.length;
        return " ".repeat(indent) + "\u2022 " + trimmed.slice(2);
      }
      return line;
    })
    .join("\n");
}

function formatCvDescriptions(data: CvData): CvData {
  return {
    ...data,
    experiences: data.experiences.map((e) => ({
      ...e,
      description: formatDescription(e.description),
    })),
    educations: data.educations.map((e) => ({
      ...e,
      description: e.description ? formatDescription(e.description) : e.description,
    })),
  };
}

interface Props {
  data: CvData;
  template: TemplateId;
  scale?: number;
  showWatermark?: boolean;
  pageNumber?: number;
  totalPages?: number;
  sectionOrder?: SectionDef[];
}

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PADDING_MM = 16;
const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - PADDING_MM * 2;

export function CvPreview({
  data,
  template,
  scale = 1,
  showWatermark = false,
  pageNumber = 1,
  totalPages = 1,
  sectionOrder,
}: Props) {
  const formattedData = useMemo(() => formatCvDescriptions(data), [data]);

  const renderTemplate = () => {
    switch (template) {
      case "bandung":
        return <BandungTemplate data={formattedData} sectionOrder={sectionOrder} />;
      case "surabaya":
        return <SurabayaTemplate data={formattedData} sectionOrder={sectionOrder} />;
      case "yogya":
        return <YogyaTemplate data={formattedData} sectionOrder={sectionOrder} />;
      case "medan":
        return <MedanTemplate data={formattedData} sectionOrder={sectionOrder} />;
      case "makassar":
        return <MakassarTemplate data={formattedData} sectionOrder={sectionOrder} />;
      case "semarang":
        return <SemarangTemplate data={formattedData} sectionOrder={sectionOrder} />;
      case "bali":
        return <BaliTemplate data={formattedData} sectionOrder={sectionOrder} />;
      case "jakarta":
      default:
        return <JakartaTemplate data={formattedData} sectionOrder={sectionOrder} />;
    }
  };

  return (
    <div
      className="cv-preview-container relative print:!w-auto print:!h-auto"
      style={{
        width: `${A4_WIDTH_MM * scale}mm`,
        height: `${A4_HEIGHT_MM * scale}mm`,
        margin: "0 auto",
      }}
    >
      <div
        className="cv-preview bg-white text-[#111] shadow-sm print:!transform-none print:!w-auto print:!h-auto print:!overflow-visible"
        style={{
          width: `${A4_WIDTH_MM}mm`,
          height: `${A4_HEIGHT_MM}mm`,
          padding: `${PADDING_MM}mm`,
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "10.5pt",
          lineHeight: 1.5,
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          overflow: "hidden",
        }}
      >
        {renderTemplate()}
      </div>

      {showWatermark && (
        <div
          className="cv-preview-watermark absolute bottom-4 right-4 text-xs text-gray-400 pointer-events-none"
          style={{
            fontSize: "8pt",
            color: "#ccc",
            textAlign: "right",
          }}
        >
          Dibuat dengan CV Pintar
        </div>
      )}

      {totalPages > 1 && (
        <div
          className="absolute bottom-4 right-4 text-xs text-gray-500"
          style={{ fontSize: "9pt", color: "#999" }}
        >
          {pageNumber} / {totalPages}
        </div>
      )}
    </div>
  );
}

// Multi-page CV Preview Component
interface MultiPagePreviewProps {
  data: CvData;
  template: TemplateId;
  scale?: number;
  showWatermark?: boolean;
  maxContentHeight?: number; // in mm
}

export function MultiPageCvPreview({
  data,
  template,
  scale = 0.7,
  showWatermark = false,
  maxContentHeight = CONTENT_HEIGHT_MM,
}: MultiPagePreviewProps) {
  // Split content into pages
  const pages = splitContentIntoPages(data, maxContentHeight);

  return (
    <div className="flex flex-col gap-4 items-center">
      {pages.map((pageData, index) => (
        <div
          key={index}
          className="relative"
          style={{
            width: `${A4_WIDTH_MM * scale}mm`,
          }}
        >
          <div
            className="cv-preview bg-white text-[#111] shadow-lg"
            style={{
              width: `${A4_WIDTH_MM}mm`,
              minHeight: `${A4_HEIGHT_MM}mm`,
              padding: `${PADDING_MM}mm`,
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "10.5pt",
              lineHeight: 1.5,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            {renderTemplateById(template, pageData, index === 0)}
          </div>

          {showWatermark && (
            <div
              className="absolute bottom-4 right-4 text-xs text-gray-400 pointer-events-none"
              style={{
                fontSize: "8pt",
                color: "#ccc",
                textAlign: "right",
              }}
            >
              Dibuat dengan CV Pintar
            </div>
          )}

          {pages.length > 1 && (
            <div
              className="absolute bottom-4 right-4 text-xs text-gray-500"
              style={{ fontSize: "9pt", color: "#999" }}
            >
              {index + 1} / {pages.length}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Helper function to render template by ID
function renderTemplateById(
  templateId: TemplateId,
  data: CvData,
  showHeader: boolean
) {
  const formatted = formatCvDescriptions(data);
  const dataWithHiddenHeader = showHeader
    ? formatted
    : {
        ...formatted,
        personal: {
          ...formatted.personal,
          fullName: "",
          headline: "",
          email: "",
          phone: "",
          location: "",
          linkedin: "",
          website: "",
        },
      };

  switch (templateId) {
    case "bandung":
      return (
        <div>
          {showHeader && (
            <header
              style={{
                background: "#468432",
                color: "#fff",
                padding: "14px 16px",
                margin: "-16mm -16mm 14px -16mm",
              }}
            >
              <h1 style={{ fontSize: "22pt", fontWeight: 800, margin: 0 }}>
                {data.personal.fullName || "Nama Lengkap"}
              </h1>
              {data.personal.headline && (
                <p style={{ margin: "4px 0 0", opacity: 0.95 }}>
                  {data.personal.headline}
                </p>
              )}
              <p style={{ margin: "6px 0 0", fontSize: "9.5pt" }}>
                {[
                  data.personal.email,
                  data.personal.phone,
                  data.personal.location,
                  data.personal.linkedin,
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
            </header>
          )}
          <JakartaTemplate data={dataWithHiddenHeader} showHeader={false} />
        </div>
      );

    case "surabaya":
      return (
        <div>
          {showHeader && (
            <header
              style={{
                borderLeft: "6px solid #468432",
                paddingLeft: 12,
                marginBottom: 12,
              }}
            >
              <h1 style={{ fontSize: "22pt", fontWeight: 800, margin: 0 }}>
                {data.personal.fullName || "Nama Lengkap"}
              </h1>
              {data.personal.headline && (
                <p
                  style={{
                    margin: "2px 0",
                    color: "#468432",
                    fontWeight: 600,
                  }}
                >
                  {data.personal.headline}
                </p>
              )}
              <p style={{ fontSize: "9.5pt", color: "#444", margin: "4px 0" }}>
                {[
                  data.personal.email,
                  data.personal.phone,
                  data.personal.location,
                  data.personal.linkedin,
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
            </header>
          )}
          <JakartaTemplate data={dataWithHiddenHeader} showHeader={false} />
        </div>
      );

    case "yogya":
      return (
        <div>
          {showHeader && (
            <header style={{ textAlign: "left", marginBottom: 12 }}>
              <h1
                style={{
                  fontSize: "24pt",
                  fontWeight: 300,
                  margin: 0,
                  letterSpacing: 1,
                }}
              >
                {data.personal.fullName || "Nama Lengkap"}
              </h1>
              {data.personal.headline && (
                <p style={{ margin: "2px 0 6px", color: "#666" }}>
                  {data.personal.headline}
                </p>
              )}
              <p style={{ fontSize: "9.5pt", color: "#444", margin: 0 }}>
                {[
                  data.personal.email,
                  data.personal.phone,
                  data.personal.location,
                  data.personal.linkedin,
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
              <hr style={{ border: 0, borderTop: "1px solid #ccc", margin: "8px 0 0" }} />
            </header>
          )}
          <JakartaTemplate data={dataWithHiddenHeader} showHeader={false} />
        </div>
      );

    case "jakarta":
    default:
      return <JakartaTemplate data={dataWithHiddenHeader} showHeader={showHeader} />;
  }
}

// Estimate content height and split into pages
function splitContentIntoPages(
  data: CvData,
  maxHeight: number
): CvData[] {
  // Estimate each section height in mm
  const estimateSectionHeight = (section: string, items: unknown[]): number => {
    const baseHeight = 15; // header + margin
    if (items.length === 0) return 0;

    switch (section) {
      case "summary":
        return baseHeight + (data.personal.summary?.length || 0) / 50 * 5;
      case "experiences":
        return baseHeight + items.length * 25 + (data.personal.summary ? 20 : 0);
      case "educations":
        return baseHeight + items.length * 20;
      case "skills":
        return baseHeight + Math.ceil(items.length / 6) * 8;
      case "languages":
        return baseHeight + items.length * 8;
      case "certificates":
        return baseHeight + items.length * 10;
      default:
        return baseHeight;
    }
  };

  const sections = [
    { key: "summary", data: data.personal.summary, items: [1] },
    { key: "experiences", data: null, items: data.experiences },
    { key: "educations", data: null, items: data.educations },
    { key: "skills", data: null, items: data.skills },
    { key: "languages", data: null, items: data.languages },
    { key: "certificates", data: null, items: data.certificates },
  ];

  // Calculate total estimated height
  let totalHeight = 0;
  sections.forEach((section) => {
    if (section.items.length > 0) {
      totalHeight += estimateSectionHeight(section.key, section.items);
    }
  });

  // If content fits in one page, return single page
  if (totalHeight <= maxHeight) {
    return [data];
  }

  // Multi-page split logic
  const pages: CvData[] = [];
  let currentPage: Partial<CvData> = {
    personal: { ...data.personal },
    experiences: [],
    educations: [],
    skills: [],
    languages: [],
    certificates: [],
  };
  let currentHeight = 0;

  // Helper to add section to current page or create new page
  const addToCurrentPage = (
    section: string,
    sectionData: Partial<CvData>,
    sectionHeight: number
  ) => {
    if (currentHeight + sectionHeight > maxHeight) {
      // Push current page and start new one
      pages.push({
        personal: currentPage.personal!,
        experiences: currentPage.experiences || [],
        educations: currentPage.educations || [],
        skills: currentPage.skills || [],
        languages: currentPage.languages || [],
        certificates: currentPage.certificates || [],
      });
      currentPage = {
        personal: { ...data.personal },
        experiences: [],
        educations: [],
        skills: [],
        languages: [],
        certificates: [],
      };
      currentHeight = 0;
    }

    currentHeight += sectionHeight;

    if (section === "personal") {
      // Personal section is always on first page
      return;
    }

    // Add section data
    switch (section) {
      case "experiences":
        currentPage.experiences = [...(currentPage.experiences || []), ...(sectionData.experiences || [])];
        break;
      case "educations":
        currentPage.educations = [...(currentPage.educations || []), ...(sectionData.educations || [])];
        break;
      case "skills":
        currentPage.skills = [...(currentPage.skills || []), ...(sectionData.skills || [])];
        break;
      case "languages":
        currentPage.languages = [...(currentPage.languages || []), ...(sectionData.languages || [])];
        break;
      case "certificates":
        currentPage.certificates = [...(currentPage.certificates || []), ...(sectionData.certificates || [])];
        break;
    }
  };

  // Process sections
  sections.forEach((section) => {
    if (section.items.length === 0) return;

    const sectionHeight = estimateSectionHeight(section.key, section.items);

    switch (section.key) {
      case "summary":
        addToCurrentPage("personal", {}, sectionHeight);
        break;
      case "experiences":
        // Split experiences across pages if needed
        let expHeight = 15;
        const experiencesCopy = [...data.experiences];
        let tempExperiences: typeof data.experiences = [];

        experiencesCopy.forEach((exp) => {
          const itemHeight = 25;
          if (expHeight + itemHeight > maxHeight - currentHeight && tempExperiences.length > 0) {
            addToCurrentPage("experiences", { experiences: tempExperiences }, expHeight);
            tempExperiences = [];
            expHeight = 15;
          }
          tempExperiences.push(exp);
          expHeight += itemHeight;
        });

        if (tempExperiences.length > 0) {
          addToCurrentPage("experiences", { experiences: tempExperiences }, expHeight);
        }
        break;
      case "educations":
        addToCurrentPage("educations", { educations: data.educations }, sectionHeight);
        break;
      case "skills":
        addToCurrentPage("skills", { skills: data.skills }, sectionHeight);
        break;
      case "languages":
        addToCurrentPage("languages", { languages: data.languages }, sectionHeight);
        break;
      case "certificates":
        addToCurrentPage("certificates", { certificates: data.certificates }, sectionHeight);
        break;
    }
  });

  // Push remaining content
  if (
    currentPage.experiences?.length ||
    currentPage.educations?.length ||
    currentPage.skills?.length ||
    currentPage.languages?.length ||
    currentPage.certificates?.length
  ) {
    pages.push({
      personal: currentPage.personal!,
      experiences: currentPage.experiences || [],
      educations: currentPage.educations || [],
      skills: currentPage.skills || [],
      languages: currentPage.languages || [],
      certificates: currentPage.certificates || [],
    });
  }

  return pages.length > 0 ? pages : [data];
}

// CSS for print
export const cvPrintStyles = `
@media print {
  .cv-editor-page {
    height: auto !important;
    display: block !important;
  }

  .cv-preview-container {
    page-break-inside: avoid;
    width: auto !important;
    height: auto !important;
    min-height: 0 !important;
    margin: 0 !important;
    transform: none !important;
    overflow: visible !important;
  }

  .cv-preview {
    box-shadow: none !important;
    margin: 0 !important;
    padding: 16mm !important;
    width: 210mm !important;
    height: auto !important;
    min-height: 297mm !important;
    overflow: visible !important;
    transform: none !important;
  }

  .cv-print-area {
    padding: 0 !important;
    display: flex !important;
    justify-content: center !important;
  }

  .cv-print-area > div {
    transform: none !important;
    width: auto !important;
    height: auto !important;
    min-width: 0 !important;
    min-height: 0 !important;
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
    overflow: visible !important;
  }

  @page {
    size: A4;
    margin: 0;
  }

  /* Ensure watermark shows in print */
  .cv-preview-watermark {
    display: block !important;
    position: absolute !important;
    bottom: 8mm !important;
    right: 8mm !important;
  }
}
`;
