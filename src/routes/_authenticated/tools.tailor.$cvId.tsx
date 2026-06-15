import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Link2,
  Loader2,
  Lock,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CvPreview } from "@/components/cv/CvPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackButton } from "@/components/ui/back-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { tailorCvToJob, type TailorCvResult } from "@/lib/ai-functions";
import { useAuth } from "@/lib/auth-context";
import { emptyCv, type CvData, type TemplateId } from "@/lib/cv-types";
import { buildSeo } from "@/lib/seo";
import { getUserTier } from "@/lib/subscription";
import type { Json } from "@/integrations/supabase/types";

type TailorMode = "database" | "url" | "manual";

interface JobOption {
  id: string;
  title: string;
  company: string;
  location: string;
  level: string | null;
}

export const Route = createFileRoute("/_authenticated/tools/tailor/$cvId")({
  head: () =>
    buildSeo({
      title: "Auto Tailor CV untuk Lowongan - CV Pintar",
      description:
        "Sesuaikan ringkasan, skill, dan pengalaman CV berdasarkan job description target.",
      path: "/tools/tailor",
      noindex: true,
    }),
  component: TailorCvPage,
});

function TailorCvPage() {
  const { cvId } = Route.useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [cvTitle, setCvTitle] = useState("");
  const [templateId, setTemplateId] = useState<TemplateId>("jakarta");
  const [cvData, setCvData] = useState<CvData>(emptyCv);
  const [cvLanguage, setCvLanguage] = useState<"id" | "en">("id");
  const [mode, setMode] = useState<TailorMode>("database");
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [search, setSearch] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<TailorCvResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user?.id) return;

      const tier = await getUserTier(user.id);
      if (tier !== "pro") {
        setHasAccess(false);
        setLoading(false);
        return;
      }
      setHasAccess(true);

      const { data: row, error } = await supabase.from("cvs").select("*").eq("id", cvId).single();
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      const nextData = { ...emptyCv, ...(row.data as unknown as CvData) };
      setCvTitle(row.title);
      setTemplateId(row.template_id as TemplateId);
      setCvData(nextData);
      setCvLanguage(row.language === "en" ? "en" : "id");
      setJobTitle(nextData.personal.headline || "");

      const { data: jobRows } = await supabase
        .from("job_listings")
        .select("id, title, company, location, level")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(80);

      const nextJobs = (jobRows ?? []) as JobOption[];
      setJobs(nextJobs);
      setSelectedJobId((current) => current || nextJobs[0]?.id || "");
      setLoading(false);
    })();
  }, [cvId, user?.id]);

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((job) =>
      `${job.title} ${job.company} ${job.location} ${job.level || ""}`.toLowerCase().includes(q),
    );
  }, [jobs, search]);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) || null,
    [jobs, selectedJobId],
  );

  const tailoredData = useMemo(
    () => (result?.tailoredCvData ? ({ ...emptyCv, ...result.tailoredCvData } as CvData) : null),
    [result],
  );

  const canGenerate =
    (mode === "database" && Boolean(selectedJobId)) ||
    (mode === "url" && Boolean(jobUrl.trim())) ||
    (mode === "manual" && Boolean(jobDescription.trim()));

  const handleGenerate = async () => {
    if (!canGenerate) {
      toast.error("Pilih lowongan, masukkan URL, atau isi job description manual.");
      return;
    }

    setGenerating(true);
    try {
      const nextResult = await tailorCvToJob({
        data: {
          cvId,
          jobId: mode === "database" ? selectedJobId : undefined,
          jobUrl: mode === "url" ? jobUrl.trim() : undefined,
          jobDescription: mode === "manual" ? jobDescription.trim() : undefined,
          jobTitle: jobTitle.trim() || undefined,
          companyName: companyName.trim() || undefined,
          language: cvLanguage,
        },
      });
      setResult(nextResult);
      toast.success("CV berhasil disesuaikan. Review dulu sebelum diterapkan.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyesuaikan CV.");
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = async () => {
    if (!tailoredData) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("cvs")
        .update({
          data: tailoredData as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("id", cvId);

      if (error) throw new Error(error.message);
      setCvData(tailoredData);
      toast.success("Versi tailored sudah diterapkan ke CV.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan CV.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <TailorSkeleton />;
  if (hasAccess === false) return <LockedTailor />;

  return (
    <main className="container-page py-6 sm:py-8 lg:py-10">
      <div className="mb-6">
        <BackButton />
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <Card className="overflow-hidden border-border bg-card">
          <CardContent className="relative p-5 sm:p-7 lg:p-8">
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary-soft/80 to-transparent" />
            <div className="relative">
              <Badge className="gap-2 rounded-full px-3 py-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Auto Tailor CV - Pro 30x/bulan
              </Badge>
              <h1 className="mt-5 max-w-3xl text-balance font-display text-3xl font-bold leading-tight tracking-normal text-foreground sm:text-4xl lg:text-5xl">
                Sesuaikan CV untuk satu lowongan tanpa menulis ulang dari nol.
              </h1>
              <p className="mt-4 max-w-2xl text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
                AI membaca CV dan job description, lalu menyesuaikan ringkasan, prioritas skill, dan
                deskripsi pengalaman agar lebih relevan. Tetap berbasis data CV yang kamu punya.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <HeroMetric icon={FileText} label="CV aktif" value={cvTitle || "CV kamu"} />
                <HeroMetric
                  icon={Target}
                  label="Target"
                  value={selectedJob?.title || jobTitle || "Belum dipilih"}
                />
                <HeroMetric
                  icon={BriefcaseBusiness}
                  label="Perusahaan"
                  value={selectedJob?.company || companyName || "Opsional"}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-primary text-primary-foreground">
          <CardContent className="p-5 sm:p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/15">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold">
              Tailor yang bagus itu menonjolkan bukti, bukan mengarang cerita.
            </h2>
            <div className="mt-6 space-y-3">
              {[
                "Keyword lowongan diprioritaskan di summary, skill, dan pengalaman.",
                "Data asli seperti perusahaan, tanggal, dan sertifikasi tetap dipertahankan.",
                "Keyword yang belum bisa dibuktikan akan muncul sebagai catatan kehati-hatian.",
              ].map((note) => (
                <div key={note} className="flex gap-3 text-sm leading-6">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" />
                  <span className="text-primary-foreground/85">{note}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="border-border bg-card">
          <CardHeader>
            <Badge variant="secondary" className="w-fit rounded-full">
              Konteks lowongan
            </Badge>
            <CardTitle className="font-display text-2xl">Pilih sumber lowongan.</CardTitle>
            <CardDescription className="leading-6">
              Gunakan lowongan dari database CV Pintar, URL lowongan, atau job description manual
              agar hasil tailoring lebih tajam.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-3 gap-2">
              {[
                ["database", BriefcaseBusiness, "Database"],
                ["url", Link2, "URL"],
                ["manual", FileText, "Manual"],
              ].map(([value, Icon, label]) => (
                <Button
                  key={value as string}
                  type="button"
                  variant={mode === value ? "default" : "outline"}
                  className="h-auto flex-col gap-1 rounded-lg py-3 text-xs"
                  onClick={() => {
                    setMode(value as TailorMode);
                    setResult(null);
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {label as string}
                </Button>
              ))}
            </div>

            {mode === "database" && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cari role, perusahaan, lokasi..."
                    className="h-11 rounded-lg pl-9"
                  />
                </div>
                {jobs.length > 0 ? (
                  <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                    <SelectTrigger className="h-11 rounded-lg">
                      <SelectValue placeholder="Pilih lowongan" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredJobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.title} - {job.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="rounded-lg border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
                    Belum ada lowongan aktif di database. Gunakan URL atau manual sebagai sumber
                    lowongan.
                  </div>
                )}
              </div>
            )}

            {mode === "url" && (
              <div className="space-y-4">
                <Field
                  id="job-url"
                  label="URL lowongan"
                  value={jobUrl}
                  onChange={setJobUrl}
                  placeholder="https://..."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    id="url-job-title"
                    label="Posisi target"
                    value={jobTitle}
                    onChange={setJobTitle}
                    placeholder="Contoh: Product Manager"
                  />
                  <Field
                    id="url-company"
                    label="Perusahaan"
                    value={companyName}
                    onChange={setCompanyName}
                    placeholder="Contoh: PT Talenta Nusantara"
                  />
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  Jika situs memblokir scraping, paste job description manual sebagai fallback.
                </p>
              </div>
            )}

            {mode === "manual" && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    id="manual-job-title"
                    label="Posisi target"
                    value={jobTitle}
                    onChange={setJobTitle}
                    placeholder="Contoh: Product Manager"
                  />
                  <Field
                    id="manual-company"
                    label="Perusahaan"
                    value={companyName}
                    onChange={setCompanyName}
                    placeholder="Contoh: PT Talenta Nusantara"
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-end justify-between gap-3">
                    <Label htmlFor="job-description">
                      Job description
                      <span className="ml-1 text-destructive">*</span>
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {jobDescription.length}/12.000
                    </span>
                  </div>
                  <Textarea
                    id="job-description"
                    value={jobDescription}
                    onChange={(event) => setJobDescription(event.target.value)}
                    placeholder="Paste lowongan lengkap di sini..."
                    rows={14}
                    maxLength={12000}
                    className="resize-none rounded-lg text-sm leading-6"
                  />
                </div>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={generating || !canGenerate}
              className="h-11 w-full rounded-lg"
            >
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {generating ? "Menyesuaikan CV..." : "Generate versi tailored"}
            </Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border bg-card">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <Badge variant="secondary" className="w-fit rounded-full">
                  Hasil tailor
                </Badge>
                <CardTitle className="mt-3 font-display text-2xl">
                  Review perubahan sebelum diterapkan.
                </CardTitle>
                <CardDescription className="mt-2 leading-6">
                  Setelah cocok, klik apply untuk menyimpan hasil ke CV ini.
                </CardDescription>
              </div>
              {tailoredData && (
                <Button onClick={handleApply} disabled={saving} className="rounded-lg">
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Terapkan ke CV
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!result || !tailoredData ? (
              <EmptyResult generating={generating} />
            ) : (
              <div className="space-y-5">
                <div className="rounded-xl border border-primary/20 bg-primary-soft/50 p-4">
                  <div className="flex gap-3 text-sm leading-6">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <p className="text-muted-foreground">{result.summary}</p>
                  </div>
                </div>

                {result.keywordFocus.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                      Keyword focus
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.keywordFocus.map((keyword) => (
                        <Badge key={keyword} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.changes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Perubahan utama
                    </p>
                    {result.changes.map((change) => (
                      <div
                        key={`${change.section}-${change.after}-${change.reason}`}
                        className="rounded-xl border border-border bg-background p-4"
                      >
                        <p className="text-sm font-semibold text-foreground">{change.section}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {change.reason}
                        </p>
                        {change.after && (
                          <p className="mt-2 rounded-lg bg-muted/60 p-3 text-xs leading-5 text-foreground">
                            {change.after}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {result.cautions.length > 0 && (
                  <div className="rounded-xl border border-amber-300/60 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-900">Catatan jujur</p>
                    <ul className="mt-2 space-y-1 text-sm leading-6 text-amber-800">
                      {result.cautions.map((caution) => (
                        <li key={caution}>{caution}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="max-h-[720px] overflow-auto rounded-xl border border-border bg-muted/25 p-4">
                  <CvPreview
                    data={tailoredData}
                    template={templateId}
                    scale={0.68}
                    language={cvLanguage}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function HeroMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
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

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-lg"
      />
    </div>
  );
}

function EmptyResult({ generating }: { generating: boolean }) {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/25 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-background text-primary">
        {generating ? (
          <Loader2 className="h-7 w-7 animate-spin" />
        ) : (
          <RefreshCw className="h-7 w-7" />
        )}
      </div>
      <h2 className="mt-5 font-display text-2xl font-bold">
        {generating ? "CV sedang disesuaikan." : "Versi tailored akan muncul di sini."}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {generating
          ? "AI sedang membaca CV dan lowongan target. Setelah selesai, review perubahan sebelum apply."
          : "Isi konteks lowongan di panel kiri, lalu generate versi CV yang lebih relevan untuk posisi tersebut."}
      </p>
    </div>
  );
}

function LockedTailor() {
  return (
    <main className="container-page flex min-h-[70vh] items-center justify-center py-10">
      <Card className="w-full max-w-xl border-border bg-card">
        <CardContent className="flex flex-col items-center px-6 py-12 text-center sm:px-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Lock className="h-7 w-7" />
          </div>
          <Badge variant="secondary" className="mt-5 rounded-full">
            Pro only
          </Badge>
          <h1 className="mt-4 font-display text-2xl font-bold">
            Auto Tailor CV tersedia di paket Pro.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Upgrade ke Pro untuk membuat versi CV berbeda per lowongan dengan bantuan AI.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" asChild className="rounded-lg">
              <Link to="/tools">Kembali ke Tools</Link>
            </Button>
            <Button asChild className="rounded-lg">
              <Link to="/harga">Upgrade Pro</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function TailorSkeleton() {
  return (
    <main className="container-page space-y-6 py-6 sm:py-8 lg:py-10">
      <Skeleton className="h-9 w-44 rounded-lg" />
      <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Skeleton className="h-[620px] rounded-xl" />
        <Skeleton className="h-[620px] rounded-xl" />
      </div>
    </main>
  );
}
