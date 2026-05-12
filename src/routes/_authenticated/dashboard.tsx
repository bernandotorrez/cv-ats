import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth-context";
import { isAdmin } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import { getUserTier, getTierLimits, type Tier, type TierLimits } from "@/lib/subscription";
import { Crown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
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
} from "@/components/dashboard";
import {
  FileText,
  Sparkles,
  BarChart3,
  Brain,
  FileCheck,
  Target,
  Key,
  Type,
  MessageSquare,
  Shield,
  Mic,
  Gift,
  TrendingUp,
  Briefcase,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () =>
    buildSeo({
      title: "Dashboard — CV Pintar",
      description: "Dashboard akun.",
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

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(false);
  const [tier, setTier] = useState<Tier>("free");
  const [limits, setLimits] = useState<TierLimits>(getTierLimits("free"));
  const [tierQuotas, setTierQuotas] = useState<any>(null);
  const [cvs, setCvs] = useState<CvRow[]>([]);
  const [cvCount, setCvCount] = useState(0);
  const [aiUsageCount, setAiUsageCount] = useState(0);
  const [scoreUsageCount, setScoreUsageCount] = useState(0);
  const [guidedUsageCount, setGuidedUsageCount] = useState(0);
  const [coverLetterUsageCount, setCoverLetterUsageCount] = useState(0);
  const [cvReviewUsageCount, setCvReviewUsageCount] = useState(0);
  const [keywordExtractUsageCount, setKeywordExtractUsageCount] = useState(0);
  const [textPolishUsageCount, setTextPolishUsageCount] = useState(0);
  const [chatUsageCount, setChatUsageCount] = useState(0);
  const [showCvPicker, setShowCvPicker] = useState<{ action: string } | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

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
    ]).finally(() => setLoading(false));
  }, [user?.id]);

  const loadTierQuotas = async (userId: string) => {
    const { data } = await (supabase as any)
      .from("user_subscriptions")
      .select(
        `subscription_tiers!inner(
          quota_ai_suggest,
          quota_ai_score,
          quota_ai_chat,
          quota_ai_cover_letter,
          quota_ai_keyword_extract,
          quota_cv_review,
          quota_ai_polish,
          quota_guided_mode,
          enable_cv_review,
          enable_cover_letter,
          enable_keyword_extractor,
          enable_text_polish,
          enable_guided_mode
        )`,
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .single();
    if (data?.subscription_tiers) {
      setTierQuotas(data.subscription_tiers);
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
    const items: ActivityItem[] = (data ?? []).map((cv: any) => ({
      action: "edit",
      label: cv.title,
      time: new Date(cv.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
    }));
    if (items.length === 0) {
      items.push({ action: "welcome", label: "CV pertamamu menunggu!", time: "Sekarang" });
    }
    setActivities(items);
  };

  const atCvLimit = limits.maxCvs !== null && cvCount >= limits.maxCvs;
  const tierName = tier === "free" ? "Free" : tier === "starter" ? "Starter" : "Pro";

  // Build usage bars
  const usageBars = [
    { icon: FileText, label: "CV", used: cvCount, max: limits.maxCvs, color: "bg-primary-soft text-primary", visible: true },
    { icon: Sparkles, label: "AI Saran", used: aiUsageCount, max: tierQuotas?.quota_ai_suggest ?? limits.maxAiSuggestions, color: "bg-violet-500/10 text-violet-600", visible: limits.enableAiSuggest },
    { icon: BarChart3, label: "CV Scoring", used: scoreUsageCount, max: tierQuotas?.quota_ai_score ?? limits.maxAtsScores, color: "bg-amber-500/10 text-amber-600", visible: limits.enableAiScore },
    { icon: Brain, label: "Guided Mode", used: guidedUsageCount, max: tierQuotas?.quota_guided_mode ?? limits.maxGuidedSessions, color: "bg-emerald-500/10 text-emerald-600", visible: tierQuotas?.enable_guided_mode ?? limits.enableGuidedMode },
    {
      icon: FileCheck, label: "Cover Letter", used: coverLetterUsageCount,
      max: tierQuotas?.quota_ai_cover_letter ?? (tierQuotas?.enable_cover_letter ? (tier === "free" ? 1 : tier === "starter" ? 10 : null) : 0),
      color: "bg-teal-500/10 text-teal-600", visible: tierQuotas?.enable_cover_letter ?? limits.canCoverLetter,
    },
    {
      icon: Target, label: "CV Review", used: cvReviewUsageCount,
      max: tierQuotas?.quota_cv_review ?? (tierQuotas?.enable_cv_review ? (tier === "starter" ? 10 : null) : 0),
      color: "bg-rose-500/10 text-rose-600", visible: tierQuotas?.enable_cv_review ?? limits.enableCvReview,
    },
    {
      icon: Key, label: "Keyword Extract", used: keywordExtractUsageCount,
      max: tierQuotas?.quota_ai_keyword_extract ?? (tierQuotas?.enable_keyword_extractor ? (tier === "free" ? 2 : tier === "starter" ? 20 : null) : 0),
      color: "bg-blue-500/10 text-blue-600", visible: tierQuotas?.enable_keyword_extractor ?? limits.canKeywordExtract,
    },
    { icon: Type, label: "Text Polish", used: textPolishUsageCount, max: tierQuotas?.quota_ai_polish ?? limits.maxTextPolish, color: "bg-purple-500/10 text-purple-600", visible: tierQuotas?.enable_text_polish ?? limits.enableTextPolish },
    { icon: MessageSquare, label: "AI Chat", used: chatUsageCount, max: tierQuotas?.quota_ai_chat ?? (tier === "free" ? 5 : tier === "starter" ? 50 : null), color: "bg-cyan-500/10 text-cyan-600", visible: true },
  ];

  // Build power features
  const powerFeatures = [
    {
      icon: Brain, label: "CV Review AI",
      desc: "AI analisis CV-mu seperti HR profesional — skor, saran perbaikan, dan rekomendasi kata kunci.",
      action: "cv-review", badge: "Powerful", visible: true,
      locked: (tierQuotas?.enable_cv_review ?? limits.enableCvReview) === false, upgradeTier: "Starter",
      gradient: "bg-gradient-to-r from-rose-500 to-pink-500",
    },
    {
      icon: BarChart3, label: "CV Scoring",
      desc: "Lihat skor ATS CV-mu secara instan. Ketahui bagian mana yang perlu diperbaiki.",
      action: "score", badge: "Analitik", visible: true, locked: false,
      gradient: "bg-gradient-to-r from-amber-500 to-orange-500",
    },
    {
      icon: Mic, label: "Simulasi Wawancara",
      desc: "Latihan interview dengan AI. Pertanyaan realistis dan feedback instan.",
      action: "simulasi", badge: "Pro", visible: true,
      locked: (tierQuotas?.enable_interview_simulator ?? limits.canInterviewSimulator) === false, upgradeTier: "Pro",
      gradient: "bg-gradient-to-r from-rose-500 to-red-500",
    },
    {
      icon: FileCheck, label: "Cover Letter AI",
      desc: "Generate surat lamaran yang personalize dari CV dan job description.",
      action: "cover-letter", badge: "Baru", visible: true,
      locked: (tierQuotas?.enable_cover_letter ?? limits.canCoverLetter) === false, upgradeTier: "Starter",
      gradient: "bg-gradient-to-r from-teal-500 to-cyan-500",
    },
    {
      icon: Key, label: "Keyword Extractor",
      desc: "Ekstrak keyword dari job description untuk optimasi CV ATS. Auto-suggest keyword berdasarkan posisi target.",
      action: "keyword-extractor", badge: "ATS", visible: true,
      locked: (tierQuotas?.enable_keyword_extractor ?? limits.canKeywordExtract) === false, upgradeTier: "Starter",
      gradient: "bg-gradient-to-r from-blue-500 to-indigo-500",
    },
  ];

  // Build quick actions
  const quickActions: { icon: typeof FileText; label: string; action: string; color: string; visible: boolean; locked?: boolean; upgradeTier?: string }[] = [
    { icon: FileText, label: "Kelola CV", action: "manage", color: "bg-primary-soft text-primary", visible: true },
    { icon: Sparkles, label: "AI Saran", action: "ai-suggest", color: "bg-violet-500/10 text-violet-600", visible: true },
    { icon: BarChart3, label: "CV Scoring", action: "score", color: "bg-amber-500/10 text-amber-600", visible: true },
    { icon: Briefcase, label: "Pelamaran", action: "lamaran", color: "bg-blue-500/10 text-blue-600", visible: true },
    { icon: Mic, label: "Simulasi", action: "simulasi", color: "bg-rose-500/10 text-rose-600", visible: true, locked: (tierQuotas?.enable_interview_simulator ?? limits.canInterviewSimulator) === false, upgradeTier: "Pro" },
    { icon: FileCheck, label: "Cover Letter", action: "cover-letter", color: "bg-teal-500/10 text-teal-600", visible: true, locked: (tierQuotas?.enable_cover_letter ?? limits.canCoverLetter) === false, upgradeTier: "Starter" },
    { icon: Key, label: "Keyword", action: "keyword-extractor", color: "bg-blue-500/10 text-blue-600", visible: true, locked: (tierQuotas?.enable_keyword_extractor ?? limits.canKeywordExtract) === false, upgradeTier: "Starter" },
    { icon: Gift, label: "Referral", action: "referral", color: "bg-pink-500/10 text-pink-600", visible: true },
    { icon: TrendingUp, label: "Analitik", action: "analitik", color: "bg-indigo-500/10 text-indigo-600", visible: true, locked: (tierQuotas?.enable_analytics ?? limits.canAnalytics) === false, upgradeTier: "Pro" },
    ...(admin ? [{ icon: Shield, label: "Admin", action: "admin" as const, color: "bg-red-500/10 text-red-600", visible: true }] : []),
  ];

  const CV_PICKER_ACTIONS = ["cv-review", "score", "ai-suggest", "cover-letter", "keyword-extractor"];

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
      referral: "/referral",
      analitik: "/analitik",
      admin: "/admin",
    };
    if (routes[action]) navigate({ to: routes[action] as any });
  };

  const handleCvSelect = (cvId: string) => {
    if (!showCvPicker) return;
    const routes: Record<string, string> = {
      "cv-review": "/cv-review/$cvId",
      score: "/score/$cvId",
      "ai-suggest": "/cv/$id",
      "cover-letter": "/tools/cover-letter/$cvId",
      "keyword-extractor": "/tools/keyword/$cvId",
    };
    const route = routes[showCvPicker.action];
    if (route) {
      navigate({ to: route.replace("$cvId", cvId).replace("$id", cvId) as any });
    }
    setShowCvPicker(null);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      {/* ── Welcome Hero ── */}
      <WelcomeHeader user={user} />

      {/* ── Tier Banner ── */}
      <TierBanner tier={tier} limits={limits} cvCount={cvCount} aiUsageCount={aiUsageCount} />

      {/* ── CV Limit Warning ── */}
      {atCvLimit && (
        <Alert className="border-warning/50 bg-warning/10 rounded-2xl">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="flex items-center justify-between gap-2">
            <span>
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

      {/* ── Usage Stats ── */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-bold text-foreground">Penggunaan Bulan Ini</h2>
        </div>
        <UsageBars bars={usageBars} />
      </section>

      {/* ── Power Features ── */}
      <PowerFeatures
        features={powerFeatures}
        onFeatureClick={handleFeatureClick}
        onUpgrade={() => navigate({ to: "/harga" } as any)}
      />

      {/* ── Quick Actions ── */}
      <QuickActions actions={quickActions} onAction={handleFeatureClick} />

      {/* ── Main Content Grid ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          <RecentCvs cvs={cvs} loading={loading} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <ActivityFeed activities={activities} />
          {tier === "free" && <UpgradeCard />}
          <TipsCard />
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
    </div>
  );
}
