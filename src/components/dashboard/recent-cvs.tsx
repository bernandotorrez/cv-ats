import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  Clock,
  FileText,
  Plus,
  Pencil,
  Sparkles,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { TEMPLATES } from "@/lib/cv-types";
import { cn } from "@/lib/utils";

interface CvRow {
  id: string;
  title: string;
  template_id: string;
  status: string;
  updated_at: string;
}

interface RecentCvsProps {
  cvs: CvRow[];
  loading: boolean;
  onCreateCv?: () => void;
}

const accentClasses = [
  { bg: "bg-primary/10 text-primary", ring: "ring-primary/20" },
  { bg: "bg-emerald-500/10 text-emerald-700", ring: "ring-emerald-400/20" },
  { bg: "bg-violet-500/10 text-violet-700", ring: "ring-violet-400/20" },
  { bg: "bg-amber-500/10 text-amber-700", ring: "ring-amber-400/20" },
];

function timeAgo(dateStr: string): { label: string; isStale: boolean } {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  const isStale = days > 14;
  if (days === 0) return { label: "Hari ini", isStale: false };
  if (days === 1) return { label: "Kemarin", isStale: false };
  if (days < 7) return { label: `${days} hari lalu`, isStale: false };
  if (days < 30) return { label: `${Math.floor(days / 7)} minggu lalu`, isStale: days > 14 };
  return {
    label: new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
    isStale: true,
  };
}

export function RecentCvs({ cvs, onCreateCv }: RecentCvsProps) {
  return (
    <section className="rounded-2xl border bg-card border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <div>
          <h2 className="font-display text-base font-bold text-foreground">CV Kamu</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {cvs.length > 0 ? `${cvs.length} CV tersimpan — klik untuk edit` : "Belum ada CV"}
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-1 text-xs h-8">
          <Link to="/cv">
            Lihat semua
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {cvs.length === 0 ? (
        /* Empty state */
        <div className="px-5 py-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <h3 className="mt-4 font-display text-base font-bold text-foreground">
            Mulai dari satu CV yang kuat
          </h3>
          <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground leading-relaxed">
            Buat CV pertamamu dan gunakan AI untuk memperjelas pengalaman, bukti, dan keyword.
          </p>
          {onCreateCv ? (
            <Button onClick={onCreateCv} className="mt-5 gap-2" size="sm">
              <Plus className="h-4 w-4" />
              Buat CV Pertama
            </Button>
          ) : (
            <Button asChild className="mt-5 gap-2" size="sm">
              <Link to="/cv">
                <Plus className="h-4 w-4" />
                Buat CV Pertama
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {cvs.slice(0, 4).map((cv, idx) => {
            const tpl = TEMPLATES.find((t) => t.id === cv.template_id);
            const isDraft = cv.status === "draft";
            const { label: timeLabel, isStale } = timeAgo(cv.updated_at);
            const accent = accentClasses[idx % accentClasses.length];

            return (
              <Link
                key={cv.id}
                to="/cv/$id"
                params={{ id: cv.id }}
                className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/30"
              >
                {/* Icon */}
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
                    accent.bg,
                    accent.ring,
                  )}
                >
                  <FileText className="h-4.5 w-4.5" />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                    {cv.title}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="font-medium">{tpl?.name ?? cv.template_id}</span>
                    <span className="text-border">·</span>
                    <span
                      className={cn(
                        "flex items-center gap-0.5",
                        isStale && "text-amber-600 font-medium",
                      )}
                    >
                      {isStale ? (
                        <AlertCircle className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {timeLabel}
                    </span>
                  </div>
                </div>

                {/* Right side badges */}
                <div className="flex shrink-0 items-center gap-2">
                  {isStale && (
                    <Badge
                      variant="outline"
                      className="hidden text-[10px] font-semibold border-amber-400/50 text-amber-700 sm:inline-flex"
                    >
                      Perlu update
                    </Badge>
                  )}
                  {!isStale && isDraft && (
                    <Badge
                      variant="outline"
                      className="hidden text-[10px] font-semibold border-border text-muted-foreground sm:inline-flex"
                    >
                      Draft
                    </Badge>
                  )}
                  <Pencil className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                </div>
              </Link>
            );
          })}

          {/* Footer — quick create */}
          <div className="px-5 py-3 flex items-center justify-between bg-muted/20">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Perbarui CV secara rutin untuk hasil ATS terbaik
            </p>
            {onCreateCv && (
              <button
                type="button"
                onClick={onCreateCv}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />+ Buat baru
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
