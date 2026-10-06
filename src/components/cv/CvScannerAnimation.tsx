/**
 * CV Scanner Animation
 * Loading state saat AI HR menganalisis CV: dokumen yang dipindai + daftar tahapan.
 */

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Brain, Check, FileText, Loader2, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CvScannerAnimationProps {
  cvTitle: string;
  onComplete?: () => void;
}

const scanPhases = [
  { icon: FileText, text: "Membaca struktur CV", duration: 2000 },
  { icon: Search, text: "Menganalisis konten & format", duration: 2500 },
  { icon: Brain, text: "Evaluasi dari sudut pandang HR", duration: 3000 },
  { icon: Sparkles, text: "Menyiapkan rekomendasi", duration: 2000 },
];

export function CvScannerAnimation({ cvTitle }: CvScannerAnimationProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const totalDuration = scanPhases.reduce((acc, p) => acc + p.duration, 0);
    const startTime = Date.now();
    let phaseIndex = 0;
    let phaseStartTime = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      setProgress(Math.min(((now - startTime) / totalDuration) * 100, 95));

      if (
        phaseIndex < scanPhases.length - 1 &&
        now - phaseStartTime >= scanPhases[phaseIndex].duration
      ) {
        phaseIndex++;
        phaseStartTime = now;
        setCurrentPhase(phaseIndex);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 items-center gap-8 py-4 md:grid-cols-[1fr_1.1fr] md:gap-12 md:py-10">
      {/* Dokumen yang dipindai */}
      <div
        aria-hidden="true"
        className="relative mx-auto w-full max-w-xs overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-green-900/10"
      >
        <div className="flex items-center gap-3 border-b border-gray-100 bg-green-50 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-700 text-white">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-900">{cvTitle || "CV kamu"}</p>
            <p className="text-xs text-gray-600">Sedang dipindai</p>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div className="space-y-2">
            <div className="h-4 w-1/2 rounded bg-green-200" />
            <div className="h-2.5 w-3/4 rounded bg-gray-200" />
          </div>
          {[0, 1, 2].map((block) => (
            <div key={block} className="space-y-2">
              <div className="h-3 w-1/3 rounded bg-gray-300" />
              <div className="h-2 w-full rounded bg-gray-100" />
              <div className="h-2 w-11/12 rounded bg-gray-100" />
              <div className="h-2 w-4/5 rounded bg-gray-100" />
            </div>
          ))}
        </div>

        {!reduceMotion && (
          <motion.div
            className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-green-600/20 to-transparent"
            initial={{ top: "-15%" }}
            animate={{ top: ["-15%", "100%"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-green-600 shadow-[0_0_12px_rgba(21,128,61,0.8)]" />
          </motion.div>
        )}
      </div>

      {/* Tahapan */}
      <div role="status" aria-live="polite">
        <p className="text-xs font-bold uppercase tracking-wider text-green-800">
          Hira AI sedang bekerja
        </p>
        <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
          Mereview CV-mu
        </h2>
        <p className="mt-1.5 text-sm text-gray-600">Biasanya selesai dalam 10–30 detik.</p>

        <ol className="mt-6 space-y-3">
          {scanPhases.map((phase, i) => {
            const done = i < currentPhase;
            const active = i === currentPhase;
            const Icon = phase.icon;
            return (
              <li
                key={phase.text}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3 transition-colors",
                  active && "border-green-700 bg-green-50",
                  done && "border-gray-200 bg-white",
                  !done && !active && "border-gray-100 bg-gray-50 text-gray-500",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    done && "bg-green-700 text-white",
                    active && "bg-white text-green-700 ring-1 ring-green-200",
                    !done && !active && "bg-white text-gray-400 ring-1 ring-gray-200",
                  )}
                >
                  {done ? (
                    <Check aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  )}
                </span>
                <span
                  className={cn(
                    "flex-1 text-sm font-semibold",
                    active ? "text-green-900" : done ? "text-gray-800" : "text-gray-500",
                  )}
                >
                  {phase.text}
                </span>
                {active && (
                  <Loader2
                    aria-hidden="true"
                    className={cn("h-4 w-4 text-green-700", !reduceMotion && "animate-spin")}
                  />
                )}
              </li>
            );
          })}
        </ol>

        <div
          className="mt-5 h-2 overflow-hidden rounded-full bg-gray-200"
          role="progressbar"
          aria-label="Progres review"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-green-700 transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
