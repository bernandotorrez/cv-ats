import { SectionCard } from "../SectionCard";
import { Field, TextareaField, TextAlignPicker } from "../EditorField";
import { AiSuggestBtn } from "../AiSuggestBtn";
import { SuggestionPanel } from "@/components/ai/suggestion-panel";
import type { CvData } from "@/lib/cv-types";
import {
  User, Pencil, Crosshair, Mail, Phone, MapPin, Linkedin, FileText,
} from "lucide-react";

export type SuggestSection = "summary" | "headline" | "experience" | "education" | "skills";

interface Props {
  data: CvData;
  updatePersonal: <K extends keyof CvData["personal"]>(k: K, v: CvData["personal"][K]) => void;
  aiLoading: SuggestSection | null;
  handleAiSuggest: (section: SuggestSection, currentContent?: string, additionalContext?: string, regenerateIndex?: number) => void;
  suggestionPanel: { section: SuggestSection; suggestions: Array<{ option: string; explanation: string }> | null; acceptedIndex: number | null };
  onAcceptSuggestion: (index: number, option: { option: string; explanation: string }) => string;
  onRegenerateSuggestion: (index: number) => void;
  onRegenerateAll: () => void;
  onCloseSuggestion: () => void;
}

export function PersonalSection(props: Props) {
  const { data, updatePersonal, aiLoading, handleAiSuggest, suggestionPanel, onAcceptSuggestion, onRegenerateSuggestion, onRegenerateAll, onCloseSuggestion } = props;

  return (
    <SectionCard title="Data Pribadi" icon={<User className="h-5 w-5" />} accentColor="from-blue-500/5 to-purple-500/5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama Lengkap" value={data.personal.fullName} onChange={(v) => updatePersonal("fullName", v)} icon={<Pencil className="h-4 w-4" />} />
        <Field label="Posisi / Headline" value={data.personal.headline} onChange={(v) => updatePersonal("headline", v)} placeholder="Frontend Developer"
          extra={<AiSuggestBtn loading={aiLoading === "headline"} onClick={() => handleAiSuggest("headline", data.personal.headline)} />}
          icon={<Crosshair className="h-4 w-4" />}
        />
      </div>
      {suggestionPanel.section === "headline" && (
        <SuggestionPanel
          open={suggestionPanel.suggestions !== null} onClose={onCloseSuggestion}
          section="headline" loading={aiLoading === "headline"}
          suggestions={suggestionPanel.suggestions} acceptedIndex={suggestionPanel.acceptedIndex}
          onAccept={(i, opt) => { const accepted = onAcceptSuggestion(i, opt); updatePersonal("headline", accepted); }}
          onRegenerate={onRegenerateSuggestion} onRegenerateAll={onRegenerateAll}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" type="email" value={data.personal.email} onChange={(v) => updatePersonal("email", v)} icon={<Mail className="h-4 w-4" />} />
        <Field label="No. HP" value={data.personal.phone} onChange={(v) => updatePersonal("phone", v)} placeholder="+62..." icon={<Phone className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Lokasi" value={data.personal.location} onChange={(v) => updatePersonal("location", v)} placeholder="Jakarta" icon={<MapPin className="h-4 w-4" />} />
        <Field label="LinkedIn" value={data.personal.linkedin ?? ""} onChange={(v) => updatePersonal("linkedin", v)} placeholder="linkedin.com/in/..." icon={<Linkedin className="h-4 w-4" />} />
      </div>

      <TextareaField
        label="Ringkasan Profil" value={data.personal.summary} icon={<FileText className="h-4 w-4" />}
        onChange={(v) => updatePersonal("summary", v)}
        placeholder="2-4 kalimat ringkas tentang dirimu..."
        rows={4} maxLength={1000}
        hint="Tip: Fokus pada pencapaian & skill utama yang relevan dengan target posisi"
        extra={
          <div className="flex items-center gap-1">
            <AiSuggestBtn loading={aiLoading === "summary"} onClick={() => handleAiSuggest("summary", data.personal.summary)} />
          </div>
        }
      />
      <TextAlignPicker value={data.personal.summaryAlign} onChange={(v) => updatePersonal("summaryAlign", v)} />

      {suggestionPanel.section === "summary" && (
        <SuggestionPanel
          open={suggestionPanel.suggestions !== null} onClose={onCloseSuggestion}
          section="summary" loading={aiLoading === "summary"}
          suggestions={suggestionPanel.suggestions} acceptedIndex={suggestionPanel.acceptedIndex}
          onAccept={(i, opt) => { const accepted = onAcceptSuggestion(i, opt); updatePersonal("summary", accepted); }}
          onRegenerate={onRegenerateSuggestion} onRegenerateAll={onRegenerateAll}
        />
      )}
    </SectionCard>
  );
}
