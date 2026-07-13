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

export function MalangTemplate({ data, showHeader = true, sectionOrder, language = "id" }: Props) {
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
        fontSize: "9.5pt",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.8px",
        color: "#1e3a8a", // Navy Blue (WCAG Compliant)
        borderBottom: "1px solid #e0f2fe",
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
        fontSize: "11.5pt",
        fontWeight: 700,
        color: "#1e3a8a", // Navy Blue
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        borderBottom: "2px solid #e0f2fe",
        paddingBottom: 4,
        marginBottom: 8,
        marginTop: 16,
        display: "flex",
        alignItems: "center",
      }}
    >
      <span
        style={{
          borderBottom: "2px solid #1e3a8a", // Navy Blue
          marginBottom: -6,
          paddingBottom: 4,
        }}
      >
        {title}
      </span>
    </h2>
  );

  const renderSidebarSection = (sectionId: string) => {
    switch (sectionId) {
      case "skills":
        if (skills.length > 0) {
          return (
            <div key="skills">
              {renderSidebarHeading(t(language, "skills"))}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                {skills.map((s) => (
                  <span
                    key={s.id}
                    style={{
                      backgroundColor: "#e0f2fe", // light sky blue
                      color: "#1e40af", // Navy-Blue-tint (WCAG Compliant 10.15:1)
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontSize: "8pt",
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
              <div style={{ fontSize: "8.5pt", lineHeight: 1.5, color: "#1e293b" }}>
                {languages.map((l) => (
                  <div key={l.id} style={{ marginBottom: 4 }}>
                    <strong style={{ color: "#0f172a" }}>{l.name}</strong>
                    <span style={{ color: "#64748b", marginLeft: 4 }}>({l.level})</span>
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
              <div style={{ fontSize: "8.5pt", lineHeight: 1.4, color: "#1e293b" }}>
                {certificates.map((c) => (
                  <div key={c.id} style={{ marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, color: "#0f172a" }}>{c.name}</div>
                    <div style={{ fontSize: "7.5pt", color: "#64748b" }}>
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
                    style={{ fontSize: "9pt", color: "#1e40af", fontWeight: 600, marginBottom: 4 }}
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
                    style={{ fontSize: "9pt", color: "#1e40af", fontWeight: 600, marginBottom: 2 }}
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
                    style={{ fontSize: "9pt", color: "#1e40af", fontWeight: 600, marginBottom: 4 }}
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
                    style={{ fontSize: "9pt", color: "#1e40af", fontWeight: 600, marginBottom: 4 }}
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
            paddingBottom: 12,
            borderBottom: "2px solid #f1f5f9",
            marginBottom: 12,
          }}
        >
          <div style={{ flex: 1, paddingRight: 16 }}>
            <h1
              style={{
                fontSize: "22pt",
                fontWeight: 800,
                margin: 0,
                color: "#1e3a8a", // Navy Blue
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
                    backgroundColor: "#e0f2fe", // sky-100
                    color: "#1e40af", // Navy-Blue-tint (WCAG Compliant 10.15:1)
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
            width: "65mm",
            flexShrink: 0,
            backgroundColor: "#f0f9ff", // soft light ice-blue background
            borderRadius: 8,
            padding: "12px",
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
                  border: "2px solid #e0f2fe",
                }}
              />
            </div>
          )}
          {/* Static Contact Section */}
          <div>
            {renderSidebarHeading(t(language, "contactInfo"))}
            <div style={{ fontSize: "8.5pt", color: "#334155", lineHeight: 1.4 }}>
              {personal.email && (
                <div style={{ marginBottom: 6, wordBreak: "break-all" }}>
                  <div style={{ fontWeight: 600, color: "#0f172a" }}>{t(language, "email")}</div>
                  <div>{personal.email}</div>
                </div>
              )}
              {personal.phone && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, color: "#0f172a" }}>{t(language, "phone")}</div>
                  <div>{personal.phone}</div>
                </div>
              )}
              {personal.location && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, color: "#0f172a" }}>{t(language, "location")}</div>
                  <div>{personal.location}</div>
                </div>
              )}
              {personal.linkedin && (
                <div style={{ marginBottom: 6, wordBreak: "break-all" }}>
                  <div style={{ fontWeight: 600, color: "#0f172a" }}>{t(language, "linkedin")}</div>
                  <div>{personal.linkedin}</div>
                </div>
              )}
              {personal.website && (
                <div style={{ marginBottom: 6, wordBreak: "break-all" }}>
                  <div style={{ fontWeight: 600, color: "#0f172a" }}>{t(language, "website")}</div>
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
        <div style={{ flex: 1 }}>
          {orderedSections
            .filter((s) => mainSectionIds.includes(s.id))
            .map((s) => renderMainSection(s.id))}
        </div>
      </div>
    </div>
  );
}
