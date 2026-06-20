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
const BG = "#1a1a2e";
const BG_LIGHT = "#16213e";
const TEAL = "#00d4aa";
const TEAL_DIM = "#00a88a";
const TEAL_GLOW = "rgba(0,212,170,0.15)";
const WHITE = "#f0f0f5";
const TEXT = "#c8c8d8";
const MUTED = "#8888a8";
const CARD_BG = "#16213e";

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

function getSkillPercent(level?: string): number {
  if (!level) return 78;
  const lower = level.toLowerCase();
  if (lower === "expert") return 95;
  if (lower === "advanced") return 85;
  if (lower === "intermediate") return 70;
  if (lower === "beginner") return 45;
  return 78;
}

function getLangPercent(level?: string): number {
  if (!level) return 75;
  const lower = level.toLowerCase();
  if (lower === "native" || lower === "expert" || lower === "fluent") return 95;
  if (lower === "advanced" || lower === "professional") return 85;
  if (lower === "intermediate" || lower === "conversational") return 65;
  if (lower === "beginner" || lower === "basic") return 40;
  return 75;
}

// ─── Section Heading ─────────────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "10.5pt",
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: 2,
        color: TEAL,
        marginBottom: 10,
        marginTop: 0,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 18,
          height: 2,
          background: TEAL,
        }}
      />
      {children}
      <span
        style={{
          flex: 1,
          height: 1,
          background: `linear-gradient(to right, ${TEAL}40, transparent)`,
        }}
      />
    </h2>
  );
}

// ─── Skill Tag ───────────────────────────────────────────────────
function SkillTag({ name, percent }: { name: string; percent: number }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 20,
        border: `1px solid ${TEAL}50`,
        background: TEAL_GLOW,
        fontSize: "8.5pt",
        color: WHITE,
        marginBottom: 5,
        marginRight: 5,
      }}
    >
      {name}
      <span
        style={{
          fontSize: "7pt",
          color: TEAL,
          fontWeight: 700,
        }}
      >
        {percent}%
      </span>
    </div>
  );
}

// ─── Language Bar ────────────────────────────────────────────────
function LangBarInline({ percent }: { percent: number }) {
  return (
    <div
      style={{
        width: 60,
        height: 4,
        borderRadius: 2,
        background: BG_LIGHT,
        overflow: "hidden",
        display: "inline-block",
        verticalAlign: "middle",
        marginLeft: 6,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${percent}%`,
          borderRadius: 2,
          background: TEAL,
        }}
      />
    </div>
  );
}

// ─── Main Template ───────────────────────────────────────────────
export function SoloTemplate({ data, showHeader = true, sectionOrder, language = "id" }: Props) {
  const { personal, experiences, educations, skills, languages: langs, certificates } = data;
  const internships = data.internships || [];
  const organizations = data.organizations || [];
  const orderedSections = sectionOrder?.filter((s) => s.id !== "ats") || DEFAULT_SECTION_ORDER;

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "personal":
        return personal.summary ? (
          <div key="summary" style={{ marginBottom: 16 }}>
            <SectionHeading>{t(language, "profile")}</SectionHeading>
            <p
              style={{
                fontSize: "9.5pt",
                lineHeight: 1.7,
                color: TEXT,
                margin: 0,
                whiteSpace: "pre-wrap",
                textAlign: personal.summaryAlign || "left",
              }}
            >
              {personal.summary}
            </p>
          </div>
        ) : null;

      case "experience":
        return experiences.length > 0 ? (
          <div key="experience" style={{ marginBottom: 16 }}>
            <SectionHeading>{t(language, "workExperience")}</SectionHeading>
            <div style={{ position: "relative", paddingLeft: 16 }}>
              {/* Timeline line */}
              <div
                style={{
                  position: "absolute",
                  left: 3,
                  top: 4,
                  bottom: 4,
                  width: 2,
                  background: `linear-gradient(to bottom, ${TEAL}, ${TEAL}30)`,
                }}
              />
              {experiences.map((e) => (
                <div key={e.id} style={{ marginBottom: 14, position: "relative" }}>
                  {/* Timeline dot */}
                  <div
                    style={{
                      position: "absolute",
                      left: -16,
                      top: 4,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: TEAL,
                      boxShadow: `0 0 6px ${TEAL}60`,
                    }}
                  />
                  <div style={{ fontSize: "8pt", fontWeight: 700, color: TEAL_DIM, marginBottom: 2 }}>
                    {e.startDate} — {e.current ? t(language, "current") : e.endDate}
                  </div>
                  <strong style={{ fontSize: "10pt", color: WHITE }}>{e.position}</strong>
                  <div style={{ fontSize: "9pt", color: MUTED, fontStyle: "italic", marginBottom: 3 }}>
                    {e.company}
                    {e.location ? ` \u2022 ${e.location}` : ""}
                  </div>
                  <p
                    style={{
                      fontSize: "9pt",
                      whiteSpace: "pre-wrap",
                      color: TEXT,
                      lineHeight: 1.6,
                      margin: 0,
                      textAlign: e.descriptionAlign || "left",
                    }}
                  >
                    {e.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null;

      case "education":
        return educations.length > 0 ? (
          <div key="education" style={{ marginBottom: 16 }}>
            <SectionHeading>{t(language, "education")}</SectionHeading>
            <div style={{ position: "relative", paddingLeft: 16 }}>
              <div
                style={{
                  position: "absolute",
                  left: 3,
                  top: 4,
                  bottom: 4,
                  width: 2,
                  background: `linear-gradient(to bottom, ${TEAL}, ${TEAL}30)`,
                }}
              />
              {educations.map((ed) => (
                <div key={ed.id} style={{ marginBottom: 12, position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: -16,
                      top: 4,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: TEAL,
                      boxShadow: `0 0 6px ${TEAL}60`,
                    }}
                  />
                  <div style={{ fontSize: "8pt", fontWeight: 700, color: TEAL_DIM, marginBottom: 2 }}>
                    {ed.startDate} — {ed.endDate}
                  </div>
                  <strong style={{ fontSize: "10pt", color: WHITE }}>
                    {ed.degree}
                    {ed.field ? `, ${ed.field}` : ""}
                  </strong>
                  <div style={{ fontSize: "9pt", color: MUTED, fontStyle: "italic", marginBottom: 2 }}>
                    {ed.school}
                  </div>
                  {ed.description && (
                    <p
                      style={{
                        fontSize: "8.5pt",
                        color: TEXT,
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
          </div>
        ) : null;

      case "skills":
        return skills.length > 0 ? (
          <div key="skills" style={{ marginBottom: 16 }}>
            <SectionHeading>{t(language, "skills")}</SectionHeading>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {skills.map((s) => (
                <SkillTag key={s.id} name={s.name} percent={getSkillPercent(s.level)} />
              ))}
            </div>
          </div>
        ) : null;

      case "languages":
        return langs.length > 0 ? (
          <div key="languages" style={{ marginBottom: 16 }}>
            <SectionHeading>{t(language, "languages")}</SectionHeading>
            {langs.map((l) => (
              <div
                key={l.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 5,
                  fontSize: "9pt",
                  color: TEXT,
                }}
              >
                <span style={{ minWidth: 80 }}>{l.name}</span>
                <LangBarInline percent={getLangPercent(l.level)} />
                <span style={{ marginLeft: 6, fontSize: "8pt", color: TEAL, fontWeight: 600 }}>
                  {l.level}
                </span>
              </div>
            ))}
          </div>
        ) : null;

      case "certificate":
        return certificates.length > 0 ? (
          <div key="certificate" style={{ marginBottom: 16 }}>
            <SectionHeading>{t(language, "certificates")}</SectionHeading>
            {certificates.map((c) => (
              <div
                key={c.id}
                style={{
                  fontSize: "9pt",
                  color: TEXT,
                  marginBottom: 5,
                  paddingLeft: 10,
                  borderLeft: `3px solid ${TEAL}`,
                }}
              >
                <strong style={{ color: WHITE }}>{c.name}</strong> — {c.issuer} ({c.date})
              </div>
            ))}
          </div>
        ) : null;

      case "internship":
        return internships.length > 0 ? (
          <div key="internship" style={{ marginBottom: 16 }}>
            <SectionHeading>{t(language, "internship")}</SectionHeading>
            <div style={{ position: "relative", paddingLeft: 16 }}>
              <div
                style={{
                  position: "absolute",
                  left: 3,
                  top: 4,
                  bottom: 4,
                  width: 2,
                  background: `linear-gradient(to bottom, ${TEAL}, ${TEAL}30)`,
                }}
              />
              {internships.map((item) => (
                <div key={item.id} style={{ marginBottom: 12, position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: -16,
                      top: 4,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: TEAL,
                      boxShadow: `0 0 6px ${TEAL}60`,
                    }}
                  />
                  <div style={{ fontSize: "8pt", fontWeight: 700, color: TEAL_DIM, marginBottom: 2 }}>
                    {item.startDate} — {item.endDate}
                  </div>
                  <strong style={{ fontSize: "10pt", color: WHITE }}>{item.position}</strong>
                  <div style={{ fontSize: "9pt", color: MUTED, fontStyle: "italic", marginBottom: 3 }}>
                    {item.company}
                    {item.location ? ` \u2022 ${item.location}` : ""}
                  </div>
                  {item.description && (
                    <p
                      style={{
                        fontSize: "9pt",
                        whiteSpace: "pre-wrap",
                        color: TEXT,
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
            </div>
          </div>
        ) : null;

      case "organization":
        return organizations.length > 0 ? (
          <div key="organization" style={{ marginBottom: 16 }}>
            <SectionHeading>{t(language, "organization")}</SectionHeading>
            <div style={{ position: "relative", paddingLeft: 16 }}>
              <div
                style={{
                  position: "absolute",
                  left: 3,
                  top: 4,
                  bottom: 4,
                  width: 2,
                  background: `linear-gradient(to bottom, ${TEAL}, ${TEAL}30)`,
                }}
              />
              {organizations.map((org) => (
                <div key={org.id} style={{ marginBottom: 12, position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: -16,
                      top: 4,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: TEAL,
                      boxShadow: `0 0 6px ${TEAL}60`,
                    }}
                  />
                  <div style={{ fontSize: "8pt", fontWeight: 700, color: TEAL_DIM, marginBottom: 2 }}>
                    {org.startDate} — {org.endDate}
                  </div>
                  <strong style={{ fontSize: "10pt", color: WHITE }}>{org.role}</strong>
                  <div style={{ fontSize: "9pt", color: MUTED, fontStyle: "italic", marginBottom: 3 }}>
                    {org.name}
                  </div>
                  {org.description && (
                    <p
                      style={{
                        fontSize: "9pt",
                        whiteSpace: "pre-wrap",
                        color: TEXT,
                        lineHeight: 1.6,
                        margin: 0,
                        textAlign: org.descriptionAlign || "left",
                      }}
                    >
                      {org.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div style={{ background: BG, color: WHITE, padding: "18px 20px", margin: "-16mm", fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Header */}
      {showHeader && personal.fullName && (
        <div style={{ marginBottom: 18, paddingBottom: 14, borderBottom: `2px solid ${TEAL}` }}>
          <h1
            style={{
              fontSize: "22pt",
              fontWeight: 900,
              color: WHITE,
              margin: 0,
              letterSpacing: 0.5,
            }}
          >
            {personal.fullName}
          </h1>
          {personal.headline && (
            <div
              style={{
                fontSize: "10.5pt",
                color: TEAL,
                fontWeight: 600,
                marginTop: 3,
                letterSpacing: 0.5,
              }}
            >
              {personal.headline}
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "4px 14px",
              marginTop: 8,
              fontSize: "8.5pt",
              color: MUTED,
            }}
          >
            {personal.email && <span>{personal.email}</span>}
            {personal.phone && <span>{personal.phone}</span>}
            {personal.location && <span>{personal.location}</span>}
            {personal.linkedin && <span style={{ color: TEAL_DIM }}>{personal.linkedin}</span>}
            {personal.website && <span style={{ color: TEAL_DIM }}>{personal.website}</span>}
          </div>
        </div>
      )}

      {/* Sections */}
      {orderedSections.map((s) => renderSection(s.id)).filter(Boolean)}
    </div>
  );
}
