/**
 * Inline CV Editor — Side-by-Side with Zoom Controls
 *
 * Left:  CvPreview original (clean template, no changes)
 * Right: CvPreview + stabilo highlights injected directly into the rendered DOM on the
 *        exact suggestion text (or the suggestion list). Click a highlight → modal dialog.
 * Toolbar: progress, zoom (40–120%), apply all / save.
 * Mobile (< lg): panels become tabs (CV + Sorotan | Saran | CV Asli).
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Check,
  X,
  Pencil,
  Sparkles,
  CheckCircle2,
  Zap,
  FileText,
  Lightbulb,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CvData, TemplateId } from "@/lib/cv-types";
import { CvPreview } from "./CvPreview";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Suggestion {
  priority: "high" | "medium" | "low";
  category: string;
  current: string;
  suggested: string;
  impact: string;
  targetSection?: string;
  bulletIndex?: number | null;
}

export interface InlineCvEditorProps {
  cvData: CvData;
  templateId: TemplateId;
  suggestions: Suggestion[];
  onApplySuggestion: (index: number, newText: string) => void;
  onApplyAll: () => void;
  onSave: () => void;
}

// ─── Highlight colours per priority ─────────────────────────────────────────

const HIGHLIGHT_STYLE: Record<
  Suggestion["priority"],
  { bg: string; border: string; badge: string; label: string }
> = {
  high: {
    bg: "rgba(254,202,202,0.7)",
    border: "#f87171",
    badge: "bg-red-100 text-red-800 border-red-200",
    label: "Tinggi",
  },
  medium: {
    bg: "rgba(253,224,71,0.65)",
    border: "#fbbf24",
    badge: "bg-amber-100 text-amber-900 border-amber-200",
    label: "Sedang",
  },
  low: {
    bg: "rgba(187,247,208,0.65)",
    border: "#4ade80",
    badge: "bg-green-100 text-green-800 border-green-200",
    label: "Rendah",
  },
};

const ZOOM_PRESETS = [50, 65, 85, 100];
const ZOOM_MIN = 30;
const ZOOM_MAX = 120;
/** Lebar A4 yang dirender CvPreview (210mm @ 96dpi). */
const CV_PX_WIDTH = 794;

// ─── DOM helpers ─────────────────────────────────────────────────────────────

/** Remove all previously injected marks from the container */
function clearHighlights(container: HTMLElement) {
  container.querySelectorAll<HTMLElement>("mark.cv-ai-mark").forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    mark.querySelectorAll(".cv-ai-badge").forEach((b) => b.remove());
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    try {
      parent.normalize();
    } catch (_) {
      /* noop */
    }
  });
}

/** Inject highlight marks for a single suggestion needle into container */
function injectHighlight(
  container: HTMLElement,
  needle: string,
  idx: number,
  priority: Suggestion["priority"],
  onClick: (idx: number) => void,
) {
  if (!needle || needle.length < 4) return;

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = node.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      const tag = p.tagName;
      if (tag === "SCRIPT" || tag === "STYLE") return NodeFilter.FILTER_REJECT;
      if (p.closest("mark.cv-ai-mark")) return NodeFilter.FILTER_SKIP;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) nodes.push(n as Text);

  const fullText = nodes.map((n) => n.textContent ?? "").join("");
  const pos = fullText.toLowerCase().indexOf(needle.toLowerCase());
  if (pos === -1) return;

  const end = pos + needle.length;
  const style = HIGHLIGHT_STYLE[priority];

  type Seg = { node: Text; start: number; end: number };
  const segs: Seg[] = [];
  let charCount = 0;

  for (const node of nodes) {
    const len = node.textContent?.length ?? 0;
    const nStart = charCount;
    const nEnd = charCount + len;

    if (nEnd > pos && nStart < end) {
      segs.push({
        node,
        start: Math.max(0, pos - nStart),
        end: Math.min(len, end - nStart),
      });
    }

    charCount += len;
    if (charCount >= end) break;
  }

  segs.forEach(({ node, start, end: segEnd }, segIdx) => {
    try {
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, segEnd);

      const mark = document.createElement("mark");
      mark.className = "cv-ai-mark";
      mark.dataset.idx = String(idx);
      mark.style.cssText = [
        `background-color:${style.bg}`,
        `border-bottom:2px solid ${style.border}`,
        `border-radius:2px`,
        `cursor:pointer`,
        `padding:0 1px`,
        `transition:filter .15s`,
      ].join(";");

      const fragment = range.extractContents();
      mark.appendChild(fragment);
      range.insertNode(mark);

      if (segIdx === segs.length - 1) {
        const badge = document.createElement("span");
        badge.className = "cv-ai-badge";
        badge.textContent = "✓";
        badge.style.cssText = [
          `display:inline-flex`,
          `align-items:center`,
          `justify-content:center`,
          `width:14px`,
          `height:14px`,
          `background:#15803d`,
          `color:#fff`,
          `border-radius:50%`,
          `font-size:8px`,
          `font-weight:700`,
          `margin-left:2px`,
          `vertical-align:middle`,
          `flex-shrink:0`,
        ].join(";");
        mark.appendChild(badge);
      }

      mark.addEventListener("click", (e) => {
        e.stopPropagation();
        onClick(idx);
      });
      mark.addEventListener("mouseenter", () => {
        mark.style.filter = "brightness(0.92)";
      });
      mark.addEventListener("mouseleave", () => {
        mark.style.filter = "";
      });
    } catch (_) {
      /* skip if range crosses element boundaries */
    }
  });
}

// ─── Main component ───────────────────────────────────────────────────────────

type EditorView = "highlight" | "list" | "original";

export function InlineCvEditor({
  cvData,
  templateId,
  suggestions,
  onApplySuggestion,
  onApplyAll,
  onSave,
}: InlineCvEditorProps) {
  const [appliedIndices, setAppliedIndices] = useState<Set<number>>(new Set());
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  // "fit" = menyesuaikan lebar panel (default); angka = zoom manual.
  const [zoomMode, setZoomMode] = useState<"fit" | number>("fit");
  const [fitZoom, setFitZoom] = useState(65);
  // Mobile: tiga tab. Desktop: panel kiri selalu tampil, panel kanan memakai highlight | list.
  const [view, setView] = useState<EditorView>("highlight");

  const rightWrapperRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);
  const zoomLevel = zoomMode === "fit" ? fitZoom : zoomMode;

  // Hitung zoom yang membuat CV pas selebar panel yang tampil.
  useEffect(() => {
    const row = panelsRef.current;
    if (!row) return;
    const measure = () => {
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      const panelWidth = isDesktop ? row.clientWidth / 2 : row.clientWidth;
      const available = panelWidth - 32 - 12; // padding + ruang scrollbar
      const next = Math.floor((available / CV_PX_WIDTH) * 100);
      setFitZoom(Math.max(ZOOM_MIN, Math.min(100, next)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const closeModal = useCallback(() => {
    setActiveIdx(null);
    setEditingIndex(null);
    setEditText("");
  }, []);

  const handleHighlightClick = useCallback((idx: number) => {
    setActiveIdx(idx);
    setEditingIndex(null);
    setEditText("");
  }, []);

  const handleAccept = useCallback(
    (index: number) => {
      const text = editingIndex === index ? editText : suggestions[index].suggested;
      onApplySuggestion(index, text);
      setAppliedIndices((prev) => new Set([...prev, index]));
      closeModal();
    },
    [closeModal, editText, editingIndex, onApplySuggestion, suggestions],
  );

  const handleEdit = useCallback(
    (index: number) => {
      setEditingIndex(index);
      setEditText(suggestions[index].suggested);
    },
    [suggestions],
  );

  const handleAcceptAll = useCallback(() => {
    onApplyAll();
    setAppliedIndices(new Set(suggestions.map((_, i) => i)));
    closeModal();
  }, [closeModal, onApplyAll, suggestions]);

  const handleZoomIn = () => {
    setZoomMode(Math.min(ZOOM_MAX, zoomLevel + 10));
  };

  const handleZoomOut = () => {
    setZoomMode(Math.max(ZOOM_MIN, zoomLevel - 10));
  };

  // ── Inject highlights into right-panel DOM ────────────────────────────────
  useEffect(() => {
    const wrapper = rightWrapperRef.current;
    if (!wrapper) return;

    const timer = setTimeout(() => {
      clearHighlights(wrapper);
      suggestions.forEach((s, idx) => {
        if (appliedIndices.has(idx)) return;
        injectHighlight(wrapper, s.current?.trim() ?? "", idx, s.priority, handleHighlightClick);
      });
    }, 120);

    return () => clearTimeout(timer);
  }, [suggestions, appliedIndices, cvData, handleHighlightClick, zoomLevel]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const appliedCount = appliedIndices.size;
  const totalCount = suggestions.length;
  const pendingCount = totalCount - appliedCount;
  const appliedPercent = totalCount === 0 ? 100 : Math.round((appliedCount / totalCount) * 100);

  // CSS zoom ikut mengubah ukuran layout, jadi CV tidak terpotong dan bisa di-scroll.
  const zoomStyle: React.CSSProperties = { zoom: zoomLevel / 100 };

  const activeSuggestion = activeIdx !== null ? suggestions[activeIdx] : null;
  const activeCfg = activeSuggestion ? HIGHLIGHT_STYLE[activeSuggestion.priority] : null;

  const showList = view === "list";
  const mobileTabs: Array<{ id: EditorView; label: string }> = [
    { id: "highlight", label: "CV + Sorotan" },
    { id: "list", label: `Saran (${totalCount})` },
    { id: "original", label: "CV Asli" },
  ];

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 sm:w-64">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-bold text-gray-900">
              {appliedCount} dari {totalCount} saran diterapkan
            </p>
            <span className="text-xs font-bold text-gray-600">{appliedPercent}%</span>
          </div>
          <div
            className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-200"
            role="progressbar"
            aria-label="Saran yang sudah diterapkan"
            aria-valuenow={appliedPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-green-700 transition-[width] duration-300"
              style={{ width: `${appliedPercent}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Zoom pratinjau"
            className="flex items-center gap-0.5 rounded-xl border border-gray-200 bg-white p-0.5"
          >
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= ZOOM_MIN}
              aria-label="Perkecil"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 disabled:opacity-40"
            >
              <ZoomOut aria-hidden="true" className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoomMode("fit")}
              aria-pressed={zoomMode === "fit"}
              className={cn(
                "h-8 rounded-lg px-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700",
                zoomMode === "fit" ? "bg-green-700 text-white" : "text-gray-700 hover:bg-gray-100",
              )}
            >
              Pas
            </button>
            {ZOOM_PRESETS.map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setZoomMode(z)}
                aria-pressed={zoomMode === z}
                className={cn(
                  "hidden h-8 rounded-lg px-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 sm:block",
                  zoomMode === z ? "bg-green-700 text-white" : "text-gray-700 hover:bg-gray-100",
                )}
              >
                {z}%
              </button>
            ))}
            <span className="w-11 text-center text-xs font-bold tabular-nums text-gray-700 sm:hidden">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= ZOOM_MAX}
              aria-label="Perbesar"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 disabled:opacity-40"
            >
              <ZoomIn aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          {pendingCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="h-10 gap-1.5 rounded-xl border-2 border-gray-300 font-bold hover:border-green-700 hover:bg-green-50 hover:text-green-800"
              onClick={handleAcceptAll}
            >
              <Zap aria-hidden="true" className="h-4 w-4" />
              Terapkan Semua
            </Button>
          )}
          {appliedCount > 0 && (
            <Button
              size="sm"
              className="h-10 gap-1.5 rounded-xl bg-green-700 font-bold text-white hover:bg-green-800"
              onClick={onSave}
            >
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              Simpan
            </Button>
          )}
        </div>
      </div>

      {/* ── Tab (mobile) ───────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Tampilan editor review"
        className="grid grid-cols-3 gap-1 border-b border-gray-200 bg-white p-1.5 lg:hidden"
      >
        {mobileTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={view === tab.id}
            onClick={() => setView(tab.id)}
            className={cn(
              "h-10 rounded-xl px-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700",
              view === tab.id ? "bg-green-700 text-white" : "text-gray-700 hover:bg-gray-100",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        ref={panelsRef}
        className="flex h-[70dvh] min-h-[30rem] lg:h-[calc(100dvh-11rem)] lg:min-h-[34rem]"
      >
        {/* ════ LEFT — CV asli ════ */}
        <section
          aria-label="CV asli"
          className={cn(
            "min-w-0 flex-1 flex-col border-r border-gray-200",
            view === "original" ? "flex" : "hidden lg:flex",
          )}
        >
          <div className="flex shrink-0 items-center gap-2.5 border-b border-gray-200 bg-gray-50 px-4 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-gray-600 ring-1 ring-gray-200">
              <FileText aria-hidden="true" className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight text-gray-900">CV Asli</p>
              <p className="text-xs text-gray-600">Versi saat ini, tanpa sorotan</p>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto bg-gray-100/70">
            <div className="p-4">
              <div className="mx-auto w-fit" style={zoomStyle}>
                <CvPreview data={cvData} template={templateId} scale={1} />
              </div>
            </div>
          </div>
        </section>

        {/* ════ RIGHT — CV + saran ════ */}
        <section
          aria-label="CV dengan saran AI"
          className={cn("min-w-0 flex-1 flex-col", view === "original" ? "hidden lg:flex" : "flex")}
        >
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-green-50 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-700 text-white">
                <Sparkles aria-hidden="true" className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight text-gray-900">CV + Saran AI</p>
                <p className="text-xs text-gray-700">
                  {pendingCount > 0
                    ? `${pendingCount} saran menunggu`
                    : "Semua saran sudah diterapkan"}
                </p>
              </div>
            </div>

            {/* Desktop: sorotan | daftar */}
            <div
              role="group"
              aria-label="Mode tampilan saran"
              className="hidden rounded-xl border border-green-200 bg-white p-0.5 lg:flex"
            >
              {(
                [
                  { id: "highlight", label: "Sorotan" },
                  { id: "list", label: `Daftar saran (${totalCount})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={(view === "list") === (tab.id === "list")}
                  onClick={() => setView(tab.id)}
                  className={cn(
                    "h-8 rounded-[10px] px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700",
                    (view === "list") === (tab.id === "list")
                      ? "bg-green-700 text-white"
                      : "text-gray-700 hover:bg-green-50",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Daftar saran */}
          {showList && (
            <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50">
              <div className="space-y-3 p-4">
                {totalCount === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 text-center">
                    <CheckCircle2 aria-hidden="true" className="mx-auto h-8 w-8 text-green-700" />
                    <p className="mt-3 font-bold text-gray-900">Tidak ada saran tambahan</p>
                    <p className="mt-1 text-sm text-gray-600">
                      Hira AI tidak menemukan kalimat yang perlu diubah di CV-mu.
                    </p>
                  </div>
                ) : (
                  suggestions.map((s, idx) => {
                    const cfg = HIGHLIGHT_STYLE[s.priority];
                    const applied = appliedIndices.has(idx);
                    return (
                      <article
                        key={idx}
                        className={cn(
                          "rounded-2xl border bg-white p-4 shadow-sm",
                          applied ? "border-green-200 bg-green-50/60" : "border-gray-200",
                        )}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full border px-2.5 py-0.5 text-xs font-bold",
                              cfg.badge,
                            )}
                          >
                            Prioritas {cfg.label}
                          </span>
                          <span className="text-sm font-bold text-gray-900">{s.category}</span>
                          {applied && (
                            <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-green-800">
                              <Check aria-hidden="true" className="h-3.5 w-3.5" />
                              Diterapkan
                            </span>
                          )}
                        </div>

                        {s.current && (
                          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-relaxed text-red-800 line-through decoration-red-300">
                            {s.current}
                          </p>
                        )}
                        <p className="mt-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium leading-relaxed text-gray-900">
                          {s.suggested}
                        </p>
                        {s.impact && (
                          <p className="mt-2 flex gap-2 text-sm leading-relaxed text-gray-700">
                            <Lightbulb
                              aria-hidden="true"
                              className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                            />
                            {s.impact}
                          </p>
                        )}

                        {!applied && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              className="h-9 gap-1.5 rounded-xl bg-green-700 font-bold text-white hover:bg-green-800"
                              onClick={() => handleAccept(idx)}
                            >
                              <Check aria-hidden="true" className="h-4 w-4" />
                              Terapkan
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 gap-1.5 rounded-xl border-2 border-gray-300 font-bold hover:border-green-700 hover:bg-green-50"
                              onClick={() => {
                                handleHighlightClick(idx);
                                handleEdit(idx);
                              }}
                            >
                              <Pencil aria-hidden="true" className="h-4 w-4" />
                              Edit dulu
                            </Button>
                          </div>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* CV dengan sorotan: tetap ter-mount saat daftar tampil supaya ref & sorotan terjaga */}
          <div className={cn("min-h-0 flex-1 flex-col", showList ? "hidden" : "flex")}>
            {pendingCount > 0 ? (
              <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-gray-100 bg-white px-4 py-2.5 text-xs text-gray-700">
                <span className="font-semibold text-gray-900">Klik teks yang disorot:</span>
                {(["high", "medium", "low"] as const).map((p) => (
                  <span key={p} className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-4 rounded-sm"
                      style={{
                        background: HIGHLIGHT_STYLE[p].bg,
                        borderBottom: `2px solid ${HIGHLIGHT_STYLE[p].border}`,
                      }}
                    />
                    {HIGHLIGHT_STYLE[p].label}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex shrink-0 items-center gap-2 border-b border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-900">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-green-700" />
                Semua saran sudah diterapkan. CV-mu tersimpan otomatis.
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-auto bg-gray-100/70">
              <div className="p-4">
                <div ref={rightWrapperRef} className="mx-auto w-fit" style={zoomStyle}>
                  <CvPreview data={cvData} template={templateId} scale={1} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ════════════════════════════════════════════════════════
          SUGGESTION MODAL DIALOG (Centered, Never Clipped)
      ════════════════════════════════════════════════════════ */}
      <Dialog
        open={activeIdx !== null}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      >
        {activeSuggestion && activeCfg && (
          <DialogContent className="max-h-[90dvh] gap-0 overflow-hidden rounded-3xl border border-gray-200 p-0 shadow-2xl sm:max-w-lg">
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 bg-green-50 px-5 py-4 pr-12">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-700 text-white">
                  <Sparkles aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <DialogTitle className="font-display text-lg font-extrabold text-gray-900">
                    Saran perbaikan
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-700">
                    {activeSuggestion.category}
                  </DialogDescription>
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold",
                  activeCfg.badge,
                )}
              >
                {activeCfg.label}
              </span>
            </div>

            <div className="max-h-[60dvh] space-y-4 overflow-y-auto p-5">
              {activeSuggestion.current && (
                <div>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                    Teks saat ini
                  </p>
                  <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-relaxed text-red-800 line-through decoration-red-300">
                    {activeSuggestion.current}
                  </p>
                </div>
              )}

              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-green-800">
                  Rekomendasi AI
                </p>
                {editingIndex === activeIdx ? (
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="min-h-[110px] rounded-xl border-gray-300 text-sm focus-visible:ring-green-700"
                    aria-label="Ubah teks rekomendasi"
                    autoFocus
                  />
                ) : (
                  <p className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium leading-relaxed text-gray-900">
                    {activeSuggestion.suggested}
                  </p>
                )}
              </div>

              {activeSuggestion.impact && (
                <div className="flex items-start gap-2.5 rounded-xl bg-gray-50 p-3 text-sm leading-relaxed text-gray-700">
                  <Lightbulb
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                  />
                  <span>{activeSuggestion.impact}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center">
              {editingIndex === activeIdx ? (
                <>
                  <Button
                    variant="ghost"
                    className="h-11 rounded-xl font-semibold text-gray-700"
                    onClick={() => {
                      setEditingIndex(null);
                      setEditText("");
                    }}
                  >
                    Batal
                  </Button>
                  <Button
                    className="h-11 flex-1 gap-2 rounded-xl bg-green-700 font-bold text-white hover:bg-green-800"
                    onClick={() => handleAccept(activeIdx!)}
                  >
                    <Check aria-hidden="true" className="h-4 w-4" />
                    Terapkan Perubahan
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="h-11 rounded-xl font-semibold text-gray-700"
                    onClick={closeModal}
                  >
                    Tutup
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 gap-2 rounded-xl border-2 border-gray-300 font-bold hover:border-green-700 hover:bg-green-50"
                    onClick={() => handleEdit(activeIdx!)}
                  >
                    <Pencil aria-hidden="true" className="h-4 w-4" />
                    Edit Teks
                  </Button>
                  <Button
                    className="h-11 flex-1 gap-2 rounded-xl bg-green-700 font-bold text-white hover:bg-green-800"
                    onClick={() => handleAccept(activeIdx!)}
                  >
                    <Check aria-hidden="true" className="h-4 w-4" />
                    Terapkan Saran
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
