import { createFileRoute, Link } from "@tanstack/react-router";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { CvPreview } from "@/components/cv/CvPreview";
import { cvPrintStyles } from "@/components/cv/CvPreview";
import { DownloadDropdown } from "@/components/cv/DownloadDropdown";
import { WhatsAppShare } from "@/components/share/WhatsAppShare";
import { TemplateGallery } from "@/components/cv/TemplateGallery";
import { TEMPLATES, type CvData, type TemplateId, emptyCv } from "@/lib/cv-types";
import { suggestSection, polishText, parseCvUpload } from "@/lib/ai-functions";
import { AiChatPanel } from "@/components/cv/AiChatPanel";
import { AtsPreview } from "@/components/cv/AtsPreview";
import { LinkedInImport } from "@/components/cv/LinkedInImport";
import { GuidedMode } from "@/components/ai/guided-mode";
import { useAutosave } from "@/lib/hooks/use-autosave";
import { SectionsNav, DEFAULT_SECTIONS, type SectionDef } from "@/components/cv/editor/SectionsNav";
import { PreviewToolbar, type PreviewScale } from "@/components/cv/editor/PreviewToolbar";
import { SuggestionPanel } from "@/components/ai/suggestion-panel";
import { AtsScoreWidget } from "@/components/ai/score-widget";
import { scoreCvLocally } from "@/lib/local-scoring";
import { EditorSkeleton } from "@/components/ui/skeleton-loading";
import { CvFileUpload } from "@/components/cv/CvFileUpload";
import { extractCvText } from "@/lib/cv-text-extractor";
import {
  ArrowLeft, Plus, Trash2, Save, Loader2, Sparkles, MessageSquare,
  BarChart3, Wrench, Share2, Copy, Check, Import, Palette, Download,
  CheckCircle2, FileText, Eye, PanelLeftClose, PanelLeft, Linkedin, Upload, ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/cv/$id")({
  head: () => buildSeo({ title: "Edit CV — CV Pintar", description: "Editor CV.", path: "/cv", noindex: true }),
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
  }>({ section: "summary", suggestions: null, acceptedIndex: null });
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
  const [cvUploadFile, setCvUploadFile] = useState<File | null>(null);
  const [cvUploadExtracting, setCvUploadExtracting] = useState(false);
  const [cvUploadParsing, setCvUploadParsing] = useState(false);
  const [cvUploadError, setCvUploadError] = useState<string | null>(null);
  const [userTier, setUserTier] = useState("free");
  const [allowedTemplates, setAllowedTemplates] = useState<string[] | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "unsaved">("idle");

  // ─── 3-Panel Layout State ─────────────────────────────────────
  const [activeSection, setActiveSection] = useState("personal");
  const [sections, setSections] = useState<SectionDef[]>(DEFAULT_SECTIONS);
  const [previewScale, setPreviewScale] = useState<PreviewScale>(70);
  const [showNav, setShowNav] = useState(true);
  const [mobileTab, setMobileTab] = useState<EditorTab>("form");

  // ─── Auto-save ───────────────────────────────────────────────
  const saveCvToDb = useCallback(async (payload: unknown) => {
    const { title: pTitle, templateId: pTemplateId, data: pData } =
      (payload as { title: string; templateId: string; data: CvData }) || {};
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
  }, [id, title, templateId, data]);

  // ─── Auto-save (onChange-triggered, debounced) ─────────────
  const { triggerSave } = useAutosave({
    onSave: saveCvToDb,
    delay: 2000,
    showToasts: true,
  });

  // Trigger debounced save whenever data changes
  useEffect(() => {
    if (!loading) triggerSave({ title, templateId, data });
  }, [data, title, templateId, loading, triggerSave]);

  useEffect(() => {
    (async () => {
      const { data: row, error } = await (supabase as any)
        .from("cvs").select("*").eq("id", id).single();
      if (error) { toast.error(error.message); return; }
      setTitle(row.title);
      setTemplateId(row.template_id as TemplateId);
      const cvData = { ...emptyCv, ...(row.data as unknown as CvData) };
      setData(cvData);
      setTargetRole(cvData.personal.headline || "");
      setShareEnabled(row.share_enabled ?? false);
      setShareToken(row.share_token ?? null);
      const { data: sub } = await (supabase as any)
        .from("user_subscriptions")
        .select("subscription_tiers!inner(slug, template_access_detail)")
        .eq("user_id", row.user_id).eq("status", "active").single();
      if (sub) {
        setUserTier(sub.subscription_tiers?.slug ?? "free");
        // Set allowed templates
        if (sub.subscription_tiers?.template_access_detail) {
          setAllowedTemplates(sub.subscription_tiers.template_access_detail);
        } else if (sub.subscription_tiers?.template_access_detail === null) {
          // null means all templates allowed (Pro/Pro+ tier)
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
      .update({ title, template_id: templateId, data: data as any })
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
        .from("cvs").update({ share_enabled: true, share_token: token }).eq("id", id);
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
    if (imported.experiences?.length && data.experiences.length === 0) merged.experiences = imported.experiences as any;
    if (imported.educations?.length && data.educations.length === 0) merged.educations = imported.educations as any;
    if (imported.skills?.length && data.skills.length === 0) merged.skills = imported.skills as any;
    if (imported.languages?.length && data.languages.length === 0) merged.languages = imported.languages as any;
    if (imported.certificates?.length && data.certificates.length === 0) merged.certificates = imported.certificates as any;
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
      const { text } = await extractCvText(cvUploadFile);
      setCvUploadExtracting(false);
      setCvUploadParsing(true);

      const result = await parseCvUpload({ data: { rawText: text } });
      const parsed = result.cvData as Partial<CvData>;

      // Merge with existing data (non-destructive)
      const merged = { ...data, ...parsed };
      if (parsed.experiences && Array.isArray(parsed.experiences) && parsed.experiences.length > 0) {
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
      if (parsed.certificates && Array.isArray(parsed.certificates) && parsed.certificates.length > 0) {
        merged.certificates = parsed.certificates as any;
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
    async (section: SuggestSection, currentContent?: string, additionalContext?: string, regenerateIndex?: number) => {
      setAiLoading(section);
      setSuggestionPanel({ section, suggestions: null, acceptedIndex: null });
      try {
        const result = await suggestSection({
          data: { cvId: id, section, targetRole: targetRole || undefined, currentContent: currentContent || undefined, additionalContext: additionalContext || undefined, regenerateIndex },
        });
        setSuggestionPanel({ section, suggestions: result.suggestions, acceptedIndex: null });
      } catch (e: any) { toast.error(e.message || "Gagal menghasilkan saran AI"); return null; }
      finally { setAiLoading(null); }
    }, [id, targetRole]);

  const handleAcceptSuggestion = useCallback((index: number, option: { option: string; explanation: string }) => {
    setSuggestionPanel((prev) => ({ ...prev, acceptedIndex: index }));
    toast.success("Saran AI diterapkan");
    return option.option;
  }, []);

  const handleRegenerateSuggestion = useCallback((index: number) => {
    const s = suggestionPanel.section;
    // Regenerate single option — pass regenerateIndex
    handleAiSuggest(s, undefined, undefined, index);
  }, [suggestionPanel.section, handleAiSuggest]);

  const handleRegenerateAll = useCallback(() => {
    handleAiSuggest(suggestionPanel.section);
  }, [suggestionPanel.section, handleAiSuggest]);

  const closeSuggestionPanel = useCallback(() => {
    setSuggestionPanel((prev) => ({ ...prev, suggestions: null, acceptedIndex: null }));
  }, []);

  const [polishingField, setPolishingField] = useState<string | null>(null);

  const handlePolishText = useCallback(async (fieldKey: string, text: string, context?: string) => {
    if (!text.trim() || text.trim().length < 5) {
      toast.error("Teks terlalu pendek untuk diperbaiki.");
      return;
    }
    setPolishingField(fieldKey);
    try {
      const result = await polishText({ data: { text, context } });
      return result.polished;
    } catch (e: any) {
      toast.error(e.message || "Gagal memperbaiki teks.");
      return null;
    } finally {
      setPolishingField(null);
    }
  }, []);

  // Local/instant ATS score (recalculated on data change)
  const localScore = useMemo(() => scoreCvLocally(data, targetRole || undefined), [data, targetRole]);

  if (loading) return <EditorSkeleton />;

  const scaleStyle = { transform: `scale(${previewScale / 100})`, transformOrigin: "top left", width: `${210 / (previewScale / 100)}mm` };

  return (
    <div className="cv-editor-page h-[calc(100vh-4rem)] flex flex-col">
      <style>{cvPrintStyles}</style>
      {/* ─── TOOLBAR ─── */}
      <div className="shrink-0 border-b border-border bg-background/80 backdrop-blur sticky top-16 z-30 print:hidden">
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
          <Button asChild variant="ghost" size="sm"><Link to="/cv"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 max-w-[160px] text-sm" aria-label="Judul CV" />
          <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="h-8 max-w-[160px] text-sm" aria-label="Target Posisi" placeholder="Target Posisi..." />
          <Button variant="outline" size="sm" onClick={() => setShowTemplatePicker(!showTemplatePicker)} className="h-8 gap-1 text-xs">
            <Palette className="h-3.5 w-3.5" /> {TEMPLATES.find(t => t.id === templateId)?.name || "Template"}
          </Button>

          {/* Save Status */}
          <div className="flex items-center gap-1.5 text-xs ml-1">
            {saveStatus === "saving" && <><Loader2 className="h-3 w-3 animate-spin text-muted-foreground" /> <span className="text-muted-foreground">Menyimpan...</span></>}
            {saveStatus === "saved" && <><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> <span className="text-primary">Tersimpan</span></>}
            {saveStatus === "unsaved" && <span className="text-destructive">Gagal</span>}
          </div>

          {/* Desktop nav toggle */}
          <Button variant="ghost" size="sm" className="hidden lg:flex h-8 ml-auto" onClick={() => setShowNav(!showNav)} title="Toggle panel section">
            {showNav ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </Button>

          <div className="ml-auto lg:ml-0 flex gap-1.5 flex-wrap">
            {/* Share Button */}
            <Button
              variant={shareEnabled ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={handleToggleShare}
              disabled={shareGenerating}
            >
              {shareGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">
                {shareEnabled ? "Link Aktif" : "Bagikan"}
              </span>
            </Button>
            
            {/* LinkedIn Import Button */}
            {/* <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowLinkedInImport(true)}>
              <Linkedin className="h-3.5 w-3.5 text-blue-600" />
              <span className="hidden sm:inline">Import LinkedIn</span>
            </Button> */}

            {/* Upload CV Button */}
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => { setShowCvUpload(true); setCvUploadFile(null); setCvUploadError(null); }}>
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Upload CV</span>
            </Button>
            
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
              <Link to="/tools" search={{ cvId: id }}><Wrench className="h-3.5 w-3.5" /></Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
              <Link to="/score/$cvId" params={{ cvId: id }}><BarChart3 className="h-3.5 w-3.5" /></Link>
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setChatOpen(!chatOpen)}>
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>
            <DownloadDropdown cv={data} fileName={title} templateId={templateId} showWatermark={userTier === "free"} cvId={id} userId={user?.id} />
            <Button size="sm" className="h-8 text-xs" onClick={handleSave} disabled={saving || saveStatus === "saving"}>
              {saving || saveStatus === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Simpan
            </Button>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex-1 flex overflow-hidden print:block print:overflow-visible print:!visible">
        {/* Desktop: Sections Nav (3-panel) */}
        {showNav && (
          <aside className="hidden lg:block w-[250px] shrink-0 border-r border-border bg-card/50 overflow-y-auto p-3 print:hidden">
            <SectionsNav
              sections={sections}
              activeSection={activeSection}
              onSelectSection={setActiveSection}
              onReorderSections={setSections}
            />
          </aside>
        )}

        {/* Form Panel (Desktop + Tablet) */}
        <div className={cn("hidden md:flex flex-col overflow-y-auto print:hidden", showNav ? "lg:w-[420px] shrink-0 border-r border-border" : "lg:w-[480px] shrink-0")}>
          <div className="p-4">
            <EditorForm
              data={data} setData={setData} activeSection={activeSection} setActiveSection={setActiveSection}
              targetRole={targetRole} aiLoading={aiLoading} handleAiSuggest={handleAiSuggest}
              handlePolishText={handlePolishText} polishingField={polishingField}
              updatePersonal={updatePersonal}
              handleLinkedInImport={handleLinkedInImport}
              suggestionPanel={suggestionPanel} onAcceptSuggestion={handleAcceptSuggestion}
              onRegenerateSuggestion={handleRegenerateSuggestion} onRegenerateAll={handleRegenerateAll}
              onCloseSuggestion={closeSuggestionPanel} localScore={localScore}
            />
          </div>
        </div>

        {/* Mobile: Form */}
        {mobileTab === "form" && (
          <div className="md:hidden flex-1 overflow-y-auto p-4 print:hidden">
            <EditorForm
              data={data} setData={setData} activeSection={activeSection} setActiveSection={setActiveSection}
              targetRole={targetRole} aiLoading={aiLoading} handleAiSuggest={handleAiSuggest}
              handlePolishText={handlePolishText} polishingField={polishingField}
              updatePersonal={updatePersonal}
              handleLinkedInImport={handleLinkedInImport}
              suggestionPanel={suggestionPanel} onAcceptSuggestion={handleAcceptSuggestion}
              onRegenerateSuggestion={handleRegenerateSuggestion} onRegenerateAll={handleRegenerateAll}
              onCloseSuggestion={closeSuggestionPanel} localScore={localScore}
            />
          </div>
        )}

        {/* Preview Panel (Desktop + Tablet + Mobile preview tab) */}
        <div className={cn("flex-1 flex flex-col overflow-hidden print:flex print:overflow-visible print:!visible", mobileTab !== "preview" && "hidden md:flex")}>
          {/* Preview Toolbar */}
          <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30 print:hidden">
            <span className="text-xs text-muted-foreground flex items-center gap-2">
              <Eye className="h-3.5 w-3.5" /> Preview CV
            </span>
            <PreviewToolbar scale={previewScale} onChange={setPreviewScale} />
          </div>

          {/* Chat Panel */}
          {chatOpen && (
            <div className="shrink-0 print:hidden border-b border-border">
              <div className="p-3">
                <AiChatPanel cvId={id} cvData={data} />
              </div>
            </div>
          )}

          {/* Preview Area */}
          <div className="flex-1 overflow-auto bg-muted/40 print:bg-white print:overflow-visible">
            <div className="cv-print-area flex justify-center p-4 print:p-0">
              <div
                className="rounded-lg border border-border bg-white shadow-lg print:!shadow-none print:!border-0 print:!rounded-none print:!transform-none print:!w-auto print:!h-auto print:!min-w-0"
                style={{
                  transform: `scale(${previewScale / 100})`,
                  transformOrigin: "top center",
                  width: "210mm",
                  minWidth: "210mm",
                  ...(previewScale < 100 ? { height: `${297 * (previewScale / 100)}mm` } : {}),
                }}
              >
                <div className="print:!transform-none print:!w-auto">
                  <CvPreview data={data} template={templateId} sectionOrder={sections} showWatermark={userTier === "free"} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: Score Tab */}
        {mobileTab === "score" && (
          <div className="md:hidden flex-1 overflow-y-auto p-4 print:hidden">
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

      {/* ─── MOBILE TAB BAR ─── */}
      <nav className="md:hidden shrink-0 border-t border-border bg-background flex print:hidden" aria-label="Navigasi editor mobile">
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
              "flex-1 flex flex-col items-center justify-center py-2 text-xs transition-colors",
              mobileTab === tab.id
                ? "text-primary border-t-2 border-primary -mt-px"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-label={tab.label}
            aria-pressed={mobileTab === tab.id}
          >
            <tab.icon className="h-4 w-4 mb-0.5" />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ─── DIALOGS ─── */}
      <Dialog open={showTemplatePicker} onOpenChange={setShowTemplatePicker}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Pilih Template</DialogTitle>
            <DialogDescription>Pilih template CV yang sesuai dengan gaya dan kebutuhanmu.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto -mx-6 px-6 py-2">
            <TemplateGallery
              selected={templateId}
              onSelect={(id) => { setTemplateId(id); setShowTemplatePicker(false); }}
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
      <Dialog open={showCvUpload} onOpenChange={(open) => { setShowCvUpload(open); if (!open) { setCvUploadFile(null); setCvUploadError(null); } }}>
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
              onClear={() => { setCvUploadFile(null); setCvUploadError(null); }}
            />
            <Button
              className="w-full gap-2"
              disabled={!cvUploadFile || cvUploadExtracting || cvUploadParsing}
              onClick={handleCvUploadParse}
            >
              {cvUploadParsing ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> AI membaca CV...</>
              ) : cvUploadExtracting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Mengekstrak teks...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Parse & Isi CV</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={(open) => { setShowShareDialog(open); if (!open) setCopied(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Share2 className="h-5 w-5 text-primary" />
              Link CV Siap Dibagikan
            </DialogTitle>
            <DialogDescription className="text-sm">
              Bagikan link ini agar orang lain bisa melihat CV kamu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                ref={shareInputRef}
                readOnly
                value={`https://cvpintar.web.id/share/${shareToken || ""}`}
                className="font-mono text-sm h-10"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button size="sm" className="h-10 gap-1.5 shrink-0" onClick={handleCopyShareLink}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Tersalin" : "Salin"}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Bagikan via:</span>
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
                  className="gap-1"
                  onClick={() => window.open(`https://cvpintar.web.id/share/${shareToken}`, "_blank")}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Buka
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => handleToggleShare()}
            >
              Nonaktifkan Link Share
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── FORM PANEL ────────────────────────────────────────────────────────

function EditorForm({
  data, setData, activeSection, setActiveSection, targetRole, aiLoading, handleAiSuggest,
  handlePolishText, polishingField,
  updatePersonal, handleLinkedInImport,
  suggestionPanel, onAcceptSuggestion, onRegenerateSuggestion, onRegenerateAll, onCloseSuggestion,
  localScore,
}: {
  data: CvData; setData: React.Dispatch<React.SetStateAction<CvData>>;
  activeSection: string; setActiveSection: (s: string) => void; targetRole: string;
  aiLoading: SuggestSection | null;
  handleAiSuggest: (section: SuggestSection, currentContent?: string, additionalContext?: string, regenerateIndex?: number) => void;
  handlePolishText: (fieldKey: string, text: string, context?: string) => Promise<string | null>;
  polishingField: string | null;
  updatePersonal: <K extends keyof CvData["personal"]>(k: K, v: CvData["personal"][K]) => void;
  handleLinkedInImport: (imported: Partial<CvData>) => void;
  suggestionPanel: { section: SuggestSection; suggestions: Array<{ option: string; explanation: string }> | null; acceptedIndex: number | null };
  onAcceptSuggestion: (index: number, option: { option: string; explanation: string }) => string;
  onRegenerateSuggestion: (index: number) => void;
  onRegenerateAll: () => void;
  onCloseSuggestion: () => void;
  localScore: { overallScore: number; breakdown: Record<string, number>; strengths: string[]; weaknesses: string[]; suggestions: string[] };
}) {
  return (
    <div className="space-y-6">
      {/* Section Navigation for Mobile/Tablet */}
      <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
        {DEFAULT_SECTIONS.map((s) => (
          <Button
            key={s.id}
            variant={activeSection === s.id ? "default" : "ghost"}
            size="sm"
            className="h-8 text-xs shrink-0 gap-1.5"
            onClick={() => setActiveSection?.(s.id)}
          >
            {s.icon}
            {s.label.split(" & ")[0]}
          </Button>
        ))}
      </div>

      {/* Personal */}
      {activeSection === "personal" && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Data Pribadi</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Field label="Nama Lengkap" value={data.personal.fullName} onChange={(v) => updatePersonal("fullName", v)} />
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Posisi / Headline</Label>
                <AiSuggestBtn loading={aiLoading === "headline"} onClick={() => handleAiSuggest("headline", data.personal.headline)} />
              </div>
              <Input value={data.personal.headline} onChange={(e) => updatePersonal("headline", e.target.value)} placeholder="Frontend Developer" />
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
            </div>
            <Field label="Email" type="email" value={data.personal.email} onChange={(v) => updatePersonal("email", v)} />
            <Field label="No. HP" value={data.personal.phone} onChange={(v) => updatePersonal("phone", v)} placeholder="+62..." />
            <Field label="Lokasi" value={data.personal.location} onChange={(v) => updatePersonal("location", v)} placeholder="Jakarta" />
            <Field label="LinkedIn" value={data.personal.linkedin ?? ""} onChange={(v) => updatePersonal("linkedin", v)} placeholder="linkedin.com/in/..." />
            <div className="sm:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Ringkasan Profil</Label>
                <AiSuggestBtn loading={aiLoading === "summary"} onClick={() => handleAiSuggest("summary", data.personal.summary)} />
              </div>
              <Textarea rows={4} maxLength={1000} value={data.personal.summary}
                onChange={(e) => updatePersonal("summary", e.target.value)}
                placeholder="2-4 kalimat ringkas tentang dirimu..." />
              <TextAlignPicker value={data.personal.summaryAlign} onChange={(v) => updatePersonal("summaryAlign", v)} />
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Experience */}
      {activeSection === "experience" && (
        <ListSection
          title="Pengalaman Kerja"
          items={data.experiences}
          onAdd={() => setData((d) => ({ ...d, experiences: [...d.experiences, { id: uid(), company: "", position: "", startDate: "", endDate: "", description: "" }] }))}
          onRemove={(i) => setData((d) => ({ ...d, experiences: d.experiences.filter((_, idx) => idx !== i) }))}
          renderItem={(item, i) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Posisi" value={item.position} onChange={(v) => mutate(setData, "experiences", i, "position", v)} />
              <Field label="Perusahaan" value={item.company} onChange={(v) => mutate(setData, "experiences", i, "company", v)} />
              <Field label="Mulai" value={item.startDate} onChange={(v) => mutate(setData, "experiences", i, "startDate", v)} />
              <Field label="Selesai" value={item.endDate} onChange={(v) => mutate(setData, "experiences", i, "endDate", v)} disabled={item.current} />
              <label className="sm:col-span-2 flex items-center gap-2 text-sm"><Checkbox checked={!!item.current} onCheckedChange={(c) => mutate(setData, "experiences", i, "current", !!c)} /> Masih bekerja di sini</label>
              <div className="sm:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between"><Label>Deskripsi</Label>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs gap-1 text-secondary-foreground hover:text-primary"
                      disabled={polishingField === `exp-${i}`}
                      onClick={async () => {
                        const result = await handlePolishText(`exp-${i}`, item.description, `Posisi: ${item.position} di ${item.company}`);
                        if (result) mutate(setData, "experiences", i, "description", result);
                      }}
                    >
                      {polishingField === `exp-${i}` ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      Perbaiki
                    </Button>
                    <AiSuggestBtn loading={aiLoading === "experience"} onClick={() => handleAiSuggest("experience", item.description, `Posisi: ${item.position} di ${item.company}`)} />
                  </div>
                </div>
                <Textarea rows={3} value={item.description} onChange={(e) => mutate(setData, "experiences", i, "description", e.target.value)} placeholder="Deskripsikan pencapaian dengan metrik..." />
                <TextAlignPicker value={item.descriptionAlign} onChange={(v) => mutate(setData, "experiences", i, "descriptionAlign", v)} />
                {suggestionPanel.section === "experience" && (
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
        <ListSection
          title="Pendidikan"
          items={data.educations}
          onAdd={() => setData((d) => ({ ...d, educations: [...d.educations, { id: uid(), school: "", degree: "", startDate: "", endDate: "" }] }))}
          onRemove={(i) => setData((d) => ({ ...d, educations: d.educations.filter((_, idx) => idx !== i) }))}
          renderItem={(item, i) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Sekolah/Universitas" value={item.school} onChange={(v) => mutate(setData, "educations", i, "school", v)} />
              <Field label="Gelar" value={item.degree} onChange={(v) => mutate(setData, "educations", i, "degree", v)} placeholder="S1" />
              <Field label="Jurusan" value={item.field ?? ""} onChange={(v) => mutate(setData, "educations", i, "field", v)} />
              <Field label="Mulai" value={item.startDate} onChange={(v) => mutate(setData, "educations", i, "startDate", v)} />
              <Field label="Selesai" value={item.endDate} onChange={(v) => mutate(setData, "educations", i, "endDate", v)} />
              <div className="sm:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between"><Label>Deskripsi</Label>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs gap-1 text-secondary-foreground hover:text-primary"
                      disabled={polishingField === `edu-${i}`}
                      onClick={async () => {
                        const result = await handlePolishText(`edu-${i}`, item.description || "", `${item.degree} ${item.field || ""} di ${item.school}`);
                        if (result) mutate(setData, "educations", i, "description", result);
                      }}
                    >
                      {polishingField === `edu-${i}` ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      Perbaiki
                    </Button>
                    <AiSuggestBtn loading={aiLoading === "education"} onClick={() => handleAiSuggest("education", item.description || "", `${item.degree} ${item.field || ""} di ${item.school}`)} />
                  </div>
                </div>
                <Textarea rows={2} value={item.description ?? ""} onChange={(e) => mutate(setData, "educations", i, "description", e.target.value)} />
                <TextAlignPicker value={item.descriptionAlign} onChange={(v) => mutate(setData, "educations", i, "descriptionAlign", v)} />
                {suggestionPanel.section === "education" && (
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

      {/* Skills */}
      {activeSection === "skills" && (
        <ListSection
          title="Keahlian" items={data.skills} compact
          onAdd={() => setData((d) => ({ ...d, skills: [...d.skills, { id: uid(), name: "" }] }))}
          onRemove={(i) => setData((d) => ({ ...d, skills: d.skills.filter((_, idx) => idx !== i) }))}
          renderItem={(item, i) => (
            <Field label="Nama Skill" value={item.name} onChange={(v) => mutate(setData, "skills", i, "name", v)} placeholder="React, SQL, Komunikasi..." />
          )}
          extraAction={
            <AiSuggestBtn loading={aiLoading === "skills"} onClick={() => handleAiSuggest("skills", data.skills.map((s) => s.name).join(", "))} />
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
            const names = accepted.split("\n").filter(Boolean).map((n: string) => n.trim());
            setData((d) => ({ ...d, skills: names.map((name) => ({ id: uid(), name, level: "Intermediate" as const })) }));
          }}
          onRegenerate={onRegenerateSuggestion}
          onRegenerateAll={onRegenerateAll}
        />
      )}

      {/* Extras */}
      {activeSection === "extras" && (
        <div className="space-y-6">
          <ListSection
            title="Bahasa" items={data.languages} compact
            onAdd={() => setData((d) => ({ ...d, languages: [...d.languages, { id: uid(), name: "", level: "Mahir" }] }))}
            onRemove={(i) => setData((d) => ({ ...d, languages: d.languages.filter((_, idx) => idx !== i) }))}
            renderItem={(item, i) => (
              <div className="grid grid-cols-2 gap-2">
                <Field label="Bahasa" value={item.name} onChange={(v) => mutate(setData, "languages", i, "name", v)} />
                <Field label="Level" value={item.level} onChange={(v) => mutate(setData, "languages", i, "level", v)} />
              </div>
            )}
          />
          <ListSection
            title="Sertifikat" items={data.certificates} compact
            onAdd={() => setData((d) => ({ ...d, certificates: [...d.certificates, { id: uid(), name: "", issuer: "", date: "" }] }))}
            onRemove={(i) => setData((d) => ({ ...d, certificates: d.certificates.filter((_, idx) => idx !== i) }))}
            renderItem={(item, i) => (
              <div className="grid gap-2 sm:grid-cols-3">
                <Field label="Nama" value={item.name} onChange={(v) => mutate(setData, "certificates", i, "name", v)} />
                <Field label="Penerbit" value={item.issuer} onChange={(v) => mutate(setData, "certificates", i, "issuer", v)} />
                <Field label="Tanggal" value={item.date} onChange={(v) => mutate(setData, "certificates", i, "date", v)} />
              </div>
            )}
          />
        </div>
      )}

      {/* ATS View */}
      {activeSection === "ats" && (
        <AtsPreview data={data} />
      )}

      {/* Local Score Widget — always visible in form panel */}
      <AtsScoreWidget
        overallScore={localScore.overallScore}
        breakdown={localScore.breakdown}
        suggestions={localScore.suggestions}
        compact
        className="mt-6"
      />
    </div>
  );
}

// ─── SUB-COMPONENTS ─────────────────────────────────────────────────────

function AiSuggestBtn({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} disabled={loading}
      className="h-7 gap-1 text-xs text-secondary-foreground hover:text-primary">
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Sarankan AI
    </Button>
  );
}

type TextAlign = "left" | "center" | "right" | "justify";

function TextAlignPicker({ value, onChange }: { value?: TextAlign; onChange: (v: TextAlign) => void }) {
  const options: { value: TextAlign; label: string }[] = [
    { value: "left", label: "Kiri" },
    { value: "center", label: "Tengah" },
    { value: "right", label: "Kanan" },
    { value: "justify", label: "Rata" },
  ];
  return (
    <div className="flex items-center gap-1">
      <Label className="text-xs text-muted-foreground mr-1">Rata teks:</Label>
      <div className="flex gap-0.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-1.5 py-0.5 text-[11px] rounded border transition-colors font-medium",
              value === opt.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:bg-muted text-muted-foreground"
            )}
            title={opt.label}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="inline-block align-middle mr-0.5">
              {opt.value === "left" && <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" /></>}
              {opt.value === "center" && <><line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></>}
              {opt.value === "right" && <><line x1="3" y1="6" x2="21" y2="6" /><line x1="9" y1="12" x2="21" y2="12" /><line x1="6" y1="18" x2="21" y2="18" /></>}
              {opt.value === "justify" && <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>}
            </svg>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, className, disabled }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; className?: string; disabled?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} />
    </div>
  );
}

function ListSection<T>({ title, items, onAdd, onRemove, renderItem, compact, extraAction }: {
  title: string; items: T[]; onAdd: () => void; onRemove: (i: number) => void;
  renderItem: (item: T, i: number) => React.ReactNode; compact?: boolean;
  extraAction?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {extraAction}
          <Button size="sm" variant="outline" onClick={onAdd}><Plus className="h-4 w-4" /> Tambah</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 && <p className="text-sm text-muted-foreground">Belum ada data.</p>}
        {items.map((item, i) => (
          <div key={(item as any).id ?? i} className={`rounded-lg border border-border p-4 ${compact ? "" : "bg-muted/30"}`}>
            <div className="mb-3 flex justify-end">
              <Button size="sm" variant="ghost" onClick={() => onRemove(i)} aria-label="Hapus"><Trash2 className="h-4 w-4" /></Button>
            </div>
            {renderItem(item, i)}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function mutate<K extends keyof CvData>(setData: React.Dispatch<React.SetStateAction<CvData>>, key: K, index: number, field: string, value: unknown) {
  setData((d) => {
    const arr = [...(d[key] as any[])];
    arr[index] = { ...arr[index], [field]: value };
    return { ...d, [key]: arr } as CvData;
  });
}
