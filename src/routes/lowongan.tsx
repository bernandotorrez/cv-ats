import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHero } from "@/components/site/PageHero";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton-loading";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Briefcase,
  Building2,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  GraduationCap,
  MapPin,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/lowongan")({
  head: () =>
    buildSeo({
      title: "Lowongan Pekerjaan - CV Pintar",
      description:
        "Temukan lowongan kerja terbaru dan cari peluang dari LinkedIn, JobStreet, Glints, Kalibrr, dan Google Jobs.",
      path: "/lowongan",
      keywords: "lowongan kerja, loker, job indonesia, cari kerja, lowongan terbaru",
    }),
  component: LowonganPage,
});

interface Job {
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
  description: string;
  source_url?: string | null;
  created_at: string;
}

interface SearchSource {
  name: string;
  description: string;
  url: string;
}

const typeOptions = ["Semua Tipe", "full-time", "part-time", "contract", "internship"];
const levelOptions = ["Semua Level", "entry", "mid", "senior", "manager", "director"];
const locationOptions = [
  "Semua Lokasi",
  "Jakarta",
  "Bandung",
  "Surabaya",
  "Medan",
  "Yogyakarta",
  "Remote",
];

const fallbackJobs: Job[] = [
  {
    id: "fallback-product-analyst",
    slug: "product-analyst-remote",
    title: "Product Analyst",
    company: "Startup Digital Indonesia",
    location: "Remote",
    type: "full-time",
    level: "mid",
    industry: "Teknologi",
    salary_min: 8000000,
    salary_max: 14000000,
    description:
      "Menganalisis funnel produk, membuat dashboard metrik, dan bekerja sama dengan product manager untuk meningkatkan aktivasi pengguna.",
    source_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-admin-finance",
    slug: "admin-finance-jakarta",
    title: "Admin Finance",
    company: "Perusahaan Retail Nasional",
    location: "Jakarta",
    type: "full-time",
    level: "entry",
    industry: "Finance",
    salary_min: 4500000,
    salary_max: 7000000,
    description:
      "Mengelola invoice, rekonsiliasi sederhana, arsip transaksi, dan koordinasi pembayaran vendor.",
    source_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-social-media",
    slug: "social-media-specialist-bandung",
    title: "Social Media Specialist",
    company: "Creative Agency Bandung",
    location: "Bandung",
    type: "contract",
    level: "entry",
    industry: "Marketing",
    salary_min: 5000000,
    salary_max: 9000000,
    description:
      "Menyusun content calendar, membuat brief visual, membaca performa konten, dan mengelola komunitas brand.",
    source_url: null,
    created_at: new Date().toISOString(),
  },
];

function LowonganPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Semua Tipe");
  const [levelFilter, setLevelFilter] = useState("Semua Level");
  const [locationFilter, setLocationFilter] = useState("Semua Lokasi");
  const [aiRole, setAiRole] = useState("");
  const [aiLocation, setAiLocation] = useState("Indonesia");

  useEffect(() => {
    void loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("job_listings")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      const rows = (data as unknown as Job[]) ?? [];
      setJobs(rows.length > 0 ? rows : fallbackJobs);
    } catch {
      setJobs(fallbackJobs);
    } finally {
      setLoading(false);
    }
  };

  const filtered = jobs.filter((job) => {
    const term = search.toLowerCase();
    const matchSearch =
      !term ||
      job.title.toLowerCase().includes(term) ||
      job.company.toLowerCase().includes(term) ||
      job.industry?.toLowerCase().includes(term);
    const matchType = typeFilter === "Semua Tipe" || job.type === typeFilter;
    const matchLevel = levelFilter === "Semua Level" || job.level === levelFilter;
    const matchLocation =
      locationFilter === "Semua Lokasi" ||
      (locationFilter === "Remote"
        ? job.location.toLowerCase().includes("remote")
        : job.location.includes(locationFilter));

    return matchSearch && matchType && matchLevel && matchLocation;
  });

  const smartSources = useMemo(
    () => buildSearchSources(aiRole || search || "lowongan kerja", aiLocation),
    [aiLocation, aiRole, search],
  );

  return (
    <div>
      <PageHero
        title="Lowongan Pekerjaan"
        description="Cari peluang dari database CV Pintar atau buka pencarian lintas platform dengan query yang lebih rapi."
      />

      <div className="container-page space-y-8 py-8">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <Badge className="gap-1.5 bg-info text-info-foreground hover:bg-info">
                <Bot className="h-3.5 w-3.5" />
                Asisten pencarian
              </Badge>
              <h2 className="mt-3 font-display text-2xl font-bold text-foreground">
                Cari lowongan di banyak platform tanpa mengetik ulang.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Masukkan posisi dan lokasi. Kami susun query pencarian untuk LinkedIn, JobStreet,
                Glints, Kalibrr, dan Google Jobs.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
                <Input
                  value={aiRole}
                  onChange={(event) => setAiRole(event.target.value)}
                  placeholder="Contoh: Frontend Developer, HR Officer"
                />
                <Input
                  value={aiLocation}
                  onChange={(event) => setAiLocation(event.target.value)}
                  placeholder="Lokasi"
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {smartSources.map((source) => (
                  <Button key={source.name} asChild variant="outline" className="justify-between">
                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                      <span>{source.name}</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <section>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari posisi, perusahaan, atau industri..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === "Semua Tipe" ? type : typeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {levelOptions.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level === "Semua Level" ? level : levelLabel(level)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locationOptions.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="grid gap-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-32" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Tidak ada lowongan</h3>
              <p className="mt-1 text-sm text-muted-foreground">Coba ubah filter pencarian.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filtered.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>

        <section>
          <Card className="border-0 bg-primary text-primary-foreground">
            <CardContent className="p-8 text-center md:p-12">
              <div className="mx-auto mb-6 w-fit rounded-full bg-primary-foreground/15 p-4">
                <Sparkles className="h-12 w-12" />
              </div>
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                Siapkan CV sebelum klik lamar.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-primary-foreground/85 md:text-base">
                AI CV Pintar membantu menyusun keyword, merapikan struktur, dan memberi skor ATS
                sebelum kamu kirim lamaran.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" variant="secondary" className="gap-2">
                  <Link to="/cv">
                    <Zap className="h-5 w-5" />
                    Buat CV dengan AI
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="gap-2 bg-transparent">
                  <Link to="/template">
                    <BookOpen className="h-5 w-5" />
                    Lihat Template
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  const salaryText = formatSalary(job.salary_min, job.salary_max);
  const isFallback = job.id.startsWith("fallback-");

  const content = (
    <Card className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold transition-colors group-hover:text-primary">
                {job.title}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {typeLabel(job.type)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {levelLabel(job.level)}
              </Badge>
              {isFallback && (
                <Badge variant="outline" className="text-xs">
                  Contoh
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" /> {job.company}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {job.location}
              </span>
              {salaryText && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" /> {salaryText}
                </span>
              )}
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
              <Clock className="h-3 w-3" />
              {new Date(job.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              })}
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isFallback) {
    return (
      <a
        className="group block"
        href={buildSearchSources(job.title, job.location)[4].url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }

  return (
    <Link className="group block" to="/lowongan/$slug" params={{ slug: job.slug }}>
      {content}
    </Link>
  );
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

function formatSalary(min?: number | null, max?: number | null) {
  if (!min && !max) return null;
  const fmt = (value: number) => {
    if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(0)}jt`;
    return `Rp ${(value / 1000).toFixed(0)}rb`;
  };
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `Mulai ${fmt(min)}`;
  return `Hingga ${fmt(max ?? 0)}`;
}

function buildSearchSources(role: string, location: string): SearchSource[] {
  const cleanRole = role.trim() || "lowongan kerja";
  const cleanLocation = location.trim() || "Indonesia";
  const query = `${cleanRole} ${cleanLocation}`;
  const encoded = encodeURIComponent(query);
  const googleQuery = encodeURIComponent(`${query} lowongan kerja`);

  return [
    {
      name: "LinkedIn",
      description: "Cari di LinkedIn Jobs",
      url: `https://www.linkedin.com/jobs/search/?keywords=${encoded}&location=${encodeURIComponent(cleanLocation)}`,
    },
    {
      name: "JobStreet",
      description: "Cari di JobStreet",
      url: `https://www.jobstreet.co.id/id/job-search/${encoded}-jobs/`,
    },
    {
      name: "Glints",
      description: "Cari di Glints",
      url: `https://glints.com/id/opportunities/jobs/explore?keyword=${encoded}`,
    },
    {
      name: "Kalibrr",
      description: "Cari di Kalibrr",
      url: `https://www.kalibrr.com/job-board/te/${encoded}`,
    },
    {
      name: "Google Jobs",
      description: "Cari lewat Google",
      url: `https://www.google.com/search?q=${googleQuery}`,
    },
  ];
}
