import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronRight, Clock, FileEdit, FileText, Pencil, Plus } from "lucide-react";
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
  "bg-primary/10 text-primary",
  "bg-sky-500/10 text-sky-700",
  "bg-violet-500/10 text-violet-700",
  "bg-amber-500/10 text-amber-700",
];

export function RecentCvs({ cvs, onCreateCv }: RecentCvsProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            CV workspace
          </p>
          <h2 className="font-display text-xl font-bold text-foreground">CV terbaru</h2>
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link to="/cv">
            Lihat semua
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {cvs.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-foreground">
            Mulai dari satu CV kuat
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            Buat CV pertamamu, lalu gunakan AI untuk memperjelas pengalaman, bukti, dan keyword.
          </p>
          {onCreateCv ? (
            <Button onClick={onCreateCv} className="mt-5 gap-2">
              <Plus className="h-4 w-4" />
              Buat CV Pertama
            </Button>
          ) : (
            <Button asChild className="mt-5 gap-2">
              <Link to="/cv">
                <Plus className="h-4 w-4" />
                Buat CV Pertama
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {cvs.slice(0, 4).map((cv, idx) => {
            const tpl = TEMPLATES.find((t) => t.id === cv.template_id);
            const isDraft = cv.status === "draft";
            const updatedDate = new Date(cv.updated_at);
            const diffMs = new Date().getTime() - updatedDate.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const timeAgo =
              diffDays === 0
                ? "Hari ini"
                : diffDays === 1
                  ? "Kemarin"
                  : diffDays < 7
                    ? `${diffDays} hari lalu`
                    : updatedDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" });

            return (
              <Link
                key={cv.id}
                to="/cv/$id"
                params={{ id: cv.id }}
                className="group rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                      accentClasses[idx % accentClasses.length],
                    )}
                  >
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                      {cv.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{tpl?.name ?? cv.template_id}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "hidden gap-1 text-[10px] font-semibold sm:inline-flex",
                        isDraft
                          ? "border-amber-400/50 text-amber-700"
                          : "border-primary/30 text-primary",
                      )}
                    >
                      {isDraft ? (
                        <FileEdit className="h-3 w-3" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      {isDraft ? "Draft" : "Selesai"}
                    </Badge>
                    <Pencil className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
