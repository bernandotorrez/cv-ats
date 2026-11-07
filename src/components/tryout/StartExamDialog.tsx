/**
 * StartExamDialog — Konfirmasi sebelum memulai attempt baru (memotong 1
 * kredit dan langsung menjalankan timer). Mencegah kredit terpakai karena
 * salah klik.
 */
import { Clock, Coins, FileText, Play, Wifi } from "lucide-react";
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examName: string;
  totalQuestions: number;
  durationMinutes: number;
  remainingCredits: number;
  onConfirm: () => void;
};

export function StartExamDialog({
  open,
  onOpenChange,
  examName,
  totalQuestions,
  durationMinutes,
  remainingCredits,
  onConfirm,
}: Props) {
  const items = [
    {
      icon: <Coins className="h-4 w-4" aria-hidden />,
      text: (
        <>
          Memakai <b>1 kredit</b> — sisa kredit setelah ini{" "}
          <b>{Math.max(0, remainingCredits - 1)}</b>.
        </>
      ),
    },
    {
      icon: <Clock className="h-4 w-4" aria-hidden />,
      text: (
        <>
          Timer <b>{durationMinutes} menit</b> langsung berjalan dan tidak bisa dijeda.
        </>
      ),
    },
    {
      icon: <FileText className="h-4 w-4" aria-hidden />,
      text: (
        <>
          <b>{totalQuestions} soal</b> berurutan TWK → TIU → TKP; bebas berpindah soal.
        </>
      ),
    },
    {
      icon: <Wifi className="h-4 w-4" aria-hidden />,
      text: <>Jawaban tersimpan otomatis. Jika terputus, buka lagi untuk melanjutkan.</>,
    },
  ];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mulai {examName}?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <ul className="mt-2 space-y-2.5 text-sm text-muted-foreground">
              {items.map((it, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    {it.icon}
                  </span>
                  <span className="pt-1 leading-relaxed">{it.text}</span>
                </li>
              ))}
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Nanti dulu</AlertDialogCancel>
          <Button onClick={onConfirm} className="gap-2">
            <Play className="h-4 w-4" aria-hidden /> Mulai sekarang
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
