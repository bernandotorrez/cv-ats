/**
 * ExamConfirmDialog — Dialog konfirmasi submit ujian dengan ringkasan per
 * subtes dan pintasan ke soal kosong / ragu pertama.
 */
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { TryoutSubtest } from "@/lib/tryout-types";
import { SUBTEST_INFO } from "@/lib/tryout-types";

type Props = {
  open: boolean;
  perSubtest: Record<TryoutSubtest, { total: number; answered: number }>;
  flaggedCount: number;
  remainingLabel: string;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onJumpFirstEmpty?: () => void;
  onJumpFirstFlagged?: () => void;
};

export function ExamConfirmDialog({
  open,
  perSubtest,
  flaggedCount,
  remainingLabel,
  isSubmitting,
  onConfirm,
  onCancel,
  onJumpFirstEmpty,
  onJumpFirstFlagged,
}: Props) {
  const subtests = (["twk", "tiu", "tkp"] as const).filter((s) => perSubtest[s].total > 0);
  const total = subtests.reduce((s, k) => s + perSubtest[k].total, 0);
  const answered = subtests.reduce((s, k) => s + perSubtest[k].answered, 0);
  const unanswered = total - answered;

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && !isSubmitting && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Kumpulkan ujian sekarang?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Sisa waktu <strong className="text-foreground">{remainingLabel}</strong>. Setelah
                dikumpulkan, jawaban tidak bisa diubah.
              </p>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-center text-xs">
                  <thead className="bg-muted/50 text-[10px] uppercase tracking-wide">
                    <tr>
                      <th className="px-2 py-1.5 text-left">Subtes</th>
                      <th className="px-2 py-1.5">Dijawab</th>
                      <th className="px-2 py-1.5">Kosong</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subtests.map((s) => {
                      const empty = perSubtest[s].total - perSubtest[s].answered;
                      return (
                        <tr key={s} className="border-t">
                          <td className="px-2 py-1.5 text-left font-semibold text-foreground">
                            {SUBTEST_INFO[s].label}
                          </td>
                          <td className="px-2 py-1.5 text-emerald-700 dark:text-emerald-400">
                            {perSubtest[s].answered}/{perSubtest[s].total}
                          </td>
                          <td
                            className={
                              empty > 0
                                ? "px-2 py-1.5 font-bold text-amber-700 dark:text-amber-400"
                                : "px-2 py-1.5"
                            }
                          >
                            {empty}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {unanswered > 0 && (
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  ⚠️ {unanswered} soal belum dijawab. SKD tidak ada nilai minus — lebih baik isi
                  semua.
                </p>
              )}
              {flaggedCount > 0 && (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  🚩 {flaggedCount} soal masih ditandai ragu-ragu.
                </p>
              )}
              {(unanswered > 0 || flaggedCount > 0) && (
                <div className="flex flex-wrap gap-2">
                  {unanswered > 0 && onJumpFirstEmpty && (
                    <Button type="button" variant="outline" size="sm" onClick={onJumpFirstEmpty}>
                      Ke soal kosong
                    </Button>
                  )}
                  {flaggedCount > 0 && onJumpFirstFlagged && (
                    <Button type="button" variant="outline" size="sm" onClick={onJumpFirstFlagged}>
                      Ke soal ragu
                    </Button>
                  )}
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Periksa lagi</AlertDialogCancel>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Mengirim..." : "Ya, kumpulkan"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
