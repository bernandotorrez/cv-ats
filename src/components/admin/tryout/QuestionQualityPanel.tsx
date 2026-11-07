/**
 * QuestionQualityPanel — tab admin "Laporan & Pembahasan" untuk tryout SKD.
 *
 * Isi:
 * 1. Laporan soal dari peserta (tryout_question_reports): filter status,
 *    dikelompokkan per soal, aksi Edit soal / Selesai / Tolak / Buat ulang
 *    pembahasan detail.
 * 2. Dialog edit soal (teks, opsi A–E, kunci TWK/TIU atau skor TKP,
 *    pembahasan singkat, kategori, tingkat kesulitan).
 * 3. Kartu "Lengkapi pembahasan detail": memanggil edge function
 *    tryout-explain mode massal berulang sampai semua soal di set terisi.
 *
 * Catatan: trigger DB otomatis mengosongkan explanation_detail bila teks soal,
 * opsi, kunci, atau skor berubah — jadi setelah edit cukup buat ulang.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  BookOpenCheck,
  Check,
  CircleStop,
  Flag,
  Loader2,
  Pencil,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton-loading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeTryoutHtml } from "@/lib/sanitize";
import { normalizeOptions, safeTryoutImageUrl } from "@/lib/tryout-options";
import { uploadManualImage } from "@/lib/tryout-figural-save";
import type { TryoutExplanationDetail, TryoutReportReason } from "@/lib/tryout-types";

/* ────────────────────────────────────────────────────────────────────────────
 * Tipe & konstanta
 * ──────────────────────────────────────────────────────────────────────────── */

type ExamSetLite = { id: string; name: string };

type ReportStatus = "open" | "resolved" | "rejected";
type StatusFilter = ReportStatus | "semua";

type ReportRow = {
  id: string;
  question_id: string;
  user_id: string;
  reason: string;
  note: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
};

type QuestionRow = {
  id: string;
  exam_set_id: string;
  subtest: string;
  question_number: number;
  question_text: string;
  question_image_url: string | null;
  options: unknown;
  correct_answer: string | null;
  scores: unknown;
  explanation: string | null;
  explanation_detail: unknown;
  category: string | null;
  difficulty: string;
};

type BulkIssue = { id: string; question_number: number; reason: string };

type BulkResponse = {
  processed: number;
  failed: BulkIssue[];
  disputed: BulkIssue[];
  remaining: number;
};

const OPTION_KEYS = ["A", "B", "C", "D", "E"] as const;
type OptionKey = (typeof OPTION_KEYS)[number];

const QUESTION_COLUMNS =
  "id, exam_set_id, subtest, question_number, question_text, question_image_url, options, correct_answer, scores, explanation, explanation_detail, category, difficulty";

const REPORT_COLUMNS =
  "id, question_id, user_id, reason, note, status, admin_note, created_at, resolved_at, resolved_by";

const PAGE_SIZE = 50;

const REASON_LABELS: Record<TryoutReportReason, string> = {
  kunci_salah: "Kunci jawaban salah",
  soal_ambigu: "Soal ambigu",
  opsi_bermasalah: "Opsi bermasalah",
  typo: "Typo / salah ketik",
  pembahasan_salah: "Pembahasan salah",
  lainnya: "Lainnya",
};

const STATUS_LABELS: Record<ReportStatus, string> = {
  open: "Terbuka",
  resolved: "Selesai",
  rejected: "Ditolak",
};

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "open", label: "Terbuka" },
  { value: "resolved", label: "Selesai" },
  { value: "rejected", label: "Ditolak" },
  { value: "semua", label: "Semua" },
];

const SUBTEST_STYLE: Record<string, string> = {
  twk: "border-amber-400/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  tiu: "border-sky-400/40 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  tkp: "border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Mudah",
  medium: "Sedang",
  hard: "Sulit",
};

function reasonLabel(reason: string): string {
  return REASON_LABELS[reason as TryoutReportReason] ?? reason;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortId(id: string): string {
  return `${id.slice(0, 8)}…`;
}

/** Ambil skor TKP dari jsonb (abaikan nilai non-angka). */
function parseScores(raw: unknown): Partial<Record<OptionKey, number>> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Partial<Record<OptionKey, number>> = {};
  for (const k of OPTION_KEYS) {
    const v = Number((raw as Record<string, unknown>)[k]);
    if (Number.isFinite(v)) out[k] = v;
  }
  return out;
}

/** Validasi bentuk explanation_detail sebelum dirender. */
function parseDetail(raw: unknown): TryoutExplanationDetail | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const d = raw as Partial<TryoutExplanationDetail>;
  if (typeof d.summary !== "string") return null;
  return {
    v: 1,
    answer: typeof d.answer === "string" ? d.answer : null,
    summary: d.summary,
    concept: typeof d.concept === "string" ? d.concept : "",
    steps: Array.isArray(d.steps) ? d.steps.filter((s): s is string => typeof s === "string") : [],
    options:
      d.options && typeof d.options === "object" && !Array.isArray(d.options)
        ? (d.options as Record<string, string>)
        : {},
    tips: typeof d.tips === "string" ? d.tips : null,
    reference: typeof d.reference === "string" ? d.reference : null,
    generated_at: typeof d.generated_at === "string" ? d.generated_at : "",
  };
}

/** Panggil edge function tryout-explain (pola sama dengan callGenerate). */
async function callExplain(
  body: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const res = await fetch(`${supabaseUrl}/functions/v1/tryout-explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data };
}

function errorMessage(data: Record<string, unknown>, fallback: string): string {
  if (typeof data.message === "string" && data.message) return data.message;
  if (typeof data.error === "string" && data.error) return data.error;
  return fallback;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Panel utama
 * ──────────────────────────────────────────────────────────────────────────── */

export function QuestionQualityPanel({ examSets }: { examSets: ExamSetLite[] }) {
  const [editQuestionId, setEditQuestionId] = useState<string | null>(null);
  // Dinaikkan setiap ada perubahan soal/pembahasan agar daftar & hitungan dimuat ulang
  const [refreshKey, setRefreshKey] = useState(0);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const setNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of examSets) m.set(s.id, s.name);
    return m;
  }, [examSets]);

  const bumpRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  /** Buat ulang pembahasan detail satu soal (force). */
  const regenerate = useCallback(
    async (questionId: string) => {
      setRegeneratingId(questionId);
      try {
        const res = await callExplain({ question_id: questionId, force: true });
        if (res.ok) {
          toast.success("Pembahasan detail berhasil dibuat ulang.");
          bumpRefresh();
        } else if (res.status === 422 && res.data.error === "DISPUTED") {
          toast.warning(
            errorMessage(res.data, "AI meragukan kunci soal ini. Periksa soal terlebih dahulu."),
            {
              action: { label: "Edit soal", onClick: () => setEditQuestionId(questionId) },
            },
          );
        } else if (res.status === 429) {
          toast.error(errorMessage(res.data, "Terlalu banyak request. Coba lagi nanti."));
        } else {
          toast.error(errorMessage(res.data, "Gagal membuat pembahasan detail."));
        }
      } catch {
        toast.error("Gagal menghubungi server. Periksa koneksi lalu coba lagi.");
      } finally {
        setRegeneratingId(null);
      }
    },
    [bumpRefresh],
  );

  return (
    <div className="space-y-4">
      <ReportsSection
        setNameById={setNameById}
        refreshKey={refreshKey}
        regeneratingId={regeneratingId}
        onEdit={setEditQuestionId}
        onRegenerate={(id) => void regenerate(id)}
      />

      <BulkExplainCard
        examSets={examSets}
        refreshKey={refreshKey}
        onEdit={setEditQuestionId}
        onFinished={bumpRefresh}
      />

      <EditQuestionDialog
        questionId={editQuestionId}
        setNameById={setNameById}
        onClose={() => setEditQuestionId(null)}
        onSaved={(id, contentChanged) => {
          setEditQuestionId(null);
          bumpRefresh();
          if (contentChanged) {
            toast.success("Soal disimpan. Pembahasan detail direset otomatis.", {
              action: { label: "Buat ulang pembahasan", onClick: () => void regenerate(id) },
            });
          } else {
            toast.success("Soal disimpan.");
          }
        }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Laporan soal
 * ──────────────────────────────────────────────────────────────────────────── */

type ReportAction = { report: ReportRow; status: "resolved" | "rejected" };

function ReportsSection({
  setNameById,
  refreshKey,
  regeneratingId,
  onEdit,
  onRegenerate,
}: {
  setNameById: Map<string, string>;
  refreshKey: number;
  regeneratingId: string | null;
  onEdit: (questionId: string) => void;
  onRegenerate: (questionId: string) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [questions, setQuestions] = useState<Record<string, QuestionRow>>({});
  const [openCounts, setOpenCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [action, setAction] = useState<ReportAction | null>(null);
  // Mencegah respons lama menimpa hasil filter terbaru
  const requestSeq = useRef(0);

  /** Muat soal & jumlah laporan terbuka untuk sekumpulan question_id. */
  const loadQuestionMeta = useCallback(async (questionIds: string[]) => {
    if (questionIds.length === 0) {
      return { qMap: {} as Record<string, QuestionRow>, counts: {} as Record<string, number> };
    }
    const [qRes, cRes] = await Promise.all([
      supabase.from("tryout_questions").select(QUESTION_COLUMNS).in("id", questionIds),
      supabase
        .from("tryout_question_reports")
        .select("question_id")
        .eq("status", "open")
        .in("question_id", questionIds),
    ]);
    if (qRes.error) toast.error(`Gagal memuat soal: ${qRes.error.message}`);
    const qMap: Record<string, QuestionRow> = {};
    for (const q of (qRes.data || []) as unknown as QuestionRow[]) qMap[q.id] = q;
    const counts: Record<string, number> = {};
    for (const r of (cRes.data || []) as Array<{ question_id: string }>) {
      counts[r.question_id] = (counts[r.question_id] ?? 0) + 1;
    }
    return { qMap, counts };
  }, []);

  const loadReports = useCallback(
    async (mode: "reset" | "more", currentCount = 0) => {
      const seq = ++requestSeq.current;
      if (mode === "reset") setLoading(true);
      else setLoadingMore(true);

      const from = mode === "reset" ? 0 : currentCount;
      let query = supabase
        .from("tryout_question_reports")
        .select(REPORT_COLUMNS)
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (statusFilter !== "semua") query = query.eq("status", statusFilter);
      const { data, error } = await query;

      if (seq !== requestSeq.current) return;
      if (error) {
        toast.error(`Gagal memuat laporan: ${error.message}`);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      const rows = (data || []) as ReportRow[];
      const ids = Array.from(new Set(rows.map((r) => r.question_id)));
      const { qMap, counts } = await loadQuestionMeta(ids);
      if (seq !== requestSeq.current) return;

      if (mode === "reset") {
        setReports(rows);
        setQuestions(qMap);
        setOpenCounts(counts);
      } else {
        setReports((prev) => {
          const seen = new Set(prev.map((r) => r.id));
          return [...prev, ...rows.filter((r) => !seen.has(r.id))];
        });
        setQuestions((prev) => ({ ...prev, ...qMap }));
        setOpenCounts((prev) => ({ ...prev, ...counts }));
      }
      setHasMore(rows.length === PAGE_SIZE);
      setLoading(false);
      setLoadingMore(false);
    },
    [statusFilter, loadQuestionMeta],
  );

  useEffect(() => {
    void loadReports("reset");
  }, [loadReports, refreshKey]);

  // Kelompokkan per soal, urut berdasarkan laporan terbaru
  const groups = useMemo(() => {
    const order: string[] = [];
    const byQuestion = new Map<string, ReportRow[]>();
    for (const r of reports) {
      if (!byQuestion.has(r.question_id)) {
        byQuestion.set(r.question_id, []);
        order.push(r.question_id);
      }
      byQuestion.get(r.question_id)!.push(r);
    }
    return order.map((qid) => ({ questionId: qid, reports: byQuestion.get(qid)! }));
  }, [reports]);

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5" aria-labelledby="lap-soal">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-primary" />
            <h3 id="lap-soal" className="font-display text-lg font-bold">
              Laporan Soal
            </h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Soal yang dilaporkan peserta. Periksa, perbaiki bila perlu, lalu tandai selesai atau
            tolak.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => void loadReports("reset")}
          disabled={loading}
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Muat ulang
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Filter status laporan">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={statusFilter === f.value ? "default" : "outline"}
            aria-pressed={statusFilter === f.value}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {statusFilter === "open"
            ? "Tidak ada laporan terbuka. Semua soal aman 🎉"
            : "Belum ada laporan dengan status ini."}
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => {
            const q = questions[g.questionId];
            const openCount = openCounts[g.questionId] ?? 0;
            return (
              <article key={g.questionId} className="rounded-xl border bg-background/50 p-3 sm:p-4">
                {q ? (
                  <QuestionPreview question={q} setName={setNameById.get(q.exam_set_id)} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Soal tidak ditemukan (mungkin sudah dihapus).
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {openCount > 0 && (
                    <Badge
                      variant="outline"
                      className="gap-1 border-red-400/40 bg-red-500/10 text-red-700 dark:text-red-400"
                    >
                      <Flag className="h-3 w-3" /> {openCount} laporan terbuka
                    </Badge>
                  )}
                  {q && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => onEdit(q.id)}
                      >
                        <Pencil className="h-4 w-4" /> Edit soal
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={regeneratingId !== null}
                        onClick={() => onRegenerate(q.id)}
                      >
                        {regeneratingId === q.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        Buat ulang pembahasan
                      </Button>
                    </>
                  )}
                </div>

                <ul className="mt-3 space-y-2" aria-label="Daftar laporan untuk soal ini">
                  {g.reports.map((r) => (
                    <ReportItem
                      key={r.id}
                      report={r}
                      onResolve={() => setAction({ report: r, status: "resolved" })}
                      onReject={() => setAction({ report: r, status: "rejected" })}
                    />
                  ))}
                </ul>
              </article>
            );
          })}

          {hasMore && (
            <div className="flex justify-center pt-1">
              <Button
                variant="outline"
                onClick={() => void loadReports("more", reports.length)}
                disabled={loadingMore}
                className="gap-1.5"
              >
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                Muat lebih banyak
              </Button>
            </div>
          )}
        </div>
      )}

      <ResolveReportDialog
        action={action}
        openCount={action ? (openCounts[action.report.question_id] ?? 0) : 0}
        onClose={() => setAction(null)}
        onDone={() => {
          setAction(null);
          void loadReports("reset");
        }}
      />
    </section>
  );
}

function ReportItem({
  report,
  onResolve,
  onReject,
}: {
  report: ReportRow;
  onResolve: () => void;
  onReject: () => void;
}) {
  const status = report.status as ReportStatus;
  return (
    <li className="rounded-lg border bg-muted/20 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="font-semibold">
          {reasonLabel(report.reason)}
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px]",
            status === "open" && "border-red-400/40 text-red-700 dark:text-red-400",
            status === "resolved" && "border-emerald-400/40 text-emerald-700 dark:text-emerald-400",
            status === "rejected" && "text-muted-foreground",
          )}
        >
          {STATUS_LABELS[status] ?? report.status}
        </Badge>
        <span className="text-[11px] text-muted-foreground">
          {formatDateTime(report.created_at)} · pelapor{" "}
          <span className="font-mono" title={report.user_id}>
            {shortId(report.user_id)}
          </span>
        </span>
      </div>
      {report.note ? (
        <p className="mt-1.5 whitespace-pre-line break-words">{report.note}</p>
      ) : (
        <p className="mt-1.5 text-xs italic text-muted-foreground">Tanpa catatan.</p>
      )}
      {report.status !== "open" && (report.admin_note || report.resolved_at) && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {report.resolved_at && <>Ditangani {formatDateTime(report.resolved_at)}. </>}
          {report.admin_note && (
            <>
              Catatan admin: <span className="text-foreground">{report.admin_note}</span>
            </>
          )}
        </p>
      )}
      {report.status === "open" && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Button
            size="sm"
            className="h-8 gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={onResolve}
          >
            <Check className="h-4 w-4" /> Selesai
          </Button>
          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={onReject}>
            <X className="h-4 w-4" /> Tolak
          </Button>
        </div>
      )}
    </li>
  );
}

function ResolveReportDialog({
  action,
  openCount,
  onClose,
  onDone,
}: {
  action: ReportAction | null;
  openCount: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const [adminNote, setAdminNote] = useState("");
  const [applyAll, setApplyAll] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (action) {
      setAdminNote("");
      // Default: selesaikan semua laporan terbuka soal ini sekaligus
      setApplyAll(action.status === "resolved" && openCount > 1);
    }
  }, [action, openCount]);

  const isResolve = action?.status === "resolved";
  const others = Math.max(0, openCount - 1);

  async function handleSubmit() {
    if (!action) return;
    setSaving(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const adminId = sessionData.session?.user.id ?? null;
    const payload = {
      status: action.status,
      admin_note: adminNote.trim() || null,
      resolved_at: new Date().toISOString(),
      resolved_by: adminId,
    };
    let query = supabase.from("tryout_question_reports").update(payload);
    query =
      applyAll && others > 0
        ? query.eq("question_id", action.report.question_id).eq("status", "open")
        : query.eq("id", action.report.id).eq("status", "open");
    const { data, error } = await query.select("id");
    setSaving(false);
    if (error) {
      toast.error(`Gagal memperbarui laporan: ${error.message}`);
      return;
    }
    const n = data?.length ?? 0;
    if (n === 0) {
      toast.error("Tidak ada laporan yang diperbarui (mungkin sudah ditangani admin lain).");
    } else {
      toast.success(`${n} laporan ditandai ${isResolve ? "selesai" : "ditolak"}.`);
    }
    onDone();
  }

  return (
    <Dialog open={!!action} onOpenChange={(v) => !v && !saving && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isResolve ? "Tandai laporan selesai" : "Tolak laporan"}</DialogTitle>
          <DialogDescription>
            {action && (
              <>
                Laporan &ldquo;{reasonLabel(action.report.reason)}&rdquo; dari{" "}
                <span className="font-mono">{shortId(action.report.user_id)}</span>.{" "}
                {isResolve
                  ? "Pastikan soal sudah diperbaiki bila memang bermasalah."
                  : "Gunakan bila laporan tidak valid."}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="admin-note">Catatan admin (opsional)</Label>
            <Textarea
              id="admin-note"
              value={adminNote}
              maxLength={500}
              rows={3}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder={
                isResolve ? "Contoh: Kunci sudah dikoreksi dari B ke D." : "Alasan penolakan..."
              }
            />
            <p className="mt-1 text-right text-[11px] text-muted-foreground">
              {adminNote.length}/500
            </p>
          </div>

          {others > 0 && (
            <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3">
              <Checkbox
                id="apply-all"
                checked={applyAll}
                onCheckedChange={(v) => setApplyAll(v === true)}
                className="mt-0.5"
              />
              <Label htmlFor="apply-all" className="text-sm font-normal leading-snug">
                Terapkan juga ke {others} laporan terbuka lain untuk soal ini (total {openCount}{" "}
                laporan).
              </Label>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={saving}
            className={cn(
              "gap-1.5",
              isResolve && "bg-emerald-600 text-white hover:bg-emerald-700",
              !isResolve && "bg-red-600 text-white hover:bg-red-700",
            )}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isResolve ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            {isResolve ? "Tandai selesai" : "Tolak laporan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Pratinjau soal
 * ──────────────────────────────────────────────────────────────────────────── */

function QuestionPreview({ question: q, setName }: { question: QuestionRow; setName?: string }) {
  const options = normalizeOptions(q.options);
  const isTkp = q.subtest === "tkp";
  const scores = parseScores(q.scores);
  const detail = parseDetail(q.explanation_detail);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="font-semibold text-foreground">{setName ?? "Set tidak dikenal"}</span>
        <span className="text-muted-foreground">· No. {q.question_number}</span>
        <Badge
          variant="outline"
          className={cn("px-1.5 py-0 text-[10px]", SUBTEST_STYLE[q.subtest])}
        >
          {q.subtest.toUpperCase()}
        </Badge>
        {q.category && (
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            {q.category}
          </Badge>
        )}
        <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
          {DIFFICULTY_LABELS[q.difficulty] ?? q.difficulty}
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            "gap-1 px-1.5 py-0 text-[10px]",
            detail
              ? "border-emerald-400/40 text-emerald-700 dark:text-emerald-400"
              : "text-muted-foreground",
          )}
        >
          <BookOpenCheck className="h-3 w-3" />
          {detail ? "Pembahasan detail ada" : "Belum ada pembahasan detail"}
        </Badge>
      </div>

      <div
        className="prose prose-sm mt-2 max-w-none break-words text-sm text-foreground dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: sanitizeTryoutHtml(q.question_text) }}
      />

      {safeTryoutImageUrl(q.question_image_url) && (
        <img
          src={safeTryoutImageUrl(q.question_image_url)!}
          alt="Gambar soal"
          className="mt-2 max-h-40 w-full rounded-md border bg-white object-contain object-left"
        />
      )}

      <ul className="mt-2 space-y-1" aria-label="Pilihan jawaban">
        {options.map((o) => {
          const isKey = !isTkp && q.correct_answer === o.key;
          const score = scores[o.key as OptionKey];
          return (
            <li
              key={o.key}
              className={cn(
                "flex gap-2 rounded-md border px-2.5 py-1.5 text-sm",
                isKey && "border-emerald-500/60 bg-emerald-500/10",
                isTkp && score === 5 && "border-emerald-500/40 bg-emerald-500/5",
              )}
            >
              <span className="font-bold">{o.key}.</span>
              {o.image_url && (
                <img
                  src={o.image_url}
                  alt={o.text || `Gambar opsi ${o.key}`}
                  className="h-12 w-12 shrink-0 rounded border bg-white object-contain"
                />
              )}
              <span
                className="min-w-0 flex-1 break-words"
                dangerouslySetInnerHTML={{ __html: sanitizeTryoutHtml(o.text) }}
              />
              {isKey && (
                <span className="shrink-0 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Kunci
                </span>
              )}
              {isTkp && (
                <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                  Skor {score ?? "?"}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {q.explanation && (
        <div className="mt-2 rounded-md bg-muted/40 p-2.5 text-xs">
          <span className="font-semibold">Pembahasan singkat: </span>
          <span
            className="whitespace-pre-line break-words"
            dangerouslySetInnerHTML={{ __html: sanitizeTryoutHtml(q.explanation) }}
          />
        </div>
      )}

      {detail && (
        <details className="mt-2 rounded-md border p-2.5 text-xs">
          <summary className="cursor-pointer font-semibold">Lihat pembahasan detail</summary>
          <div className="mt-2 space-y-1.5">
            <p>
              <span className="font-semibold">Ringkasan:</span> {detail.summary}
            </p>
            {detail.concept && (
              <p>
                <span className="font-semibold">Konsep:</span> {detail.concept}
              </p>
            )}
            {detail.steps.length > 0 && (
              <ol className="list-decimal space-y-0.5 pl-5">
                {detail.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            )}
            {Object.keys(detail.options).length > 0 && (
              <ul className="space-y-0.5">
                {Object.entries(detail.options).map(([k, v]) => (
                  <li key={k}>
                    <span className="font-semibold">{k}:</span> {v}
                  </li>
                ))}
              </ul>
            )}
            {detail.tips && (
              <p>
                <span className="font-semibold">Tips:</span> {detail.tips}
              </p>
            )}
            {detail.reference && (
              <p>
                <span className="font-semibold">Referensi:</span> {detail.reference}
              </p>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Dialog edit soal
 * ──────────────────────────────────────────────────────────────────────────── */

function EditQuestionDialog({
  questionId,
  setNameById,
  onClose,
  onSaved,
}: {
  questionId: string | null;
  setNameById: Map<string, string>;
  onClose: () => void;
  onSaved: (questionId: string, contentChanged: boolean) => void;
}) {
  const [original, setOriginal] = useState<QuestionRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [optionTexts, setOptionTexts] = useState<Record<OptionKey, string>>(emptyOptionRecord(""));
  // Gambar soal & opsi (opsional). Opsi bergambar tetap boleh punya teks (dipakai sebagai alt).
  const [questionImage, setQuestionImage] = useState<string | null>(null);
  const [optionImages, setOptionImages] = useState<Record<OptionKey, string>>(
    emptyOptionRecord(""),
  );
  const [uploading, setUploading] = useState<string | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string>("");
  const [scoreInputs, setScoreInputs] = useState<Record<OptionKey, string>>(emptyOptionRecord(""));
  const [explanation, setExplanation] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!questionId) {
      setOriginal(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErrors([]);
    void (async () => {
      const { data, error } = await supabase
        .from("tryout_questions")
        .select(QUESTION_COLUMNS)
        .eq("id", questionId)
        .maybeSingle();
      if (cancelled) return;
      setLoading(false);
      if (error || !data) {
        toast.error(error ? `Gagal memuat soal: ${error.message}` : "Soal tidak ditemukan.");
        onClose();
        return;
      }
      const q = data as unknown as QuestionRow;
      const opts = normalizeOptions(q.options);
      const sc = parseScores(q.scores);
      setOriginal(q);
      setQuestionText(q.question_text);
      setQuestionImage(safeTryoutImageUrl(q.question_image_url));
      setOptionImages(
        Object.fromEntries(
          OPTION_KEYS.map((k) => [k, opts.find((o) => o.key === k)?.image_url ?? ""]),
        ) as Record<OptionKey, string>,
      );
      setOptionTexts(
        Object.fromEntries(
          OPTION_KEYS.map((k) => [k, opts.find((o) => o.key === k)?.text ?? ""]),
        ) as Record<OptionKey, string>,
      );
      setCorrectAnswer(q.correct_answer ?? "");
      setScoreInputs(
        Object.fromEntries(
          OPTION_KEYS.map((k) => [k, sc[k] != null ? String(sc[k]) : ""]),
        ) as Record<OptionKey, string>,
      );
      setExplanation(q.explanation ?? "");
      setCategory(q.category ?? "");
      setDifficulty(q.difficulty || "medium");
    })();
    return () => {
      cancelled = true;
    };
    // onClose sengaja tidak dimasukkan: hanya muat ulang saat soal berganti
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  const isTkp = original?.subtest === "tkp";

  function validate(): string[] {
    const errs: string[] = [];
    if (!questionText.trim()) errs.push("Teks soal wajib diisi.");
    const emptyOpts = OPTION_KEYS.filter((k) => !optionTexts[k].trim() && !optionImages[k]);
    if (emptyOpts.length > 0)
      errs.push(`Opsi ${emptyOpts.join(", ")} masih kosong (isi teks atau unggah gambar).`);
    const texts = OPTION_KEYS.filter((k) => !optionImages[k])
      .map((k) => optionTexts[k].trim().toLowerCase())
      .filter(Boolean);
    if (new Set(texts).size !== texts.length) errs.push("Ada opsi dengan teks yang sama.");
    const imgs = OPTION_KEYS.map((k) => optionImages[k]).filter(Boolean);
    if (new Set(imgs).size !== imgs.length) errs.push("Ada opsi dengan gambar yang sama.");
    if (isTkp) {
      const vals = OPTION_KEYS.map((k) => Number(scoreInputs[k]));
      const sorted = [...vals].sort((a, b) => a - b);
      const isPermutation = sorted.every((v, i) => v === i + 1);
      if (!isPermutation) {
        errs.push("Skor TKP harus berisi angka 1–5 masing-masing tepat satu kali.");
      }
    } else if (!OPTION_KEYS.includes(correctAnswer as OptionKey)) {
      errs.push("Pilih kunci jawaban (A–E).");
    }
    if (!["easy", "medium", "hard"].includes(difficulty))
      errs.push("Tingkat kesulitan tidak valid.");
    return errs;
  }

  async function handleUpload(slot: "soal" | OptionKey, file: File | undefined) {
    if (!file || !original) return;
    setUploading(slot);
    try {
      const url = await uploadManualImage(file, original.id, slot);
      if (slot === "soal") setQuestionImage(url);
      else setOptionImages((s) => ({ ...s, [slot]: url }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload gambar gagal");
    } finally {
      setUploading(null);
    }
  }

  async function handleSave() {
    if (!original) return;
    const errs = validate();
    setErrors(errs);
    if (errs.length > 0) return;

    const newOptions = OPTION_KEYS.map((k) => ({
      key: k,
      text: optionTexts[k].trim() || (optionImages[k] ? `Gambar pilihan ${k}` : ""),
      ...(optionImages[k] ? { image_url: optionImages[k] } : {}),
    }));
    const newScores = isTkp
      ? (Object.fromEntries(OPTION_KEYS.map((k) => [k, Number(scoreInputs[k])])) as Record<
          OptionKey,
          number
        >)
      : null;
    const newCorrect = isTkp ? null : correctAnswer;

    // Hanya kirim kolom konten yang benar-benar berubah supaya pembahasan
    // detail tidak direset tanpa alasan (trigger DB membandingkan nilainya).
    const oldOptions = normalizeOptions(original.options);
    const optionsChanged =
      oldOptions.length !== newOptions.length ||
      newOptions.some(
        (o, i) =>
          oldOptions[i]?.key !== o.key ||
          oldOptions[i]?.text !== o.text ||
          (oldOptions[i]?.image_url ?? "") !== (o.image_url ?? ""),
      );
    const oldScores = parseScores(original.scores);
    const scoresChanged = isTkp
      ? OPTION_KEYS.some((k) => oldScores[k] !== newScores?.[k])
      : original.scores != null;
    const textChanged = questionText !== original.question_text;
    const imageChanged =
      (questionImage ?? null) !== (safeTryoutImageUrl(original.question_image_url) ?? null);
    const correctChanged = newCorrect !== original.correct_answer;
    const contentChanged =
      optionsChanged || scoresChanged || textChanged || correctChanged || imageChanged;

    const payload: {
      question_text?: string;
      question_image_url?: string | null;
      options?: Array<{ key: string; text: string; image_url?: string }>;
      correct_answer?: string | null;
      scores?: Record<string, number> | null;
      explanation: string | null;
      category: string | null;
      difficulty: string;
    } = {
      explanation: explanation.trim() || null,
      category: category.trim() || null,
      difficulty,
    };
    if (textChanged) payload.question_text = questionText;
    if (imageChanged) payload.question_image_url = questionImage;
    if (optionsChanged) payload.options = newOptions;
    if (correctChanged) payload.correct_answer = newCorrect;
    if (scoresChanged) payload.scores = newScores;

    setSaving(true);
    const { data, error } = await supabase
      .from("tryout_questions")
      .update(payload)
      .eq("id", original.id)
      .select("id");
    setSaving(false);
    if (error) {
      toast.error(`Gagal menyimpan soal: ${error.message}`);
      return;
    }
    if (!data || data.length === 0) {
      toast.error("Soal tidak tersimpan (akses ditolak atau soal sudah dihapus).");
      return;
    }
    onSaved(original.id, contentChanged);
  }

  return (
    <Dialog open={!!questionId} onOpenChange={(v) => !v && !saving && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Edit Soal
            {original && ` — No. ${original.question_number} (${original.subtest.toUpperCase()})`}
          </DialogTitle>
          <DialogDescription>
            {original
              ? (setNameById.get(original.exam_set_id) ?? "Set tidak dikenal")
              : "Memuat..."}
          </DialogDescription>
        </DialogHeader>

        {loading || !original ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 rounded-lg border border-sky-300/60 bg-sky-50 p-3 text-xs text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
              <BookOpenCheck className="h-4 w-4 shrink-0" />
              <span>
                Bila teks soal, opsi, kunci, atau skor diubah, pembahasan detail{" "}
                <b>direset otomatis</b>. Buat ulang lewat tombol &ldquo;Buat ulang pembahasan&rdquo;
                setelah menyimpan.
              </span>
            </div>

            <div>
              <Label htmlFor="eq-text">Teks soal</Label>
              <Textarea
                id="eq-text"
                rows={5}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                HTML sederhana diperbolehkan (misal &lt;b&gt;, &lt;br&gt;, &lt;table&gt;).
              </p>
            </div>

            <ImageSlot
              label="Gambar soal (opsional)"
              url={questionImage}
              busy={uploading === "soal"}
              onPick={(f) => void handleUpload("soal", f)}
              onRemove={() => setQuestionImage(null)}
              wide
            />

            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium">
                Opsi jawaban {isTkp ? "& skor TKP (1–5)" : ""}
              </legend>
              {OPTION_KEYS.map((k) => (
                <div key={k} className="flex items-start gap-2">
                  <Label
                    htmlFor={`eq-opt-${k}`}
                    className="mt-2.5 w-5 shrink-0 text-center font-bold"
                  >
                    {k}
                  </Label>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Textarea
                      id={`eq-opt-${k}`}
                      rows={2}
                      className="min-h-0"
                      placeholder={optionImages[k] ? "Teks alternatif gambar (opsional)" : ""}
                      value={optionTexts[k]}
                      onChange={(e) => setOptionTexts((s) => ({ ...s, [k]: e.target.value }))}
                    />
                    <ImageSlot
                      label={`Gambar opsi ${k}`}
                      url={optionImages[k] || null}
                      busy={uploading === k}
                      onPick={(f) => void handleUpload(k, f)}
                      onRemove={() => setOptionImages((s) => ({ ...s, [k]: "" }))}
                    />
                  </div>
                  {isTkp && (
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      inputMode="numeric"
                      aria-label={`Skor opsi ${k}`}
                      className="w-16 shrink-0"
                      value={scoreInputs[k]}
                      onChange={(e) => setScoreInputs((s) => ({ ...s, [k]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </fieldset>

            <div className="grid gap-3 sm:grid-cols-3">
              {!isTkp && (
                <div>
                  <Label htmlFor="eq-key">Kunci jawaban</Label>
                  <select
                    id="eq-key"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Pilih...</option>
                    {OPTION_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <Label htmlFor="eq-category">Kategori</Label>
                <Input
                  id="eq-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Contoh: Nasionalisme"
                />
              </div>
              <div>
                <Label htmlFor="eq-difficulty">Tingkat kesulitan</Label>
                <select
                  id="eq-difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="easy">Mudah</option>
                  <option value="medium">Sedang</option>
                  <option value="hard">Sulit</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="eq-explanation">Pembahasan singkat</Label>
              <Textarea
                id="eq-explanation"
                rows={4}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
              />
            </div>

            {errors.length > 0 && (
              <div
                role="alert"
                className="rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
              >
                <ul className="list-disc space-y-0.5 pl-4">
                  {errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={saving || loading || !original}
            className="gap-1.5"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Simpan soal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function emptyOptionRecord<T>(value: T): Record<OptionKey, T> {
  return { A: value, B: value, C: value, D: value, E: value };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Lengkapi pembahasan detail (massal)
 * ──────────────────────────────────────────────────────────────────────────── */

const BULK_LIMIT = 3;
const MAX_EMPTY_ROUNDS = 3;

function BulkExplainCard({
  examSets,
  refreshKey,
  onEdit,
  onFinished,
}: {
  examSets: ExamSetLite[];
  refreshKey: number;
  onEdit: (questionId: string) => void;
  onFinished: () => void;
}) {
  const [selectedSetId, setSelectedSetId] = useState("");
  const [missing, setMissing] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{
    initial: number;
    processed: number;
    skipped: number;
    remaining: number;
  } | null>(null);
  const [disputed, setDisputed] = useState<BulkIssue[]>([]);
  const [failed, setFailed] = useState<BulkIssue[]>([]);
  const [stopMessage, setStopMessage] = useState<string | null>(null);
  const stopRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      // Hentikan loop bila tab/komponen ditutup
      mountedRef.current = false;
      stopRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (examSets.length > 0 && !examSets.some((s) => s.id === selectedSetId)) {
      setSelectedSetId(examSets[0].id);
    }
  }, [examSets, selectedSetId]);

  const loadCounts = useCallback(async (setId: string) => {
    if (!setId) return;
    setCounting(true);
    const [missingRes, totalRes] = await Promise.all([
      supabase
        .from("tryout_questions")
        .select("id", { count: "exact", head: true })
        .eq("exam_set_id", setId)
        .is("explanation_detail", null),
      supabase
        .from("tryout_questions")
        .select("id", { count: "exact", head: true })
        .eq("exam_set_id", setId),
    ]);
    if (!mountedRef.current) return;
    setCounting(false);
    if (missingRes.error || totalRes.error) {
      toast.error("Gagal menghitung soal tanpa pembahasan detail.");
      return;
    }
    setMissing(missingRes.count ?? 0);
    setTotal(totalRes.count ?? 0);
  }, []);

  useEffect(() => {
    if (!running) void loadCounts(selectedSetId);
    // running sengaja tidak dimasukkan: hitungan dimuat ulang manual setelah loop selesai
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSetId, refreshKey, loadCounts]);

  async function runLoop() {
    const setId = selectedSetId;
    if (!setId) {
      toast.error("Pilih exam set terlebih dahulu.");
      return;
    }
    stopRef.current = false;
    setRunning(true);
    setStopMessage(null);
    setDisputed([]);
    setFailed([]);

    const skip = new Set<string>();
    const disputedList: BulkIssue[] = [];
    const failedList: BulkIssue[] = [];
    let processedTotal = 0;
    let emptyRounds = 0;
    let initial = missing ?? 0;
    let message: string | null = null;
    setProgress({ initial, processed: 0, skipped: 0, remaining: initial });

    while (!stopRef.current) {
      let res: Awaited<ReturnType<typeof callExplain>>;
      try {
        res = await callExplain({
          exam_set_id: setId,
          limit: BULK_LIMIT,
          skip_ids: Array.from(skip).slice(0, 200),
        });
      } catch {
        res = { ok: false, status: 0, data: {} };
      }
      if (!mountedRef.current) return;

      if (!res.ok) {
        if (res.status === 429) {
          message = errorMessage(
            res.data,
            "Batas request AI tercapai. Tunggu beberapa menit lalu lanjutkan.",
          );
          break;
        }
        if (res.status === 401 || res.status === 403) {
          message = errorMessage(res.data, "Akses ditolak. Silakan login ulang sebagai admin.");
          break;
        }
        emptyRounds++;
        if (emptyRounds >= MAX_EMPTY_ROUNDS) {
          message = `Berhenti: ${MAX_EMPTY_ROUNDS} putaran berturut-turut gagal (${errorMessage(res.data, "error server")}).`;
          break;
        }
        continue;
      }

      const data = res.data as unknown as BulkResponse;
      const processed = Number(data.processed) || 0;
      processedTotal += processed;
      for (const d of Array.isArray(data.disputed) ? data.disputed : []) {
        if (!skip.has(d.id)) disputedList.push(d);
        skip.add(d.id);
      }
      for (const f of Array.isArray(data.failed) ? data.failed : []) {
        if (!skip.has(f.id)) failedList.push(f);
        skip.add(f.id);
      }
      const remaining = Number(data.remaining) || 0;
      // Hitungan awal bisa basi (soal baru ditambah) — sesuaikan agar progres masuk akal
      initial = Math.max(initial, processedTotal + remaining);

      setProgress({ initial, processed: processedTotal, skipped: skip.size, remaining });
      setDisputed([...disputedList]);
      setFailed([...failedList]);

      // Sisa yang masih bisa dikerjakan = belum terisi dikurangi yang dilewati
      if (remaining - skip.size <= 0) break;

      if (processed === 0) {
        emptyRounds++;
        if (emptyRounds >= MAX_EMPTY_ROUNDS) {
          message = `Berhenti: ${MAX_EMPTY_ROUNDS} putaran berturut-turut tanpa progres.`;
          break;
        }
      } else {
        emptyRounds = 0;
      }
    }

    if (!mountedRef.current) return;
    if (stopRef.current && !message) message = "Dihentikan oleh admin.";
    setStopMessage(message);
    setRunning(false);
    void loadCounts(setId);
    onFinished();

    const skippedNote = skip.size > 0 ? `, ${skip.size} dilewati (perlu dicek / dicoba lagi)` : "";
    if (processedTotal > 0) {
      toast.success(`${processedTotal} pembahasan detail berhasil dibuat${skippedNote}.`);
    } else if (message) {
      toast.error(message);
    } else {
      toast.info(`Tidak ada pembahasan baru yang dibuat${skippedNote}.`);
    }
  }

  const pct =
    progress && progress.initial > 0
      ? Math.min(
          100,
          Math.round(((progress.processed + progress.skipped) / progress.initial) * 100),
        )
      : 0;

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5" aria-labelledby="lengkapi">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 id="lengkapi" className="font-display text-lg font-bold">
          Lengkapi Pembahasan Detail
        </h3>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Buat pembahasan detail (AI) untuk soal yang belum memilikinya, {BULK_LIMIT} soal per
        putaran. Soal yang kuncinya diragukan AI tidak disimpan dan ditampilkan di bawah untuk
        diperiksa.
      </p>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <Label htmlFor="bulk-set">Exam Set</Label>
          <select
            id="bulk-set"
            value={selectedSetId}
            disabled={running}
            onChange={(e) => {
              setSelectedSetId(e.target.value);
              setProgress(null);
              setDisputed([]);
              setFailed([]);
              setStopMessage(null);
            }}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-60"
          >
            {examSets.length === 0 && <option value="">Belum ada exam set</option>}
            {examSets.map((es) => (
              <option key={es.id} value={es.id}>
                {es.name}
              </option>
            ))}
          </select>
        </div>
        {running ? (
          <Button
            variant="outline"
            className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
            onClick={() => {
              stopRef.current = true;
            }}
          >
            <CircleStop className="h-4 w-4" /> Hentikan
          </Button>
        ) : (
          <Button
            className="gap-1.5"
            disabled={!selectedSetId || counting || missing === 0}
            onClick={() => void runLoop()}
          >
            <Sparkles className="h-4 w-4" /> Mulai lengkapi
          </Button>
        )}
      </div>

      <p className="mt-3 text-sm" aria-live="polite">
        {counting && missing === null ? (
          <span className="text-muted-foreground">Menghitung...</span>
        ) : missing !== null && total !== null ? (
          missing === 0 ? (
            <span className="text-emerald-700 dark:text-emerald-400">
              Semua {total} soal sudah punya pembahasan detail.
            </span>
          ) : (
            <>
              <b>{missing}</b> dari {total} soal belum punya pembahasan detail.
            </>
          )
        ) : null}
      </p>

      {progress && (
        <div className="mt-3 space-y-1.5" aria-live="polite">
          <Progress value={pct} aria-label="Progres pembuatan pembahasan detail" />
          <p className="text-xs text-muted-foreground">
            {running && <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />}
            {progress.processed} berhasil · {progress.skipped} dilewati · sisa belum terisi{" "}
            {progress.remaining}
          </p>
        </div>
      )}

      {stopMessage && !running && (
        <div className="mt-3 flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{stopMessage}</span>
        </div>
      )}

      {disputed.length > 0 && (
        <IssueList
          title="Kunci diragukan AI — periksa soal"
          tone="amber"
          items={disputed}
          onEdit={onEdit}
        />
      )}
      {failed.length > 0 && (
        <IssueList
          title="Gagal dibuat — bisa dicoba lagi"
          tone="muted"
          items={failed}
          onEdit={onEdit}
        />
      )}
    </section>
  );
}

function IssueList({
  title,
  tone,
  items,
  onEdit,
}: {
  title: string;
  tone: "amber" | "muted";
  items: BulkIssue[];
  onEdit: (questionId: string) => void;
}) {
  return (
    <div className="mt-4">
      <h4
        className={cn(
          "mb-2 flex items-center gap-1.5 text-sm font-semibold",
          tone === "amber" ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground",
        )}
      >
        <AlertTriangle className="h-4 w-4" /> {title} ({items.length})
      </h4>
      <ul className="space-y-2">
        {items.map((it) => (
          <li
            key={it.id}
            className="flex flex-col gap-2 rounded-lg border p-3 text-sm sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0">
              <span className="font-semibold">Soal No. {it.question_number}</span>
              <p className="mt-0.5 break-words text-xs text-muted-foreground">{it.reason}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 gap-1.5"
              onClick={() => onEdit(it.id)}
            >
              <Pencil className="h-4 w-4" /> Buka soal
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Slot unggah gambar (PNG/JPEG/WebP ≤ 1 MB) dengan pratinjau & hapus. */
function ImageSlot({
  label,
  url,
  busy,
  onPick,
  onRemove,
  wide = false,
}: {
  label: string;
  url: string | null;
  busy: boolean;
  onPick: (file: File | undefined) => void;
  onRemove: () => void;
  wide?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {url ? (
        <img
          src={url}
          alt={label}
          className={cn(
            "rounded-md border bg-white object-contain",
            wide ? "max-h-28 w-full max-w-md" : "h-14 w-14",
          )}
        />
      ) : (
        <span className="text-muted-foreground">{label}: belum ada</span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        aria-label={label}
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 gap-1 px-2 text-xs"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
        {url ? "Ganti" : "Unggah"}
      </Button>
      {url && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-red-600"
          onClick={onRemove}
        >
          Hapus
        </Button>
      )}
    </div>
  );
}
