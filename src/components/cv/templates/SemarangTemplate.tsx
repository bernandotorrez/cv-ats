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

export function SemarangTemplate({ data, showHeader = true, sectionOrder }: Props) {
  const { personal, experiences, educations, skills, languages, certificates } = data;
  const orderedSections = sectionOrder?.filter(s => s.id !== "ats") || DEFAULT_SECTION_ORDER;

  const hasPersonalContent = personal.fullName || personal.headline;

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "personal":
        if (personal.summary) {
          return (
            <Section key="personal-summary" title="Tentang Saya">
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
                <div key={e.id} style={{ marginBottom: 10, paddingLeft: 8, borderLeft: "2px solid #059669" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                    <strong style={{ fontSize: "10.5pt", color: "#059669" }}>{e.position}</strong>
                    <span style={{ fontSize: "9pt", color: "#666" }}>{e.startDate} – {e.current ? "Sekarang" : e.endDate}</span>
                  </div>
                  <div style={{ fontSize: "10pt", color: "#333", fontWeight: 500, marginBottom: 2 }}>{e.company}</div>
                  {e.location && <div style={{ fontSize: "9pt", color: "#888", marginBottom: 3 }}>{e.location}</div>}
                  <p style={{ fontSize: "9.5pt", whiteSpace: "pre-wrap", color: "#444", lineHeight: 1.5, margin: 0, textAlign: e.descriptionAlign || "left" }}>{e.description}</p>
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
                    <strong style={{ fontSize: "10.5pt" }}>{ed.degree}{ed.field ? `, ${ed.field}` : ""}</strong>
                    <span style={{ fontSize: "9pt", color: "#666" }}>{ed.startDate} – {ed.endDate}</span>
                  </div>
                  <div style={{ fontSize: "10pt", color: "#444" }}>{ed.school}</div>
                  {ed.description && <p style={{ fontSize: "9pt", color: "#666", marginTop: 2, fontStyle: "italic", textAlign: ed.descriptionAlign || "left" }}>{ed.description}</p>}
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
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {skills.map((s) => (
                  <span
                    key={s.id}
                    style={{
                      background: "#ecfdf5",
                      color: "#059669",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: "9pt",
                      fontWeight: 500,
                    }}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </Section>
          );
        }
        return null;

      case "extras":
        const extrasContent: React.ReactNode[] = [];
        if (languages.length > 0) {
          extrasContent.push(
            <p key="languages" style={{ marginBottom: languages.length > 0 && certificates.length > 0 ? 6 : 0 }}>
              <strong>Bahasa:</strong> {languages.map((l) => `${l.name} (${l.level})`).join(", ")}
            </p>
          );
        }
        if (certificates.length > 0) {
          extrasContent.push(
            <div key="certificates">
              <strong>Sertifikat:</strong>
              {certificates.map((c) => (
                <div key={c.id} style={{ marginLeft: 8, marginTop: 2 }}>
                  <span style={{ fontWeight: 500 }}>{c.name}</span>
                  <span style={{ color: "#666" }}> — {c.issuer} ({c.date})</span>
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
        <header
          style={{
            textAlign: "center",
            marginBottom: 12,
            padding: "12px 0",
            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
            marginLeft: -16,
            marginRight: -16,
            paddingLeft: 16,
            paddingRight: 16,
          }}
        >
          <h1 style={{ fontSize: "20pt", fontWeight: 800, margin: 0, color: "#fff" }}>
            {personal.fullName || "Nama Lengkap"}
          </h1>
          {personal.headline && (
            <p style={{ fontSize: "10.5pt", margin: "4px 0 0", color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>
              {personal.headline}
            </p>
          )}
          <p style={{ fontSize: "9pt", color: "rgba(255,255,255,0.8)", margin: "6px 0 0" }}>
            {[personal.email, personal.phone, personal.location].filter(Boolean).join(" • ")}
          </p>
          {(personal.linkedin || personal.website) && (
            <p style={{ fontSize: "8.5pt", color: "rgba(255,255,255,0.7)", margin: "2px 0 0" }}>
              {[personal.linkedin, personal.website].filter(Boolean).join(" • ")}
            </p>
          )}
        </header>
      )}

      {orderedSections.map((section) => renderSection(section.id))}
    </>
  );
}
