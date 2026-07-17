import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Wand2, Loader2, Check, RefreshCw, Zap, AlignLeft, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface PolishVariant {
  polished: string;
  tone: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  originalText: string;
  variants: PolishVariant[] | null;
  onAccept: (polished: string) => void;
  onRegenerateAll: () => void;
}

const TONE_ICONS: Record<string, React.ReactNode> = {
  Impactful: <Zap className="h-3 w-3 text-amber-500" />,
  "Jelas & Ringkas": <AlignLeft className="h-3 w-3 text-blue-500" />,
  "Clear & Concise": <AlignLeft className="h-3 w-3 text-blue-500" />,
  Kreatif: <Palette className="h-3 w-3 text-violet-500" />,
  Creative: <Palette className="h-3 w-3 text-violet-500" />,
};

const TONE_COLORS: Record<string, string> = {
  Impactful: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800",
  "Jelas & Ringkas": "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800",
  "Clear & Concise": "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800",
  Kreatif: "bg-violet-50 border-violet-200 dark:bg-violet-950/20 dark:border-violet-800",
  Creative: "bg-violet-50 border-violet-200 dark:bg-violet-950/20 dark:border-violet-800",
};

const TONE_BADGE_COLORS: Record<string, string> = {
  Impactful: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400",
  "Jelas & Ringkas": "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400",
  "Clear & Concise": "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400",
  Kreatif: "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/30 dark:text-violet-400",
  Creative: "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/30 dark:text-violet-400",
};

export function PolishPanel({
  open,
  onClose,
  loading,
  originalText,
  variants,
  onAccept,
  onRegenerateAll,
}: Props) {
  const [acceptedIndex, setAcceptedIndex] = useState<number | null>(null);

  function handleAccept(i: number, polished: string) {
    setAcceptedIndex(i);
    onAccept(polished);
    setTimeout(() => {
      setAcceptedIndex(null);
      onClose();
    }, 600);
  }

  function handleOpenChange(o: boolean) {
    if (!o) {
      setAcceptedIndex(null);
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Wand2 className="h-4 w-4 text-primary" />
            </span>
            AI Perbaiki Teks — 3 Pilihan Gaya
          </DialogTitle>
          <DialogDescription className="text-xs">
            Pilih versi teks yang paling sesuai dengan gaya penulisan CV kamu.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* Original text pill */}
          {originalText && (
            <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 px-3 py-2">
              <p className="text-[11px] font-medium text-muted-foreground mb-1">Teks Asli</p>
              <p className="text-xs text-foreground/70 leading-relaxed line-clamp-3">{originalText}</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="relative">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wand2 className="h-5 w-5 text-primary" />
                </div>
                <Loader2 className="absolute -top-1 -right-1 h-5 w-5 animate-spin text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">AI sedang membuat 3 versi...</p>
                <p className="text-xs text-muted-foreground mt-0.5">Ini mungkin butuh beberapa detik</p>
              </div>
            </div>
          )}

          {!loading && variants && variants.length > 0 && (
            <>
              <div className="grid gap-3">
                {variants.map((v, i) => {
                  const accepted = acceptedIndex === i;
                  const toneColor = TONE_COLORS[v.tone] ?? "bg-background border-border";
                  const badgeColor =
                    TONE_BADGE_COLORS[v.tone] ??
                    "bg-secondary text-secondary-foreground border-border";
                  return (
                    <div
                      key={i}
                      className={cn(
                        "rounded-xl border p-4 transition-all duration-200",
                        accepted
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20 scale-[1.01]"
                          : cn(toneColor, "hover:scale-[1.005]"),
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                              accepted
                                ? "bg-primary text-primary-foreground border-primary"
                                : badgeColor,
                            )}
                          >
                            {TONE_ICONS[v.tone]}
                            {v.tone}
                          </span>
                          <span className="text-[11px] text-muted-foreground">Versi {i + 1}</span>
                        </div>
                        <Button
                          size="sm"
                          variant={accepted ? "default" : "outline"}
                          className="h-7 gap-1 rounded-lg text-xs shrink-0"
                          onClick={() => handleAccept(i, v.polished)}
                          disabled={acceptedIndex !== null}
                        >
                          {accepted ? (
                            <>
                              <Check className="h-3 w-3" /> Dipakai!
                            </>
                          ) : (
                            <>
                              <Check className="h-3 w-3" /> Pakai Ini
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{v.polished}</p>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-border/60">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setAcceptedIndex(null);
                    onRegenerateAll();
                  }}
                  disabled={loading}
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Buat Ulang
                </Button>
                <Button variant="ghost" size="sm" className="text-xs" onClick={onClose}>
                  Tutup
                </Button>
              </div>
            </>
          )}

          {!loading && (!variants || variants.length === 0) && (
            <div className="flex flex-col items-center gap-3 py-10">
              <p className="text-sm text-muted-foreground text-center">
                Gagal menghasilkan variasi teks. Silakan coba lagi.
              </p>
              <Button variant="outline" size="sm" onClick={onRegenerateAll}>
                <RefreshCw className="h-3 w-3 mr-1.5" /> Coba Lagi
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
