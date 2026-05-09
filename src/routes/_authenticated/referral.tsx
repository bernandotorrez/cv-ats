import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { WhatsAppShare } from "@/components/share/WhatsAppShare";
import { SITE_URL } from "@/lib/seo";
import {
  Gift, Copy, Check, Users, UserPlus, TrendingUp, Crown,
  ArrowLeft, Share2, Zap, Star,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/referral")({
  head: () => buildSeo({ title: "Program Referral — CV ATS Indonesia", description: "Ajak teman, dapatkan hadiah.", path: "/referral", noindex: true }),
  component: ReferralPage,
});

interface ReferralStats {
  code: string;
  totalReferrals: number;
  successfulReferrals: number;
  rewardsEarned: number;
}

interface ReferralEntry {
  id: string;
  status: string;
  created_at: string;
  reward_granted: boolean;
}

function ReferralPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats>({ code: "", totalReferrals: 0, successfulReferrals: 0, rewardsEarned: 0 });
  const [entries, setEntries] = useState<ReferralEntry[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    // Get or generate referral code
    const { data: rpcCode, error: rpcErr } = await (supabase as any).rpc("generate_referral_code", { user_id_input: user!.id });
    const code = (rpcCode as string) || "";

    // Get stats
    const { data: refData } = await (supabase as any)
      .from("referral_codes")
      .select("total_referrals, successful_referrals, rewards_earned")
      .eq("user_id", user!.id)
      .single();

    setStats({
      code,
      totalReferrals: refData?.total_referrals ?? 0,
      successfulReferrals: refData?.successful_referrals ?? 0,
      rewardsEarned: refData?.rewards_earned ?? 0,
    });

    // Get tracking entries
    const { data: trackData } = await (supabase as any)
      .from("referral_tracking")
      .select("id, status, created_at, reward_granted")
      .eq("referrer_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(20);

    setEntries(trackData ?? []);
    setLoading(false);
  };

  const referralUrl = stats.code ? `${SITE_URL}/register?ref=${stats.code}` : "";

  const copyCode = async () => {
    if (!stats.code) return;
    await navigator.clipboard.writeText(stats.code);
    setCopied(true);
    toast.success("Kode referral disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = async () => {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    toast.success("Link referral disalin!");
  };

  if (loading) {
    return (
      <div className="container-page py-10">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold">Program Referral</h1>
          <p className="text-sm text-muted-foreground">Ajak teman gabung, kamu dapat gratis!</p>
        </div>
      </div>

      {/* Reward Info */}
      <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Gift className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg">Dapatkan 1 Bulan Starter Gratis!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Setiap teman yang daftar pakai kode kamu <strong>dan upgrade ke paket berbayar</strong>, kamu dapat <strong>1 bulan Starter gratis</strong>. Berlaku kelipatan, tanpa batas!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          { icon: Users, label: "Total Referral", value: stats.totalReferrals, color: "text-blue-500" },
          { icon: TrendingUp, label: "Berhasil Upgrade", value: stats.successfulReferrals, color: "text-green-500" },
          { icon: Crown, label: "Reward Didapat", value: `${stats.rewardsEarned} bulan`, color: "text-warning" },
          { icon: Star, label: "Status Program", value: "Aktif", color: "text-primary" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</p>
                </div>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Referral Code Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Kode & Link Referral Kamu</CardTitle>
          <CardDescription>Bagikan kode atau link ini ke teman-teman kamu.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Kode Referral</p>
            <div className="flex gap-2">
              <Input value={stats.code} readOnly className="font-mono text-lg tracking-wider text-center bg-muted/50" />
              <Button variant="outline" size="icon" onClick={copyCode}>
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Link Referral</p>
            <div className="flex gap-2">
              <Input value={referralUrl} readOnly className="text-sm bg-muted/50" />
              <Button variant="outline" size="sm" onClick={copyLink}>
                <Copy className="h-3.5 w-3.5 mr-1" /> Salin
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <WhatsAppShare
              shareUrl={referralUrl}
              variant="default"
              size="sm"
            />
            <Button variant="outline" size="sm" onClick={copyLink}>
              <Share2 className="h-3.5 w-3.5 mr-1" /> Bagikan Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Referral</CardTitle>
          <CardDescription>Status referral dari teman yang kamu undang.</CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="mx-auto h-8 w-8 mb-2" />
              <p>Belum ada referral. Mulai bagikan kode kamu!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          entry.status === "upgraded" ? "default" :
                          entry.status === "signed_up" ? "secondary" :
                          "outline"
                        } className="text-xs">
                          {entry.status === "clicked" ? "Klik Link" :
                           entry.status === "signed_up" ? "Daftar" :
                           entry.status === "upgraded" ? "Upgrade ✅" : entry.status}
                        </Badge>
                        {entry.reward_granted && (
                          <Badge variant="default" className="text-xs bg-warning text-warning-foreground">
                            <Gift className="h-3 w-3 mr-0.5" /> Reward
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(entry.created_at).toLocaleDateString("id-ID", {
                          day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
