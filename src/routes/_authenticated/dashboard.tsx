import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { TemplateGallery } from "@/components/cv/TemplateGallery";
import { emptyCv, TEMPLATES, type TemplateId, type CvData } from "@/lib/cv-types";
import { scoreCvLocally } from "@/lib/local-scoring";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import {
  PowerFeatures,
  RecentCvs,
  CvPickerDialog,
  getCareerSteps,
  type CareerStep,
  NextStepCard,
  PlanCard,
  TryoutPromo,
  AiRecommendations,
  getRecommendations,
  MentoringCta,
  OnboardingWizard,
  LowScoreOnboarding,
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
  Trophy,
  Receipt,
  BookOpen,
  Plus,
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
  const [interviewCount, setInterviewCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLowScoreOnboarding, setShowLowScoreOnboarding] = useState(false);

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
      loadInterviewCount(user.id),
      loadApplicationCount(user.id),
    ]).finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!loading && cvCount === 0) {
      const dismissed = localStorage.getItem("onboarding_dismissed");
      if (dismissed !== "true") {
        setShowOnboarding(true);
      }
    }
  }, [loading, cvCount]);

  useEffect(() => {
    if (!loading && cvCount > 0 && cvs.length > 0) {
      const latestCv = cvs[0];
      const score = latestCv.ats_score;
      if (score !== null && score !== undefined && score < 70) {
        const dismissed = localStorage.getItem(`low_score_dismissed_${latestCv.id}`);
        if (dismissed !== "true") {
          setShowLowScoreOnboarding(true);
        }
      }
    }
  }, [loading, cvCount, cvs]);

  const handleOnboardingOpenChange = (open: boolean) => {
    setShowOnboarding(open);
    if (!open) {
      localStorage.setItem("onboarding_dismissed", "true");
    }
  };

  const handleLowScoreOpenChange = (open: boolean) => {
    setShowLowScoreOnboarding(open);
    if (!open && cvs.length > 0) {
      localStorage.setItem(`low_score_dismissed_${cvs[0].id}`, "true");
    }
  };

  const handleLowScoreAction = (
    action: "cv-review" | "keyword-extractor" | "tailor-cv" | "score" | "upgrade",
  ) => {
    setShowLowScoreOnboarding(false);
    if (cvs.length > 0) {
      localStorage.setItem(`low_score_dismissed_${cvs[0].id}`, "true");
      const cvId = cvs[0].id;
      if (action === "upgrade") {
        navigate({ to: "/harga" as never });
        return;
      }
      const routes: Record<string, string> = {
        "cv-review": "/cv-review/$cvId",
        "keyword-extractor": "/tools/keyword/$cvId",
        "tailor-cv": "/tools/tailor/$cvId",
        score: "/score/$cvId",
      };
      const route = routes[action];
      if (route) {
        navigate({ to: route.replace("$cvId", cvId) as never });
      }
    }
  };

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
    const row = data as unknown as { date_end?: string | null } | null;
    if (row?.date_end) {
      setSubscriptionEndDate(row.date_end);
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
      const cvIds = data.map((cv) => cv.id);
      const { data: dbScores } = await supabase
        .from("cv_scores")
        .select("cv_id, overall_score, created_at")
        .in("cv_id", cvIds)
        .order("created_at", { ascending: false });

      const latestScoresMap: Record<string, number> = {};
      if (dbScores) {
        for (const score of dbScores) {
          if (latestScoresMap[score.cv_id] === undefined) {
            latestScoresMap[score.cv_id] = score.overall_score;
          }
        }
      }

      const mappedCvs = data.map((cv) => {
        const score = latestScoresMap[cv.id];
        if (score !== undefined) {
          return {
            ...cv,
            ats_score: score,
          };
        }

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

  const loadInterviewCount = async (userId: string) => {
    const { count, error } = await (supabase as any)
      .from("interview_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if (!error && count !== null) {
      setInterviewCount(count);
    }
  };

  const loadApplicationCount = async (userId: string) => {
    const { count, error } = await (supabase as any)
      .from("job_applications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if (!error && count !== null) {
      setApplicationCount(count);
    }
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

  const handleCreate = async (guided = false, templateId?: TemplateId) => {
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
        template_id: templateId || selectedTemplate,
        data: emptyCv as unknown as Json,
      })
      .select("id")
      .single();
    setCreating(false);
    if (error) return toast.error(error.message);
    setShowCreateDialog(false);
    setShowModeDialog(false);
    setShowOnboarding(false);
    localStorage.setItem("onboarding_dismissed", "true");

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

  const scoredCvs = cvs.filter((cv) => typeof cv.ats_score === "number");
  const bestScore = scoredCvs.length
    ? Math.max(...scoredCvs.map((cv) => cv.ats_score as number))
    : null;
  const bestScoreNote =
    bestScore === null
      ? "Belum ada skor"
      : bestScore >= 80
        ? "Siap dikirim"
        : bestScore >= 60
          ? "Bisa ditingkatkan"
          : "Perlu perbaikan";

  const openCreateCv = () => {
    if (atCvLimit) {
      toast.error(`Kuota CV paket ${tierName} sudah penuh (${cvCount}/${limits.maxCvs}).`, {
        action: { label: "Upgrade", onClick: () => navigate({ to: "/harga" as never }) },
      });
      return;
    }
    setShowCreateDialog(true);
  };

  const handleStep = (step: CareerStep) => {
    if (step.id === "create-cv") {
      if (step.done) navigate({ to: "/cv" });
      else openCreateCv();
    } else if (step.id === "score-cv") handleFeatureClick("score");
    else if (step.id === "cover-letter") handleFeatureClick("cover-letter");
    else if (step.id === "interview") navigate({ to: "/simulasi-wawancara" });
    else if (step.id === "apply") navigate({ to: "/lamaran" });
  };

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
      desc: "Analisis kekuatan, kelemahan, dan saran perbaikan CV dari sudut pandang HR.",
      action: "cv-review",
      group: "improve" as const,
      visible: true,
      locked: (tierQuotas?.enable_cv_review ?? limits.enableCvReview) === false,
      upgradeTier: "Starter",
    },
    {
      icon: BarChart3,
      label: "CV Scoring",
      desc: "Skor ATS instan dan tips meningkatkan kecocokan.",
      action: "score",
      group: "improve" as const,
      visible: true,
      locked: false,
    },
    {
      icon: Key,
      label: "Keyword Extractor",
      desc: "Ambil keyword penting dari job description agar CV lebih relevan.",
      action: "keyword-extractor",
      group: "improve" as const,
      visible: true,
      locked: (tierQuotas?.enable_keyword_extractor ?? limits.canKeywordExtract) === false,
      upgradeTier: "Starter",
    },
    {
      icon: RefreshCw,
      label: "Auto Tailor CV",
      desc: "Sesuaikan CV otomatis dengan persyaratan lowongan.",
      action: "tailor-cv",
      group: "improve" as const,
      isNew: true,
      visible: true,
      locked: tier !== "pro",
      upgradeTier: "Pro",
    },
    {
      icon: ArrowLeftRight,
      label: "CV Comparison",
      desc: "Bandingkan dua versi CV dalam satu layar.",
      action: "compare",
      group: "improve" as const,
      visible: true,
      locked: (tierQuotas?.enable_cv_comparison ?? limits.canCompare) === false,
      upgradeTier: "Pro",
    },
    {
      icon: FileSearch,
      label: "AI Job Match",
      desc: "Cocokkan CV dengan lowongan dan lihat persentase kecocokan.",
      action: "job-match",
      group: "apply" as const,
      isNew: true,
      visible: true,
      locked: tier === "free",
      upgradeTier: "Starter",
    },
    {
      icon: FileCheck,
      label: "Cover Letter AI",
      desc: "Surat lamaran yang nyambung dengan CV dan perusahaan target.",
      action: "cover-letter",
      group: "apply" as const,
      visible: true,
      locked: (tierQuotas?.enable_cover_letter ?? limits.canCoverLetter) === false,
      upgradeTier: "Starter",
    },
    {
      icon: Mic,
      label: "Simulasi Wawancara",
      desc: "Latihan menjawab pertanyaan realistis dengan feedback langsung.",
      action: "simulasi",
      group: "apply" as const,
      visible: true,
      locked: (tierQuotas?.enable_interview_simulator ?? limits.canInterviewSimulator) === false,
      upgradeTier: "Pro",
    },
    {
      icon: Briefcase,
      label: "Pelamaran",
      desc: "Lacak semua lamaran kerja dan statusnya.",
      action: "lamaran",
      group: "apply" as const,
      visible: true,
      locked: false,
    },
    {
      icon: TrendingUp,
      label: "Analitik",
      desc: "Pantau berapa kali CV dilihat, diunduh, dan dibagikan.",
      action: "analitik",
      group: "more" as const,
      visible: true,
      locked: (tierQuotas?.enable_analytics ?? limits.canAnalytics) === false,
      upgradeTier: "Pro",
    },
    {
      icon: Trophy,
      label: "Tryout SKD",
      desc: "Simulasi ujian SKD 110 soal sesuai kisi-kisi BKN.",
      action: "tryout",
      group: "more" as const,
      visible: true,
      locked: false,
    },
    {
      icon: Gift,
      label: "Referral",
      desc: "Undang teman dan dapatkan bonus kuota AI.",
      action: "referral",
      group: "more" as const,
      visible: true,
      locked: false,
    },
    {
      icon: Receipt,
      label: "Riwayat Pembayaran",
      desc: "Lanjutkan pembayaran tertunda dan unduh invoice.",
      action: "pembayaran",
      group: "more" as const,
      visible: true,
      locked: false,
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
      tryout: "/tryout",
      pembayaran: "/pembayaran",
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
    hasInterview: hasCv && interviewCount > 0,
    hasApplied: hasCv && applicationCount > 0,
    tier,
    interviewCount,
  });

  // ─── AI Recommendations ───
  const recommendations = getRecommendations({
    hasCv: cvCount > 0,
    hasScore: scoreUsageCount > 0,
    tier,
    cvCount,
  });

  // Formatted subscription end date
  const formattedEndDate =
    subscriptionEndDate && tier !== "free"
      ? new Date(subscriptionEndDate).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null;

  if (loading) {
    return <DashboardSkeleton />;
  }

  const displayName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "kamu";

  const stats = [
    {
      label: "Skor ATS terbaik",
      shortLabel: "Skor ATS",
      value: bestScore ?? "—",
      note: bestScoreNote,
      icon: BarChart3,
    },
    {
      label: "CV tersimpan",
      shortLabel: "CV",
      value: limits.maxCvs !== null ? `${cvCount}/${limits.maxCvs}` : cvCount,
      note: atCvLimit
        ? "Kuota penuh"
        : limits.maxCvs !== null
          ? `Sisa ${limits.maxCvs - cvCount}`
          : "Tanpa batas",
      icon: FileText,
    },
    {
      label: "AI dipakai",
      shortLabel: "AI dipakai",
      value: totalAiUsage,
      note: "kali bulan ini",
      icon: Sparkles,
    },
  ];

  return (
    <div className="container-page w-full max-w-full space-y-6 overflow-x-hidden py-6 md:space-y-8 md:py-10">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">Dashboard</p>
          <h1 className="mt-1 truncate font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Halo, {displayName} 👋
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
            Paket <span className="font-semibold text-foreground">{tierName}</span>
            {formattedEndDate ? ` · berlaku hingga ${formattedEndDate}` : ""}. Yuk lanjutkan
            persiapan kariermu.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button asChild variant="outline" className="h-11 flex-1 rounded-xl sm:flex-none">
            <Link to="/panduan-cv-ats">
              <BookOpen aria-hidden="true" className="mr-1.5 h-4 w-4" />
              Panduan
            </Link>
          </Button>
          <Button
            onClick={openCreateCv}
            className="h-11 flex-1 rounded-xl px-5 font-bold sm:flex-none"
          >
            <Plus aria-hidden="true" className="mr-1.5 h-4 w-4" />
            Buat CV Baru
          </Button>
        </div>
      </header>

      {/* Langkah berikutnya */}
      <NextStepCard
        steps={careerSteps}
        onStep={handleStep}
        onAllDone={() => handleFeatureClick("score")}
      />

      {/* Statistik ringkas */}
      <section aria-label="Ringkasan" className="grid grid-cols-3 gap-2 sm:gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border bg-card p-3 shadow-sm sm:p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <stat.icon aria-hidden="true" className="hidden h-4 w-4 sm:block" />
              <span className="text-[11px] font-medium leading-tight sm:text-sm">
                <span className="sm:hidden">{stat.shortLabel}</span>
                <span className="hidden sm:inline">{stat.label}</span>
              </span>
            </div>
            <p className="mt-1.5 font-display text-2xl font-extrabold tabular-nums leading-none sm:mt-2 sm:text-3xl">
              {stat.value}
            </p>
            <p
              className={cn(
                "mt-1 truncate text-[11px] sm:text-xs",
                stat.note === "Kuota penuh"
                  ? "font-semibold text-red-600"
                  : "text-muted-foreground",
              )}
            >
              {stat.note}
            </p>
          </div>
        ))}
      </section>

      {/* Konten utama: di mobile urutannya diatur lewat order-*, di desktop 2 kolom */}
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-8">
        <div className="contents lg:block lg:space-y-8">
          <div className="order-1 min-w-0">
            <RecentCvs cvs={cvs} loading={loading} onCreateCv={openCreateCv} />
          </div>
          <div className="order-3 min-w-0">
            <PowerFeatures
              features={powerFeatures}
              onFeatureClick={handleFeatureClick}
              onUpgrade={() => navigate({ to: "/harga" as never })}
            />
          </div>
        </div>

        <aside className="contents lg:block lg:space-y-5" aria-label="Info akun dan rekomendasi">
          <div className="order-2 min-w-0">
            <PlanCard
              tier={tier}
              tierName={tierName}
              activeUntil={formattedEndDate}
              quotas={usageBars}
            />
          </div>
          <div className="order-4 min-w-0">
            <AiRecommendations
              recommendations={recommendations}
              onAction={(action) => {
                if (action === "upgrade") navigate({ to: "/harga" as never });
                else if (action === "create-cv") openCreateCv();
                else handleFeatureClick(action);
              }}
            />
          </div>
          <div className="order-5 min-w-0">
            <TryoutPromo />
          </div>
          <div className="order-6 min-w-0">
            <MentoringCta />
          </div>
        </aside>
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

      {/* Onboarding Wizard Modal */}
      <OnboardingWizard
        open={showOnboarding}
        onOpenChange={handleOnboardingOpenChange}
        tier={tier}
        allowedTemplates={allowedTemplates}
        onCreateCv={(tpl, guided) => handleCreate(guided, tpl)}
        creating={creating}
      />

      {/* Low ATS Score Onboarding Modal */}
      {cvs.length > 0 && (
        <LowScoreOnboarding
          open={showLowScoreOnboarding}
          onOpenChange={handleLowScoreOpenChange}
          score={cvs[0].ats_score ?? 0}
          cvTitle={cvs[0].title}
          cvId={cvs[0].id}
          onStartAction={handleLowScoreAction}
          tier={tier}
          scoreUsageCount={scoreUsageCount}
          maxScoreUsage={tierQuotas?.quota_ai_score ?? limits.maxAtsScores}
        />
      )}
    </div>
  );
}
