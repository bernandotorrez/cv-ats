import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getUserTier } from "@/lib/subscription";
import { useAuth } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { BackButton } from "@/components/ui/back-button";
import { TEMPLATES } from "@/lib/cv-types";
import {
  BarChart3, Eye, Download, Share2, TrendingUp,
  FileText, Users, MousePointer, Globe, Smartphone,
  Monitor, ArrowLeft, MessageCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/analitik")({
  head: () => buildSeo({ title: "Analitik CV — CV Pintar", description: "Analitik CV kamu.", path: "/analitik", noindex: true }),
  component: AnalitikPage,
});

interface CvSummary {
  id: string;
  title: string;
  template_id: string;
}

interface CvStats {
  views: number;
  downloads: number;
  whatsapp_shares: number;
  link_shares: number;
  unique_viewers: number;
}

function AnalitikPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState("free");
  const [cvs, setCvs] = useState<CvSummary[]>([]);
  const [stats, setStats] = useState<Record<string, CvStats>>({});
  const [totalStats, setTotalStats] = useState<CvStats>({ views: 0, downloads: 0, whatsapp_shares: 0, link_shares: 0, unique_viewers: 0 });
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    const t = await getUserTier(user!.id);
    setTier(t);

    const { data: cvList } = await (supabase as any)
      .from("cvs")
      .select("id, title, template_id")
      .eq("user_id", user!.id)
      .order("updated_at", { ascending: false });

    const cvData: CvSummary[] = cvList ?? [];
    setCvs(cvData);

    const statsMap: Record<string, CvStats> = {};
    let totals = { views: 0, downloads: 0, whatsapp_shares: 0, link_shares: 0, unique_viewers: 0 };

    for (const cv of cvData) {
      const { data: analytics } = await (supabase as any)
        .from("cv_analytics")
        .select("event_type, viewer_ip")
        .eq("cv_id", cv.id);

      const events = (analytics ?? []) as Array<{ event_type: string; viewer_ip: string }>;
      const uniqueIps = new Set(events.map(e => e.viewer_ip).filter(Boolean));

      statsMap[cv.id] = {
        views: events.filter(e => e.event_type === "view").length,
        downloads: events.filter(e => e.event_type === "download").length,
        whatsapp_shares: events.filter(e => e.event_type === "share_whatsapp").length,
        link_shares: events.filter(e => e.event_type === "share_link").length,
        unique_viewers: uniqueIps.size,
      };

      totals.views += statsMap[cv.id].views;
      totals.downloads += statsMap[cv.id].downloads;
      totals.whatsapp_shares += statsMap[cv.id].whatsapp_shares;
      totals.link_shares += statsMap[cv.id].link_shares;
      totals.unique_viewers += statsMap[cv.id].unique_viewers;
    }

    setStats(statsMap);
    setTotalStats(totals);
    setLoading(false);
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

  if (tier !== "pro") {
    return (
      <div className="container-page py-20 text-center">
        <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 font-display text-2xl font-bold">Fitur Pro</h1>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
          CV Analytics tersedia untuk pengguna Pro. Upgrade untuk melihat statistik CV kamu.
        </p>
        <Button asChild className="mt-6">
          <Link to="/harga">Upgrade ke Pro</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="flex items-center gap-3 mb-6">
        <BackButton />
        <div>
          <h1 className="font-display text-2xl font-bold">Analitik CV</h1>
          <p className="text-sm text-muted-foreground">Statistik views, downloads, dan shares CV kamu.</p>
        </div>
      </div>

      {/* Total Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        {[
          { icon: Eye, label: "Total Views", value: totalStats.views, color: "text-blue-500" },
          { icon: Users, label: "Unique Viewers", value: totalStats.unique_viewers, color: "text-primary" },
          { icon: Download, label: "Downloads", value: totalStats.downloads, color: "text-green-500" },
          { icon: MessageCircle, label: "WhatsApp Shares", value: totalStats.whatsapp_shares, color: "text-emerald-500" },
          { icon: Share2, label: "Link Shares", value: totalStats.link_shares, color: "text-purple-500" },
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

      {/* Per-CV Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Per CV</CardTitle>
          <CardDescription>Breakdown statistik tiap CV yang kamu punya.</CardDescription>
        </CardHeader>
        <CardContent>
          {cvs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-8 w-8 mb-2" />
              <p>Belum ada CV. Buat CV untuk mulai tracking analitik.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cvs.map((cv) => {
                const s = stats[cv.id] ?? { views: 0, downloads: 0, whatsapp_shares: 0, link_shares: 0, unique_viewers: 0 };
                const tpl = TEMPLATES.find(t => t.id === cv.template_id);
                const total = s.views + s.downloads + s.whatsapp_shares + s.link_shares;
                return (
                  <div
                    key={cv.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{cv.title}</p>
                      <p className="text-xs text-muted-foreground">{tpl?.name ?? cv.template_id}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-blue-500"><Eye className="h-3 w-3" /> {s.views}</span>
                      <span className="flex items-center gap-1 text-green-500"><Download className="h-3 w-3" /> {s.downloads}</span>
                      <span className="flex items-center gap-1 text-emerald-500"><MessageCircle className="h-3 w-3" /> {s.whatsapp_shares}</span>
                      <Badge variant="secondary" className="text-xs">{total} events</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="mt-4 bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Tips Meningkatkan Views</p>
              <p className="text-xs text-muted-foreground mt-1">
                Bagikan CV via WhatsApp untuk jangkauan lebih luas. Aktifkan link share dan sebarkan di LinkedIn, grup Telegram karir, atau kirim langsung ke recruiter.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
