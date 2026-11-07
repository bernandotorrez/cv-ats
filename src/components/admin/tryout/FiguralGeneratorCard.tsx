/**
 * FiguralGeneratorCard — admin membuat soal TIU figural (gambar SVG) dari
 * generator berbasis aturan, meninjau pratinjau + kunci + pembahasan, lalu
 * menyimpannya ke exam set. Kunci dihitung dari aturan pembuat gambar.
 */
import { useState } from "react";
import { toast } from "sonner";
import { Check, Eye, Loader2, RefreshCw, Save, Shapes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  generateFiguralBatch,
  type FiguralDifficulty,
  type FiguralQuestion,
  type FiguralType,
} from "@/lib/tryout-figural";
import { saveFiguralQuestions, svgDataUrl } from "@/lib/tryout-figural-save";

const TYPE_LABEL: Record<FiguralType, string> = {
  serial: "Serial (lanjutkan deret)",
  ketidaksamaan: "Ketidaksamaan (cari yang beda)",
  analogi: "Analogi (A→B, C→?)",
};

type SetOption = { id: string; name: string };

export function FiguralGeneratorCard({
  examSets,
  selectedSetId,
  onSelectSet,
  onSaved,
}: {
  examSets: SetOption[];
  selectedSetId: string;
  onSelectSet: (id: string) => void;
  onSaved?: () => void;
}) {
  const [count, setCount] = useState(6);
  const [difficulty, setDifficulty] = useState<FiguralDifficulty>("medium");
  const [types, setTypes] = useState<Record<FiguralType, boolean>>({
    serial: true,
    ketidaksamaan: true,
    analogi: true,
  });
  const [preview, setPreview] = useState<FiguralQuestion[]>([]);
  const [showKey, setShowKey] = useState(true);
  const [saving, setSaving] = useState<{ done: number; total: number } | null>(null);

  const activeTypes = (Object.keys(types) as FiguralType[]).filter((t) => types[t]);

  function generate() {
    if (activeTypes.length === 0) {
      toast.error("Pilih minimal satu jenis soal.");
      return;
    }
    try {
      setPreview(generateFiguralBatch(count, difficulty, activeTypes));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat soal figural");
    }
  }

  async function save() {
    if (!selectedSetId || preview.length === 0) return;
    setSaving({ done: 0, total: preview.length });
    try {
      const res = await saveFiguralQuestions(selectedSetId, preview, (done, total) =>
        setSaving({ done, total }),
      );
      if (res.saved > 0) {
        toast.success(`${res.saved} soal figural tersimpan.`);
        setPreview([]);
        onSaved?.();
      }
      if (res.failed > 0) {
        toast.error(`${res.failed} soal gagal disimpan: ${res.errors[0] ?? "error"}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan soal");
    } finally {
      setSaving(null);
    }
  }

  return (
    <section
      className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5"
      aria-labelledby="fig-title"
    >
      <div className="mb-1 flex items-center gap-2">
        <Shapes className="h-5 w-5 text-primary" aria-hidden />
        <h3 id="fig-title" className="font-display text-lg font-bold">
          Generate Soal TIU Figural (Gambar)
        </h3>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Gambar dibuat dari aturan pola, sehingga kunci dan pembahasannya pasti konsisten. Tinjau
        pratinjau dulu, lalu simpan ke set. Soal masuk ke subtes TIU kategori Figural.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="fig-set">Exam set</Label>
          <select
            id="fig-set"
            value={selectedSetId}
            onChange={(e) => onSelectSet(e.target.value)}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {examSets.length === 0 && <option value="">Belum ada exam set</option>}
            {examSets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="fig-count">Jumlah soal</Label>
          <input
            id="fig-count"
            type="number"
            min={1}
            max={15}
            value={count}
            onChange={(e) => setCount(Math.min(15, Math.max(1, Number(e.target.value) || 1)))}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="fig-diff">Tingkat kesulitan</Label>
          <select
            id="fig-diff"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as FiguralDifficulty)}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="easy">Mudah (2 aturan)</option>
            <option value="medium">Sedang (3 aturan)</option>
            <option value="hard">Sulit (4 aturan)</option>
          </select>
        </div>
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium">Jenis soal</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(TYPE_LABEL) as FiguralType[]).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={types[t]}
              onClick={() => setTypes((v) => ({ ...v, [t]: !v[t] }))}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                types[t]
                  ? "border-primary bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={generate} className="gap-2" disabled={!!saving}>
          {preview.length ? (
            <RefreshCw className="h-4 w-4" aria-hidden />
          ) : (
            <Eye className="h-4 w-4" aria-hidden />
          )}
          {preview.length ? "Buat ulang pratinjau" : "Buat pratinjau"}
        </Button>
        {preview.length > 0 && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowKey((v) => !v)}
              aria-pressed={showKey}
            >
              {showKey ? "Sembunyikan kunci" : "Tampilkan kunci"}
            </Button>
            <Button
              type="button"
              onClick={() => void save()}
              disabled={!selectedSetId || !!saving}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Save className="h-4 w-4" aria-hidden />
              )}
              Simpan {preview.length} soal ke set
            </Button>
          </>
        )}
      </div>

      {saving && (
        <div className="mt-3">
          <Progress value={(saving.done / Math.max(1, saving.total)) * 100} />
          <p className="mt-1 text-right text-[11px] text-muted-foreground">
            Mengunggah gambar & menyimpan {saving.done}/{saving.total}
          </p>
        </div>
      )}

      {preview.length > 0 && (
        <ol className="mt-5 space-y-4">
          {preview.map((q, i) => (
            <li key={i} className="rounded-xl border bg-background p-3 sm:p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-md bg-primary px-2 py-0.5 font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="rounded-md bg-muted px-2 py-0.5 font-medium">
                  {TYPE_LABEL[q.type]}
                </span>
                {showKey && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <Check className="h-3 w-3" aria-hidden /> Kunci {q.correct_answer}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium">{q.question_text}</p>
              {q.question_svg && (
                <img
                  src={svgDataUrl(q.question_svg)}
                  alt="Pratinjau gambar soal"
                  className="mt-2 max-h-28 w-full rounded-md bg-white object-contain object-left"
                />
              )}
              <div className="mt-2 grid grid-cols-5 gap-2">
                {q.options.map((o) => (
                  <div
                    key={o.key}
                    className={cn(
                      "rounded-lg border-2 p-1 text-center",
                      showKey && o.key === q.correct_answer
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                        : "border-border",
                    )}
                  >
                    <div className="text-xs font-bold">{o.key}</div>
                    <img
                      src={svgDataUrl(o.svg)}
                      alt={o.alt}
                      className="mx-auto aspect-square w-full max-w-[96px] rounded bg-white"
                    />
                  </div>
                ))}
              </div>
              {showKey && (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {q.explanation}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
