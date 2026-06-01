import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, Plus, ChevronRight, Upload, Sparkles } from "lucide-react";
import { TEMPLATES } from "@/lib/cv-types";
import { cn } from "@/lib/utils";

interface CvRow {
  id: string;
  title: string;
  template_id: string;
  updated_at: string;
}

interface CvPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cvs: CvRow[];
  action: string | null;
  onSelect: (cvId: string) => void;
}

const actionLabels: Record<string, string> = {
  "cv-review": "CV Review AI",
  score: "CV Scoring",
  "ai-suggest": "AI Saran CV",
  "cover-letter": "Cover Letter AI",
  "keyword-extractor": "Keyword Extractor",
  "tailor-cv": "Auto Tailor CV",
};

export function CvPickerDialog({ open, onOpenChange, cvs, action, onSelect }: CvPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Pilih CV untuk {actionLabels[action ?? ""] ?? "Fitur Ini"}
          </DialogTitle>
          <DialogDescription>Pilih CV yang ingin kamu gunakan.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2 max-h-[40vh] overflow-y-auto">
          {cvs.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft">
                <FileText className="h-7 w-7 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Belum ada CV. Buat dulu ya!</p>
            </div>
          ) : (
            cvs.map((cv, idx) => {
              const tpl = TEMPLATES.find((t) => t.id === cv.template_id);
              return (
                <button
                  key={cv.id}
                  onClick={() => onSelect(cv.id)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all",
                    "hover:border-primary/50 hover:bg-primary/5 hover:shadow-md",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br",
                      idx % 2 === 0
                        ? "from-primary/20 to-secondary/20"
                        : "from-violet-500/20 to-purple-500/20",
                    )}
                  >
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{cv.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {tpl?.name ?? cv.template_id} ·{" "}
                      {new Date(cv.updated_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              );
            })
          )}
        </div>

        {action === "cv-review" && cvs.length > 0 && (
          <>
            <Separator />
            <div className="flex justify-center pb-1">
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link to="/cv-review">
                  <Upload className="h-4 w-4" /> Upload CV Saya
                </Link>
              </Button>
            </div>
          </>
        )}
        {cvs.length === 0 && (
          <div className="flex justify-center pb-2">
            <Button asChild className="gap-2">
              <Link to="/cv">
                <Plus className="h-4 w-4" /> Buat CV Baru
              </Link>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
