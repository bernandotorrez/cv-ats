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
const CREAM = "#faf5ef";
const TERRA = "#c75b39";
const TERRA_LIGHT = "#d4764e";
const TERRA_DIM = "#e8a88c";
const DARK = "#2c1810";
const TEXT = "#4a3728";
const MUTED = "#7a6455";
const SIDEBAR_BG = "#f5ece2";
const DIVIDER = "#d4c4b0";

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

function getSkillDots(level?: string): number {
  if (!level) return 4;
  const lower = level.toLowerCase();
  if (lower === "expert") return 5;
  if (lower === "advanced") return 4;
  if (lower === "intermediate") return 3;
  if (lower === "beginner") return 2;
  return 4;
}

function getLangDots(level?: string): number {
  if (!level) return 4;
  const lower = level.toLowerCase();
  if (lower === "native" || lower === "fluent") return 5;
  if (lower === "advanced" || lower === "professional") return 4;
  if (lower === "intermediate" || lower === "conversational") return 3;
  if (lower === "beginner" || lower === "basic") return 2;
  return 4;
}

// ─── Dot Rating ──────────────────────────────────────────────────
function DotRating({ filled, total = 5 }: { filled: number; total?: number }) {
  return (
    <div style={{ display: "flex", gap: 3, marginTop: 2 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: i < filled ? TERRA : DIVIDER,
          }}
        />
      ))}
    </div>
  );
}

// ─── Decorative Separator ────────────────────────────────────────
function DiamondSeparator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "8px 0" }}>
      <div style={{ flex: 1, height: 1, background: DIVIDER }} />
      <div style={{ width: 5, height: 5, background: TERRA, transform: "rotate(45deg)" }} />
      <div style={{ flex: 1, height: 1, background: DIVIDER }} />
    </div>
  );
}

// ─── Section Heading (Sidebar) ────────────────────────────────────
function SidebarHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: "8.5pt",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 2,
        color: TERRA,
        marginBottom: 8,
        marginTop: 0,
      }}
    >
      {children}
    </h3>
  );
}

// ─── Section Heading (Main) ──────────────────────────────────────
function MainHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "11pt",
        fontWeight: 700,
        color: TERRA,
        marginBottom: 4,
        marginTop: 0,
        fontFamily: "Georgia, 'Times New Roman', serif",
        letterSpacing: 0.5,
      }}
    >
      {children}
    </h2>
  );
}

// ─── Main Template ───────────────────────────────────────────────
export function DenpasarTemplate({ data, showHeader = true, sectionOrder, language = "id" }: Props) {
  const { personal, experiences, educations, skills, languages: langs, certificates } = data;
  const internships = data.internships || [];
  const organizations = data.organizations || [];
  const orderedSections = sectionOrder?.filter((s) => s.id !== "ats") || DEFAULT_SECTION_ORDER;

  const sidebarSectionIds = ["skills", "languages"];

  const renderSidebarSection = (sectionId: string) => {
    switch (sectionId) {
      case "skills":
        return skills.length > 0 ? (
          <div key="skills" style={{ marginBottom: 14 }}>
            <SidebarHeading>{t(language, "skills")}</SidebarHeading>
            {skills.map((s) => (
              <div key={s.id} style={{ marginBottom: 5 }}>
                <div style={{ fontSize: "8.5pt", color: TEXT }}>{s.name}</div>
                <DotRating filled={getSkillDots(s.level)} />
              </div>
            ))}
          </div>
        ) : null;

      case "languages":
        return langs.length > 0 ? (
          <div key="languages" style={{ marginBottom: 14 }}>
            <SidebarHeading>{t(language, "languages")}</SidebarHeading>
            {langs.map((l) => (
              <div key={l.id} style={{ marginBottom: 5 }}>
                <div style={{ fontSize: "8.5pt", color: TEXT }}>{l.name}</div>
                <DotRating filled={getLangDots(l.level)} />
              </div>
            ))}
          </div>
        ) : null;

      default:
        return null;
    }
  };

  const renderMainSection = (sectionId: string) => {
    switch (sectionId) {
      case "personal":
        return personal.summary ? (
          <div key="summary" style={{ marginBottom: 16 }}>
            <MainHeading>{t(language, "profile")}</MainHeading>
            <DiamondSeparator />
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
            <MainHeading>{t(language, "workExperience")}</MainHeading>
            <DiamondSeparator />
            {experiences.map((e) => (
              <div key={e.id} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: "8pt", fontWeight: 600, color: TERRA_LIGHT, marginBottom: 2 }}>
                  {e.startDate} — {e.current ? t(language, "current") : e.endDate}
                </div>
                <strong style={{ fontSize: "10pt", color: DARK }}>{e.position}</strong>
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
        ) : null;

      case "education":
        return educations.length > 0 ? (
          <div key="education" style={{ marginBottom: 16 }}>
            <MainHeading>{t(language, "education")}</MainHeading>
            <DiamondSeparator />
            {educations.map((ed) => (
              <div key={ed.id} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: "8pt", fontWeight: 600, color: TERRA_LIGHT, marginBottom: 2 }}>
                  {ed.startDate} — {ed.endDate}
                </div>
                <strong style={{ fontSize: "10pt", color: DARK }}>
                  {ed.degree}
                  {ed.field ? `, ${ed.field}` : ""}
                </strong>
                <div style={{ fontSize: "9pt", color: MUTED, fontStyle: "italic", marginBottom: 2 }}>
                  {ed.school}
                </div>
                {ed.description && (
                  <p style={{ fontSize: "8.5pt", color: TEXT, margin: 0, textAlign: ed.descriptionAlign || "left" }}>
                    {ed.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : null;

      case "certificate":
        return certificates.length > 0 ? (
          <div key="certificate" style={{ marginBottom: 16 }}>
            <MainHeading>{t(language, "certificates")}</MainHeading>
            <DiamondSeparator />
            {certificates.map((c) => (
              <div
                key={c.id}
                style={{
                  fontSize: "9pt",
                  color: TEXT,
                  marginBottom: 5,
                  paddingLeft: 10,
                  borderLeft: `3px solid ${TERRA}`,
                }}
              >
                <strong style={{ color: DARK }}>{c.name}</strong> — {c.issuer} ({c.date})
              </div>
            ))}
          </div>
        ) : null;

      case "internship":
        return internships.length > 0 ? (
          <div key="internship" style={{ marginBottom: 16 }}>
            <MainHeading>{t(language, "internship")}</MainHeading>
            <DiamondSeparator />
            {internships.map((item) => (
              <div key={item.id} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: "8pt", fontWeight: 600, color: TERRA_LIGHT, marginBottom: 2 }}>
                  {item.startDate} — {item.endDate}
                </div>
                <strong style={{ fontSize: "10pt", color: DARK }}>{item.position}</strong>
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
        ) : null;

      case "organization":
        return organizations.length > 0 ? (
          <div key="organization" style={{ marginBottom: 16 }}>
            <MainHeading>{t(language, "organization")}</MainHeading>
            <DiamondSeparator />
            {organizations.map((org) => (
              <div key={org.id} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: "8pt", fontWeight: 600, color: TERRA_LIGHT, marginBottom: 2 }}>
                  {org.startDate} — {org.endDate}
                </div>
                <strong style={{ fontSize: "10pt", color: DARK }}>{org.role}</strong>
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
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div style={{ background: CREAM, margin: "-16mm", fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Header */}
      {showHeader && personal.fullName && (
        <div
          style={{
            padding: "20px 24px 14px",
            borderBottom: `3px solid ${TERRA}`,
          }}
        >
          <h1
            style={{
              fontSize: "24pt",
              fontWeight: 700,
              color: DARK,
              margin: 0,
              fontFamily: "Georgia, 'Times New Roman', serif",
              letterSpacing: 0.5,
            }}
          >
            {personal.fullName}
          </h1>
          {personal.headline && (
            <div
              style={{
                fontSize: "10.5pt",
                color: TERRA,
                fontWeight: 600,
                marginTop: 3,
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontStyle: "italic",
              }}
            >
              {personal.headline}
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "3px 12px",
              marginTop: 8,
              fontSize: "8.5pt",
              color: MUTED,
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

      {/* Two-column layout */}
      <div style={{ display: "flex" }}>
        {/* Sidebar */}
        <div
          style={{
            width: "30%",
            background: SIDEBAR_BG,
            padding: "16px 14px",
            borderRight: `1px solid ${DIVIDER}`,
          }}
        >
          {orderedSections
            .filter((s) => sidebarSectionIds.includes(s.id))
            .map((s) => renderSidebarSection(s.id))
            .filter(Boolean)}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: "16px 20px" }}>
          {orderedSections
            .filter((s) => !sidebarSectionIds.includes(s.id) && s.id !== "personal")
            .map((s) => renderMainSection(s.id))
            .filter(Boolean)}

          {/* Summary at top of main if present */}
          {orderedSections.find((s) => s.id === "personal") && renderMainSection("personal")}
        </div>
      </div>
    </div>
  );
}
