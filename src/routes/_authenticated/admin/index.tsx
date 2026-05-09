import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { buildSeo } from "@/lib/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, FileText, Sparkles, Crown, TrendingUp, Activity,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => buildSeo({ title: "Admin Dashboard — CV ATS Indonesia", description: "Admin analytics.", path: "/admin", noindex: true }),
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

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);

    // Total users (from profiles)
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Total CVs
    const { count: totalCvs } = await supabase
      .from("cvs")
      .select("*", { count: "exact", head: true });

    // Total AI calls this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { count: totalAiCalls } = await supabase
      .from("ai_usage")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString());

    // Subscription breakdown
    const { data: subs } = await supabase
      .from("user_subscriptions")
      .select("status, subscription_tiers!inner(slug)")
      .eq("status", "active");
    const activeSubs = subs || [];
    const freeUsers = activeSubs.filter((s: any) => s.subscription_tiers?.slug === "free").length;
    const starterUsers = activeSubs.filter((s: any) => s.subscription_tiers?.slug === "starter").length;
    const proUsers = activeSubs.filter((s: any) => s.subscription_tiers?.slug === "pro").length;

    // Recent signups (last 7 days)
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

  if (loading) return <p className="text-sm text-muted-foreground">Memuat analytics...</p>;
  if (!stats) return null;

  const statCards = [
    { icon: Users, label: "Total Pengguna", value: stats.totalUsers.toLocaleString(), color: "text-primary" },
    { icon: FileText, label: "Total CV", value: stats.totalCvs.toLocaleString(), color: "text-primary" },
    { icon: Sparkles, label: "AI Calls (bln ini)", value: stats.totalAiCalls.toLocaleString(), color: "text-primary" },
    { icon: Activity, label: "Signup 7 Hari", value: stats.recentSignups.toLocaleString(), color: "text-primary" },
  ];

  const tierBreakdown = [
    { tier: "Free", count: stats.freeUsers, icon: Users, color: "bg-muted" },
    { tier: "Starter", count: stats.starterUsers, icon: Crown, color: "bg-primary" },
    { tier: "Pro", count: stats.proUsers, icon: Crown, color: "bg-warning" },
  ];

  const totalActive = stats.freeUsers + stats.starterUsers + stats.proUsers;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Analytics Overview</h2>
        <p className="text-sm text-muted-foreground">Ringkasan performa platform CV ATS Indonesia.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold font-display ${s.color}`}>
                    {s.value}
                  </p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscription Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Crown className="h-4 w-4" /> Subscription Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tierBreakdown.map((t) => (
              <div key={t.tier}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center gap-2">
                    <t.icon className="h-4 w-4 text-muted-foreground" />
                    {t.tier}
                  </span>
                  <span className="font-medium">{t.count} users</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${t.color}`}
                    style={{
                      width: totalActive > 0
                        ? `${(t.count / totalActive) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="text-xs text-muted-foreground pt-2 border-t border-border">
              Total aktif: {totalActive} pengguna
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="hover:shadow-sm transition-shadow">
          <a href="/admin/users" className="block p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Manage Users</h3>
                <p className="text-xs text-muted-foreground">Lihat, edit role & tier pengguna</p>
              </div>
            </div>
          </a>
        </Card>
        <Card className="hover:shadow-sm transition-shadow">
          <a href="/admin/templates" className="block p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Manage Templates</h3>
                <p className="text-xs text-muted-foreground">Kelola template CV yang tersedia</p>
              </div>
            </div>
          </a>
        </Card>
      </div>
    </div>
  );
}
