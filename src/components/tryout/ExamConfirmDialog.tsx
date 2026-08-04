/**
 * ExamConfirmDialog — Dialog konfirmasi submit ujian.
 * Dark mode support.
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  totalQuestions: number;
  answeredCount: number;
  flaggedCount: number;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ExamConfirmDialog({
  open,
  totalQuestions,
  answeredCount,
  flaggedCount,
  isSubmitting,
  onConfirm,
  onCancel,
}: Props) {
  const unanswered = totalQuestions - answeredCount;
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Submit ujian?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Pastikan kamu sudah yakin dengan jawabanmu. Setelah disubmit, ujian tidak bisa diulang.</p>
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg border bg-muted/30 p-3 text-center">
                <Stat label="Dijawab" value={answeredCount} tone="emerald" />
                <Stat label="Kosong" value={unanswered} tone={unanswered > 0 ? "amber" : "muted"} />
                <Stat label="Ragu" value={flaggedCount} tone={flaggedCount > 0 ? "amber" : "muted"} />
              </div>
              {unanswered > 0 && (
                <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  ⚠️ Masih ada {unanswered} soal yang belum dijawab.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Periksa lagi</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Mengirim..." : "Ya, Submit"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "muted";
}) {
  const colorClass =
    tone === "emerald"
      ? "text-emerald-700 dark:text-emerald-400"
      : tone === "amber"
        ? "text-amber-700 dark:text-amber-400"
        : "text-muted-foreground";
  return (
    <div>
      <div className={`text-base font-bold ${colorClass}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}