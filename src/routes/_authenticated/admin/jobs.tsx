import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { buildSeo } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  AlertCircle,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Search,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/jobs")({
  head: () =>
    buildSeo({
      title: "Admin Lowongan - CV Pintar",
      description: "Kelola import lowongan kerja.",
      path: "/admin/jobs",
      noindex: true,
    }),
  component: AdminJobsPage,
});

type Source = "linkedin" | "jobstreet" | "glints" | "kalibrr" | "google";

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

  const toggleSource = (source: Source) => {
    setSources((current) =>
      current.includes(source) ? current.filter((item) => item !== source) : [...current, source],
    );
  };

  const runSearch = async () => {
    const cleanQuery = query.trim();
    const cleanLocation = location.trim() || "Indonesia";

    if (!cleanQuery) {
      toast.error("Keyword posisi wajib diisi.");
      return;
    }

    if (sources.length === 0) {
      toast.error("Pilih minimal satu sumber.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      if (!token || !supabaseUrl) {
        throw new Error("Session admin tidak valid. Silakan login ulang.");
      }

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
      if (!response.ok) {
        throw new Error(payload.error || "Gagal menjalankan AI search.");
      }

      setResult(payload);
      toast.success(`${payload.inserted || 0} lowongan masuk ke database.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menjalankan AI search.";
      setResult({ error: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

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
              Cari dan import lowongan kerja.
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              AI akan mencoba membaca halaman sumber asli, lalu menyusun job description,
              requirements, dan qualifications sebelum menyimpan ke tabel job_listings.
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link to="/lowongan">
              Lihat Public Page <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
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
