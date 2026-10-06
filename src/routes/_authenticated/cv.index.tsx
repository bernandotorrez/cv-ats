import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { WhatsAppShare } from "@/components/share/WhatsAppShare";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getTierLimits, getUserTier, type Tier, type TierLimits } from "@/lib/subscription";
import { TemplateGallery } from "@/components/cv/TemplateGallery";
import { emptyCv, TEMPLATES, type TemplateId } from "@/lib/cv-types";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Crown,
  Edit3,
  ExternalLink,
  FileCheck,
  FileText,
  LayoutTemplate,
  Link2,
  Link2Off,
  Loader2,
  Mic,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Share2,
  Sparkles,
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
  const [copiedLink, setCopiedLink] = useState<"cv" | "portfolio" | null>(null);
  const shareInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<CvRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

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

    if ((data?.subscription_tiers as any)?.template_access_detail) {
      setAllowedTemplates((data?.subscription_tiers as any).template_access_detail);
    } else if ((data?.subscription_tiers as any)?.template_access_detail === null) {
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

  const showToolbar = cvs.length > 3;
  const normalizedQuery = query.trim().toLowerCase();
  const visibleCvs = cvs.filter((cv) => {
    if (statusFilter === "draft" && cv.status !== "draft") return false;
    if (statusFilter === "done" && cv.status === "draft") return false;
    if (!normalizedQuery) return true;
    const templateName = TEMPLATES.find((t) => t.id === cv.template_id)?.name ?? cv.template_id;
    return `${cv.title} ${templateName}`.toLowerCase().includes(normalizedQuery);
  });

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
        user_id: userId!,
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

  const handleCopyShareLink = async (kind: "cv" | "portfolio" = "cv") => {
    if (!shareCv?.share_token) return;
    const link =
      kind === "portfolio"
        ? `https://cvpintar.web.id/portfolio/${shareCv.share_token}`
        : `https://cvpintar.web.id/share/${shareCv.share_token}`;
    await navigator.clipboard.writeText(link);
    setCopiedLink(kind);
    toast.success(kind === "portfolio" ? "Link portfolio disalin!" : "Link CV disalin!");
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("cvs").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (error) return toast.error(error.message);
    toast.success("CV dihapus");
    load();
  };

  if (loading) {
    return <CvListSkeleton />;
  }

  const stats = [
    {
      icon: CheckCircle2,
      label: "Siap kirim",
      value: String(finishedCount),
      note: "CV bukan draft",
    },
    {
      icon: LayoutTemplate,
      label: "Template",
      value: String(usedTemplates.length),
      note: `${usedTemplates.length} jenis dipakai`,
    },
    {
      icon: Link2,
      label: "Link aktif",
      value: String(sharedCount),
      note: "Dibagikan publik",
    },
  ];

  return (
    <div className="container-page space-y-6 py-6 md:space-y-8 md:py-10">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link
            to="/dashboard"
            className="inline-flex min-h-8 items-center gap-1.5 text-sm font-semibold text-green-800 underline-offset-4 hover:underline"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Dashboard
          </Link>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            CV Saya
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-gray-600 sm:text-base">
            Kelola semua versi CV, cek skor ATS, dan bagikan link-nya dari satu tempat.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          {limits.enableCvReview && (
            <Link
              to="/cv-review"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 transition-colors hover:border-green-700 hover:bg-green-50 hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
            >
              <Brain aria-hidden="true" className="h-4 w-4" />
              Upload & Review
            </Link>
          )}
          <Button
            onClick={() => setShowCreateDialog(true)}
            disabled={atLimit}
            className="h-11 gap-2 rounded-xl bg-green-700 px-5 font-bold text-white shadow-md shadow-green-700/20 hover:bg-green-800"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Buat CV Baru
          </Button>
        </div>
      </header>

      {/* Lanjutkan yang terakhir diedit */}
      {lastEdited && (
        <section
          aria-label="Lanjutkan mengedit"
          className="relative overflow-hidden rounded-3xl bg-green-700 p-5 text-white shadow-xl shadow-green-900/15 sm:p-6"
        >
          <div
            aria-hidden="true"
            className="absolute -right-10 -top-16 h-52 w-52 rounded-full bg-green-600/50 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-yellow-300/15 blur-3xl"
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                <Pencil aria-hidden="true" className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-yellow-300">
                  Lanjutkan terakhir diedit
                </p>
                <p className="mt-0.5 truncate font-display text-xl font-extrabold">
                  {lastEdited.title}
                </p>
                <p className="mt-0.5 text-sm text-green-50">
                  Diedit {timeAgo(lastEdited.updated_at)} · template{" "}
                  {TEMPLATES.find((t) => t.id === lastEdited.template_id)?.name ??
                    lastEdited.template_id}
                </p>
              </div>
            </div>
            <Link
              to="/cv/$id"
              params={{ id: lastEdited.id }}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-yellow-300 px-6 text-base font-extrabold text-gray-950 shadow-lg transition-colors hover:bg-yellow-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-green-700"
            >
              Lanjutkan Edit
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </Link>
          </div>
        </section>
      )}

      {/* Ringkasan + kuota */}
      <section aria-label="Ringkasan CV">
        <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 shadow-sm lg:grid-cols-4">
          <div
            className={cn(
              "col-span-3 flex flex-col justify-center gap-2 bg-white p-4 sm:p-5 lg:col-span-1",
              atLimit && "bg-red-50",
            )}
          >
            <div className="flex items-center gap-2 text-gray-600">
              <FileText aria-hidden="true" className="h-4 w-4" />
              <dt className="text-sm font-medium">Total CV · paket {tierName}</dt>
            </div>
            <dd className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  "font-display text-3xl font-extrabold leading-none",
                  atLimit ? "text-red-700" : "text-gray-900",
                )}
              >
                {cvs.length}
              </span>
              <span className="text-sm font-semibold text-gray-600">
                {limits.maxCvs === null ? "· tanpa batas" : `/ ${limits.maxCvs}`}
              </span>
            </dd>
            {limits.maxCvs !== null && (
              <Progress
                value={quotaPercent}
                className="h-2 bg-gray-200"
                aria-label={`${cvs.length} dari ${limits.maxCvs} CV terpakai`}
              />
            )}
          </div>
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col justify-center gap-1 bg-white p-3 sm:p-5"
            >
              <div className="flex items-center gap-2 text-gray-600">
                <stat.icon aria-hidden="true" className="hidden h-4 w-4 sm:block" />
                <dt className="text-xs font-medium sm:text-sm">{stat.label}</dt>
              </div>
              <dd className="font-display text-2xl font-extrabold leading-none text-gray-900 sm:text-3xl">
                {stat.value}
              </dd>
              <p className="hidden text-xs text-gray-600 sm:block">{stat.note}</p>
            </div>
          ))}
        </dl>

        {atLimit && (
          <div
            role="status"
            className="mt-3 flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm text-amber-950">
              Kuota CV paket <strong>{tierName}</strong> sudah penuh ({cvs.length}/{limits.maxCvs}).
              Upgrade untuk membuat versi CV lebih banyak.
            </p>
            <Link
              to="/harga"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-green-700 px-4 text-sm font-bold text-white transition-colors hover:bg-green-800"
            >
              <Crown aria-hidden="true" className="h-4 w-4" />
              Upgrade
            </Link>
          </div>
        )}
      </section>

      {/* Koleksi CV */}
      <section aria-labelledby="koleksi-heading" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2
            id="koleksi-heading"
            className="font-display text-xl font-extrabold tracking-tight text-gray-900"
          >
            Koleksi CV
            <span className="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 align-middle text-sm font-bold text-gray-700">
              {cvs.length}
            </span>
          </h2>

          {showToolbar && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari judul atau template"
                  aria-label="Cari CV"
                  className="h-10 w-full rounded-xl border-gray-300 pl-9 text-sm shadow-none placeholder:text-gray-500 focus-visible:border-green-700 focus-visible:ring-2 focus-visible:ring-green-700/20 sm:w-64"
                />
              </div>
              <div
                role="group"
                aria-label="Filter status"
                className="flex rounded-xl border border-gray-200 bg-gray-50 p-0.5"
              >
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setStatusFilter(f.value)}
                    aria-pressed={statusFilter === f.value}
                    className={cn(
                      "h-9 flex-1 rounded-[10px] px-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700",
                      statusFilter === f.value
                        ? "bg-white text-green-800 shadow-sm ring-1 ring-gray-200"
                        : "text-gray-600 hover:text-gray-900",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {cvs.length === 0 ? (
          <EmptyState onCreate={() => setShowCreateDialog(true)} />
        ) : visibleCvs.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-10 text-center">
            <p className="font-bold text-gray-900">Tidak ada CV yang cocok</p>
            <p className="mt-1 text-sm text-gray-600">
              Coba kata kunci lain atau ubah filter status.
            </p>
            <Button
              variant="outline"
              className="mt-4 rounded-xl"
              onClick={() => {
                setQuery("");
                setStatusFilter("all");
              }}
            >
              Reset pencarian
            </Button>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleCvs.map((cv) => (
              <li key={cv.id}>
                <CvCard
                  cv={cv}
                  limits={limits}
                  shareGenerating={shareGenerating}
                  onDelete={setDeleteTarget}
                  onToggleShare={handleToggleShare}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {tier === "free" && cvs.length > 0 && (
        <section
          aria-label="Upgrade paket"
          className="rounded-2xl border border-green-200 bg-green-50 p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-700 text-white">
                <Zap aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-lg font-extrabold text-gray-900">
                  Buka ruang untuk versi CV berikutnya
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-700">
                  Upgrade untuk CV lebih banyak, template premium, cover letter AI, dan simulasi
                  interview.
                </p>
              </div>
            </div>
            <Link
              to="/harga"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-green-700 px-5 text-sm font-bold text-white shadow-md shadow-green-700/20 transition-colors hover:bg-green-800"
            >
              Lihat Paket
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Konfirmasi hapus */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus CV ini?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong className="text-gray-900">{deleteTarget?.title}</strong> akan dihapus
              permanen, termasuk link share-nya. Data tidak bisa dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-red-700 text-white hover:bg-red-800"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ya, hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showModeDialog} onOpenChange={setShowModeDialog}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pilih cara mulai</DialogTitle>
            <DialogDescription>
              Template:{" "}
              <strong>
                {TEMPLATES.find((t) => t.id === selectedTemplate)?.name ?? selectedTemplate}
              </strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <button
              type="button"
              onClick={() => handleCreate(true)}
              disabled={creating}
              className="flex items-start gap-4 rounded-2xl border-2 border-green-600 bg-green-50 p-4 text-left transition-colors hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 disabled:opacity-70"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-700 text-white">
                <Sparkles aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 text-sm font-bold text-gray-900">
                  Panduan AI
                  <span className="rounded-full bg-yellow-300 px-2 py-0.5 text-[10px] font-bold text-gray-900">
                    Direkomendasikan
                  </span>
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-gray-700">
                  Cocok kalau kamu ingin dibantu menyusun isi CV langkah demi langkah.
                </span>
              </span>
              {creating && <Loader2 className="mt-1 h-4 w-4 animate-spin" />}
            </button>

            <button
              type="button"
              onClick={() => handleCreate(false)}
              disabled={creating}
              className="flex items-start gap-4 rounded-2xl border-2 border-gray-200 p-4 text-left transition-colors hover:border-green-600 hover:bg-green-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 disabled:opacity-70"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                <Edit3 aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-gray-900">
                  Isi sendiri atau upload CV
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-gray-700">
                  Cocok kalau kamu sudah punya bahan dan ingin langsung masuk editor.
                </span>
              </span>
              {creating && <Loader2 className="mt-1 h-4 w-4 animate-spin" />}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="flex max-h-[90vh] flex-col rounded-2xl sm:max-w-4xl">
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
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setShowCreateDialog(false)}
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                setShowCreateDialog(false);
                setShowModeDialog(true);
              }}
              className="gap-1.5 rounded-xl bg-green-700 font-bold text-white hover:bg-green-800"
            >
              Pilih Template
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showShareDialog}
        onOpenChange={(open) => {
          setShowShareDialog(open);
          if (!open) setCopiedLink(null);
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Share2 aria-hidden="true" className="h-5 w-5 text-green-700" />
              Link CV dan portfolio siap dibagikan
            </DialogTitle>
            <DialogDescription className="text-sm">
              Pilih link CV-only atau portfolio publik untuk <strong>{shareCv?.title}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Shared CV</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  ref={shareInputRef}
                  readOnly
                  value={`https://cvpintar.web.id/share/${shareCv?.share_token || ""}`}
                  aria-label="Link Shared CV"
                  className="h-10 font-mono text-sm"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  size="sm"
                  className="h-10 shrink-0 gap-1.5 bg-green-700 font-bold text-white hover:bg-green-800"
                  onClick={() => handleCopyShareLink("cv")}
                >
                  {copiedLink === "cv" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copiedLink === "cv" ? "Tersalin" : "Salin"}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Portfolio publik
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  readOnly
                  value={`https://cvpintar.web.id/portfolio/${shareCv?.share_token || ""}`}
                  aria-label="Link portfolio publik"
                  className="h-10 font-mono text-sm"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 shrink-0 gap-1.5"
                  onClick={() => handleCopyShareLink("portfolio")}
                >
                  {copiedLink === "portfolio" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copiedLink === "portfolio" ? "Tersalin" : "Salin"}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-gray-600">Bagikan via:</span>
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
                    window.open(
                      `https://cvpintar.web.id/portfolio/${shareCv?.share_token}`,
                      "_blank",
                    )
                  }
                >
                  <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                  Buka Portfolio
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type StatusFilter = "all" | "draft" | "done";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "draft", label: "Draft" },
  { value: "done", label: "Selesai" },
];

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  return `pada ${new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="rounded-3xl border-2 border-dashed border-gray-200 bg-gradient-to-b from-green-50 to-white p-8 text-center md:p-14">
      <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-green-700 shadow-xl shadow-green-900/10 ring-1 ring-green-100">
        <FileText aria-hidden="true" className="h-10 w-10" />
      </span>
      <h3 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-gray-900">
        Mulai dari satu CV yang benar-benar kuat.
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-600 sm:text-base">
        Pilih template, isi data, aktifkan AI bila perlu, lalu export PDF saat sudah siap apply.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button
          onClick={onCreate}
          className="h-12 gap-2 rounded-xl bg-green-700 px-6 text-base font-bold text-white shadow-lg shadow-green-700/25 hover:bg-green-800"
        >
          <Plus aria-hidden="true" className="h-5 w-5" />
          Buat CV Baru
        </Button>
        <Link
          to="/template"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-6 text-base font-semibold text-gray-800 transition-colors hover:border-green-700 hover:bg-green-50 hover:text-green-800"
        >
          <LayoutTemplate aria-hidden="true" className="h-5 w-5" />
          Lihat Template
        </Link>
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
  onDelete: (cv: CvRow) => void;
  onToggleShare: (cv: CvRow) => void;
}) {
  const tpl = TEMPLATES.find((t) => t.id === cv.template_id);
  const isDraft = cv.status === "draft";
  const menuItem = "gap-2.5 rounded-xl py-2.5 text-sm";

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-green-600 hover:shadow-xl">
      <div className="flex items-start gap-3">
        {/* Ilustrasi kertas CV */}
        <div
          aria-hidden="true"
          className="flex h-16 w-12 shrink-0 flex-col gap-1 rounded-md border border-gray-200 bg-gray-50 p-1.5 shadow-sm"
        >
          <span className="h-1.5 w-7 rounded-full bg-green-700" />
          <span className="h-1 w-full rounded-full bg-gray-300" />
          <span className="h-1 w-5/6 rounded-full bg-gray-300" />
          <span className="mt-1 h-1 w-full rounded-full bg-gray-200" />
          <span className="h-1 w-4/6 rounded-full bg-gray-200" />
          <span className="h-1 w-full rounded-full bg-gray-200" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-display text-base font-extrabold text-gray-900">
              {cv.title}
            </h3>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold",
                isDraft ? "bg-gray-100 text-gray-700" : "bg-green-100 text-green-800",
              )}
            >
              {isDraft ? "Draft" : "Selesai"}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">Template {tpl?.name ?? cv.template_id}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
            <span className="inline-flex items-center gap-1">
              <Clock aria-hidden="true" className="h-3 w-3" />
              Diedit {timeAgo(cv.updated_at)}
            </span>
            {cv.share_enabled && (
              <span className="inline-flex items-center gap-1 font-semibold text-green-800">
                <Link2 aria-hidden="true" className="h-3 w-3" />
                Link aktif
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 pt-5">
        <Link
          to="/cv/$id"
          params={{ id: cv.id }}
          className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-700 text-sm font-bold text-white shadow-md shadow-green-700/20 transition-colors hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
        >
          <Pencil aria-hidden="true" className="h-4 w-4" />
          Edit
        </Link>
        <Link
          to="/score/$cvId"
          params={{ cvId: cv.id }}
          className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-gray-300 bg-white text-sm font-semibold text-gray-800 transition-colors hover:border-green-700 hover:bg-green-50 hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
        >
          <BarChart3 aria-hidden="true" className="h-4 w-4" />
          Skor
        </Link>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            aria-label={`Menu lainnya untuk ${cv.title}`}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-gray-300 bg-white text-gray-700 transition-colors hover:border-green-700 hover:bg-green-50 hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 data-[state=open]:border-green-700 data-[state=open]:bg-green-50"
          >
            <MoreHorizontal aria-hidden="true" className="h-5 w-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-60 rounded-2xl p-1.5">
            {limits.enableCvReview && (
              <DropdownMenuItem asChild className={menuItem}>
                <Link to="/cv-review/$cvId" params={{ cvId: cv.id }}>
                  <Brain className="h-4 w-4 text-green-700" /> Review HR
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild className={menuItem}>
              <Link to="/tools" search={{ cvId: cv.id } as never}>
                <Wrench className="h-4 w-4 text-green-700" /> AI Tools
              </Link>
            </DropdownMenuItem>
            {limits.canCoverLetter && (
              <DropdownMenuItem asChild className={menuItem}>
                <Link to="/tools/cover-letter/$cvId" params={{ cvId: cv.id }}>
                  <FileCheck className="h-4 w-4 text-green-700" /> Cover Letter
                </Link>
              </DropdownMenuItem>
            )}
            {limits.canInterviewSimulator && (
              <DropdownMenuItem asChild className={menuItem}>
                <Link to="/simulasi-wawancara">
                  <Mic className="h-4 w-4 text-green-700" /> Simulasi Interview
                </Link>
              </DropdownMenuItem>
            )}
            {limits.canCompare && (
              <DropdownMenuItem asChild className={menuItem}>
                <Link to="/compare">
                  <ArrowLeftRight className="h-4 w-4 text-green-700" /> Bandingkan Versi
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className={menuItem}
              disabled={shareGenerating}
              onSelect={() => onToggleShare(cv)}
            >
              {shareGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin text-green-700" />
              ) : cv.share_enabled ? (
                <Link2Off className="h-4 w-4 text-green-700" />
              ) : (
                <Share2 className="h-4 w-4 text-green-700" />
              )}
              {cv.share_enabled ? "Nonaktifkan link share" : "Bagikan CV"}
            </DropdownMenuItem>
            <DropdownMenuItem
              className={cn(menuItem, "text-red-700 focus:bg-red-50 focus:text-red-800")}
              onSelect={() => onDelete(cv)}
            >
              <Trash2 className="h-4 w-4" /> Hapus CV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
}

function CvListSkeleton() {
  return (
    <div className="container-page space-y-6 py-6 md:space-y-8 md:py-10" aria-busy="true">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-3 h-10 w-44" />
          <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-40 rounded-xl" />
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
      </header>

      <Skeleton className="h-28 w-full rounded-3xl" />

      <Skeleton className="h-28 w-full rounded-2xl lg:h-24" />

      <section className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex gap-3">
                <Skeleton className="h-16 w-12 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-1/2" />
                  <Skeleton className="mt-3 h-3 w-2/3" />
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <Skeleton className="h-10 flex-1 rounded-xl" />
                <Skeleton className="h-10 flex-1 rounded-xl" />
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
