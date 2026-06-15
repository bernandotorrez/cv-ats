import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/ui/back-button";
import {
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  ArrowRight,
  BookmarkCheck,
  Building2,
  ExternalLink,
  MapPin,
  Calendar,
  Clock,
  FileText,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Eye,
  PhoneCall,
  Monitor,
  Gift,
  Ban,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/lamaran")({
  head: () =>
    buildSeo({
      title: "Pelacak Lamaran — CV Pintar",
      description: "Lacak status lamaran kerja.",
      path: "/lamaran",
      noindex: true,
    }),
  component: LamaranPage,
});

const STATUSES = [
  {
    id: "applied",
    label: "Applied",
    icon: Briefcase,
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    id: "viewed",
    label: "Dilihat",
    icon: Eye,
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  {
    id: "interview",
    label: "Interview",
    icon: PhoneCall,
    color: "bg-warning/20 text-warning border-warning/30",
  },
  {
    id: "technical_test",
    label: "Tes Teknis",
    icon: Monitor,
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  {
    id: "offering",
    label: "Offering",
    icon: Gift,
    color: "bg-green-100 text-green-700 border-green-200",
  },
  {
    id: "accepted",
    label: "Diterima",
    icon: CheckCircle2,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  {
    id: "rejected",
    label: "Ditolak",
    icon: XCircle,
    color: "bg-red-100 text-red-700 border-red-200",
  },
  {
    id: "withdrawn",
    label: "Ditarik",
    icon: Ban,
    color: "bg-muted text-muted-foreground border-border",
  },
];

const SOURCES = [
  "LinkedIn",
  "JobStreet",
  "Glints",
  "Kalibrr",
  "Website Perusahaan",
  "Referral",
  "Lainnya",
];

interface Application {
  id: string;
  position: string;
  company: string;
  location: string;
  applied_date: string;
  status: string;
  notes: string;
  source: string;
  contact_name: string;
  contact_email: string;
  follow_up_date: string;
  cv_id: string;
  created_at: string;
  cv_title?: string;
}

interface CvOption {
  id: string;
  title: string;
}

interface CvRow {
  id: string;
  title: string;
}

interface ApplicationRow extends Omit<Application, "cv_title"> {
  cvs?: { title?: string | null } | null;
}

interface SavedJobListing {
  id: string;
  saved_at: string;
  job: {
    id: string;
    slug: string;
    title: string;
    company: string;
    location: string;
    type: string;
    level: string;
    source_url?: string | null;
    created_at: string;
  };
}

interface SavedJobRow {
  id: string;
  created_at: string;
  job_listings: SavedJobListing["job"] | SavedJobListing["job"][] | null;
}

interface TableResult<T> {
  data: T[] | null;
  error: { message?: string } | null;
}

interface MutationResult {
  error: { message?: string } | null;
}

type CvsQuery = {
  select: (columns: string) => {
    eq: (
      column: string,
      value: string,
    ) => {
      order: (column: string, options: { ascending: boolean }) => Promise<TableResult<CvRow>>;
    };
  };
};

type JobApplicationsQuery = {
  select: (columns: string) => {
    eq: (
      column: string,
      value: string,
    ) => {
      order: (
        column: string,
        options: { ascending: boolean },
      ) => Promise<TableResult<ApplicationRow>>;
    };
  };
  insert: (row: Record<string, unknown>) => Promise<MutationResult>;
  update: (row: Record<string, unknown>) => {
    eq: (column: string, value: string) => Promise<MutationResult>;
  };
  delete: () => {
    eq: (column: string, value: string) => Promise<MutationResult>;
  };
};

type SavedJobListingsQuery = {
  select: (columns: string) => {
    eq: (
      column: string,
      value: string,
    ) => {
      order: (column: string, options: { ascending: boolean }) => Promise<TableResult<SavedJobRow>>;
    };
  };
  delete: () => {
    eq: (
      column: string,
      value: string,
    ) => {
      eq: (column: string, value: string) => Promise<MutationResult>;
    };
  };
};

function cvsTable() {
  return supabase.from("cvs") as unknown as CvsQuery;
}

function jobApplicationsTable() {
  return supabase.from("job_applications") as unknown as JobApplicationsQuery;
}

function savedJobListingsTable() {
  return supabase.from("saved_job_listings") as unknown as SavedJobListingsQuery;
}

function mapSavedJobs(rows: SavedJobRow[]): SavedJobListing[] {
  return rows.flatMap((row) => {
    const job = Array.isArray(row.job_listings) ? row.job_listings[0] : row.job_listings;
    if (!job) return [];
    return [{ id: row.id, saved_at: row.created_at, job }];
  });
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

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

function LamaranPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJobListing[]>([]);
  const [removingSavedId, setRemovingSavedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    position: "",
    company: "",
    location: "",
    applied_date: new Date().toISOString().split("T")[0],
    status: "applied",
    notes: "",
    source: "",
    contact_name: "",
    contact_email: "",
    follow_up_date: "",
    cv_id: "",
  });
  const [userCvs, setUserCvs] = useState<CvOption[]>([]);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data: cvs } = await cvsTable()
      .select("id, title")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    setUserCvs(cvs ?? []);

    const { data: savedRows } = await savedJobListingsTable()
      .select(
        "id, created_at, job_listings(id, slug, title, company, location, type, level, source_url, created_at)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setSavedJobs(mapSavedJobs(savedRows ?? []));

    const { data: apps } = await jobApplicationsTable()
      .select("*, cvs(title)")
      .eq("user_id", user.id)
      .order("applied_date", { ascending: false });

    const mapped = (apps ?? []).map((a) => ({
      ...a,
      cv_title: a.cvs?.title ?? null,
    }));
    setApplications(mapped);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    void loadData();
  }, [loadData, user?.id]);

  const openNew = () => {
    setEditingId(null);
    setForm({
      position: "",
      company: "",
      location: "",
      applied_date: new Date().toISOString().split("T")[0],
      status: "applied",
      notes: "",
      source: "",
      contact_name: "",
      contact_email: "",
      follow_up_date: "",
      cv_id: "",
    });
    setShowForm(true);
  };

  const openFromSavedJob = (savedJob: SavedJobListing) => {
    setEditingId(null);
    setForm({
      position: savedJob.job.title,
      company: savedJob.job.company,
      location: savedJob.job.location ?? "",
      applied_date: new Date().toISOString().split("T")[0],
      status: "applied",
      notes: "",
      source: savedJob.job.source_url ? "Website Perusahaan" : "",
      contact_name: "",
      contact_email: "",
      follow_up_date: "",
      cv_id: "",
    });
    setShowForm(true);
  };

  const openEdit = (app: Application) => {
    setEditingId(app.id);
    setForm({
      position: app.position,
      company: app.company,
      location: app.location ?? "",
      applied_date: app.applied_date,
      status: app.status,
      notes: app.notes ?? "",
      source: app.source ?? "",
      contact_name: app.contact_name ?? "",
      contact_email: app.contact_email ?? "",
      follow_up_date: app.follow_up_date ?? "",
      cv_id: app.cv_id ?? "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.position || !form.company) {
      toast.error("Posisi dan perusahaan wajib diisi.");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      user_id: user!.id,
      cv_id: form.cv_id || null,
      follow_up_date: form.follow_up_date || null,
    };
    let error: MutationResult["error"];
    if (editingId) {
      ({ error } = await jobApplicationsTable().update(payload).eq("id", editingId));
    } else {
      ({ error } = await jobApplicationsTable().insert(payload));
    }
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editingId ? "Lamaran diperbarui!" : "Lamaran ditambahkan!");
    setShowForm(false);
    void loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus lamaran ini?")) return;
    const { error } = await jobApplicationsTable().delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Lamaran dihapus.");
    void loadData();
  };

  const handleRemoveSavedJob = async (jobId: string) => {
    if (!user?.id || removingSavedId) return;
    setRemovingSavedId(jobId);
    const { error } = await savedJobListingsTable()
      .delete()
      .eq("user_id", user.id)
      .eq("job_listing_id", jobId);
    setRemovingSavedId(null);

    if (error) {
      toast.error(error.message || "Gagal menghapus lowongan tersimpan.");
      return;
    }

    setSavedJobs((current) => current.filter((savedJob) => savedJob.job.id !== jobId));
    toast.success("Lowongan dihapus dari simpanan.");
  };

  const getStats = () => {
    const total = applications.length;
    const active = applications.filter(
      (a) => !["accepted", "rejected", "withdrawn"].includes(a.status),
    ).length;
    const interview = applications.filter((a) => a.status === "interview").length;
    const success = applications.filter((a) => a.status === "accepted").length;
    return { total, active, interview, success };
  };

  const statusApps = (status: string) => applications.filter((a) => a.status === status);

  if (loading) {
    return (
      <div className="container-page py-10">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid gap-4 grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="font-display text-2xl font-bold">Pelacak Lamaran</h1>
            <p className="text-sm text-muted-foreground">
              Lacak status lamaran kerja kamu dalam satu tempat.
            </p>
          </div>
        </div>
        <Button onClick={openNew} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Tambah Lamaran
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          { icon: Briefcase, label: "Total Lamaran", value: stats.total, color: "text-blue-500" },
          { icon: Clock, label: "Aktif", value: stats.active, color: "text-warning" },
          { icon: PhoneCall, label: "Interview", value: stats.interview, color: "text-purple-500" },
          { icon: CheckCircle2, label: "Diterima", value: stats.success, color: "text-green-500" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</p>
                </div>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="mb-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <BookmarkCheck className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Lowongan tersimpan</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Kumpulkan peluang yang menarik, lalu ubah jadi catatan lamaran saat kamu sudah apply.
            </p>
          </div>
          <Badge variant="secondary">{savedJobs.length} tersimpan</Badge>
        </div>

        {savedJobs.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {savedJobs.map((savedJob) => (
              <Card key={savedJob.id} className="border-border/80">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold leading-snug text-foreground">
                        {savedJob.job.title}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        {savedJob.job.company}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {typeLabel(savedJob.job.type)}
                    </Badge>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {savedJob.job.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Disimpan {formatShortDate(savedJob.saved_at)}
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button
                      size="sm"
                      className="justify-center gap-2"
                      onClick={() => openFromSavedJob(savedJob)}
                    >
                      <Plus className="h-4 w-4" />
                      Jadikan lamaran
                    </Button>
                    <Button asChild size="sm" variant="outline" className="justify-center gap-2">
                      <Link to="/lowongan/$slug" params={{ slug: savedJob.job.slug }}>
                        Detail
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    {savedJob.job.source_url && (
                      <Button asChild size="sm" variant="ghost" className="justify-center gap-2">
                        <a href={savedJob.job.source_url} target="_blank" rel="noopener noreferrer">
                          Sumber
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="justify-center gap-2 text-muted-foreground hover:text-destructive"
                      disabled={removingSavedId === savedJob.job.id}
                      onClick={() => handleRemoveSavedJob(savedJob.job.id)}
                    >
                      {removingSavedId === savedJob.job.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Hapus
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <BookmarkCheck className="mb-3 h-9 w-9 text-muted-foreground" />
              <h3 className="font-semibold">Belum ada lowongan tersimpan</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Simpan lowongan dari halaman lowongan agar muncul di sini.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/lowongan">Cari lowongan</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Kanban Board */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${STATUSES.length}, minmax(200px, 1fr))` }}
      >
        {STATUSES.map((status) => {
          const apps = statusApps(status.id);
          const StatusIcon = status.icon;
          return (
            <div key={status.id} className="flex flex-col min-h-[300px]">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div
                  className={cn("rounded-md px-2 py-1 text-xs font-medium border", status.color)}
                >
                  {status.label}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {apps.length}
                </Badge>
              </div>
              <div className="flex-1 space-y-2">
                {apps.map((app) => (
                  <div
                    key={app.id}
                    className="rounded-lg border border-border bg-card p-3 hover:shadow-sm transition-shadow cursor-pointer group"
                    onClick={() => openEdit(app)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{app.position}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3" /> {app.company}
                        </p>
                        {app.location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" /> {app.location}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />{" "}
                          {new Date(app.applied_date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(app.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {app.cv_title && (
                      <Badge variant="outline" className="text-xs mt-2">
                        <FileText className="h-3 w-3 mr-1" /> {app.cv_title}
                      </Badge>
                    )}
                  </div>
                ))}
                {apps.length === 0 && (
                  <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">-</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Lamaran" : "Tambah Lamaran"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Perbarui detail lamaran kerja."
                : "Catat lamaran kerja baru yang sudah kamu kirim."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="position">Posisi *</Label>
                <Input
                  id="position"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  placeholder="Software Engineer"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company">Perusahaan *</Label>
                <Input
                  id="company"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="PT. Example"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="location">Lokasi</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Jakarta"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="applied_date">Tanggal Apply</Label>
                <Input
                  id="applied_date"
                  type="date"
                  value={form.applied_date}
                  onChange={(e) => setForm({ ...form, applied_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Sumber</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih sumber" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>CV Terkait</Label>
              <Select value={form.cv_id} onValueChange={(v) => setForm({ ...form, cv_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih CV" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tanpa CV</SelectItem>
                  {userCvs.map((cv) => (
                    <SelectItem key={cv.id} value={cv.id}>
                      {cv.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="contact_name">Nama Kontak</Label>
                <Input
                  id="contact_name"
                  value={form.contact_name}
                  onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                  placeholder="HR / Recruiter"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact_email">Email Kontak</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  placeholder="hr@company.com"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Catatan pribadi..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {editingId ? "Simpan Perubahan" : "Tambah Lamaran"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {applications.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="font-semibold">Belum ada lamaran</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Mulai lacak lamaran kerja kamu di sini.
          </p>
          <Button onClick={openNew} className="mt-4">
            <Plus className="h-4 w-4 mr-1" /> Tambah Lamaran Pertama
          </Button>
        </div>
      )}
    </div>
  );
}
