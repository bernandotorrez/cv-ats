import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { buildSectionHead } from "@/lib/seo";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
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
import { CtaBanner, Eyebrow, SectionHeader } from "@/components/site/marketing";
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Bot,
  Briefcase,
  Building2,
  CalendarDays,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  Layers3,
  Laptop,
  Loader2,
  LogIn,
  MapPin,
  MousePointerClick,
  Search,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Wand2,
  X,
} from "lucide-react";

export const Route = createFileRoute("/lowongan")({
  head: ({ matches }) =>
    buildSectionHead(
      {
        title: "Lowongan Pekerjaan - CV Pintar",
        description:
          "Temukan lowongan kerja terbaru, filter peluang yang relevan, dan siapkan CV ATS sebelum melamar.",
        path: "/lowongan",
        keywords: "lowongan kerja, loker, job indonesia, cari kerja, lowongan terbaru",
      },
      matches[matches.length - 1].pathname,
    ),
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

type SavedJobListingsQuery = {
  select: (columns: string) => {
    eq: (
      column: string,
      value: string,
    ) => Promise<{ data: Array<{ job_listing_id: string | null }> | null; error: unknown }>;
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

function savedJobListingsTable() {
  return (supabase as any).from("saved_job_listings") as unknown as SavedJobListingsQuery;
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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [savingJobId, setSavingJobId] = useState<string | null>(null);
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

  useEffect(() => {
    if (!user?.id) {
      setSavedJobIds(new Set());
      return;
    }

    void loadSavedJobs(user.id);
  }, [user?.id]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const { data } = await (supabase as any)
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

  const loadSavedJobs = async (userId: string) => {
    const { data, error } = await savedJobListingsTable()
      .select("job_listing_id")
      .eq("user_id", userId);

    if (error) {
      return;
    }

    setSavedJobIds(
      new Set((data ?? []).map((row) => row.job_listing_id).filter(Boolean) as string[]),
    );
  };

  const toggleSavedJob = async (jobId: string) => {
    if (!user?.id || savingJobId) return;

    const nextSaved = !savedJobIds.has(jobId);
    setSavingJobId(jobId);
    setSavedJobIds((current) => {
      const next = new Set(current);
      if (nextSaved) next.add(jobId);
      else next.delete(jobId);
      return next;
    });

    const { error } = nextSaved
      ? await savedJobListingsTable().insert({
          user_id: user.id,
          job_listing_id: jobId,
        })
      : await savedJobListingsTable().delete().eq("user_id", user.id).eq("job_listing_id", jobId);

    setSavingJobId(null);

    if (error) {
      setSavedJobIds((current) => {
        const next = new Set(current);
        if (nextSaved) next.delete(jobId);
        else next.add(jobId);
        return next;
      });
      toast.error("Gagal memperbarui lowongan tersimpan.");
      return;
    }

    toast.success(nextSaved ? "Lowongan disimpan." : "Lowongan dihapus dari simpanan.");
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

  const hasActiveFilter =
    search !== "" ||
    typeFilter !== "Semua Tipe" ||
    levelFilter !== "Semua Level" ||
    locationFilter !== "Semua Lokasi";

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("Semua Tipe");
    setLevelFilter("Semua Level");
    setLocationFilter("Semua Lokasi");
  };

  const quickChips = [
    {
      label: "Remote",
      active: locationFilter === "Remote",
      toggle: () => setLocationFilter((v) => (v === "Remote" ? "Semua Lokasi" : "Remote")),
    },
    {
      label: "Jakarta",
      active: locationFilter === "Jakarta",
      toggle: () => setLocationFilter((v) => (v === "Jakarta" ? "Semua Lokasi" : "Jakarta")),
    },
    {
      label: "Entry Level",
      active: levelFilter === "entry",
      toggle: () => setLevelFilter((v) => (v === "entry" ? "Semua Level" : "entry")),
    },
    {
      label: "Magang",
      active: typeFilter === "internship",
      toggle: () => setTypeFilter((v) => (v === "internship" ? "Semua Tipe" : "internship")),
    },
  ];

  const scrollToList = () =>
    document
      .getElementById("daftar-lowongan")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="overflow-hidden bg-white">
      {/* Hero with search-first */}
      <section
        aria-labelledby="lowongan-heading"
        className="relative overflow-hidden bg-gradient-to-b from-green-50 via-white to-white pb-14 pt-10 lg:pb-20 lg:pt-16"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-green-200/50 blur-3xl"
        />
        <div className="container-page relative">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-green-200 bg-white px-3 py-1.5 text-sm font-semibold text-green-800 shadow-sm">
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              Job board + AI search helper
            </span>
            <h1
              id="lowongan-heading"
              className="mt-6 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
            >
              Temukan lowongan yang pas,{" "}
              <span className="text-green-700">lalu lamar dengan CV yang lebih tajam.</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-gray-600">
              Filter peluang yang relevan, buka pencarian lintas platform, dan cocokkan CV-mu
              sebelum mengirim lamaran.
            </p>
          </div>

          <form
            role="search"
            aria-label="Cari lowongan"
            onSubmit={(e) => {
              e.preventDefault();
              scrollToList();
            }}
            className="mx-auto mt-8 flex max-w-3xl flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl shadow-green-900/10 sm:flex-row"
          >
            <label htmlFor="hero-job-search" className="sr-only">
              Cari posisi, perusahaan, atau lokasi
            </label>
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500"
              />
              <input
                id="hero-job-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari posisi, perusahaan, lokasi…"
                className="h-14 w-full rounded-xl bg-transparent pl-12 pr-4 text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-green-700 px-8 text-base font-bold text-white transition-colors hover:bg-green-800"
            >
              Cari Lowongan
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </button>
          </form>

          <div className="mx-auto mt-5 flex max-w-3xl flex-wrap items-center justify-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Populer:</span>
            {quickChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                aria-pressed={chip.active}
                onClick={() => {
                  chip.toggle();
                  scrollToList();
                }}
                className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors ${
                  chip.active
                    ? "bg-green-700 text-white"
                    : "border border-gray-300 bg-white text-gray-800 hover:border-green-700 hover:text-green-800"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <dl className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 sm:grid-cols-4">
            {[
              [jobs.length.toLocaleString("id-ID"), "Lowongan"],
              [totalCompanies.toLocaleString("id-ID"), "Perusahaan"],
              [totalRemote.toLocaleString("id-ID"), "Remote"],
              [latestDate, "Update terakhir"],
            ].map(([stat, label]) => (
              <div key={label} className="flex flex-col-reverse bg-white p-4 text-center">
                <dt className="mt-1 text-sm font-medium text-gray-600">{label}</dt>
                <dd className="font-display text-2xl font-extrabold text-gray-900">
                  {loading ? "…" : stat}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Job list */}
      <section
        id="daftar-lowongan"
        aria-labelledby="daftar-heading"
        className="scroll-mt-16 bg-gray-50 py-14 lg:py-20"
      >
        <div className="container-page">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="daftar-heading"
                className="font-display text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl"
              >
                Daftar lowongan
              </h2>
              <p className="mt-2 text-base text-gray-600">
                Klik lowongan untuk melihat detail, ringkasan, dan sumber aslinya.
              </p>
            </div>
          </div>

          <div className="sticky top-16 z-20 -mx-4 mb-6 border-y border-gray-200 bg-white/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-2xl md:border md:px-3">
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-[1fr_auto_auto_auto]">
              <div className="relative sm:col-span-3 lg:col-span-1">
                <label htmlFor="job-search" className="sr-only">
                  Cari posisi, perusahaan, atau lokasi
                </label>
                <Search
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                />
                <Input
                  id="job-search"
                  type="search"
                  placeholder="Cari posisi, perusahaan, lokasi…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-11 pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger aria-label="Tipe pekerjaan" className="h-11 w-full lg:w-[160px]">
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
                <SelectTrigger aria-label="Level karier" className="h-11 w-full lg:w-[160px]">
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
                <SelectTrigger aria-label="Lokasi" className="h-11 w-full lg:w-[160px]">
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

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p aria-live="polite" className="text-sm text-gray-700">
              {loading ? (
                "Memuat lowongan…"
              ) : filtered.length > 0 ? (
                <>
                  Menampilkan{" "}
                  <strong className="text-gray-900">
                    {firstItem.toLocaleString("id-ID")}–{lastItem.toLocaleString("id-ID")}
                  </strong>{" "}
                  dari{" "}
                  <strong className="text-gray-900">
                    {filtered.length.toLocaleString("id-ID")}
                  </strong>{" "}
                  lowongan
                </>
              ) : (
                "Tidak ada lowongan yang cocok."
              )}
            </p>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-green-800 underline underline-offset-4 hover:text-green-900"
              >
                <X aria-hidden="true" className="h-4 w-4" />
                Reset filter
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid gap-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-36 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
              <Briefcase aria-hidden="true" className="mx-auto mb-3 h-10 w-10 text-gray-500" />
              <h3 className="font-display text-lg font-bold text-gray-900">
                Belum ada lowongan yang cocok
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Coba ubah filter, atau cari lintas platform di bawah.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFilters}
                  className="h-11 rounded-xl border-gray-300"
                >
                  Reset filter
                </Button>
                <Button
                  asChild
                  className="h-11 rounded-xl bg-green-700 font-bold text-white hover:bg-green-800"
                >
                  <a href="#cari-lintas-platform">Cari lintas platform</a>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <ul className="grid gap-4">
                {paginatedJobs.map((job, index) => (
                  <Fragment key={job.id}>
                    <li>
                      <JobCard
                        job={job}
                        isLoggedIn={Boolean(user)}
                        isSaved={savedJobIds.has(job.id)}
                        isSaving={savingJobId === job.id}
                        onToggleSaved={toggleSavedJob}
                      />
                    </li>
                    {index === 2 && paginatedJobs.length > 3 && (
                      <li>
                        <aside
                          aria-label="Cek kecocokan CV"
                          className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-green-800 p-6 text-white sm:flex-row sm:items-center"
                        >
                          <div className="flex items-start gap-4">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-yellow-300">
                              <Target aria-hidden="true" className="h-5 w-5" />
                            </span>
                            <div>
                              <p className="font-display text-lg font-bold">
                                Sudah ketemu yang cocok?
                              </p>
                              <p className="mt-0.5 text-sm text-green-50">
                                Cek seberapa cocok CV-mu dengan lowongannya pakai AI Job Match
                                Score.
                              </p>
                            </div>
                          </div>
                          <Link
                            to="/register"
                            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-yellow-300 px-5 font-bold text-gray-950 hover:bg-yellow-200"
                          >
                            Cek Kecocokan CV
                            <ArrowRight aria-hidden="true" className="h-4 w-4" />
                          </Link>
                        </aside>
                      </li>
                    )}
                  </Fragment>
                ))}
              </ul>

              {totalPages > 1 && (
                <nav
                  aria-label="Halaman lowongan"
                  className="mt-8 flex flex-col items-center gap-3"
                >
                  <p className="text-sm text-gray-600">
                    Halaman {currentPageSafe.toLocaleString("id-ID")} dari{" "}
                    {totalPages.toLocaleString("id-ID")} · 10 lowongan per halaman
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
                            scrollToList();
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
                              aria-label={`Halaman ${item}`}
                              className="h-11 w-11"
                              onClick={(event) => {
                                event.preventDefault();
                                setCurrentPage(item);
                                scrollToList();
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
                            scrollToList();
                          }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </nav>
              )}
            </>
          )}
        </div>
      </section>

      {/* Cross-platform search */}
      <section
        id="cari-lintas-platform"
        aria-labelledby="lintas-heading"
        className="scroll-mt-20 py-20 lg:py-28"
      >
        <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Eyebrow>
              <Bot aria-hidden="true" className="h-4 w-4" /> Smart search
            </Eyebrow>
            <h2
              id="lintas-heading"
              className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl"
            >
              Belum ketemu?{" "}
              <span className="text-green-700">Cari lintas platform sekali ketik.</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
              Query dirapikan otomatis untuk LinkedIn, JobStreet, Glints, Kalibrr, dan Google Jobs —
              tanpa mengetik ulang.
            </p>
            <p className="mt-6 flex items-start gap-3 rounded-xl bg-yellow-50 p-4 text-sm leading-relaxed text-gray-800">
              <MousePointerClick
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-gray-900"
              />
              <span>
                <strong>Tips:</strong> gabungkan role + level + lokasi, misalnya “Junior Data
                Analyst Jakarta” atau “Remote Backend Engineer”.
              </span>
            </p>
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

      {/* Playbook */}
      <section aria-labelledby="playbook-heading" className="bg-gray-50 py-20 lg:py-28">
        <div className="container-page">
          <SectionHeader
            id="playbook-heading"
            eyebrow="Lamar lebih siap"
            title="Jangan cuma cari lowongan. Cocokkan CV dengan role-nya."
            desc="Tiga langkah sederhana supaya lamaranmu lebih relevan dari kandidat lain."
          />
          <ol className="grid gap-5 md:grid-cols-3">
            {playbook.map((item, i) => (
              <li key={item.title} className="rounded-2xl border border-gray-200 bg-white p-7">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-800">
                    <item.icon aria-hidden="true" className="h-6 w-6" />
                  </span>
                  <span
                    aria-hidden="true"
                    className="font-display text-3xl font-extrabold text-green-200"
                  >
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.desc}</p>
              </li>
            ))}
          </ol>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "ATS score",
                desc: "Cek struktur dan keyword sebelum submit.",
                Icon: BadgeCheck,
              },
              {
                title: "Cover letter",
                desc: "Buat surat lamaran sesuai lowongan.",
                Icon: FileText,
              },
              {
                title: "Keyword extractor",
                desc: "Ambil skill penting dari job description.",
                Icon: Layers3,
              },
              {
                title: "Application tracker",
                desc: "Catat status lamaran dan follow up.",
                Icon: TrendingUp,
              },
            ].map(({ title, desc, Icon }) => (
              <li key={title} className="flex gap-4 rounded-2xl bg-white p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-700 text-white">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-gray-900">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBanner
        title="Lowongan sudah di tangan. Saatnya CV yang siap bersaing."
        desc="Gunakan AI CV Pintar untuk scoring, keyword, cover letter, dan perbaikan kalimat agar lamaran lebih relevan."
        cta="Buat CV dengan AI"
      />
    </div>
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
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl shadow-green-900/10 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
        <div>
          <label htmlFor="ai-role" className="text-sm font-bold text-gray-900">
            Posisi
          </label>
          <Input
            id="ai-role"
            value={aiRole}
            onChange={(event) => onRoleChange(event.target.value)}
            placeholder="Frontend Developer, HR Officer"
            className="mt-1.5 h-11"
          />
        </div>
        <div>
          <label htmlFor="ai-location" className="text-sm font-bold text-gray-900">
            Lokasi
          </label>
          <Input
            id="ai-location"
            value={aiLocation}
            onChange={(event) => onLocationChange(event.target.value)}
            placeholder="Indonesia, Remote"
            className="mt-1.5 h-11"
          />
        </div>
      </div>

      <p className="mt-6 text-sm font-bold text-gray-900">Buka hasil pencarian di:</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {sources.map((source) => (
          <li key={source.name}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-gray-300 px-4 font-semibold text-gray-900 transition-colors hover:border-green-700 hover:bg-green-50 hover:text-green-800"
            >
              {source.name}
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
              <span className="sr-only"> (membuka tab baru)</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function JobCard({
  job,
  isLoggedIn,
  isSaved,
  isSaving,
  onToggleSaved,
}: {
  job: Job;
  isLoggedIn: boolean;
  isSaved: boolean;
  isSaving: boolean;
  onToggleSaved: (jobId: string) => void;
}) {
  const salaryText = formatSalary(
    job.salary_min ?? undefined,
    job.salary_max ?? undefined,
    job.salary_currency ?? undefined,
    job.salary_period ?? undefined,
  );
  const isFallback = job.id.startsWith("fallback-");
  const techItems = parseInlineList(job.tech_stack).slice(0, 3);
  const deadlineText = job.deadline ? formatDeadline(job.deadline) : null;

  const detailLink = isFallback ? buildSearchSources(job.title, job.location)[4].url : null;
  const titleId = `job-${job.id}`;
  const actionBtn =
    "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors";

  return (
    <article
      aria-labelledby={titleId}
      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:border-green-600 hover:shadow-lg"
    >
      <div className="grid md:grid-cols-[1fr_auto]">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 font-display text-lg font-extrabold text-green-800 sm:flex"
            >
              {job.company.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <h3 id={titleId} className="font-display text-xl font-bold text-gray-900">
                {isFallback ? (
                  <a
                    href={detailLink ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-green-800 hover:underline"
                  >
                    {job.title}
                    <span className="sr-only"> (membuka tab baru)</span>
                  </a>
                ) : (
                  <Link
                    to="/lowongan/$slug"
                    params={{ slug: job.slug }}
                    className="hover:text-green-800 hover:underline"
                  >
                    {job.title}
                  </Link>
                )}
              </h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                <Building2 aria-hidden="true" className="h-4 w-4" /> {job.company}
              </p>
            </div>
          </div>

          <ul
            className="mt-4 flex flex-wrap gap-2 text-xs font-semibold"
            aria-label="Detail lowongan"
          >
            <li className="rounded-full bg-green-100 px-2.5 py-1 text-green-800">
              {levelLabel(job.level)}
            </li>
            <li className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-800">
              {typeLabel(job.type)}
            </li>
            {job.work_mode && (
              <li className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-gray-800">
                <Laptop aria-hidden="true" className="h-3.5 w-3.5" />
                {workModeLabel(job.work_mode)}
              </li>
            )}
            {job.industry && (
              <li className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-800">{job.industry}</li>
            )}
            {isFallback && (
              <li className="rounded-full bg-yellow-200 px-2.5 py-1 text-gray-900">Contoh</li>
            )}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-700">
            <span className="flex items-center gap-1.5">
              <MapPin aria-hidden="true" className="h-4 w-4 text-gray-500" /> {job.location}
            </span>
            {salaryText && (
              <span className="flex items-center gap-1.5 font-semibold text-gray-900">
                <DollarSign aria-hidden="true" className="h-4 w-4 text-green-700" /> {salaryText}
              </span>
            )}
            {deadlineText && (
              <span className="flex items-center gap-1.5">
                <CalendarDays aria-hidden="true" className="h-4 w-4 text-gray-500" /> Deadline{" "}
                {deadlineText}
              </span>
            )}
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-600">
            {job.description}
          </p>

          {techItems.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Skill">
              {techItems.map((item) => (
                <li
                  key={item}
                  className="rounded-md border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700"
                >
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col justify-center gap-3 border-t border-gray-200 bg-gray-50 p-5 md:w-60 md:border-l md:border-t-0">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
            <Clock aria-hidden="true" className="h-3.5 w-3.5" />
            Diposting{" "}
            {new Date(job.created_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
            })}
          </p>
          <div className="flex w-full gap-2 md:flex-col">
            {isFallback ? (
              <a
                href={detailLink ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={`${actionBtn} bg-green-700 text-white hover:bg-green-800`}
              >
                Cari serupa
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
                <span className="sr-only"> (membuka tab baru)</span>
              </a>
            ) : (
              <Link
                to="/lowongan/$slug"
                params={{ slug: job.slug }}
                aria-label={`Lihat detail ${job.title} di ${job.company}`}
                className={`${actionBtn} bg-green-700 text-white hover:bg-green-800`}
              >
                Lihat Detail
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            )}
            {isFallback ? null : isLoggedIn ? (
              <button
                type="button"
                aria-pressed={isSaved}
                aria-label={`${isSaved ? "Hapus dari simpanan" : "Simpan"}: ${job.title}`}
                disabled={isSaving}
                onClick={() => onToggleSaved(job.id)}
                className={`${actionBtn} border-2 ${
                  isSaved
                    ? "border-green-700 bg-green-50 text-green-800"
                    : "border-gray-300 bg-white text-gray-800 hover:border-green-700 hover:text-green-800"
                } disabled:opacity-60`}
              >
                {isSaving ? (
                  <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                ) : isSaved ? (
                  <BookmarkCheck aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <Bookmark aria-hidden="true" className="h-4 w-4" />
                )}
                {isSaved ? "Tersimpan" : "Simpan"}
              </button>
            ) : (
              <Link
                to="/login"
                search={{ redirect: "/lowongan" }}
                aria-label={`Masuk untuk menyimpan ${job.title}`}
                className={`${actionBtn} border-2 border-gray-300 bg-white text-gray-800 hover:border-green-700 hover:text-green-800`}
              >
                <LogIn aria-hidden="true" className="h-4 w-4" />
                Masuk & Simpan
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
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
