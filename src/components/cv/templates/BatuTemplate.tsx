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
const PURPLE = "#7c3aed";
const PINK = "#ec4899";
const GRADIENT = "linear-gradient(135deg, #7c3aed, #ec4899)";
const GRADIENT_H = "linear-gradient(90deg, #7c3aed, #ec4899)";
const GRADIENT_LIGHT = "linear-gradient(135deg, #f3e8ff, #fce7f3)";
const WHITE = "#ffffff";
const DARK = "#1f1235";
const TEXT = "#3d2c5e";
const MUTED = "#6b5b8a";
const CARD_BG = "#faf8ff";
const CARD_BORDER = "#e9d5f5";

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

// ─── Gradient Skill Bar ─────────────────────────────────────────
function SkillBar({ name, percent }: { name: string; percent: number }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: "8.5pt", color: TEXT, fontWeight: 500 }}>{name}</span>
        <span style={{ fontSize: "8pt", color: PURPLE, fontWeight: 700 }}>{percent}%</span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: "#ede5f7",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${percent}%`,
            borderRadius: 3,
            background: GRADIENT_H,
          }}
        />
      </div>
    </div>
  );
}

// ─── Section Heading ─────────────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10, marginTop: 0 }}>
      <h2
        style={{
          fontSize: "11pt",
          fontWeight: 800,
          color: PURPLE,
          margin: 0,
          textTransform: "uppercase",
          letterSpacing: 1.5,
        }}
      >
        {children}
      </h2>
      <div
        style={{
          height: 3,
          borderRadius: 2,
          background: GRADIENT_H,
          marginTop: 4,
          width: 50,
        }}
      />
    </div>
  );
}

// ─── Entry Card ──────────────────────────────────────────────────
function EntryCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: CARD_BG,
        borderRadius: 6,
        padding: "10px 12px",
        marginBottom: 8,
        borderLeft: `4px solid transparent`,
        borderImage: `${GRADIENT} 1`,
        borderImageSlice: 1,
        boxShadow: "0 1px 3px rgba(124,58,237,0.06)",
      }}
    >
      {children}
    </div>
  );
}

// ─── Main Template ───────────────────────────────────────────────
export function BatuTemplate({ data, showHeader = true, sectionOrder, language = "id" }: Props) {
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
            {experiences.map((e) => (
              <EntryCard key={e.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <strong style={{ fontSize: "10pt", color: DARK }}>{e.position}</strong>
                  <span style={{ fontSize: "8pt", color: PURPLE, fontWeight: 600, flexShrink: 0 }}>
                    {e.startDate} — {e.current ? t(language, "current") : e.endDate}
                  </span>
                </div>
                <div style={{ fontSize: "9pt", color: MUTED, fontStyle: "italic", marginBottom: 4 }}>
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
              </EntryCard>
            ))}
          </div>
        ) : null;

      case "education":
        return educations.length > 0 ? (
          <div key="education" style={{ marginBottom: 16 }}>
            <SectionHeading>{t(language, "education")}</SectionHeading>
            {educations.map((ed) => (
              <EntryCard key={ed.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <strong style={{ fontSize: "10pt", color: DARK }}>
                    {ed.degree}
                    {ed.field ? `, ${ed.field}` : ""}
                  </strong>
                  <span style={{ fontSize: "8pt", color: PURPLE, fontWeight: 600, flexShrink: 0 }}>
                    {ed.startDate} — {ed.endDate}
                  </span>
                </div>
                <div style={{ fontSize: "9pt", color: MUTED, fontStyle: "italic", marginBottom: 2 }}>
                  {ed.school}
                </div>
                {ed.description && (
                  <p style={{ fontSize: "8.5pt", color: TEXT, margin: 0, textAlign: ed.descriptionAlign || "left" }}>
                    {ed.description}
                  </p>
                )}
              </EntryCard>
            ))}
          </div>
        ) : null;

      case "skills":
        return skills.length > 0 ? (
          <div key="skills" style={{ marginBottom: 16 }}>
            <SectionHeading>{t(language, "skills")}</SectionHeading>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              {skills.map((s) => (
                <SkillBar key={s.id} name={s.name} percent={getSkillPercent(s.level)} />
              ))}
            </div>
          </div>
        ) : null;

      case "languages":
        return langs.length > 0 ? (
          <div key="languages" style={{ marginBottom: 16 }}>
            <SectionHeading>{t(language, "languages")}</SectionHeading>
            {langs.map((l) => {
              const pct = getLangPercent(l.level);
              return (
                <div key={l.id} style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: "9pt", color: TEXT }}>{l.name}</span>
                    <span style={{ fontSize: "8pt", color: PINK, fontWeight: 600 }}>{l.level}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: "#ede5f7", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        borderRadius: 3,
                        background: GRADIENT_H,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : null;

      case "certificate":
        return certificates.length > 0 ? (
          <div key="certificate" style={{ marginBottom: 16 }}>
            <SectionHeading>{t(language, "certificates")}</SectionHeading>
            {certificates.map((c) => (
              <EntryCard key={c.id}>
                <div style={{ fontSize: "9pt", color: TEXT }}>
                  <strong style={{ color: DARK }}>{c.name}</strong> — {c.issuer} ({c.date})
                </div>
              </EntryCard>
            ))}
          </div>
        ) : null;

      case "internship":
        return internships.length > 0 ? (
          <div key="internship" style={{ marginBottom: 16 }}>
            <SectionHeading>{t(language, "internship")}</SectionHeading>
            {internships.map((item) => (
              <EntryCard key={item.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <strong style={{ fontSize: "10pt", color: DARK }}>{item.position}</strong>
                  <span style={{ fontSize: "8pt", color: PURPLE, fontWeight: 600, flexShrink: 0 }}>
                    {item.startDate} — {item.endDate}
                  </span>
                </div>
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
              </EntryCard>
            ))}
          </div>
        ) : null;

      case "organization":
        return organizations.length > 0 ? (
          <div key="organization" style={{ marginBottom: 16 }}>
            <SectionHeading>{t(language, "organization")}</SectionHeading>
            {organizations.map((org) => (
              <EntryCard key={org.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <strong style={{ fontSize: "10pt", color: DARK }}>{org.role}</strong>
                  <span style={{ fontSize: "8pt", color: PURPLE, fontWeight: 600, flexShrink: 0 }}>
                    {org.startDate} — {org.endDate}
                  </span>
                </div>
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
              </EntryCard>
            ))}
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div style={{ background: WHITE, fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Gradient Header Banner */}
      {showHeader && personal.fullName && (
        <div
          style={{
            background: GRADIENT,
            padding: "20px 22px",
            margin: "-16mm -16mm 16px -16mm",
            borderRadius: "0 0 16px 16px",
          }}
        >
          <h1
            style={{
              fontSize: "24pt",
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
                fontSize: "11pt",
                color: "rgba(255,255,255,0.9)",
                fontWeight: 500,
                marginTop: 3,
              }}
            >
              {personal.headline}
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "3px 14px",
              marginTop: 10,
              fontSize: "8.5pt",
              color: "rgba(255,255,255,0.8)",
            }}
          >
            {personal.email && <span>{personal.email}</span>}
            {personal.phone && <span>{personal.phone}</span>}
            {personal.location && <span>{personal.location}</span>}
            {personal.linkedin && <span>{personal.linkedin}</span>}
            {personal.website && <span>{personal.website}</span>}
          </div>
        </div>
      )}

      {/* Sections */}
      {orderedSections.map((s) => renderSection(s.id)).filter(Boolean)}
    </div>
  );
}
