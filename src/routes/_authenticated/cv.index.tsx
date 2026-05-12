import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
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
import { getUserTier, getTierLimits, type Tier, type TierLimits } from "@/lib/subscription";
import { TemplateGallery } from "@/components/cv/TemplateGallery";
import { emptyCv, TEMPLATES, type TemplateId } from "@/lib/cv-types";
import { CvCardSkeleton } from "@/components/ui/skeleton-loading";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  BarChart3,
  Wrench,
  Crown,
  AlertCircle,
  ArrowLeftRight,
  Loader2,
  Sparkles,
  Edit3,
  LayoutTemplate,
  Clock,
  Zap,
  ChevronRight,
  Target,
  Brain,
  Mic,
  FileCheck,
  Share2,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/cv/")({
  head: () =>
    buildSeo({
      title: "CV Saya — CV Pintar",
      description: "Daftar CV.",
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

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cvs")
      .select("id, title, template_id, status, updated_at, created_at, share_token, share_enabled")
      .order("updated_at", { ascending: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setCvs(data ?? []);
  };

  const loadAllowedTemplates = async (userId: string) => {
    const { data } = await (supabase as any)
      .from("user_subscriptions")
      .select("subscription_tiers!inner(template_access_detail)")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (data?.subscription_tiers?.template_access_detail) {
      setAllowedTemplates(data.subscription_tiers.template_access_detail);
    } else if (data?.subscription_tiers?.template_access_detail === null) {
      // null means all templates allowed (Pro/Pro+ tier)
      setAllowedTemplates(null);
    } else {
      // Fallback to free templates
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
  }, [userId]);

  const cvLimit = limits.maxCvs === null ? Infinity : limits.maxCvs;
  const atLimit = cvs.length >= cvLimit;

  const handleCreate = async (guided = false) => {
    if (!user) return;
    if (atLimit) {
      toast.error(
        `Paket ${tierName} hanya bisa ${cvLimit === Infinity ? "unlimited" : cvLimit} CV. Upgrade untuk lebih banyak.`,
      );
      return;
    }
    setCreating(true);
    const { data, error } = await (supabase as any)
      .from("cvs")
      .insert({
        user_id: userId,
        title: "CV Baru",
        template_id: selectedTemplate,
        data: emptyCv as any,
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
      search: guided ? ({ guided: "true" } as any) : {},
    });
  };

  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareCv, setShareCv] = useState<CvRow | null>(null);
  const [shareGenerating, setShareGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareInputRef = useRef<HTMLInputElement>(null);

  const handleToggleShare = async (cv: CvRow) => {
    if (cv.share_enabled) {
      setShareGenerating(true);
      await (supabase as any).from("cvs").update({ share_enabled: false }).eq("id", cv.id);
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

      const { error } = await (supabase as any)
        .from("cvs").update({ share_enabled: true, share_token: token }).eq("id", cv.id);
      if (error) throw new Error(error.message);

      setShareCv({ ...cv, share_token: token, share_enabled: true });
      setShowShareDialog(true);
      setTimeout(() => {
        shareInputRef.current?.select();
      }, 100);
    } catch (e: any) {
      toast.error(e.message || "Gagal mengaktifkan share");
    } finally {
      setShareGenerating(false);
      load();
    }
  };

  const handleCopyShareLink = async () => {
    if (!shareCv?.share_token) return;
    const link = `https://cvats.id/share/${shareCv.share_token}`;
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

  const tierName =
    tier === "free" ? "Free" : tier === "starter" ? "Starter" : tier === "pro" ? "Pro" : "Pro+";

  const lastEdited = cvs.length > 0 ? cvs[0] : null;
  const usedTemplates = [...new Set(cvs.map((c) => c.template_id))];

  const quickStats = [
    {
      icon: FileText,
      label: "Total CV",
      value: `${cvs.length}${cvLimit === Infinity ? "" : ` / ${cvLimit}`}`,
      color: "text-primary",
    },
    {
      icon: LayoutTemplate,
      label: "Template Dipakai",
      value: `${usedTemplates.length} jenis`,
      color: "text-violet-600",
    },
    {
      icon: Clock,
      label: "Terakhir Diedit",
      value: lastEdited
        ? new Date(lastEdited.updated_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
          })
        : "-",
      color: "text-amber-600",
    },
    {
      icon: Target,
      label: "Paket Kamu",
      value: tierName,
      color: tier !== "free" ? "text-warning" : "text-muted-foreground",
    },
  ];

  return (
    <div className="container-page py-8 md:py-10">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            CV Saya
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola, edit, dan ekspor CV ATS-friendly kamu — semua di satu tempat.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreateDialog(true)} disabled={atLimit} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Buat CV Baru
            {cvs.length > 0 && (
              <span className="ml-1 text-xs opacity-70">
                ({cvs.length}{cvLimit !== Infinity && `/${cvLimit}`})
              </span>
            )}
          </Button>
          {limits.enableCvReview && (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to="/cv-review">
                <Brain className="h-4 w-4" /> Upload & Review
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div className="mt-6 grid gap-3 grid-cols-2 lg:grid-cols-4">
        {quickStats.map((s) => (
          <Card key={s.label} className="border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <s.icon className={cn("h-4 w-4", s.color)} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={cn("text-lg font-bold font-display", s.color)}>
                    {s.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Usage Bar ── */}
      {limits.maxCvs !== null && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Kuota CV</span>
            <span className={cn("font-medium", atLimit ? "text-destructive" : "text-muted-foreground")}>
              {cvs.length}/{limits.maxCvs}
            </span>
          </div>
          <Progress
            value={Math.min((cvs.length / limits.maxCvs) * 100, 100)}
            className="h-1.5"
          />
        </div>
      )}

      {/* ── Limit Warning ── */}
      {atLimit && (
        <Alert className="mt-4 border-warning/50 bg-warning/10">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="flex items-center justify-between gap-2">
            <span>
              Kuota CV paket <strong>{tierName}</strong> sudah penuh ({cvs.length}/{limits.maxCvs}).
            </span>
            <Button asChild size="sm" variant="outline" className="shrink-0 gap-1">
              <Link to="/harga">
                <Crown className="h-3 w-3" /> Upgrade
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ── CV Grid ── */}
      <div className="mt-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <CvCardSkeleton key={i} />
            ))}
          </div>
        ) : cvs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-4 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Belum ada CV</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Buat CV pertamamu sekarang. Pilih template, isi data, dan
                  langsung bisa di-download.
                </p>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setShowCreateDialog(true)} className="gap-1.5">
                  <Plus className="h-4 w-4" /> Buat CV Baru
                </Button>
                <Button asChild variant="outline" className="gap-1.5">
                  <Link to="/template">
                    <LayoutTemplate className="h-4 w-4" /> Lihat Template
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cvs.map((cv) => {
              const tpl = TEMPLATES.find((t) => t.id === cv.template_id);
              return (
                <Card
                  key={cv.id}
                  className="group border transition-all duration-300 hover:border-primary/30 hover:shadow-md"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <CardTitle className="text-sm truncate">{cv.title}</CardTitle>
                      </div>
                      <Badge
                        variant={cv.status === "draft" ? "secondary" : "default"}
                        className="shrink-0 text-[10px]"
                      >
                        {cv.status === "draft" ? "Draft" : "Selesai"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <LayoutTemplate className="h-3 w-3" />
                      <span>Template: {tpl?.name ?? cv.template_id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        Diedit{" "}
                        {new Date(cv.updated_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex flex-wrap gap-1.5">
                      <Button asChild size="sm" variant="default" className="gap-1 text-xs h-7">
                        <Link to="/cv/$id" params={{ id: cv.id }}>
                          <Pencil className="h-3 w-3" /> Edit
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="gap-1 text-xs h-7">
                        <Link to="/score/$cvId" params={{ cvId: cv.id }}>
                          <BarChart3 className="h-3 w-3" /> Skor CV
                        </Link>
                      </Button>
                      {limits.enableCvReview && (
                        <Button asChild size="sm" variant="outline" className="gap-1 text-xs h-7 border-primary/30 bg-primary/5 hover:bg-primary/10">
                          <Link to="/cv-review/$cvId" params={{ cvId: cv.id }}>
                            <Brain className="h-3 w-3 text-primary" /> Review HR
                          </Link>
                        </Button>
                      )}
                      <Button asChild size="sm" variant="outline" className="gap-1 text-xs h-7">
                        <Link to="/tools" search={{ cvId: cv.id }}>
                          <Wrench className="h-3 w-3" /> AI Tools
                        </Link>
                      </Button>
                      {limits.canCoverLetter && (
                        <Button asChild size="sm" variant="outline" className="gap-1 text-xs h-7">
                          <Link to="/tools/cover-letter/$cvId" params={{ cvId: cv.id }}>
                            <FileCheck className="h-3 w-3" /> Cover Letter
                          </Link>
                        </Button>
                      )}
                      {limits.canInterviewSimulator && (
                        <Button asChild size="sm" variant="outline" className="gap-1 text-xs h-7 border-warning/40 bg-warning/5 hover:bg-warning/10">
                          <Link to="/simulasi-wawancara">
                            <Mic className="h-3 w-3 text-warning" /> Simulasi
                          </Link>
                        </Button>
                      )}
                      {limits.canCompare && (
                        <Button asChild size="sm" variant="outline" className="gap-1 text-xs h-7">
                          <Link to="/compare">
                            <ArrowLeftRight className="h-3 w-3" /> Bandingkan
                          </Link>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={cv.share_enabled ? "default" : "outline"}
                        className="gap-1 text-xs h-7"
                        onClick={() => handleToggleShare(cv)}
                        disabled={shareGenerating}
                      >
                        {shareGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Share2 className="h-3 w-3" />}
                        {cv.share_enabled ? "Aktif" : "Bagikan"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-xs h-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(cv.id)}
                        aria-label="Hapus CV"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Upgrade Banner (free users with CVs) ── */}
      {tier === "free" && cvs.length > 0 && (
        <Card className="mt-6 border-primary/20 bg-gradient-to-r from-primary/5 to-card">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/20">
                <Zap className="h-5 w-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">
                  Buka semua fitur CV
                </h3>
                <p className="text-xs text-muted-foreground">
                  CV unlimited, template premium, cover letter AI, tanpa watermark.
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="gap-1 shrink-0">
              <Link to="/harga">
                Lihat Paket <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Mode Choice Dialog ── */}
      <Dialog open={showModeDialog} onOpenChange={setShowModeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pilih Mode Pengisian CV</DialogTitle>
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
              className="flex items-start gap-4 rounded-xl border-2 border-primary/30 bg-primary/5 p-4 text-left hover:border-primary hover:bg-primary/10 transition-all"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                  Panduan AI
                  <Badge className="text-[10px] bg-warning/20 text-warning hover:bg-warning/20">
                    Direkomendasikan
                  </Badge>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  AI akan memandumu langkah demi langkah. Cocok untuk yang baru
                  pertama membuat CV atau bingung mulai dari mana.
                </p>
                {creating && <Loader2 className="h-4 w-4 animate-spin mt-2" />}
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleCreate(false)}
              disabled={creating}
              className="flex items-start gap-4 rounded-xl border-2 border-border p-4 text-left hover:border-primary/50 transition-all"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Edit3 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Isi Sendiri</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Langsung isi CV dari editor. Cocok untuk yang sudah tahu apa
                  yang ingin ditulis.
                </p>
                {creating && <Loader2 className="h-4 w-4 animate-spin mt-2" />}
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Create CV Dialog ── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Pilih Template CV</DialogTitle>
            <DialogDescription>
              Pilih template untuk CV barumu. Template bisa diubah nanti di editor.
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
              className="gap-1.5"
            >
              Pilih Template
              <ArrowLeftRight className="h-3.5 w-3.5" style={{ transform: "rotate(90deg)" }} />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={(open) => { setShowShareDialog(open); if (!open) setCopied(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Share2 className="h-5 w-5 text-primary" />
              Link CV Siap Dibagikan
            </DialogTitle>
            <DialogDescription className="text-sm">
              Bagikan link ini agar orang lain bisa melihat CV <strong>{shareCv?.title}</strong> kamu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                ref={shareInputRef}
                readOnly
                value={`https://cvats.id/share/${shareCv?.share_token || ""}`}
                className="font-mono text-sm h-10"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button size="sm" className="h-10 gap-1.5 shrink-0" onClick={handleCopyShareLink}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Tersalin" : "Salin"}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Bagikan via:</span>
              <div className="flex gap-2">
                <WhatsAppShare
                  shareUrl={`https://cvats.id/share/${shareCv?.share_token || ""}`}
                  cvId={shareCv?.id}
                  size="sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => window.open(`https://cvats.id/share/${shareCv?.share_token}`, "_blank")}
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
