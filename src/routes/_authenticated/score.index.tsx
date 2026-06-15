import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, BarChart3, FileText, Plus, Sparkles, Target } from "lucide-react";
import { buildSeo } from "@/lib/seo";
import { BackButton } from "@/components/ui/back-button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { TEMPLATES } from "@/lib/cv-types";

export const Route = createFileRoute("/_authenticated/score/")({
  head: () =>
    buildSeo({
      title: "CV ATS Scoring - CV Pintar",
      description: "Pilih CV untuk mengecek skor ATS, keyword, struktur, dan relevansi lamaran.",
      path: "/score",
      noindex: true,
    }),
  component: AtsScoreIndexPage,
});

interface CvRow {
  id: string;
  title: string;
  template_id: string;
  status: string;
  updated_at: string;
}

function AtsScoreIndexPage() {
  const { user } = useAuth();
  const [cvs, setCvs] = useState<CvRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadCvs() {
      if (!user?.id) return;

      setLoading(true);
      const { data } = await supabase
        .from("cvs")
        .select("id, title, template_id, status, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (active) {
        setCvs((data ?? []) as CvRow[]);
        setLoading(false);
      }
    }

    void loadCvs();
    return () => {
      active = false;
    };
  }, [user?.id]);

  return (
    <div className="container-page space-y-6 py-5 md:py-8">
      <BackButton />
      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_0.75fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <BarChart3 className="h-3.5 w-3.5" />
              ATS Scoring
            </div>
            <h1 className="font-display text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
              Pilih CV yang mau dicek ATS.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Cek struktur CV, keyword, kekuatan profil, dan peluang lolos screening sebelum kamu
              kirim lamaran.
            </p>
          </div>
          <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-emerald-50 to-sky-50 p-4">
            <div className="grid gap-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-primary shadow-sm">
                  <Target className="h-4 w-4" />
                </span>
                <span className="font-medium">Relevansi dengan target posisi</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-primary shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="font-medium">Saran perbaikan yang siap dikerjakan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : cvs.length === 0 ? (
        <section className="rounded-2xl border bg-card p-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold">Belum ada CV untuk dicek</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Buat atau import CV dulu, lalu kembali ke ATS Scoring untuk mulai analisis.
          </p>
          <Button asChild className="mt-5 gap-2">
            <Link to="/cv">
              <Plus className="h-4 w-4" />
              Kelola CV
            </Link>
          </Button>
        </section>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cvs.map((cv) => {
            const template = TEMPLATES.find((item) => item.id === cv.template_id);
            return (
              <Link
                key={cv.id}
                to="/score/$cvId"
                params={{ cvId: cv.id }}
                className="group rounded-2xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <Badge variant={cv.status === "published" ? "default" : "secondary"}>
                    {cv.status === "published" ? "Selesai" : "Draft"}
                  </Badge>
                </div>
                <h2 className="mt-4 line-clamp-2 font-display text-lg font-bold text-foreground">
                  {cv.title}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {template?.name ?? cv.template_id} · Update{" "}
                  {new Date(cv.updated_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <div className="mt-5 flex items-center justify-between text-sm font-semibold text-primary">
                  <span>Mulai scoring</span>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
