/**
 * Contoh soal interaktif untuk modul /belajar-skd.
 *
 * Pilih jawaban → benar/salah langsung ditandai dan pembahasan terbuka.
 * Pembahasan selalu ada di DOM (di dalam <details>) agar tetap terbaca mesin pencari.
 * Soal figural dibuat dari generator SVG yang sama dengan bank soal tryout (seed tetap).
 */
import { useMemo, useState } from "react";
import { CheckCircle2, Lightbulb, PencilLine, XCircle } from "lucide-react";

import { RichText } from "@/components/blog/RichText";
import { generateFigural } from "@/lib/tryout-figural";
import type { SkdExample, SkdExampleOption } from "@/lib/skd-examples";
import { cn } from "@/lib/utils";

const svgSrc = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

type Resolved = {
  question: string;
  stem?: string[];
  questionImage?: { src: string; alt: string };
  options: (SkdExampleOption & { image?: string })[];
  answer?: string;
  explanation: string[];
  trick?: string;
};

function resolve(example: SkdExample): Resolved {
  if ("figural" in example) {
    const q = generateFigural(
      example.figural.type,
      example.figural.difficulty,
      example.figural.seed,
    );
    return {
      question: q.question_text,
      questionImage: q.question_svg
        ? { src: svgSrc(q.question_svg), alt: "Gambar soal figural" }
        : undefined,
      options: q.options.map((o) => ({ key: o.key, text: o.alt, image: svgSrc(o.svg) })),
      answer: q.correct_answer,
      explanation: [q.explanation, ...(example.explanation ?? [])],
      trick: example.trick,
    };
  }
  return example;
}

export function SkdExamples({ examples }: { examples: SkdExample[] }) {
  if (examples.length === 0) return null;
  return (
    <section aria-labelledby="contoh-soal" className="mt-12">
      <h2 id="contoh-soal" className="scroll-mt-24 font-display text-2xl font-bold leading-snug">
        Contoh soal &amp; pembahasan
      </h2>
      <p className="mt-2 text-[15px] text-muted-foreground">
        Pilih jawabanmu dulu, lalu cocokkan dengan pembahasannya.
      </p>
      <ol className="mt-6 space-y-6">
        {examples.map((ex, i) => (
          <li key={i}>
            <ExampleCard example={ex} index={i} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function ExampleCard({ example, index }: { example: SkdExample; index: number }) {
  const q = useMemo(() => resolve(example), [example]);
  const [picked, setPicked] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const scored = q.options.some((o) => typeof o.score === "number");
  const isFigural = q.options.some((o) => o.image);
  const maxScore = scored ? Math.max(...q.options.map((o) => o.score ?? 0)) : 0;

  const choose = (key: string) => {
    setPicked(key);
    setOpen(true);
  };

  const pickedOpt = q.options.find((o) => o.key === picked);
  const verdict = !pickedOpt
    ? null
    : scored
      ? {
          ok: pickedOpt.score === maxScore,
          text:
            pickedOpt.score === maxScore
              ? `Tepat! Pilihanmu bernilai ${pickedOpt.score}, skor tertinggi.`
              : `Pilihanmu bernilai ${pickedOpt.score}. Jawaban bernilai ${maxScore} ada di opsi ${
                  q.options.find((o) => o.score === maxScore)?.key
                }.`,
        }
      : {
          ok: pickedOpt.key === q.answer,
          text:
            pickedOpt.key === q.answer
              ? "Benar! Jawabanmu tepat."
              : `Belum tepat. Jawaban yang benar adalah ${q.answer}.`,
        };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
        <PencilLine className="h-3.5 w-3.5" aria-hidden /> Contoh {index + 1}
      </p>
      {q.stem && (
        <div className="mt-3 space-y-1 rounded-xl bg-muted/50 p-4 text-[15px] leading-relaxed">
          {q.stem.map((line, i) => (
            <p key={i}>
              <RichText text={line} />
            </p>
          ))}
        </div>
      )}
      <p className="mt-3 text-[16px] font-medium leading-relaxed text-foreground">
        <RichText text={q.question} />
      </p>
      {q.questionImage && (
        <img
          src={q.questionImage.src}
          alt={q.questionImage.alt}
          className="mt-3 w-full max-w-xl rounded-xl border bg-white p-2"
          draggable={false}
        />
      )}

      <div
        role="radiogroup"
        aria-label={`Pilihan jawaban contoh ${index + 1}`}
        className={cn("mt-4 gap-2", isFigural ? "grid grid-cols-3 sm:grid-cols-5" : "grid")}
      >
        {q.options.map((o) => {
          const isPicked = picked === o.key;
          const isBest = scored ? o.score === maxScore : o.key === q.answer;
          const reveal = picked !== null;
          return (
            <button
              key={o.key}
              type="button"
              role="radio"
              aria-checked={isPicked}
              onClick={() => choose(o.key)}
              className={cn(
                "flex items-start gap-3 rounded-xl border-2 p-3 text-left text-[15px] leading-snug transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                isFigural && "flex-col items-center",
                !reveal && "border-border hover:border-primary/50 hover:bg-primary/5",
                reveal && isBest && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40",
                reveal && isPicked && !isBest && "border-red-400 bg-red-50 dark:bg-red-950/40",
                reveal && !isPicked && !isBest && "border-border opacity-70",
              )}
            >
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-sm font-bold",
                  reveal && isBest
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : reveal && isPicked
                      ? "border-red-500 bg-red-500 text-white"
                      : "border-border bg-background",
                )}
              >
                {o.key}
              </span>
              {o.image ? (
                <img
                  src={o.image}
                  alt={o.text}
                  className="aspect-square w-full max-w-[96px] rounded-md bg-white object-contain"
                  draggable={false}
                />
              ) : (
                <span className="flex-1 pt-0.5">
                  <RichText text={o.text} />
                </span>
              )}
              {scored && reveal && (
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-bold tabular-nums">
                  Skor {o.score}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {verdict && (
        <p
          aria-live="polite"
          className={cn(
            "mt-4 flex items-center gap-2 text-sm font-semibold",
            verdict.ok
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400",
          )}
        >
          {verdict.ok ? (
            <CheckCircle2 className="h-4 w-4" aria-hidden />
          ) : (
            <XCircle className="h-4 w-4" aria-hidden />
          )}
          {verdict.text}
        </p>
      )}

      <details
        open={open}
        onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
        className="group mt-4 rounded-xl border border-primary/20 bg-primary/5"
      >
        <summary className="cursor-pointer select-none list-none px-4 py-3 text-sm font-bold text-primary [&::-webkit-details-marker]:hidden">
          {open ? "Sembunyikan pembahasan" : "Lihat jawaban & pembahasan"}
        </summary>
        <div className="space-y-2 px-4 pb-4 text-[15px] leading-relaxed text-foreground/90">
          {!scored && q.answer && (
            <p className="font-semibold text-foreground">Jawaban: {q.answer}</p>
          )}
          {q.explanation.map((line, i) => (
            <p key={i}>
              <RichText text={line} />
            </p>
          ))}
          {q.trick && (
            <p className="flex gap-2 rounded-lg bg-yellow-100 p-3 text-[14px] text-gray-900 dark:bg-yellow-900/30 dark:text-yellow-50">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
              <span>
                <strong>Trik cepat:</strong> <RichText text={q.trick} />
              </span>
            </p>
          )}
        </div>
      </details>
    </div>
  );
}
