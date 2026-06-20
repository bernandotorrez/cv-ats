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

const DEFAULT_SECTION_ORDER = [
  { id: "personal", label: "Profil & Kontak" },
  { id: "education", label: "Pendidikan" },
  { id: "experience", label: "Pengalaman Kerja" },
  { id: "skills", label: "Keahlian" },
  { id: "languages", label: "Bahasa" },
] as const;

export function BaliTemplate({ data, showHeader = true, sectionOrder, language = "id" }: Props) {
  const { personal, experiences, educations, skills, languages, certificates } = data;
  const internships = data.internships || [];
  const organizations = data.organizations || [];
  const orderedSections = sectionOrder?.filter((s) => s.id !== "ats") || DEFAULT_SECTION_ORDER;

  const hasPersonalContent = personal.fullName || personal.headline;

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "personal":
        if (personal.summary) {
          return (
            <Section key="personal-summary" title={t(language, "profile")}>
              <p style={{ whiteSpace: "pre-wrap", textAlign: personal.summaryAlign || "left" }}>
                {personal.summary}
              </p>
            </Section>
          );
        }
        return null;

      case "experience":
        if (experiences.length > 0) {
          return (
            <Section key="experience" title={t(language, "workHistory")}>
              {experiences.map((e, idx) => (
                <div key={e.id} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 3,
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "10.5pt", color: "#1e293b" }}>{e.position}</strong>
                      <span style={{ fontSize: "10pt", color: "#64748b" }}> — {e.company}</span>
                    </div>
                    <span
                      style={{
                        fontSize: "9pt",
                        color: "#94a3b8",
                        whiteSpace: "nowrap",
                        marginLeft: 8,
                      }}
                    >
                      {e.startDate} – {e.current ? t(language, "current") : e.endDate}
                    </span>
                  </div>
                  {e.location && (
                    <div style={{ fontSize: "9pt", color: "#94a3b8", marginBottom: 3 }}>
                      {e.location}
                    </div>
                  )}
                  <p
                    style={{
                      fontSize: "9.5pt",
                      whiteSpace: "pre-wrap",
                      color: "#475569",
                      lineHeight: 1.6,
                      margin: 0,
                      textAlign: e.descriptionAlign || "left",
                    }}
                  >
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
            <Section key="education" title={t(language, "education")}>
              {educations.map((ed) => (
                <div key={ed.id} style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                    }}
                  >
                    <strong style={{ fontSize: "10.5pt", color: "#1e293b" }}>
                      {ed.degree}
                      {ed.field ? `, ${ed.field}` : ""}
                    </strong>
                    <span style={{ fontSize: "9pt", color: "#94a3b8" }}>
                      {ed.startDate} – {ed.endDate}
                    </span>
                  </div>
                  <div style={{ fontSize: "10pt", color: "#64748b" }}>{ed.school}</div>
                  {ed.description && (
                    <p
                      style={{
                        fontSize: "9pt",
                        color: "#94a3b8",
                        marginTop: 2,
                        textAlign: ed.descriptionAlign || "left",
                      }}
                    >
                      {ed.description}
                    </p>
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
            <Section key="skills" title={t(language, "skills")}>
              <p style={{ fontSize: "10pt", lineHeight: 1.8 }}>
                {skills.map((s, idx) => (
                  <span key={s.id}>
                    {s.name}
                    {idx < skills.length - 1 ? " • " : ""}
                  </span>
                ))}
              </p>
            </Section>
          );
        }
        return null;

      case "languages":
        if (languages.length > 0) {
          return (
            <Section key="languages" title={t(language, "languages")}>
              <div>
                <span style={{ fontSize: "9.5pt", color: "#64748b" }}>
                  {languages.map((l) => `${l.name} (${l.level})`).join(", ")}
                </span>
              </div>
            </Section>
          );
        }
        return null;

      case "certificate":
        if (certificates.length > 0) {
          return (
            <Section key="certificate" title={t(language, "certificates")}>
              {certificates.map((c) => (
                <div
                  key={c.id}
                  style={{ fontSize: "9.5pt", color: "#64748b", marginBottom: 4, marginLeft: 12 }}
                >
                  {c.name} — {c.issuer} ({c.date})
                </div>
              ))}
            </Section>
          );
        }
        return null;

      default:
        return null;

      case "internship":
        if (internships.length > 0) {
          return (
            <Section key="internship" title={t(language, "internship")}>
              {internships.map((item) => (
                <div key={item.id} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 3,
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "10.5pt", color: "#1e293b" }}>
                        {item.position}
                      </strong>
                      <span style={{ fontSize: "10pt", color: "#64748b" }}> — {item.company}</span>
                    </div>
                    <span
                      style={{
                        fontSize: "9pt",
                        color: "#94a3b8",
                        whiteSpace: "nowrap",
                        marginLeft: 8,
                      }}
                    >
                      {item.startDate} – {item.endDate}
                    </span>
                  </div>
                  {item.description && (
                    <p
                      style={{
                        fontSize: "9.5pt",
                        whiteSpace: "pre-wrap",
                        color: "#475569",
                        lineHeight: 1.6,
                        margin: 0,
                        textAlign: item.descriptionAlign || "left",
                      }}
                    >
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </Section>
          );
        }
        return null;

      case "organization":
        if (organizations.length > 0) {
          return (
            <Section key="organization" title={t(language, "organization")}>
              {organizations.map((item) => (
                <div key={item.id} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 3,
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "10.5pt", color: "#1e293b" }}>{item.role}</strong>
                      <span style={{ fontSize: "10pt", color: "#64748b" }}> — {item.name}</span>
                    </div>
                    <span
                      style={{
                        fontSize: "9pt",
                        color: "#94a3b8",
                        whiteSpace: "nowrap",
                        marginLeft: 8,
                      }}
                    >
                      {item.startDate} – {item.endDate}
                    </span>
                  </div>
                  {item.description && (
                    <p
                      style={{
                        fontSize: "9.5pt",
                        whiteSpace: "pre-wrap",
                        color: "#475569",
                        lineHeight: 1.6,
                        margin: 0,
                        textAlign: item.descriptionAlign || "left",
                      }}
                    >
                      {item.description}
                    </p>
                  )}
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
        <header style={{ marginBottom: 12 }}>
          {/* Accent color strip */}
          <div
            style={{ height: 4, backgroundColor: "#0891b2", marginBottom: 10, borderRadius: 2 }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
            {personal.photoUrl && (
              <img
                src={personal.photoUrl}
                alt="Profile"
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            )}
            <div>
              <h1
                style={{
                  fontSize: "22pt",
                  fontWeight: 700,
                  margin: 0,
                  color: "#0f172a",
                  letterSpacing: -0.5,
                  lineHeight: 1.1,
                }}
              >
                {personal.fullName || "Nama Lengkap"}
              </h1>

              {personal.headline && (
                <p
                  style={{
                    fontSize: "11pt",
                    margin: "4px 0 0 0",
                    color: "#0891b2",
                    fontWeight: 600,
                  }}
                >
                  {personal.headline}
                </p>
              )}

              {/* Contact info in a row */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "4px 16px",
                  fontSize: "9pt",
                  color: "#64748b",
                  marginTop: 4,
                }}
              >
                {personal.email && <span>{personal.email}</span>}
                {personal.phone && <span>{personal.phone}</span>}
                {personal.location && <span>{personal.location}</span>}
                {personal.linkedin && <span>LinkedIn: {personal.linkedin}</span>}
                {personal.website && <span>Web: {personal.website}</span>}
              </div>
            </div>
          </div>
        </header>
      )}

      {orderedSections.map((section) => renderSection(section.id))}
    </>
  );
}
