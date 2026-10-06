/**
 * Analisis "cara bicara" dari jawaban lisan: tempo (kata per menit) dan kata pengisi.
 * Berbasis transkrip dari speech recognition, jadi sifatnya perkiraan: recognizer browser
 * sering membuang "eee"/"umm" sehingga kata pengisi yang terdeteksi bisa lebih sedikit dari
 * kenyataan.
 */

export interface DeliveryStats {
  durationSec: number;
  words: number;
  wpm: number;
  fillerCount: number;
  fillers: Record<string, number>;
}

/** Kata/frasa pengisi umum (Indonesia & Inggris). Dicocokkan sebagai kata utuh. */
const FILLERS: Array<{ label: string; pattern: RegExp }> = [
  { label: "eh / ehm", pattern: /\b(?:eh|ehm|em|emm|eee+|hmm+)\b/g },
  { label: "anu", pattern: /\banu\b/g },
  { label: "kayak", pattern: /\b(?:kayak|kayaknya)\b/g },
  { label: "gitu", pattern: /\bgitu\b/g },
  { label: "pokoknya", pattern: /\bpokoknya\b/g },
  { label: "apa ya", pattern: /\b(?:apa ya|gimana ya)\b/g },
  { label: "um / uh", pattern: /\b(?:um|uh|umm|uhh)\b/g },
  { label: "like", pattern: /\blike\b/g },
  { label: "you know", pattern: /\byou know\b/g },
  { label: "basically", pattern: /\bbasically\b/g },
];

export function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function analyzeDelivery(text: string, durationSec: number): DeliveryStats {
  const normalized = text.toLowerCase();
  const words = countWords(text);
  const fillers: Record<string, number> = {};
  let fillerCount = 0;
  for (const { label, pattern } of FILLERS) {
    const hits = normalized.match(pattern)?.length ?? 0;
    if (hits > 0) {
      fillers[label] = hits;
      fillerCount += hits;
    }
  }
  const safeDuration = Math.max(0, durationSec);
  // Durasi < 5 dtk terlalu pendek untuk menghitung tempo yang berarti
  const wpm = safeDuration >= 5 ? Math.round((words / safeDuration) * 60) : 0;
  return { durationSec: Math.round(safeDuration), words, wpm, fillerCount, fillers };
}

export interface DeliveryAnswer {
  answer: string;
  durationSec?: number;
  wpm?: number;
  fillerCount?: number;
}

export interface DeliverySummary {
  answersWithVoice: number;
  avgWpm: number;
  avgDurationSec: number;
  totalFillers: number;
  fillersPer100Words: number;
  topFillers: Array<{ label: string; count: number }>;
}

/** Ringkasan seluruh jawaban lisan dalam satu sesi; null bila tidak ada jawaban lisan. */
export function summarizeDelivery(answers: DeliveryAnswer[]): DeliverySummary | null {
  const voiced = answers.filter((a) => (a.durationSec ?? 0) > 0);
  if (voiced.length === 0) return null;

  const timed = voiced.filter((a) => (a.wpm ?? 0) > 0);
  const avgWpm = timed.length
    ? Math.round(timed.reduce((sum, a) => sum + (a.wpm ?? 0), 0) / timed.length)
    : 0;
  const avgDurationSec = Math.round(
    voiced.reduce((sum, a) => sum + (a.durationSec ?? 0), 0) / voiced.length,
  );
  const totalFillers = voiced.reduce((sum, a) => sum + (a.fillerCount ?? 0), 0);
  const totalWords = voiced.reduce((sum, a) => sum + countWords(a.answer), 0);

  const counts: Record<string, number> = {};
  for (const a of voiced) {
    const text = a.answer.toLowerCase();
    for (const { label, pattern } of FILLERS) {
      const hits = text.match(pattern)?.length ?? 0;
      if (hits > 0) counts[label] = (counts[label] ?? 0) + hits;
    }
  }
  const topFillers = Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return {
    answersWithVoice: voiced.length,
    avgWpm,
    avgDurationSec,
    totalFillers,
    fillersPer100Words: totalWords ? Math.round((totalFillers / totalWords) * 1000) / 10 : 0,
    topFillers,
  };
}

export function paceLabel(wpm: number): { label: string; tone: "good" | "warn" } {
  if (wpm === 0) return { label: "Belum cukup data", tone: "warn" };
  if (wpm < 100) return { label: "Cukup pelan", tone: "warn" };
  if (wpm > 170) return { label: "Cukup cepat", tone: "warn" };
  return { label: "Tempo pas", tone: "good" };
}

export function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = Math.round(totalSec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
