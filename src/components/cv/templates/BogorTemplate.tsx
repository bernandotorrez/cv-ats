import type { CvData } from "@/lib/cv-types";
import { t, type CvUiLang } from "@/lib/cv-translations";
import { Phone, Mail, MapPin, Linkedin, Globe } from "lucide-react";
import type { SectionDef } from "../editor/SectionsNav";

interface Props {
  data: CvData;
  showHeader?: boolean;
  sectionOrder?: SectionDef[];
  language?: CvUiLang;
}

const DEFAULT_SECTION_ORDER = [
  { id: "personal", label: "Profil" },
  { id: "education", label: "Pendidikan" },
  { id: "experience", label: "Pengalaman Kerja" },
  { id: "internship", label: "Riwayat Magang" },
  { id: "organization", label: "Riwayat Organisasi" },
  { id: "skills", label: "Keahlian" },
  { id: "languages", label: "Bahasa" },
] as const;

export function BogorTemplate({ data, showHeader = true, sectionOrder, language = "id" }: Props) {
  const { personal, experiences, educations, skills, languages, certificates } = data;
  const internships = data.internships || [];
  const organizations = data.organizations || [];
  const orderedSections = sectionOrder?.filter((s) => s.id !== "ats") || DEFAULT_SECTION_ORDER;

  const primaryColor = "#B58759";
  const sidebarBg = "#fdfcf9";
  const textColor = "#333333";
  const headingColor = "#B58759";

  const sidebarSectionIds = ["skills", "languages", "certificates"];
  const mainSectionIds = ["personal", "experience", "education", "internship", "organization"];

  // Sidebar heading style
  const renderSidebarHeading = (title: string) => (
    <h3
      style={{
        backgroundColor: primaryColor,
        color: "#ffffff",
        fontSize: "11pt",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "2px",
        padding: "8px 20px",
        margin: "24px 0 16px 0",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {title}
    </h3>
  );

  // Main column heading style
  const renderMainHeading = (title: string) => (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 16, marginTop: 24 }}>
      <h2
        style={{
          fontSize: "13pt",
          fontWeight: 700,
          color: headingColor,
          textTransform: "uppercase",
          letterSpacing: "3px",
          margin: 0,
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </h2>
      <div style={{ flex: 1, height: 1, backgroundColor: headingColor, marginLeft: 16 }} />
    </div>
  );

  const renderSidebarSection = (sectionId: string) => {
    switch (sectionId) {
      case "skills":
        if (skills.length > 0) {
          return (
            <div key="skills">
              {renderSidebarHeading(t(language, "skills"))}
              <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                {skills.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontSize: "9pt", color: textColor, flex: 1 }}>{s.name}</span>
                    <div style={{ width: "35%", height: 6, backgroundColor: "#e2e8f0" }}>
                      <div
                        style={{ width: "75%", height: "100%", backgroundColor: primaryColor }}
                      />
                    </div>
                  </div>
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
              <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                {languages.map((l) => (
                  <div
                    key={l.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontSize: "9pt", color: textColor, flex: 1 }}>{l.name}</span>
                    <div style={{ width: "35%", height: 6, backgroundColor: "#e2e8f0" }}>
                      <div
                        style={{ width: "100%", height: "100%", backgroundColor: primaryColor }}
                      />
                    </div>
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
              <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                {certificates.map((c) => (
                  <div key={c.id}>
                    <div style={{ fontSize: "9pt", fontWeight: 700, color: textColor }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: "8.5pt", color: "#666" }}>{c.issuer}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return null;
    }
  };

  const renderMainSection = (sectionId: string) => {
    switch (sectionId) {
      case "personal":
        if (!personal.summary) return null;
        return (
          <div key="personal" style={{ marginBottom: 20 }}>
            {renderMainHeading(t(language, "summary") || "Profil")}
            <p
              style={{
                fontSize: "9.5pt",
                color: textColor,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                margin: 0,
                paddingLeft: 16,
              }}
            >
              {personal.summary}
            </p>
          </div>
        );
      case "experience":
        if (experiences.length > 0) {
          return (
            <div key="experience" style={{ marginBottom: 20 }}>
              {renderMainHeading(t(language, "experience"))}
              <div style={{ paddingLeft: 16 }}>
                {experiences.map((exp) => (
                  <div key={exp.id} style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <h4
                        style={{ margin: 0, fontSize: "10.5pt", fontWeight: 700, color: textColor }}
                      >
                        {exp.company}
                      </h4>
                      <span style={{ fontSize: "9pt", color: textColor, fontWeight: 700 }}>
                        {exp.location}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <h5
                        style={{
                          margin: "2px 0 4px 0",
                          fontSize: "10pt",
                          fontWeight: 400,
                          color: textColor,
                        }}
                      >
                        {exp.position}
                      </h5>
                      <span style={{ fontSize: "9pt", color: textColor, fontWeight: 700 }}>
                        {exp.startDate} {exp.endDate ? `- ${exp.endDate}` : ""}
                      </span>
                    </div>
                    {exp.description && (
                      <div
                        style={{
                          fontSize: "9.5pt",
                          color: textColor,
                          lineHeight: 1.5,
                          marginTop: 6,
                        }}
                      >
                        <ul style={{ margin: 0, paddingLeft: 20, listStyleType: "disc" }}>
                          {exp.description.split("\n").map((line, i) => (
                            <li key={i} style={{ marginBottom: 2 }}>
                              {line.replace(/^[-•]\s*/, "")}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return null;
      case "education":
        if (educations.length > 0) {
          return (
            <div key="education" style={{ marginBottom: 20 }}>
              {renderMainHeading(t(language, "education"))}
              <div style={{ paddingLeft: 16 }}>
                {educations.map((edu) => (
                  <div key={edu.id} style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <h4
                        style={{ margin: 0, fontSize: "10.5pt", fontWeight: 700, color: textColor }}
                      >
                        {edu.degree
                          ? `${edu.degree} ${edu.field ? edu.field : ""} - ${edu.school}`
                          : edu.school}
                      </h4>
                      <span style={{ fontSize: "9pt", color: textColor, fontWeight: 700 }}>
                        {(edu as any).location}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginTop: 2,
                      }}
                    >
                      <span style={{ fontSize: "10pt", color: textColor }}>
                        {/* If field is already joined in degree, we can leave this empty or use something else */}
                      </span>
                      <span style={{ fontSize: "9pt", color: textColor, fontWeight: 700 }}>
                        {edu.startDate} {edu.endDate ? `- ${edu.endDate}` : ""}
                      </span>
                    </div>
                    {edu.description && (
                      <div
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: "9.5pt",
                          color: textColor,
                          lineHeight: 1.5,
                        }}
                      >
                        <ul style={{ margin: 0, paddingLeft: 20, listStyleType: "disc" }}>
                          {edu.description.split("\n").map((line, i) => (
                            <li key={i} style={{ marginBottom: 2 }}>
                              {line.replace(/^[-•]\s*/, "")}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return null;
      case "internship":
        if (internships.length > 0) {
          return (
            <div key="internship" style={{ marginBottom: 20 }}>
              {renderMainHeading(t(language, "internship"))}
              <div style={{ paddingLeft: 16 }}>
                {internships.map((intern) => (
                  <div key={intern.id} style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <h4
                        style={{ margin: 0, fontSize: "10.5pt", fontWeight: 700, color: textColor }}
                      >
                        {intern.company}
                      </h4>
                      <span style={{ fontSize: "9pt", color: textColor, fontWeight: 700 }}>
                        {intern.location}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <h5
                        style={{
                          margin: "2px 0 4px 0",
                          fontSize: "10pt",
                          fontWeight: 400,
                          color: textColor,
                        }}
                      >
                        {intern.position}
                      </h5>
                      <span style={{ fontSize: "9pt", color: textColor, fontWeight: 700 }}>
                        {intern.startDate} {intern.endDate ? `- ${intern.endDate}` : ""}
                      </span>
                    </div>
                    {intern.description && (
                      <div
                        style={{
                          fontSize: "9.5pt",
                          color: textColor,
                          lineHeight: 1.5,
                          marginTop: 6,
                        }}
                      >
                        <ul style={{ margin: 0, paddingLeft: 20, listStyleType: "disc" }}>
                          {intern.description.split("\n").map((line, i) => (
                            <li key={i} style={{ marginBottom: 2 }}>
                              {line.replace(/^[-•]\s*/, "")}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return null;
      case "organization":
        if (organizations.length > 0) {
          return (
            <div key="organization" style={{ marginBottom: 20 }}>
              {renderMainHeading(t(language, "organization"))}
              <div style={{ paddingLeft: 16 }}>
                {organizations.map((org) => (
                  <div key={org.id} style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <h4
                        style={{ margin: 0, fontSize: "10.5pt", fontWeight: 700, color: textColor }}
                      >
                        {(org as any).organization}
                      </h4>
                      <span style={{ fontSize: "9pt", color: textColor, fontWeight: 700 }}>
                        {(org as any).location}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <h5
                        style={{
                          margin: "2px 0 4px 0",
                          fontSize: "10pt",
                          fontWeight: 400,
                          color: textColor,
                        }}
                      >
                        {org.role}
                      </h5>
                      <span style={{ fontSize: "9pt", color: textColor, fontWeight: 700 }}>
                        {org.startDate} {org.endDate ? `- ${org.endDate}` : ""}
                      </span>
                    </div>
                    {org.description && (
                      <div
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: "9.5pt",
                          color: textColor,
                          lineHeight: 1.5,
                        }}
                      >
                        <ul style={{ margin: 0, paddingLeft: 20, listStyleType: "disc" }}>
                          {org.description.split("\n").map((line, i) => (
                            <li key={i} style={{ marginBottom: 2 }}>
                              {line.replace(/^[-•]\s*/, "")}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return null;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100%",
        position: "relative",
        backgroundColor: "#fff",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ─── Left Sidebar (35% width) ─── */}
      <div
        style={{
          width: "35%",
          backgroundColor: sidebarBg,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Placeholder for top corner (same height as header, minus photo overlap) */}
        {showHeader && (
          <div style={{ height: "135px", backgroundColor: "#fff", position: "relative" }}>
            {/* The diagonal slash in the reference image at the top left corner */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: primaryColor,
                clipPath: "polygon(0 0, 100% 0, 0 100%)",
                opacity: 0.15,
              }}
            />
          </div>
        )}

        <div
          style={{
            marginTop: showHeader && personal.photoUrl ? "90px" : "30px",
            paddingBottom: "20px",
          }}
        >
          {/* STATIC CONTACT SECTION */}
          {renderSidebarHeading(t(language, "contactInfo"))}
          <div
            style={{
              padding: "0 20px",
              fontSize: "9pt",
              color: textColor,
              lineHeight: 1.6,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {personal.phone && (
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Phone size={14} />
                <span style={{ fontWeight: 500 }}>{personal.phone}</span>
              </div>
            )}
            {personal.email && (
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Mail size={14} />
                <span style={{ wordBreak: "break-all", fontWeight: 500 }}>{personal.email}</span>
              </div>
            )}
            {personal.location && (
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <MapPin size={14} />
                <span style={{ fontWeight: 500 }}>{personal.location}</span>
              </div>
            )}
          </div>

          {/* Dynamic Sidebar Sections (Skills, Languages) */}
          {orderedSections
            .filter((s) => sidebarSectionIds.includes(s.id))
            .map((s) => renderSidebarSection(s.id))}

          {/* Social Media Section */}
          {(personal.linkedin || personal.website) && (
            <div>
              {renderSidebarHeading("SOSIAL MEDIA")}
              <div
                style={{
                  padding: "0 20px",
                  fontSize: "9pt",
                  color: textColor,
                  lineHeight: 1.6,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {personal.linkedin && (
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <Linkedin size={14} />
                    <span style={{ fontWeight: 500 }}>
                      {personal.linkedin
                        .replace("https://linkedin.com/in/", "")
                        .replace("https://www.linkedin.com/in/", "")}
                    </span>
                  </div>
                )}
                {personal.website && (
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <Globe size={14} />
                    <span style={{ fontWeight: 500 }}>
                      {personal.website.replace("https://", "")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Right Column (Main Content) ─── */}
      <div
        style={{ width: "65%", display: "flex", flexDirection: "column", backgroundColor: "#fff" }}
      >
        {/* Top Header Background */}
        {showHeader && (
          <div
            style={{
              backgroundColor: primaryColor,
              height: "135px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              paddingLeft: "70px",
              position: "relative",
            }}
          >
            <h1
              style={{
                color: "#fff",
                fontSize: "20pt",
                fontWeight: 700,
                margin: 0,
                letterSpacing: "1px",
              }}
            >
              {personal.fullName || "Nama Lengkap"}
            </h1>
            {personal.headline && (
              <h2 style={{ color: "#fff", fontSize: "12pt", fontWeight: 400, margin: "8px 0 0 0" }}>
                {personal.headline}
              </h2>
            )}
          </div>
        )}

        {/* Main Content Area */}
        <div
          style={{
            padding: "10px 30px 30px 40px",
            flex: 1,
            position: "relative",
          }}
        >
          {/* Thin vertical line acting as border left */}
          <div
            style={{
              position: "absolute",
              left: "15px",
              top: 24,
              bottom: 30,
              width: "1.5px",
              backgroundColor: "#e2e8f0",
            }}
          />

          {orderedSections
            .filter((s) => mainSectionIds.includes(s.id))
            .map((s) => renderMainSection(s.id))}
        </div>
      </div>

      {/* ─── Overlapping Photo (Absolute) ─── */}
      {showHeader && personal.photoUrl && (
        <div
          style={{
            position: "absolute",
            top: "30px",
            left: "2%",
            zIndex: 10,
            backgroundColor: "#fff",
            borderRadius: "50%",
            padding: "6px",
          }}
        >
          <img
            src={personal.photoUrl}
            alt="Profile"
            style={{
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>
      )}
    </div>
  );
}
