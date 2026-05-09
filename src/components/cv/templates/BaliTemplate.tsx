import type { CvData } from "@/lib/cv-types";
import type { SectionDef } from "../editor/SectionsNav";
import { Section } from "./Section";

interface Props {
  data: CvData;
  showHeader?: boolean;
  sectionOrder?: SectionDef[];
}

const DEFAULT_SECTION_ORDER = [
  { id: "personal", label: "Profil & Kontak" },
  { id: "experience", label: "Pengalaman Kerja" },
  { id: "education", label: "Pendidikan" },
  { id: "skills", label: "Keahlian" },
  { id: "extras", label: "Bahasa & Sertifikat" },
] as const;

export function BaliTemplate({ data, showHeader = true, sectionOrder }: Props) {
  const { personal, experiences, educations, skills, languages, certificates } = data;
  const orderedSections = sectionOrder?.filter(s => s.id !== "ats") || DEFAULT_SECTION_ORDER;

  const hasPersonalContent = personal.fullName || personal.headline;

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "personal":
        if (personal.summary) {
          return (
            <Section key="personal-summary" title="Profil">
              <p style={{ whiteSpace: "pre-wrap", textAlign: personal.summaryAlign || "left" }}>{personal.summary}</p>
            </Section>
          );
        }
        return null;

      case "experience":
        if (experiences.length > 0) {
          return (
            <Section key="experience" title="Riwayat Pekerjaan">
              {experiences.map((e, idx) => (
                <div key={e.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
                    <div>
                      <strong style={{ fontSize: "10.5pt", color: "#1e293b" }}>{e.position}</strong>
                      <span style={{ fontSize: "10pt", color: "#64748b" }}> — {e.company}</span>
                    </div>
                    <span style={{ fontSize: "9pt", color: "#94a3b8", whiteSpace: "nowrap", marginLeft: 8 }}>
                      {e.startDate} – {e.current ? "Sekarang" : e.endDate}
                    </span>
                  </div>
                  {e.location && (
                    <div style={{ fontSize: "9pt", color: "#94a3b8", marginBottom: 3 }}>{e.location}</div>
                  )}
                  <p style={{ fontSize: "9.5pt", whiteSpace: "pre-wrap", color: "#475569", lineHeight: 1.6, margin: 0 }}>
                    {e.description}
                  </p>
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <strong style={{ fontSize: "10.5pt", color: "#1e293b" }}>
                      {ed.degree}{ed.field ? `, ${ed.field}` : ""}
                    </strong>
                    <span style={{ fontSize: "9pt", color: "#94a3b8" }}>{ed.startDate} – {ed.endDate}</span>
                  </div>
                  <div style={{ fontSize: "10pt", color: "#64748b" }}>{ed.school}</div>
                  {ed.description && (
                    <p style={{ fontSize: "9pt", color: "#94a3b8", marginTop: 2 }}>{ed.description}</p>
                  )}
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
              <p style={{ fontSize: "10pt", lineHeight: 1.8 }}>
                {skills.map((s, idx) => (
                  <span key={s.id}>
                    {s.name}{idx < skills.length - 1 ? " • " : ""}
                  </span>
                ))}
              </p>
            </Section>
          );
        }
        return null;

      case "extras":
        const extrasContent: React.ReactNode[] = [];
        if (languages.length > 0) {
          extrasContent.push(
            <div key="languages" style={{ marginBottom: languages.length > 0 && certificates.length > 0 ? 6 : 0 }}>
              <strong style={{ fontSize: "9.5pt" }}>Bahasa:</strong>
              <span style={{ fontSize: "9.5pt", color: "#64748b" }}>
                {" "}{languages.map((l) => `${l.name} (${l.level})`).join(", ")}
              </span>
            </div>
          );
        }
        if (certificates.length > 0) {
          extrasContent.push(
            <div key="certificates">
              <strong style={{ fontSize: "9.5pt" }}>Sertifikat:</strong>
              {certificates.map((c) => (
                <div key={c.id} style={{ fontSize: "9.5pt", color: "#64748b", marginLeft: 12 }}>
                  {c.name} — {c.issuer} ({c.date})
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
        <header style={{ marginBottom: 12 }}>
          {/* Accent color strip */}
          <div style={{ height: 4, background: "#0891b2", marginBottom: 10, borderRadius: 2 }} />
          
          <h1 style={{ fontSize: "22pt", fontWeight: 700, margin: 0, color: "#0f172a", letterSpacing: -0.5 }}>
            {personal.fullName || "Nama Lengkap"}
          </h1>
          
          {personal.headline && (
            <p style={{ fontSize: "11pt", margin: "4px 0", color: "#0891b2", fontWeight: 600 }}>
              {personal.headline}
            </p>
          )}
          
          {/* Contact info in a row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", fontSize: "9pt", color: "#64748b", marginTop: 6 }}>
            {personal.email && <span>{personal.email}</span>}
            {personal.phone && <span>{personal.phone}</span>}
            {personal.location && <span>{personal.location}</span>}
            {personal.linkedin && <span>LinkedIn: {personal.linkedin}</span>}
            {personal.website && <span>Web: {personal.website}</span>}
          </div>
        </header>
      )}

      {orderedSections.map((section) => renderSection(section.id))}
    </>
  );
}
