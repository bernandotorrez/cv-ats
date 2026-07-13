import type { CvData } from "@/lib/cv-types";
import type { CvUiLang } from "@/lib/cv-translations";
import type { SectionDef } from "../editor/SectionsNav";
import { JakartaTemplate } from "./JakartaTemplate";

interface Props {
  data: CvData;
  sectionOrder?: SectionDef[];
  language?: CvUiLang;
}

export function BandungTemplate({ data, sectionOrder, language = "id" }: Props) {
  return (
    <div>
      <header
        style={{
          backgroundColor: "#468432",
          color: "#fff",
          padding: "14px 16px",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          {data.personal.photoUrl && (
            <img
              src={data.personal.photoUrl}
              alt="Profile"
              style={{
                width: 110,
                height: 110,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid rgba(255, 255, 255, 0.4)",
              }}
            />
          )}
          <div>
            <h1 style={{ fontSize: "22pt", fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
              {data.personal.fullName || "Nama Lengkap"}
            </h1>
            {data.personal.headline && (
              <p style={{ margin: "4px 0 0", opacity: 0.95 }}>{data.personal.headline}</p>
            )}
            <p style={{ margin: "4px 0 0 0", fontSize: "9.5pt" }}>
              {[
                data.personal.email,
                data.personal.phone,
                data.personal.location,
                data.personal.linkedin,
              ]
                .filter(Boolean)
                .join(" • ")}
            </p>
          </div>
        </div>
      </header>
      <JakartaTemplate
        data={{
          ...data,
          personal: {
            ...data.personal,
            fullName: "",
            headline: "",
            email: "",
            phone: "",
            location: "",
            linkedin: "",
            website: "",
          },
        }}
        showHeader={false}
        sectionOrder={sectionOrder}
        language={language}
      />
    </div>
  );
}
