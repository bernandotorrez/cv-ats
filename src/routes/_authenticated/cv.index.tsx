import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { WhatsAppShare } from "@/components/share/WhatsAppShare";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getTierLimits, getUserTier, type Tier, type TierLimits } from "@/lib/subscription";
import { TemplateGallery } from "@/components/cv/TemplateGallery";
import { emptyCv, TEMPLATES, type TemplateId } from "@/lib/cv-types";
import {
  AlertCircle,
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Crown,
  Edit3,
  ExternalLink,
  FileCheck,
  FileText,
  LayoutTemplate,
  Loader2,
  Mic,
  Pencil,
  Plus,
  Share2,
  Sparkles,
  Target,
  Trash2,
  Wrench,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/cv/")({
  head: () =>
    buildSeo({
      title: "CV Saya - CV Pintar",
      description: "Kelola semua CV, template, share link, scoring ATS, dan AI tools.",
      path: "/cv",
      noindex: true,
    }),
  component: CvListPage,
});

interface CvRow {
  id: string;
  title: string;
  template_id: string;
  status: string;
  updated_at: string;
  created_at: string;
  share_token: string | null;
  share_enabled: boolean;
}

function CvListPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const [cvs, setCvs] = useState<CvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<Tier>("free");
  const [limits, setLimits] = useState<TierLimits>(getTierLimits("free"));
  const [allowedTemplates, setAllowedTemplates] = useState<string[] | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showModeDialog, setShowModeDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("jakarta");
  const [creating, setCreating] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareCv, setShareCv] = useState<CvRow | null>(null);
  const [shareGenerating, setShareGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("cvs")
      .select("id, title, template_id, status, updated_at, created_at, share_token, share_enabled")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setCvs(data ?? []);
  }, [userId]);

  const loadAllowedTemplates = async (id: string) => {
    const { data } = await supabase
      .from("user_subscriptions")
      .select("subscription_tiers!inner(template_access_detail)")
      .eq("user_id", id)
      .eq("status", "active")
      .single();

    if (data?.subscription_tiers?.template_access_detail) {
      setAllowedTemplates(data.subscription_tiers.template_access_detail);
    } else if (data?.subscription_tiers?.template_access_detail === null) {
      setAllowedTemplates(null);
    } else {
      setAllowedTemplates(["jakarta", "bandung"]);
    }
  };

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      load(),
      getUserTier(userId).then((t) => {
        setTier(t);
        setLimits(getTierLimits(t));
      }),
      loadAllowedTemplates(userId),
    ]);
  }, [userId, load]);

  const cvLimit = limits.maxCvs === null ? Infinity : limits.maxCvs;
  const atLimit = cvs.length >= cvLimit;
  const tierName = tier === "free" ? "Free" : tier === "starter" ? "Starter" : "Pro";
  const lastEdited = cvs.length > 0 ? cvs[0] : null;
  const usedTemplates = [...new Set(cvs.map((c) => c.template_id))];
  const finishedCount = cvs.filter((cv) => cv.status !== "draft").length;
  const sharedCount = cvs.filter((cv) => cv.share_enabled).length;
  const quotaPercent =
    limits.maxCvs === null ? 100 : Math.min((cvs.length / limits.maxCvs) * 100, 100);

  const quickStats = [
    {
      icon: FileText,
      label: "Total CV",
      value: `${cvs.length}${cvLimit === Infinity ? "" : ` / ${cvLimit}`}`,
      note: "Versi aktif",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: LayoutTemplate,
      label: "Template",
      value: `${usedTemplates.length} jenis`,
      note: "Dipakai",
      color: "bg-sky-500/10 text-sky-700",
    },
    {
      icon: CheckCircle2,
      label: "Siap Kirim",
      value: `${finishedCount}`,
      note: "Bukan draft",
      color: "bg-emerald-500/10 text-emerald-700",
    },
    {
      icon: Share2,
      label: "Portfolio",
      value: `${sharedCount}`,
      note: "Sedang aktif",
      color: "bg-amber-500/10 text-amber-700",
    },
  ];

  const handleCreate = async (guided = false) => {
    if (!user) return;
    if (atLimit) {
      toast.error(
        `Paket ${tierName} hanya bisa ${cvLimit === Infinity ? "unlimited" : cvLimit} CV. Upgrade untuk lebih banyak.`,
      );
      return;
    }
    setCreating(true);
    const { data, error } = await supabase
      .from("cvs")
      .insert({
        user_id: userId,
        title: "CV Baru",
        template_id: selectedTemplate,
        data: emptyCv,
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

  const handleToggleShare = async (cv: CvRow) => {
    if (cv.share_enabled) {
      setShareGenerating(true);
      await supabase.from("cvs").update({ share_enabled: false }).eq("id", cv.id);
      setShareGenerating(false);
      toast.success("Link share dinonaktifkan");
      load();
      return;
    }

    setShareGenerating(true);
    try {
      let token = cv.share_token;
      if (!token) {
        const { data: rpcData, error: rpcError } = await supabase.rpc("generate_share_token");
        if (rpcError) throw new Error(rpcError.message);
        token = rpcData as string;
      }

      const { error } = await supabase
        .from("cvs")
        .update({ share_enabled: true, share_token: token })
        .eq("id", cv.id);
      if (error) throw new Error(error.message);

      setShareCv({ ...cv, share_token: token, share_enabled: true });
      setShowShareDialog(true);
      setTimeout(() => {
        shareInputRef.current?.select();
      }, 100);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Gagal mengaktifkan share");
    } finally {
      setShareGenerating(false);
      load();
    }
  };

  const handleCopyShareLink = async () => {
    if (!shareCv?.share_token) return;
    const link = `https://cvpintar.web.id/share/${shareCv.share_token}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus CV ini? Data tidak bisa dikembalikan.")) return;
    const { error } = await supabase.from("cvs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("CV dihapus");
    load();
  };

  if (loading) {
    return <CvListSkeleton />;
  }

  return (
    <div className="container-page space-y-7 py-5 md:space-y-8 md:py-8">
      <section className="rounded-[1.25rem] border bg-card p-5 shadow-sm sm:p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <FileText className="h-3.5 w-3.5" />
              CV workspace
            </div>
            <h1 className="max-w-3xl font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
              Semua CV kamu, rapi dan siap dipakai untuk role yang berbeda.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Buat versi CV, cek skor ATS, aktifkan portfolio publik, dan lanjutkan ke AI tools
              tanpa kehilangan konteks.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => setShowCreateDialog(true)}
                disabled={atLimit}
                size="lg"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Buat CV Baru
              </Button>
              {limits.enableCvReview && (
                <Button asChild variant="outline" size="lg" className="gap-2">
                  <Link to="/cv-review">
                    <Brain className="h-4 w-4" />
                    Upload & Review
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-muted/35 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Fokus berikutnya</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {lastEdited
                    ? `Lanjutkan "${lastEdited.title}", lalu cek skor dan export PDF final.`
                    : "Buat CV pertama, pilih template, lalu isi dengan panduan AI."}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["Buat", "Ukur", "Kirim"].map((item, index) => (
                <div key={item} className="rounded-xl border bg-background p-3 text-center">
                  <p className="text-xs font-bold text-primary">0{index + 1}</p>
                  <p className="mt-1 text-[11px] font-medium text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => (
          <article key={stat.label} className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  stat.color,
                )}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="font-display text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.note}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      {limits.maxCvs !== null && (
        <section className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Kuota CV paket {tierName}</p>
              <p className="text-xs text-muted-foreground">
                {atLimit
                  ? "Kuota penuh. Upgrade untuk membuat lebih banyak versi."
                  : "Masih ada ruang untuk versi CV berikutnya."}
              </p>
            </div>
            <span
              className={cn(
                "text-sm font-bold tabular-nums",
                atLimit ? "text-destructive" : "text-primary",
              )}
            >
              {cvs.length}/{limits.maxCvs}
            </span>
          </div>
          <Progress value={quotaPercent} className="mt-4 h-2" />
        </section>
      )}

      {atLimit && (
        <Alert className="rounded-2xl border-warning/50 bg-warning/10">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Kuota CV paket <strong>{tierName}</strong> sudah penuh ({cvs.length}/{limits.maxCvs}).
            </span>
            <Button asChild size="sm" variant="outline" className="shrink-0 gap-1">
              <Link to="/harga">
                <Crown className="h-3.5 w-3.5" />
                Upgrade
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              Koleksi CV
            </p>
            <h2 className="font-display text-xl font-bold text-foreground">
              Pilih CV untuk dikerjakan
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Setiap kartu punya shortcut untuk edit, scoring, review, AI tools, portfolio, dan
            persiapan interview.
          </p>
        </div>

        {cvs.length === 0 ? (
          <EmptyState onCreate={() => setShowCreateDialog(true)} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cvs.map((cv) => (
              <CvCard
                key={cv.id}
                cv={cv}
                limits={limits}
                shareGenerating={shareGenerating}
                onDelete={handleDelete}
                onToggleShare={handleToggleShare}
              />
            ))}
          </div>
        )}
      </section>

      {tier === "free" && cvs.length > 0 && (
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground">
                  Buka ruang untuk versi CV berikutnya
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Upgrade untuk CV lebih banyak, template premium, cover letter AI, dan simulasi
                  interview.
                </p>
              </div>
            </div>
            <Button asChild className="gap-2">
              <Link to="/harga">
                Lihat Paket
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}

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
              className="flex items-start gap-4 rounded-xl border-2 border-primary/30 bg-primary/5 p-4 text-left transition-all hover:border-primary hover:bg-primary/10"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                  Panduan AI
                  <Badge className="bg-warning/20 text-[10px] text-warning hover:bg-warning/20">
                    Direkomendasikan
                  </Badge>
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cocok kalau kamu ingin dibantu menyusun isi CV langkah demi langkah.
                </p>
                {creating && <Loader2 className="mt-2 h-4 w-4 animate-spin" />}
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleCreate(false)}
              disabled={creating}
              className="flex items-start gap-4 rounded-xl border-2 border-border p-4 text-left transition-all hover:border-primary/50"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Edit3 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Isi sendiri atau upload CV</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cocok kalau kamu sudah punya bahan dan ingin langsung masuk editor.
                </p>
                {creating && <Loader2 className="mt-2 h-4 w-4 animate-spin" />}
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-4xl">
          <DialogHeader className="shrink-0">
            <DialogTitle>Pilih Template CV</DialogTitle>
            <DialogDescription>
              Pilih tampilan awal. Struktur dan isi tetap bisa kamu ubah di editor.
            </DialogDescription>
          </DialogHeader>
          <div className="-mx-6 flex-1 overflow-y-auto px-6 py-2">
            <TemplateGallery
              selected={selectedTemplate}
              onSelect={setSelectedTemplate}
              tier={tier}
              allowedTemplates={allowedTemplates}
            />
          </div>
          <div className="mt-2 flex shrink-0 justify-end gap-2 border-t pt-4">
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
              <ArrowLeftRight className="h-3.5 w-3.5 rotate-90" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showShareDialog}
        onOpenChange={(open) => {
          setShowShareDialog(open);
          if (!open) setCopied(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Share2 className="h-5 w-5 text-primary" />
              Portfolio siap dibagikan
            </DialogTitle>
            <DialogDescription className="text-sm">
              Bagikan link ini agar orang lain bisa melihat portfolio dan CV{" "}
              <strong>{shareCv?.title}</strong> kamu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                ref={shareInputRef}
                readOnly
                value={`https://cvpintar.web.id/share/${shareCv?.share_token || ""}`}
                className="h-10 font-mono text-sm"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button size="sm" className="h-10 shrink-0 gap-1.5" onClick={handleCopyShareLink}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Tersalin" : "Salin"}
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">Bagikan via:</span>
              <div className="flex gap-2">
                <WhatsAppShare
                  shareUrl={`https://cvpintar.web.id/share/${shareCv?.share_token || ""}`}
                  cvId={shareCv?.id}
                  size="sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() =>
                    window.open(`https://cvpintar.web.id/share/${shareCv?.share_token}`, "_blank")
                  }
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Buka
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="rounded-2xl border border-dashed bg-card p-8 text-center shadow-sm md:p-12">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <FileText className="h-8 w-8 text-primary" />
      </div>
      <h3 className="mt-5 font-display text-xl font-bold text-foreground">
        Mulai dari satu CV yang benar-benar kuat.
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Pilih template, isi data, aktifkan AI bila perlu, lalu export PDF saat sudah siap apply.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button onClick={onCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Buat CV Baru
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/template">
            <LayoutTemplate className="h-4 w-4" />
            Lihat Template
          </Link>
        </Button>
      </div>
    </section>
  );
}

function CvCard({
  cv,
  limits,
  shareGenerating,
  onDelete,
  onToggleShare,
}: {
  cv: CvRow;
  limits: TierLimits;
  shareGenerating: boolean;
  onDelete: (id: string) => void;
  onToggleShare: (cv: CvRow) => void;
}) {
  const tpl = TEMPLATES.find((t) => t.id === cv.template_id);
  const isDraft = cv.status === "draft";

  return (
    <article className="group flex h-full flex-col rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-bold text-foreground">
              {cv.title}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{tpl?.name ?? cv.template_id}</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(cv.updated_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
        <Badge
          variant={isDraft ? "secondary" : "default"}
          className={cn("shrink-0 text-[10px]", !isDraft && "bg-primary text-primary-foreground")}
        >
          {isDraft ? "Draft" : "Selesai"}
        </Badge>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button asChild size="sm" className="gap-1.5">
          <Link to="/cv/$id" params={{ id: cv.id }}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <Link to="/score/$cvId" params={{ cvId: cv.id }}>
            <BarChart3 className="h-3.5 w-3.5" />
            Skor
          </Link>
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {limits.enableCvReview && (
          <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
            <Link to="/cv-review/$cvId" params={{ cvId: cv.id }}>
              <Brain className="h-3.5 w-3.5" />
              Review HR
            </Link>
          </Button>
        )}
        <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
          <Link to="/tools" search={{ cvId: cv.id } as never}>
            <Wrench className="h-3.5 w-3.5" />
            AI Tools
          </Link>
        </Button>
        {limits.canCoverLetter && (
          <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
            <Link to="/tools/cover-letter/$cvId" params={{ cvId: cv.id }}>
              <FileCheck className="h-3.5 w-3.5" />
              Cover Letter
            </Link>
          </Button>
        )}
        {limits.canInterviewSimulator && (
          <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
            <Link to="/simulasi-wawancara">
              <Mic className="h-3.5 w-3.5" />
              Simulasi
            </Link>
          </Button>
        )}
        {limits.canCompare && (
          <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
            <Link to="/compare">
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Compare
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <Button
          size="sm"
          variant={cv.share_enabled ? "default" : "outline"}
          className="h-8 gap-1.5 text-xs"
          onClick={() => onToggleShare(cv)}
          disabled={shareGenerating}
        >
          {shareGenerating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Share2 className="h-3.5 w-3.5" />
          )}
          {cv.share_enabled ? "Portfolio Aktif" : "Portfolio"}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(cv.id)}
          aria-label={`Hapus ${cv.title}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </article>
  );
}

function CvListSkeleton() {
  return (
    <div className="container-page space-y-7 py-5 md:space-y-8 md:py-8">
      <section className="rounded-[1.25rem] border bg-card p-5 shadow-sm sm:p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-center">
          <div>
            <Skeleton className="h-7 w-36 rounded-full" />
            <Skeleton className="mt-5 h-10 w-full max-w-2xl sm:h-12" />
            <Skeleton className="mt-3 h-10 w-4/5 max-w-xl sm:h-12" />
            <Skeleton className="mt-5 h-4 w-full max-w-xl" />
            <Skeleton className="mt-2 h-4 w-5/6 max-w-lg" />
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Skeleton className="h-11 w-full sm:w-36" />
              <Skeleton className="h-11 w-full sm:w-40" />
            </div>
          </div>
          <div className="rounded-2xl border bg-muted/35 p-4">
            <div className="flex gap-3">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-2 h-3 w-full" />
                <Skeleton className="mt-1 h-3 w-4/5" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-16 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-2 h-6 w-16" />
                <Skeleton className="mt-2 h-3 w-24" />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-3 w-64 max-w-full" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="mt-4 h-2 w-full rounded-full" />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="mt-3 h-7 w-64" />
          </div>
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-1 gap-3">
                  <Skeleton className="h-11 w-11 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="mt-2 h-3 w-2/3" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Skeleton className="h-9 rounded-md" />
                <Skeleton className="h-9 rounded-md" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Skeleton className="h-8 w-24 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-28 rounded-md" />
              </div>
              <div className="mt-5 flex items-center justify-between">
                <Skeleton className="h-8 w-28 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
