import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  User,
  Crown,
  Zap,
  Sparkles,
  BarChart3,
  FileText,
  ArrowRight,
  CheckCircle2,
  Clock,
  ChevronRight,
  LogOut,
  Shield,
  Mail,
  Calendar,
  Star,
  Target,
  LayoutTemplate,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/akun")({
  head: () =>
    buildSeo({
      title: "Akun Saya — CV ATS Indonesia",
      description: "Profil & subscription.",
      path: "/akun",
      noindex: true,
    }),
  component: AkunPage,
});

const TIER_INFO: Record<
  string,
  { name: string; price: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  free: {
    name: "Free",
    price: "Rp 0",
    bg: "bg-muted",
    text: "text-muted-foreground",
    icon: User,
  },
  starter: {
    name: "Starter",
    price: "Rp 19.000/bln",
    bg: "bg-primary",
    text: "text-primary-foreground",
    icon: Zap,
  },
  pro: {
    name: "Pro",
    price: "Rp 49.000/bln",
    bg: "bg-warning",
    text: "text-warning-foreground",
    icon: Crown,
  },
  pro_plus: {
    name: "Pro+",
    price: "Rp 99.000/bln",
    bg: "bg-destructive",
    text: "text-destructive-foreground",
    icon: Shield,
  },
};

interface SubRow {
  id: string;
  tier_id: string;
  status: string;
  date_start: string;
  date_end: string;
  tier_slug: string;
  tier_name: string;
  price_monthly: number;
  max_cvs: number | null;
  quota_ai_suggest: number | null;
  quota_ai_score: number | null;
  quota_ai_chat: number | null;
  quota_ai_cover_letter: number | null;
  quota_ai_keyword_extract: number | null;
  template_access: string;
  features: string[];
}

interface AiUsage {
  feature: string;
  count: number;
}

export function AkunPage() {
  const { user, signOut } = useAuth();
  const [subscription, setSubscription] = useState<SubRow | null>(null);
  const [cvCount, setCvCount] = useState(0);
  const [aiUsage, setAiUsage] = useState<AiUsage[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    loadData();
  }, [userId]);

  const loadData = async () => {
    if (!userId) return;
    setLoading(true);

    const { data: sub } = await (supabase as any)
      .from("user_subscriptions")
      .select(
        `id, status, date_start, date_end, tier_id,
        subscription_tiers!inner(
          slug, name, price_monthly,
          max_cvs, quota_ai_suggest, quota_ai_score,
          quota_ai_chat, quota_ai_cover_letter, quota_ai_keyword_extract,
          template_access, features
        )`,
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (sub) {
      const tier = (sub as any).subscription_tiers;
      setSubscription({
        id: sub.id,
        tier_id: sub.tier_id,
        status: sub.status,
        date_start: sub.date_start,
        date_end: sub.date_end,
        tier_slug: tier.slug,
        tier_name: tier.name,
        price_monthly: tier.price_monthly,
        max_cvs: tier.max_cvs,
        quota_ai_suggest: tier.quota_ai_suggest,
        quota_ai_score: tier.quota_ai_score,
        quota_ai_chat: tier.quota_ai_chat,
        quota_ai_cover_letter: tier.quota_ai_cover_letter,
        quota_ai_keyword_extract: tier.quota_ai_keyword_extract,
        template_access: tier.template_access,
        features: tier.features || [],
      });
    }

    const { count: cvC } = await (supabase as any)
      .from("cvs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    setCvCount(cvC ?? 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: usage } = await (supabase as any)
      .from("ai_usage")
      .select("feature")
      .eq("user_id", userId)
      .gte("created_at", monthStart.toISOString());

    if (usage) {
      const counts: Record<string, number> = {};
      usage.forEach((u: any) => {
        counts[u.feature] = (counts[u.feature] || 0) + 1;
      });
      setAiUsage(
        Object.entries(counts).map(([feature, count]) => ({ feature, count })),
      );
    }

    setLoading(false);
  };

  const tier = subscription?.tier_slug ?? "free";
  const tierInfo = TIER_INFO[tier] || TIER_INFO.free;
  const TierIcon = tierInfo.icon;

  const getAiCount = (feature: string) => aiUsage.find((u) => u.feature === feature)?.count ?? 0;

  const usageItems = [
    {
      icon: FileText,
      label: "CV",
      used: cvCount,
      max: subscription?.max_cvs ?? 1,
      color: "bg-primary",
    },
    {
      icon: Sparkles,
      label: "AI Saran",
      used: getAiCount("suggest"),
      max: subscription?.quota_ai_suggest ?? 0,
      color: "bg-violet-500",
    },
    {
      icon: BarChart3,
      label: "AI Scoring",
      used: getAiCount("score"),
      max: subscription?.quota_ai_score ?? 0,
      color: "bg-amber-500",
    },
    {
      icon: TrendingUp,
      label: "AI Chat",
      used: getAiCount("chat"),
      max: subscription?.quota_ai_chat ?? 0,
      color: "bg-emerald-500",
    },
  ];

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Pengguna";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      })
    : "-";

  if (loading) return <AkunSkeleton />;

  return (
    <div className="container-page py-8 md:py-10">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
          {initials}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            {displayName}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              {user?.email}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Bergabung {memberSince}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Left (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Subscription Card */}
          <Card className={cn(tier !== "free" && "border-primary/30")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      tier !== "free" ? "bg-warning/20" : "bg-muted",
                    )}
                  >
                    <TierIcon
                      className={cn(
                        "h-5 w-5",
                        tier !== "free" ? "text-warning" : "text-muted-foreground",
                      )}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-base">Subscription</CardTitle>
                    <CardDescription>
                      Paket kamu saat ini
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  className={cn(
                    "text-xs",
                    tierInfo.bg,
                    tierInfo.text,
                  )}
                >
                  {tierInfo.name}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {tier !== "free" && subscription && (
                <div className="rounded-lg border bg-muted/50 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Periode aktif</span>
                    <span className="font-medium">
                      {new Date(subscription.date_end).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Harga</span>
                    <span className="font-medium">{tierInfo.price}</span>
                  </div>
                </div>
              )}

              {/* Usage Progress */}
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pemakaian Bulan Ini
                </h4>
                <div className="space-y-4">
                  {usageItems.map((item) => (
                    <div key={item.label}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <item.icon className="h-3.5 w-3.5" />
                          {item.label}
                        </span>
                        <span className="text-xs font-medium">
                          {item.max === null
                            ? `${item.used}`
                            : `${item.used}/${item.max}`}
                        </span>
                      </div>
                      <Progress
                        value={
                          item.max === null || item.max === 0
                            ? 100
                            : Math.min((item.used / item.max) * 100, 100)
                        }
                        className="h-1.5"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Kuota reset setiap awal bulan
              </div>

              {tier === "free" && (
                <Button asChild className="w-full gap-1.5">
                  <Link to="/harga">
                    <Zap className="h-4 w-4" /> Upgrade ke Starter — Rp 19.000/bln
                  </Link>
                </Button>
              )}
              {tier === "starter" && (
                <Button asChild variant="outline" className="w-full gap-1.5">
                  <Link to="/harga">
                    <Crown className="h-4 w-4" /> Upgrade ke Pro — Rp 49.000/bln
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Features Included */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Fitur Termasuk di Paket {tierInfo.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  {
                    label: "CV",
                    value: subscription?.max_cvs === null ? "Unlimited" : `Maks ${subscription?.max_cvs}`,
                    included: true,
                  },
                  {
                    label: "AI Saran",
                    value: subscription?.quota_ai_suggest === null ? "Unlimited" : `${subscription?.quota_ai_suggest}/bln`,
                    included: true,
                  },
                  {
                    label: "AI Scoring",
                    value: subscription?.quota_ai_score === null ? "Unlimited" : `${subscription?.quota_ai_score}/bln`,
                    included: true,
                  },
                  {
                    label: "CV Review AI (HR)",
                    value: tier !== "free" ? "Ya" : "Tidak",
                    included: tier !== "free",
                  },
                  {
                    label: "Template",
                    value: subscription?.template_access === "all" ? "Semua (8)" : "Basic (2)",
                    included: true,
                  },
                  {
                    label: "Download DOCX",
                    value: tier !== "free" ? "Ya" : "Tidak",
                    included: tier !== "free",
                  },
                  {
                    label: "Cover Letter AI",
                    value: tier !== "free" ? "Ya" : "Tidak",
                    included: tier !== "free",
                  },
                  {
                    label: "CV Comparison",
                    value: tier === "pro" || tier === "pro_plus" ? "Ya" : "Tidak",
                    included: tier === "pro" || tier === "pro_plus",
                  },
                  {
                    label: "Simulasi Wawancara",
                    value: tier === "pro_plus" ? "Ya" : "Tidak",
                    included: tier === "pro_plus",
                  },
                  {
                    label: "Watermark",
                    value: tier === "free" ? "Ada" : "Tidak",
                    included: tier !== "free",
                  },
                  {
                    label: "Analitik CV",
                    value: tier === "pro_plus" ? "Ya" : "Tidak",
                    included: tier === "pro_plus",
                  },
                ].map((f) => (
                  <div
                    key={f.label}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2 text-sm",
                      f.included ? "bg-card" : "bg-muted/30 opacity-50",
                    )}
                  >
                    <span>{f.label}</span>
                    <span className={cn("text-xs font-medium", f.included ? "text-primary" : "text-muted-foreground")}>
                      {f.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right (1/3) */}
        <div className="space-y-4">
          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-muted-foreground" />
                Ringkasan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  icon: FileText,
                  label: "Total CV",
                  value: cvCount,
                  color: "text-primary",
                },
                {
                  icon: LayoutTemplate,
                  label: "Template Akses",
                  value: subscription?.template_access === "all" ? "8 template" : "2 template",
                  color: "text-violet-600",
                },
                {
                  icon: Clock,
                  label: "AI Calls (bln ini)",
                  value: aiUsage.reduce((sum, u) => sum + u.count, 0),
                  color: "text-amber-600",
                },
                {
                  icon: Star,
                  label: "Paket",
                  value: tierInfo.name,
                  color: tier !== "free" ? "text-warning" : "text-muted-foreground",
                },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <s.icon className={cn("h-3.5 w-3.5", s.color)} />
                    {s.label}
                  </span>
                  <span className={cn("text-sm font-medium", s.color)}>{s.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Akses Cepat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { icon: FileText, label: "CV Saya", to: "/cv" as const },
                { icon: Sparkles, label: "AI Tools", to: "/cv" as const },
                { icon: BarChart3, label: "Skor CV", to: "/cv" as const },
                { icon: Crown, label: "Lihat Harga", to: "/harga" as const },
              ].map((link) => (
                <Button
                  key={link.label}
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Link to={link.to}>
                    <span className="flex items-center gap-2">
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Upgrade Card (free/starter) */}
          {(tier === "free" || tier === "starter") && (
            <Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-card">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/20">
                    <Star className="h-4 w-4 text-warning" />
                  </div>
                  <h3 className="font-semibold text-sm">
                    {tier === "free" ? "Buka Semua Fitur" : "Upgrade ke Pro"}
                  </h3>
                </div>
                <ul className="space-y-2 text-sm">
                  {(tier === "free"
                    ? [
                        "CV unlimited",
                        "50x AI saran per bulan",
                        "Semua template premium",
                        "Cover letter AI generator",
                        "Tanpa watermark",
                      ]
                    : [
                        "AI scoring unlimited",
                        "CV comparison tool",
                        "Cover letter AI unlimited",
                        "Semua fitur tanpa batas",
                      ]
                  ).map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild size="sm" className="mt-4 w-full gap-1">
                  <Link to="/harga">
                    Lihat Paket <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Logout */}
          <Card className="border-destructive/20">
            <CardContent className="p-4">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
                Keluar dari Akun
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AkunSkeleton() {
  return (
    <div className="container-page py-8 md:py-10">
      {/* Header skeleton */}
      <div className="flex items-start gap-4">
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Left column skeleton */}
        <div className="space-y-6 lg:col-span-2">
          {/* Subscription skeleton */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-1.5 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Features skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column skeleton */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
