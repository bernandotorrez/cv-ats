import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { CvPreview } from "@/components/cv/CvPreview";
import { cvPrintStyles } from "@/components/cv/CvPreview";
import { DownloadDropdown } from "@/components/cv/DownloadDropdown";
import { WhatsAppShare } from "@/components/share/WhatsAppShare";
import { TemplateGallery } from "@/components/cv/TemplateGallery";
import { TEMPLATES, type CvData, type TemplateId, emptyCv } from "@/lib/cv-types";
import { type CvUiLang } from "@/lib/cv-translations";
import { suggestSection, polishText, parseCvUpload, extractCvTextWithAi } from "@/lib/ai-functions";
import { AiChatPanel } from "@/components/cv/AiChatPanel";
import { AtsPreview } from "@/components/cv/AtsPreview";
import { LinkedInImport } from "@/components/cv/LinkedInImport";
import { GuidedMode } from "@/components/ai/guided-mode";
import { useAutosave } from "@/lib/hooks/use-autosave";
import { SuggestionPanel } from "@/components/ai/suggestion-panel";
import { AtsScoreWidget } from "@/components/ai/score-widget";
import { scoreCvLocally } from "@/lib/local-scoring";
import { EditorSkeleton } from "@/components/ui/skeleton-loading";
import { CvFileUpload } from "@/components/cv/CvFileUpload";
import { extractCvText, renderPdfToImages } from "@/lib/cv-text-extractor";

// New editor components
import {
  EditorToolbar,
  AiSuggestBtn,
  SectionCard,
  ListSectionCard,
  Field,
  TextareaField,
  TextAlignPicker,
  mutate,
  SectionsNav,
  getDefaultSections,
  PreviewToolbar,
} from "@/components/cv/editor";
import type { SectionDef, PreviewScale } from "@/components/cv/editor";

import {
  Plus,
  Trash2,
  Save,
  Loader2,
  Sparkles,
  MessageSquare,
  BarChart3,
  Wrench,
  Share2,
  Copy,
  Check,
  Palette,
  CheckCircle2,
  FileText,
  Eye,
  Upload,
  ExternalLink,
  Linkedin,
  Wand2,
  Star,
  Zap,
  Crown,
  Crosshair,
  User,
  Users,
  Pencil,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  Calendar,
  GraduationCap,
  ScrollText,
  BookOpen,
  Globe,
  Languages,
  Award,
  Trophy,
  Landmark,
  Link2,
  ShieldX,
  RefreshCw,
  LayoutGrid,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/cv/$id")({
  head: () =>
    buildSeo({
      title: "Edit CV — CV Pintar",
      description: "Editor CV.",
      path: "/cv",
      noindex: true,
    }),
  component: CvEditorPage,
});

const uid = () => Math.random().toString(36).slice(2, 10);
type SuggestSection = "summary" | "headline" | "experience" | "education" | "skills";
type EditorTab = "form" | "preview" | "score"; // mobile tabs

function CvEditorPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const search = Route.useSearch() as { guided?: string };
  const [title, setTitle] = useState("CV Baru");
  const [templateId, setTemplateId] = useState<TemplateId>("jakarta");
  const [targetRole, setTargetRole] = useState("");
  const [data, setData] = useState<CvData>(emptyCv);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<SuggestSection | null>(null);
  const [suggestionPanel, setSuggestionPanel] = useState<{
    section: SuggestSection;
    suggestions: Array<{ option: string; explanation: string }> | null;
    acceptedIndex: number | null;
    targetId: string | null;
  }>({ section: "summary", suggestions: null, acceptedIndex: null, targetId: null });
  const [chatOpen, setChatOpen] = useState(false);
  const [shareEnabled, setShareEnabled] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareGenerating, setShareGenerating] = useState(false);
  const shareInputRef = useRef<HTMLInputElement>(null);
  const [showLinkedInImport, setShowLinkedInImport] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showGuidedMode, setShowGuidedMode] = useState(search.guided === "true");
  const [showCvUpload, setShowCvUpload] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [cvUploadFile, setCvUploadFile] = useState<File | null>(null);
  const [cvUploadExtracting, setCvUploadExtracting] = useState(false);
  const [cvUploadParsing, setCvUploadParsing] = useState(false);
  const [cvUploadError, setCvUploadError] = useState<string | null>(null);
  const [userTier, setUserTier] = useState("free");
  const [cvLanguage, setCvLanguage] = useState<CvUiLang>("id");
  const [allowedTemplates, setAllowedTemplates] = useState<string[] | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "unsaved">("idle");

  // ─── 3-Panel Layout State ─────────────────────────────────────
  const [activeSection, setActiveSection] = useState("personal");
  const [sections, setSections] = useState<SectionDef[]>(getDefaultSections());
  const [previewScale, setPreviewScale] = useState<PreviewScale>(85);
  const [showNav, setShowNav] = useState(true);
  const [mobileTab, setMobileTab] = useState<EditorTab>("form");

  // ─── Auto-save ───────────────────────────────────────────────
  const saveCvToDb = useCallback(
    async (payload: unknown) => {
      const {
        title: pTitle,
        templateId: pTemplateId,
        data: pData,
        language: pLanguage,
      } = (payload as { title: string; templateId: string; data: CvData; language?: string }) || {};
      const finalTitle = pTitle ?? title;
      const finalTemplateId = pTemplateId ?? templateId;
      const finalData = pData ?? data;

      console.log("[Save CV] Sending to DB:", {
        id,
        title: finalTitle,
        templateId: finalTemplateId,
        personalName: finalData.personal?.fullName || "(empty)",
        experienceCount: finalData.experiences?.length || 0,
        educationCount: finalData.educations?.length || 0,
        skillsCount: finalData.skills?.length || 0,
      });

      setSaveStatus("saving");
      const { error, status } = await (supabase as any)
        .from("cvs")
        .update({
          title: finalTitle,
          template_id: finalTemplateId,
          data: finalData as any,
          language: pLanguage ?? cvLanguage,
        })
        .eq("id", id)
        .select();

      if (error) {
        console.error("[Save CV] ❌ DB Error:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          status,
        });
        setSaveStatus("unsaved");
        toast.error(`Gagal menyimpan: ${error.message || error.code}`, { id: "save-error" });
        return false;
      }

      console.log("[Save CV] ✅ Saved to DB successfully");
      setSaveStatus("saved");
      toast.dismiss("save-error");
      setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 3000);
      return true;
    },
    [cvLanguage, data, id, title, templateId],
  );

  // ─── Auto-save (onChange-triggered, debounced) ─────────────
  const { triggerSave } = useAutosave({
    onSave: saveCvToDb,
    delay: 2000,
    showToasts: false,
  });

  // Trigger debounced save whenever data changes
  useEffect(() => {
    if (!loading) triggerSave({ title, templateId, data, language: cvLanguage });
  }, [data, title, templateId, cvLanguage, loading, triggerSave]);

  useEffect(() => {
    (async () => {
      const { data: row, error } = await (supabase as any)
        .from("cvs")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        toast.error(error.message);
        return;
      }
      setTitle(row.title);
      setTemplateId(row.template_id as TemplateId);
      const cvData = { ...emptyCv, ...(row.data as unknown as CvData) };
      setData(cvData);
      setCvLanguage((row.language === "en" ? "en" : "id") as CvUiLang);
      setTargetRole(cvData.personal.headline || "");
      setShareEnabled(row.share_enabled ?? false);
      setShareToken(row.share_token ?? null);
      const { data: sub } = await (supabase as any)
        .from("user_subscriptions")
        .select("subscription_tiers!inner(slug, template_access_detail)")
        .eq("user_id", row.user_id)
        .eq("status", "active")
        .single();
      if (sub) {
        setUserTier(sub.subscription_tiers?.slug ?? "free");
        // Set allowed templates
        if (sub.subscription_tiers?.template_access_detail) {
          setAllowedTemplates(sub.subscription_tiers.template_access_detail);
        } else if (sub.subscription_tiers?.template_access_detail === null) {
          // null means all templates allowed (Pro tier)
          setAllowedTemplates(null);
        } else {
          // Fallback to free templates
          setAllowedTemplates(["jakarta", "bandung"]);
        }
      }
      setLoading(false);
    })();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await (supabase as any)
      .from("cvs")
      .update({ title, template_id: templateId, data: data as any, language: cvLanguage })
      .eq("id", id)
      .select();
    setSaving(false);
    if (error) {
      console.error("[Manual Save] ❌ Error:", error);
      return toast.error(`Gagal: ${error.message || error.code}`);
    }
    console.log("[Manual Save] ✅ Saved");
    toast.success("CV tersimpan");
  };

  const handleToggleShare = async () => {
    if (shareEnabled) {
      // Disable share
      setShareGenerating(true);
      await (supabase as any).from("cvs").update({ share_enabled: false }).eq("id", id);
      setShareEnabled(false);
      setShowShareDialog(false);
      setShareGenerating(false);
      toast.success("Link share dinonaktifkan");
      return;
    }

    // Enable share
    setShareGenerating(true);
    try {
      let token = shareToken;
      if (!token) {
        const { data: rpcData, error: rpcError } = await supabase.rpc("generate_share_token");
        if (rpcError) throw new Error(rpcError.message);
        token = rpcData as string;
        setShareToken(token);
      }

      const { error } = await (supabase as any)
        .from("cvs")
        .update({ share_enabled: true, share_token: token })
        .eq("id", id);
      if (error) throw new Error(error.message);

      setShareEnabled(true);
      setShowShareDialog(true);
      // Focus and select the link after dialog renders
      setTimeout(() => {
        shareInputRef.current?.select();
      }, 100);
    } catch (e: any) {
      toast.error(e.message || "Gagal mengaktifkan share");
      setShareEnabled(false);
    } finally {
      setShareGenerating(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!shareToken) return;
    const link = `https://cvpintar.web.id/share/${shareToken}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkedInImport = (imported: Partial<CvData>) => {
    const merged = { ...data, ...imported };
    if (imported.experiences?.length && data.experiences.length === 0)
      merged.experiences = imported.experiences as any;
    if (imported.educations?.length && data.educations.length === 0)
      merged.educations = imported.educations as any;
    if (imported.skills?.length && data.skills.length === 0) merged.skills = imported.skills as any;
    if (imported.languages?.length && data.languages.length === 0)
      merged.languages = imported.languages as any;
    if (imported.certificates?.length && data.certificates.length === 0)
      merged.certificates = imported.certificates as any;
    if ((imported as any).internships?.length && (data.internships?.length || 0) === 0)
      (merged as any).internships = (imported as any).internships;
    if ((imported as any).organizations?.length && (data.organizations?.length || 0) === 0)
      (merged as any).organizations = (imported as any).organizations;
    if (imported.personal) merged.personal = { ...data.personal, ...imported.personal };
    setData(merged as CvData);
    toast.success("Profil LinkedIn berhasil diimpor!");
  };

  const handleCvFileReady = (file: File) => {
    setCvUploadFile(file);
    setCvUploadError(null);
  };

  const handleCvUploadParse = async () => {
    if (!cvUploadFile) return;
    setCvUploadExtracting(true);
    setCvUploadError(null);
    try {
      const { text, fileType } = await extractCvText(cvUploadFile);
      const minChars = 50;
      let finalText = text;

      if (text.trim().length < minChars && fileType === "pdf") {
        toast.info("CV tampaknya berupa gambar. Mencoba ekstraksi dengan AI...");
        try {
          const images = await renderPdfToImages(cvUploadFile);
          if (images.length > 0) {
            const aiResult = await extractCvTextWithAi({
              data: { images, fileName: cvUploadFile.name },
            });
            const aiText = aiResult.text.trim();
            if (aiText.length >= minChars) {
              finalText = aiText;
              toast.success(
                `CV berhasil dibaca dengan AI OCR — ${aiText.length.toLocaleString()} karakter`,
              );
            } else {
              throw new Error("Teks hasil OCR terlalu sedikit");
            }
          }
        } catch (aiErr: any) {
          console.warn("AI OCR fallback gagal:", aiErr);
          setCvUploadExtracting(false);
          setCvUploadError(
            "CV ini tampaknya berupa gambar/scanned dan tidak bisa diekstrak teksnya. Gunakan CV berbasis teks (bukan hasil scan gambar).",
          );
          return;
        }
      }

      if (finalText.trim().length < minChars) {
        setCvUploadExtracting(false);
        setCvUploadError(
          "Teks yang diekstrak terlalu sedikit. Pastikan CV berisi teks yang cukup.",
        );
        return;
      }

      setCvUploadExtracting(false);
      setCvUploadParsing(true);

      const result = await parseCvUpload({ data: { rawText: finalText, language: cvLanguage } });
      const parsed = result.cvData as Partial<CvData>;

      // Merge with existing data (non-destructive)
      const merged = { ...data, ...parsed };
      if (
        parsed.experiences &&
        Array.isArray(parsed.experiences) &&
        parsed.experiences.length > 0
      ) {
        merged.experiences = parsed.experiences as any;
      }
      if (parsed.educations && Array.isArray(parsed.educations) && parsed.educations.length > 0) {
        merged.educations = parsed.educations as any;
      }
      if (parsed.skills && Array.isArray(parsed.skills) && parsed.skills.length > 0) {
        merged.skills = parsed.skills as any;
      }
      if (parsed.languages && Array.isArray(parsed.languages) && parsed.languages.length > 0) {
        merged.languages = parsed.languages as any;
      }
      if (
        parsed.certificates &&
        Array.isArray(parsed.certificates) &&
        parsed.certificates.length > 0
      ) {
        merged.certificates = parsed.certificates as any;
      }
      if (
        (parsed as any).internships &&
        Array.isArray((parsed as any).internships) &&
        (parsed as any).internships.length > 0
      ) {
        (merged as any).internships = (parsed as any).internships;
      }
      if (
        (parsed as any).organizations &&
        Array.isArray((parsed as any).organizations) &&
        (parsed as any).organizations.length > 0
      ) {
        (merged as any).organizations = (parsed as any).organizations;
      }
      if (parsed.personal) {
        merged.personal = { ...data.personal, ...parsed.personal };
      }

      setData(merged as CvData);
      setShowCvUpload(false);
      setCvUploadFile(null);
      toast.success("CV berhasil di-import!");
    } catch (e: any) {
      setCvUploadError(e.message || "Gagal membaca CV");
    } finally {
      setCvUploadExtracting(false);
      setCvUploadParsing(false);
    }
  };

  const updatePersonal = <K extends keyof CvData["personal"]>(k: K, v: CvData["personal"][K]) =>
    setData((d) => ({ ...d, personal: { ...d.personal, [k]: v } }));

  const handleAiSuggest = useCallback(
    async (
      section: SuggestSection,
      currentContent?: string,
      additionalContext?: string,
      regenerateIndex?: number,
      targetId?: string,
    ) => {
      setAiLoading(section);
      setSuggestionPanel({
        section,
        suggestions: null,
        acceptedIndex: null,
        targetId: targetId ?? null,
      });
      try {
        const result = await suggestSection({
          data: {
            cvId: id,
            section,
            targetRole: targetRole || undefined,
            currentContent: currentContent || undefined,
            additionalContext: additionalContext || undefined,
            regenerateIndex,
            language: cvLanguage,
          },
        });
        setSuggestionPanel({
          section,
          suggestions: result.suggestions,
          acceptedIndex: null,
          targetId: targetId ?? null,
        });
      } catch (e: any) {
        toast.error(e.message || "Gagal menghasilkan saran AI");
        return null;
      } finally {
        setAiLoading(null);
      }
    },
    [cvLanguage, id, targetRole],
  );

  const handleAcceptSuggestion = useCallback(
    (index: number, option: { option: string; explanation: string }) => {
      setSuggestionPanel((prev) => ({
        section: prev.section,
        suggestions: null,
        acceptedIndex: null,
        targetId: null,
      }));
      toast.success("Saran AI diterapkan");
      return option.option;
    },
    [],
  );

  const handleRegenerateSuggestion = useCallback(
    (index: number) => {
      const s = suggestionPanel.section;
      // Regenerate single option — pass regenerateIndex
      handleAiSuggest(s, undefined, undefined, index, suggestionPanel.targetId ?? undefined);
    },
    [suggestionPanel.section, suggestionPanel.targetId, handleAiSuggest],
  );

  const handleRegenerateAll = useCallback(() => {
    handleAiSuggest(
      suggestionPanel.section,
      undefined,
      undefined,
      undefined,
      suggestionPanel.targetId ?? undefined,
    );
  }, [suggestionPanel.section, suggestionPanel.targetId, handleAiSuggest]);

  const closeSuggestionPanel = useCallback(() => {
    setSuggestionPanel((prev) => ({
      ...prev,
      suggestions: null,
      acceptedIndex: null,
      targetId: null,
    }));
  }, []);

  const [polishingField, setPolishingField] = useState<string | null>(null);

  const handlePolishText = useCallback(
    async (fieldKey: string, text: string, context?: string) => {
      if (!text.trim() || text.trim().length < 5) {
        toast.error("Teks terlalu pendek untuk diperbaiki.");
        return;
      }
      setPolishingField(fieldKey);
      try {
        const result = await polishText({ data: { text, context, language: cvLanguage } });
        return result.polished;
      } catch (e: any) {
        toast.error(e.message || "Gagal memperbaiki teks.");
        return null;
      } finally {
        setPolishingField(null);
      }
    },
    [cvLanguage],
  );

  // Local/instant ATS score (recalculated on data change)
  const localScore = useMemo(
    () => scoreCvLocally(data, targetRole || undefined),
    [data, targetRole],
  );

  // Item counts per section for badge display
  const itemCounts = useMemo(
    () => ({
      personal: data.personal.fullName ? 1 : 0,
      education: data.educations.length,
      experience: data.experiences.length,
      internship: data.internships?.length || 0,
      organization: data.organizations?.length || 0,
      skills: data.skills.length,
      languages: data.languages?.length || 0,
      certificate: data.certificates?.length || 0,
      ats: localScore.overallScore,
    }),
    [data, localScore],
  );

  if (loading) return <EditorSkeleton />;

  return (
    <div className="cv-editor-page flex h-[calc(100vh-4rem)] min-h-0 flex-col bg-muted/30">
      <style>{cvPrintStyles}</style>
      {/* ─── TOOLBAR ─── */}
      <EditorToolbar
        id={id}
        title={title}
        onTitleChange={setTitle}
        targetRole={targetRole}
        onTargetRoleChange={setTargetRole}
        templateId={templateId}
        onOpenTemplatePicker={() => setShowTemplatePicker(!showTemplatePicker)}
        saveStatus={saveStatus}
        onSave={handleSave}
        saving={saving}
        shareEnabled={shareEnabled}
        shareGenerating={shareGenerating}
        onToggleShare={handleToggleShare}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen(!chatOpen)}
        showNav={showNav}
        onToggleNav={() => setShowNav(!showNav)}
        cvData={data}
        userTier={userTier}
        userId={user?.id}
        onOpenCvUpload={() => {
          setShowCvUpload(true);
          setCvUploadFile(null);
          setCvUploadError(null);
        }}
      />

      {/* Language Selector */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 print:hidden">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Editor CV ATS
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              Skor cepat: {localScore.overallScore}/100
            </span>
          </div>
          <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
            Rapikan isi, pilih bahasa, lalu cek preview sebelum dikirim ke rekruter.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="mr-1 text-xs font-medium text-muted-foreground">Bahasa CV</span>
          <Button
            variant={cvLanguage === "id" ? "default" : "outline"}
            size="sm"
            className="h-9 rounded-xl px-3 text-xs font-semibold"
            onClick={() => setCvLanguage("id")}
          >
            ID
          </Button>
          <Button
            variant={cvLanguage === "en" ? "default" : "outline"}
            size="sm"
            className="h-9 rounded-xl px-3 text-xs font-semibold"
            onClick={() => setCvLanguage("en")}
          >
            EN
          </Button>
        </div>
      </div>

      {/* ─── MAIN CONTENT: 2-Column Layout ─── */}
      <div className="flex flex-1 overflow-hidden print:block print:overflow-visible print:!visible">
        {/* Left Panel: Import + Accordion Sections */}
        <div
          className={cn(
            "hidden flex-col overflow-y-auto bg-background/80 print:hidden md:flex",
            showNav
              ? "w-[480px] shrink-0 border-r border-border"
              : "w-[520px] shrink-0 border-r border-border",
          )}
        >
          <div className="p-4 lg:p-5 space-y-4">
            {/* Import dari CV Lama */}
            <div className="rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-foreground">Import dari CV Lama</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    Upload PDF untuk mengisi profil otomatis dengan cepat.
                  </p>
                  <Button
                    size="sm"
                    className="mt-2 gap-1.5 rounded-xl"
                    onClick={() => {
                      setShowCvUpload(true);
                      setCvUploadFile(null);
                      setCvUploadError(null);
                    }}
                  >
                    <Upload className="h-3.5 w-3.5" /> Upload
                  </Button>
                </div>
              </div>
            </div>

            {/* Accordion Sections with Inline Forms */}
            <SectionsNav
              sections={sections}
              activeSection={activeSection}
              onSelectSection={setActiveSection}
              onReorderSections={setSections}
              onRemoveSection={(id) => {
                setSections((prev) => prev.filter((s) => s.id !== id));
                setActiveSection("personal");
                const label =
                  id === "internship"
                    ? "Riwayat Magang"
                    : id === "organization"
                      ? "Organisasi"
                      : "Sertifikat";
                toast.success(`Bagian ${label} dihapus`);
              }}
              itemCounts={itemCounts}
              renderSectionContent={(sectionId) => (
                <EditorForm
                  data={data}
                  setData={setData}
                  activeSection={sectionId}
                  setActiveSection={setActiveSection}
                  targetRole={targetRole}
                  aiLoading={aiLoading}
                  handleAiSuggest={handleAiSuggest}
                  handlePolishText={handlePolishText}
                  polishingField={polishingField}
                  updatePersonal={updatePersonal}
                  handleLinkedInImport={handleLinkedInImport}
                  suggestionPanel={suggestionPanel}
                  onAcceptSuggestion={handleAcceptSuggestion}
                  onRegenerateSuggestion={handleRegenerateSuggestion}
                  onRegenerateAll={handleRegenerateAll}
                  onCloseSuggestion={closeSuggestionPanel}
                  localScore={localScore}
                  cvLanguage={cvLanguage}
                />
              )}
            />

            {/* Tambah Bagian Button */}
            <button
              type="button"
              className="w-full rounded-2xl border-2 border-dashed border-border py-4 text-sm font-medium text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              onClick={() => setShowAddSection(true)}
            >
              <Plus className="mr-1.5 inline h-4 w-4" />
              Tambah Bagian
            </button>
          </div>
        </div>

        {/* Mobile: Form */}
        {mobileTab === "form" && (
          <div className="flex-1 overflow-y-auto bg-background/85 p-4 print:hidden md:hidden">
            <EditorForm
              data={data}
              setData={setData}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              targetRole={targetRole}
              aiLoading={aiLoading}
              handleAiSuggest={handleAiSuggest}
              handlePolishText={handlePolishText}
              polishingField={polishingField}
              updatePersonal={updatePersonal}
              handleLinkedInImport={handleLinkedInImport}
              suggestionPanel={suggestionPanel}
              onAcceptSuggestion={handleAcceptSuggestion}
              onRegenerateSuggestion={handleRegenerateSuggestion}
              onRegenerateAll={handleRegenerateAll}
              onCloseSuggestion={closeSuggestionPanel}
              localScore={localScore}
              cvLanguage={cvLanguage}
            />
          </div>
        )}

        {/* Right Panel: Preview */}
        <div
          className={cn(
            "flex flex-1 flex-col overflow-hidden print:flex print:overflow-visible print:!visible",
            mobileTab !== "preview" && "hidden md:flex",
          )}
        >
          {/* Preview Toolbar */}
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 py-3 print:hidden">
            <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Eye className="h-3.5 w-3.5" /> Preview live
            </span>
            <PreviewToolbar scale={previewScale} onChange={setPreviewScale} />
          </div>

          {/* Chat Panel */}
          {chatOpen && (
            <div className="shrink-0 print:hidden border-b border-border">
              <div className="p-3">
                <AiChatPanel cvId={id} cvData={data} language={cvLanguage} />
              </div>
            </div>
          )}

          {/* Preview Area */}
          <div className="flex-1 overflow-auto bg-muted/50 print:bg-white print:overflow-visible">
            <div className="cv-print-area flex justify-center p-4 sm:p-6 print:p-0">
              <div
                className="rounded-2xl border border-border bg-white shadow-xl shadow-slate-900/10 print:!h-auto print:!w-auto print:!min-w-0 print:!transform-none print:!rounded-none print:!border-0 print:!shadow-none"
                style={{
                  transform: `scale(${previewScale / 100})`,
                  transformOrigin: "top center",
                  width: "210mm",
                  minWidth: "210mm",
                }}
              >
                <div className="print:!transform-none print:!w-auto">
                  <CvPreview
                    data={data}
                    template={templateId}
                    sectionOrder={sections}
                    showWatermark={userTier === "free"}
                    language={cvLanguage}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: Score Tab */}
        {mobileTab === "score" && (
          <div className="flex-1 overflow-y-auto bg-background/85 p-4 print:hidden md:hidden">
            <AtsPreview data={data} />
            <div className="mt-4">
              <Button asChild variant="outline" size="sm" className="w-full gap-2">
                <Link to="/score/$cvId" params={{ cvId: id }}>
                  <BarChart3 className="h-4 w-4" /> Lihat Skor Lengkap
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─── FLOATING ATS SCORE CARD ─── */}
      <div className="fixed bottom-20 right-4 z-40 print:hidden md:bottom-6">
        <AtsScoreWidget
          overallScore={localScore.overallScore}
          breakdown={localScore.breakdown}
          suggestions={localScore.suggestions}
          compact
          className="w-72 shadow-xl shadow-slate-900/15 border-primary/20"
        />
      </div>

      {/* ─── MOBILE TAB BAR ─── */}
      <nav
        className="flex shrink-0 border-t border-border bg-background/95 shadow-[0_-4px_20px_rgba(15,23,42,0.08)] backdrop-blur-lg print:hidden md:hidden"
        aria-label="Navigasi editor mobile"
      >
        {[
          { id: "form" as EditorTab, icon: FileText, label: "Form" },
          { id: "preview" as EditorTab, icon: Eye, label: "Preview" },
          { id: "score" as EditorTab, icon: BarChart3, label: "Skor" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMobileTab(tab.id)}
            className={cn(
              "relative flex min-h-[64px] flex-1 flex-col items-center justify-center py-3 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
              mobileTab === tab.id
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-label={tab.label}
            aria-pressed={mobileTab === tab.id}
          >
            {mobileTab === tab.id && (
              <span className="absolute -top-px left-1/4 right-1/4 h-0.5 rounded-full bg-primary" />
            )}
            <span className="mb-0.5 text-base">
              <tab.icon className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-semibold">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* ─── DIALOGS ─── */}
      <Dialog open={showTemplatePicker} onOpenChange={setShowTemplatePicker}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Pilih Template</DialogTitle>
            <DialogDescription>
              Pilih template CV yang sesuai dengan gaya dan kebutuhanmu.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto -mx-6 px-6 py-2">
            <TemplateGallery
              selected={templateId}
              onSelect={(id) => {
                setTemplateId(id);
                setShowTemplatePicker(false);
              }}
              tier={userTier}
              allowedTemplates={allowedTemplates}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* LinkedIn Import Dialog */}
      <Dialog open={showLinkedInImport} onOpenChange={setShowLinkedInImport}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Linkedin className="h-5 w-5 text-blue-600" />
              Import dari LinkedIn
            </DialogTitle>
            <DialogDescription className="text-sm">
              Masukkan URL profil atau tempel teks LinkedIn, AI akan parse ke struktur CV.
            </DialogDescription>
          </DialogHeader>
          <LinkedInImport
            onImport={(imported) => {
              handleLinkedInImport(imported);
              setShowLinkedInImport(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Guided Mode Dialog */}
      <Dialog open={showGuidedMode} onOpenChange={setShowGuidedMode}>
        <DialogContent className="sm:max-w-2xl p-0 max-h-[90vh] overflow-hidden [&>button]:hidden">
          <GuidedMode
            cvId={id}
            cvData={data}
            onComplete={(result) => {
              setData((prev) => ({ ...prev, ...result }));
              setShowGuidedMode(false);
              toast.success("CV berhasil disusun! Review dan edit sebelum download.");
            }}
            onCancel={() => setShowGuidedMode(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Upload CV Dialog */}
      <Dialog
        open={showCvUpload}
        onOpenChange={(open) => {
          setShowCvUpload(open);
          if (!open) {
            setCvUploadFile(null);
            setCvUploadError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Upload className="h-5 w-5" />
              Upload CV yang Sudah Ada
            </DialogTitle>
            <DialogDescription className="text-sm">
              Upload CV kamu dalam format PDF atau DOCX. AI akan membaca dan mengisi data otomatis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <CvFileUpload
              onFileReady={handleCvFileReady}
              extracting={cvUploadExtracting}
              error={cvUploadError}
              currentFile={cvUploadFile}
              onClear={() => {
                setCvUploadFile(null);
                setCvUploadError(null);
              }}
            />
            <Button
              className="w-full gap-2"
              disabled={!cvUploadFile || cvUploadExtracting || cvUploadParsing}
              onClick={handleCvUploadParse}
            >
              {cvUploadParsing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> AI membaca CV...
                </>
              ) : cvUploadExtracting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Mengekstrak teks...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Parse & Isi CV
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tambah Bagian Dialog */}
      <Dialog open={showAddSection} onOpenChange={setShowAddSection}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary" />
              Tambah Bagian Baru
            </DialogTitle>
            <DialogDescription>
              Pilih bagian yang ingin ditambahkan ke CV kamu untuk melengkapi informasi.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            {/* Riwayat Magang */}
            {!sections.find((s) => s.id === "internship") && (
              <button
                type="button"
                onClick={() => {
                  const newSection = {
                    id: "internship",
                    label: "Riwayat Magang",
                    icon: <Building2 className="h-4 w-4" />,
                  };
                  const insertIndex = Math.max(0, sections.length - 1);
                  setSections((prev) => [
                    ...prev.slice(0, insertIndex),
                    newSection,
                    ...prev.slice(insertIndex),
                  ]);
                  setActiveSection("internship");
                  setShowAddSection(false);
                  toast.success("Bagian Riwayat Magang ditambahkan!");
                }}
                className="flex items-start gap-4 rounded-xl border border-border p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Riwayat Magang</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tambahkan pengalaman magang untuk menunjukkan keahlian praktis yang pernah kamu
                    dapatkan.
                  </p>
                </div>
              </button>
            )}

            {/* Organisasi */}
            {!sections.find((s) => s.id === "organization") && (
              <button
                type="button"
                onClick={() => {
                  const newSection = {
                    id: "organization",
                    label: "Organisasi",
                    icon: <Users className="h-4 w-4" />,
                  };
                  const insertIndex = Math.max(0, sections.length - 1);
                  setSections((prev) => [
                    ...prev.slice(0, insertIndex),
                    newSection,
                    ...prev.slice(insertIndex),
                  ]);
                  setActiveSection("organization");
                  setShowAddSection(false);
                  toast.success("Bagian Organisasi ditambahkan!");
                }}
                className="flex items-start gap-4 rounded-xl border border-border p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Organisasi</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tampilkan keterlibatan dalam organisasi untuk menunjukkan kemampuan kepemimpinan
                    dan kerja sama.
                  </p>
                </div>
              </button>
            )}

            {/* Sertifikat */}
            {!sections.find((s) => s.id === "certificate") && (
              <button
                type="button"
                onClick={() => {
                  const newSection = {
                    id: "certificate",
                    label: "Sertifikat",
                    icon: <Award className="h-4 w-4" />,
                  };
                  const insertIndex = Math.max(0, sections.length - 1);
                  setSections((prev) => [
                    ...prev.slice(0, insertIndex),
                    newSection,
                    ...prev.slice(insertIndex),
                  ]);
                  setActiveSection("certificate");
                  setShowAddSection(false);
                  toast.success("Bagian Sertifikat ditambahkan!");
                }}
                className="flex items-start gap-4 rounded-xl border border-border p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Sertifikat</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tampilkan sertifikasi dan penghargaan yang kamu miliki untuk memperkuat
                    kredibilitas.
                  </p>
                </div>
              </button>
            )}

            {/* Show message if all optional sections already added */}
            {sections.find((s) => s.id === "internship") &&
              sections.find((s) => s.id === "organization") &&
              sections.find((s) => s.id === "certificate") && (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-primary/50" />
                  <p className="text-sm">Semua bagian opsional sudah ditambahkan!</p>
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog
        open={showShareDialog}
        onOpenChange={(open) => {
          setShowShareDialog(open);
          if (!open) setCopied(false);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Link2 className="h-5 w-5 text-primary" />
              </span>
              <span>CV Siap Dibagikan!</span>
            </DialogTitle>
            <DialogDescription className="text-sm">
              Bagikan link ini agar orang lain bisa melihat CV kamu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <div className="flex items-center gap-2 rounded-2xl border-2 border-primary/20 bg-primary/5 p-1.5">
                <Input
                  ref={shareInputRef}
                  readOnly
                  value={`https://cvpintar.web.id/share/${shareToken || ""}`}
                  className="font-mono text-sm h-11 border-0 bg-transparent focus-visible:ring-0"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  size="sm"
                  className="h-10 gap-1.5 shrink-0 rounded-xl"
                  onClick={handleCopyShareLink}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Tersalin!" : "Salin"}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
              <span className="text-xs text-muted-foreground">📤 Bagikan via:</span>
              <div className="flex gap-2">
                <WhatsAppShare
                  shareUrl={`https://cvpintar.web.id/share/${shareToken || ""}`}
                  cvId={id}
                  fullName={data?.personal?.fullName}
                  size="sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-xl"
                  onClick={() =>
                    window.open(`https://cvpintar.web.id/share/${shareToken}`, "_blank")
                  }
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Buka
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground hover:text-destructive gap-1.5"
              onClick={() => handleToggleShare()}
            >
              <ShieldX className="h-4 w-4" /> Nonaktifkan Link Share
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── FORM PANEL ────────────────────────────────────────────────────────

function EditorForm({
  data,
  setData,
  activeSection,
  setActiveSection,
  targetRole,
  aiLoading,
  handleAiSuggest,
  handlePolishText,
  polishingField,
  updatePersonal,
  handleLinkedInImport,
  suggestionPanel,
  onAcceptSuggestion,
  onRegenerateSuggestion,
  onRegenerateAll,
  onCloseSuggestion,
  localScore,
  cvLanguage,
}: {
  data: CvData;
  setData: React.Dispatch<React.SetStateAction<CvData>>;
  activeSection: string;
  setActiveSection: (s: string) => void;
  targetRole: string;
  aiLoading: SuggestSection | null;
  handleAiSuggest: (
    section: SuggestSection,
    currentContent?: string,
    additionalContext?: string,
    regenerateIndex?: number,
    targetId?: string,
  ) => void;
  handlePolishText: (
    fieldKey: string,
    text: string,
    context?: string,
  ) => Promise<string | null | undefined>;
  polishingField: string | null;
  updatePersonal: <K extends keyof CvData["personal"]>(k: K, v: CvData["personal"][K]) => void;
  handleLinkedInImport: (imported: Partial<CvData>) => void;
  suggestionPanel: {
    section: SuggestSection;
    suggestions: Array<{ option: string; explanation: string }> | null;
    acceptedIndex: number | null;
    targetId: string | null;
  };
  onAcceptSuggestion: (index: number, option: { option: string; explanation: string }) => string;
  onRegenerateSuggestion: (index: number) => void;
  onRegenerateAll: () => void;
  onCloseSuggestion: () => void;
  localScore: {
    overallScore: number;
    breakdown: Record<string, number>;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  cvLanguage: CvUiLang;
}) {
  return (
    <div className="space-y-6">
      {/* Section Navigation for Mobile/Tablet */}
      <div
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 lg:hidden"
        aria-label="Pilih section CV"
      >
        {getDefaultSections(cvLanguage).map((s) => (
          <Button
            key={s.id}
            variant={activeSection === s.id ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-10 shrink-0 gap-1.5 rounded-xl px-3 text-xs font-semibold",
              activeSection !== s.id &&
                "border border-border/70 bg-background shadow-sm hover:bg-muted",
            )}
            onClick={() => setActiveSection?.(s.id)}
          >
            {s.icon}
            {s.label.split(" & ")[0]}
          </Button>
        ))}
      </div>

      {/* Personal */}
      {activeSection === "personal" && (
        <SectionCard
          title="Data Pribadi"
          icon={<User className="h-5 w-5" />}
          accentColor="from-blue-500/5 to-purple-500/5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nama Lengkap"
              value={data.personal.fullName}
              onChange={(v) => updatePersonal("fullName", v)}
              icon={<Pencil className="h-4 w-4" />}
            />
            <Field
              label="Posisi"
              value={data.personal.headline}
              onChange={(v) => updatePersonal("headline", v)}
              placeholder="Frontend Developer"
              extra={
                <AiSuggestBtn
                  loading={aiLoading === "headline"}
                  onClick={() => handleAiSuggest("headline", data.personal.headline)}
                />
              }
              icon={<Crosshair className="h-4 w-4" />}
            />
          </div>
          {suggestionPanel.section === "headline" && (
            <SuggestionPanel
              open={suggestionPanel.suggestions !== null}
              onClose={onCloseSuggestion}
              section="headline"
              loading={aiLoading === "headline"}
              suggestions={suggestionPanel.suggestions}
              acceptedIndex={suggestionPanel.acceptedIndex}
              onAccept={(i, opt) => {
                const accepted = onAcceptSuggestion(i, opt);
                updatePersonal("headline", accepted);
              }}
              onRegenerate={onRegenerateSuggestion}
              onRegenerateAll={onRegenerateAll}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Email"
              type="email"
              value={data.personal.email}
              onChange={(v) => updatePersonal("email", v)}
              icon={<Mail className="h-4 w-4" />}
            />
            <Field
              label="No. HP"
              value={data.personal.phone}
              onChange={(v) => updatePersonal("phone", v)}
              placeholder="+62..."
              icon={<Phone className="h-4 w-4" />}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Lokasi"
              value={data.personal.location}
              onChange={(v) => updatePersonal("location", v)}
              placeholder="Jakarta"
              icon={<MapPin className="h-4 w-4" />}
            />
            <Field
              label="LinkedIn"
              value={data.personal.linkedin ?? ""}
              onChange={(v) => updatePersonal("linkedin", v)}
              placeholder="linkedin.com/in/..."
              icon={<Linkedin className="h-4 w-4" />}
            />
          </div>

          <TextareaField
            label="Ringkasan Profil"
            value={data.personal.summary}
            onChange={(v) => updatePersonal("summary", v)}
            placeholder="2-4 kalimat ringkas tentang dirimu..."
            rows={4}
            maxLength={1000}
            hint="Tip: Fokus pada pencapaian & skill utama yang relevan dengan target posisi"
            icon={<FileText className="h-4 w-4" />}
            extra={
              <div className="flex items-center gap-1">
                <AiSuggestBtn
                  loading={aiLoading === "summary"}
                  onClick={() => handleAiSuggest("summary", data.personal.summary)}
                />
              </div>
            }
          />
          <TextAlignPicker
            value={data.personal.summaryAlign}
            onChange={(v) => updatePersonal("summaryAlign", v)}
          />

          {suggestionPanel.section === "summary" && (
            <SuggestionPanel
              open={suggestionPanel.suggestions !== null}
              onClose={onCloseSuggestion}
              section="summary"
              loading={aiLoading === "summary"}
              suggestions={suggestionPanel.suggestions}
              acceptedIndex={suggestionPanel.acceptedIndex}
              onAccept={(i, opt) => {
                const accepted = onAcceptSuggestion(i, opt);
                updatePersonal("summary", accepted);
              }}
              onRegenerate={onRegenerateSuggestion}
              onRegenerateAll={onRegenerateAll}
            />
          )}
        </SectionCard>
      )}

      {/* Experience */}
      {activeSection === "experience" && (
        <ListSectionCard
          title="Pengalaman Kerja"
          icon={<Briefcase className="h-5 w-5" />}
          items={data.experiences}
          accentColor="from-amber-500/5 to-orange-500/5"
          onAdd={() =>
            setData((d) => ({
              ...d,
              experiences: [
                ...d.experiences,
                {
                  id: uid(),
                  company: "",
                  position: "",
                  startDate: "",
                  endDate: "",
                  description: "",
                },
              ],
            }))
          }
          onRemove={(i) =>
            setData((d) => ({ ...d, experiences: d.experiences.filter((_, idx) => idx !== i) }))
          }
          renderItem={(item, i) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Posisi"
                value={item.position}
                onChange={(v) => mutate(setData, "experiences", i, "position", v)}
                icon={<Crosshair className="h-4 w-4" />}
              />
              <Field
                label="Perusahaan"
                value={item.company}
                onChange={(v) => mutate(setData, "experiences", i, "company", v)}
                icon={<Building2 className="h-4 w-4" />}
              />
              <Field
                label="Mulai"
                value={item.startDate}
                onChange={(v) => mutate(setData, "experiences", i, "startDate", v)}
                icon={<Calendar className="h-4 w-4" />}
              />
              <Field
                label="Selesai"
                value={item.endDate}
                onChange={(v) => mutate(setData, "experiences", i, "endDate", v)}
                disabled={item.current}
                icon={<Calendar className="h-4 w-4" />}
              />
              <label className="sm:col-span-2 flex items-center gap-2 text-sm rounded-xl bg-muted/50 px-3 py-2 cursor-pointer hover:bg-muted transition-colors">
                <Checkbox
                  checked={!!item.current}
                  onCheckedChange={(c) => mutate(setData, "experiences", i, "current", !!c)}
                />
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" /> Masih bekerja di sini
                </span>
              </label>
              <div className="sm:col-span-2 space-y-2">
                <TextareaField
                  label="Deskripsi"
                  value={item.description}
                  onChange={(v) => mutate(setData, "experiences", i, "description", v)}
                  placeholder="Deskripsikan pencapaian dengan metrik..."
                  rows={3}
                  hint="Tip: Gunakan kata kerja aktif & sertakan angka (contoh: meningkatkan penjualan 30%)"
                  icon={<FileText className="h-4 w-4" />}
                  extra={
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs rounded-lg text-muted-foreground hover:text-primary"
                        disabled={polishingField === `exp-${i}`}
                        onClick={async () => {
                          const result = await handlePolishText(
                            `exp-${i}`,
                            item.description,
                            `Posisi: ${item.position} di ${item.company}`,
                          );
                          if (result) mutate(setData, "experiences", i, "description", result);
                        }}
                      >
                        {polishingField === `exp-${i}` ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Wand2 className="h-3 w-3" />
                        )}
                        Perbaiki
                      </Button>
                      <AiSuggestBtn
                        loading={aiLoading === "experience"}
                        onClick={() =>
                          handleAiSuggest(
                            "experience",
                            item.description,
                            `Posisi: ${item.position} di ${item.company}`,
                            undefined,
                            item.id,
                          )
                        }
                      />
                    </div>
                  }
                />
                <TextAlignPicker
                  value={item.descriptionAlign}
                  onChange={(v) => mutate(setData, "experiences", i, "descriptionAlign", v)}
                />
                {suggestionPanel.section === "experience" &&
                  suggestionPanel.targetId === item.id && (
                    <SuggestionPanel
                      open={suggestionPanel.suggestions !== null}
                      onClose={onCloseSuggestion}
                      section="experience"
                      loading={aiLoading === "experience"}
                      suggestions={suggestionPanel.suggestions}
                      acceptedIndex={suggestionPanel.acceptedIndex}
                      onAccept={(idx, opt) => {
                        const accepted = onAcceptSuggestion(idx, opt);
                        mutate(setData, "experiences", i, "description", accepted);
                      }}
                      onRegenerate={onRegenerateSuggestion}
                      onRegenerateAll={onRegenerateAll}
                    />
                  )}
              </div>
            </div>
          )}
        />
      )}

      {/* Education */}
      {activeSection === "education" && (
        <ListSectionCard
          title="Pendidikan"
          icon={<GraduationCap className="h-5 w-5" />}
          items={data.educations}
          accentColor="from-emerald-500/5 to-green-500/5"
          onAdd={() =>
            setData((d) => ({
              ...d,
              educations: [
                ...d.educations,
                { id: uid(), school: "", degree: "", startDate: "", endDate: "" },
              ],
            }))
          }
          onRemove={(i) =>
            setData((d) => ({ ...d, educations: d.educations.filter((_, idx) => idx !== i) }))
          }
          renderItem={(item, i) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Sekolah/Universitas"
                value={item.school}
                onChange={(v) => mutate(setData, "educations", i, "school", v)}
                icon={<Building2 className="h-4 w-4" />}
              />
              <Field
                label="Gelar"
                value={item.degree}
                onChange={(v) => mutate(setData, "educations", i, "degree", v)}
                placeholder="S1"
                icon={<ScrollText className="h-4 w-4" />}
              />
              <Field
                label="Jurusan"
                value={item.field ?? ""}
                onChange={(v) => mutate(setData, "educations", i, "field", v)}
                icon={<BookOpen className="h-4 w-4" />}
              />
              <Field
                label="Mulai"
                value={item.startDate}
                onChange={(v) => mutate(setData, "educations", i, "startDate", v)}
                placeholder="2020"
                icon={<Calendar className="h-4 w-4" />}
              />
              <Field
                label="Selesai"
                value={item.endDate}
                onChange={(v) => mutate(setData, "educations", i, "endDate", v)}
                placeholder="2024"
                icon={<Calendar className="h-4 w-4" />}
              />
              <div className="sm:col-span-2 space-y-2">
                <TextareaField
                  label="Deskripsi"
                  value={item.description ?? ""}
                  onChange={(v) => mutate(setData, "educations", i, "description", v)}
                  rows={2}
                  extra={
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs rounded-lg text-muted-foreground hover:text-primary"
                        disabled={polishingField === `edu-${i}`}
                        onClick={async () => {
                          const result = await handlePolishText(
                            `edu-${i}`,
                            item.description || "",
                            `${item.degree} ${item.field || ""} di ${item.school}`,
                          );
                          if (result) mutate(setData, "educations", i, "description", result);
                        }}
                      >
                        {polishingField === `edu-${i}` ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Wand2 className="h-3 w-3" />
                        )}
                        Perbaiki
                      </Button>
                      <AiSuggestBtn
                        loading={aiLoading === "education"}
                        onClick={() =>
                          handleAiSuggest(
                            "education",
                            item.description || "",
                            `${item.degree} ${item.field || ""} di ${item.school}`,
                            undefined,
                            item.id,
                          )
                        }
                      />
                    </div>
                  }
                />
                <TextAlignPicker
                  value={item.descriptionAlign}
                  onChange={(v) => mutate(setData, "educations", i, "descriptionAlign", v)}
                />
                {suggestionPanel.section === "education" &&
                  suggestionPanel.targetId === item.id && (
                    <SuggestionPanel
                      open={suggestionPanel.suggestions !== null}
                      onClose={onCloseSuggestion}
                      section="education"
                      loading={aiLoading === "education"}
                      suggestions={suggestionPanel.suggestions}
                      acceptedIndex={suggestionPanel.acceptedIndex}
                      onAccept={(idx, opt) => {
                        const accepted = onAcceptSuggestion(idx, opt);
                        mutate(setData, "educations", i, "description", accepted);
                      }}
                      onRegenerate={onRegenerateSuggestion}
                      onRegenerateAll={onRegenerateAll}
                    />
                  )}
              </div>
            </div>
          )}
        />
      )}

      {/* Internship / Riwayat Magang */}
      {activeSection === "internship" && (
        <ListSectionCard
          title="Riwayat Magang"
          icon={<Building2 className="h-5 w-5" />}
          items={data.internships || []}
          accentColor="from-cyan-500/5 to-sky-500/5"
          onAdd={() =>
            setData((d) => ({
              ...d,
              internships: [
                ...(d.internships || []),
                {
                  id: uid(),
                  company: "",
                  position: "",
                  startDate: "",
                  endDate: "",
                  description: "",
                },
              ],
            }))
          }
          onRemove={(i) =>
            setData((d) => ({
              ...d,
              internships: (d.internships || []).filter((_, idx) => idx !== i),
            }))
          }
          renderItem={(item, i) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Posisi"
                value={item.position}
                onChange={(v) => mutate(setData, "internships", i, "position", v)}
                icon={<Crosshair className="h-4 w-4" />}
              />
              <Field
                label="Perusahaan"
                value={item.company}
                onChange={(v) => mutate(setData, "internships", i, "company", v)}
                icon={<Building2 className="h-4 w-4" />}
              />
              <Field
                label="Mulai"
                value={item.startDate}
                onChange={(v) => mutate(setData, "internships", i, "startDate", v)}
                icon={<Calendar className="h-4 w-4" />}
              />
              <Field
                label="Selesai"
                value={item.endDate}
                onChange={(v) => mutate(setData, "internships", i, "endDate", v)}
                icon={<Calendar className="h-4 w-4" />}
              />
              <div className="sm:col-span-2 space-y-2">
                <TextareaField
                  label="Deskripsi"
                  value={item.description}
                  onChange={(v) => mutate(setData, "internships", i, "description", v)}
                  placeholder="Deskripsikan tugas dan pencapaian selama magang..."
                  rows={3}
                  hint="Tip: Fokus pada skill yang dipelajari dan kontribusi yang diberikan"
                  icon={<FileText className="h-4 w-4" />}
                  extra={
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs rounded-lg text-muted-foreground hover:text-primary"
                        disabled={polishingField === `intern-${i}`}
                        onClick={async () => {
                          const result = await handlePolishText(
                            `intern-${i}`,
                            item.description,
                            `Magang: ${item.position} di ${item.company}`,
                          );
                          if (result) mutate(setData, "internships", i, "description", result);
                        }}
                      >
                        {polishingField === `intern-${i}` ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Wand2 className="h-3 w-3" />
                        )}
                        Perbaiki
                      </Button>
                    </div>
                  }
                />
                <TextAlignPicker
                  value={item.descriptionAlign}
                  onChange={(v) => mutate(setData, "internships", i, "descriptionAlign", v)}
                />
              </div>
            </div>
          )}
        />
      )}

      {/* Organization / Organisasi */}
      {activeSection === "organization" && (
        <ListSectionCard
          title="Organisasi"
          icon={<Users className="h-5 w-5" />}
          items={data.organizations || []}
          accentColor="from-pink-500/5 to-rose-500/5"
          onAdd={() =>
            setData((d) => ({
              ...d,
              organizations: [
                ...(d.organizations || []),
                {
                  id: uid(),
                  name: "",
                  role: "",
                  startDate: "",
                  endDate: "",
                  description: "",
                },
              ],
            }))
          }
          onRemove={(i) =>
            setData((d) => ({
              ...d,
              organizations: (d.organizations || []).filter((_, idx) => idx !== i),
            }))
          }
          renderItem={(item, i) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Nama Organisasi"
                value={item.name}
                onChange={(v) => mutate(setData, "organizations", i, "name", v)}
                icon={<Users className="h-4 w-4" />}
              />
              <Field
                label="Jabatan / Peran"
                value={item.role}
                onChange={(v) => mutate(setData, "organizations", i, "role", v)}
                icon={<Crosshair className="h-4 w-4" />}
              />
              <Field
                label="Mulai"
                value={item.startDate}
                onChange={(v) => mutate(setData, "organizations", i, "startDate", v)}
                icon={<Calendar className="h-4 w-4" />}
              />
              <Field
                label="Selesai"
                value={item.endDate}
                onChange={(v) => mutate(setData, "organizations", i, "endDate", v)}
                icon={<Calendar className="h-4 w-4" />}
              />
              <div className="sm:col-span-2 space-y-2">
                <TextareaField
                  label="Deskripsi"
                  value={item.description}
                  onChange={(v) => mutate(setData, "organizations", i, "description", v)}
                  placeholder="Deskripsikan peran dan pencapaian di organisasi..."
                  rows={3}
                  hint="Tip: Sertakan tanggung jawab utama dan dampak yang diberikan"
                  icon={<FileText className="h-4 w-4" />}
                  extra={
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs rounded-lg text-muted-foreground hover:text-primary"
                        disabled={polishingField === `org-${i}`}
                        onClick={async () => {
                          const result = await handlePolishText(
                            `org-${i}`,
                            item.description,
                            `Organisasi: ${item.role} di ${item.name}`,
                          );
                          if (result) mutate(setData, "organizations", i, "description", result);
                        }}
                      >
                        {polishingField === `org-${i}` ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Wand2 className="h-3 w-3" />
                        )}
                        Perbaiki
                      </Button>
                    </div>
                  }
                />
                <TextAlignPicker
                  value={item.descriptionAlign}
                  onChange={(v) => mutate(setData, "organizations", i, "descriptionAlign", v)}
                />
              </div>
            </div>
          )}
        />
      )}

      {/* Skills */}
      {activeSection === "skills" && (
        <ListSectionCard
          title="Keahlian"
          icon={<Wrench className="h-5 w-5" />}
          items={data.skills}
          compact
          accentColor="from-violet-500/5 to-purple-500/5"
          onAdd={() => setData((d) => ({ ...d, skills: [...d.skills, { id: uid(), name: "" }] }))}
          onRemove={(i) =>
            setData((d) => ({ ...d, skills: d.skills.filter((_, idx) => idx !== i) }))
          }
          onMoveUp={(i) => {
            if (i === 0) return;
            setData((d) => {
              const skills = [...d.skills];
              [skills[i - 1], skills[i]] = [skills[i], skills[i - 1]];
              return { ...d, skills };
            });
          }}
          onMoveDown={(i) => {
            setData((d) => {
              if (i >= d.skills.length - 1) return d;
              const skills = [...d.skills];
              [skills[i], skills[i + 1]] = [skills[i + 1], skills[i]];
              return { ...d, skills };
            });
          }}
          renderItem={(item, i) => (
            <Field
              label="Nama Skill"
              value={item.name}
              onChange={(v) => mutate(setData, "skills", i, "name", v)}
              placeholder="React, SQL, Komunikasi..."
              icon={<Zap className="h-4 w-4" />}
            />
          )}
          extraAction={
            <AiSuggestBtn
              loading={aiLoading === "skills"}
              onClick={() => handleAiSuggest("skills", data.skills.map((s) => s.name).join(", "))}
            />
          }
        />
      )}
      {activeSection === "skills" && suggestionPanel.section === "skills" && (
        <SuggestionPanel
          open={suggestionPanel.suggestions !== null}
          onClose={onCloseSuggestion}
          section="skills"
          loading={aiLoading === "skills"}
          suggestions={suggestionPanel.suggestions}
          acceptedIndex={suggestionPanel.acceptedIndex}
          onAccept={(i, opt) => {
            const accepted = onAcceptSuggestion(i, opt);
            // Support both comma-separated ("React, Node.js") and newline-separated formats
            const separator = accepted.includes("\n") ? "\n" : ",";
            const names = accepted
              .split(separator)
              .map((n: string) => n.trim())
              .filter(Boolean);
            setData((d) => ({
              ...d,
              skills: names.map((name) => ({ id: uid(), name, level: "Intermediate" as const })),
            }));
          }}
          onRegenerate={onRegenerateSuggestion}
          onRegenerateAll={onRegenerateAll}
        />
      )}

      {/* Languages / Bahasa */}
      {activeSection === "languages" && (
        <ListSectionCard
          title="Bahasa"
          icon={<Globe className="h-5 w-5" />}
          items={data.languages}
          compact
          accentColor="from-teal-500/5 to-cyan-500/5"
          onAdd={() =>
            setData((d) => ({
              ...d,
              languages: [...d.languages, { id: uid(), name: "", level: "Mahir" }],
            }))
          }
          onRemove={(i) =>
            setData((d) => ({ ...d, languages: d.languages.filter((_, idx) => idx !== i) }))
          }
          renderItem={(item, i) => (
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Bahasa"
                value={item.name}
                onChange={(v) => mutate(setData, "languages", i, "name", v)}
                icon={<Languages className="h-4 w-4" />}
              />
              <Field
                label="Level"
                value={item.level}
                onChange={(v) => mutate(setData, "languages", i, "level", v)}
                icon={<BarChart3 className="h-4 w-4" />}
              />
            </div>
          )}
        />
      )}

      {/* Certificate / Sertifikat (optional section) */}
      {activeSection === "certificate" && (
        <ListSectionCard
          title="Sertifikat"
          icon={<Award className="h-5 w-5" />}
          items={data.certificates}
          compact
          accentColor="from-rose-500/5 to-pink-500/5"
          onAdd={() =>
            setData((d) => ({
              ...d,
              certificates: [...d.certificates, { id: uid(), name: "", issuer: "", date: "" }],
            }))
          }
          onRemove={(i) =>
            setData((d) => ({ ...d, certificates: d.certificates.filter((_, idx) => idx !== i) }))
          }
          renderItem={(item, i) => (
            <div className="grid gap-3 sm:grid-cols-3">
              <Field
                label="Nama"
                value={item.name}
                onChange={(v) => mutate(setData, "certificates", i, "name", v)}
                icon={<Trophy className="h-4 w-4" />}
              />
              <Field
                label="Penerbit"
                value={item.issuer}
                onChange={(v) => mutate(setData, "certificates", i, "issuer", v)}
                icon={<Landmark className="h-4 w-4" />}
              />
              <Field
                label="Tanggal"
                value={item.date}
                onChange={(v) => mutate(setData, "certificates", i, "date", v)}
                icon={<Calendar className="h-4 w-4" />}
              />
            </div>
          )}
        />
      )}

      {/* ATS View */}
      {activeSection === "ats" && <AtsPreview data={data} />}
    </div>
  );
}
