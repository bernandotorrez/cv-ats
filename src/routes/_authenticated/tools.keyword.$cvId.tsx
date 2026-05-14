import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Copy,
  FileText,
  Key,
  Layers3,
  ListChecks,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { extractKeywords } from "@/lib/ai-functions";
import { useAuth } from "@/lib/auth-context";
import type { CvData } from "@/lib/cv-types";
import { emptyCv } from "@/lib/cv-types";
import { buildSeo } from "@/lib/seo";
import { checkFeatureAccess } from "@/lib/subscription";

export const Route = createFileRoute("/_authenticated/tools/keyword/$cvId")({
  head: () =>
    buildSeo({
      title: "Keyword Extractor - CV Pintar",
      description: "Ekstrak keyword penting dari job description untuk optimasi CV ATS.",
      path: "/tools/keyword-extractor",
      noindex: true,
    }),
  component: KeywordExtractorPage,
});

type KeywordResult = {
  hardSkills: string[];
  softSkills: string[];
  qualifications: string[];
  actionVerbs: string[];
  keywordsSummary: string;
};

const modeOptions = [
  {
    value: "specific" as const,
    icon: FileText,
    label: "Spesifik",
    description: "Ekstrak keyword dari job description asli.",
  },
  {
    value: "general" as const,
    icon: Sparkles,
    label: "Umum",
    description: "Cari keyword standar untuk target posisi.",
  },
];

const usageNotes = [
  "Masukkan keyword yang benar-benar kamu kuasai, bukan semua keyword sekaligus.",
  "Gunakan hard skill di bagian skill dan pengalaman kerja.",
  "Pakai action verbs untuk membuat bullet achievement lebih hidup.",
];

function KeywordExtractorPage() {
  const { cvId } = Route.useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [cvData, setCvData] = useState<CvData>(emptyCv);
  const [cvTitle, setCvTitle] = useState("");
  const [mode, setMode] = useState<"specific" | "general">("specific");
  const [kwJobDesc, setKwJobDesc] = useState("");
  const [kwTargetRole, setKwTargetRole] = useState("");
  const [kwResult, setKwResult] = useState<KeywordResult | null>(null);
  const [kwLoading, setKwLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (user?.id) {
        const canUseKeywordExtractor = await checkFeatureAccess(user.id, "canKeywordExtract");

        if (!canUseKeywordExtractor) {
          setHasAccess(false);
          setLoading(false);
          return;
        }

        setHasAccess(true);
      }

      const { data: row, error } = await supabase.from("cvs").select("*").eq("id", cvId).single();

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      setCvTitle(row.title);
      const data = { ...emptyCv, ...(row.data as unknown as CvData) };
      setCvData(data);
      setKwTargetRole(data.personal.headline || "");
      setLoading(false);
    })();
  }, [cvId, user?.id]);

  const handleExtractKeywords = async () => {
    if (mode === "specific" && !kwJobDesc.trim()) {
      toast.error("Deskripsi pekerjaan wajib diisi untuk mode spesifik.");
      return;
    }

    if (mode === "general" && !kwTargetRole.trim()) {
      toast.error("Target posisi wajib diisi.");
      return;
    }

    setKwLoading(true);
    try {
      let finalJobDesc = kwJobDesc.trim();
      if (mode === "general") {
        finalJobDesc = `Posisi: ${kwTargetRole.trim()}\n\nGenerate keyword umum untuk posisi ini berdasarkan industry standard dan best practices.`;
      }

      const res = await extractKeywords({
        data: {
          jobDescription: finalJobDesc,
          targetRole: kwTargetRole.trim() || undefined,
        },
      });

      setKwResult(res);
      toast.success("Keyword berhasil diekstrak.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mengekstrak keyword";
      toast.error(message);
    } finally {
      setKwLoading(false);
    }
  };

  const handleReset = () => {
    setKwJobDesc("");
    setKwResult(null);
  };

  const handleCopyAll = async () => {
    if (!kwResult) return;

    const text = [
      `Ringkasan:\n${kwResult.keywordsSummary}`,
      `Hard Skills:\n${kwResult.hardSkills.join(", ") || "-"}`,
      `Soft Skills:\n${kwResult.softSkills.join(", ") || "-"}`,
      `Kualifikasi:\n${kwResult.qualifications.join("\n") || "-"}`,
      `Action Verbs:\n${kwResult.actionVerbs.join(", ") || "-"}`,
    ].join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Keyword disalin ke clipboard.");
    } catch {
      toast.error("Gagal menyalin keyword.");
    }
  };

  if (loading) return <KeywordExtractorSkeleton />;

  if (hasAccess === false) return <LockedKeywordExtractor />;

  const canExtract =
    !kwLoading &&
    ((mode === "specific" && Boolean(kwJobDesc.trim())) ||
      (mode === "general" && Boolean(kwTargetRole.trim())));

  return (
    <main className="container-page py-6 sm:py-8 lg:py-10">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="rounded-lg px-2">
          <Link to="/tools" search={{ cvId }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke AI Tools
          </Link>
        </Button>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden border-border bg-card">
          <CardContent className="relative p-5 sm:p-7 lg:p-8">
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary-soft/80 to-transparent" />
            <div className="relative">
              <Badge className="gap-2 rounded-full px-3 py-1.5">
                <Key className="h-3.5 w-3.5" />
                Keyword Extractor
              </Badge>
              <h1 className="mt-5 max-w-3xl text-balance font-display text-3xl font-bold leading-tight tracking-normal text-foreground sm:text-4xl lg:text-5xl">
                Temukan kata kunci yang membuat CV lebih nyambung dengan lowongan.
              </h1>
              <p className="mt-4 max-w-2xl text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
                Ambil hard skill, soft skill, kualifikasi, dan action verbs dari job description,
                lalu pakai sebagai checklist untuk memperkuat CV ATS.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <HeroMetric icon={FileText} label="CV aktif" value={cvTitle || "CV kamu"} />
                <HeroMetric
                  icon={Target}
                  label="Target posisi"
                  value={kwTargetRole || "Belum diisi"}
                />
                <HeroMetric icon={Layers3} label="Output" value="4 kategori keyword" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-primary text-primary-foreground">
          <CardContent className="p-5 sm:p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/15">
              <Search className="h-6 w-6" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold">
              ATS mencari sinyal. Rekruter mencari bukti.
            </h2>
            <p className="mt-3 text-sm leading-6 text-primary-foreground/80">
              Keyword hanya berguna kalau ditempatkan dengan natural dan didukung pengalaman nyata.
              Tool ini membantu kamu memilih mana yang paling penting.
            </p>
            <div className="mt-6 space-y-3">
              {usageNotes.map((note) => (
                <div key={note} className="flex gap-3 text-sm leading-6">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" />
                  <span className="text-primary-foreground/85">{note}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <Card className="border-border bg-card">
          <CardHeader>
            <Badge variant="secondary" className="w-fit rounded-full">
              Input ekstraksi
            </Badge>
            <CardTitle className="font-display text-2xl">
              Mulai dari lowongan asli atau posisi target.
            </CardTitle>
            <CardDescription className="leading-6">
              Mode spesifik paling akurat untuk apply nyata. Mode umum cocok untuk menyiapkan CV
              sebelum mencari lowongan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {modeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={mode === option.value}
                  onClick={() => setMode(option.value)}
                  className={
                    mode === option.value
                      ? "rounded-xl border border-primary bg-primary-soft p-4 text-left ring-2 ring-primary/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      : "rounded-xl border border-border bg-background p-4 text-left transition hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card text-primary">
                      <option.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{option.label}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="targetRole">
                Target posisi
                {mode === "general" && <span className="ml-1 text-destructive">*</span>}
              </Label>
              <Input
                id="targetRole"
                value={kwTargetRole}
                onChange={(event) => setKwTargetRole(event.target.value)}
                placeholder="Contoh: Product Manager, HR Generalist, Backend Engineer"
                className="h-11 rounded-lg"
              />
              <p className="text-xs text-muted-foreground">
                {mode === "specific"
                  ? "Opsional, tapi membantu AI membaca konteks lowongan."
                  : "Wajib untuk membuat keyword umum yang lebih relevan."}
              </p>
            </div>

            {mode === "specific" ? (
              <div className="grid gap-2">
                <div className="flex items-end justify-between gap-3">
                  <Label htmlFor="jobDesc">
                    Deskripsi pekerjaan
                    <span className="ml-1 text-destructive">*</span>
                  </Label>
                  <span className="text-xs text-muted-foreground">{kwJobDesc.length}/10.000</span>
                </div>
                <Textarea
                  id="jobDesc"
                  value={kwJobDesc}
                  onChange={(event) => setKwJobDesc(event.target.value)}
                  placeholder="Tempel job description lengkap di sini. Sertakan responsibilities, requirements, skill, tools, dan kualifikasi yang diminta."
                  rows={12}
                  maxLength={10000}
                  className="resize-none rounded-lg text-sm leading-6"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-primary/20 bg-primary-soft/50 p-4">
                <div className="flex gap-3">
                  <WandSparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Mode umum membuat keyword baseline.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      AI akan menyarankan keyword berdasarkan standar industri, pola ATS, dan skill
                      yang umum dicari untuk posisi target.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={handleExtractKeywords}
                disabled={!canExtract}
                className="h-11 flex-1 rounded-lg"
              >
                {kwLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengekstrak
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Ekstrak keyword
                  </>
                )}
              </Button>
              {kwResult && (
                <Button onClick={handleReset} variant="outline" className="h-11 rounded-lg">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Badge variant="secondary" className="w-fit rounded-full">
                  Hasil ekstraksi
                </Badge>
                <CardTitle className="mt-3 font-display text-2xl">
                  Keyword yang bisa kamu pakai untuk memperkuat CV.
                </CardTitle>
                <CardDescription className="mt-2 leading-6">
                  Pilih keyword yang relevan dengan pengalamanmu, lalu masukkan secara natural di
                  headline, skill, dan bullet pengalaman.
                </CardDescription>
              </div>
              {kwResult && (
                <Button onClick={handleCopyAll} variant="outline" size="sm" className="rounded-lg">
                  <Copy className="mr-2 h-4 w-4" />
                  Salin semua
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!kwResult ? (
              <EmptyResultState loading={kwLoading} />
            ) : (
              <KeywordResultView result={kwResult} />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function KeywordResultView({ result }: { result: KeywordResult }) {
  return (
    <div className="animate-in fade-in-50 space-y-5">
      <div className="rounded-xl border border-primary/20 bg-primary-soft/50 p-4">
        <div className="flex gap-3 text-sm leading-6">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-muted-foreground">{result.keywordsSummary}</p>
        </div>
      </div>

      <div className="grid gap-4">
        <KeywordGroup
          icon={Key}
          title="Hard Skills"
          description="Tools, platform, metode, atau kemampuan teknis yang diminta."
          items={result.hardSkills}
          variant="filled"
          emptyText="Tidak ada hard skill ditemukan."
        />
        <KeywordGroup
          icon={Sparkles}
          title="Soft Skills"
          description="Sinyal perilaku kerja yang dicari rekruter."
          items={result.softSkills}
          variant="outline"
          emptyText="Tidak ada soft skill ditemukan."
        />
        <KeywordList
          icon={ListChecks}
          title="Kualifikasi"
          description="Syarat, pengalaman, atau latar belakang yang perlu dicocokkan."
          items={result.qualifications}
          emptyText="Tidak ada kualifikasi ditemukan."
        />
        <KeywordGroup
          icon={WandSparkles}
          title="Action Verbs"
          description="Kata kerja yang bisa memperkuat bullet pengalaman."
          items={result.actionVerbs}
          variant="accent"
          emptyText="Tidak ada action verb ditemukan."
        />
      </div>

      <div className="rounded-xl border border-border bg-background p-4">
        <p className="text-sm font-semibold text-foreground">Cara pakai cepat</p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
          <li className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            Masukkan 5-8 hard skills paling relevan di bagian skill.
          </li>
          <li className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            Gunakan action verbs di pengalaman kerja, lalu ikuti dengan bukti angka atau dampak.
          </li>
          <li className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            Hindari keyword stuffing. Rekruter tetap membaca konteksnya.
          </li>
        </ul>
      </div>
    </div>
  );
}

function KeywordGroup({
  icon: Icon,
  title,
  description,
  items,
  variant,
  emptyText,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  items: string[];
  variant: "filled" | "outline" | "accent";
  emptyText: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold">
            {title}{" "}
            <span className="text-sm font-medium text-muted-foreground">({items.length})</span>
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <Badge
              key={item}
              variant={variant === "outline" ? "outline" : "secondary"}
              className={
                variant === "accent"
                  ? "rounded-full border-primary/20 bg-primary-soft text-primary"
                  : "rounded-full"
              }
            >
              {item}
            </Badge>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        )}
      </div>
    </section>
  );
}

function KeywordList({
  icon: Icon,
  title,
  description,
  items,
  emptyText,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold">
            {title}{" "}
            <span className="text-sm font-medium text-muted-foreground">({items.length})</span>
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      {items.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-6">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">{emptyText}</p>
      )}
    </section>
  );
}

function EmptyResultState({ loading }: { loading: boolean }) {
  return (
    <div className="flex min-h-[440px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/25 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-background text-primary">
        {loading ? <Loader2 className="h-7 w-7 animate-spin" /> : <Key className="h-7 w-7" />}
      </div>
      <h2 className="mt-5 font-display text-2xl font-bold">
        {loading ? "Keyword sedang dibaca." : "Hasil keyword akan muncul di sini."}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {loading
          ? "AI sedang memindai job description dan mengelompokkan keyword penting."
          : "Isi posisi atau tempel job description, lalu ekstrak keyword untuk mulai mengoptimalkan CV."}
      </p>
    </div>
  );
}

function HeroMetric({
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

function LockedKeywordExtractor() {
  return (
    <main className="container-page flex min-h-[70vh] items-center justify-center py-10">
      <Card className="w-full max-w-xl border-border bg-card">
        <CardContent className="flex flex-col items-center px-6 py-12 text-center sm:px-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Lock className="h-7 w-7" />
          </div>
          <Badge variant="secondary" className="mt-5 rounded-full">
            Fitur premium
          </Badge>
          <h1 className="mt-4 font-display text-2xl font-bold">
            Keyword Extractor belum aktif di paketmu.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Upgrade paket untuk mengekstrak keyword ATS dari job description dan menyusun CV yang
            lebih relevan.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" asChild className="rounded-lg">
              <Link to="/tools">Kembali ke Tools</Link>
            </Button>
            <Button asChild className="rounded-lg">
              <Link to="/harga">Upgrade paket</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function KeywordExtractorSkeleton() {
  return (
    <main className="container-page space-y-6 py-6 sm:py-8 lg:py-10">
      <Skeleton className="h-9 w-40 rounded-lg" />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-border bg-card p-5 sm:p-7 lg:p-8">
          <Skeleton className="h-7 w-40 rounded-full" />
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <Skeleton className="h-6 w-36 rounded-full" />
          <Skeleton className="mt-3 h-8 w-72 max-w-full" />
          <Skeleton className="mt-2 h-4 w-full max-w-lg" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Skeleton className="mt-5 h-11 rounded-lg" />
          <Skeleton className="mt-4 h-72 rounded-lg" />
          <Skeleton className="mt-5 h-11 rounded-lg" />
        </div>

        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="mt-3 h-8 w-72 max-w-full" />
          <Skeleton className="mt-2 h-4 w-full max-w-lg" />
          <Skeleton className="mt-5 h-24 rounded-xl" />
          <div className="mt-5 space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
