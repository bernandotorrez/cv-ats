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

export function MakassarTemplate({ data, showHeader = true, sectionOrder }: Props) {
  const { personal, experiences, educations, skills, languages, certificates } = data;
  const orderedSections = sectionOrder?.filter(s => s.id !== "ats") || DEFAULT_SECTION_ORDER;

  const hasPersonalContent = personal.fullName || personal.headline;

  // Split sections into left (sidebar) and right (main) columns
  const leftSections = ["personal", "skills"];
  const rightSections = orderedSections.filter(s => !leftSections.includes(s.id)).map(s => s.id);

  const renderLeftSection = (sectionId: string) => {
    switch (sectionId) {
      case "personal":
        return (
          <div key="contact" style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: "10pt", fontWeight: 700, textTransform: "uppercase", color: "#1e40af", borderBottom: "1px solid #1e40af", paddingBottom: 3, marginBottom: 6 }}>
              Info Kontak
            </h3>
            {personal.email && (
              <p style={{ fontSize: "9pt", marginBottom: 3, wordBreak: "break-word" }}>
                <strong>Email:</strong><br />{personal.email}
              </p>
            )}
            {personal.phone && (
              <p style={{ fontSize: "9pt", marginBottom: 3 }}>
                <strong>Telepon:</strong><br />{personal.phone}
              </p>
            )}
            {personal.location && (
              <p style={{ fontSize: "9pt", marginBottom: 3 }}>
                <strong>Lokasi:</strong><br />{personal.location}
              </p>
            )}
            {personal.linkedin && (
              <p style={{ fontSize: "9pt", marginBottom: 3, wordBreak: "break-all" }}>
                <strong>LinkedIn:</strong><br />{personal.linkedin}
              </p>
            )}
            {personal.website && (
              <p style={{ fontSize: "9pt", marginBottom: 3, wordBreak: "break-all" }}>
                <strong>Website:</strong><br />{personal.website}
              </p>
            )}
          </div>
        );

      case "skills":
        if (skills.length > 0) {
          return (
            <div key="skills" style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: "10pt", fontWeight: 700, textTransform: "uppercase", color: "#1e40af", borderBottom: "1px solid #1e40af", paddingBottom: 3, marginBottom: 6 }}>
                Keahlian
              </h3>
              <p style={{ fontSize: "9pt", lineHeight: 1.6 }}>
                {skills.map((s) => s.name).join(", ")}
              </p>
            </div>
          );
        }
        return null;

      default:
        return null;
    }
  };

  const renderRightSection = (sectionId: string) => {
    switch (sectionId) {
      case "personal":
        if (personal.summary) {
          return (
            <Section key="summary" title="Ringkasan Profil">
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 1 }}>
                    <strong style={{ fontSize: "10.5pt" }}>{e.position}</strong>
                    <span style={{ fontSize: "8.5pt", color: "#666" }}>{e.startDate} – {e.current ? "Sekarang" : e.endDate}</span>
                  </div>
                  <div style={{ fontSize: "9.5pt", color: "#444", marginBottom: 2 }}>{e.company}{e.location ? ` • ${e.location}` : ""}</div>
                  <p style={{ fontSize: "9pt", whiteSpace: "pre-wrap", lineHeight: 1.5, color: "#333", margin: 0, textAlign: e.descriptionAlign || "left" }}>{e.description}</p>
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
                    <strong style={{ fontSize: "10pt" }}>{ed.degree}{ed.field ? `, ${ed.field}` : ""}</strong>
                    <span style={{ fontSize: "8.5pt", color: "#666" }}>{ed.startDate} – {ed.endDate}</span>
                  </div>
                  <div style={{ fontSize: "9pt", color: "#444" }}>{ed.school}</div>
                </div>
              ))}
            </Section>
          );
        }
        return null;

      case "extras":
        const extrasContent: React.ReactNode[] = [];
        if (languages.length > 0) {
          extrasContent.push(
            <p key="languages" style={{ fontSize: "9pt", marginBottom: 4 }}>
              <strong>Bahasa:</strong> {languages.map((l) => `${l.name} (${l.level})`).join(", ")}
            </p>
          );
        }
        if (certificates.length > 0) {
          extrasContent.push(
            <div key="certificates">
              <strong style={{ fontSize: "9pt" }}>Sertifikat:</strong>
              {certificates.map((c) => (
                <div key={c.id} style={{ fontSize: "9pt", marginLeft: 8 }}>{c.name} — {c.issuer}</div>
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
    <div style={{ display: "flex", gap: 12 }}>
      {/* Left Sidebar */}
      <div style={{ width: "85mm", flexShrink: 0 }}>
        {/* Header in sidebar */}
        {showHeader && hasPersonalContent && (
          <div style={{ marginBottom: 12 }}>
            <h1 style={{ fontSize: "16pt", fontWeight: 800, margin: 0, color: "#1e3a8a", lineHeight: 1.2 }}>
              {personal.fullName || "Nama Lengkap"}
            </h1>
            {personal.headline && (
              <p style={{ fontSize: "9pt", margin: "3px 0 0", color: "#3b82f6", fontWeight: 500 }}>
                {personal.headline}
              </p>
            )}
          </div>
        )}
        {leftSections.map((s) => renderLeftSection(s))}
      </div>

      {/* Right Main Content */}
      <div style={{ flex: 1 }}>
        {showHeader && <div style={{ height: 1, background: "#1e40af", marginBottom: 10 }} />}
        {rightSections.map((s) => renderRightSection(s))}
      </div>
    </div>
  );
}
