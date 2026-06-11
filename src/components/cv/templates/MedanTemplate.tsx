import type { CvData } from "@/lib/cv-types";
import { t, type CvUiLang } from "@/lib/cv-translations";
import type { SectionDef } from "../editor/SectionsNav";
import { Section } from "./Section";

interface Props {
  data: CvData;
  showHeader?: boolean;
  sectionOrder?: SectionDef[];
  language?: CvUiLang;
}

// Default section order
const DEFAULT_SECTION_ORDER = [
  { id: "personal", label: "Profil & Kontak" },
  { id: "education", label: "Pendidikan" },
  { id: "experience", label: "Pengalaman Kerja" },
  { id: "skills", label: "Keahlian" },
  { id: "extras", label: "Bahasa & Sertifikat" },
] as const;

export function MedanTemplate({ data, showHeader = true, sectionOrder, language = "id" }: Props) {
  const { personal, experiences, educations, skills, languages, certificates } = data;
  const internships = data.internships || [];
  const organizations = data.organizations || [];
  const orderedSections = sectionOrder?.filter(s => s.id !== "ats") || DEFAULT_SECTION_ORDER;

  const hasPersonalContent = personal.fullName || personal.headline || personal.email || personal.phone || personal.location;

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "personal":
        if (personal.summary) {
          return (
            <Section key="personal-summary" title={t(language, 'profileSummary')}>
              <p style={{ whiteSpace: "pre-wrap", textAlign: personal.summaryAlign || "left" }}>{personal.summary}</p>
            </Section>
          );
        }
        return null;

      case "experience":
        if (experiences.length > 0) {
          return (
            <Section key="experience" title={t(language, 'workExperience')}>
              {experiences.map((e) => (
                <div key={e.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                    <strong style={{ fontSize: "10.5pt" }}>{e.position}</strong>
                    <span style={{ fontSize: "9pt", color: "#666" }}>{e.startDate} – {e.current ? t(language, 'current') : e.endDate}</span>
                  </div>
                  <div style={{ fontSize: "10pt", color: "#444", marginBottom: 3 }}>{e.company}{e.location ? ` • ${e.location}` : ""}</div>
                  <p style={{ fontSize: "9.5pt", whiteSpace: "pre-wrap", color: "#333", margin: 0, textAlign: e.descriptionAlign || "left" }}>{e.description}</p>
                </div>
              ))}
            </Section>
          );
        }
        return null;

      case "education":
        if (educations.length > 0) {
          return (
            <Section key="education" title={t(language, 'education')}>
              {educations.map((ed) => (
                <div key={ed.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <strong style={{ fontSize: "10.5pt" }}>{ed.degree}{ed.field ? `, ${ed.field}` : ""}</strong>
                    <span style={{ fontSize: "9pt", color: "#666" }}>{ed.startDate} – {ed.endDate}</span>
                  </div>
                  <div style={{ fontSize: "10pt", color: "#444" }}>{ed.school}</div>
                  {ed.description && <p style={{ fontSize: "9.5pt", color: "#555", marginTop: 2, textAlign: ed.descriptionAlign || "left" }}>{ed.description}</p>}
                </div>
              ))}
            </Section>
          );
        }
        return null;

      case "skills":
        if (skills.length > 0) {
          return (
            <Section key="skills" title={t(language, 'skills')}>
              <p style={{ fontSize: "10pt" }}>{skills.map((s) => s.name).join(" • ")}</p>
            </Section>
          );
        }
        return null;

      case "extras":
        const extrasContent: React.ReactNode[] = [];
        if (languages.length > 0) {
          extrasContent.push(
            <p key="languages" style={{ marginBottom: languages.length > 0 && certificates.length > 0 ? 4 : 0 }}>
              <strong>{t(language, 'languages')}:</strong> {languages.map((l) => `${l.name} (${l.level})`).join(" • ")}
            </p>
          );
        }
        if (certificates.length > 0) {
          extrasContent.push(
            <div key="certificates" style={{ marginBottom: 4 }}>
              <strong>{t(language, 'certificates')}:</strong>
              {certificates.map((c) => (
                <div key={c.id} style={{ marginLeft: 8 }}>{c.name} — {c.issuer} <span style={{ color: "#555" }}>({c.date})</span></div>
              ))}
            </div>
          );
        }
        if (extrasContent.length > 0) {
          return (
            <Section key="extras" title={t(language, 'languagesAndCertificates')}>
              {extrasContent}
            </Section>
          );
        }
        return null;

      default:
        return null;

      case "internship":
        if (internships.length > 0) {
          return (
            <Section key="internship" title={t(language, 'internship')}>
              {internships.map((item) => (
                <div key={item.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                    <strong style={{ fontSize: "10.5pt" }}>{item.position}</strong>
                    <span style={{ fontSize: "9pt", color: "#666" }}>{item.startDate} – {item.endDate}</span>
                  </div>
                  <div style={{ fontSize: "10pt", color: "#444", marginBottom: 3 }}>{item.company}</div>
                  {item.description && <p style={{ fontSize: "9.5pt", whiteSpace: "pre-wrap", color: "#333", margin: 0, textAlign: item.descriptionAlign || "left" }}>{item.description}</p>}
                </div>
              ))}
            </Section>
          );
        }
        return null;

      case "organization":
        if (organizations.length > 0) {
          return (
            <Section key="organization" title={t(language, 'organization')}>
              {organizations.map((item) => (
                <div key={item.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                    <strong style={{ fontSize: "10.5pt" }}>{item.role}</strong>
                    <span style={{ fontSize: "9pt", color: "#666" }}>{item.startDate} – {item.endDate}</span>
                  </div>
                  <div style={{ fontSize: "10pt", color: "#444", marginBottom: 3 }}>{item.name}</div>
                  {item.description && <p style={{ fontSize: "9.5pt", whiteSpace: "pre-wrap", color: "#333", margin: 0, textAlign: item.descriptionAlign || "left" }}>{item.description}</p>}
                </div>
              ))}
            </Section>
          );
        }
        return null;
    }
  };

  return (
    <>
      {showHeader && hasPersonalContent && (
        <header style={{ textAlign: "center", marginBottom: 12, paddingBottom: 10, borderBottom: "2px solid #1a365d" }}>
          <h1 style={{ fontSize: "18pt", fontWeight: 800, margin: 0, color: "#1a365d", letterSpacing: 0.5 }}>
            {personal.fullName || "Nama Lengkap"}
          </h1>
          {personal.headline && (
            <p style={{ fontSize: "10pt", margin: "3px 0", color: "#2d3748", fontWeight: 500 }}>
              {personal.headline}
            </p>
          )}
          <p style={{ fontSize: "9pt", color: "#4a5568", margin: "3px 0" }}>
            {[personal.email, personal.phone, personal.location].filter(Boolean).join(" • ")}
          </p>
          {personal.linkedin || personal.website ? (
            <p style={{ fontSize: "8.5pt", color: "#718096", margin: "2px 0" }}>
              {[personal.linkedin, personal.website].filter(Boolean).join(" • ")}
            </p>
          ) : null}
        </header>
      )}

      {orderedSections.map((section) => renderSection(section.id))}
    </>
  );
}
