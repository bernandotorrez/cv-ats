/**
 * ReportQuestionDialog — Peserta melaporkan soal bermasalah (kunci salah,
 * ambigu, typo, dll). Disimpan lewat RPC report_tryout_question yang hanya
 * menerima laporan dari peserta yang sudah menyelesaikan set soal tsb.
 */
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { TryoutReportReason, TryoutRpcClient } from "@/lib/tryout-types";

const REASONS: Array<{ value: TryoutReportReason; label: string; hint: string }> = [
  {
    value: "kunci_salah",
    label: "Kunci jawaban salah",
    hint: "Jawaban yang benar seharusnya opsi lain",
  },
  {
    value: "soal_ambigu",
    label: "Soal ambigu",
    hint: "Ada lebih dari satu jawaban yang benar / tidak jelas",
  },
  {
    value: "opsi_bermasalah",
    label: "Pilihan bermasalah",
    hint: "Opsi ganda, terpotong, atau tidak ada yang benar",
  },
  {
    value: "pembahasan_salah",
    label: "Pembahasan keliru",
    hint: "Penjelasan tidak sesuai / salah fakta",
  },
  { value: "typo", label: "Salah ketik", hint: "Typo, ejaan, atau format teks" },
  { value: "lainnya", label: "Lainnya", hint: "Masalah lain" },
];

const NOTE_MAX = 500;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionId: string;
  displayNumber: number;
};

export function ReportQuestionDialog({ open, onOpenChange, questionId, displayNumber }: Props) {
  const [reason, setReason] = useState<TryoutReportReason>("kunci_salah");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    setSending(true);
    try {
      const { error } = await (supabase as unknown as TryoutRpcClient).rpc(
        "report_tryout_question",
        { p_question_id: questionId, p_reason: reason, p_note: note.trim() || null },
      );
      if (error) {
        const msg = error.message || "";
        throw new Error(
          msg.includes("RATE_LIMITED")
            ? "Batas laporan harian tercapai. Coba lagi besok."
            : msg.includes("NOT_ELIGIBLE")
              ? "Kamu hanya bisa melaporkan soal dari tryout yang sudah kamu selesaikan."
              : "Gagal mengirim laporan. Coba lagi.",
        );
      }
      toast.success("Terima kasih! Laporan soal sudah dikirim ke tim kami.");
      setNote("");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim laporan.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !sending && onOpenChange(v)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Laporkan soal nomor {displayNumber}</DialogTitle>
          <DialogDescription>
            Bantu kami menjaga kualitas soal. Laporan ditinjau admin dan soal akan diperbaiki bila
            terbukti bermasalah.
          </DialogDescription>
        </DialogHeader>

        <div role="radiogroup" aria-label="Alasan laporan" className="grid gap-1.5">
          {REASONS.map((r) => (
            <button
              key={r.value}
              type="button"
              role="radio"
              aria-checked={reason === r.value}
              onClick={() => setReason(r.value)}
              className={cn(
                "rounded-lg border-2 px-3 py-2 text-left transition",
                reason === r.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40",
              )}
            >
              <div className="text-sm font-semibold">{r.label}</div>
              <div className="text-[11px] text-muted-foreground">{r.hint}</div>
            </button>
          ))}
        </div>

        <div>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
            placeholder="Jelaskan singkat (opsional), mis. menurut Pasal 7 UUD jawabannya C…"
            rows={3}
            maxLength={NOTE_MAX}
          />
          <div className="mt-1 text-right text-[10px] text-muted-foreground">
            {note.length}/{NOTE_MAX}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Batal
          </Button>
          <Button onClick={() => void submit()} disabled={sending} className="gap-2">
            {sending && <Loader2 className="h-4 w-4 animate-spin" />}
            Kirim laporan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
