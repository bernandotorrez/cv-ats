import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CareerStep } from "./career-progress";

const STEP_COPY: Record<string, { title: string; desc: string }> = {
  "create-cv": {
    title: "Buat CV pertamamu",
    desc: "Mulai dari template ATS-friendly, lalu isi bersama AI langkah demi langkah.",
  },
  "score-cv": {
    title: "Cek skor ATS CV-mu",
    desc: "Lihat seberapa siap CV-mu dibaca sistem rekrutmen, lengkap dengan saran perbaikan.",
  },
  "cover-letter": {
    title: "Buat cover letter yang nyambung",
    desc: "Tulis surat lamaran yang sinkron dengan CV dan posisi yang kamu incar.",
  },
  interview: {
    title: "Latihan interview dengan AI",
    desc: "Jawab pertanyaan realistis dan dapatkan feedback yang bisa langsung dipakai.",
  },
  apply: {
    title: "Catat lamaran pertamamu",
    desc: "Lacak setiap lamaran dan statusnya supaya tidak ada peluang yang terlewat.",
  },
};

interface NextStepCardProps {
  steps: CareerStep[];
  onStep: (step: CareerStep) => void;
  /** Aksi saat semua langkah sudah selesai. */
  onAllDone: () => void;
}

export function NextStepCard({ steps, onStep, onAllDone }: NextStepCardProps) {
  const done = steps.filter((s) => s.done).length;
  const nextIndex = steps.findIndex((s) => !s.done);
  const next = nextIndex >= 0 ? steps[nextIndex] : null;
  const copy = next
    ? (STEP_COPY[next.id] ?? { title: next.label, desc: next.description })
    : {
        title: "Semua langkah selesai",
        desc: "Perbarui CV secara rutin dan cek ulang skor ATS sebelum mengirim lamaran baru.",
      };

  return (
    <section
      aria-labelledby="next-step-title"
      className="relative overflow-hidden rounded-3xl bg-green-800 p-5 text-white shadow-lg shadow-green-900/20 sm:p-7"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-green-600/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-yellow-300/15 blur-3xl"
      />

      <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-50">
              {next ? "Langkah berikutnya" : "Kerja bagus"}
            </span>
            <span className="text-xs font-medium text-green-100">
              {done} dari {steps.length} langkah selesai
            </span>
          </div>
          <h2
            id="next-step-title"
            className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl"
          >
            {copy.title}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-green-50/90 sm:text-base">
            {copy.desc}
          </p>
        </div>

        <button
          type="button"
          onClick={() => (next ? onStep(next) : onAllDone())}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-yellow-300 px-6 text-sm font-extrabold text-gray-950 shadow-md transition hover:-translate-y-0.5 hover:bg-yellow-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-200 focus-visible:ring-offset-2 focus-visible:ring-offset-green-800 sm:w-auto"
        >
          {next ? next.actionLabel || "Lanjutkan" : "Cek skor terbaru"}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      {/* Stepper */}
      <ol
        className="relative mt-6 flex items-start gap-1 sm:gap-2"
        aria-label="Progres langkah karier"
      >
        {steps.map((step, i) => {
          const isCurrent = i === nextIndex;
          return (
            <li key={step.id} className="flex min-w-0 flex-1 flex-col gap-2">
              <button
                type="button"
                onClick={() => onStep(step)}
                aria-current={isCurrent ? "step" : undefined}
                className="group flex flex-col gap-2 text-left focus-visible:outline-none"
              >
                <span
                  className={cn(
                    "h-1.5 w-full rounded-full transition-colors",
                    step.done ? "bg-yellow-300" : isCurrent ? "bg-white/60" : "bg-white/20",
                  )}
                />
                <span className="flex min-w-0 items-center gap-1.5">
                  <span
                    className={cn(
                      "grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                      step.done
                        ? "bg-yellow-300 text-gray-950"
                        : isCurrent
                          ? "bg-white text-green-800"
                          : "bg-white/15 text-green-50",
                    )}
                  >
                    {step.done ? (
                      <Check aria-hidden="true" className="h-3 w-3" strokeWidth={3} />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span
                    className={cn(
                      "hidden truncate text-xs font-semibold group-hover:underline sm:inline",
                      step.done || isCurrent ? "text-white" : "text-green-100/80",
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="sr-only sm:hidden">{step.label}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
