import type { CvData } from "@/lib/cv-types";
import { t, type CvUiLang } from "@/lib/cv-translations";
import type { SectionDef } from "../editor/SectionsNav";

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

export function UbudTemplate({ data, showHeader = true, sectionOrder, language = "id" }: Props) {
  const { personal, experiences, educations, skills, languages, certificates } = data;
  const internships = data.internships || [];
  const organizations = data.organizations || [];
  const orderedSections = sectionOrder?.filter((s) => s.id !== "ats") || DEFAULT_SECTION_ORDER;

  const hasPersonalContent = personal.fullName || personal.headline;

  // Sidebar Sections IDs
  const sidebarSectionIds = ["skills", "languages", "certificates"];
  // Main Content Section IDs
  const mainSectionIds = ["personal", "experience", "education", "internship", "organization"];

  // Heading style helper for Left Sidebar
  const renderSidebarHeading = (title: string) => (
    <h3
      style={{
        fontSize: "8.5pt",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "1.2px",
        color: "#c084fc", // Violet-400 (Highly visible on dark background)
        borderBottom: "1px solid #334155", // Slate-700
        paddingBottom: 4,
        marginBottom: 8,
        marginTop: 14,
      }}
    >
      {title}
    </h3>
  );

  // Heading style helper for Right Main Column
  const renderMainHeading = (title: string) => (
    <h2
      style={{
        fontSize: "11pt",
        fontWeight: 700,
        color: "#0f172a", // Slate-900
        textTransform: "uppercase",
        letterSpacing: "0.8px",
        borderLeft: "3.5px solid #8b5cf6", // Violet vertical bar
        paddingLeft: "8px",
        marginBottom: "10px",
        marginTop: "16px",
        lineHeight: 1.2,
      }}
    >
      {title}
    </h2>
  );

  const renderSidebarSection = (sectionId: string) => {
    switch (sectionId) {
      case "skills":
        if (skills.length > 0) {
          return (
            <div key="skills">
              {renderSidebarHeading(t(language, "skills"))}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
                {skills.map((s) => (
                  <span
                    key={s.id}
                    style={{
                      backgroundColor: "#1e293b", // Slate-800
                      color: "#f8fafc", // Slate-50
                      border: "1px solid #334155", // Slate-700
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontSize: "7.5pt",
                      fontWeight: 500,
                    }}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          );
        }
        return null;

      case "languages":
        if (languages.length > 0) {
          return (
            <div key="languages">
              {renderSidebarHeading(t(language, "languages"))}
              <div style={{ fontSize: "8pt", lineHeight: 1.5, color: "#cbd5e1" }}>
                {languages.map((l) => (
                  <div
                    key={l.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontWeight: 600, color: "#f8fafc" }}>{l.name}</span>
                    <span
                      style={{
                        fontSize: "7.5pt",
                        backgroundColor: "#4c1d95",
                        color: "#ddd6fe",
                        padding: "1px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {l.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return null;

      case "certificates":
        if (certificates.length > 0) {
          return (
            <div key="certificates">
              {renderSidebarHeading(t(language, "certificates"))}
              <div style={{ fontSize: "8pt", lineHeight: 1.4, color: "#cbd5e1" }}>
                {certificates.map((c) => (
                  <div key={c.id} style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, color: "#f8fafc" }}>{c.name}</div>
                    <div style={{ fontSize: "7.5pt", color: "#94a3b8" }}>
                      {c.issuer} • {c.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return null;

      default:
        return null;
    }
  };

  const renderMainSection = (sectionId: string) => {
    switch (sectionId) {
      case "personal":
        if (personal.summary) {
          return (
            <div key="summary">
              {renderMainHeading(t(language, "profileSummary"))}
              <p
                style={{
                  fontSize: "9.5pt",
                  lineHeight: 1.6,
                  color: "#334155",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  textAlign: personal.summaryAlign || "left",
                }}
              >
                {personal.summary}
              </p>
            </div>
          );
        }
        return null;

      case "experience":
        if (experiences.length > 0) {
          return (
            <div key="experience">
              {renderMainHeading(t(language, "workExperience"))}
              {experiences.map((e) => (
                <div key={e.id} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: 2,
                      gap: 16,
                    }}
                  >
                    <strong style={{ fontSize: "10pt", color: "#0f172a" }}>{e.position}</strong>
                    <span
                      style={{
                        fontSize: "8.5pt",
                        color: "#64748b",
                        fontWeight: 500,
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {e.startDate} – {e.current ? t(language, "current") : e.endDate}
                    </span>
                  </div>
                  <div
                    style={{ fontSize: "9pt", color: "#7c3aed", fontWeight: 600, marginBottom: 4 }}
                  >
                    {e.company}
                    {e.location ? ` • ${e.location}` : ""}
                  </div>
                  {e.description && (
                    <p
                      style={{
                        fontSize: "9pt",
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.5,
                        color: "#334155",
                        margin: 0,
                        textAlign: e.descriptionAlign || "left",
                      }}
                    >
                      {e.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          );
        }
        return null;

      case "education":
        if (educations.length > 0) {
          return (
            <div key="education">
              {renderMainHeading(t(language, "education"))}
              {educations.map((ed) => (
                <div key={ed.id} style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: 2,
                      gap: 16,
                    }}
                  >
                    <strong style={{ fontSize: "9.5pt", color: "#0f172a" }}>
                      {ed.degree}
                      {ed.field ? `, ${ed.field}` : ""}
                    </strong>
                    <span
                      style={{
                        fontSize: "8.5pt",
                        color: "#64748b",
                        fontWeight: 500,
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ed.startDate} – {ed.endDate}
                    </span>
                  </div>
                  <div
                    style={{ fontSize: "9pt", color: "#7c3aed", fontWeight: 600, marginBottom: 2 }}
                  >
                    {ed.school}
                  </div>
                  {ed.description && (
                    <p
                      style={{
                        fontSize: "8.5pt",
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.4,
                        color: "#475569",
                        margin: 0,
                        textAlign: ed.descriptionAlign || "left",
                      }}
                    >
                      {ed.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          );
        }
        return null;

      case "internship":
        if (internships.length > 0) {
          return (
            <div key="internship">
              {renderMainHeading(t(language, "internship"))}
              {internships.map((item) => (
                <div key={item.id} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: 2,
                      gap: 16,
                    }}
                  >
                    <strong style={{ fontSize: "10pt", color: "#0f172a" }}>{item.position}</strong>
                    <span
                      style={{
                        fontSize: "8.5pt",
                        color: "#64748b",
                        fontWeight: 500,
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.startDate} – {item.endDate}
                    </span>
                  </div>
                  <div
                    style={{ fontSize: "9pt", color: "#7c3aed", fontWeight: 600, marginBottom: 4 }}
                  >
                    {item.company}
                    {item.location ? ` • ${item.location}` : ""}
                  </div>
                  {item.description && (
                    <p
                      style={{
                        fontSize: "9pt",
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.5,
                        color: "#334155",
                        margin: 0,
                        textAlign: item.descriptionAlign || "left",
                      }}
                    >
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          );
        }
        return null;

      case "organization":
        if (organizations.length > 0) {
          return (
            <div key="organization">
              {renderMainHeading(t(language, "organization"))}
              {organizations.map((item) => (
                <div key={item.id} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: 2,
                      gap: 16,
                    }}
                  >
                    <strong style={{ fontSize: "10pt", color: "#0f172a" }}>{item.role}</strong>
                    <span
                      style={{
                        fontSize: "8.5pt",
                        color: "#64748b",
                        fontWeight: 500,
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.startDate} – {item.endDate}
                    </span>
                  </div>
                  <div
                    style={{ fontSize: "9pt", color: "#7c3aed", fontWeight: 600, marginBottom: 4 }}
                  >
                    {item.name}
                  </div>
                  {item.description && (
                    <p
                      style={{
                        fontSize: "9pt",
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.5,
                        color: "#334155",
                        margin: 0,
                        textAlign: item.descriptionAlign || "left",
                      }}
                    >
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          );
        }
        return null;

      default:
        return null;
    }
  };

  return (
    <div style={{ color: "#1e293b" }}>
      {/* ─── Header Block (Full Width) ─── */}
      {showHeader && hasPersonalContent && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: 14,
            borderBottom: "2px solid #f1f5f9",
            marginBottom: 14,
          }}
        >
          <div style={{ flex: 1, paddingRight: 16 }}>
            <h1
              style={{
                fontSize: "22pt",
                fontWeight: 800,
                margin: 0,
                color: "#0f172a", // Slate-900
                lineHeight: 1.1,
                letterSpacing: "-0.5px",
              }}
            >
              {personal.fullName || "Nama Lengkap"}
            </h1>
            {personal.headline && (
              <div style={{ marginTop: 6 }}>
                <span
                  style={{
                    backgroundColor: "#f5f3ff", // Violet-50
                    color: "#7c3aed", // Violet-600
                    padding: "3px 10px",
                    borderRadius: 20,
                    fontSize: "9pt",
                    fontWeight: 600,
                    display: "inline-block",
                  }}
                >
                  {personal.headline}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Columns (Sidebar Left, Content Right) ─── */}
      <div style={{ display: "flex", gap: 16 }}>
        {/* Left Column (Sidebar) */}
        <div
          style={{
            width: "60mm",
            flexShrink: 0,
            backgroundColor: "#0f172a", // Slate-900
            borderRadius: 6,
            padding: "14px",
            color: "#f8fafc",
            minHeight: "100%",
          }}
        >
          {/* Photo in Sidebar */}
          {showHeader && personal.photoUrl && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <img
                src={personal.photoUrl}
                alt="Profile"
                style={{
                  width: 135,
                  height: 135,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #8b5cf6",
                }}
              />
            </div>
          )}
          {/* Static Contact Section */}
          <div>
            {renderSidebarHeading(t(language, "contactInfo"))}
            <div style={{ fontSize: "8pt", color: "#cbd5e1", lineHeight: 1.45 }}>
              {personal.email && (
                <div style={{ marginBottom: 6, wordBreak: "break-all" }}>
                  <div style={{ fontWeight: 600, color: "#f8fafc" }}>{t(language, "email")}</div>
                  <div>{personal.email}</div>
                </div>
              )}
              {personal.phone && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, color: "#f8fafc" }}>{t(language, "phone")}</div>
                  <div>{personal.phone}</div>
                </div>
              )}
              {personal.location && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, color: "#f8fafc" }}>{t(language, "location")}</div>
                  <div>{personal.location}</div>
                </div>
              )}
              {personal.linkedin && (
                <div style={{ marginBottom: 6, wordBreak: "break-all" }}>
                  <div style={{ fontWeight: 600, color: "#f8fafc" }}>{t(language, "linkedin")}</div>
                  <div>{personal.linkedin}</div>
                </div>
              )}
              {personal.website && (
                <div style={{ marginBottom: 6, wordBreak: "break-all" }}>
                  <div style={{ fontWeight: 600, color: "#f8fafc" }}>{t(language, "website")}</div>
                  <div>{personal.website}</div>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Sidebar Sections */}
          {orderedSections
            .filter((s) => sidebarSectionIds.includes(s.id))
            .map((s) => renderSidebarSection(s.id))}
        </div>

        {/* Right Column (Main Content) */}
        <div style={{ flex: 1, paddingLeft: 4 }}>
          {orderedSections
            .filter((s) => mainSectionIds.includes(s.id))
            .map((s) => renderMainSection(s.id))}
        </div>
      </div>
    </div>
  );
}
