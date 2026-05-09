import type { CvData } from "@/lib/cv-types";
import type { SectionDef } from "../editor/SectionsNav";
import { Section } from "./Section";

interface Props {
  data: CvData;
  showHeader?: boolean;
  sectionOrder?: SectionDef[];
}

// Default section order (excluding 'ats' which is not a visual section)
const DEFAULT_SECTION_ORDER = [
  { id: "personal", label: "Profil & Kontak" },
  { id: "experience", label: "Pengalaman Kerja" },
  { id: "education", label: "Pendidikan" },
  { id: "skills", label: "Keahlian" },
  { id: "extras", label: "Bahasa & Sertifikat" },
] as const;

export function JakartaTemplate({ data, showHeader = true, sectionOrder }: Props) {
  const { personal, experiences, educations, skills, languages, certificates } = data;

  // Use provided section order or default
  const orderedSections = sectionOrder?.filter(s => s.id !== "ats") || DEFAULT_SECTION_ORDER;

  // Check if personal section has content to show
  const hasPersonalContent = personal.fullName || personal.headline || personal.email || personal.phone || personal.location || personal.linkedin || personal.website || personal.summary;

  // Render section based on id
  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "personal":
        // Personal section renders the summary (header is handled separately)
        if (personal.summary) {
          return (
            <Section key="personal-summary" title="Ringkasan Profil">
              <p style={{ whiteSpace: "pre-wrap", textAlign: personal.summaryAlign || "left" }}>{personal.summary}</p>
            </Section>
          );
        }
        return null;

      case "experience":
        if (experiences.length > 0) {
          return (
            <Section key="experience" title="Pengalaman Kerja">
              {experiences.map((e) => (
                <div key={e.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                    <span>
                      {e.position} — {e.company}
                    </span>
                    <span style={{ fontWeight: 500, fontSize: "9.5pt" }}>
                      {e.startDate} – {e.current ? "Sekarang" : e.endDate}
                    </span>
                  </div>
                  {e.location && (
                    <div style={{ fontSize: "9.5pt", color: "#555" }}>{e.location}</div>
                  )}
                  <p style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{e.description}</p>
                </div>
              ))}
            </Section>
          );
        }
        return null;

      case "education":
        if (educations.length > 0) {
          return (
            <Section key="education" title="Pendidikan">
              {educations.map((ed) => (
                <div key={ed.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                    <span>
                      {ed.degree}
                      {ed.field ? `, ${ed.field}` : ""}
                    </span>
                    <span style={{ fontWeight: 500, fontSize: "9.5pt" }}>
                      {ed.startDate} – {ed.endDate}
                    </span>
                  </div>
                  <div style={{ fontSize: "10pt" }}>{ed.school}</div>
                  {ed.description && <p style={{ marginTop: 2 }}>{ed.description}</p>}
                </div>
              ))}
            </Section>
          );
        }
        return null;

      case "skills":
        if (skills.length > 0) {
          return (
            <Section key="skills" title="Keahlian">
              <p>{skills.map((s) => s.name).join(" • ")}</p>
            </Section>
          );
        }
        return null;

      case "extras":
        // Extras section contains languages and certificates
        const extrasContent: React.ReactNode[] = [];
        if (languages.length > 0) {
          extrasContent.push(
            <p key="languages" style={{ marginBottom: languages.length > 0 && certificates.length > 0 ? 4 : 0 }}>
              <strong>Bahasa:</strong> {languages.map((l) => `${l.name} (${l.level})`).join(" • ")}
            </p>
          );
        }
        if (certificates.length > 0) {
          extrasContent.push(
            <div key="certificates" style={{ marginBottom: 4 }}>
              <strong>Sertifikat:</strong>
              {certificates.map((c) => (
                <div key={c.id} style={{ marginLeft: 8 }}>
                  {c.name} — {c.issuer} <span style={{ color: "#555" }}>({c.date})</span>
                </div>
              ))}
            </div>
          );
        }
        if (extrasContent.length > 0) {
          return (
            <Section key="extras" title="Bahasa & Sertifikat">
              {extrasContent}
            </Section>
          );
        }
        return null;

      default:
        return null;
    }
  };

  return (
    <>
      {showHeader && hasPersonalContent && (
        <header style={{ textAlign: "center", marginBottom: 10 }}>
          <h1 style={{ fontSize: "20pt", fontWeight: 800, margin: 0 }}>
            {personal.fullName || "Nama Lengkap"}
          </h1>
          {personal.headline && (
            <p style={{ fontSize: "11pt", margin: "4px 0", color: "#444" }}>
              {personal.headline}
            </p>
          )}
          <p style={{ fontSize: "9.5pt", color: "#444", margin: "4px 0" }}>
            {[personal.email, personal.phone, personal.location].filter(Boolean).join(" • ")}
          </p>
          <p style={{ fontSize: "9.5pt", color: "#444", margin: "2px 0" }}>
            {[personal.linkedin, personal.website].filter(Boolean).join(" • ")}
          </p>
        </header>
      )}

      {/* Render sections based on order */}
      {orderedSections.map((section) => renderSection(section.id))}
    </>
  );
}
