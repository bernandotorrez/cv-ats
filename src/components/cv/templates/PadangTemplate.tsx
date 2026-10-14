import type { CvData } from "@/lib/cv-types";
import { t, type CvUiLang } from "@/lib/cv-translations";
import type { SectionDef } from "../editor/SectionsNav";

interface Props {
  data: CvData;
  showHeader?: boolean;
  sectionOrder?: SectionDef[];
  language?: CvUiLang;
}

type TextAlign = "left" | "center" | "right" | "justify";

// Default section order (excluding 'ats' which is not a visual section)
const DEFAULT_SECTION_ORDER = [
  { id: "personal", label: "Profil & Kontak" },
  { id: "experience", label: "Pengalaman Kerja" },
  { id: "education", label: "Pendidikan" },
  { id: "internship", label: "Riwayat Magang" },
  { id: "organization", label: "Riwayat Organisasi" },
  { id: "skills", label: "Keahlian" },
  { id: "languages", label: "Bahasa" },
  { id: "certificate", label: "Sertifikat" },
] as const;

const ACCENT = "#1e4e8c";
const TEXT = "#1f2937";
const MUTED = "#4b5563";
const RULE = "#cbd5e1";

/**
 * Satu kolom, teks polos, tanpa ikon/tabel — urutan baca DOM = urutan baca ATS.
 * Baris yang diawali "•" / "-" dirender dengan hanging indent, tapi karakter
 * bullet tetap bagian dari teks agar parser ATS tetap mengenalinya.
 */
function Description({ text, align }: { text?: string; align?: TextAlign }) {
  if (!text) return null;
  return (
    <div style={{ marginTop: 3, fontSize: "9.5pt", lineHeight: 1.5, color: TEXT }}>
      {text.split("\n").map((line, i) => {
        const bullet = line.match(/^\s*[•-]\s+(.*)$/);
        if (bullet) {
          return (
            <p
              key={i}
              style={{ margin: 0, paddingLeft: 12, textIndent: -12, textAlign: align || "left" }}
            >
              • {bullet[1]}
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

function SectionTitle({ title }: { title: string }) {
  return (
    <h2
      style={{
        fontSize: "10.5pt",
        fontWeight: 700,
        color: ACCENT,
        textTransform: "uppercase",
        letterSpacing: 1.2,
        borderBottom: `1px solid ${RULE}`,
        paddingBottom: 3,
        margin: "14px 0 8px",
      }}
    >
      {title}
    </h2>
  );
}

function EntryHeader({
  title,
  subtitle,
  period,
}: {
  title: string;
  subtitle?: string;
  period?: string;
}) {
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
        }}
      >
        <span style={{ fontSize: "10.5pt", fontWeight: 700, color: "#111827" }}>{title}</span>
        {period && (
          <span style={{ fontSize: "9.5pt", color: MUTED, whiteSpace: "nowrap" }}>{period}</span>
        )}
      </div>
      {subtitle && (
        <div style={{ fontSize: "10pt", fontWeight: 600, color: "#374151" }}>{subtitle}</div>
      )}
    </>
  );
}

const formatPeriod = (start?: string, end?: string) => [start, end].filter(Boolean).join(" – ");

export function PadangTemplate({ data, showHeader = true, sectionOrder, language = "id" }: Props) {
  const { personal, experiences, educations, skills, languages, certificates } = data;
  const internships = data.internships || [];
  const organizations = data.organizations || [];

  const orderedSections = sectionOrder?.filter((s) => s.id !== "ats") || DEFAULT_SECTION_ORDER;

  const hasPersonalContent =
    personal.fullName ||
    personal.headline ||
    personal.email ||
    personal.phone ||
    personal.location ||
    personal.linkedin ||
    personal.website ||
    personal.summary;

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "personal":
        if (!personal.summary) return null;
        return (
          <section key="personal">
            <SectionTitle title={t(language, "profileSummary")} />
            <p
              style={{
                margin: 0,
                fontSize: "9.5pt",
                lineHeight: 1.55,
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
            <SectionTitle title={t(language, "workExperience")} />
            {experiences.map((e) => (
              <div key={e.id} style={{ marginBottom: 10 }}>
                <EntryHeader
                  title={e.position}
                  subtitle={[e.company, e.location].filter(Boolean).join(", ")}
                  period={formatPeriod(e.startDate, e.current ? t(language, "current") : e.endDate)}
                />
                <Description text={e.description} align={e.descriptionAlign} />
              </div>
            ))}
          </section>
        );

      case "education":
        if (educations.length === 0) return null;
        return (
          <section key="education">
            <SectionTitle title={t(language, "education")} />
            {educations.map((ed) => (
              <div key={ed.id} style={{ marginBottom: 8 }}>
                <EntryHeader
                  title={[ed.degree, ed.field].filter(Boolean).join(", ") || ed.school}
                  subtitle={ed.degree || ed.field ? ed.school : undefined}
                  period={formatPeriod(ed.startDate, ed.endDate)}
                />
                <Description text={ed.description} align={ed.descriptionAlign} />
              </div>
            ))}
          </section>
        );

      case "internship":
        if (internships.length === 0) return null;
        return (
          <section key="internship">
            <SectionTitle title={t(language, "internship")} />
            {internships.map((item) => (
              <div key={item.id} style={{ marginBottom: 10 }}>
                <EntryHeader
                  title={item.position}
                  subtitle={[item.company, item.location].filter(Boolean).join(", ")}
                  period={formatPeriod(item.startDate, item.endDate)}
                />
                <Description text={item.description} align={item.descriptionAlign} />
              </div>
            ))}
          </section>
        );

      case "organization":
        if (organizations.length === 0) return null;
        return (
          <section key="organization">
            <SectionTitle title={t(language, "organization")} />
            {organizations.map((item) => (
              <div key={item.id} style={{ marginBottom: 10 }}>
                <EntryHeader
                  title={item.role}
                  subtitle={item.name}
                  period={formatPeriod(item.startDate, item.endDate)}
                />
                <Description text={item.description} align={item.descriptionAlign} />
              </div>
            ))}
          </section>
        );

      case "skills":
        if (skills.length === 0) return null;
        return (
          <section key="skills">
            <SectionTitle title={t(language, "skills")} />
            <p style={{ margin: 0, fontSize: "9.5pt", lineHeight: 1.6 }}>
              {skills.map((s) => s.name).join(" • ")}
            </p>
          </section>
        );

      case "languages":
        if (languages.length === 0) return null;
        return (
          <section key="languages">
            <SectionTitle title={t(language, "languages")} />
            <p style={{ margin: 0, fontSize: "9.5pt", lineHeight: 1.6 }}>
              {languages.map((l) => (l.level ? `${l.name} (${l.level})` : l.name)).join(" • ")}
            </p>
          </section>
        );

      case "certificate":
        if (certificates.length === 0) return null;
        return (
          <section key="certificate">
            <SectionTitle title={t(language, "certificates")} />
            {certificates.map((c) => (
              <p key={c.id} style={{ margin: "0 0 3px", fontSize: "9.5pt", lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600 }}>{c.name}</span>
                {c.issuer ? ` — ${c.issuer}` : ""}
                {c.date ? <span style={{ color: MUTED }}>{`, ${c.date}`}</span> : null}
              </p>
            ))}
          </section>
        );

      default:
        return null;
    }
  };

  const contactLine = [personal.email, personal.phone, personal.location].filter(Boolean);
  const linkLine = [personal.linkedin, personal.website].filter(Boolean);

  return (
    <div style={{ color: TEXT }}>
      {showHeader && hasPersonalContent && (
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            paddingBottom: 10,
            borderBottom: `2px solid ${ACCENT}`,
            marginBottom: 4,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: "22pt",
                fontWeight: 800,
                margin: 0,
                lineHeight: 1.1,
                color: "#111827",
                letterSpacing: -0.3,
              }}
            >
              {personal.fullName || "Nama Lengkap"}
            </h1>
            {personal.headline && (
              <p style={{ margin: "3px 0 0", fontSize: "11.5pt", fontWeight: 600, color: ACCENT }}>
                {personal.headline}
              </p>
            )}
            {contactLine.length > 0 && (
              <p style={{ margin: "6px 0 0", fontSize: "9.5pt", color: MUTED }}>
                {contactLine.join("  |  ")}
              </p>
            )}
            {linkLine.length > 0 && (
              <p style={{ margin: "1px 0 0", fontSize: "9.5pt", color: MUTED }}>
                {linkLine.join("  |  ")}
              </p>
            )}
          </div>
          {personal.photoUrl && (
            <img
              src={personal.photoUrl}
              alt="Profile"
              style={{
                width: 92,
                height: 112,
                borderRadius: 6,
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          )}
        </header>
      )}

      {orderedSections.map((section) => renderSection(section.id))}
    </div>
  );
}
