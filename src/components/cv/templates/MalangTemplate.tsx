import type { CvData } from "@/lib/cv-types";
import { t, type CvUiLang } from "@/lib/cv-translations";
import type { SectionDef } from "../editor/SectionsNav";

interface Props {
  data: CvData;
  showHeader?: boolean;
  sectionOrder?: SectionDef[];
  language?: CvUiLang;
}

// ─── Design Tokens ──────────────────────────────────────────────
const NAVY = "#1a2744";
const NAVY_LIGHT = "#243354";
const GOLD = "#d4943a";
const GOLD_LIGHT = "#e8b56a";
const WHITE = "#ffffff";
const DARK_TEXT = "#2d3748";
const MUTED_TEXT = "#4a5568";
const LIGHT_MUTED = "#718096";

const DEFAULT_SECTION_ORDER = [
  { id: "personal", label: "Profil & Kontak" },
  { id: "experience", label: "Pengalaman Kerja" },
  { id: "education", label: "Pendidikan" },
  { id: "skills", label: "Keahlian" },
  { id: "languages", label: "Bahasa" },
  { id: "certificate", label: "Sertifikat" },
  { id: "internship", label: "Magang" },
  { id: "organization", label: "Organisasi" },
] as const;

// Section icons (unicode)
const ICONS = {
  contact: "\u260E",       // telephone
  profile: "\u25C9",       // circled dot
  experience: "\u2699",    // gear
  education: "\u{1F393}",  // graduation cap
  skills: "\u{1F4A1}",     // lightbulb
  languages: "\u{1F310}",  // globe
  certificates: "\u2605",  // star
  internship: "\u{1F4BC}", // briefcase
  organization: "\u2691",  // flag
} as const;

function getProficiencyPercent(level?: string): number {
  if (!level) return 75;
  const lower = level.toLowerCase();
  if (lower === "native" || lower === "expert" || lower === "fluent") return 95;
  if (lower === "advanced" || lower === "professional" || lower === "business") return 85;
  if (lower === "intermediate" || lower === "conversational") return 65;
  if (lower === "beginner" || lower === "basic" || lower === "elementary") return 40;
  return 75;
}

function getSkillPercent(level?: string): number {
  if (!level) return 78;
  const lower = level.toLowerCase();
  if (lower === "expert") return 95;
  if (lower === "advanced") return 85;
  if (lower === "intermediate") return 70;
  if (lower === "beginner") return 45;
  return 78;
}

// ─── Circular Progress Ring ─────────────────────────────────────
function ProgressRing({ percent, size = 56 }: { percent: number; size?: number }) {
  const ringSize = size;
  const borderW = 5;
  const innerSize = ringSize - borderW * 2;

  return (
    <div
      style={{
        width: ringSize,
        height: ringSize,
        borderRadius: "50%",
        background: `conic-gradient(${GOLD} 0% ${percent}%, ${NAVY_LIGHT} ${percent}% 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: "50%",
          background: NAVY,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11pt",
          fontWeight: 700,
          color: GOLD,
        }}
      >
        {percent}%
      </div>
    </div>
  );
}

// ─── Language Bar ────────────────────────────────────────────────
function LangBar({ percent }: { percent: number }) {
  return (
    <div
      style={{
        height: 6,
        borderRadius: 3,
        background: "#e2e8f0",
        overflow: "hidden",
        marginTop: 3,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${percent}%`,
          borderRadius: 3,
          background: GOLD,
        }}
      />
    </div>
  );
}

// ─── Section Header (Sidebar) ────────────────────────────────────
function SidebarHeading({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: "9.5pt",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 1.5,
        color: GOLD,
        marginBottom: 8,
        marginTop: 0,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span style={{ fontSize: "10pt" }}>{icon}</span>
      {children}
    </h3>
  );
}

// ─── Section Header (Main) ───────────────────────────────────────
function MainHeading({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "11pt",
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: 1.2,
        color: GOLD,
        marginBottom: 10,
        marginTop: 0,
        display: "flex",
        alignItems: "center",
        gap: 8,
        borderBottom: `2px solid ${GOLD}30`,
        paddingBottom: 6,
      }}
    >
      <span style={{ fontSize: "12pt" }}>{icon}</span>
      {children}
    </h2>
  );
}

// ─── Main Template ───────────────────────────────────────────────
export function MalangTemplate({ data, showHeader = true, sectionOrder, language = "id" }: Props) {
  const { personal, experiences, educations, skills, languages: langs, certificates } = data;
  const internships = data.internships || [];
  const organizations = data.organizations || [];
  const orderedSections = sectionOrder?.filter((s) => s.id !== "ats") || DEFAULT_SECTION_ORDER;

  const hasPersonalContent = personal.fullName || personal.headline;

  // Sidebar: contact, skills, languages
  // Main: personal summary, experience, education, certificates, internship, organization
  const mainSectionIds = orderedSections
    .map((s) => s.id)
    .filter((id) => !["skills", "languages"].includes(id) && id !== "personal");

  // ─── Render Main Section ────────────────────────────────────
  const renderMainSection = (sectionId: string) => {
    switch (sectionId) {
      case "personal":
        if (personal.summary) {
          return (
            <div key="personal-summary" style={{ marginBottom: 16 }}>
              <MainHeading icon={ICONS.profile}>{t(language, "profile")}</MainHeading>
              <p
                style={{
                  fontSize: "9.5pt",
                  lineHeight: 1.7,
                  color: MUTED_TEXT,
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
            <div key="experience" style={{ marginBottom: 16 }}>
              <MainHeading icon={ICONS.experience}>{t(language, "workExperience")}</MainHeading>
              {experiences.map((e) => (
                <div key={e.id} style={{ marginBottom: 12, display: "flex", gap: 10 }}>
                  <div
                    style={{
                      width: 60,
                      flexShrink: 0,
                      fontSize: "8pt",
                      fontWeight: 700,
                      color: DARK_TEXT,
                      paddingTop: 2,
                    }}
                  >
                    {e.startDate}
                    <br />–{" "}
                    {e.current ? t(language, "current") : e.endDate}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: "10pt", color: DARK_TEXT }}>
                      {e.position}
                    </strong>
                    <div
                      style={{
                        fontSize: "9pt",
                        color: LIGHT_MUTED,
                        fontStyle: "italic",
                        marginBottom: 3,
                      }}
                    >
                      {e.company}
                      {e.location ? ` \u2022 ${e.location}` : ""}
                    </div>
                    <p
                      style={{
                        fontSize: "9pt",
                        whiteSpace: "pre-wrap",
                        color: MUTED_TEXT,
                        lineHeight: 1.6,
                        margin: 0,
                        textAlign: e.descriptionAlign || "left",
                      }}
                    >
                      {e.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          );
        }
        return null;

      case "education":
        if (educations.length > 0) {
          return (
            <div key="education" style={{ marginBottom: 16 }}>
              <MainHeading icon={ICONS.education}>{t(language, "education")}</MainHeading>
              {educations.map((ed) => (
                <div key={ed.id} style={{ marginBottom: 10, display: "flex", gap: 10 }}>
                  <div
                    style={{
                      width: 60,
                      flexShrink: 0,
                      fontSize: "8pt",
                      fontWeight: 700,
                      color: DARK_TEXT,
                      paddingTop: 2,
                    }}
                  >
                    {ed.startDate}
                    <br />– {ed.endDate}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: "10pt", color: DARK_TEXT }}>
                      {ed.degree}
                      {ed.field ? `, ${ed.field}` : ""}
                    </strong>
                    <div
                      style={{
                        fontSize: "9pt",
                        color: LIGHT_MUTED,
                        fontStyle: "italic",
                        marginBottom: 2,
                      }}
                    >
                      {ed.school}
                    </div>
                    {ed.description && (
                      <p
                        style={{
                          fontSize: "8.5pt",
                          color: MUTED_TEXT,
                          margin: 0,
                          textAlign: ed.descriptionAlign || "left",
                        }}
                      >
                        {ed.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        }
        return null;

      case "certificate":
        if (certificates.length > 0) {
          return (
            <div key="certificate" style={{ marginBottom: 16 }}>
              <MainHeading icon={ICONS.certificates}>{t(language, "certificates")}</MainHeading>
              {certificates.map((c) => (
                <div
                  key={c.id}
                  style={{
                    fontSize: "9pt",
                    color: MUTED_TEXT,
                    marginBottom: 5,
                    paddingLeft: 10,
                    borderLeft: `3px solid ${GOLD}`,
                  }}
                >
                  <strong style={{ color: DARK_TEXT }}>{c.name}</strong> — {c.issuer} ({c.date})
                </div>
              ))}
            </div>
          );
        }
        return null;

      case "internship":
        if (internships.length > 0) {
          return (
            <div key="internship" style={{ marginBottom: 16 }}>
              <MainHeading icon={ICONS.internship}>{t(language, "internship")}</MainHeading>
              {internships.map((item) => (
                <div key={item.id} style={{ marginBottom: 10, display: "flex", gap: 10 }}>
                  <div
                    style={{
                      width: 60,
                      flexShrink: 0,
                      fontSize: "8pt",
                      fontWeight: 700,
                      color: DARK_TEXT,
                      paddingTop: 2,
                    }}
                  >
                    {item.startDate}
                    <br />– {item.endDate}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: "10pt", color: DARK_TEXT }}>{item.position}</strong>
                    <div style={{ fontSize: "9pt", color: LIGHT_MUTED, fontStyle: "italic", marginBottom: 3 }}>
                      {item.company}
                      {item.location ? ` \u2022 ${item.location}` : ""}
                    </div>
                    {item.description && (
                      <p
                        style={{
                          fontSize: "9pt",
                          whiteSpace: "pre-wrap",
                          color: MUTED_TEXT,
                          lineHeight: 1.6,
                          margin: 0,
                          textAlign: item.descriptionAlign || "left",
                        }}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        }
        return null;

      case "organization":
        if (organizations.length > 0) {
          return (
            <div key="organization" style={{ marginBottom: 16 }}>
              <MainHeading icon={ICONS.organization}>{t(language, "organization")}</MainHeading>
              {organizations.map((item) => (
                <div key={item.id} style={{ marginBottom: 10, display: "flex", gap: 10 }}>
                  <div
                    style={{
                      width: 60,
                      flexShrink: 0,
                      fontSize: "8pt",
                      fontWeight: 700,
                      color: DARK_TEXT,
                      paddingTop: 2,
                    }}
                  >
                    {item.startDate}
                    <br />– {item.endDate}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: "10pt", color: DARK_TEXT }}>{item.role}</strong>
                    <div style={{ fontSize: "9pt", color: LIGHT_MUTED, fontStyle: "italic", marginBottom: 3 }}>
                      {item.name}
                    </div>
                    {item.description && (
                      <p
                        style={{
                          fontSize: "9pt",
                          whiteSpace: "pre-wrap",
                          color: MUTED_TEXT,
                          lineHeight: 1.6,
                          margin: 0,
                          textAlign: item.descriptionAlign || "left",
                        }}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>
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
    <div style={{ display: "flex", gap: 0, minHeight: 300 }}>
      {/* ─── Left Sidebar (Navy) ────────────────────────────────── */}
      <div
        style={{
          width: "72mm",
          flexShrink: 0,
          background: NAVY,
          padding: "0",
          color: WHITE,
          overflow: "hidden",
        }}
      >
        {/* Profile Photo Area with decorative gold shape */}
        {showHeader && hasPersonalContent && (
          <div style={{ position: "relative", textAlign: "center", paddingTop: 20, paddingBottom: 12 }}>
            {/* Decorative gold organic shape behind photo */}
            <div
              style={{
                position: "absolute",
                top: 10,
                left: "50%",
                transform: "translateX(-50%)",
                width: 100,
                height: 100,
                borderRadius: "50% 50% 45% 55% / 55% 45% 55% 45%",
                background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
                zIndex: 0,
              }}
            />
            {/* Profile circle (initials or placeholder) */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: NAVY_LIGHT,
                border: `3px solid ${WHITE}`,
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20pt",
                fontWeight: 700,
                color: GOLD,
              }}
            >
              {personal.fullName
                ? personal.fullName
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                : ""}
            </div>

            {/* Name */}
            <h1
              style={{
                fontSize: "16pt",
                fontWeight: 800,
                margin: "12px 0 0",
                color: GOLD,
                textTransform: "uppercase",
                letterSpacing: 1,
                lineHeight: 1.2,
                position: "relative",
                zIndex: 1,
              }}
            >
              {personal.fullName || "Nama Lengkap"}
            </h1>
            {personal.headline && (
              <p
                style={{
                  fontSize: "8pt",
                  margin: "4px 12px 0",
                  color: WHITE,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  fontWeight: 500,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {personal.headline}
              </p>
            )}
          </div>
        )}

        {/* Sidebar Content */}
        <div style={{ padding: "8px 14px 14px" }}>
          {/* Contact Info */}
          {showHeader && (
            <div style={{ marginBottom: 14 }}>
              <SidebarHeading icon={ICONS.contact}>
                {t(language, "contactInfo")}
              </SidebarHeading>
              {personal.email && (
                <div style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "flex-start" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: GOLD,
                      color: NAVY,
                      fontSize: "8pt",
                      flexShrink: 0,
                      fontWeight: 700,
                    }}
                  >
                    \u2709
                  </span>
                  <span style={{ fontSize: "8pt", wordBreak: "break-word", lineHeight: 1.5 }}>
                    {personal.email}
                  </span>
                </div>
              )}
              {personal.phone && (
                <div style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "flex-start" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: GOLD,
                      color: NAVY,
                      fontSize: "8pt",
                      flexShrink: 0,
                      fontWeight: 700,
                    }}
                  >
                    \u260E
                  </span>
                  <span style={{ fontSize: "8pt", lineHeight: 1.5 }}>{personal.phone}</span>
                </div>
              )}
              {personal.location && (
                <div style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "flex-start" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: GOLD,
                      color: NAVY,
                      fontSize: "8pt",
                      flexShrink: 0,
                      fontWeight: 700,
                    }}
                  >
                    \u25CB
                  </span>
                  <span style={{ fontSize: "8pt", lineHeight: 1.5 }}>{personal.location}</span>
                </div>
              )}
              {personal.linkedin && (
                <div style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "flex-start" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: GOLD,
                      color: NAVY,
                      fontSize: "7pt",
                      flexShrink: 0,
                      fontWeight: 800,
                    }}
                  >
                    in
                  </span>
                  <span style={{ fontSize: "8pt", wordBreak: "break-all", lineHeight: 1.5 }}>
                    {personal.linkedin}
                  </span>
                </div>
              )}
              {personal.website && (
                <div style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "flex-start" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: GOLD,
                      color: NAVY,
                      fontSize: "8pt",
                      flexShrink: 0,
                      fontWeight: 700,
                    }}
                  >
                    \u25C9
                  </span>
                  <span style={{ fontSize: "8pt", wordBreak: "break-all", lineHeight: 1.5 }}>
                    {personal.website}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Skills as Circular Rings */}
          {skills.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <SidebarHeading icon={ICONS.skills}>{t(language, "skills")}</SidebarHeading>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  justifyContent: "center",
                }}
              >
                {skills.slice(0, 6).map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      width: 60,
                    }}
                  >
                    <ProgressRing percent={getSkillPercent(s.level)} size={50} />
                    <span
                      style={{
                        fontSize: "7pt",
                        color: WHITE,
                        textAlign: "center",
                        lineHeight: 1.3,
                        fontWeight: 500,
                      }}
                    >
                      {s.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages as Horizontal Bars */}
          {langs.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <SidebarHeading icon={ICONS.languages}>{t(language, "languages")}</SidebarHeading>
              {langs.map((l) => (
                <div key={l.id} style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "8pt",
                      color: WHITE,
                      marginBottom: 1,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{l.name}</span>
                    <span style={{ color: GOLD_LIGHT, fontSize: "7.5pt" }}>{l.level}</span>
                  </div>
                  <LangBar percent={getProficiencyPercent(l.level)} />
                </div>
              ))}
            </div>
          )}

          {/* Decorative accent line */}
          <div
            style={{
              height: 2,
              background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT}, ${GOLD})`,
              borderRadius: 1,
              marginTop: 6,
            }}
          />
        </div>
      </div>

      {/* ─── Right Main Content (White) ──────────────────────────── */}
      <div style={{ flex: 1, background: WHITE, padding: "16px 18px" }}>
        {mainSectionIds.map((id) => renderMainSection(id))}
      </div>
    </div>
  );
}
