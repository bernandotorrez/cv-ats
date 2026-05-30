import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity,
  ArrowRight,
  BriefcaseBusiness,
  Crown,
  FileText,
  LayoutDashboard,
  Palette,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () =>
    buildSeo({
      title: "Admin Dashboard - CV Pintar",
      description: "Admin analytics.",
      path: "/admin",
      noindex: true,
    }),
  component: AdminDashboard,
});

interface Stats {
  totalUsers: number;
  totalCvs: number;
  totalAiCalls: number;
  freeUsers: number;
  starterUsers: number;
  proUsers: number;
  recentSignups: number;
}

interface SubscriptionRow {
  subscription_tiers?: {
    slug?: string | null;
  } | null;
}

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);

    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: totalCvs } = await supabase
      .from("cvs")
      .select("*", { count: "exact", head: true });

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { count: totalAiCalls } = await supabase
      .from("ai_usage")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString());

    const { data: subs } = await supabase
      .from("user_subscriptions")
      .select("status, subscription_tiers!inner(slug)")
      .eq("status", "active");

    const activeSubs = (subs || []) as unknown as SubscriptionRow[];
    const freeUsers = activeSubs.filter((s) => s.subscription_tiers?.slug === "free").length;
    const starterUsers = activeSubs.filter((s) => s.subscription_tiers?.slug === "starter").length;
    const proUsers = activeSubs.filter((s) => s.subscription_tiers?.slug === "pro").length;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: recentSignups } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString());

    setStats({
      totalUsers: totalUsers ?? 0,
      totalCvs: totalCvs ?? 0,
      totalAiCalls: totalAiCalls ?? 0,
      freeUsers,
      starterUsers,
      proUsers,
      recentSignups: recentSignups ?? 0,
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const totalActive = stats.freeUsers + stats.starterUsers + stats.proUsers;
  const paidUsers = stats.starterUsers + stats.proUsers;
  const conversionRate =
    stats.totalUsers > 0 ? Math.round((paidUsers / stats.totalUsers) * 100) : 0;
  const cvPerUser =
    stats.totalUsers > 0 ? (stats.totalCvs / stats.totalUsers).toLocaleString("id-ID") : "0";

  const statCards = [
    {
      icon: Users,
      label: "Users",
      value: stats.totalUsers.toLocaleString("id-ID"),
      detail: `+${stats.recentSignups} minggu ini`,
      tone: "bg-sky-50 text-sky-700",
    },
    {
      icon: FileText,
      label: "CV",
      value: stats.totalCvs.toLocaleString("id-ID"),
      detail: `${cvPerUser} per user`,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      icon: Sparkles,
      label: "AI",
      value: stats.totalAiCalls.toLocaleString("id-ID"),
      detail: "bulan ini",
      tone: "bg-violet-50 text-violet-700",
    },
    {
      icon: TrendingUp,
      label: "Paid",
      value: `${conversionRate}%`,
      detail: `${paidUsers} user aktif`,
      tone: "bg-amber-50 text-amber-700",
    },
  ];

  const tierBreakdown = [
    { tier: "Free", count: stats.freeUsers },
    { tier: "Starter", count: stats.starterUsers },
    { tier: "Pro", count: stats.proUsers },
  ];

  const actions = [
    {
      to: "/admin/users" as const,
      icon: Users,
      title: "Users",
      text: "Cari user, edit role, cek tier.",
      cta: "Kelola user",
    },
    {
      to: "/admin/templates" as const,
      icon: Palette,
      title: "Templates",
      text: "Atur template CV yang tampil.",
      cta: "Kelola template",
    },
    {
      to: "/admin/jobs" as const,
      icon: BriefcaseBusiness,
      title: "Lowongan",
      text: "Cari dan import lowongan dengan AI.",
      cta: "AI search",
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Admin cockpit
          </div>
          <h2 className="font-display text-2xl font-bold tracking-normal sm:text-3xl">
            Ringkas, cepat, siap eksekusi.
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Pantau user, CV, AI usage, dan subscription dari satu layar yang bersih.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link to="/admin/users">
            Buka Users <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => (
          <Card key={item.label} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-2 font-display text-3xl font-bold">{item.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <div className={`grid h-10 w-10 place-items-center rounded-lg ${item.tone}`}>
                  <item.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">Subscription Mix</h3>
                <p className="text-xs text-muted-foreground">{totalActive} subscription aktif</p>
              </div>
              <Crown className="h-5 w-5 text-amber-500" />
            </div>
            <div className="space-y-4">
              {tierBreakdown.map((tier) => {
                const value = totalActive > 0 ? Math.round((tier.count / totalActive) * 100) : 0;
                return (
                  <div key={tier.tier} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{tier.tier}</span>
                      <span className="text-muted-foreground">
                        {tier.count} user - {value}%
                      </span>
                    </div>
                    <Progress value={value} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Quick Actions</h3>
            </div>
            <div className="grid gap-3">
              {actions.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="group flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <action.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.text}</p>
                    </div>
                  </div>
                  <span className="hidden text-xs font-medium text-primary group-hover:underline sm:inline">
                    {action.cta}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
