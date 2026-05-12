import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Pencil, ChevronRight, Clock } from "lucide-react";
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
}

const templateColors = [
  "from-primary/20 to-secondary/20",
  "from-blue-500/20 to-cyan-500/20",
  "from-violet-500/20 to-purple-500/20",
  "from-amber-500/20 to-orange-500/20",
  "from-rose-500/20 to-pink-500/20",
];

export function RecentCvs({ cvs, loading }: RecentCvsProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📄</span>
          <h2 className="font-display text-lg font-bold text-foreground">CV Terbaru</h2>
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-primary">
          <Link to="/cv">
            Lihat semua <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {cvs.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground">Belum ada CV</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                Buat CV pertamamu sekarang — gratis, cepat, dan mudah!
              </p>
            </div>
            <Button asChild className="gap-2">
              <Link to="/cv">
                <Plus className="h-4 w-4" /> Buat CV Pertamamu
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {cvs.slice(0, 4).map((cv, idx) => {
            const tpl = TEMPLATES.find((t) => t.id === cv.template_id);
            const colorClass = templateColors[idx % templateColors.length];
            const isDraft = cv.status === "draft";
            const updatedDate = new Date(cv.updated_at);
            const now = new Date();
            const diffMs = now.getTime() - updatedDate.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            let timeAgo = "";
            if (diffDays === 0) timeAgo = "Hari ini";
            else if (diffDays === 1) timeAgo = "Kemarin";
            else if (diffDays < 7) timeAgo = `${diffDays} hari lalu`;
            else timeAgo = updatedDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" });

            return (
              <Link
                key={cv.id}
                to="/cv/$id"
                params={{ id: cv.id }}
                className="group flex items-center gap-4 rounded-2xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br",
                  colorClass,
                )}>
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                    {cv.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{tpl?.name ?? cv.template_id}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-semibold",
                      isDraft ? "border-warning/30 text-warning" : "border-primary/30 text-primary",
                    )}
                  >
                    {isDraft ? "📝 Draft" : "✅ Selesai"}
                  </Badge>
                  <Pencil className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
