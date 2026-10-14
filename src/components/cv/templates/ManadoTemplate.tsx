import type { CvData, CvSkill } from "@/lib/cv-types";
import { t, type CvUiLang } from "@/lib/cv-translations";
import { Phone, Mail, MapPin, Linkedin, Globe } from "lucide-react";
import type { SectionDef } from "../editor/SectionsNav";

interface Props {
  data: CvData;
  showHeader?: boolean;
  sectionOrder?: SectionDef[];
  language?: CvUiLang;
}

type TextAlign = "left" | "center" | "right" | "justify";

const DEFAULT_SECTION_ORDER = [
  { id: "personal", label: "Profil" },
  { id: "experience", label: "Pengalaman Kerja" },
  { id: "education", label: "Pendidikan" },
  { id: "internship", label: "Riwayat Magang" },
  { id: "organization", label: "Riwayat Organisasi" },
  { id: "skills", label: "Keahlian" },
  { id: "languages", label: "Bahasa" },
  { id: "certificate", label: "Sertifikat" },
] as const;

const SIDEBAR_BG = "#12343b";
const SIDEBAR_TEXT = "#e6efef";
const SIDEBAR_MUTED = "#9fbcbc";
const ACCENT = "#f4a259";
const ACCENT_DARK = "#b4641c";
const ACCENT_SOFT = "#fef1e3";
const HEADING = "#12343b";
const TEXT = "#334155";

const SIDEBAR_SECTION_IDS = ["skills", "languages", "certificate"];
const MAIN_SECTION_IDS = ["personal", "experience", "education", "internship", "organization"];

const SKILL_LEVEL_WIDTH: Record<NonNullable<CvSkill["level"]>, string> = {
  Beginner: "25%",
  Intermediate: "50%",
  Advanced: "75%",
  Expert: "100%",
};

function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "CV"
  );
}

function Description({ text, align }: { text?: string; align?: TextAlign }) {
  if (!text) return null;
  return (
    <div style={{ marginTop: 4, fontSize: "9pt", lineHeight: 1.55, color: TEXT }}>
      {text.split("\n").map((line, i) => {
        const bullet = line.match(/^\s*[•-]\s+(.*)$/);
        if (bullet) {
          return (
            <p
              key={i}
              style={{ margin: 0, paddingLeft: 12, textIndent: -12, textAlign: align || "left" }}
            >
              <span style={{ color: ACCENT_DARK }}>•</span> {bullet[1]}
            </p>
          );
        }
        if (!line.trim()) return <div key={i} style={{ height: 4 }} />;
        return (
          <p key={i} style={{ margin: 0, textAlign: align || "left" }}>
            {line}
          </p>
        );
      })}
    </div>
  );
}

function SidebarHeading({ title }: { title: string }) {
  return (
    <h3
      style={{
        fontSize: "9.5pt",
        fontWeight: 700,
        color: ACCENT,
        textTransform: "uppercase",
        letterSpacing: 1.6,
        margin: "18px 0 8px",
        paddingBottom: 4,
        borderBottom: "1px solid rgba(255,255,255,0.15)",
      }}
    >
      {title}
    </h3>
  );
}

function MainHeading({ title }: { title: string }) {
  return (
    <h2
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: "11.5pt",
        fontWeight: 800,
        color: HEADING,
        textTransform: "uppercase",
        letterSpacing: 1.4,
        margin: "16px 0 10px",
      }}
    >
      <span
        style={{ width: 18, height: 4, borderRadius: 2, backgroundColor: ACCENT, flexShrink: 0 }}
      />
      {title}
    </h2>
  );
}

function TimelineEntry({
  title,
  subtitle,
  period,
  children,
}: {
  title: string;
  subtitle?: string;
  period?: string;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ position: "relative", paddingLeft: 16, paddingBottom: 12 }}>
      <span
        style={{
          position: "absolute",
          left: -7,
          top: 4,
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: "#fff",
          border: `2px solid ${ACCENT}`,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "10.5pt", fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: "9.5pt", fontWeight: 600, color: HEADING, opacity: 0.85 }}>
              {subtitle}
            </div>
          )}
        </div>
        {period && (
          <span
            style={{
              fontSize: "8pt",
              fontWeight: 700,
              color: ACCENT_DARK,
              backgroundColor: ACCENT_SOFT,
              padding: "2px 8px",
              borderRadius: 10,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {period}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

const formatPeriod = (start?: string, end?: string) => [start, end].filter(Boolean).join(" – ");

export function ManadoTemplate({ data, showHeader = true, sectionOrder, language = "id" }: Props) {
  const { personal, experiences, educations, skills, languages, certificates } = data;
  const internships = data.internships || [];
  const organizations = data.organizations || [];
  const orderedSections = sectionOrder?.filter((s) => s.id !== "ats") || DEFAULT_SECTION_ORDER;

  const hasSkillLevels = skills.some((s) => s.level);
  const contactItems = [
    { key: "phone", icon: Phone, value: personal.phone },
    { key: "email", icon: Mail, value: personal.email },
    { key: "location", icon: MapPin, value: personal.location },
    {
      key: "linkedin",
      icon: Linkedin,
      value: personal.linkedin?.replace(/^https?:\/\/(www\.)?/, ""),
    },
    { key: "website", icon: Globe, value: personal.website?.replace(/^https?:\/\/(www\.)?/, "") },
  ].filter((item) => item.value);

  const renderSidebarSection = (sectionId: string) => {
    switch (sectionId) {
      case "skills":
        if (skills.length === 0) return null;
        return (
          <div key="skills">
            <SidebarHeading title={t(language, "skills")} />
            {hasSkillLevels ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {skills.map((s) => (
                  <div key={s.id}>
                    <div style={{ fontSize: "8.5pt", color: SIDEBAR_TEXT, marginBottom: 3 }}>
                      {s.name}
                    </div>
                    <div
                      style={{
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: "rgba(255,255,255,0.15)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: s.level ? SKILL_LEVEL_WIDTH[s.level] : "75%",
                          height: "100%",
                          backgroundColor: ACCENT,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {skills.map((s) => (
                  <span
                    key={s.id}
                    style={{
                      fontSize: "8pt",
                      color: SIDEBAR_TEXT,
                      border: "1px solid rgba(244,162,89,0.55)",
                      borderRadius: 10,
                      padding: "2px 8px",
                      lineHeight: 1.4,
                    }}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        );

      case "languages":
        if (languages.length === 0) return null;
        return (
          <div key="languages">
            <SidebarHeading title={t(language, "languages")} />
            {languages.map((l) => (
              <div key={l.id} style={{ marginBottom: 5, lineHeight: 1.35 }}>
                <div style={{ fontSize: "9pt", fontWeight: 600, color: "#fff" }}>{l.name}</div>
                {l.level && <div style={{ fontSize: "8pt", color: SIDEBAR_MUTED }}>{l.level}</div>}
              </div>
            ))}
          </div>
        );

      case "certificate":
        if (certificates.length === 0) return null;
        return (
          <div key="certificate">
            <SidebarHeading title={t(language, "certificates")} />
            {certificates.map((c) => (
              <div key={c.id} style={{ marginBottom: 7, lineHeight: 1.35 }}>
                <div style={{ fontSize: "9pt", fontWeight: 600, color: "#fff" }}>{c.name}</div>
                <div style={{ fontSize: "8pt", color: SIDEBAR_MUTED }}>
                  {[c.issuer, c.date].filter(Boolean).join(" · ")}
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const renderMainSection = (sectionId: string) => {
    switch (sectionId) {
      case "personal":
        if (!personal.summary) return null;
        return (
          <section key="personal">
            <MainHeading title={t(language, "aboutMe")} />
            <p
              style={{
                margin: 0,
                fontSize: "9.5pt",
                lineHeight: 1.6,
                color: TEXT,
                whiteSpace: "pre-wrap",
                textAlign: personal.summaryAlign || "left",
              }}
            >
              {personal.summary}
            </p>
          </section>
        );

      case "experience":
        if (experiences.length === 0) return null;
        return (
          <section key="experience">
            <MainHeading title={t(language, "workExperience")} />
            <div style={{ borderLeft: "2px solid #e2e8f0", marginLeft: 4 }}>
              {experiences.map((e) => (
                <TimelineEntry
                  key={e.id}
                  title={e.position}
                  subtitle={[e.company, e.location].filter(Boolean).join(" · ")}
                  period={formatPeriod(e.startDate, e.current ? t(language, "current") : e.endDate)}
                >
                  <Description text={e.description} align={e.descriptionAlign} />
                </TimelineEntry>
              ))}
            </div>
          </section>
        );

      case "education":
        if (educations.length === 0) return null;
        return (
          <section key="education">
            <MainHeading title={t(language, "education")} />
            <div style={{ borderLeft: "2px solid #e2e8f0", marginLeft: 4 }}>
              {educations.map((ed) => (
                <TimelineEntry
                  key={ed.id}
                  title={[ed.degree, ed.field].filter(Boolean).join(", ") || ed.school}
                  subtitle={ed.degree || ed.field ? ed.school : undefined}
                  period={formatPeriod(ed.startDate, ed.endDate)}
                >
                  <Description text={ed.description} align={ed.descriptionAlign} />
                </TimelineEntry>
              ))}
            </div>
          </section>
        );

      case "internship":
        if (internships.length === 0) return null;
        return (
          <section key="internship">
            <MainHeading title={t(language, "internship")} />
            <div style={{ borderLeft: "2px solid #e2e8f0", marginLeft: 4 }}>
              {internships.map((item) => (
                <TimelineEntry
                  key={item.id}
                  title={item.position}
                  subtitle={[item.company, item.location].filter(Boolean).join(" · ")}
                  period={formatPeriod(item.startDate, item.endDate)}
                >
                  <Description text={item.description} align={item.descriptionAlign} />
                </TimelineEntry>
              ))}
            </div>
          </section>
        );

      case "organization":
        if (organizations.length === 0) return null;
        return (
          <section key="organization">
            <MainHeading title={t(language, "organization")} />
            <div style={{ borderLeft: "2px solid #e2e8f0", marginLeft: 4 }}>
              {organizations.map((item) => (
                <TimelineEntry
                  key={item.id}
                  title={item.role}
                  subtitle={item.name}
                  period={formatPeriod(item.startDate, item.endDate)}
                >
                  <Description text={item.description} align={item.descriptionAlign} />
                </TimelineEntry>
              ))}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "stretch", gap: 20, color: TEXT }}>
      {/* ─── Sidebar ─── */}
      <aside
        style={{
          width: "33%",
          flexShrink: 0,
          backgroundColor: SIDEBAR_BG,
          color: SIDEBAR_TEXT,
          borderRadius: 12,
          padding: "20px 16px 24px",
          boxSizing: "border-box",
        }}
      >
        {showHeader && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
            {personal.photoUrl ? (
              <img
                src={personal.photoUrl}
                alt="Profile"
                style={{
                  width: 116,
                  height: 116,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `3px solid ${ACCENT}`,
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: "50%",
                  border: `3px solid ${ACCENT}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22pt",
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: 1,
                }}
              >
                {initialsOf(personal.fullName || "")}
              </div>
            )}
          </div>
        )}

        {contactItems.length > 0 && (
          <div>
            <SidebarHeading title={t(language, "contactInfo")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {contactItems.map(({ key, icon: Icon, value }) => (
                <div
                  key={key}
                  style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: "8.5pt" }}
                >
                  <Icon size={12} color={ACCENT} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ wordBreak: "break-word", lineHeight: 1.4 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {orderedSections
          .filter((s) => SIDEBAR_SECTION_IDS.includes(s.id))
          .map((s) => renderSidebarSection(s.id))}
      </aside>

      {/* ─── Main column ─── */}
      <main style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
        {showHeader && (personal.fullName || personal.headline) && (
          <header style={{ marginBottom: 4 }}>
            <h1
              style={{
                fontSize: "25pt",
                fontWeight: 800,
                margin: 0,
                lineHeight: 1.05,
                color: HEADING,
                letterSpacing: -0.5,
              }}
            >
              {personal.fullName || "Nama Lengkap"}
            </h1>
            {personal.headline && (
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "10pt",
                  fontWeight: 700,
                  color: ACCENT_DARK,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}
              >
                {personal.headline}
              </p>
            )}
            <div
              style={{
                marginTop: 10,
                height: 3,
                width: 56,
                borderRadius: 2,
                backgroundColor: ACCENT,
              }}
            />
          </header>
        )}

        {orderedSections
          .filter((s) => MAIN_SECTION_IDS.includes(s.id))
          .map((s) => renderMainSection(s.id))}
      </main>
    </div>
  );
}
