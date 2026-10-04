import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, FileText, Plus } from "lucide-react";
import { TEMPLATES } from "@/lib/cv-types";
import { cn } from "@/lib/utils";

interface CvRow {
  id: string;
  title: string;
  template_id: string;
  status: string;
  updated_at: string;
  ats_score?: number | null;
}

interface RecentCvsProps {
  cvs: CvRow[];
  loading: boolean;
  onCreateCv?: () => void;
}

function timeAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (days <= 0) return "Diperbarui hari ini";
  if (days === 1) return "Diperbarui kemarin";
  if (days < 7) return `Diperbarui ${days} hari lalu`;
  if (days < 30) return `Diperbarui ${Math.floor(days / 7)} minggu lalu`;
  return (
    "Diperbarui " +
    new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  );
}

function scoreTone(score: number) {
  if (score >= 80) return { cls: "bg-primary/10 text-primary", label: "Siap kirim" };
  if (score >= 60) return { cls: "bg-amber-100 text-amber-800", label: "Bisa ditingkatkan" };
  return { cls: "bg-red-100 text-red-700", label: "Perlu perbaikan" };
}

export function RecentCvs({ cvs, onCreateCv }: RecentCvsProps) {
  return (
    <section
      aria-labelledby="cvs-title"
      className="overflow-hidden rounded-3xl border bg-card shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5 sm:px-6">
        <div className="min-w-0">
          <h2 id="cvs-title" className="font-display text-xl font-extrabold tracking-tight">
            CV kamu
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Lanjutkan dari CV terakhir yang kamu edit.
          </p>
        </div>
        {cvs.length > 0 && (
          <Link
            to="/cv"
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-primary hover:bg-primary/5"
          >
            Lihat semua
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        )}
      </div>

      {cvs.length === 0 ? (
        <div className="px-5 pb-8 pt-4 text-center sm:px-6">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <FileText aria-hidden="true" className="h-7 w-7" />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold">Belum ada CV</h3>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Pilih template ATS-friendly dan isi bersama AI. Cuma butuh beberapa menit.
          </p>
          {onCreateCv && (
            <button
              type="button"
              onClick={onCreateCv}
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              Buat CV pertama
            </button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-border/70 border-t border-border/70">
          {cvs.slice(0, 4).map((cv) => {
            const tpl = TEMPLATES.find((t) => t.id === cv.template_id);
            const templateName = tpl?.name ?? cv.template_id;
            const score = typeof cv.ats_score === "number" ? cv.ats_score : null;
            const tone = score !== null ? scoreTone(score) : null;
            return (
              <li key={cv.id}>
                <Link
                  to="/cv/$id"
                  params={{ id: cv.id }}
                  className="group flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40 sm:gap-4 sm:px-6"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <FileText aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold group-hover:text-primary">
                      {cv.title}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span>Template {templateName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock aria-hidden="true" className="h-3 w-3" />
                        {timeAgo(cv.updated_at)}
                      </span>
                      {cv.status === "draft" && (
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                          Draft
                        </span>
                      )}
                    </span>
                  </span>
                  {tone && score !== null && (
                    <span className="flex shrink-0 flex-col items-end">
                      <span
                        className={cn(
                          "rounded-lg px-2.5 py-1 font-display text-lg font-extrabold leading-none tabular-nums",
                          tone.cls,
                        )}
                        aria-label={`Skor ATS ${score}`}
                      >
                        {score}
                      </span>
                      <span className="mt-1 hidden text-[11px] text-muted-foreground sm:block">
                        {tone.label}
                      </span>
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
