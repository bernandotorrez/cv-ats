import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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
import { getUserTier, getTierLimits, type Tier, type TierLimits } from "@/lib/subscription";
import { TEMPLATES } from "@/lib/cv-types";
import {
  FileText,
  Plus,
  Sparkles,
  BarChart3,
  Shield,
  Pencil,
  Crown,
  AlertCircle,
  Zap,
  Mic,
  Gift,
  TrendingUp,
  Target,
  Brain,
  Lightbulb,
  ChevronRight,
  Star,
  ArrowUpRight,
  Activity,
  FileCheck,
  Briefcase,
  MessageSquare,
  Key,
  Type,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () =>
    buildSeo({
      title: "Dashboard — CV ATS Indonesia",
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
  link?: string;
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
          enable_cv_review,
          enable_cover_letter,
          enable_keyword_extractor,
          enable_text_polish
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

    // Single query to get all usage counts grouped by feature
    const { data, error } = await supabase
      .from("ai_usage")
      .select("feature")
      .eq("user_id", userId)
      .gte("created_at", iso);

    if (error) {
      console.error("Failed to load usage stats:", error);
      return;
    }

    // Count occurrences of each feature
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      counts[row.feature] = (counts[row.feature] || 0) + 1;
    }

    setAiUsageCount(counts["suggest"] ?? 0);
    setScoreUsageCount(counts["score"] ?? 0);
    setGuidedUsageCount(counts["chat"] ?? 0);
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

  // Build usage bars dynamically based on tier features
  const usageBars = [
    {
      icon: FileText,
      label: "CV",
      used: cvCount,
      max: limits.maxCvs,
      color: "bg-primary",
      visible: true,
    },
    {
      icon: Sparkles,
      label: "AI Saran",
      used: aiUsageCount,
      max: tierQuotas?.quota_ai_suggest ?? limits.maxAiSuggestions,
      color: "bg-violet-500",
      visible: limits.enableAiSuggest,
    },
    {
      icon: BarChart3,
      label: "CV Scoring",
      used: scoreUsageCount,
      max: tierQuotas?.quota_ai_score ?? limits.maxAtsScores,
      color: "bg-amber-500",
      visible: limits.enableAiScore,
    },
    {
      icon: Brain,
      label: "Guided Mode",
      used: guidedUsageCount,
      max: tierQuotas?.quota_ai_chat ?? limits.maxGuidedSessions,
      color: "bg-emerald-500",
      visible: true,
    },
    {
      icon: FileCheck,
      label: "Cover Letter",
      used: coverLetterUsageCount,
      max: tierQuotas?.quota_ai_cover_letter ?? (tierQuotas?.enable_cover_letter ? (tier === "free" ? 1 : tier === "starter" ? 10 : null) : 0),
      color: "bg-teal-500",
      visible: tierQuotas?.enable_cover_letter ?? limits.canCoverLetter,
    },
    {
      icon: Target,
      label: "CV Review",
      used: cvReviewUsageCount,
      max: tierQuotas?.quota_cv_review ?? (tierQuotas?.enable_cv_review ? (tier === "starter" ? 10 : null) : 0),
      color: "bg-rose-500",
      visible: tierQuotas?.enable_cv_review ?? limits.enableCvReview,
    },
    {
      icon: Key,
      label: "Keyword Extract",
      used: keywordExtractUsageCount,
      max: tierQuotas?.quota_ai_keyword_extract ?? (tierQuotas?.enable_keyword_extractor ? (tier === "free" ? 2 : tier === "starter" ? 20 : null) : 0),
      color: "bg-blue-500",
      visible: tierQuotas?.enable_keyword_extractor ?? limits.canKeywordExtract,
    },
    {
      icon: Type,
      label: "Text Polish",
      used: textPolishUsageCount,
      max: tierQuotas?.quota_ai_polish ?? limits.maxTextPolish,
      color: "bg-purple-500",
      visible: tierQuotas?.enable_text_polish ?? limits.enableTextPolish,
    },
    {
      icon: MessageSquare,
      label: "AI Chat",
      used: chatUsageCount,
      max: tierQuotas?.quota_ai_chat ?? (tier === "free" ? 5 : tier === "starter" ? 50 : null),
      color: "bg-cyan-500",
      visible: true,
    },
  ].filter((bar) => bar.visible);

  const powerFeatures: { icon: React.ComponentType<{ className?: string }>; label: string; desc: string; action: string; badge: string; visible: boolean; locked: boolean; upgradeTier?: string }[] = [
    {
      icon: Brain,
      label: "CV Review AI",
      desc: "AI analisis CV-mu seperti HR profesional — dapatkan skor, saran perbaikan, dan rekomendasi kata kunci.",
      action: "cv-review",
      badge: "⭐ Powerful",
      visible: true,
      locked: (tierQuotas?.enable_cv_review ?? limits.enableCvReview) === false,
      upgradeTier: "Starter",
    },
    {
      icon: BarChart3,
      label: "CV Scoring",
      desc: "Lihat skor ATS CV-mu secara instan. Ketahui bagian mana yang perlu diperbaiki.",
      action: "score",
      badge: "📊 Analitik",
      visible: true,
      locked: false,
    },
    {
      icon: Mic,
      label: "Simulasi Wawancara",
      desc: "Latihan interview dengan AI. Dapatkan pertanyaan realistis dan feedback instan.",
      action: "simulasi",
      badge: "🔥 Pro",
      visible: true,
      locked: (tierQuotas?.enable_interview_simulator ?? limits.canInterviewSimulator) === false,
      upgradeTier: "Pro",
    },
    {
      icon: FileCheck,
      label: "Cover Letter AI",
      desc: "Generate surat lamaran yang personalize dari CV dan job description.",
      action: "cover-letter",
      badge: "✨ Baru",
      visible: true,
      locked: (tierQuotas?.enable_cover_letter ?? limits.canCoverLetter) === false,
      upgradeTier: "Starter",
    },
    {
      icon: Key,
      label: "Keyword Extractor",
      desc: "Ekstrak keyword dari job description untuk optimasi CV ATS. Auto-suggest keyword berdasarkan posisi target.",
      action: "keyword-extractor",
      badge: "🔑 ATS",
      visible: true,
      locked: (tierQuotas?.enable_keyword_extractor ?? limits.canKeywordExtract) === false,
      upgradeTier: "Starter",
    },
  ];

  const quickActions: { icon: React.ComponentType<{ className?: string }>; label: string; action: string; color: string; visible: boolean; locked?: boolean; upgradeTier?: string }[] = [
    { icon: FileText, label: "Kelola CV", action: "manage", color: "bg-primary/10 text-primary", visible: true },
    { icon: Sparkles, label: "AI Saran CV", action: "ai-suggest", color: "bg-violet-500/10 text-violet-600", visible: true },
    { icon: BarChart3, label: "CV Scoring", action: "score", color: "bg-amber-500/10 text-amber-600", visible: true },
    { icon: Briefcase, label: "Pelacak Lamaran", action: "lamaran", color: "bg-blue-500/10 text-blue-600", visible: true },
    { icon: Mic, label: "Simulasi Wawancara", action: "simulasi", color: "bg-rose-500/10 text-rose-600", visible: true, locked: (tierQuotas?.enable_interview_simulator ?? limits.canInterviewSimulator) === false, upgradeTier: "Pro" },
    { icon: FileCheck, label: "Cover Letter", action: "cover-letter", color: "bg-teal-500/10 text-teal-600", visible: true, locked: (tierQuotas?.enable_cover_letter ?? limits.canCoverLetter) === false, upgradeTier: "Starter" },
    { icon: Key, label: "Keyword Extract", action: "keyword-extractor", color: "bg-blue-500/10 text-blue-600", visible: true, locked: (tierQuotas?.enable_keyword_extractor ?? limits.canKeywordExtract) === false, upgradeTier: "Starter" },
    { icon: Gift, label: "Referral", action: "referral", color: "bg-pink-500/10 text-pink-600", visible: true },
    { icon: TrendingUp, label: "Analitik CV", action: "analitik", color: "bg-indigo-500/10 text-indigo-600", visible: true, locked: (tierQuotas?.enable_analytics ?? limits.canAnalytics) === false, upgradeTier: "Pro" },
    ...(admin ? [{ icon: Shield, label: "Admin Panel", action: "admin" as const, color: "bg-red-500/10 text-red-600", visible: true }] : []),
  ];

  const tierName = tier === "free" ? "Free" : tier === "starter" ? "Starter" : tier === "pro" ? "Pro" : "Pro+";

  // Actions that need a CV picker (CV-specific features)
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
    // Direct navigation
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
    <div className="container-page py-8 md:py-10">
      {/* ── Welcome Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            Halo, {user?.user_metadata?.full_name || user?.email?.split("@")[0]}!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pantau progres CV, gunakan tools AI, dan tingkatkan peluang interview-mu.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" className="gap-1.5">
            <Link to="/cv">
              <Plus className="h-4 w-4" /> Buat CV Baru
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/akun">Akun</Link>
          </Button>
        </div>
      </div>

      {/* ── Tier Banner ── */}
      <Card className="mt-6 border-border bg-gradient-to-r from-muted/80 to-card">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full",
              tier !== "free" ? "bg-warning/20" : "bg-muted",
            )}>
              <Crown className={cn("h-5 w-5", tier !== "free" ? "text-warning" : "text-muted-foreground")} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge className={cn(
                  "text-xs",
                  tier === "pro_plus" && "bg-warning text-warning-foreground",
                  tier === "pro" && "bg-primary text-primary-foreground",
                  tier === "starter" && "bg-info text-info-foreground",
                  tier === "free" && "bg-muted-foreground/20 text-foreground",
                )}>
                  {tierName}
                </Badge>
                {tier === "free" && (
                  <span className="text-xs text-muted-foreground">Paket gratis</span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {limits.maxCvs === null ? "CV unlimited" : `${cvCount}/${limits.maxCvs} CV`}
                {" · "}
                {limits.maxAiSuggestions === null ? "AI unlimited" : `${aiUsageCount}/${limits.maxAiSuggestions} AI call`}
              </p>
            </div>
          </div>
          {tier === "free" && (
            <Button asChild size="sm" className="gap-1.5">
              <Link to="/harga">
                <Crown className="h-3.5 w-3.5" /> Upgrade ke Starter
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ── Usage Progress ── */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {usageBars.map((bar) => (
          <Card key={bar.label} className="border">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
                    <bar.icon className="h-3.5 w-3.5 text-foreground" />
                  </div>
                  <span className="text-xs font-medium">{bar.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {bar.max === null ? `${bar.used}x` : `${bar.used}/${bar.max}`}
                </span>
              </div>
              <Progress
                value={bar.max === null ? 100 : Math.min((bar.used / bar.max) * 100, 100)}
                className="h-1.5"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── CV Limit Warning ── */}
      {atCvLimit && (
        <Alert className="mt-4 border-warning/50 bg-warning/10">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="flex items-center justify-between gap-2">
            <span>
              Kuota CV paket <strong>{tierName}</strong> sudah penuh ({cvCount}/{limits.maxCvs}).
            </span>
            <Button asChild size="sm" variant="outline" className="shrink-0 gap-1">
              <Link to="/harga">
                <Crown className="h-3 w-3" /> Upgrade
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Main Layout ── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left Column (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Power Features */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-warning" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Fitur Andalan
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {powerFeatures
                .filter((f) => f.visible)
                .map((f) => (
                  <div key={f.label} className="relative">
                    {f.locked && (
                      <div className="absolute -top-1.5 -right-1.5 z-10 flex items-center gap-0.5 rounded-full bg-muted border border-border shadow-sm px-2 py-0.5">
                        <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground font-medium">{f.upgradeTier}</span>
                      </div>
                    )}
                    <button
                      onClick={() => f.locked ? navigate({ to: "/harga" } as any) : handleFeatureClick(f.action)}
                      className={cn("group block text-left w-full", f.locked && "opacity-70")}
                    >
                      <Card className={cn(
                        "relative h-full border-2 transition-all duration-300 overflow-hidden",
                        f.locked ? "border-dashed border-muted-foreground/20 hover:border-primary/30" : "border-border hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5"
                      )}>
                        {!f.locked && (
                          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-primary via-warning to-primary opacity-60" />
                        )}
                        <CardContent className="p-5">
                          <div className="mb-2 flex items-center justify-between">
                            <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", f.locked ? "bg-muted" : "bg-primary-soft")}>
                              <f.icon className={cn("h-5 w-5", f.locked ? "text-muted-foreground" : "text-primary")} />
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge variant="secondary" className="text-[10px]">
                                {f.badge}
                              </Badge>
                              {f.locked && (
                                <Badge variant="outline" className="text-[10px] border-dashed">
                                  <Lock className="h-3 w-3 mr-0.5" /> {f.upgradeTier}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <h3 className={cn("font-semibold", !f.locked && "group-hover:text-primary", f.locked && "text-muted-foreground", "transition-colors")}>
                            {f.label}
                          </h3>
                          <p className={cn("mt-1 text-xs line-clamp-2", f.locked ? "text-muted-foreground/60" : "text-muted-foreground")}>
                            {f.desc}
                          </p>
                          <div className={cn("mt-3 flex items-center text-xs font-medium", f.locked ? "text-muted-foreground" : "text-primary")}>
                            {f.locked ? (
                              <>
                                Upgrade ke {f.upgradeTier}
                                <ChevronRight className="ml-1 h-3 w-3" />
                              </>
                            ) : (
                              <>
                                Coba sekarang
                                <ArrowUpRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </button>
                  </div>
                ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Aksi Cepat
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {quickActions
                .filter((a) => a.visible)
                .map((a) => (
                  <div key={a.label} className="relative">
                    {/* Lock icon overlay for locked features */}
                    {a.locked && (
                      <div className="absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-muted border border-border shadow-sm">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-auto flex-col items-center gap-2 px-3 py-4 transition-all w-full",
                        !a.locked && "hover:border-primary/50 hover:bg-primary/5",
                        a.locked && "opacity-60 cursor-not-allowed"
                      )}
                      onClick={() => !a.locked && handleFeatureClick(a.action)}
                    >
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", a.color)}>
                        <a.icon className="h-4 w-4" />
                      </div>
                      <div className="text-center">
                        <span className="text-xs font-medium block">{a.label}</span>
                        {a.locked && a.upgradeTier && (
                          <span className="text-[10px] text-muted-foreground">
                            Upgrade ke {a.upgradeTier}
                          </span>
                        )}
                      </div>
                    </Button>
                  </div>
                ))}
            </div>
          </section>

          {/* Recent CVs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">CV Terbaru</CardTitle>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
                <Link to="/cv">
                  Lihat semua <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : cvs.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft">
                    <FileText className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Belum ada CV</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Buat CV pertamamu sekarang — gratis dan mudah.
                    </p>
                  </div>
                  <Button asChild size="sm" className="gap-1.5">
                    <Link to="/cv">
                      <Plus className="h-4 w-4" /> Buat CV Baru
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {cvs.slice(0, 3).map((cv) => {
                    const tpl = TEMPLATES.find((t) => t.id === cv.template_id);
                    return (
                      <Link
                        key={cv.id}
                        to="/cv/$id"
                        params={{ id: cv.id }}
                        className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/60 hover:border-primary/30"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{cv.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {tpl?.name ?? cv.template_id}
                              {" · "}
                              {new Date(cv.updated_at).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] px-1.5">
                            {cv.status === "draft" ? "Draft" : "Selesai"}
                          </Badge>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-4">
          {/* Activity Feed */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Aktivitas Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {activities.map((a, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0">
                      <p className="text-sm truncate">{a.label}</p>
                      <p className="text-xs text-muted-foreground">{a.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Upgrade Card (free users only) */}
          {tier === "free" && (
            <Card className="border-primary/30 bg-gradient-to-b from-primary/5 to-card">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/20">
                    <Star className="h-4 w-4 text-warning" />
                  </div>
                  <h3 className="font-semibold text-sm">Upgrade & Buka Semua Fitur</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  {[
                    { icon: FileText, text: "CV unlimited — bikin sebanyak yang kamu mau" },
                    { icon: Sparkles, text: "50x+ AI saran per bulan" },
                    { icon: FileCheck, text: "Cover letter AI otomatis" },
                    { icon: Crown, text: "Template premium & tanpa watermark" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <item.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{item.text}</span>
                    </li>
                  ))}
                </ul>
                <Separator className="my-4" />
                <div className="flex items-center justify-between text-sm">
                  <span>
                    Mulai dari{" "}
                    <strong className="text-foreground">Rp 19.000</strong>
                    <span className="text-xs text-muted-foreground">/bln</span>
                  </span>
                  <Button asChild size="sm" className="gap-1">
                    <Link to="/harga">
                      Upgrade <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-4 w-4 text-warning" />
                Tips Cepat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  { tip: "Gunakan kata kerja aktif di deskripsi pengalaman", link: "/panduan-cv-ats" },
                  { tip: "Sertakan metrik kuantitatif (contoh: naik 30%)", link: "/panduan-cv-ats" },
                  { tip: "Sesuaikan keyword dengan job description target", link: "/blog/keyword-cv-ats" },
                ].map((item, i) => (
                  <li key={i}>
                    <Link
                      to={item.link as any}
                      className="flex items-start gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <span className="mt-0.5 shrink-0 text-primary">•</span>
                      {item.tip}
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── CV Picker Modal ── */}
      <Dialog open={showCvPicker !== null} onOpenChange={() => setShowCvPicker(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pilih CV</DialogTitle>
            <DialogDescription>
              Pilih CV yang ingin kamu gunakan untuk fitur ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {cvs.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Belum ada CV. Buat CV dulu ya.
              </div>
            ) : (
              cvs.map((cv) => {
                const tpl = TEMPLATES.find((t) => t.id === cv.template_id);
                return (
                  <button
                    key={cv.id}
                    onClick={() => handleCvSelect(cv.id)}
                    className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{cv.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {tpl?.name ?? cv.template_id}
                        {" · "}
                        {new Date(cv.updated_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                );
              })
            )}
          </div>
          {cvs.length === 0 && (
            <div className="flex justify-center pb-2">
              <Button asChild size="sm">
                <Link to="/cv">
                  <Plus className="mr-1 h-4 w-4" /> Buat CV Baru
                </Link>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
