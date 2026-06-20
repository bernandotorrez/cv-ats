import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Check, Palette } from "lucide-react";
import { TEMPLATES, type TemplateId } from "@/lib/cv-types";
import { previewData } from "@/components/site/TemplatePreview";

// Import semua template
import { BaliTemplate } from "./templates/BaliTemplate";
import { JakartaTemplate } from "./templates/JakartaTemplate";
import { MakassarTemplate } from "./templates/MakassarTemplate";
import { BandungTemplate } from "./templates/BandungTemplate";
import { MedanTemplate } from "./templates/MedanTemplate";
import { SemarangTemplate } from "./templates/SemarangTemplate";
import { SurabayaTemplate } from "./templates/SurabayaTemplate";
import { YogyaTemplate } from "./templates/YogyaTemplate";

// Template component mapping
const templateComponents = {
  bali: BaliTemplate,
  jakarta: JakartaTemplate,
  makassar: MakassarTemplate,
  bandung: BandungTemplate,
  medan: MedanTemplate,
  semarang: SemarangTemplate,
  surabaya: SurabayaTemplate,
  yogya: YogyaTemplate,
};

interface TemplateMeta {
  slug: string;
  name: string;
  description: string;
  is_premium: boolean;
  color: string;
}

interface Props {
  selected: string;
  onSelect: (id: TemplateId) => void;
  tier?: string;
  templates?: TemplateMeta[];
  allowedTemplates?: string[] | null; // null = all templates allowed
}

// Free templates: jakarta, bandung (tanpa badge)
const FREE_TEMPLATES = ["jakarta", "bandung"];

// Starter+ templates: medan, makassar, surabaya, yogya (badge "Starter")
const STARTER_TEMPLATES = ["medan", "makassar", "surabaya", "yogya"];

// Pro templates: semarang, bali (badge "Pro")
const PRO_TEMPLATES = ["semarang", "bali"];

export function TemplateGallery({
  selected,
  onSelect,
  tier = "free",
  templates,
  allowedTemplates,
}: Props) {
  const displayTemplates = templates?.length
    ? templates.map((t) => {
        const isPro = PRO_TEMPLATES.includes(t.slug);
        const isStarter = STARTER_TEMPLATES.includes(t.slug);
        // Check if template is allowed based on allowedTemplates array
        const isAllowed =
          allowedTemplates === null ||
          allowedTemplates === undefined ||
          allowedTemplates.includes(t.slug);
        const isLocked = !isAllowed;
        return {
          id: t.slug as TemplateId,
          name: t.name,
          description: t.description,
          isLocked,
          isPro,
          isStarter,
        };
      })
    : TEMPLATES.map((t) => {
        const isPro = PRO_TEMPLATES.includes(t.id);
        const isStarter = STARTER_TEMPLATES.includes(t.id);
        // Check if template is allowed based on allowedTemplates array
        const isAllowed =
          allowedTemplates === null ||
          allowedTemplates === undefined ||
          allowedTemplates.includes(t.id);
        const isLocked = !isAllowed;
        return {
          id: t.id,
          name: t.name,
          description: t.description,
          isLocked,
          isPro,
          isStarter,
        };
      });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {displayTemplates.map((t) => {
        const isFree = FREE_TEMPLATES.includes(t.id);
        const isSelected = selected === t.id;
        const TemplateComponent = templateComponents[t.id as keyof typeof templateComponents];
        const data = previewData[t.id as keyof typeof previewData];

        return (
          <button
            key={t.id}
            onClick={() => !t.isLocked && onSelect(t.id)}
            disabled={t.isLocked}
            className={`text-left group relative rounded-xl border-2 transition-all ${
              isSelected
                ? "border-primary shadow-md shadow-primary/10"
                : t.isLocked
                  ? "border-border opacity-70 cursor-not-allowed"
                  : "border-border hover:border-primary/50 hover:shadow-sm"
            }`}
            aria-label={`Template ${t.name}${t.isLocked ? " (Starter)" : ""}`}
          >
            {/* Preview Thumbnail - Actual Template */}
            <div className="h-40 rounded-t-[10px] overflow-hidden bg-white p-2">
              {TemplateComponent && data ? (
                <div
                  className="h-full w-full overflow-hidden rounded bg-white shadow-sm"
                  style={{
                    transform: "scale(0.45)",
                    transformOrigin: "top left",
                    width: "222%",
                    height: "222%",
                  }}
                >
                  <div style={{ padding: "8px", fontSize: "8px", lineHeight: 1.3 }}>
                    <TemplateComponent data={data} showHeader={true} />
                  </div>
                </div>
              ) : (
                <div className="h-full rounded bg-muted flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">{t.name}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm">{t.name}</span>
                {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
              {!isFree && (
                <Badge variant="secondary" className="mt-2 text-xs gap-1">
                  {t.isLocked ? <Lock className="h-3 w-3" /> : <Palette className="h-3 w-3" />}
                  {t.isPro ? "Pro" : t.isStarter ? "Starter" : "Premium"}
                </Badge>
              )}
            </div>

            {t.isLocked && (
              <div className="absolute inset-0 rounded-xl bg-background/50 flex items-center justify-center">
                <Lock className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
