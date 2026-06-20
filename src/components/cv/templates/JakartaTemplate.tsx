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

// Default section order (excluding 'ats' which is not a visual section)
const DEFAULT_SECTION_ORDER = [
  { id: "personal", label: "Profil & Kontak" },
  { id: "education", label: "Pendidikan" },
  { id: "experience", label: "Pengalaman Kerja" },
  { id: "skills", label: "Keahlian" },
  { id: "languages", label: "Bahasa" },
] as const;

export function JakartaTemplate({ data, showHeader = true, sectionOrder, language = "id" }: Props) {
  const { personal, experiences, educations, skills, languages, certificates } = data;
  const internships = data.internships || [];
  const organizations = data.organizations || [];

  // Use provided section order or default
  const orderedSections = sectionOrder?.filter((s) => s.id !== "ats") || DEFAULT_SECTION_ORDER;

  // Check if personal section has content to show
  const hasPersonalContent =
    personal.fullName ||
    personal.headline ||
    personal.email ||
    personal.phone ||
    personal.location ||
    personal.linkedin ||
    personal.website ||
    personal.summary;

  // Render section based on id
  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "personal":
        // Personal section renders the summary (header is handled separately)
        if (personal.summary) {
          return (
            <Section key="personal-summary" title={t(language, "profileSummary")}>
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
            <Section key="experience" title={t(language, "workExperience")}>
              {experiences.map((e) => (
                <div key={e.id} style={{ marginBottom: 10 }}>
                  <div
                    style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}
                  >
                    <span>
                      {e.position} — {e.company}
                    </span>
                    <span style={{ fontWeight: 500, fontSize: "9.5pt" }}>
                      {e.startDate} – {e.current ? t(language, "current") : e.endDate}
                    </span>
                  </div>
                  {e.location && (
                    <div style={{ fontSize: "9.5pt", color: "#555" }}>{e.location}</div>
                  )}
                  <p
                    style={{
                      whiteSpace: "pre-wrap",
                      marginTop: 4,
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
                    style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}
                  >
                    <span>
                      {ed.degree}
                      {ed.field ? `, ${ed.field}` : ""}
                    </span>
                    <span style={{ fontWeight: 500, fontSize: "9.5pt" }}>
                      {ed.startDate} – {ed.endDate}
                    </span>
                  </div>
                  <div style={{ fontSize: "10pt" }}>{ed.school}</div>
                  {ed.description && (
                    <p style={{ marginTop: 2, textAlign: ed.descriptionAlign || "left" }}>
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
              <p>{skills.map((s) => s.name).join(" • ")}</p>
            </Section>
          );
        }
        return null;

      case "languages":
        if (languages.length > 0) {
          return (
            <Section key="languages" title={t(language, "languages")}>
              <p>{languages.map((l) => `${l.name} (${l.level})`).join(" • ")}</p>
            </Section>
          );
        }
        return null;

      case "certificate":
        if (certificates.length > 0) {
          return (
            <Section key="certificate" title={t(language, "certificates")}>
              {certificates.map((c) => (
                <div key={c.id} style={{ marginBottom: 4 }}>
                  {c.name} — {c.issuer} <span style={{ color: "#555" }}>({c.date})</span>
                </div>
              ))}
            </Section>
          );
        }
        return null;

      case "internship":
        if (internships.length > 0) {
          return (
            <Section key="internship" title={t(language, "internship")}>
              {internships.map((item) => (
                <div key={item.id} style={{ marginBottom: 10 }}>
                  <div
                    style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}
                  >
                    <span>
                      {item.position} — {item.company}
                    </span>
                    <span style={{ fontWeight: 500, fontSize: "9.5pt" }}>
                      {item.startDate} – {item.endDate}
                    </span>
                  </div>
                  {item.description && (
                    <p
                      style={{
                        whiteSpace: "pre-wrap",
                        marginTop: 4,
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
                <div key={item.id} style={{ marginBottom: 10 }}>
                  <div
                    style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}
                  >
                    <span>
                      {item.role} — {item.name}
                    </span>
                    <span style={{ fontWeight: 500, fontSize: "9.5pt" }}>
                      {item.startDate} – {item.endDate}
                    </span>
                  </div>
                  {item.description && (
                    <p
                      style={{
                        whiteSpace: "pre-wrap",
                        marginTop: 4,
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

      default:
        return null;
    }
  };

  return (
    <>
      {showHeader && hasPersonalContent && (
        <header style={{ textAlign: personal.photoUrl ? "left" : "center", marginBottom: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: personal.photoUrl ? "flex-start" : "center",
              gap: 15,
              marginBottom: 4,
            }}
          >
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
            <div style={{ textAlign: personal.photoUrl ? "left" : "center" }}>
              <h1 style={{ fontSize: "20pt", fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
                {personal.fullName || "Nama Lengkap"}
              </h1>
              {personal.headline && (
                <p style={{ fontSize: "11pt", margin: "2px 0 0 0", color: "#444" }}>
                  {personal.headline}
                </p>
              )}
              <div style={{ fontSize: "9.5pt", color: "#444", marginTop: 4 }}>
                <p style={{ margin: 0 }}>
                  {[personal.email, personal.phone, personal.location].filter(Boolean).join(" • ")}
                </p>
                {(personal.linkedin || personal.website) && (
                  <p style={{ margin: "2px 0 0 0" }}>
                    {[personal.linkedin, personal.website].filter(Boolean).join(" • ")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Render sections based on order */}
      {orderedSections.map((section) => renderSection(section.id))}
    </>
  );
}
