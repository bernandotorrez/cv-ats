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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useCheckout } from "@/lib/payment";
import { CvPreview } from "@/components/cv/CvPreview";
import { cvPrintStyles } from "@/components/cv/CvPreview";
import { DownloadDropdown } from "@/components/cv/DownloadDropdown";
import { WhatsAppShare } from "@/components/share/WhatsAppShare";
import { TemplateGallery } from "@/components/cv/TemplateGallery";
import { TEMPLATES, type CvData, type TemplateId, emptyCv } from "@/lib/cv-types";
import { type CvUiLang } from "@/lib/cv-translations";
import { suggestSection, polishText, polishTextVariants, parseCvUpload, extractCvTextWithAi } from "@/lib/ai-functions";
import { PolishPanel, type PolishVariant } from "@/components/ai/polish-panel";
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

import { PhotoUpload } from "@/components/cv/editor/PhotoUpload";

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
import type { SectionDef, PreviewZoom } from "@/components/cv/editor";

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
  LockKeyhole,
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

/** 210mm at 96dpi — width of the A4 preview card. */
const A4_WIDTH_PX = 793.7;

function CvEditorPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { checkout, pending: checkoutPending } = useCheckout();
  const search = Route.useSearch() as { guided?: string };
  const [title, setTitle] = useState("CV Baru");
  const [templateId, setTemplateId] = useState<TemplateId>("jakarta");
  const [targetRole, setTargetRole] = useState("");
  const currentTemplate = TEMPLATES.find((t) => t.id === templateId);
  const isNeedLevelingSkill = currentTemplate && "isNeedLevelingSkill" in currentTemplate ? currentTemplate.isNeedLevelingSkill : false;
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
  const [hasUploadCvFeature, setHasUploadCvFeature] = useState(false);
  const [quotaProPhoto, setQuotaProPhoto] = useState(0);
  const [quotaUploadCv, setQuotaUploadCv] = useState(0);
  const [cvLanguage, setCvLanguage] = useState<CvUiLang>("id");
  const [allowedTemplates, setAllowedTemplates] = useState<string[] | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "unsaved">("idle");
  const [polishPanel, setPolishPanel] = useState<{
    open: boolean;
    loading: boolean;
    originalText: string;
    variants: PolishVariant[] | null;
    onAccept: ((polished: string) => void) | null;
  }>({ open: false, loading: false, originalText: "", variants: null, onAccept: null });

  // ─── 3-Panel Layout State ─────────────────────────────────────
  const [activeSection, setActiveSection] = useState("personal");
  const [sections, setSections] = useState<SectionDef[]>(getDefaultSections());
  const [previewZoom, setPreviewZoom] = useState<PreviewZoom>("fit");
  const [showNav, setShowNav] = useState(true);
  const [mobileTab, setMobileTab] = useState<EditorTab>("form");

  // ─── Preview sizing ──────────────────────────────────────────
  // "fit" scales the A4 page to the preview width. transform: scale() does not
  // shrink the layout box, so negative margins remove the leftover whitespace /
  // horizontal scroll (PDF export & print reset these margins).
  const [previewViewport, setPreviewViewport] = useState<HTMLDivElement | null>(null);
  const [previewCard, setPreviewCard] = useState<HTMLDivElement | null>(null);
  const [fitScale, setFitScale] = useState(85);
  const [previewCardHeight, setPreviewCardHeight] = useState(0);

  useEffect(() => {
    if (!previewViewport || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.width - (entry.contentRect.width >= 640 ? 48 : 24);
      setFitScale(Math.max(30, Math.min(100, Math.floor((available / A4_WIDTH_PX) * 100))));
    });
    ro.observe(previewViewport);
    return () => ro.disconnect();
  }, [previewViewport]);

  useEffect(() => {
    if (!previewCard || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => setPreviewCardHeight(entry.contentRect.height));
    ro.observe(previewCard);
    return () => ro.disconnect();
  }, [previewCard]);

  const previewScale = previewZoom === "fit" ? fitScale : previewZoom;

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
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("has_upload_cv, upload_cv_end_date, quota_pro_photo, quota_pro_photo_purchased, quota_upload_cv")
        .eq("id", row.user_id)
        .single();
      if (profile) {
        let isUnlocked = profile.has_upload_cv;
        if (profile.upload_cv_end_date) {
          isUnlocked = new Date(profile.upload_cv_end_date) > new Date();
        }
        setHasUploadCvFeature(isUnlocked);
        setQuotaProPhoto((profile.quota_pro_photo || 0) + (profile.quota_pro_photo_purchased || 0));
        setQuotaUploadCv(profile.quota_upload_cv || 0);
      }
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
      // If they relied on tier quota (not add-on), decrement it locally
      if (!hasUploadCvFeature && quotaUploadCv > 0) {
        setQuotaUploadCv((prev) => prev - 1);
      }
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
    async (
      fieldKey: string,
      text: string,
      context: string | undefined,
      onApply: (polished: string) => void,
    ) => {
      if (!text.trim() || text.trim().length < 5) {
        toast.error("Teks terlalu pendek untuk diperbaiki.");
        return;
      }
      setPolishingField(fieldKey);
      setPolishPanel({
        open: true,
        loading: true,
        originalText: text,
        variants: null,
        onAccept: onApply,
      });
      try {
        const result = await polishTextVariants({ data: { text, context, language: cvLanguage } });
        setPolishPanel((prev) => ({
          ...prev,
          loading: false,
          variants: result.variants,
        }));
      } catch (e: any) {
        toast.error(e.message || "Gagal memperbaiki teks.");
        setPolishPanel((prev) => ({ ...prev, open: false, loading: false }));
      } finally {
        setPolishingField(null);
      }
    },
    [cvLanguage],
  );

  const closePolishPanel = useCallback(() => {
    setPolishPanel((prev) => ({ ...prev, open: false, loading: false }));
  }, []);

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

  const canUploadCv = hasUploadCvFeature || quotaUploadCv > 0 || userTier === "starter" || userTier === "pro";

  const scoreTone =
    localScore.overallScore >= 80
      ? "bg-green-100 text-green-800 ring-green-200"
      : localScore.overallScore >= 60
        ? "bg-amber-100 text-amber-900 ring-amber-200"
        : "bg-red-100 text-red-800 ring-red-200";

  const editorFormProps = {
    data,
    setData,
    setActiveSection,
    targetRole,
    aiLoading,
    handleAiSuggest,
    handlePolishText,
    polishingField,
    updatePersonal,
    handleLinkedInImport,
    suggestionPanel,
    onAcceptSuggestion: handleAcceptSuggestion,
    onRegenerateSuggestion: handleRegenerateSuggestion,
    onRegenerateAll: handleRegenerateAll,
    onCloseSuggestion: closeSuggestionPanel,
    localScore,
    cvLanguage,
    userId: user?.id,
    cvId: id,
    proPhotoQuota: quotaProPhoto,
    isNeedLevelingSkill,
  };

  const targetRoleField = (
    <label className="block rounded-2xl border border-gray-200 bg-white p-3 focus-within:border-green-700 focus-within:ring-2 focus-within:ring-green-700/20">
      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-600">
        <Crosshair aria-hidden="true" className="h-3.5 w-3.5 text-green-700" />
        Target posisi
      </span>
      <input
        value={targetRole}
        onChange={(e) => setTargetRole(e.target.value)}
        placeholder="Mis. Product Designer, Staff Akuntansi"
        className="mt-1 h-8 w-full bg-transparent text-[15px] font-semibold text-gray-900 outline-none placeholder:font-normal placeholder:text-gray-500"
      />
      <span className="block text-xs text-gray-600">
        Dipakai untuk menghitung skor ATS dan menyesuaikan saran AI.
      </span>
    </label>
  );

  const openCvUpload = () => {
    setShowCvUpload(true);
    setCvUploadFile(null);
    setCvUploadError(null);
  };

  return (
    <div className="cv-editor-page flex h-dvh min-h-0 flex-col bg-gray-100">
      <style>{cvPrintStyles}</style>
      {/* ─── TOOLBAR ─── */}
      <EditorToolbar
        id={id}
        title={title}
        onTitleChange={setTitle}
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
        onOpenCvUpload={openCvUpload}
        cvLanguage={cvLanguage}
        onLanguageChange={setCvLanguage}
      />

      {/* ─── MAIN CONTENT: 2-Column Layout (lg+) / tabs (mobile & tablet) ─── */}
      <div className="flex min-h-0 flex-1 overflow-hidden print:block print:overflow-visible print:!visible">
        {/* Left Panel: Import + Accordion Sections */}
        <aside
          aria-label="Isi CV"
          className={cn(
            "hidden w-[420px] shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white print:hidden xl:w-[460px]",
            showNav && "lg:flex",
          )}
        >
          <div className="space-y-3 p-4 xl:p-5">
            {targetRoleField}

            {/* Import dari CV Lama */}
            <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-green-700 shadow-sm">
                <Upload className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-gray-900">Punya CV lama?</h2>
                <p className="text-xs leading-relaxed text-gray-600">
                  Upload PDF, isi otomatis dalam hitungan detik.
                </p>
              </div>
              <button
                type="button"
                onClick={openCvUpload}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-green-700 px-3 text-sm font-bold text-white transition-colors hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
              >
                Import
              </button>
            </div>

            <div className="flex items-baseline justify-between px-1 pt-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Bagian CV
              </h2>
              <p className="text-xs text-gray-500">Seret ⋮⋮ untuk ubah urutan</p>
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
                <EditorForm {...editorFormProps} activeSection={sectionId} />
              )}
            />

            {/* Tambah Bagian Button */}
            <button
              type="button"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 py-3 text-sm font-bold text-gray-600 transition-colors hover:border-green-600 hover:bg-green-50 hover:text-green-800"
              onClick={() => setShowAddSection(true)}
            >
              <Plus className="h-4 w-4" />
              Tambah Bagian
            </button>
          </div>
        </aside>

        {/* Mobile & tablet: Form */}
        {mobileTab === "form" && (
          <div className="flex-1 overflow-y-auto bg-white p-4 print:hidden sm:p-6 lg:hidden">
            <div className="mx-auto max-w-2xl space-y-4">
              {targetRoleField}
              <EditorForm {...editorFormProps} activeSection={activeSection} />
            </div>
          </div>
        )}

        {/* Right Panel: Preview */}
        <section
          aria-label="Preview CV"
          className={cn(
            "flex min-w-0 flex-1 flex-col overflow-hidden print:flex print:overflow-visible print:!visible",
            mobileTab !== "preview" && "hidden lg:flex",
          )}
        >
          {/* Preview Toolbar */}
          <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-3 sm:px-4 print:hidden">
            <div className="flex min-w-0 items-center gap-2">
              <span className="hidden items-center gap-1.5 text-sm font-bold text-gray-900 sm:flex">
                <Eye className="h-4 w-4 text-green-700" /> Preview
              </span>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold ring-1 transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700",
                    scoreTone,
                  )}
                  aria-label={`Skor ATS ${localScore.overallScore} dari 100, lihat detail`}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Skor ATS {localScore.overallScore}
                </PopoverTrigger>
                <PopoverContent align="start" sideOffset={8} className="w-80 rounded-2xl p-0">
                  <AtsScoreWidget
                    overallScore={localScore.overallScore}
                    breakdown={localScore.breakdown}
                    suggestions={localScore.suggestions}
                    onFixWithAi={() => navigate({ to: "/cv-review/$cvId", params: { cvId: id } })}
                    className="max-h-[70vh] overflow-y-auto border-0 shadow-none"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <PreviewToolbar scale={previewZoom} onChange={setPreviewZoom} />
          </div>

          {/* Chat Panel */}
          {chatOpen && (
            <div className="shrink-0 border-b border-gray-200 bg-white p-3 print:hidden">
              <AiChatPanel cvId={id} cvData={data} language={cvLanguage} />
            </div>
          )}

          {/* Preview Area */}
          <div
            ref={setPreviewViewport}
            className="flex-1 overflow-auto bg-gray-100 print:overflow-visible print:bg-white"
          >
            <div className="cv-print-area flex justify-center p-3 sm:p-6 print:p-0">
              <div
                ref={setPreviewCard}
                className="rounded-sm bg-white shadow-xl shadow-gray-900/10 ring-1 ring-gray-200 print:!m-0 print:!h-auto print:!w-auto print:!min-w-0 print:!transform-none print:!rounded-none print:!border-0 print:!shadow-none print:!ring-0"
                style={{
                  transform: `scale(${previewScale / 100})`,
                  transformOrigin: "top center",
                  width: "210mm",
                  minWidth: "210mm",
                  marginInline: `${(-(1 - previewScale / 100) * A4_WIDTH_PX) / 2}px`,
                  marginBottom: `${-(1 - previewScale / 100) * previewCardHeight}px`,
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
        </section>

        {/* Mobile & tablet: Score Tab */}
        {mobileTab === "score" && (
          <div className="flex-1 overflow-y-auto bg-white p-4 print:hidden sm:p-6 lg:hidden">
            <div className="mx-auto max-w-2xl space-y-4">
              <AtsScoreWidget
                overallScore={localScore.overallScore}
                breakdown={localScore.breakdown}
                suggestions={localScore.suggestions}
                onFixWithAi={() => navigate({ to: "/cv-review/$cvId", params: { cvId: id } })}
                className="rounded-2xl border-gray-200 shadow-none"
              />
              <AtsPreview data={data} />
              <Link
                to="/score/$cvId"
                params={{ cvId: id }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-800 transition-colors hover:border-green-700 hover:bg-green-50 hover:text-green-800"
              >
                <BarChart3 className="h-4 w-4" /> Lihat Skor Lengkap
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ─── MOBILE & TABLET TAB BAR ─── */}
      <nav
        className="grid shrink-0 grid-cols-3 gap-1 border-t border-gray-200 bg-white px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 print:hidden lg:hidden"
        aria-label="Navigasi editor"
      >
        {[
          { id: "form" as EditorTab, icon: FileText, label: "Isi CV" },
          { id: "preview" as EditorTab, icon: Eye, label: "Preview" },
          { id: "score" as EditorTab, icon: BarChart3, label: "Skor" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMobileTab(tab.id)}
            className={cn(
              "relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700",
              mobileTab === tab.id
                ? "bg-green-50 text-green-800"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
            )}
            aria-pressed={mobileTab === tab.id}
          >
            <tab.icon className="h-5 w-5" />
            {tab.label}
            {tab.id === "score" && (
              <span
                className={cn(
                  "absolute right-[18%] top-1.5 rounded-full px-1.5 py-px text-[10px] font-extrabold ring-1",
                  scoreTone,
                )}
              >
                {localScore.overallScore}
              </span>
            )}
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
      {/* PolishPanel — AI Perbaiki Teks 3 Variasi */}
      <PolishPanel
        open={polishPanel.open}
        onClose={closePolishPanel}
        loading={polishPanel.loading}
        originalText={polishPanel.originalText}
        variants={polishPanel.variants}
        onAccept={(polished) => {
          if (polishPanel.onAccept) polishPanel.onAccept(polished);
          toast.success("Teks berhasil diperbarui!");
        }}
        onRegenerateAll={() => {
          if (polishPanel.onAccept) {
            const { originalText } = polishPanel;
            setPolishPanel((prev) => ({ ...prev, loading: true, variants: null }));
            polishTextVariants({ data: { text: originalText, language: cvLanguage } })
              .then((r) =>
                setPolishPanel((prev) => ({ ...prev, loading: false, variants: r.variants })),
              )
              .catch((e) => {
                toast.error(e.message || "Gagal membuat ulang variasi.");
                setPolishPanel((prev) => ({ ...prev, loading: false }));
              });
          }
        }}
      />

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
              {hasUploadCvFeature ? (
                <span className="ml-auto text-xs font-normal text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full dark:bg-emerald-900/30 dark:text-emerald-400">
                  Add-on Aktif
                </span>
              ) : quotaUploadCv > 0 ? (
                <span className="ml-auto text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Sisa Kuota: {quotaUploadCv}x
                </span>
              ) : null}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Upload CV kamu dalam format PDF atau DOCX. AI akan membaca dan mengisi data otomatis.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            {!canUploadCv && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-lg bg-background/60 backdrop-blur-sm p-4 text-center">
                <LockKeyhole className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  Upgrade Tier kamu atau beli Fitur Upload CV (Rp 10.000 / 2 Bulan)
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => checkout("addon:upload_cv", 2)}
                  disabled={!!checkoutPending}
                >
                  {checkoutPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Beli Sekarang
                </Button>
              </div>
            )}
            <div
              className={cn(
                "space-y-4",
                !canUploadCv && "opacity-50 pointer-events-none blur-[2px]",
              )}
            >
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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-800">
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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-800">
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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-800">
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
  userId,
  cvId,
  proPhotoQuota,
  isNeedLevelingSkill,
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
    context: string | undefined,
    onApply: (polished: string) => void,
  ) => void;
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
  userId?: string;
  cvId?: string;
  proPhotoQuota: number;
  isNeedLevelingSkill?: boolean;
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
          {userId && cvId && (
            <PhotoUpload
              photoUrl={data.personal.photoUrl}
              userId={userId}
              cvId={cvId}
              onPhotoChange={(url) => updatePersonal("photoUrl", url)}
              proPhotoQuota={proPhotoQuota}
            />
          )}
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
                        onClick={() =>
                          handlePolishText(
                            `exp-${i}`,
                            item.description,
                            `Posisi: ${item.position} di ${item.company}`,
                            (polished) => mutate(setData, "experiences", i, "description", polished),
                          )
                        }
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
                        onClick={() =>
                          handlePolishText(
                            `edu-${i}`,
                            item.description || "",
                            `${item.degree} ${item.field || ""} di ${item.school}`,
                            (polished) => mutate(setData, "educations", i, "description", polished),
                          )
                        }
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
                        onClick={() =>
                          handlePolishText(
                            `intern-${i}`,
                            item.description,
                            `Magang: ${item.position} di ${item.company}`,
                            (polished) => mutate(setData, "internships", i, "description", polished),
                          )
                        }
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
                        onClick={() =>
                          handlePolishText(
                            `org-${i}`,
                            item.description,
                            `Organisasi: ${item.role} di ${item.name}`,
                            (polished) => mutate(setData, "organizations", i, "description", polished),
                          )
                        }
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
            <div className="flex flex-col gap-4">
              <Field
                label="Nama Skill"
                value={item.name}
                onChange={(v) => mutate(setData, "skills", i, "name", v)}
                placeholder="React, SQL, Komunikasi..."
                icon={<Zap className="h-4 w-4" />}
              />
              {isNeedLevelingSkill && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Tingkat Kemahiran</Label>
                  <Select
                    value={item.level || ""}
                    onValueChange={(v) => mutate(setData, "skills", i, "level", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih tingkat kemahiran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Pemula (Beginner)</SelectItem>
                      <SelectItem value="Intermediate">Menengah (Intermediate)</SelectItem>
                      <SelectItem value="Advanced">Mahir (Advanced)</SelectItem>
                      <SelectItem value="Expert">Ahli (Expert)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
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
