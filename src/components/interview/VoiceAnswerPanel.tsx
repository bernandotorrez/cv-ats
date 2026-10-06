import { useEffect, useState } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/interview-delivery";

interface VoiceAnswerPanelProps {
  recording: boolean;
  /** Epoch ms saat rekaman dimulai; null jika tidak merekam. */
  startedAt: number | null;
  /** Isi jawaban saat ini (transkrip langsung saat merekam). */
  answer: string;
  onStart: () => void;
  onStop: () => void;
}

/** Potong transkrip panjang: tampilkan ekornya agar kata terbaru selalu terlihat. */
function tail(text: string, max = 220) {
  const clean = text.trim();
  return clean.length > max ? `…${clean.slice(-max)}` : clean;
}

export function VoiceAnswerPanel({
  recording,
  startedAt,
  answer,
  onStart,
  onStop,
}: VoiceAnswerPanelProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!recording || !startedAt) {
      setElapsed(0);
      return;
    }
    const update = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    update();
    const timer = setInterval(update, 500);
    return () => clearInterval(timer);
  }, [recording, startedAt]);

  const hasAnswer = answer.trim().length > 0;

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-colors sm:p-5",
        recording ? "border-red-300 bg-red-50" : "border-green-200 bg-green-50",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3.5">
          <span
            className={cn(
              "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white",
              recording ? "bg-red-600" : "bg-green-700",
            )}
          >
            {recording && (
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-red-500/40 motion-safe:animate-ping"
              />
            )}
            <Mic aria-hidden="true" className="relative h-6 w-6" />
          </span>
          <div role="status" aria-live="polite">
            <p className={cn("text-sm font-bold", recording ? "text-red-900" : "text-green-900")}>
              {recording
                ? "Merekam jawabanmu"
                : hasAnswer
                  ? "Jawaban tersimpan"
                  : "Jawab dengan suara"}
            </p>
            <p
              className={cn(
                "mt-0.5 text-sm tabular-nums",
                recording ? "text-red-800" : "text-green-900",
              )}
            >
              {recording
                ? `${formatDuration(elapsed)} · bicara natural, transkrip muncul di bawah`
                : hasAnswer
                  ? "Bisa direkam ulang atau diedit manual di bawah."
                  : "Tekan tombol, lalu jawab seperti di interview sungguhan."}
            </p>
          </div>
        </div>

        <div className="sm:ml-auto">
          {recording ? (
            <Button
              type="button"
              onClick={onStop}
              className="h-12 w-full gap-2 rounded-xl bg-red-600 px-5 font-bold text-white hover:bg-red-700 sm:w-auto"
            >
              <Square aria-hidden="true" className="h-4 w-4 fill-current" />
              Selesai menjawab
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onStart}
              className="h-12 w-full gap-2 rounded-xl bg-green-700 px-5 font-bold text-white hover:bg-green-800 sm:w-auto"
            >
              <Mic aria-hidden="true" className="h-4 w-4" />
              {hasAnswer ? "Rekam tambahan" : "Mulai bicara"}
            </Button>
          )}
        </div>
      </div>

      {recording && (
        <p className="mt-4 min-h-[2.75rem] rounded-xl bg-white p-3 text-sm leading-relaxed text-gray-800 ring-1 ring-red-200">
          {answer.trim() ? tail(answer) : <span className="text-gray-500">Mendengarkan…</span>}
        </p>
      )}
    </div>
  );
}
