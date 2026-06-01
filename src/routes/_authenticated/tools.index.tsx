import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  ChevronRight,
  FileText,
  Key,
  Lock,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  WandSparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { checkFeatureAccess, getUserTier } from "@/lib/subscription";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/tools/")({
  head: () =>
    buildSeo({
      title: "AI Tools - CV Pintar",
      description:
        "Tools AI untuk membuat cover letter, mengekstrak keyword, dan mengoptimalkan lamaran kerja.",
      path: "/tools",
      noindex: true,
    }),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      cvId: (search.cvId as string) || undefined,
    };
  },
  component: ToolsIndexPage,
});

interface CvRow {
  id: string;
  title: string;
  template_id: string;
  updated_at: string;
}

type ToolId = "cover-letter" | "keyword-extractor" | "tailor-cv";

interface ToolItem {
  id: ToolId;
  icon: LucideIcon;
  title: string;
  eyebrow: string;
  description: string;
  bestFor: string;
  result: string;
  badge: string;
  enabled: boolean;
  locked: boolean;
  upgradeTier: string;
}

const workflowNotes = [
  "Pilih CV yang paling relevan dengan posisi target.",
  "Tempel job description lengkap supaya output AI lebih spesifik.",
  "Edit hasil akhir sebelum dipakai agar tetap terasa personal.",
];

function ToolsIndexPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cvs, setCvs] = useState<CvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCvPicker, setShowCvPicker] = useState<{ tool: ToolId } | null>(null);
  const [featureFlags, setFeatureFlags] = useState({
    canCoverLetter: true,
    canKeywordExtract: true,
    canTailorCv: false,
  });

  useEffect(() => {
    if (!user?.id) return;

    (async () => {
      setLoading(true);
      const [cvRows, canCoverLetter, canKeywordExtract, tier] = await Promise.all([
        loadCvs(user.id),
        checkFeatureAccess(user.id, "canCoverLetter"),
        checkFeatureAccess(user.id, "canKeywordExtract"),
        getUserTier(user.id),
      ]);

      setCvs(cvRows);
      setFeatureFlags({ canCoverLetter, canKeywordExtract, canTailorCv: tier === "pro" });
      setLoading(false);
    })();
  }, [user?.id]);

  const tools = useMemo<ToolItem[]>(
    () => [
      {
        id: "tailor-cv",
        icon: RefreshCw,
        title: "Auto Tailor CV",
        eyebrow: "Sesuaikan untuk lowongan",
        description:
          "Ubah ringkasan, prioritas skill, dan bullet pengalaman agar CV lebih relevan dengan job description target.",
        bestFor: "Membuat versi CV berbeda untuk lowongan yang paling penting.",
        result: "Preview CV tailored + daftar perubahan + apply ke CV",
        badge: "Pro",
        enabled: featureFlags.canTailorCv,
        locked: !featureFlags.canTailorCv,
        upgradeTier: "Pro",
      },
      {
        id: "cover-letter",
        icon: BookOpen,
        title: "Cover Letter Generator",
        eyebrow: "Buat surat lamaran",
        description:
          "Ubah CV dan job description menjadi cover letter yang rapi, personal, dan siap diedit.",
        bestFor: "Melamar posisi spesifik dengan cerita yang lebih nyambung.",
        result: "Draft cover letter + preview + export TXT/PDF",
        badge: "AI Writer",
        enabled: featureFlags.canCoverLetter,
        locked: !featureFlags.canCoverLetter,
        upgradeTier: "Starter",
      },
      {
        id: "keyword-extractor",
        icon: Key,
        title: "Keyword Extractor",
        eyebrow: "Baca sinyal ATS",
        description:
          "Ambil hard skill, soft skill, kualifikasi, dan action verb penting dari lowongan target.",
        bestFor: "Menyusun CV yang lebih relevan untuk ATS dan rekruter.",
        result: "Keyword list + ringkasan prioritas optimasi",
        badge: "ATS Optimizer",
        enabled: featureFlags.canKeywordExtract,
        locked: !featureFlags.canKeywordExtract,
        upgradeTier: "Starter",
      },
    ],
    [featureFlags],
  );

  const handleToolClick = (tool: ToolItem) => {
    if (!tool.enabled) {
      toast.error("Fitur ini tersedia setelah upgrade paket.");
      navigate({ to: "/harga" });
      return;
    }

    if (cvs.length === 0) {
      toast.error("Kamu belum punya CV. Buat CV dulu ya.");
      navigate({ to: "/cv" });
      return;
    }

    setShowCvPicker({ tool: tool.id });
  };

  const handleCvSelect = (cvId: string) => {
    if (!showCvPicker) return;

    if (showCvPicker.tool === "tailor-cv") {
      navigate({ to: "/tools/tailor/$cvId", params: { cvId } });
    } else if (showCvPicker.tool === "cover-letter") {
      navigate({ to: "/tools/cover-letter/$cvId", params: { cvId } });
    } else {
      navigate({ to: "/tools/keyword/$cvId", params: { cvId } });
    }

    setShowCvPicker(null);
  };

  if (loading) return <ToolsPageSkeleton />;

  const selectedTool = tools.find((tool) => tool.id === showCvPicker?.tool);

  return (
    <main className="container-page py-6 sm:py-8 lg:py-10">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="rounded-lg px-2">
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke dashboard
          </Link>
        </Button>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
        <Card className="overflow-hidden border-border bg-card">
          <CardContent className="relative p-5 sm:p-7 lg:p-8">
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary-soft/80 to-transparent" />
            <div className="relative">
              <Badge className="gap-2 rounded-full px-3 py-1.5">
                <WandSparkles className="h-3.5 w-3.5" />
                AI Tools
              </Badge>
              <h1 className="mt-5 max-w-3xl text-balance font-display text-3xl font-bold leading-tight tracking-normal text-foreground sm:text-4xl lg:text-5xl">
                Tools kecil yang bikin lamaranmu terasa lebih siap.
              </h1>
              <p className="mt-4 max-w-2xl text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
                Mulai dari cover letter sampai keyword ATS, semua dirancang untuk satu tujuan:
                membuat CV dan lamaranmu lebih relevan, jelas, dan mudah dipahami rekruter.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <HeroStat icon={FileText} label="CV tersedia" value={`${cvs.length}`} />
                <HeroStat
                  icon={Sparkles}
                  label="Tools aktif"
                  value={`${tools.filter((tool) => tool.enabled).length}/3`}
                />
                <HeroStat icon={Target} label="Fokus" value="Apply lebih tajam" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-primary text-primary-foreground">
          <CardContent className="p-5 sm:p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/15">
              <Zap className="h-6 w-6" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold">
              AI membantu menyusun. Kamu tetap yang menentukan suara akhirnya.
            </h2>
            <p className="mt-3 text-sm leading-6 text-primary-foreground/80">
              Hasil terbaik muncul saat AI diberi konteks yang bagus: CV yang lengkap, posisi yang
              jelas, dan job description yang nyata.
            </p>
            <div className="mt-6 space-y-3">
              {workflowNotes.map((note) => (
                <div key={note} className="flex gap-3 text-sm leading-6">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" />
                  <span className="text-primary-foreground/85">{note}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} onClick={() => handleToolClick(tool)} />
        ))}
      </section>

      <section className="mt-6 grid gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <Badge variant="secondary" className="rounded-full">
            Cara pakai yang enak
          </Badge>
          <h2 className="mt-4 font-display text-2xl font-bold">
            Satu CV bisa jadi bahan kerja banyak tools.
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Kalau CV belum lengkap, hasil AI akan ikut dangkal. Lengkapi dulu pengalaman, impact,
            skill, dan headline sebelum menjalankan tools.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { step: "01", title: "Pilih CV", text: "Gunakan CV yang paling relevan." },
            { step: "02", title: "Beri konteks", text: "Masukkan posisi atau job description." },
            { step: "03", title: "Edit hasil", text: "Sesuaikan dengan suara dan tujuanmu." },
          ].map((item) => (
            <div key={item.step} className="rounded-xl border border-border/70 bg-background p-4">
              <p className="text-xs font-bold text-primary">{item.step}</p>
              <h3 className="mt-3 font-display text-lg font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <Dialog
        open={showCvPicker !== null}
        onOpenChange={(open) => {
          if (!open) setShowCvPicker(null);
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-2xl">
              <Sparkles className="h-5 w-5 text-primary" />
              Pilih CV untuk {selectedTool?.title ?? "AI Tool"}
            </DialogTitle>
            <DialogDescription className="leading-6">
              Tool ini akan memakai data dari CV pilihanmu sebagai konteks utama.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[44vh] space-y-2 overflow-y-auto py-2">
            {cvs.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                  <FileText className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Belum ada CV.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Buat CV dulu agar AI punya bahan untuk bekerja.
                  </p>
                </div>
              </div>
            ) : (
              cvs.map((cv) => (
                <button
                  key={cv.id}
                  type="button"
                  onClick={() => handleCvSelect(cv.id)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-border p-4 text-left transition hover:border-primary/50 hover:bg-primary-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{cv.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Update{" "}
                      {new Date(cv.updated_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                </button>
              ))
            )}
          </div>

          {cvs.length === 0 && (
            <div className="flex justify-center pb-2">
              <Button asChild className="rounded-lg">
                <Link to="/cv">
                  <Plus className="mr-2 h-4 w-4" />
                  Buat CV baru
                </Link>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

async function loadCvs(userId: string): Promise<CvRow[]> {
  const { data, error } = await supabase
    .from("cvs")
    .select("id, title, template_id, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    toast.error(error.message);
    return [];
  }

  return data ?? [];
}

function ToolCard({ tool, onClick }: { tool: ToolItem; onClick: () => void }) {
  return (
    <Card
      className={
        tool.locked
          ? "relative overflow-hidden border-border bg-card"
          : "group overflow-hidden border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
      }
    >
      {tool.locked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 p-6 backdrop-blur-sm">
          <div className="max-w-xs text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Lock className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">Fitur premium</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Upgrade ke {tool.upgradeTier} untuk membuka tool ini.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-4 rounded-lg">
              <Link to="/harga">Lihat paket</Link>
            </Button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onClick}
        disabled={!tool.enabled}
        className={
          tool.locked
            ? "block h-full w-full cursor-not-allowed text-left opacity-45"
            : "block h-full w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        }
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <tool.icon className="h-6 w-6" />
            </div>
            <Badge variant={tool.locked ? "outline" : "secondary"} className="rounded-full">
              {tool.locked ? "Locked" : tool.badge}
            </Badge>
          </div>
          <p className="mt-2 text-xs font-semibold uppercase tracking-normal text-primary">
            {tool.eyebrow}
          </p>
          <CardTitle className="font-display text-2xl transition group-hover:text-primary">
            {tool.title}
          </CardTitle>
          <CardDescription className="text-sm leading-6">{tool.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-background p-4">
              <p className="text-xs font-semibold text-muted-foreground">Cocok untuk</p>
              <p className="mt-2 text-sm leading-6 text-foreground">{tool.bestFor}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background p-4">
              <p className="text-xs font-semibold text-muted-foreground">Output</p>
              <p className="mt-2 text-sm leading-6 text-foreground">{tool.result}</p>
            </div>
          </div>
          <div className="flex items-center text-sm font-semibold text-primary">
            {tool.enabled ? "Gunakan tool" : "Upgrade untuk akses"}
            <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
          </div>
        </CardContent>
      </button>
    </Card>
  );
}

function HeroStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-background/90 p-4">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ToolsPageSkeleton() {
  return (
    <main className="container-page space-y-6 py-6 sm:py-8 lg:py-10">
      <Skeleton className="h-9 w-44 rounded-lg" />

      <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="rounded-xl border border-border bg-card p-5 sm:p-7 lg:p-8">
          <Skeleton className="h-7 w-32 rounded-full" />
          <Skeleton className="mt-5 h-10 w-full max-w-3xl sm:h-12" />
          <Skeleton className="mt-3 h-10 w-4/5 max-w-2xl sm:h-12" />
          <Skeleton className="mt-5 h-4 w-full max-w-2xl" />
          <Skeleton className="mt-2 h-4 w-5/6 max-w-xl" />
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-xl border border-border p-4">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="mt-3 h-3 w-24" />
                <Skeleton className="mt-2 h-5 w-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 sm:p-7">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <Skeleton className="mt-5 h-8 w-full max-w-sm" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {[1, 2, 3].map((item) => (
          <div key={item} className="rounded-xl border border-border bg-card p-5">
            <div className="flex justify-between gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="mt-5 h-4 w-32" />
            <Skeleton className="mt-3 h-8 w-64 max-w-full" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
            <Skeleton className="mt-5 h-5 w-32" />
          </div>
        ))}
      </div>

      <Skeleton className="h-48 rounded-2xl" />
    </main>
  );
}
