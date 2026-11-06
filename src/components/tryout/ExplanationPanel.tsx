/**
 * ExplanationPanel — Pembahasan soal: ringkas (dari bank soal) + detail
 * terstruktur (konsep, langkah, analisis tiap opsi, tips, dasar hukum).
 *
 * Detail dimuat sesuai permintaan lewat edge function tryout-explain (dibuat
 * AI sekali lalu di-cache server untuk semua peserta). Semua teks detail
 * dirender sebagai teks biasa (bukan HTML).
 */
import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Lightbulb,
  ListOrdered,
  Loader2,
  Scale,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sanitizeTryoutHtml } from "@/lib/sanitize";
import { callTryoutFunction } from "@/lib/tryout-api";
import { normalizeOptions } from "@/lib/tryout-options";
import type {
  TryoutExplanationDetail,
  TryoutQuestionFull,
  TryoutQuestionPublic,
} from "@/lib/tryout-types";

type Props = {
  question: TryoutQuestionPublic & Partial<TryoutQuestionFull>;
  attemptId?: string;
  userAnswer?: string;
  /** Dipanggil setelah detail termuat agar parent bisa menyimpan (cache lokal). */
  onDetailLoaded?: (questionId: string, detail: TryoutExplanationDetail) => void;
  defaultExpanded?: boolean;
};

export function ExplanationPanel({
  question,
  attemptId,
  userAnswer,
  onDetailLoaded,
  defaultExpanded = false,
}: Props) {
  const [detail, setDetail] = useState<TryoutExplanationDetail | null>(
    isDetail(question.explanation_detail) ? question.explanation_detail : null,
  );
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadDetail() {
    if (!attemptId || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await callTryoutFunction<{ detail: TryoutExplanationDetail }>(
        "tryout-explain",
        { question_id: question.id, attempt_id: attemptId },
        { timeoutMs: 90_000 },
      );
      if (!isDetail(res.detail)) throw new Error("Format pembahasan tidak valid.");
      setDetail(res.detail);
      setExpanded(true);
      onDetailLoaded?.(question.id, res.detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat pembahasan detail.");
    } finally {
      setLoading(false);
    }
  }

  const options = normalizeOptions(question.options);
  const isTkp = question.subtest === "tkp";

  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-primary/30 bg-primary/5 dark:bg-primary/10">
      <div className="p-4">
        <h4 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-primary">
          <BookOpen className="h-4 w-4" /> Pembahasan
        </h4>

        {detail ? (
          <p className="text-sm leading-relaxed text-foreground">{detail.summary}</p>
        ) : question.explanation ? (
          <div
            className="prose prose-sm max-w-none text-foreground dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizeTryoutHtml(question.explanation) }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Pembahasan singkat belum tersedia.</p>
        )}

        {!detail && attemptId && (
          <div className="mt-3 flex flex-wrap items-center gap-2 print:hidden">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5 bg-background"
              onClick={() => void loadDetail()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {loading ? "Menyusun pembahasan detail…" : "Lihat pembahasan detail"}
            </Button>
            {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
          </div>
        )}
      </div>

      {detail && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center justify-between border-t border-primary/20 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/5 print:hidden"
            aria-expanded={expanded}
          >
            {expanded ? "Sembunyikan pembahasan detail" : "Tampilkan pembahasan detail"}
            <ChevronDown className={cn("h-4 w-4 transition", expanded && "rotate-180")} />
          </button>

          <div
            className={cn(
              "space-y-4 border-t border-primary/20 bg-background/60 p-4 text-sm",
              !expanded && "hidden print:block",
            )}
          >
            {detail.concept && (
              <Section icon={<Target className="h-4 w-4" />} title="Konsep yang diuji">
                <p className="leading-relaxed">{detail.concept}</p>
              </Section>
            )}

            {detail.steps.length > 0 && (
              <Section
                icon={<ListOrdered className="h-4 w-4" />}
                title={isTkp ? "Prinsip penilaian" : "Langkah penyelesaian"}
              >
                <ol className="space-y-1.5">
                  {detail.steps.map((step, i) => (
                    <li key={i} className="flex gap-2 leading-relaxed">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            <Section icon={<Scale className="h-4 w-4" />} title="Analisis tiap pilihan">
              <ul className="space-y-1.5">
                {options.map((o) => {
                  const text = detail.options[o.key];
                  if (!text) return null;
                  const isKey = isTkp
                    ? detail.answer === o.key
                    : (question.correct_answer ?? detail.answer) === o.key;
                  const isMine = userAnswer === o.key;
                  const score = isTkp ? question.scores?.[o.key] : undefined;
                  return (
                    <li
                      key={o.key}
                      className={cn(
                        "flex gap-2 rounded-lg border p-2 leading-relaxed",
                        isKey
                          ? "border-emerald-300 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30"
                          : isMine && !isTkp
                            ? "border-red-300 bg-red-50/70 dark:border-red-800 dark:bg-red-950/30"
                            : "border-border",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-6 w-6 shrink-0 place-items-center rounded-md text-xs font-bold",
                          isKey ? "bg-emerald-500 text-white" : "bg-muted text-foreground",
                        )}
                      >
                        {o.key}
                      </span>
                      <span className="flex-1">
                        {text}
                        {(isMine || score != null) && (
                          <span className="ml-1 whitespace-nowrap text-[11px] font-semibold text-muted-foreground">
                            {score != null ? `· ${score} poin` : ""}
                            {isMine ? " · jawabanmu" : ""}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Section>

            {detail.tips && (
              <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="leading-relaxed">
                  <span className="font-semibold">Tips cepat: </span>
                  {detail.tips}
                </p>
              </div>
            )}

            {detail.reference && (
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Dasar/sumber:</span>{" "}
                {detail.reference}
              </p>
            )}

            <p className="text-[10px] text-muted-foreground">
              Pembahasan detail disusun dengan bantuan AI dan dicek konsisten dengan kunci. Temukan
              kekeliruan? Gunakan tombol Laporkan.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h5 className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {title}
      </h5>
      <div className="text-foreground">{children}</div>
    </section>
  );
}

function isDetail(value: unknown): value is TryoutExplanationDetail {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<TryoutExplanationDetail>;
  return (
    typeof v.summary === "string" &&
    Array.isArray(v.steps) &&
    !!v.options &&
    typeof v.options === "object"
  );
}
