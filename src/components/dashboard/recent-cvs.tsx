import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Clock,
  FileText,
  Plus,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
} from "lucide-react";
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

// Icon styling configurations matching mockup crop exactly
const rowStyles = [
  {
    bg: "bg-[#ecf7ed] border-[#d3ebd6] text-[#2e7d32]",
    text: "text-[#2e7d32]",
  },
  {
    bg: "bg-[#f3efff] border-[#e2d9ff] text-[#6236ff]",
    text: "text-[#6236ff]",
  },
  {
    bg: "bg-[#ebf8fe] border-[#d2f0fd] text-[#0284c7]",
    text: "text-[#0284c7]",
  },
  {
    bg: "bg-[#fffbeb] border-[#fef3c7] text-[#d97706]",
    text: "text-[#d97706]",
  },
];

function timeAgo(dateStr: string): { label: string; isStale: boolean } {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  const isStale = days > 14;
  if (days === 0) return { label: "Diperbarui hari ini", isStale: false };
  if (days === 1) return { label: "Diperbarui kemarin", isStale: false };
  if (days < 7) return { label: `Diperbarui ${days} hari lalu`, isStale: false };
  if (days < 30)
    return { label: `Diperbarui ${Math.floor(days / 7)} minggu lalu`, isStale: days > 14 };
  return {
    label:
      "Diperbarui " +
      new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
    isStale: true,
  };
}

export function RecentCvs({ cvs, onCreateCv }: RecentCvsProps) {
  return (
    <section className="w-full max-w-full rounded-3xl border bg-card border-border/80 shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 border-b border-border/60 gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-bold text-foreground">CV Kamu</h2>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Kelola semua CV dalam satu tempat.
          </p>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-1 text-xs text-gray-500 hover:text-gray-800 font-semibold shrink-0"
        >
          <Link to="/cv">
            Lihat semua CV
            <ArrowRight className="h-3.5 w-3.5" />
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
            <Button
              onClick={onCreateCv}
              className="mt-5 gap-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold shadow-md hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
              size="default"
            >
              <Plus className="h-4.5 w-4.5" />
              Buat CV Pertama
            </Button>
          ) : (
            <Button asChild className="mt-5 gap-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold shadow-md hover:shadow-lg transition-all duration-300 active:scale-[0.98]" size="default">
              <Link to="/cv">
                <Plus className="h-4.5 w-4.5" />
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
            const styleConfig = rowStyles[idx % rowStyles.length];

            // Replicate mockup's verified check marks only, but use actual template name
            const isFirst = idx === 0;
            const location = tpl?.name ?? (cv.template_id ? cv.template_id.charAt(0).toUpperCase() + cv.template_id.slice(1) : "");

            // Use dynamic timeAgo labels
            const timeAgoText = timeAgo(cv.updated_at).label;

            // Score configuration: use actual score or null if none is calculated/saved
            const score = cv.ats_score !== undefined && cv.ats_score !== null ? cv.ats_score : null;

            return (
              <div
                key={cv.id}
                className="group flex items-center justify-between px-3 py-3 sm:px-6 sm:py-4 transition-colors hover:bg-muted/30 gap-2"
              >
                {/* Clickable Info Area */}
                <Link
                  to="/cv/$id"
                  params={{ id: cv.id }}
                  className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0"
                >
                  {/* Styled Icon box */}
                  <div
                    className={cn(
                      "flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border transition-all duration-300",
                      styleConfig.bg,
                    )}
                  >
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm sm:text-[15px] font-bold text-foreground transition-colors group-hover:text-emerald-700">
                      {cv.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium text-gray-500">
                        {location}
                        {isFirst && (
                          <CheckCircle2
                            className="h-3.5 w-3.5 text-[#2e7d32] fill-[#ecf7ed]"
                            strokeWidth={2.5}
                          />
                        )}
                      </span>
                      <span className="text-border">·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgoText}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Score badge, status & action menu */}
                <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                  {/* ATS Score Circle */}
                  {score !== null && (
                    <div
                      className={cn(
                        "flex flex-col items-center justify-center rounded-full w-[38px] h-[38px] sm:w-[52px] sm:h-[52px] border shrink-0",
                        score >= 80
                          ? "bg-[#ecf7ed] border-[#d3ebd6] text-[#2e7d32]"
                          : "bg-[#fff8eb] border-[#fdf0d5] text-[#b76e00]",
                      )}
                    >
                      <span className="text-[14px] sm:text-[17px] font-extrabold leading-none tracking-tight">
                        {score}
                      </span>
                      <span className="text-[6.5px] sm:text-[7.5px] font-bold uppercase tracking-wider mt-0.5 opacity-80">
                        Skor
                      </span>
                    </div>
                  )}

                  {/* Status Badge */}
                  {isDraft && (
                    <Badge
                      variant="outline"
                      className="bg-[#f5f5f5] text-gray-500 border-none px-2.5 py-1 text-[11px] font-bold rounded-lg"
                    >
                      Draft
                    </Badge>
                  )}

                  {/* Actions Dropdown */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="p-1.5 rounded-lg hover:bg-muted text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Footer — quick actions */}
          <div className="px-4 py-3.5 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fafafa]">
            <p className="text-xs text-gray-500 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-400 shrink-0" />
              <span>Perbarui CV secara rutin untuk hasil ATS terbaik</span>
            </p>
            {onCreateCv && (
              <Button
                type="button"
                onClick={onCreateCv}
                className="w-full sm:w-auto gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold shadow-sm hover:shadow transition-all duration-300 shrink-0"
                size="sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Buat CV Baru
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
