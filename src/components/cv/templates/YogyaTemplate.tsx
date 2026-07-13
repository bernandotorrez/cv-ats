import type { CvData } from "@/lib/cv-types";
import type { CvUiLang } from "@/lib/cv-translations";
import type { SectionDef } from "../editor/SectionsNav";
import { JakartaTemplate } from "./JakartaTemplate";

interface Props {
  data: CvData;
  sectionOrder?: SectionDef[];
  language?: CvUiLang;
}

export function YogyaTemplate({ data, sectionOrder, language = "id" }: Props) {
  return (
    <div>
      <header style={{ textAlign: "left", marginBottom: 12 }}>
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
              }}
            />
          )}
          <div>
            <h1
              style={{
                fontSize: "24pt",
                fontWeight: 300,
                margin: 0,
                letterSpacing: 1,
                lineHeight: 1.1,
              }}
            >
              {data.personal.fullName || "Nama Lengkap"}
            </h1>
            {data.personal.headline && (
              <p style={{ margin: "2px 0 0 0", color: "#666" }}>{data.personal.headline}</p>
            )}
            <p style={{ fontSize: "9.5pt", color: "#444", margin: "4px 0 0 0" }}>
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
        <hr style={{ border: 0, borderTop: "1px solid #ccc", margin: "8px 0 0" }} />
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
