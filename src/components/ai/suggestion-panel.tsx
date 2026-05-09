import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  if (!open) return null;

  const sectionLabel: Record<string, string> = {
    summary: "Ringkasan Profil",
    headline: "Headline",
    experience: "Deskripsi Pengalaman",
    education: "Deskripsi Pendidikan",
    skills: "Daftar Skill",
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Saran AI — {sectionLabel[section] || section}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && (
          <div className="flex flex-col items-center gap-3 py-8">
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
                  "rounded-lg border p-3 transition-colors",
                  acceptedIndex === i
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:border-primary/50",
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs shrink-0">
                    Opsi {i + 1}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={acceptedIndex === i ? "default" : "outline"}
                      className="h-7 text-xs gap-1"
                      onClick={() => onAccept(i, s)}
                      disabled={acceptedIndex !== null}
                    >
                      {acceptedIndex === i ? (
                        <><Check className="h-3 w-3" /> Dipakai</>
                      ) : (
                        <><Check className="h-3 w-3" /> Pakai</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => onRegenerate(i)}
                      disabled={loading}
                      title="Buat ulang opsi ini"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {s.option}
                </div>
                {s.explanation && (
                  <p className="mt-1.5 text-xs text-muted-foreground flex items-start gap-1">
                    <Lightbulb className="h-3 w-3 mt-0.5 shrink-0" />
                    {s.explanation}
                  </p>
                )}
              </div>
            ))}

            <div className="flex justify-between items-center pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={onRegenerateAll}
                disabled={loading}
              >
                <RefreshCw className="h-3 w-3 mr-1" /> Buat Ulang Semua
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={onClose}
              >
                Tutup
              </Button>
            </div>
          </>
        )}

        {!loading && (!suggestions || suggestions.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Gagal menghasilkan saran. Coba lagi.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
