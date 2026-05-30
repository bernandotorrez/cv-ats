import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton-loading";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Bot,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  DollarSign,
  ExternalLink,
  FileText,
  Filter,
  GraduationCap,
  Layers3,
  Laptop,
  MapPin,
  MousePointerClick,
  Search,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Wand2,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/lowongan")({
  head: () =>
    buildSeo({
      title: "Lowongan Pekerjaan - CV Pintar",
      description:
        "Temukan lowongan kerja terbaru, filter peluang yang relevan, dan siapkan CV ATS sebelum melamar.",
      path: "/lowongan",
      keywords: "lowongan kerja, loker, job indonesia, cari kerja, lowongan terbaru",
    }),
  component: LowonganRoute,
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
  salary_currency?: string | null;
  salary_period?: string | null;
  description: string;
  responsibilities?: string | null;
  benefits?: string | null;
  tech_stack?: string | null;
  work_mode?: string | null;
  deadline?: string | null;
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
const JOBS_PER_PAGE = 10;
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
    salary_currency: "IDR",
    salary_period: "monthly",
    description:
      "Menganalisis funnel produk, membuat dashboard metrik, dan bekerja sama dengan product manager untuk meningkatkan aktivasi pengguna.",
    tech_stack: "SQL, Dashboard, Product Analytics",
    work_mode: "remote",
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
    salary_currency: "IDR",
    salary_period: "monthly",
    description:
      "Mengelola invoice, rekonsiliasi sederhana, arsip transaksi, dan koordinasi pembayaran vendor.",
    work_mode: "onsite",
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
    salary_currency: "IDR",
    salary_period: "monthly",
    description:
      "Menyusun content calendar, membuat brief visual, membaca performa konten, dan mengelola komunitas brand.",
    tech_stack: "Content Calendar, Meta Business Suite, Analytics",
    work_mode: "hybrid",
    source_url: null,
    created_at: new Date().toISOString(),
  },
];

const playbook = [
  {
    icon: Target,
    title: "Pilih target role",
    desc: "Cari dari posisi, perusahaan, lokasi, atau industri yang paling nyambung dengan arah kariermu.",
  },
  {
    icon: Wand2,
    title: "Baca kebutuhan",
    desc: "Ambil keyword dari deskripsi lowongan, lalu cocokkan dengan pengalaman dan skill di CV.",
  },
  {
    icon: Send,
    title: "Lamar lebih siap",
    desc: "Buka detail lowongan, cek sumber asli, lalu siapkan CV ATS sebelum kirim aplikasi.",
  },
] as const;

function LowonganRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (pathname !== "/lowongan" && pathname !== "/lowongan/") {
    return <Outlet />;
  }

  return <LowonganPage />;
}

function LowonganPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Semua Tipe");
  const [levelFilter, setLevelFilter] = useState("Semua Level");
  const [locationFilter, setLocationFilter] = useState("Semua Lokasi");
  const [aiRole, setAiRole] = useState("");
  const [aiLocation, setAiLocation] = useState("Indonesia");
  const [currentPage, setCurrentPage] = useState(1);

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
      job.location.toLowerCase().includes(term) ||
      job.industry?.toLowerCase().includes(term) ||
      job.tech_stack?.toLowerCase().includes(term) ||
      job.work_mode?.toLowerCase().includes(term) ||
      job.benefits?.toLowerCase().includes(term);
    const matchType = typeFilter === "Semua Tipe" || job.type === typeFilter;
    const matchLevel = levelFilter === "Semua Level" || job.level === levelFilter;
    const matchLocation =
      locationFilter === "Semua Lokasi" ||
      (locationFilter === "Remote"
        ? job.location.toLowerCase().includes("remote")
        : job.location.toLowerCase().includes(locationFilter.toLowerCase()));

    return matchSearch && matchType && matchLevel && matchLocation;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / JOBS_PER_PAGE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedJobs = filtered.slice(
    (currentPageSafe - 1) * JOBS_PER_PAGE,
    currentPageSafe * JOBS_PER_PAGE,
  );
  const pageItems = buildPageItems(currentPageSafe, totalPages);
  const firstItem = filtered.length === 0 ? 0 : (currentPageSafe - 1) * JOBS_PER_PAGE + 1;
  const lastItem = Math.min(currentPageSafe * JOBS_PER_PAGE, filtered.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, levelFilter, locationFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const smartSources = useMemo(
    () => buildSearchSources(aiRole || search || "lowongan kerja", aiLocation),
    [aiLocation, aiRole, search],
  );

  const totalRemote = jobs.filter((job) => job.location.toLowerCase().includes("remote")).length;
  const totalCompanies = new Set(jobs.map((job) => job.company)).size;
  const latestDate = jobs[0]?.created_at
    ? new Date(jobs[0].created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      })
    : "Hari ini";

  return (
    <main className="overflow-x-clip bg-background">
      <section className="border-b border-border/70">
        <div className="container-page grid gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.88fr)] lg:items-center lg:py-20">
          <div>
            <Badge className="mb-6 gap-2 border-emerald-200 bg-emerald-100 px-4 py-2 text-sm text-emerald-950 shadow-sm hover:bg-emerald-100">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Job board + AI search helper
            </Badge>

            <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.04] text-foreground sm:text-5xl lg:text-6xl">
              Temukan lowongan yang pas, lalu siapkan CV yang lebih tajam.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Browse lowongan dari database CV Pintar, filter peluang yang relevan, dan buka
              pencarian lintas platform tanpa mengetik ulang query yang sama.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <a href="#daftar-lowongan">
                  Lihat lowongan
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-6 text-base">
                <Link to="/panduan-cv-ats">Cek panduan CV ATS</Link>
              </Button>
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-3">
              {[
                [jobs.length.toLocaleString("id-ID"), "lowongan"],
                [totalCompanies.toLocaleString("id-ID"), "perusahaan"],
                [latestDate, "update"],
              ].map(([stat, label]) => (
                <div key={label} className="rounded-lg border border-border bg-card p-3 shadow-sm">
                  <dt className="font-display text-xl font-bold text-foreground">{stat}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <SearchPanel
            aiRole={aiRole}
            aiLocation={aiLocation}
            onRoleChange={setAiRole}
            onLocationChange={setAiLocation}
            sources={smartSources}
          />
        </div>
      </section>

      <section className="container-page py-12 md:py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {playbook.map((item) => (
            <Card key={item.title} className="border-border/80 shadow-sm">
              <CardContent className="p-6">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="font-display text-xl font-bold text-foreground">{item.title}</h2>
                <p className="mt-3 leading-7 text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="daftar-lowongan" className="bg-muted/45 py-12 md:py-16">
        <div className="container-page">
          <div className="mb-8 grid gap-5 lg:grid-cols-[0.75fr_1fr] lg:items-end">
            <div>
              <Badge variant="secondary" className="mb-4 px-3 py-1.5">
                <Briefcase className="mr-1.5 h-3.5 w-3.5" />
                Daftar lowongan
              </Badge>
              <h2 className="font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
                Filter cepat untuk peluang yang paling masuk akal.
              </h2>
              <p className="mt-3 leading-7 text-muted-foreground">
                Klik kartu lowongan untuk melihat detail, ringkasan, dan sumber aslinya.
              </p>
            </div>

            <div className="grid gap-3 rounded-lg border border-border bg-card p-3 shadow-sm sm:grid-cols-[1fr_auto_auto_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari posisi, perusahaan, lokasi..."
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
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="bg-background">
              <Filter className="mr-1.5 h-3.5 w-3.5" />
              {filtered.length.toLocaleString("id-ID")} hasil
            </Badge>
            {filtered.length > 0 && (
              <Badge variant="outline" className="bg-background">
                {firstItem.toLocaleString("id-ID")}-{lastItem.toLocaleString("id-ID")} dari{" "}
                {filtered.length.toLocaleString("id-ID")}
              </Badge>
            )}
            <Badge variant="outline" className="bg-background">
              <Compass className="mr-1.5 h-3.5 w-3.5" />
              {totalRemote.toLocaleString("id-ID")} remote
            </Badge>
            <span>Gunakan keyword dari lowongan untuk memperkuat CV kamu.</span>
          </div>

          {loading ? (
            <div className="grid gap-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-36" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-background py-16 text-center">
              <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Tidak ada lowongan</h3>
              <p className="mt-1 text-sm text-muted-foreground">Coba ubah filter pencarian.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {paginatedJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex flex-col items-center gap-3">
                  <p className="text-sm text-muted-foreground">
                    Halaman {currentPageSafe.toLocaleString("id-ID")} dari{" "}
                    {totalPages.toLocaleString("id-ID")} - 10 lowongan per halaman
                  </p>
                  <Pagination>
                    <PaginationContent className="flex-wrap justify-center">
                      <PaginationItem>
                        <PaginationPrevious
                          href="#daftar-lowongan"
                          aria-disabled={currentPageSafe === 1}
                          className={
                            currentPageSafe === 1 ? "pointer-events-none opacity-50" : undefined
                          }
                          onClick={(event) => {
                            event.preventDefault();
                            setCurrentPage((page) => Math.max(1, page - 1));
                          }}
                        />
                      </PaginationItem>

                      {pageItems.map((item, index) =>
                        item === "ellipsis" ? (
                          <PaginationItem key={`ellipsis-${index}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={item}>
                            <PaginationLink
                              href="#daftar-lowongan"
                              isActive={item === currentPageSafe}
                              onClick={(event) => {
                                event.preventDefault();
                                setCurrentPage(item);
                              }}
                            >
                              {item}
                            </PaginationLink>
                          </PaginationItem>
                        ),
                      )}

                      <PaginationItem>
                        <PaginationNext
                          href="#daftar-lowongan"
                          aria-disabled={currentPageSafe === totalPages}
                          className={
                            currentPageSafe === totalPages
                              ? "pointer-events-none opacity-50"
                              : undefined
                          }
                          onClick={(event) => {
                            event.preventDefault();
                            setCurrentPage((page) => Math.min(totalPages, page + 1));
                          }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="container-page py-12 md:py-16">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1fr] lg:items-center">
          <Card className="border-border/80 shadow-sm">
            <CardContent className="p-6">
              <Badge className="mb-5 bg-primary text-primary-foreground">Lamaran lebih siap</Badge>
              <h2 className="font-display text-3xl font-bold leading-tight text-foreground">
                Jangan cuma cari lowongan. Cocokkan CV dengan role-nya.
              </h2>
              <p className="mt-4 leading-8 text-muted-foreground">
                Setelah menemukan lowongan, gunakan AI CV Pintar untuk scoring, keyword, cover
                letter, dan perbaikan kalimat agar lamaran lebih relevan.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link to="/register">
                    Buat CV dengan AI <Zap className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/template">
                    Lihat Template <BookOpen className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["ATS score", "Cek struktur dan keyword sebelum submit.", BadgeCheck],
              ["Cover letter", "Buat surat lamaran sesuai lowongan.", FileText],
              ["Keyword extractor", "Ambil skill penting dari job description.", Layers3],
              ["Application tracker", "Catat status lamaran dan follow up.", TrendingUp],
            ].map(([title, desc, Icon]) => (
              <div key={title as string} className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function SearchPanel({
  aiRole,
  aiLocation,
  onRoleChange,
  onLocationChange,
  sources,
}: {
  aiRole: string;
  aiLocation: string;
  onRoleChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  sources: SearchSource[];
}) {
  return (
    <Card className="overflow-hidden border-border/80 bg-card shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="mb-5 flex items-start justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="text-xs font-bold uppercase text-primary">Smart search console</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-foreground">
                Cari lintas platform
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Query dirapikan untuk LinkedIn, JobStreet, Glints, Kalibrr, dan Google Jobs.
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bot className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
            <Input
              value={aiRole}
              onChange={(event) => onRoleChange(event.target.value)}
              placeholder="Frontend Developer, HR Officer"
            />
            <Input
              value={aiLocation}
              onChange={(event) => onLocationChange(event.target.value)}
              placeholder="Indonesia, Remote"
            />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {sources.map((source) => (
              <Button key={source.name} asChild variant="outline" className="justify-between">
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  <span>{source.name}</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            ))}
          </div>

          <div className="mt-5 rounded-lg bg-primary p-4 text-primary-foreground">
            <div className="mb-2 flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" aria-hidden="true" />
              <p className="font-semibold">Tips cepat</p>
            </div>
            <p className="text-sm leading-6 text-primary-foreground/85">
              Coba gabungkan role + level + lokasi, misalnya “Junior Data Analyst Jakarta” atau
              “Remote Backend Engineer”.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function JobCard({ job }: { job: Job }) {
  const salaryText = formatSalary(
    job.salary_min,
    job.salary_max,
    job.salary_currency,
    job.salary_period,
  );
  const isFallback = job.id.startsWith("fallback-");
  const techItems = parseInlineList(job.tech_stack).slice(0, 3);
  const deadlineText = job.deadline ? formatDeadline(job.deadline) : null;

  const content = (
    <Card className="overflow-hidden border-border/80 bg-background transition-all hover:border-primary/35 hover:shadow-md">
      <CardContent className="p-0">
        <div className="grid gap-0 md:grid-cols-[1fr_auto]">
          <div className="p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                {levelLabel(job.level)}
              </Badge>
              <Badge variant="secondary">{typeLabel(job.type)}</Badge>
              {job.work_mode && (
                <Badge variant="outline" className="gap-1.5">
                  <Laptop className="h-3.5 w-3.5" />
                  {workModeLabel(job.work_mode)}
                </Badge>
              )}
              {job.industry && <Badge variant="outline">{job.industry}</Badge>}
              {isFallback && <Badge variant="outline">Contoh</Badge>}
            </div>

            <h3 className="font-display text-xl font-bold text-foreground transition-colors group-hover:text-primary">
              {job.title}
            </h3>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" /> {job.company}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {job.location}
              </span>
              {salaryText && (
                <span className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4" /> {salaryText}
                </span>
              )}
              {deadlineText && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" /> Deadline {deadlineText}
                </span>
              )}
            </div>

            <p className="mt-3 line-clamp-2 leading-7 text-muted-foreground">{job.description}</p>

            {techItems.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {techItems.map((item) => (
                  <Badge key={item} variant="secondary" className="bg-muted text-muted-foreground">
                    {item}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-border bg-muted/45 p-5 md:w-56 md:flex-col md:items-start md:justify-center md:border-l md:border-t-0">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Diposting{" "}
              {new Date(job.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              })}
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
              Lihat detail
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
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
    if (value >= 1000000) return `${prefix} ${(value / 1000000).toFixed(0)}jt`;
    return `${prefix} ${(value / 1000).toFixed(0)}rb`;
  };
  if (min && max) return `${fmt(min)} - ${fmt(max)} ${suffix}`;
  if (min) return `Mulai ${fmt(min)} ${suffix}`;
  return `Hingga ${fmt(max ?? 0)} ${suffix}`;
}

function buildPageItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const sortedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  return sortedPages.reduce<Array<number | "ellipsis">>((items, page) => {
    const previous = items[items.length - 1];
    if (typeof previous === "number" && page - previous > 1) {
      items.push("ellipsis");
    }
    items.push(page);
    return items;
  }, []);
}

function parseInlineList(value?: string | null) {
  return String(value || "")
    .split(/,|\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function workModeLabel(value: string) {
  const map: Record<string, string> = {
    onsite: "On-site",
    remote: "Remote",
    hybrid: "Hybrid",
  };
  return map[value] ?? value;
}

function formatDeadline(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
