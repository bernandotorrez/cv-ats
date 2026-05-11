import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/site/PageHero";
import { supabase } from "@/integrations/supabase/client";
import {
  MapPin, Building2, Clock, DollarSign, Briefcase,
  ArrowLeft, FileText, ExternalLink, Calendar, GraduationCap,
} from "lucide-react";

export const Route = createFileRoute("/lowongan/$slug")({
  loader: async ({ params }: { params: { slug: string } }) => {
    const { data, error } = await (supabase as any)
      .from("job_listings")
      .select("*")
      .eq("slug", params.slug)
      .eq("is_active", true)
      .single();
    if (error || !data) throw notFound();
    return data;
  },
  head: ({ loaderData }: any) => {
    if (!loaderData) return { meta: [{ title: "Lowongan tidak ditemukan" }], links: [], scripts: [] };
    return buildSeo({
      title: `Lowongan ${loaderData.title} di ${loaderData.company} — CV Pintar`,
      description: loaderData.description?.substring(0, 160) ?? `Lowongan ${loaderData.title} di ${loaderData.company}, ${loaderData.location}.`,
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

function LowonganDetailPage() {
  const job = Route.useLoaderData() as any;

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
    const fmt = (n: number) => n >= 1000000 ? `Rp ${(n / 1000000).toFixed(0)}jt` : `Rp ${(n / 1000).toFixed(0)}rb`;
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    return min ? `Mulai ${fmt(min)}` : `Hingga ${fmt(max!)}`;
  };

  const salaryText = formatSalary(job.salary_min, job.salary_max);

  return (
    <div>
      <PageHero
        title={job.title}
        description={`Lowongan ${job.title} di ${job.company}, ${job.location}.`}
      />

      <div className="container-page py-8">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/lowongan"><ArrowLeft className="h-4 w-4 mr-1.5" /> Kembali ke Lowongan</Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">{typeLabel(job.type)}</Badge>
                  <Badge variant="outline">{levelLabel(job.level)}</Badge>
                  {job.industry && <Badge variant="outline">{job.industry}</Badge>}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                  <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {job.company}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {job.location}</span>
                  {salaryText && <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> {salaryText}</span>}
                  <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Diposting {new Date(job.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>

                <h2 className="font-semibold text-lg mb-3">Deskripsi Pekerjaan</h2>
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                  {job.description}
                </div>

                {job.requirements && (
                  <>
                    <h2 className="font-semibold text-lg mt-6 mb-3">Persyaratan</h2>
                    <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                      {job.requirements}
                    </div>
                  </>
                )}

                {job.qualifications && (
                  <>
                    <h2 className="font-semibold text-lg mt-6 mb-3">Kualifikasi</h2>
                    <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                      {job.qualifications}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* CTA Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6 text-center">
                <FileText className="mx-auto h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold">Siap Melamar?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Buat CV ATS-friendly dalam 1 menit dan tingkatkan peluang lolos screening.
                </p>
                <Button asChild className="w-full mt-4">
                  <Link to="/register">Buat CV Gratis</Link>
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Sudah punya akun? <Link to="/login" search={{ redirect: "/dashboard" }} className="text-primary hover:underline">Login</Link>
                </p>
              </CardContent>
            </Card>

            {/* Job Info Card */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="font-medium text-sm">Ringkasan</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{typeLabel(job.type)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span>{levelLabel(job.level)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{job.location}</span>
                  </div>
                  {salaryText && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{salaryText}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {job.source_url && (
              <Button asChild variant="outline" className="w-full gap-1.5">
                <a href={job.source_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" /> Lihat Sumber Asli
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
