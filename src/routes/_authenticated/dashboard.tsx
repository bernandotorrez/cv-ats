import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { isAdmin } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { getUserTier, getTierLimits, type Tier, type TierLimits } from "@/lib/subscription";
import { Crown, AlertCircle } from "lucide-react";
import { TemplateGallery } from "@/components/cv/TemplateGallery";
import { emptyCv, TEMPLATES, type TemplateId } from "@/lib/cv-types";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import {
  WelcomeHeader,
  TierBanner,
  UsageBars,
  PowerFeatures,
  QuickActions,
  RecentCvs,
  ActivityFeed,
  UpgradeCard,
  TipsCard,
  CvPickerDialog,
  CareerProgress,
  getCareerSteps,
  AiRecommendations,
  getRecommendations,
} from "@/components/dashboard";
import {
  FileText,
  Sparkles,
  BarChart3,
  Brain,
  FileCheck,
  FileSearch,
  Target,
  Key,
  Type,
  MessageSquare,
  Shield,
  Mic,
  Gift,
  TrendingUp,
  Briefcase,
  Edit3,
  ArrowLeftRight,
  Loader2,
  RefreshCw,
  ChevronDown,
  Star,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () =>
    buildSeo({
      title: "Dashboard - CV Pintar",
      description: "Kelola CV, AI tools, skor ATS, cover letter, dan simulasi interview.",
      path: "/dashboard",
      noindex: true,
    }),
  component: DashboardPage,
});

interface CvRow {
  id: string;
  title: string;
  template_id: string;
  status: string;
  updated_at: string;
  created_at: string;
}

interface ActivityItem {
  action: string;
  label: string;
  time: string;
}

type TierQuotaRow = {
  quota_ai_suggest?: number | null;
  quota_ai_score?: number | null;
  quota_ai_job_match?: number | null;
  quota_ai_tailor_cv?: number | null;
  quota_ai_chat?: number | null;
  quota_ai_cover_letter?: number | null;
  quota_ai_keyword_extract?: number | null;
  quota_cv_review?: number | null;
  quota_ai_polish?: number | null;
  quota_guided_mode?: number | null;
  enable_cv_review?: boolean | null;
  enable_cover_letter?: boolean | null;
  enable_keyword_extractor?: boolean | null;
  enable_cv_comparison?: boolean | null;
  enable_interview_simulator?: boolean | null;
  enable_analytics?: boolean | null;
  enable_text_polish?: boolean | null;
  enable_guided_mode?: boolean | null;
  template_access_detail?: string[] | null;
};

type UserSubscriptionResult = {
  subscription_tiers?: TierQuotaRow | null;
} | null;

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(false);
  const [tier, setTier] = useState<Tier>("free");
  const [limits, setLimits] = useState<TierLimits>(getTierLimits("free"));
  const [tierQuotas, setTierQuotas] = useState<TierQuotaRow | null>(null);
  const [cvs, setCvs] = useState<CvRow[]>([]);
  const [cvCount, setCvCount] = useState(0);
  const [aiUsageCount, setAiUsageCount] = useState(0);
  const [scoreUsageCount, setScoreUsageCount] = useState(0);
  const [jobMatchUsageCount, setJobMatchUsageCount] = useState(0);
  const [tailorCvUsageCount, setTailorCvUsageCount] = useState(0);
  const [guidedUsageCount, setGuidedUsageCount] = useState(0);
  const [coverLetterUsageCount, setCoverLetterUsageCount] = useState(0);
  const [cvReviewUsageCount, setCvReviewUsageCount] = useState(0);
  const [keywordExtractUsageCount, setKeywordExtractUsageCount] = useState(0);
  const [textPolishUsageCount, setTextPolishUsageCount] = useState(0);
  const [chatUsageCount, setChatUsageCount] = useState(0);
  const [showCvPicker, setShowCvPicker] = useState<{ action: string } | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showModeDialog, setShowModeDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("jakarta");
  const [creating, setCreating] = useState(false);
  const [allowedTemplates, setAllowedTemplates] = useState<string[] | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      isAdmin(user.id).then(setAdmin),
      getUserTier(user.id).then((t) => {
        setTier(t);
        setLimits(getTierLimits(t));
      }),
      loadTierQuotas(user.id),
      loadCvs(user.id),
      loadUsageStats(user.id),
      loadActivities(user.id),
      loadAllowedTemplates(user.id),
    ]).finally(() => setLoading(false));
  }, [user?.id]);

  const loadTierQuotas = async (userId: string) => {
    const { data } = await supabase
      .from("user_subscriptions")
      .select(
        `subscription_tiers!inner(
          quota_ai_suggest,
          quota_ai_score,
          quota_ai_job_match,
          quota_ai_tailor_cv,
          quota_ai_chat,
          quota_ai_cover_letter,
          quota_ai_keyword_extract,
          quota_cv_review,
          quota_ai_polish,
          quota_guided_mode,
          enable_cv_review,
          enable_cover_letter,
          enable_keyword_extractor,
          enable_cv_comparison,
          enable_interview_simulator,
          enable_analytics,
          enable_text_polish,
          enable_guided_mode
        )`,
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .single();
    const row = data as unknown as UserSubscriptionResult;
    if (row?.subscription_tiers) {
      setTierQuotas(row.subscription_tiers);
    }
  };

  const loadAllowedTemplates = async (userId: string) => {
    const { data } = await supabase
      .from("user_subscriptions")
      .select("subscription_tiers!inner(template_access_detail)")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    const row = data as unknown as UserSubscriptionResult;
    if (row?.subscription_tiers?.template_access_detail) {
      setAllowedTemplates(row.subscription_tiers.template_access_detail);
    } else if (row?.subscription_tiers?.template_access_detail === null) {
      setAllowedTemplates(null);
    } else {
      setAllowedTemplates(["jakarta", "bandung"]);
    }
  };

  const loadCvs = async (userId: string) => {
    const { data, count } = await supabase
      .from("cvs")
      .select("id, title, template_id, status, updated_at, created_at", { count: "exact" })
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(5);
    setCvs(data ?? []);
    setCvCount(count ?? 0);
  };

  const loadUsageStats = async (userId: string) => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const iso = monthStart.toISOString();
    const { data, error } = await supabase
      .from("ai_usage")
      .select("feature")
      .eq("user_id", userId)
      .gte("created_at", iso);
    if (error) {
      console.error("Failed to load usage stats:", error);
      return;
    }
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      counts[row.feature] = (counts[row.feature] || 0) + 1;
    }
    setAiUsageCount(counts["suggest"] ?? 0);
    setScoreUsageCount(counts["score"] ?? 0);
    setJobMatchUsageCount(counts["job_match"] ?? 0);
    setTailorCvUsageCount(counts["tailor_cv"] ?? 0);
    setGuidedUsageCount(counts["guided"] ?? 0);
    setCoverLetterUsageCount(counts["cover_letter"] ?? 0);
    setCvReviewUsageCount(counts["cv_review"] ?? 0);
    setKeywordExtractUsageCount(counts["keyword_extract"] ?? 0);
    setTextPolishUsageCount(counts["polish"] ?? 0);
    setChatUsageCount(counts["chat"] ?? 0);
  };

  const loadActivities = async (userId: string) => {
    const { data } = await supabase
      .from("cvs")
      .select("title, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(5);
    const items: ActivityItem[] = (
      (data ?? []) as Array<{ title: string; updated_at: string }>
    ).map((cv) => ({
      action: "edit",
      label: cv.title,
      time: new Date(cv.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
    }));
    if (items.length === 0) {
      items.push({ action: "welcome", label: "CV pertamamu menunggu!", time: "Sekarang" });
    }
    setActivities(items);
  };

  const handleCreate = async (guided = false) => {
    if (!user) return;
    if (atCvLimit) {
      toast.error(`Paket ${tierName} hanya bisa ${limits.maxCvs} CV. Upgrade untuk lebih banyak.`);
      return;
    }
    setCreating(true);
    const { data, error } = await supabase
      .from("cvs")
      .insert({
        user_id: user.id,
        title: "CV Baru",
        template_id: selectedTemplate,
        data: emptyCv as unknown as Json,
      })
      .select("id")
      .single();
    setCreating(false);
    if (error) return toast.error(error.message);
    setShowCreateDialog(false);
    setShowModeDialog(false);
    navigate({
      to: "/cv/$id",
      params: { id: data.id },
      search: guided ? ({ guided: "true" } as never) : {},
    });
  };

  const atCvLimit = limits.maxCvs !== null && cvCount >= limits.maxCvs;
  const tierName = tier === "free" ? "Free" : tier === "starter" ? "Starter" : "Pro";

  const usageBars = [
    {
      icon: FileText,
      label: "CV",
      used: cvCount,
      max: limits.maxCvs,
      color: "bg-primary-soft text-primary",
      visible: true,
    },
    {
      icon: Sparkles,
      label: "AI Saran",
      used: aiUsageCount,
      max: tierQuotas?.quota_ai_suggest ?? limits.maxAiSuggestions,
      color: "bg-violet-500/10 text-violet-600",
      visible: limits.enableAiSuggest,
    },
    {
      icon: BarChart3,
      label: "CV Scoring",
      used: scoreUsageCount,
      max: tierQuotas?.quota_ai_score ?? limits.maxAtsScores,
      color: "bg-amber-500/10 text-amber-600",
      visible: limits.enableAiScore,
    },
    {
      icon: FileSearch,
      label: "Job Match",
      used: jobMatchUsageCount,
      max: tierQuotas?.quota_ai_job_match ?? (tier === "free" ? 0 : tier === "starter" ? 20 : 100),
      color: "bg-lime-500/10 text-lime-700",
      visible: true,
    },
    {
      icon: RefreshCw,
      label: "Tailor CV",
      used: tailorCvUsageCount,
      max: tierQuotas?.quota_ai_tailor_cv ?? (tier === "pro" ? 30 : 0),
      color: "bg-cyan-500/10 text-cyan-700",
      visible: true,
    },
    {
      icon: Brain,
      label: "Guided Mode",
      used: guidedUsageCount,
      max: tierQuotas?.quota_guided_mode ?? limits.maxGuidedSessions,
      color: "bg-emerald-500/10 text-emerald-600",
      visible: tierQuotas?.enable_guided_mode ?? limits.enableGuidedMode,
    },
    {
      icon: FileCheck,
      label: "Cover Letter",
      used: coverLetterUsageCount,
      max:
        tierQuotas?.quota_ai_cover_letter ??
        (tierQuotas?.enable_cover_letter
          ? tier === "free"
            ? 1
            : tier === "starter"
              ? 10
              : null
          : 0),
      color: "bg-teal-500/10 text-teal-600",
      visible: tierQuotas?.enable_cover_letter ?? limits.canCoverLetter,
    },
    {
      icon: Target,
      label: "CV Review",
      used: cvReviewUsageCount,
      max:
        tierQuotas?.quota_cv_review ??
        (tierQuotas?.enable_cv_review ? (tier === "starter" ? 10 : null) : 0),
      color: "bg-rose-500/10 text-rose-600",
      visible: tierQuotas?.enable_cv_review ?? limits.enableCvReview,
    },
    {
      icon: Key,
      label: "Keyword Extract",
      used: keywordExtractUsageCount,
      max:
        tierQuotas?.quota_ai_keyword_extract ??
        (tierQuotas?.enable_keyword_extractor
          ? tier === "free"
            ? 2
            : tier === "starter"
              ? 20
              : null
          : 0),
      color: "bg-blue-500/10 text-blue-600",
      visible: tierQuotas?.enable_keyword_extractor ?? limits.canKeywordExtract,
    },
    {
      icon: Type,
      label: "Text Polish",
      used: textPolishUsageCount,
      max: tierQuotas?.quota_ai_polish ?? limits.maxTextPolish,
      color: "bg-purple-500/10 text-purple-600",
      visible: tierQuotas?.enable_text_polish ?? limits.enableTextPolish,
    },
    {
      icon: MessageSquare,
      label: "AI Chat",
      used: chatUsageCount,
      max: tierQuotas?.quota_ai_chat ?? (tier === "free" ? 5 : tier === "starter" ? 50 : null),
      color: "bg-cyan-500/10 text-cyan-600",
      visible: true,
    },
  ];

  const powerFeatures = [
    {
      icon: Brain,
      label: "CV Review AI",
      desc: "Baca CV seperti HR: temukan bagian kuat, bagian lemah, dan quick wins sebelum apply.",
      action: "cv-review",
      badge: "Powerful",
      visible: true,
      locked: (tierQuotas?.enable_cv_review ?? limits.enableCvReview) === false,
      upgradeTier: "Starter",
      gradient: "bg-gradient-to-r from-rose-500 to-pink-500",
    },
    {
      icon: BarChart3,
      label: "CV Scoring",
      desc: "Ukur kesiapan ATS secara instan, lalu perbaiki bagian yang paling menahan peluangmu.",
      action: "score",
      badge: "Analitik",
      visible: true,
      locked: false,
      gradient: "bg-gradient-to-r from-amber-500 to-orange-500",
    },
    {
      icon: FileSearch,
      label: "AI Job Match Score",
      desc: "Cocokkan CV dengan lowongan dari database, URL, atau job description manual.",
      action: "job-match",
      badge: "Starter",
      isNew: true,
      visible: true,
      locked: tier === "free",
      upgradeTier: "Starter",
      gradient: "bg-gradient-to-r from-lime-500 to-emerald-500",
    },
    {
      icon: RefreshCw,
      label: "Auto Tailor CV",
      desc: "Sesuaikan summary, skill, dan pengalaman CV untuk job description tertentu tanpa mengarang data.",
      action: "tailor-cv",
      badge: "Pro",
      isNew: true,
      visible: true,
      locked: tier !== "pro",
      upgradeTier: "Pro",
      gradient: "bg-gradient-to-r from-cyan-500 to-blue-500",
    },
    {
      icon: ArrowLeftRight,
      label: "CV Comparison",
      desc: "Bandingkan dua versi CV untuk melihat struktur, keyword, kelengkapan, dan preview dalam satu layar.",
      action: "compare",
      badge: "Pro",
      visible: true,
      locked: (tierQuotas?.enable_cv_comparison ?? limits.canCompare) === false,
      upgradeTier: "Pro",
      gradient: "bg-gradient-to-r from-indigo-500 to-violet-500",
    },
    {
      icon: Mic,
      label: "Simulasi Wawancara",
      desc: "Latihan menjawab pertanyaan realistis dan dapatkan feedback yang bisa langsung dipakai.",
      action: "simulasi",
      badge: "Pro",
      visible: true,
      locked: (tierQuotas?.enable_interview_simulator ?? limits.canInterviewSimulator) === false,
      upgradeTier: "Pro",
      gradient: "bg-gradient-to-r from-rose-500 to-red-500",
    },
    {
      icon: FileCheck,
      label: "Cover Letter AI",
      desc: "Buat surat lamaran yang nyambung dengan CV, role, dan bahasa perusahaan target.",
      action: "cover-letter",
      badge: "Baru",
      visible: true,
      locked: (tierQuotas?.enable_cover_letter ?? limits.canCoverLetter) === false,
      upgradeTier: "Starter",
      gradient: "bg-gradient-to-r from-teal-500 to-cyan-500",
    },
    {
      icon: Key,
      label: "Keyword Extractor",
      desc: "Ambil keyword penting dari job description agar CV lebih relevan untuk ATS dan rekruter.",
      action: "keyword-extractor",
      badge: "ATS",
      visible: true,
      locked: (tierQuotas?.enable_keyword_extractor ?? limits.canKeywordExtract) === false,
      upgradeTier: "Starter",
      gradient: "bg-gradient-to-r from-blue-500 to-indigo-500",
    },
  ];

  const quickActions: {
    icon: typeof FileText;
    label: string;
    action: string;
    color: string;
    visible: boolean;
    locked?: boolean;
    upgradeTier?: string;
  }[] = [
    {
      icon: FileText,
      label: "Kelola CV",
      action: "manage",
      color: "bg-primary-soft text-primary",
      visible: true,
    },
    {
      icon: Sparkles,
      label: "AI Saran",
      action: "ai-suggest",
      color: "bg-violet-500/10 text-violet-600",
      visible: true,
    },
    {
      icon: BarChart3,
      label: "CV Scoring",
      action: "score",
      color: "bg-amber-500/10 text-amber-600",
      visible: true,
    },
    {
      icon: FileSearch,
      label: "Job Match",
      action: "job-match",
      color: "bg-lime-500/10 text-lime-700",
      visible: true,
      locked: tier === "free",
      upgradeTier: "Starter",
    },
    {
      icon: RefreshCw,
      label: "Tailor CV",
      action: "tailor-cv",
      color: "bg-cyan-500/10 text-cyan-700",
      visible: true,
      locked: tier !== "pro",
      upgradeTier: "Pro",
    },
    {
      icon: ArrowLeftRight,
      label: "Compare",
      action: "compare",
      color: "bg-indigo-500/10 text-indigo-600",
      visible: true,
      locked: (tierQuotas?.enable_cv_comparison ?? limits.canCompare) === false,
      upgradeTier: "Pro",
    },
    {
      icon: Briefcase,
      label: "Pelamaran",
      action: "lamaran",
      color: "bg-blue-500/10 text-blue-600",
      visible: true,
    },
    {
      icon: Mic,
      label: "Simulasi",
      action: "simulasi",
      color: "bg-rose-500/10 text-rose-600",
      visible: true,
      locked: (tierQuotas?.enable_interview_simulator ?? limits.canInterviewSimulator) === false,
      upgradeTier: "Pro",
    },
    {
      icon: FileCheck,
      label: "Cover Letter",
      action: "cover-letter",
      color: "bg-teal-500/10 text-teal-600",
      visible: true,
      locked: (tierQuotas?.enable_cover_letter ?? limits.canCoverLetter) === false,
      upgradeTier: "Starter",
    },
    {
      icon: Key,
      label: "Keyword",
      action: "keyword-extractor",
      color: "bg-blue-500/10 text-blue-600",
      visible: true,
      locked: (tierQuotas?.enable_keyword_extractor ?? limits.canKeywordExtract) === false,
      upgradeTier: "Starter",
    },
    {
      icon: Gift,
      label: "Referral",
      action: "referral",
      color: "bg-pink-500/10 text-pink-600",
      visible: true,
    },
    {
      icon: TrendingUp,
      label: "Analitik",
      action: "analitik",
      color: "bg-indigo-500/10 text-indigo-600",
      visible: true,
      locked: (tierQuotas?.enable_analytics ?? limits.canAnalytics) === false,
      upgradeTier: "Pro",
    },
    ...(admin
      ? [
          {
            icon: Shield,
            label: "Admin",
            action: "admin" as const,
            color: "bg-red-500/10 text-red-600",
            visible: true,
          },
        ]
      : []),
  ];

  const CV_PICKER_ACTIONS = [
    "cv-review",
    "score",
    "ai-suggest",
    "cover-letter",
    "keyword-extractor",
    "tailor-cv",
  ];

  const handleFeatureClick = (action: string) => {
    if (CV_PICKER_ACTIONS.includes(action)) {
      if (cvs.length === 0) {
        navigate({ to: "/cv" });
        return;
      }
      setShowCvPicker({ action });
      return;
    }
    const routes: Record<string, string> = {
      manage: "/cv",
      lamaran: "/lamaran",
      simulasi: "/simulasi-wawancara",
      compare: "/compare",
      "job-match": "/job-match",
      referral: "/referral",
      analitik: "/analitik",
      admin: "/admin",
    };
    if (routes[action]) navigate({ to: routes[action] as never });
  };

  const handleCvSelect = (cvId: string) => {
    if (!showCvPicker) return;
    const routes: Record<string, string> = {
      "cv-review": "/cv-review/$cvId",
      score: "/score/$cvId",
      "ai-suggest": "/cv/$id",
      "cover-letter": "/tools/cover-letter/$cvId",
      "keyword-extractor": "/tools/keyword/$cvId",
      "tailor-cv": "/tools/tailor/$cvId",
    };
    const route = routes[showCvPicker.action];
    if (route) {
      navigate({ to: route.replace("$cvId", cvId).replace("$id", cvId) as never });
    }
    setShowCvPicker(null);
  };

  // ─── Career Progress Steps ───
  const hasCv = cvCount > 0;
  const careerSteps = getCareerSteps({
    hasCv,
    hasScore: hasCv && scoreUsageCount > 0,
    hasCoverLetter: hasCv && coverLetterUsageCount > 0,
    hasInterview: hasCv && false, // can be enhanced later with interview data
    hasApplied: hasCv && false, // can be enhanced later with job application data
  });

  // ─── AI Recommendations ───
  const recommendations = getRecommendations({
    hasCv: cvCount > 0,
    hasScore: scoreUsageCount > 0,
    tier,
    cvCount,
  });

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="container-page space-y-6 py-5 md:space-y-7 md:py-8">
      {/* ── Career Progress Hero Panel ── */}
      <CareerProgress
        user={user}
        steps={careerSteps}
        onCreateCv={() => setShowCreateDialog(true)}
        onStepClick={(step) => {
          if (!step.done) {
            setShowCreateDialog(true);
          } else if (step.id === "create-cv") {
            navigate({ to: "/cv" });
          } else if (step.id === "score-cv") {
            handleFeatureClick("score");
          } else if (step.id === "cover-letter") {
            handleFeatureClick("cover-letter");
          } else if (step.id === "interview") {
            navigate({ to: "/simulasi-wawancara" });
          }
        }}
      />

      {/* ── CV Kamu ── */}
      <RecentCvs cvs={cvs} loading={loading} onCreateCv={() => setShowCreateDialog(true)} />

      {/* ── Stats Strip ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total CV",
            value: cvCount,
            suffix: limits.maxCvs ? `/ ${limits.maxCvs}` : "",
            icon: FileText,
            color: "text-primary bg-primary/10",
            note: cvCount === 0 ? "Belum ada CV" : cvCount === 1 ? "1 CV tersimpan" : `${cvCount} CV tersimpan`,
          },
          {
            label: "AI digunakan",
            value: aiUsageCount + scoreUsageCount,
            suffix: "kali",
            icon: Sparkles,
            color: "text-violet-700 bg-violet-500/10",
            note: "Bulan ini",
          },
          {
            label: "Skor ATS",
            value: scoreUsageCount,
            suffix: "x dicek",
            icon: BarChart3,
            color: "text-amber-700 bg-amber-500/10",
            note: scoreUsageCount === 0 ? "Belum pernah cek" : "Bulan ini",
          },
          {
            label: "Paket",
            value: tierName,
            suffix: "",
            icon: Crown,
            color: tier === "pro" ? "text-amber-700 bg-amber-500/10" : tier === "starter" ? "text-blue-700 bg-blue-500/10" : "text-muted-foreground bg-muted",
            note: tier === "free" ? "Upgrade tersedia" : "Aktif",
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card px-4 py-3 shadow-sm flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.color}`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="font-bold text-sm text-foreground truncate">
                {stat.value}{stat.suffix && <span className="text-xs font-normal text-muted-foreground ml-1">{stat.suffix}</span>}
              </p>
              <p className="text-[10px] text-muted-foreground/70 truncate">{stat.note}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tier Status + Usage Accordion ── */}
      <details className={cn(
        "rounded-xl border shadow-sm",
        tier === "pro" ? "bg-amber-50 border-amber-200" :
        tier === "starter" ? "bg-blue-50 border-blue-200" :
        "bg-card border-border",
      )}>
        <summary className="flex cursor-pointer items-center gap-3.5 px-4 py-3 select-none">
          {/* Crown icon circle */}
          <div className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            tier === "pro" ? "bg-amber-500" :
            tier === "starter" ? "bg-blue-500" :
            "bg-muted-foreground/20",
          )}>
            <Crown className="h-4 w-4 text-white" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white",
                tier === "pro" ? "bg-emerald-500" :
                tier === "starter" ? "bg-blue-500" :
                "bg-muted-foreground/60",
              )}>
                {tierName}
              </span>
              <span className={cn(
                "flex items-center gap-1 text-xs font-medium",
                tier === "pro" ? "text-emerald-600" :
                tier === "starter" ? "text-blue-600" :
                "text-muted-foreground",
              )}>
                <Star className="h-3 w-3" />
                Aktif
              </span>
            </div>
            <p className={cn(
              "mt-0.5 text-xs truncate",
              tier === "pro" ? "text-amber-800/70" :
              tier === "starter" ? "text-blue-800/70" :
              "text-muted-foreground",
            )}>
              {tier === "pro"
                ? "Siap untuk banyak role, banyak versi CV, dan interview practice."
                : tier === "starter"
                ? "Tools dasar untuk membuat CV profesional dan cek skor ATS."
                : "Mulai buat CV pertama kamu dan cek kesiapan ATS."}
            </p>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 shrink-0">
            {tier === "free" && (
              <Button asChild size="sm" variant="default" className="h-7 text-xs gap-1.5" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <Link to="/harga">
                  <Crown className="h-3.5 w-3.5" /> Upgrade
                </Link>
              </Button>
            )}
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[open]_&]:rotate-180" />
          </div>
        </summary>
        <div className="px-4 pb-4 pt-1">
          <UsageBars bars={usageBars} />
        </div>
      </details>

      {/* ── CV Limit Warning ── */}
      {atCvLimit && (
        <Alert className="border-warning/50 bg-warning/10 rounded-xl">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="flex items-center justify-between gap-2">
            <span className="text-sm">
              Kuota CV paket <strong>{tierName}</strong> sudah penuh ({cvCount}/{limits.maxCvs}).
            </span>
            <Button asChild size="sm" variant="outline" className="shrink-0 gap-1.5">
              <Link to="/harga">
                <Crown className="h-3.5 w-3.5" /> Upgrade
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Main 2-Column Grid ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* ── Left Column ── */}
        <div className="space-y-6">
          {/* AI Tools Panel */}
          <PowerFeatures
            features={powerFeatures}
            onFeatureClick={handleFeatureClick}
            onUpgrade={() => navigate({ to: "/harga" as never })}
          />
        </div>

        {/* ── Right Column ── */}
        <div className="space-y-5">
          {/* AI Recommendations Carousel */}
          <AiRecommendations
            recommendations={recommendations}
            onAction={(action) => {
              if (action === "upgrade") {
                navigate({ to: "/harga" as never });
              } else if (action === "create-cv") {
                setShowCreateDialog(true);
              } else {
                handleFeatureClick(action);
              }
            }}
          />

          {/* Activity Feed */}
          <ActivityFeed activities={activities} />
        </div>
      </div>

      {/* ── CV Picker Modal ── */}
      <CvPickerDialog
        open={showCvPicker !== null}
        onOpenChange={() => setShowCvPicker(null)}
        cvs={cvs}
        action={showCvPicker?.action ?? null}
        onSelect={handleCvSelect}
      />

      {/* ── Mode Choice Dialog ── */}
      <Dialog open={showModeDialog} onOpenChange={setShowModeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pilih cara mulai</DialogTitle>
            <DialogDescription>
              Template:{" "}
              <strong>
                {TEMPLATES.find((t) => t.id === selectedTemplate)?.name ?? selectedTemplate}
              </strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <button
              type="button"
              onClick={() => handleCreate(true)}
              disabled={creating}
              className="flex items-start gap-4 rounded-xl border-2 border-primary/30 bg-primary/5 p-4 text-left hover:border-primary hover:bg-primary/10 transition-all"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                  Panduan AI
                  <Badge className="text-[10px] bg-warning/20 text-warning hover:bg-warning/20">
                    Direkomendasikan
                  </Badge>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Cocok kalau kamu ingin dibantu menyusun isi CV langkah demi langkah.
                </p>
                {creating && <Loader2 className="h-4 w-4 animate-spin mt-2" />}
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleCreate(false)}
              disabled={creating}
              className="flex items-start gap-4 rounded-xl border-2 border-border p-4 text-left hover:border-primary/50 transition-all"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Edit3 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Isi sendiri atau upload CV</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Cocok kalau kamu sudah punya bahan dan ingin langsung masuk editor.
                </p>
                {creating && <Loader2 className="h-4 w-4 animate-spin mt-2" />}
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Create CV Dialog ── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Pilih Template CV</DialogTitle>
            <DialogDescription>
              Pilih tampilan awal. Struktur dan isi tetap bisa kamu ubah di editor.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto -mx-6 px-6 py-2">
            <TemplateGallery
              selected={selectedTemplate}
              onSelect={setSelectedTemplate}
              tier={tier}
              allowedTemplates={allowedTemplates}
            />
          </div>
          <div className="flex justify-end gap-2 mt-2 shrink-0 border-t pt-4">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                setShowCreateDialog(false);
                setShowModeDialog(true);
              }}
              className="gap-1.5"
            >
              Pilih Template
              <ArrowLeftRight className="h-3.5 w-3.5" style={{ transform: "rotate(90deg)" }} />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
