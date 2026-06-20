import type { CvData } from "@/lib/cv-types";
import type { CvUiLang } from "@/lib/cv-translations";
import type { SectionDef } from "../editor/SectionsNav";
import { JakartaTemplate } from "./JakartaTemplate";

interface Props {
  data: CvData;
  sectionOrder?: SectionDef[];
  language?: CvUiLang;
}

export function SurabayaTemplate({ data, sectionOrder, language = "id" }: Props) {
  return (
    <div>
      <header style={{ borderLeft: "6px solid #468432", paddingLeft: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15, marginBottom: 4 }}>
          {data.personal.photoUrl && (
            <img
              src={data.personal.photoUrl}
              alt="Profile"
              style={{
                width: 45,
                height: 45,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          )}
          <div>
            <h1 style={{ fontSize: "22pt", fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
              {data.personal.fullName || "Nama Lengkap"}
            </h1>
            {data.personal.headline && (
              <p style={{ margin: "2px 0 0 0", color: "#468432", fontWeight: 600 }}>
                {data.personal.headline}
              </p>
            )}
          </div>
        </div>
        <p style={{ fontSize: "9.5pt", color: "#444", margin: "4px 0" }}>
          {[
            data.personal.email,
            data.personal.phone,
            data.personal.location,
            data.personal.linkedin,
          ]
            .filter(Boolean)
            .join(" • ")}
        </p>
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
