import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHero } from "@/components/site/PageHero";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton-loading";
import {
  Search, MapPin, Building2, Briefcase, Clock, DollarSign,
  ArrowRight, GraduationCap, Filter, ChevronDown, FileText,
  Sparkles, Zap, BookOpen
} from "lucide-react";

export const Route = createFileRoute("/lowongan")({
  head: () => buildSeo({
    title: "Lowongan Pekerjaan — CV Pintar",
    description: "Temukan lowongan kerja terbaru. Buat CV ATS-friendly dan lamar dengan percaya diri.",
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
  company_logo: string;
  location: string;
  type: string;
  level: string;
  industry: string;
  salary_min: number;
  salary_max: number;
  description: string;
  created_at: string;
}

const typeOptions = ["Semua Tipe", "full-time", "part-time", "contract", "internship"];
const levelOptions = ["Semua Level", "entry", "mid", "senior", "manager", "director"];
const locationOptions = ["Semua Lokasi", "Jakarta", "Bandung", "Surabaya", "Medan", "Yogyakarta", "Remote"];

function LowonganPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Semua Tipe");
  const [levelFilter, setLevelFilter] = useState("Semua Level");
  const [locationFilter, setLocationFilter] = useState("Semua Lokasi");

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("job_listings")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    setJobs((data as Job[]) ?? []);
    setLoading(false);
  };

  const filtered = jobs.filter(j => {
    const matchSearch = !search || 
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "Semua Tipe" || j.type === typeFilter;
    const matchLevel = levelFilter === "Semua Level" || j.level === levelFilter;
    const matchLocation = locationFilter === "Semua Lokasi" || 
      (locationFilter === "Remote" ? j.location.toLowerCase().includes("remote") : j.location.includes(locationFilter));
    return matchSearch && matchType && matchLevel && matchLocation;
  });

  const typeLabel = (t: string) => {
    const map: Record<string, string> = { "full-time": "Full Time", "part-time": "Part Time", "contract": "Kontrak", "internship": "Magang" };
    return map[t] ?? t;
  };

  const levelLabel = (l: string) => {
    const map: Record<string, string> = { entry: "Entry Level", mid: "Mid Level", senior: "Senior", manager: "Manager", director: "Director" };
    return map[l] ?? l;
  };

  const formatSalary = (min: number, max: number) => {
    if (!min && !max) return null;
    const fmt = (n: number) => {
      if (n >= 1000000) return `Rp ${(n / 1000000).toFixed(0)}jt`;
      return `Rp ${(n / 1000).toFixed(0)}rb`;
    };
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `Mulai ${fmt(min)}`;
    return `Hingga ${fmt(max!)}`;
  };

  const jsonLd = {
    "@type": "ItemList",
    itemListElement: filtered.slice(0, 10).map((j, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "JobPosting",
        title: j.title,
        description: j.description?.substring(0, 200),
        datePosted: j.created_at,
        hiringOrganization: { "@type": "Organization", name: j.company },
        jobLocation: { "@type": "Place", address: { addressLocality: j.location } },
      }
    }))
  };

  return (
    <div>
      <PageHero
        title="Lowongan Pekerjaan"
        description="Temukan lowongan kerja terbaru. Buat CV ATS-friendly dan lamar dengan percaya diri."
      />

      <div className="container-page py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari posisi atau perusahaan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>{typeOptions.map(t => <SelectItem key={t} value={t}>{t === "Semua Tipe" ? t : typeLabel(t)}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>{levelOptions.map(l => <SelectItem key={l} value={l}>{l === "Semua Level" ? l : levelLabel(l)}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>{locationOptions.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {/* Job Cards */}
        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-lg">Tidak ada lowongan</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {jobs.length === 0 ? "Belum ada lowongan tersedia saat ini. Cek lagi nanti!" : "Coba ubah filter pencarian."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((job) => (
              <Link key={job.id} to="/lowongan/$slug" params={{ slug: job.slug }}>
                <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <h3 className="font-semibold text-base group-hover:text-primary transition-colors">{job.title}</h3>
                          <Badge variant="secondary" className="text-xs">{typeLabel(job.type)}</Badge>
                          <Badge variant="outline" className="text-xs">{levelLabel(job.level)}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {job.company}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
                          {job.salary_min && job.salary_max && (
                            <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> {formatSalary(job.salary_min, job.salary_max)}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{job.description}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(job.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <section className="space-y-6">
          <Card className="bg-gradient-to-br from-primary via-primary/90 to-blue-600 border-0 text-white">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="p-4 rounded-full bg-white/20 w-fit mx-auto mb-6">
                <Sparkles className="w-12 h-12" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Buatkan CV ATS-mu Sekarang!
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Tak perlu repot-edit manual. AI kami otomatis menyarankan keyword, mengoreksi struktur, dan memberi skor ATS sebelum kamu kirim lamaran.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/cv" 
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary font-semibold rounded-xl hover:bg-white/90 transition-all hover:scale-105 shadow-lg"
                >
                  <Zap className="w-5 h-5" />
                  Buat CV dengan AI
                </a>
                <a 
                  href="/template" 
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
                >
                  <BookOpen className="w-5 h-5" />
                  Lihat Templates
                </a>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
