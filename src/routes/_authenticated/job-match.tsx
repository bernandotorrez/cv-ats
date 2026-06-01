import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BriefcaseBusiness,
  FileText,
  Link2,
  Loader2,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { matchCvToJob, type JobMatchResult } from "@/lib/ai-functions";
import { useAuth } from "@/lib/auth-context";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/job-match")({
  head: () =>
    buildSeo({
      title: "AI Job Match Score - CV Pintar",
      description: "Cocokkan CV dengan lowongan dari database, URL, atau job description manual.",
      path: "/job-match",
      noindex: true,
    }),
  component: JobMatchPage,
});

type MatchMode = "database" | "url" | "manual";

interface CvOption {
  id: string;
  title: string;
}

interface JobOption {
  id: string;
  title: string;
  company: string;
  location: string;
  level: string;
}

function JobMatchPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<MatchMode>("database");
  const [cvs, setCvs] = useState<CvOption[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [selectedCvId, setSelectedCvId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [search, setSearch] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [matching, setMatching] = useState(false);
  const [result, setResult] = useState<JobMatchResult | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    void loadCvs(user.id);
    void loadJobs();
  }, [user?.id]);

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((job) =>
      `${job.title} ${job.company} ${job.location}`.toLowerCase().includes(q),
    );
  }, [jobs, search]);

  const loadCvs = async (userId: string) => {
    const { data, error } = await supabase
      .from("cvs")
      .select("id, title")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) return;
    const rows = (data ?? []) as CvOption[];
    setCvs(rows);
    setSelectedCvId((current) => current || rows[0]?.id || "");
  };

  const loadJobs = async () => {
    const { data, error } = await supabase
      .from("job_listings")
      .select("id, title, company, location, level")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(80);

    if (error) return;
    const rows = (data ?? []) as JobOption[];
    setJobs(rows);
    setSelectedJobId((current) => current || rows[0]?.id || "");
  };

  const canSubmit =
    Boolean(selectedCvId) &&
    ((mode === "database" && Boolean(selectedJobId)) ||
      (mode === "url" && Boolean(jobUrl.trim())) ||
      (mode === "manual" && Boolean(jobDescription.trim())));

  const handleMatch = async () => {
    if (!canSubmit || matching) return;

    setMatching(true);
    setResult(null);

    try {
      const nextResult = await matchCvToJob({
        data: {
          cvId: selectedCvId,
          jobId: mode === "database" ? selectedJobId : undefined,
          jobUrl: mode === "url" ? jobUrl.trim() : undefined,
          jobDescription: mode === "manual" ? jobDescription.trim() : undefined,
          jobTitle: jobTitle.trim() || undefined,
          companyName: companyName.trim() || undefined,
          language: "id",
        },
      });
      setResult(nextResult);
      toast.success("AI Job Match Score berhasil dibuat.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membuat job match score.");
    } finally {
      setMatching(false);
    }
  };

  return (
    <div className="container-page space-y-6 py-5 md:py-8">
      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="grid gap-6 p-5 md:p-7 lg:grid-cols-[1fr_0.7fr] lg:items-center">
          <div>
            <Badge className="gap-2 bg-primary/10 text-primary hover:bg-primary/10">
              <Sparkles className="h-3.5 w-3.5" />
              AI Job Match Score
            </Badge>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-normal sm:text-4xl">
              Cocokkan CV dengan lowongan sebelum apply.
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
              Pilih CV, pilih lowongan dari database CV Pintar, paste URL, atau paste job
              description manual. AI akan memberi skor kecocokan, keyword gap, dan perubahan CV yang
              paling berdampak.
            </p>
          </div>
          <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-emerald-50 to-sky-50 p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-white text-primary shadow-sm">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold">Starter: 20x/bulan</p>
                <p className="text-sm text-muted-foreground">Pro: 100x/bulan</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        <Card>
          <CardContent className="space-y-5 p-5 md:p-6">
            <div className="grid gap-2">
              <Label>Pilih CV</Label>
              {cvs.length > 0 ? (
                <Select value={selectedCvId} onValueChange={setSelectedCvId}>
                  <SelectTrigger>
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
              ) : (
                <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                  Kamu belum punya CV.{" "}
                  <Link to="/cv" className="font-semibold text-primary underline">
                    Buat CV dulu
                  </Link>
                  .
                </div>
              )}
            </div>

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
                  className="h-auto flex-col gap-1 py-3 text-xs"
                  onClick={() => {
                    setMode(value as MatchMode);
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
                    className="pl-9"
                  />
                </div>
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger>
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
              </div>
            )}

            {mode === "url" && (
              <div className="space-y-4">
                <Field
                  label="URL lowongan"
                  value={jobUrl}
                  onChange={setJobUrl}
                  placeholder="https://..."
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Posisi" value={jobTitle} onChange={setJobTitle} />
                  <Field label="Perusahaan" value={companyName} onChange={setCompanyName} />
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  Jika situs memblokir scraping, paste job description manual sebagai fallback.
                </p>
              </div>
            )}

            {mode === "manual" && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Posisi" value={jobTitle} onChange={setJobTitle} />
                  <Field label="Perusahaan" value={companyName} onChange={setCompanyName} />
                </div>
                <div className="grid gap-2">
                  <Label>Job description</Label>
                  <Textarea
                    value={jobDescription}
                    onChange={(event) => setJobDescription(event.target.value)}
                    placeholder="Paste deskripsi pekerjaan, requirement, skill, dan tanggung jawab..."
                    className="min-h-56"
                  />
                </div>
              </div>
            )}

            <Button
              type="button"
              size="lg"
              className="w-full gap-2"
              disabled={!canSubmit || matching}
              onClick={handleMatch}
            >
              {matching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {matching ? "Menganalisis..." : "Cek Job Match Score"}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:sticky lg:top-24">
          <CardContent className="p-5 md:p-6">
            {result ? (
              <JobMatchResultView result={result} />
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h2 className="mt-4 font-display text-xl font-bold">Belum ada hasil</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Pilih CV dan sumber lowongan, lalu jalankan AI Job Match Score.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function JobMatchResultView({ result }: { result: JobMatchResult }) {
  const tone = matchTone(result.matchScore);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Match score</p>
            <p className={`font-display text-5xl font-bold ${tone.text}`}>{result.matchScore}%</p>
          </div>
          <Badge className={tone.badge}>{verdictLabel(result.verdict)}</Badge>
        </div>
        <Progress value={result.matchScore} className="mt-4 h-2" />
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{result.summary}</p>
      </div>

      <ResultList title="Keyword match" items={result.matchedKeywords} tone="match" />
      <ResultList title="Keyword gap" items={result.missingKeywords} tone="gap" />
      <ResultList title="Rekomendasi" items={result.recommendations} />

      {result.cvChanges.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Action plan CV</p>
          {result.cvChanges.map((change) => (
            <div
              key={`${change.section}-${change.suggestedChange}`}
              className="rounded-lg border p-3"
            >
              <p className="text-sm font-semibold">{change.section}</p>
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

function ResultList({
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
        {items.slice(0, 10).map((item) => (
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
