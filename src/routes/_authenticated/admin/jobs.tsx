import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/jobs")({
  head: () =>
    buildSeo({
      title: "Admin Lowongan - CV Pintar",
      description: "Kelola import dan CRUD lowongan kerja.",
      path: "/admin/jobs",
      noindex: true,
    }),
  component: AdminJobsPage,
});

const PAGE_SIZE = 10;

type Source = "linkedin" | "jobstreet" | "glints" | "kalibrr" | "google";

type JobType = "full-time" | "part-time" | "contract" | "internship";
type JobLevel = "entry" | "mid" | "senior" | "manager" | "director";
type WorkMode = "onsite" | "remote" | "hybrid";
type SalaryPeriod = "monthly" | "yearly";

type JobListing = {
  id: string;
  slug: string;
  title: string;
  company: string;
  company_logo?: string | null;
  location: string;
  type: JobType;
  level: JobLevel;
  industry?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  salary_period?: SalaryPeriod | null;
  description: string;
  responsibilities?: string | null;
  requirements?: string | null;
  qualifications?: string | null;
  benefits?: string | null;
  tech_stack?: string | null;
  work_mode?: WorkMode | null;
  deadline?: string | null;
  source_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
};

type JobForm = {
  slug: string;
  title: string;
  company: string;
  company_logo: string;
  location: string;
  type: JobType;
  level: JobLevel;
  industry: string;
  salary_min: string;
  salary_max: string;
  salary_currency: string;
  salary_period: SalaryPeriod;
  description: string;
  responsibilities: string;
  requirements: string;
  qualifications: string;
  benefits: string;
  tech_stack: string;
  work_mode: "" | WorkMode;
  deadline: string;
  source_url: string;
  is_active: boolean;
};

type ImportedJob = {
  id: string;
  slug: string;
  title: string;
  company: string;
  location: string;
  source_url?: string | null;
};

type SearchResponse = {
  inserted?: number;
  skipped?: number;
  searched?: number;
  source_pages?: number;
  jobs?: ImportedJob[];
  error?: string;
};

type PaginationState = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type JobListingsQuery = {
  select: (
    columns: string,
    options?: { count?: "exact" },
  ) => {
    order: (
      column: string,
      options?: { ascending?: boolean },
    ) => {
      range: (
        from: number,
        to: number,
      ) => Promise<{
        data: JobListing[] | null;
        count: number | null;
        error: { message: string } | null;
      }>;
    };
  };
  insert: (row: Partial<JobListing>) => Promise<{ error: { message: string } | null }>;
  update: (row: Partial<JobListing>) => {
    eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
  };
  delete: () => {
    eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
  };
};

function jobListingsTable() {
  return supabase.from("job_listings") as unknown as JobListingsQuery;
}

const emptyForm: JobForm = {
  slug: "",
  title: "",
  company: "",
  company_logo: "",
  location: "Indonesia",
  type: "full-time",
  level: "entry",
  industry: "",
  salary_min: "",
  salary_max: "",
  salary_currency: "IDR",
  salary_period: "monthly",
  description: "",
  responsibilities: "",
  requirements: "",
  qualifications: "",
  benefits: "",
  tech_stack: "",
  work_mode: "",
  deadline: "",
  source_url: "",
  is_active: true,
};

const sourceOptions: Array<{ value: Source; label: string }> = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "jobstreet", label: "JobStreet" },
  { value: "glints", label: "Glints" },
  { value: "kalibrr", label: "Kalibrr" },
  { value: "google", label: "Google" },
];

function AdminJobsPage() {
  const [query, setQuery] = useState("Frontend Developer");
  const [location, setLocation] = useState("Indonesia");
  const [limit, setLimit] = useState("8");
  const [sources, setSources] = useState<Source[]>(["linkedin", "jobstreet", "glints", "kalibrr"]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobListing | null>(null);
  const [jobToDelete, setJobToDelete] = useState<JobListing | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<JobForm>(emptyForm);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const loadJobs = useCallback(async (page: number = 1) => {
    setJobsLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, count, error } = await jobListingsTable()
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      toast.error(error.message);
    } else {
      setJobs(data || []);
      setPagination({
        page,
        pageSize: PAGE_SIZE,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / PAGE_SIZE),
      });
    }
    setJobsLoading(false);
  }, []);

  useEffect(() => {
    void loadJobs(pagination.page);
  }, [loadJobs, pagination.page]);

  const toggleSource = (source: Source) => {
    setSources((current) =>
      current.includes(source) ? current.filter((item) => item !== source) : [...current, source],
    );
  };

  const refreshJobsPage = (page: number) => {
    if (page === pagination.page) {
      void loadJobs(page);
      return;
    }

    setPagination((current) => ({ ...current, page }));
  };

  const runSearch = async () => {
    const cleanQuery = query.trim();
    const cleanLocation = location.trim() || "Indonesia";

    if (!cleanQuery) return toast.error("Keyword posisi wajib diisi.");
    if (sources.length === 0) return toast.error("Pilih minimal satu sumber.");

    setLoading(true);
    setResult(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      if (!token || !supabaseUrl)
        throw new Error("Session admin tidak valid. Silakan login ulang.");

      const response = await fetch(`${supabaseUrl}/functions/v1/admin-job-search`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: cleanQuery,
          location: cleanLocation,
          limit: Number(limit),
          sources,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as SearchResponse;
      if (!response.ok) throw new Error(payload.error || "Gagal menjalankan AI search.");

      setResult(payload);
      toast.success(`${payload.inserted || 0} lowongan masuk ke database.`);
      refreshJobsPage(1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menjalankan AI search.";
      setResult({ error: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingJob(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (job: JobListing) => {
    setEditingJob(job);
    setForm({
      slug: job.slug,
      title: job.title,
      company: job.company,
      company_logo: job.company_logo || "",
      location: job.location,
      type: job.type,
      level: job.level,
      industry: job.industry || "",
      salary_min: job.salary_min ? String(job.salary_min) : "",
      salary_max: job.salary_max ? String(job.salary_max) : "",
      salary_currency: job.salary_currency || "IDR",
      salary_period: job.salary_period || "monthly",
      description: job.description,
      responsibilities: job.responsibilities || "",
      requirements: job.requirements || "",
      qualifications: job.qualifications || "",
      benefits: job.benefits || "",
      tech_stack: job.tech_stack || "",
      work_mode: job.work_mode || "",
      deadline: job.deadline || "",
      source_url: job.source_url || "",
      is_active: job.is_active,
    });
    setDialogOpen(true);
  };

  const setField = <K extends keyof JobForm>(key: K, value: JobForm[K]) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "title" && !editingJob && !current.slug.trim()) {
        next.slug = buildSlug(String(value), current.company, current.location);
      }
      if (key === "company" && !editingJob && !current.slug.trim()) {
        next.slug = buildSlug(current.title, String(value), current.location);
      }
      return next;
    });
  };

  const saveJob = async () => {
    if (!form.title.trim() || !form.company.trim() || !form.location.trim()) {
      toast.error("Judul, perusahaan, dan lokasi wajib diisi.");
      return;
    }

    if (!form.description.trim()) {
      toast.error("Deskripsi lowongan wajib diisi.");
      return;
    }

    setSaving(true);
    const payload = buildPayload(form);
    const { error } = editingJob
      ? await jobListingsTable().update(payload).eq("id", editingJob.id)
      : await jobListingsTable().insert(payload);

    setSaving(false);
    if (error) return toast.error(error.message);

    toast.success(editingJob ? "Lowongan diupdate." : "Lowongan ditambahkan.");
    setDialogOpen(false);
    refreshJobsPage(editingJob ? pagination.page : 1);
  };

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return;
    setDeleting(true);
    const nextPage =
      jobs.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page;
    const { error } = await jobListingsTable().delete().eq("id", jobToDelete.id);
    setDeleting(false);
    if (error) return toast.error(error.message);
    toast.success("Lowongan dihapus.");
    setJobToDelete(null);
    refreshJobsPage(nextPage);
  };

  const toggleActive = async (job: JobListing) => {
    const { error } = await jobListingsTable()
      .update({ is_active: !job.is_active, updated_at: new Date().toISOString() })
      .eq("id", job.id);

    if (error) return toast.error(error.message);
    toast.success(!job.is_active ? "Lowongan diaktifkan." : "Lowongan dinonaktifkan.");
    void loadJobs(pagination.page);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((current) => ({ ...current, page }));
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(pagination.totalPages);
  const goToPrevPage = () => goToPage(pagination.page - 1);
  const goToNextPage = () => goToPage(pagination.page + 1);

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="rounded-lg border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Bot className="h-3.5 w-3.5" />
              AI Job Search
            </div>
            <h2 className="font-display text-2xl font-bold tracking-normal sm:text-3xl">
              Cari, import, dan kelola lowongan kerja.
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Import otomatis dengan AI atau tambahkan lowongan manual dari sumber yang kamu punya.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={openCreate} className="shrink-0 gap-2">
              <Plus className="h-4 w-4" />
              Tambah Manual
            </Button>
            <Button asChild variant="outline" className="shrink-0">
              <Link to="/lowongan">
                Lihat Public Page <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardContent className="space-y-5 p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="job-query">Posisi / keyword</Label>
                <Input
                  id="job-query"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Contoh: Digital Marketing, Data Analyst"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job-location">Lokasi</Label>
                <Input
                  id="job-location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Indonesia, Jakarta, Remote"
                />
              </div>

              <div className="space-y-2">
                <Label>Jumlah import</Label>
                <Select value={limit} onValueChange={setLimit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 lowongan</SelectItem>
                    <SelectItem value="8">8 lowongan</SelectItem>
                    <SelectItem value="12">12 lowongan</SelectItem>
                    <SelectItem value="20">20 lowongan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sumber</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {sourceOptions.map((source) => (
                  <label
                    key={source.value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={sources.includes(source.value)}
                      onChange={() => toggleSource(source.value)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="font-medium">{source.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={runSearch} disabled={loading} className="w-full justify-center gap-2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {loading ? "Mencari dan mengimport..." : "Jalankan AI Search"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <BriefcaseBusiness className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Hasil Import</h3>
            </div>

            {!result ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Hasil import akan muncul di sini setelah pencarian selesai.
                </p>
              </div>
            ) : result.error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>AI search gagal</AlertTitle>
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-4">
                  <Metric label="Inserted" value={result.inserted || 0} />
                  <Metric label="Skipped" value={result.skipped || 0} />
                  <Metric label="Searched" value={result.searched || 0} />
                  <Metric label="Source Pages" value={result.source_pages || 0} />
                </div>

                <div className="space-y-2">
                  {(result.jobs || []).map((job) => (
                    <div key={job.id || job.slug} className="rounded-lg border p-3">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="font-medium">{job.title}</p>
                        <Badge variant="secondary">{job.location}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{job.company}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link to="/lowongan/$slug" params={{ slug: job.slug }}>
                            Detail
                          </Link>
                        </Button>
                        {job.source_url && (
                          <Button asChild size="sm" variant="ghost">
                            <a href={job.source_url} target="_blank" rel="noopener noreferrer">
                              Sumber <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {(result.inserted || 0) > 0 && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Import selesai</AlertTitle>
                    <AlertDescription>
                      Lowongan baru sudah tersimpan dan dapat dicek dari halaman publik.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="rounded-lg border bg-card p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-xl font-bold">Manage Lowongan</h3>
            <p className="text-sm text-muted-foreground">
              {pagination.total} lowongan tersimpan. Tambah manual, edit detail, hapus, atau
              nonaktifkan lowongan dari halaman publik.
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Lowongan
          </Button>
        </div>

        {jobsLoading ? (
          <AdminJobsTableSkeleton />
        ) : jobs.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Belum ada lowongan.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lowongan</TableHead>
                  <TableHead>Perusahaan</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Diposting</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="min-w-[260px]">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">{job.title}</p>
                          <Badge variant="outline">{typeLabel(job.type)}</Badge>
                        </div>
                        <p className="line-clamp-1 max-w-xl text-xs text-muted-foreground">
                          {job.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-40">
                      <div>
                        <p className="font-medium text-foreground">{job.company}</p>
                        {job.industry && (
                          <p className="text-xs text-muted-foreground">{job.industry}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-32">
                      <div className="space-y-1">
                        <p className="text-sm">{job.location}</p>
                        {job.work_mode && (
                          <Badge variant="secondary" className="text-xs">
                            {workModeLabel(job.work_mode)}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={job.is_active ? "secondary" : "outline"}>
                        {job.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(job.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button asChild size="sm" variant="ghost" aria-label="Detail">
                          <Link to="/lowongan/$slug" params={{ slug: job.slug }}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleActive(job)}
                          aria-label={job.is_active ? "Nonaktifkan" : "Aktifkan"}
                        >
                          {job.is_active ? "Off" : "On"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(job)}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setJobToDelete(job)}
                          aria-label="Hapus"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Menampilkan {(pagination.page - 1) * pagination.pageSize + 1}-
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} dari{" "}
              {pagination.total}
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={goToFirstPage}
                disabled={pagination.page === 1 || jobsLoading}
                className="hidden sm:flex"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevPage}
                disabled={pagination.page === 1 || jobsLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="px-3 text-sm">
                Halaman {pagination.page} dari {pagination.totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={pagination.page === pagination.totalPages || jobsLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToLastPage}
                disabled={pagination.page === pagination.totalPages || jobsLoading}
                className="hidden sm:flex"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </section>

      <AlertDialog open={!!jobToDelete} onOpenChange={(open) => !open && setJobToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <AlertDialogTitle>Hapus lowongan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Lowongan <span className="font-medium text-foreground">{jobToDelete?.title}</span> di{" "}
              <span className="font-medium text-foreground">{jobToDelete?.company}</span> akan
              dihapus permanen dari database dan tidak tampil lagi di halaman publik.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <p className="font-medium text-foreground">{jobToDelete?.title}</p>
            <p className="text-muted-foreground">
              {jobToDelete?.location} {jobToDelete?.type ? `- ${typeLabel(jobToDelete.type)}` : ""}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void confirmDeleteJob();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Hapus Lowongan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingJob ? "Edit Lowongan" : "Tambah Lowongan Manual"}</DialogTitle>
            <DialogDescription>
              Data yang aktif akan tampil di halaman publik `/lowongan`.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Judul *">
              <Input
                value={form.title}
                onChange={(event) => setField("title", event.target.value)}
              />
            </Field>
            <Field label="Perusahaan *">
              <Input
                value={form.company}
                onChange={(event) => setField("company", event.target.value)}
              />
            </Field>
            <Field label="Slug *">
              <Input
                value={form.slug}
                onChange={(event) => setField("slug", slugify(event.target.value))}
              />
            </Field>
            <Field label="Lokasi *">
              <Input
                value={form.location}
                onChange={(event) => setField("location", event.target.value)}
              />
            </Field>
            <Field label="Tipe">
              <Select
                value={form.type}
                onValueChange={(value) => setField("type", value as JobType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full Time</SelectItem>
                  <SelectItem value="part-time">Part Time</SelectItem>
                  <SelectItem value="contract">Kontrak</SelectItem>
                  <SelectItem value="internship">Magang</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Level">
              <Select
                value={form.level}
                onValueChange={(value) => setField("level", value as JobLevel)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry</SelectItem>
                  <SelectItem value="mid">Mid</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="director">Director</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Industri">
              <Input
                value={form.industry}
                onChange={(event) => setField("industry", event.target.value)}
              />
            </Field>
            <Field label="Mode kerja">
              <Select
                value={form.work_mode || "none"}
                onValueChange={(value) =>
                  setField("work_mode", value === "none" ? "" : (value as WorkMode))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak dicantumkan</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Gaji min">
              <Input
                type="number"
                value={form.salary_min}
                onChange={(event) => setField("salary_min", event.target.value)}
              />
            </Field>
            <Field label="Gaji max">
              <Input
                type="number"
                value={form.salary_max}
                onChange={(event) => setField("salary_max", event.target.value)}
              />
            </Field>
            <Field label="Currency">
              <Input
                value={form.salary_currency}
                onChange={(event) => setField("salary_currency", event.target.value.toUpperCase())}
              />
            </Field>
            <Field label="Periode gaji">
              <Select
                value={form.salary_period}
                onValueChange={(value) => setField("salary_period", value as SalaryPeriod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="yearly">Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Deadline">
              <Input
                type="date"
                value={form.deadline}
                onChange={(event) => setField("deadline", event.target.value)}
              />
            </Field>
            <Field label="Source URL">
              <Input
                value={form.source_url}
                onChange={(event) => setField("source_url", event.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="Logo perusahaan">
              <Input
                value={form.company_logo}
                onChange={(event) => setField("company_logo", event.target.value)}
                placeholder="https://..."
              />
            </Field>
            <label className="flex items-center gap-2 pt-8 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setField("is_active", event.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Tampilkan di public page
            </label>
          </div>

          <div className="mt-4 space-y-4">
            <Field label="Deskripsi *">
              <Textarea
                rows={4}
                value={form.description}
                onChange={(event) => setField("description", event.target.value)}
              />
            </Field>
            <Field label="Responsibilities">
              <Textarea
                rows={4}
                value={form.responsibilities}
                onChange={(event) => setField("responsibilities", event.target.value)}
              />
            </Field>
            <Field label="Requirements">
              <Textarea
                rows={4}
                value={form.requirements}
                onChange={(event) => setField("requirements", event.target.value)}
              />
            </Field>
            <Field label="Qualifications">
              <Textarea
                rows={4}
                value={form.qualifications}
                onChange={(event) => setField("qualifications", event.target.value)}
              />
            </Field>
            <Field label="Benefits">
              <Textarea
                rows={3}
                value={form.benefits}
                onChange={(event) => setField("benefits", event.target.value)}
              />
            </Field>
            <Field label="Tech stack / tools">
              <Input
                value={form.tech_stack}
                onChange={(event) => setField("tech_stack", event.target.value)}
                placeholder="React, TypeScript, Excel"
              />
            </Field>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={saveJob} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingJob ? "Simpan" : "Tambah"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function buildPayload(form: JobForm): Partial<JobListing> {
  return {
    slug: slugify(form.slug || buildSlug(form.title, form.company, form.location)),
    title: form.title.trim(),
    company: form.company.trim(),
    company_logo: form.company_logo.trim() || null,
    location: form.location.trim(),
    type: form.type,
    level: form.level,
    industry: form.industry.trim() || null,
    salary_min: form.salary_min ? Number(form.salary_min) : null,
    salary_max: form.salary_max ? Number(form.salary_max) : null,
    salary_currency: form.salary_currency.trim().toUpperCase() || "IDR",
    salary_period: form.salary_period,
    description: form.description.trim(),
    responsibilities: form.responsibilities.trim() || null,
    requirements: form.requirements.trim() || null,
    qualifications: form.qualifications.trim() || null,
    benefits: form.benefits.trim() || null,
    tech_stack: form.tech_stack.trim() || null,
    work_mode: form.work_mode || null,
    deadline: form.deadline || null,
    source_url: form.source_url.trim() || null,
    is_active: form.is_active,
    updated_at: new Date().toISOString(),
  };
}

function AdminJobsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lowongan</TableHead>
            <TableHead>Perusahaan</TableHead>
            <TableHead>Lokasi</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Diposting</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: PAGE_SIZE }).map((_, index) => (
            <TableRow key={index}>
              <TableCell className="min-w-[260px]">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-full max-w-xl" />
                </div>
              </TableCell>
              <TableCell className="min-w-40">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </TableCell>
              <TableCell className="min-w-32">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-10 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
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

function workModeLabel(value: string) {
  const map: Record<string, string> = {
    onsite: "On-site",
    remote: "Remote",
    hybrid: "Hybrid",
  };
  return map[value] ?? value;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildSlug(...parts: string[]) {
  return slugify(parts.filter(Boolean).join(" "));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value.toLocaleString("id-ID")}</p>
    </div>
  );
}
