import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ErrorState } from "@/components/site/ErrorState";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { buildSeo, fitDescription, pickTitle, stripMarkdown } from "@/lib/seo";
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
  BriefcaseBusiness,
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
  posted_at?: string | null;
  expires_at?: string | null;
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
  return (supabase as any).from("saved_job_listings") as unknown as SavedJobListingsQuery;
}

export const Route = createFileRoute("/lowongan/$slug")({
  loader: async ({ params }) => {
    const jobListings = (supabase as any).from("job_listings") as unknown as JobListingsQuery;
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
      title: pickTitle([
        `Lowongan ${loaderData.title} di ${loaderData.company}`,
        `${loaderData.title} di ${loaderData.company}`,
        `Lowongan ${loaderData.title}`,
        loaderData.title,
      ]),
      // Dibuat dari data terstruktur (bukan teks hasil scraping yang sering berantakan)
      description: jobMetaDescription(loaderData),
      path: `/lowongan/${loaderData.slug}`,
      keywords: `lowongan ${loaderData.title}, loker ${loaderData.company}, kerja ${loaderData.location}`,
      jsonLd: buildJobPostingJsonLd(loaderData),
    });
  },
  component: LowonganDetailPage,
  notFoundComponent: () => (
    <ErrorState
      code="404"
      icon={BriefcaseBusiness}
      eyebrow="Lowongan tidak ditemukan"
      title="Lowongan ini sudah tidak aktif."
      description="Posisinya mungkin sudah terisi atau masa tayangnya habis. Masih ada lowongan lain yang bisa kamu lamar."
      primary={{ label: "Lihat Semua Lowongan", to: "/lowongan" }}
      secondary={{ label: "Ke Beranda", to: "/" }}
    />
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
    job.salary_min ?? undefined,
    job.salary_max ?? undefined,
    job.salary_currency ?? undefined,
    job.salary_period ?? undefined,
  );
  const postedDate = new Date(job.posted_at || job.created_at).toLocaleDateString("id-ID", {
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
      <div className="container-page py-8 md:py-10">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/lowongan">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Lowongan
          </Link>
        </Button>

        {/* Mobile: header → isi lowongan → panel lamar. Desktop: panel lamar sticky di
            kanan, isi lowongan langsung di bawah judul tanpa perlu scroll. */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <header className="lg:col-start-1 lg:row-start-1">
            <h1 className="max-w-4xl font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
              {job.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-base text-muted-foreground">
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
                Diposting {postedDate}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                {levelLabel(job.level)}
              </Badge>
              <Badge variant="secondary">{typeLabel(job.type)}</Badge>
              {job.work_mode && <Badge variant="outline">{workModeLabel(job.work_mode)}</Badge>}
              {job.industry && <Badge variant="outline">{job.industry}</Badge>}
              {salaryText && <Badge variant="outline">{salaryText}</Badge>}
              {deadlineText && <Badge variant="outline">Deadline {deadlineText}</Badge>}
            </div>
          </header>

          <div className="min-w-0 space-y-5 lg:col-start-1 lg:row-start-2">
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
              ) : null}
            </ContentCard>

            {responsibilityItems.length > 0 && (
              <ContentCard
                icon={ListChecks}
                eyebrow="Tanggung jawab"
                title="Responsibilities"
                fallback=""
              >
                <Checklist items={responsibilityItems} />
              </ContentCard>
            )}

            {requirementItems.length > 0 && (
              <ContentCard
                icon={ShieldCheck}
                eyebrow="Yang perlu disiapkan"
                title="Job requirements"
                fallback=""
              >
                <Checklist items={requirementItems} />
              </ContentCard>
            )}

            {qualificationItems.length > 0 && (
              <ContentCard
                icon={BadgeCheck}
                eyebrow="Kualifikasi kandidat"
                title="Skill dan kualifikasi"
                fallback=""
              >
                <Checklist items={qualificationItems} />
              </ContentCard>
            )}

            {benefitItems.length > 0 && (
              <ContentCard icon={Gift} eyebrow="Benefit" title="Fasilitas dan benefit" fallback="">
                <Checklist items={benefitItems} />
              </ContentCard>
            )}

            {techItems.length > 0 && (
              <ContentCard icon={Laptop} eyebrow="Tools" title="Tech stack dan tools" fallback="">
                <div className="flex flex-wrap gap-2">
                  {techItems.map((item) => (
                    <Badge key={item} variant="secondary" className="px-3 py-1.5">
                      {item}
                    </Badge>
                  ))}
                </div>
              </ContentCard>
            )}

            <Card className="border-border/80 bg-muted/45 shadow-sm">
              <CardContent className="p-5 md:p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Lightbulb className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    Sebelum klik lamar
                  </h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {prepCards.map((item) => (
                    <div key={item.title} className="rounded-lg border bg-card p-4">
                      <item.icon className="mb-2 h-5 w-5 text-primary" aria-hidden="true" />
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <ApplyPanel job={job} salaryText={salaryText} />
          </div>
        </div>
      </div>

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
          <Fact
            icon={Clock}
            label="Diposting"
            value={formatShortDate(job.posted_at || job.created_at)}
          />
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

/** Pisah per baris kosong; blok panjang tanpa jeda dipecah tiap ~3 kalimat agar enak dibaca. */
function parseParagraphs(value?: string | null) {
  return String(value || "")
    .split(/\n{2,}|\n(?=\S)/)
    .map((block) => block.trim())
    .filter(Boolean)
    .flatMap((block) => {
      if (block.length < 450) return [block];
      const sentences = block.split(/(?<=[.!?])\s+(?=[A-Z0-9])/);
      const chunks: string[] = [];
      for (let i = 0; i < sentences.length; i += 3)
        chunks.push(sentences.slice(i, i + 3).join(" "));
      return chunks;
    });
}

function parseList(value?: string | null) {
  return String(value || "")
    .split(/\n|;/)
    .filter((item) => !/^\s*#{1,6}\s/.test(item))
    .map((item) => item.replace(/^\s*(?:[-*•]\s+|\d{1,2}[.)]\s+)/, "").trim())
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

/** Deskripsi meta dari data terstruktur; buang kalimat dari belakang bila melebihi 160 karakter. */
function jobMetaDescription(job: Job) {
  const facts = [
    typeLabel(job.type),
    levelLabel(job.level),
    formatSalary(
      job.salary_min,
      job.salary_max,
      job.salary_currency ?? undefined,
      job.salary_period,
    ),
  ]
    .filter(Boolean)
    .join(" · ");
  const sentences = [
    `Lowongan ${job.title} di ${job.company}, ${job.location}.`,
    `${facts}.`,
    "Lihat persyaratan dan lamar dengan CV ATS dari CV Pintar.",
  ];
  while (sentences.length > 1 && sentences.join(" ").length > 160) sentences.pop();
  return fitDescription(sentences.join(" "), 160);
}

const EMPLOYMENT_TYPE: Record<string, string> = {
  "full-time": "FULL_TIME",
  "part-time": "PART_TIME",
  contract: "CONTRACTOR",
  internship: "INTERN",
};

const CITY_REGION: Record<string, string> = {
  jakarta: "DKI Jakarta",
  "jakarta selatan": "DKI Jakarta",
  "jakarta utara": "DKI Jakarta",
  "jakarta barat": "DKI Jakarta",
  "jakarta timur": "DKI Jakarta",
  "jakarta pusat": "DKI Jakarta",
  "south jakarta": "DKI Jakarta",
  "north jakarta": "DKI Jakarta",
  "west jakarta": "DKI Jakarta",
  "east jakarta": "DKI Jakarta",
  "central jakarta": "DKI Jakarta",
  "greater jakarta": "DKI Jakarta",
  bandung: "Jawa Barat",
  bekasi: "Jawa Barat",
  bogor: "Jawa Barat",
  depok: "Jawa Barat",
  cikarang: "Jawa Barat",
  karawang: "Jawa Barat",
  cimahi: "Jawa Barat",
  cirebon: "Jawa Barat",
  sukabumi: "Jawa Barat",
  tasikmalaya: "Jawa Barat",
  tangerang: "Banten",
  "tangerang selatan": "Banten",
  serang: "Banten",
  cilegon: "Banten",
  surabaya: "Jawa Timur",
  malang: "Jawa Timur",
  sidoarjo: "Jawa Timur",
  gresik: "Jawa Timur",
  kediri: "Jawa Timur",
  pasuruan: "Jawa Timur",
  mojokerto: "Jawa Timur",
  jember: "Jawa Timur",
  semarang: "Jawa Tengah",
  solo: "Jawa Tengah",
  surakarta: "Jawa Tengah",
  magelang: "Jawa Tengah",
  kudus: "Jawa Tengah",
  pekalongan: "Jawa Tengah",
  tegal: "Jawa Tengah",
  purwokerto: "Jawa Tengah",
  yogyakarta: "DI Yogyakarta",
  jogja: "DI Yogyakarta",
  sleman: "DI Yogyakarta",
  bantul: "DI Yogyakarta",
  denpasar: "Bali",
  badung: "Bali",
  gianyar: "Bali",
  medan: "Sumatera Utara",
  palembang: "Sumatera Selatan",
  pekanbaru: "Riau",
  batam: "Kepulauan Riau",
  padang: "Sumatera Barat",
  "bandar lampung": "Lampung",
  makassar: "Sulawesi Selatan",
  manado: "Sulawesi Utara",
  balikpapan: "Kalimantan Timur",
  samarinda: "Kalimantan Timur",
  banjarmasin: "Kalimantan Selatan",
  pontianak: "Kalimantan Barat",
};

/**
 * "Bandung, Jawa Barat" → locality Bandung, region Jawa Barat. Kalau provinsi
 * tidak tertulis, ditebak dari daftar kota besar. "Remote"/"Indonesia" hanya negara.
 */
function buildPostalAddress(location: string) {
  const parts = location
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part && !/^(indonesia|remote)$/i.test(part));
  const locality = parts[0];
  const cityKey = (locality || "")
    .toLowerCase()
    .replace(/^(kota|kabupaten|kab\.?)\s+/, "")
    .trim();
  const region = parts[1] || CITY_REGION[cityKey];

  return {
    "@type": "PostalAddress",
    ...(locality ? { addressLocality: locality } : {}),
    ...(region ? { addressRegion: region } : {}),
    addressCountry: "ID",
  };
}

/** JobPosting JSON-LD selengkap mungkin untuk Google Jobs. */
function buildJobPostingJsonLd(job: Job) {
  const description = stripMarkdown(
    [job.description, job.responsibilities, job.requirements].filter(Boolean).join(". "),
  );
  const isRemote = job.work_mode === "remote";
  const hasSalary = Boolean(job.salary_min || job.salary_max);
  // deadline berformat YYYY-MM-DD → ISO dengan akhir hari (zona Jakarta);
  // tanpa deadline pakai expires_at agar Google Jobs tahu kapan lowongan berakhir.
  // Lowongan manual tanpa keduanya: anggap berlaku 60 hari sejak diposting.
  const validThrough = job.deadline
    ? `${job.deadline.slice(0, 10)}T23:59:59+07:00`
    : job.expires_at ||
      new Date(new Date(job.posted_at || job.created_at).getTime() + 60 * 86_400_000).toISOString();
  const address = buildPostalAddress(job.location);

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: description || `Lowongan ${job.title} di ${job.company}, ${job.location}.`,
    datePosted: job.posted_at || job.created_at,
    validThrough,
    employmentType: EMPLOYMENT_TYPE[job.type] ?? "FULL_TIME",
    directApply: false,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      ...(job.company_logo ? { logo: job.company_logo } : {}),
    },
    // streetAddress & postalCode tidak diisi: sumber lowongan jarang mencantumkannya
    // dan Google hanya menandainya sebagai rekomendasi, bukan error.
    jobLocation: {
      "@type": "Place",
      address: address,
    },
    ...(isRemote
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: { "@type": "Country", name: "ID" },
        }
      : {}),
    ...(hasSalary
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: job.salary_currency || "IDR",
            value: {
              "@type": "QuantitativeValue",
              ...(job.salary_min ? { minValue: job.salary_min } : {}),
              ...(job.salary_max ? { maxValue: job.salary_max } : {}),
              unitText: job.salary_period === "yearly" ? "YEAR" : "MONTH",
            },
          },
        }
      : {}),
  };
}

function workModeLabel(value: string) {
  const map: Record<string, string> = {
    onsite: "On-site",
    remote: "Remote",
    hybrid: "Hybrid",
  };
  return map[value] ?? value;
}
