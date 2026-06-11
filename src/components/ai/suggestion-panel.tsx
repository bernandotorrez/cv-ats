import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sparkles, Loader2, Check, RefreshCw, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuggestionOption {
  option: string;
  explanation: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  section: string;
  loading: boolean;
  suggestions: SuggestionOption[] | null;
  acceptedIndex: number | null;
  onAccept: (index: number, option: SuggestionOption) => void;
  onRegenerate: (index: number) => void;
  onRegenerateAll: () => void;
}

export function SuggestionPanel({
  open,
  onClose,
  section,
  loading,
  suggestions,
  acceptedIndex,
  onAccept,
  onRegenerate,
  onRegenerateAll,
}: Props) {
  const sectionLabel: Record<string, string> = {
    summary: "Ringkasan Profil",
    headline: "Headline",
    experience: "Deskripsi Pengalaman",
    education: "Deskripsi Pendidikan",
    skills: "Daftar Skill",
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        className="max-h-[85vh] overflow-y-auto sm:max-w-xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </span>
            Saran AI — {sectionLabel[section] || section}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Pilih saran terbaik yang cocok untuk CV kamu.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">AI sedang membuat saran...</p>
            </div>
          )}

          {!loading && suggestions && suggestions.length > 0 && (
            <>
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-xl border p-4 transition-colors",
                    acceptedIndex === i
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-background hover:border-primary/40",
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <Badge
                      variant={acceptedIndex === i ? "default" : "secondary"}
                      className="text-xs shrink-0"
                    >
                      Opsi {i + 1}
                    </Badge>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant={acceptedIndex === i ? "default" : "outline"}
                        className="h-7 gap-1 rounded-lg text-xs"
                        onClick={() => onAccept(i, s)}
                        disabled={acceptedIndex !== null}
                      >
                        {acceptedIndex === i ? (
                          <>
                            <Check className="h-3 w-3" /> Dipakai
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3" /> Pakai
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 rounded-lg text-xs"
                        onClick={() => onRegenerate(i)}
                        disabled={loading}
                        title="Buat ulang opsi ini"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{s.option}</div>
                  {s.explanation && (
                    <p className="mt-2 text-xs text-muted-foreground flex items-start gap-1.5">
                      <Lightbulb className="h-3 w-3 mt-0.5 shrink-0" />
                      {s.explanation}
                    </p>
                  )}
                </div>
              ))}

              <div className="flex justify-between items-center pt-2 border-t border-border/60">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={onRegenerateAll}
                  disabled={loading}
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Buat Ulang Semua
                </Button>
                <Button variant="ghost" size="sm" className="text-xs" onClick={onClose}>
                  Tutup
                </Button>
              </div>
            </>
          )}

          {!loading && (!suggestions || suggestions.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Gagal menghasilkan saran. Silakan coba lagi.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
