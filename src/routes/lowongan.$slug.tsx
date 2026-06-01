import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { matchCvToJob, type JobMatchResult } from "@/lib/ai-functions";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Building2,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  GraduationCap,
  Gift,
  Lightbulb,
  Laptop,
  Loader2,
  LogIn,
  ListChecks,
  MapPin,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";

type Job = {
  id: string;
  slug: string;
  title: string;
  company: string;
  company_logo?: string | null;
  location: string;
  type: string;
  level: string;
  industry?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  salary_period?: string | null;
  description: string;
  responsibilities?: string | null;
  requirements?: string | null;
  qualifications?: string | null;
  benefits?: string | null;
  tech_stack?: string | null;
  work_mode?: string | null;
  deadline?: string | null;
  source_url?: string | null;
  created_at: string;
};

type JobListingsQuery = {
  select: (columns: string) => {
    eq: (
      column: string,
      value: string | boolean,
    ) => {
      eq: (
        column: string,
        value: string | boolean,
      ) => {
        single: () => Promise<{ data: Job | null; error: unknown }>;
      };
    };
  };
};

type SavedJobListingsQuery = {
  select: (columns: string) => {
    eq: (
      column: string,
      value: string,
    ) => {
      eq: (
        column: string,
        value: string,
      ) => {
        maybeSingle: () => Promise<{ data: { id: string } | null; error: unknown }>;
      };
    };
  };
  insert: (row: { user_id: string; job_listing_id: string }) => Promise<{ error: unknown }>;
  delete: () => {
    eq: (
      column: string,
      value: string,
    ) => {
      eq: (column: string, value: string) => Promise<{ error: unknown }>;
    };
  };
};

type CvOption = {
  id: string;
  title: string;
  updated_at: string;
};

function savedJobListingsTable() {
  return supabase.from("saved_job_listings") as unknown as SavedJobListingsQuery;
}

export const Route = createFileRoute("/lowongan/$slug")({
  loader: async ({ params }) => {
    const jobListings = supabase.from("job_listings") as unknown as JobListingsQuery;
    const { data, error } = await jobListings
      .select("*")
      .eq("slug", params.slug)
      .eq("is_active", true)
      .single();

    if (error || !data) throw notFound();
    return data as Job;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Lowongan tidak ditemukan" }], links: [], scripts: [] };
    }

    return buildSeo({
      title: `Lowongan ${loaderData.title} di ${loaderData.company} - CV Pintar`,
      description:
        loaderData.description?.substring(0, 160) ??
        `Lowongan ${loaderData.title} di ${loaderData.company}, ${loaderData.location}.`,
      path: `/lowongan/${loaderData.slug}`,
      keywords: `lowongan ${loaderData.title}, loker ${loaderData.company}, kerja ${loaderData.location}`,
      jsonLd: {
        "@type": "JobPosting",
        title: loaderData.title,
        description: loaderData.description,
        datePosted: loaderData.created_at,
        hiringOrganization: { "@type": "Organization", name: loaderData.company },
        jobLocation: { "@type": "Place", address: { addressLocality: loaderData.location } },
      },
    });
  },
  component: LowonganDetailPage,
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="font-display text-3xl font-bold">Lowongan tidak ditemukan</h1>
      <p className="mt-2 text-muted-foreground">Lowongan ini mungkin sudah tidak aktif.</p>
      <Button asChild className="mt-6">
        <Link to="/lowongan">Lihat Semua Lowongan</Link>
      </Button>
    </div>
  ),
});

const prepCards = [
  {
    icon: Search,
    title: "Ambil keyword",
    desc: "Catat skill, tools, dan tanggung jawab yang berulang di lowongan ini.",
  },
  {
    icon: Wand2,
    title: "Sesuaikan CV",
    desc: "Tulis ulang pengalaman agar lebih nyambung dengan kebutuhan role.",
  },
  {
    icon: Send,
    title: "Kirim dengan konteks",
    desc: "Gunakan cover letter singkat yang menyebut kebutuhan perusahaan.",
  },
] as const;

function LowonganDetailPage() {
  const job = Route.useLoaderData();
  const salaryText = formatSalary(
    job.salary_min,
    job.salary_max,
    job.salary_currency,
    job.salary_period,
  );
  const postedDate = new Date(job.created_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const responsibilityItems = parseList(job.responsibilities);
  const requirementItems = parseList(job.requirements);
  const qualificationItems = parseList(job.qualifications);
  const benefitItems = parseList(job.benefits);
  const techItems = parseInlineList(job.tech_stack);
  const descriptionParagraphs = parseParagraphs(job.description);
  const deadlineText = job.deadline ? formatLongDate(job.deadline) : null;

  return (
    <main className="overflow-x-clip bg-background">
      <section className="border-b border-border/70">
        <div className="container-page py-8 md:py-12">
          <Button asChild variant="ghost" size="sm" className="mb-8">
            <Link to="/lowongan">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Lowongan
            </Link>
          </Button>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div>
              <Badge className="mb-5 gap-2 border-emerald-200 bg-emerald-100 px-4 py-2 text-sm text-emerald-950 shadow-sm hover:bg-emerald-100">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Detail lowongan
              </Badge>

              <h1 className="max-w-4xl font-display text-4xl font-bold leading-[1.04] text-foreground sm:text-5xl lg:text-6xl">
                {job.title}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-base text-muted-foreground">
                <span className="inline-flex items-center gap-2 font-medium text-foreground">
                  <Building2 className="h-5 w-5 text-primary" />
                  {job.company}
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {job.location}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {postedDate}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                  {levelLabel(job.level)}
                </Badge>
                <Badge variant="secondary">{typeLabel(job.type)}</Badge>
                {job.work_mode && <Badge variant="outline">{workModeLabel(job.work_mode)}</Badge>}
                {job.industry && <Badge variant="outline">{job.industry}</Badge>}
                {salaryText && <Badge variant="outline">{salaryText}</Badge>}
                {deadlineText && <Badge variant="outline">Deadline {deadlineText}</Badge>}
              </div>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
                {descriptionParagraphs[0] ||
                  `Peluang ${job.title} di ${job.company}. Baca detail role, requirement, dan siapkan CV yang relevan sebelum melamar.`}
              </p>
            </div>

            <ApplyPanel job={job} salaryText={salaryText} />
          </div>
        </div>
      </section>

      <section className="container-page py-10 md:py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Briefcase, label: "Tipe kerja", value: typeLabel(job.type) },
            { icon: GraduationCap, label: "Level", value: levelLabel(job.level) },
            { icon: DollarSign, label: "Estimasi gaji", value: salaryText || "Tidak dicantumkan" },
            {
              icon: Laptop,
              label: "Mode kerja",
              value: job.work_mode ? workModeLabel(job.work_mode) : "Belum dicantumkan",
            },
            { icon: CalendarDays, label: "Deadline", value: deadlineText || "Belum dicantumkan" },
            {
              icon: ListChecks,
              label: "Tech stack",
              value: techItems.slice(0, 3).join(", ") || "Tidak dicantumkan",
            },
          ].map((item) => (
            <Card key={item.label} className="border-border/80 shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 font-display text-xl font-bold text-foreground">
                    {item.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-muted/45 py-12 md:py-16">
        <div className="container-page grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="space-y-5">
            <ContentCard
              icon={FileText}
              eyebrow="Role overview"
              title="Deskripsi pekerjaan"
              fallback="Deskripsi pekerjaan belum tersedia lengkap dari sumber asli."
            >
              {descriptionParagraphs.length > 0 ? (
                <div className="space-y-4">
                  {descriptionParagraphs.map((paragraph) => (
                    <p key={paragraph} className="leading-8 text-muted-foreground">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="leading-7 text-muted-foreground">
                  Deskripsi pekerjaan belum tersedia lengkap dari sumber asli.
                </p>
              )}
            </ContentCard>

            <ContentCard
              icon={ListChecks}
              eyebrow="Tanggung jawab"
              title="Responsibilities"
              fallback="Tanggung jawab belum dicantumkan secara terpisah."
            >
              <Checklist items={responsibilityItems} />
            </ContentCard>

            <ContentCard
              icon={ShieldCheck}
              eyebrow="Yang perlu disiapkan"
              title="Job requirements"
              fallback="Requirement belum dicantumkan secara terpisah."
            >
              <Checklist items={requirementItems} />
            </ContentCard>

            <ContentCard
              icon={BadgeCheck}
              eyebrow="Kualifikasi kandidat"
              title="Skill dan kualifikasi"
              fallback="Kualifikasi belum dicantumkan secara terpisah."
            >
              <Checklist items={qualificationItems} />
            </ContentCard>

            <ContentCard
              icon={Gift}
              eyebrow="Benefit"
              title="Fasilitas dan benefit"
              fallback="Benefit belum dicantumkan secara terpisah."
            >
              <Checklist items={benefitItems} />
            </ContentCard>

            {techItems.length > 0 && (
              <ContentCard
                icon={Laptop}
                eyebrow="Tools"
                title="Tech stack dan tools"
                fallback="Tech stack belum dicantumkan."
              >
                <div className="flex flex-wrap gap-2">
                  {techItems.map((item) => (
                    <Badge key={item} variant="secondary" className="px-3 py-1.5">
                      {item}
                    </Badge>
                  ))}
                </div>
              </ContentCard>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <Card className="border-border/80 shadow-sm">
              <CardContent className="p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Lightbulb className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Sebelum klik lamar
                </h2>
                <p className="mt-3 leading-7 text-muted-foreground">
                  Simpan keyword utama dari halaman ini. CV yang terasa spesifik biasanya lebih kuat
                  daripada CV yang sama untuk semua lowongan.
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-3">
              {prepCards.map((item) => (
                <div key={item.title} className="rounded-lg border bg-card p-4 shadow-sm">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="container-page py-12 md:py-16">
        <div className="grid gap-6 rounded-lg border border-border bg-card p-6 shadow-sm md:grid-cols-[1fr_auto] md:items-center md:p-8">
          <div>
            <Badge className="mb-4 bg-primary text-primary-foreground">Cocokkan CV</Badge>
            <h2 className="font-display text-3xl font-bold leading-tight text-foreground">
              Ubah detail lowongan ini jadi CV yang lebih relevan.
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
              Gunakan CV Pintar untuk scoring ATS, keyword extractor, dan cover letter yang
              mengikuti konteks role ini.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
            <Button asChild size="lg">
              <Link to="/register">
                Buat CV dengan AI
                <Zap className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/panduan-cv-ats">
                Panduan CV ATS
                <BookOpen className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function ApplyPanel({ job, salaryText }: { job: Job; salaryText: string | null }) {
  const { user } = useAuth();
  const deadlineText = job.deadline ? formatShortDate(job.deadline) : null;
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cvs, setCvs] = useState<CvOption[]>([]);
  const [selectedCvId, setSelectedCvId] = useState("");
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<JobMatchResult | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setIsSaved(false);
      setCvs([]);
      setSelectedCvId("");
      return;
    }

    const userId = user.id;
    let active = true;

    async function loadSavedState() {
      const { data, error } = await savedJobListingsTable()
        .select("id")
        .eq("user_id", userId)
        .eq("job_listing_id", job.id)
        .maybeSingle();

      if (!active || error) return;
      setIsSaved(Boolean(data));
    }

    void loadSavedState();

    return () => {
      active = false;
    };
  }, [job.id, user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const userId = user.id;
    let active = true;

    async function loadCvs() {
      const { data, error } = await supabase
        .from("cvs")
        .select("id, title, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (!active || error) return;
      const rows = (data ?? []) as CvOption[];
      setCvs(rows);
      setSelectedCvId((current) => current || rows[0]?.id || "");
    }

    void loadCvs();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const toggleSavedJob = async () => {
    if (!user?.id || isSaving) return;

    const nextSaved = !isSaved;
    setIsSaving(true);
    setIsSaved(nextSaved);

    const { error } = nextSaved
      ? await savedJobListingsTable().insert({
          user_id: user.id,
          job_listing_id: job.id,
        })
      : await savedJobListingsTable().delete().eq("user_id", user.id).eq("job_listing_id", job.id);

    setIsSaving(false);

    if (error) {
      setIsSaved(!nextSaved);
      toast.error("Gagal memperbarui lowongan tersimpan.");
      return;
    }

    toast.success(nextSaved ? "Lowongan disimpan." : "Lowongan dihapus dari simpanan.");
  };

  const handleJobMatch = async () => {
    if (!selectedCvId || matching) return;

    setMatching(true);
    setMatchResult(null);

    try {
      const result = await matchCvToJob({
        data: {
          cvId: selectedCvId,
          jobId: job.id,
          language: "id",
        },
      });
      setMatchResult(result);
      toast.success("Job match score berhasil dibuat.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membuat job match score.");
    } finally {
      setMatching(false);
    }
  };

  return (
    <Card className="border-border/80 bg-card shadow-sm lg:sticky lg:top-24">
      <CardContent className="p-5">
        <div className="mb-5 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-xl font-bold text-foreground">{job.company}</p>
            <p className="mt-1 text-sm text-muted-foreground">{job.location}</p>
          </div>
        </div>

        <div className="space-y-3 rounded-lg bg-muted/60 p-4">
          <Fact icon={Clock} label="Diposting" value={formatShortDate(job.created_at)} />
          <Fact icon={Briefcase} label="Tipe" value={typeLabel(job.type)} />
          <Fact icon={GraduationCap} label="Level" value={levelLabel(job.level)} />
          <Fact
            icon={Laptop}
            label="Mode"
            value={job.work_mode ? workModeLabel(job.work_mode) : "Belum dicantumkan"}
          />
          <Fact icon={DollarSign} label="Gaji" value={salaryText || "Tidak dicantumkan"} />
          <Fact icon={CalendarDays} label="Deadline" value={deadlineText || "Tidak dicantumkan"} />
        </div>

        <div className="mt-5 rounded-lg border bg-background p-4">
          <div className="mb-3 flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">AI Job Match Score</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Cocokkan CV kamu dengan lowongan ini sebelum melamar.
              </p>
            </div>
          </div>

          {user ? (
            <div className="space-y-3">
              {cvs.length > 0 ? (
                <>
                  <Select value={selectedCvId} onValueChange={setSelectedCvId}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Pilih CV" />
                    </SelectTrigger>
                    <SelectContent>
                      {cvs.map((cv) => (
                        <SelectItem key={cv.id} value={cv.id}>
                          {cv.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    className="w-full justify-center gap-2"
                    disabled={!selectedCvId || matching}
                    onClick={handleJobMatch}
                  >
                    {matching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {matching ? "Menganalisis..." : "Cek kecocokan CV"}
                  </Button>
                </>
              ) : (
                <div className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
                  Kamu belum punya CV. Buat CV dulu untuk memakai Job Match Score.
                </div>
              )}

              {matchResult && <JobMatchResultCard result={matchResult} />}
            </div>
          ) : (
            <Button asChild variant="outline" className="w-full justify-center gap-2">
              <Link to="/login" search={{ redirect: `/lowongan/${job.slug}` }}>
                <LogIn className="h-4 w-4" />
                Masuk untuk cek match
              </Link>
            </Button>
          )}
        </div>

        <div className="mt-5 grid gap-3">
          {job.source_url && (
            <Button asChild className="w-full justify-center gap-2">
              <a href={job.source_url} target="_blank" rel="noopener noreferrer">
                Lihat sumber lowongan
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
          {user ? (
            <Button
              type="button"
              variant={isSaved ? "default" : "outline"}
              className="w-full justify-center gap-2"
              disabled={isSaving}
              onClick={toggleSavedJob}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSaved ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
              {isSaved ? "Lowongan tersimpan" : "Simpan lowongan"}
            </Button>
          ) : (
            <Button asChild variant="outline" className="w-full justify-center gap-2">
              <Link to="/login" search={{ redirect: `/lowongan/${job.slug}` }}>
                <LogIn className="h-4 w-4" />
                Masuk untuk simpan
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" className="w-full justify-center gap-2">
            <Link to="/register">
              Siapkan CV
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          CV Pintar menampilkan lowongan sebagai referensi. Selalu cek detail terbaru di sumber asli
          sebelum melamar.
        </p>
      </CardContent>
    </Card>
  );
}

function JobMatchResultCard({ result }: { result: JobMatchResult }) {
  const tone = matchTone(result.matchScore);

  return (
    <div className="space-y-4 rounded-lg border bg-muted/35 p-4">
      <div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Match score</p>
            <p className={`font-display text-4xl font-bold ${tone.text}`}>{result.matchScore}%</p>
          </div>
          <Badge className={tone.badge}>{verdictLabel(result.verdict)}</Badge>
        </div>
        <Progress value={result.matchScore} className="mt-3 h-2" />
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{result.summary}</p>
      </div>

      <MatchList title="Keyword yang sudah match" items={result.matchedKeywords} tone="match" />
      <MatchList title="Keyword yang perlu diperkuat" items={result.missingKeywords} tone="gap" />
      <MatchList title="Rekomendasi cepat" items={result.recommendations.slice(0, 4)} />

      {result.cvChanges.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Perubahan CV yang disarankan
          </p>
          {result.cvChanges.slice(0, 3).map((change) => (
            <div
              key={`${change.section}-${change.suggestedChange}`}
              className="rounded-lg bg-card p-3"
            >
              <p className="text-sm font-semibold text-foreground">{change.section}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {change.suggestedChange}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MatchList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone?: "match" | "gap";
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.slice(0, 8).map((item) => (
          <Badge
            key={item}
            variant="secondary"
            className={
              tone === "match"
                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                : tone === "gap"
                  ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                  : ""
            }
          >
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function ContentCard({
  icon: Icon,
  eyebrow,
  title,
  fallback,
  children,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  fallback: string;
  children: ReactNode;
}) {
  return (
    <Card className="border-border/80 bg-background shadow-sm">
      <CardContent className="p-5 md:p-6">
        <div className="mb-5 flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-primary">{eyebrow}</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-foreground">{title}</h2>
          </div>
        </div>
        {children || <p className="leading-7 text-muted-foreground">{fallback}</p>}
      </CardContent>
    </Card>
  );
}

function Checklist({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="leading-7 text-muted-foreground">Belum tersedia dari sumber asli.</p>;
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 rounded-lg bg-muted/60 p-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <span className="text-sm font-medium leading-6 text-foreground">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Fact({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="min-w-20 text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function parseParagraphs(value?: string | null) {
  return String(value || "")
    .split(/\n{2,}|(?<=\.)\s+(?=[A-Z0-9A-Z])/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function parseList(value?: string | null) {
  return String(value || "")
    .split(/\n|;|(?:^|\s)[*-]\s+/)
    .map((item) =>
      item
        .replace(/^[0-9]+[.)]\s*/, "")
        .replace(/^[*-]\s*/, "")
        .trim(),
    )
    .filter((item) => item.length > 2)
    .slice(0, 12);
}

function parseInlineList(value?: string | null) {
  return String(value || "")
    .split(/,|\n|;/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 16);
}

function typeLabel(type: string) {
  const map: Record<string, string> = {
    "full-time": "Full Time",
    "part-time": "Part Time",
    contract: "Kontrak",
    internship: "Magang",
  };
  return map[type] ?? type;
}

function levelLabel(level: string) {
  const map: Record<string, string> = {
    entry: "Entry Level",
    mid: "Mid Level",
    senior: "Senior",
    manager: "Manager",
    director: "Director",
  };
  return map[level] ?? level;
}

function verdictLabel(value: JobMatchResult["verdict"]) {
  const map: Record<JobMatchResult["verdict"], string> = {
    strong: "Sangat cocok",
    good: "Cocok",
    medium: "Perlu dipoles",
    low: "Kurang cocok",
  };
  return map[value];
}

function matchTone(score: number) {
  if (score >= 80) {
    return {
      text: "text-emerald-700",
      badge: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
    };
  }
  if (score >= 60) {
    return {
      text: "text-primary",
      badge: "bg-primary/10 text-primary hover:bg-primary/10",
    };
  }
  if (score >= 40) {
    return {
      text: "text-amber-700",
      badge: "bg-amber-100 text-amber-800 hover:bg-amber-100",
    };
  }
  return {
    text: "text-red-700",
    badge: "bg-red-100 text-red-800 hover:bg-red-100",
  };
}

function formatSalary(
  min?: number | null,
  max?: number | null,
  currency = "IDR",
  period?: string | null,
) {
  if (!min && !max) return null;
  const prefix = currency && currency !== "IDR" ? currency : "Rp";
  const suffix = period === "yearly" ? "/tahun" : "/bulan";
  const fmt = (value: number) => {
    if (currency && currency !== "IDR") {
      return `${prefix} ${new Intl.NumberFormat("id-ID").format(value)}`;
    }
    if (value >= 1000000) return `${prefix} ${(value / 1000000).toFixed(0)}jt`;
    return `${prefix} ${(value / 1000).toFixed(0)}rb`;
  };
  if (min && max) return `${fmt(min)} - ${fmt(max)} ${suffix}`;
  if (min) return `Mulai ${fmt(min)} ${suffix}`;
  return `Hingga ${fmt(max ?? 0)} ${suffix}`;
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

function formatLongDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function workModeLabel(value: string) {
  const map: Record<string, string> = {
    onsite: "On-site",
    remote: "Remote",
    hybrid: "Hybrid",
  };
  return map[value] ?? value;
}
