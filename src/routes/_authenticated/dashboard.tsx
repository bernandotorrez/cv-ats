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
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { getUserTier, getTierLimits, type Tier, type TierLimits } from "@/lib/subscription";
import { Crown, AlertCircle } from "lucide-react";
import { TemplateGallery } from "@/components/cv/TemplateGallery";
import { emptyCv, TEMPLATES, type TemplateId, type CvData } from "@/lib/cv-types";
import { scoreCvLocally } from "@/lib/local-scoring";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import {
  WelcomeHeader,
  TierBanner,
  UsageBars,
  PowerFeatures,
  RecentCvs,
  ActivityFeed,
  UpgradeCard,
  TipsCard,
  CvPickerDialog,
  CareerProgress,
  getCareerSteps,
  AiRecommendations,
  getRecommendations,
  MentoringCta,
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
  ArrowRight,
  Check,
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
  ats_score?: number | null;
  data?: any;
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
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null);
  const [showQuotas, setShowQuotas] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      getUserTier(user.id).then((t) => {
        setTier(t);
        setLimits(getTierLimits(t));
      }),
      loadTierQuotas(user.id),
      loadCvs(user.id),
      loadUsageStats(user.id),
      loadActivities(user.id),
      loadAllowedTemplates(user.id),
      loadSubscriptionEndDate(user.id),
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

  const loadSubscriptionEndDate = async (userId: string) => {
    const { data } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();
    const row = data as unknown as { end_date?: string } | null;
    if (row?.end_date) {
      setSubscriptionEndDate(row.end_date);
    }
  };

  const loadCvs = async (userId: string) => {
    const { data, count } = await supabase
      .from("cvs")
      .select("id, title, template_id, status, updated_at, created_at, data", { count: "exact" })
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(5);

    if (data && data.length > 0) {
      const mappedCvs = data.map((cv) => {
        let computedScore = null;
        try {
          if (cv.data) {
            const cvData = cv.data as unknown as CvData;
            const targetRole = cvData.personal?.headline || undefined;
            const scoreResult = scoreCvLocally(cvData, targetRole);
            computedScore = scoreResult.overallScore;
          }
        } catch (e) {
          console.error("Error scoring cv locally:", e);
        }
        return {
          ...cv,
          ats_score: computedScore,
        };
      });
      setCvs(mappedCvs);
    } else {
      setCvs([]);
    }
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
      time:
        new Date(cv.updated_at).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }) +
        " • " +
        new Date(cv.updated_at).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
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

  const totalAiUsage =
    aiUsageCount +
    scoreUsageCount +
    jobMatchUsageCount +
    tailorCvUsageCount +
    coverLetterUsageCount +
    cvReviewUsageCount +
    keywordExtractUsageCount +
    textPolishUsageCount +
    chatUsageCount;

  // Average ATS score placeholder — we show "Bagus" label instead
  const avgAtsLabel = scoreUsageCount > 0 ? "Bagus" : "—";

  const usageBars = [
    {
      icon: FileText,
      label: "CV",
      used: cvCount,
      max: limits.maxCvs,
      color: "bg-[#ecf7ed] text-[#2e7d32]",
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
      desc: "Analisis kekuatan, kelemahan, dan saran improvement CV kamu.",
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
      desc: "Dapatkan skor ATS instan dan tips meningkatkan kecocokan.",
      action: "score",
      badge: "Analitik",
      visible: true,
      locked: false,
      gradient: "bg-gradient-to-r from-amber-500 to-orange-500",
    },
    {
      icon: FileSearch,
      label: "AI Job Match Score",
      desc: "Cocokkan CV dengan lowongan dan lihat persentase kecocokan.",
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
      desc: "Sesuaikan CV otomatis dengan persyaratan lowongan kerja.",
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
    {
      icon: Briefcase,
      label: "Pelamaran",
      desc: "Lacak semua lamaran kerja dan statusnya di satu dashboard.",
      action: "lamaran",
      badge: "Tracker",
      visible: true,
      locked: false,
      gradient: "bg-gradient-to-r from-blue-500 to-sky-500",
    },
    {
      icon: TrendingUp,
      label: "Analitik",
      desc: "Pantau performa CV: berapa kali dilihat, diunduh, dan dibagikan.",
      action: "analitik",
      badge: "Pro",
      visible: true,
      locked: (tierQuotas?.enable_analytics ?? limits.canAnalytics) === false,
      upgradeTier: "Pro",
      gradient: "bg-gradient-to-r from-indigo-500 to-purple-500",
    },
    {
      icon: Gift,
      label: "Referral",
      desc: "Undang teman dan dapatkan bonus kuota AI gratis.",
      action: "referral",
      badge: "Bonus",
      visible: true,
      locked: false,
      gradient: "bg-gradient-to-r from-pink-500 to-rose-500",
    },
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
    tier,
  });

  // ─── AI Recommendations ───
  const recommendations = getRecommendations({
    hasCv: cvCount > 0,
    hasScore: scoreUsageCount > 0,
    tier,
    cvCount,
  });

  // Formatted subscription end date
  const formattedEndDate = subscriptionEndDate
    ? new Date(subscriptionEndDate).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="container-page space-y-6 py-5 md:space-y-7 md:py-8">
      {/* ═══════════════════════════════════════════════
          Section 1: Hero Banner (CareerProgress)
          ═══════════════════════════════════════════════ */}
      <CareerProgress
        user={user}
        steps={careerSteps}
        onCreateCv={() => setShowCreateDialog(true)}
        onStepClick={(step) => {
          if (step.id === "create-cv") {
            if (!step.done) {
              setShowCreateDialog(true);
            } else {
              navigate({ to: "/cv" });
            }
          } else if (step.id === "score-cv") {
            handleFeatureClick("score");
          } else if (step.id === "cover-letter") {
            handleFeatureClick("cover-letter");
          } else if (step.id === "interview") {
            navigate({ to: "/simulasi-wawancara" });
          } else if (step.id === "apply") {
            navigate({ to: "/lamaran" });
          }
        }}
      />

      {/* ═══════════════════════════════════════════════
          Section 2: Step Pills (Lanjutkan langkahmu)
          ═══════════════════════════════════════════════ */}
      <section>
        <h3 className="font-display text-sm font-bold text-foreground mb-3">Lanjutkan langkahmu</h3>
        <div className="flex items-stretch gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {careerSteps.map((step, idx) => {
            const StepIcon = step.icon;
            const isActive = !step.done && careerSteps.findIndex((s) => !s.done) === idx;
            const useLink = !!(step.link && (step.done || step.id !== "create-cv"));

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (step.id === "create-cv" && !step.done) {
                    setShowCreateDialog(true);
                  } else if (step.link) {
                    navigate({ to: step.link as never });
                  } else {
                    if (step.id === "score-cv") handleFeatureClick("score");
                    else if (step.id === "cover-letter") handleFeatureClick("cover-letter");
                  }
                }}
                className={cn(
                  "flex items-center gap-3 shrink-0 rounded-xl border px-4 py-3 transition-all min-w-[140px]",
                  isActive
                    ? "border-emerald-400 bg-white shadow-sm ring-1 ring-emerald-200"
                    : step.done
                      ? "border-border bg-card hover:bg-muted/30"
                      : "border-border bg-card hover:bg-muted/30 opacity-60",
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    step.done
                      ? "bg-emerald-500 text-white"
                      : isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {step.done ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 text-left">
                  <p
                    className={cn(
                      "text-xs font-semibold truncate",
                      isActive
                        ? "text-foreground"
                        : step.done
                          ? "text-foreground"
                          : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{step.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          Section 3: Main 2-Column Layout
          ═══════════════════════════════════════════════ */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* ── Left Column ── */}
        <div className="space-y-6">
          {/* CV Kamu */}
          <RecentCvs cvs={cvs} loading={loading} onCreateCv={() => setShowCreateDialog(true)} />

          {/* Stats Strip — 4 cards */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
            {[
              {
                label: "Total CV",
                value: cvCount,
                suffix: "",
                icon: FileText,
                color: "text-emerald-700 bg-emerald-500/10",
                note:
                  cvCount === 0 ? "Belum ada CV" : cvCount === 1 ? "CV tersimpan" : `CV tersimpan`,
              },
              {
                label: "AI Digunakan",
                value: totalAiUsage,
                suffix: "",
                icon: Sparkles,
                color: "text-emerald-700 bg-emerald-500/10",
                note: "kali bulan ini",
                change:
                  totalAiUsage > 0 ? `+${Math.round(totalAiUsage * 0.12 * 100) / 100}%` : undefined,
              },
              {
                label: "Skor ATS Rata-rata",
                value: scoreUsageCount > 0 ? 79 : "—",
                suffix: "",
                icon: BarChart3,
                color: "text-amber-700 bg-amber-500/10",
                note: avgAtsLabel,
                change: scoreUsageCount > 0 ? "+6%" : undefined,
              },
              {
                label: "Paket Kamu",
                value: tierName,
                suffix: "",
                icon: Crown,
                color:
                  tier === "pro"
                    ? "text-amber-700 bg-amber-500/10"
                    : tier === "starter"
                      ? "text-blue-700 bg-blue-500/10"
                      : "text-muted-foreground bg-muted",
                note: formattedEndDate
                  ? `Aktif hingga ${formattedEndDate}`
                  : tier === "free"
                    ? "Upgrade tersedia"
                    : "Aktif",
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border bg-card px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div
                    className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg ${stat.color}`}
                  >
                    <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</p>
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <p className="font-bold text-base sm:text-lg text-foreground">{stat.value}</p>
                      {"change" in stat && stat.change && (
                        <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-600">
                          {stat.change}
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground/70 truncate">{stat.note}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tier Status Banner */}
          <div
            className={cn(
              "rounded-xl border transition-all overflow-hidden",
              tier === "pro"
                ? "bg-emerald-50/50 border-emerald-200"
                : tier === "starter"
                  ? "bg-blue-50/50 border-blue-200"
                  : "bg-card border-border",
            )}
          >
            {/* Header / Clickable Area */}
            <div
              onClick={() => setShowQuotas(!showQuotas)}
              className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 p-4 cursor-pointer select-none hover:bg-muted/10 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Status icon */}
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    tier === "pro"
                      ? "bg-emerald-500"
                      : tier === "starter"
                        ? "bg-blue-500"
                        : "bg-muted-foreground/20",
                  )}
                >
                  <Crown className="h-4 w-4 text-white" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white",
                        tier === "pro"
                          ? "bg-emerald-500"
                          : tier === "starter"
                            ? "bg-blue-500"
                            : "bg-muted-foreground/60",
                      )}
                    >
                      {tierName}
                    </span>
                    <span
                      className={cn(
                        "flex items-center gap-1 text-xs font-medium",
                        tier === "pro"
                          ? "text-emerald-600"
                          : tier === "starter"
                            ? "text-blue-600"
                            : "text-muted-foreground",
                      )}
                    >
                      <Star className="h-3 w-3" />
                      Aktif
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-0.5 text-xs truncate",
                      tier === "pro"
                        ? "text-emerald-800/70"
                        : tier === "starter"
                          ? "text-blue-800/70"
                          : "text-muted-foreground",
                    )}
                  >
                    {tier === "pro"
                      ? "Kamu pengguna Pro! Nikmati semua fitur premium tanpa batas."
                      : tier === "starter"
                        ? "Tools dasar untuk membuat CV profesional."
                        : "Mulai buat CV pertama kamu dan cek kesiapan ATS."}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-[11px] font-medium opacity-85",
                      tier === "pro"
                        ? "text-emerald-700"
                        : tier === "starter"
                          ? "text-blue-700"
                          : "text-muted-foreground",
                    )}
                  >
                    Klik ikon v untuk melihat sisa quota mu
                  </p>
                </div>
              </div>

              {/* Right side actions */}
              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0">
                <div onClick={(e) => e.stopPropagation()} className="w-full sm:w-auto shrink-0 flex justify-end">
                  {tier === "free" ? (
                    <Button
                      asChild
                      size="sm"
                      className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
                    >
                      <Link to="/harga">
                        <Crown className="h-3.5 w-3.5" /> Upgrade
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild size="sm" variant="outline" className="h-8 text-xs w-full sm:w-auto">
                      <Link to="/harga">Kelola Paket</Link>
                    </Button>
                  )}
                </div>

                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0",
                    showQuotas && "rotate-180"
                  )}
                />
              </div>
            </div>

            {/* Collapsible Content */}
            {showQuotas && (
              <div className="px-4 pb-5 pt-2 border-t border-dashed border-border/60 bg-background/30">
                <UsageBars bars={usageBars} />
              </div>
            )}
          </div>

          {/* CV Limit Warning */}
          {atCvLimit && (
            <Alert className="border-warning/50 bg-warning/10 rounded-xl">
              <AlertCircle className="h-4 w-4 text-warning" />
              <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-sm">
                  Kuota CV paket <strong>{tierName}</strong> sudah penuh ({cvCount}/{limits.maxCvs}
                  ).
                </span>
                <Button asChild size="sm" variant="outline" className="w-full sm:w-auto shrink-0 gap-1.5">
                  <Link to="/harga">
                    <Crown className="h-3.5 w-3.5" /> Upgrade
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Tools AI untuk CV-mu */}
          <PowerFeatures
            features={powerFeatures}
            onFeatureClick={handleFeatureClick}
            onUpgrade={() => navigate({ to: "/harga" as never })}
          />
        </div>

        {/* ── Right Column (Sidebar) ── */}
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

          {/* Mentoring CTA */}
          <MentoringCta />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          Modals / Dialogs
          ═══════════════════════════════════════════════ */}

      {/* CV Picker Modal */}
      <CvPickerDialog
        open={showCvPicker !== null}
        onOpenChange={() => setShowCvPicker(null)}
        cvs={cvs}
        action={showCvPicker?.action ?? null}
        onSelect={handleCvSelect}
      />

      {/* Mode Choice Dialog */}
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
              className="flex items-start gap-4 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4 text-left hover:border-emerald-500 hover:bg-emerald-100 transition-all"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                <Sparkles className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                  Panduan AI
                  <Badge className="text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-100">
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
              className="flex items-start gap-4 rounded-xl border-2 border-border p-4 text-left hover:border-emerald-300 transition-all"
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

      {/* Create CV Dialog */}
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
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
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
