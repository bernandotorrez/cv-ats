/**
 * Inline CV Editor — Side-by-Side with Zoom Controls
 *
 * Left:  CvPreview original (clean template, no changes)
 * Right: CvPreview + yellow stabilo highlights injected directly into the
 *        rendered DOM on the exact suggestion text.
 *        Click a highlight → Modal Dialog popup in screen center (never clipped).
 * Header: Zoom controls (50%, 65%, 85%, 100% + ZoomIn / ZoomOut buttons).
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Check,
  X,
  Pencil,
  Sparkles,
  CheckCircle2,
  Zap,
  Lightbulb,
  ZoomIn,
  ZoomOut,
  RotateCcw,
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

const HIGHLIGHT_STYLE: Record<Suggestion["priority"], { bg: string; border: string; badge: string; label: string }> = {
  high: {
    bg: "rgba(254,202,202,0.7)",
    border: "#f87171",
    badge: "bg-red-100 text-red-700 border-red-200",
    label: "Tinggi",
  },
  medium: {
    bg: "rgba(253,224,71,0.65)",
    border: "#fbbf24",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    label: "Sedang",
  },
  low: {
    bg: "rgba(187,247,208,0.65)",
    border: "#4ade80",
    badge: "bg-green-100 text-green-700 border-green-200",
    label: "Rendah",
  },
};

const ZOOM_PRESETS = [50, 65, 85, 100];

// ─── DOM helpers ─────────────────────────────────────────────────────────────

/** Remove all previously injected marks from the container */
function clearHighlights(container: HTMLElement) {
  container.querySelectorAll<HTMLElement>("mark.cv-ai-mark").forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    mark.querySelectorAll(".cv-ai-badge").forEach((b) => b.remove());
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    try { parent.normalize(); } catch (_) { /* noop */ }
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
          `background:#16a34a`,
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
  const [zoomLevel, setZoomLevel] = useState<number>(65);

  const rightWrapperRef = useRef<HTMLDivElement>(null);

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

  const handleReject = useCallback(
    (index: number) => {
      setAppliedIndices((prev) => new Set([...prev, index]));
      closeModal();
    },
    [closeModal],
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
    setZoomLevel((prev) => Math.min(120, prev + 15));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(40, prev - 15));
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

  const scaleVal = zoomLevel / 100;
  const scaledStyle: React.CSSProperties = {
    transform: `scale(${scaleVal})`,
    transformOrigin: "top center",
    width: `${100 / scaleVal}%`,
    marginLeft: `${-(100 / scaleVal - 100) / 2}%`,
  };

  const activeSuggestion = activeIdx !== null ? suggestions[activeIdx] : null;
  const activeCfg = activeSuggestion ? HIGHLIGHT_STYLE[activeSuggestion.priority] : null;

  return (
    <div className="flex h-[calc(100vh-5.5rem)] gap-0 overflow-hidden rounded-2xl border-2 border-border shadow-xl">

      {/* ════════════════════════════════════════════════════════
          LEFT PANEL — Original CV (clean template)
      ════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col border-r border-border min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-background border border-border shrink-0">
              <span className="text-[10px] font-bold text-muted-foreground">CV</span>
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">CV Original</p>
              <p className="text-[10px] text-muted-foreground">Versi asli tanpa perubahan</p>
            </div>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-background/80 border border-border rounded-xl p-0.5 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <div className="flex items-center gap-0.5">
              {ZOOM_PRESETS.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZoomLevel(z)}
                  className={cn(
                    "h-6 px-1.5 rounded-md text-[10px] font-semibold transition-colors",
                    zoomLevel === z
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  {z}%
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Template preview */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            <div style={scaledStyle}>
              <CvPreview data={cvData} template={templateId} scale={1} />
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* ════════════════════════════════════════════════════════
          RIGHT PANEL — Same template + injected highlights
      ════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 to-primary/10 px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">CV + Saran AI</p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Klik{" "}
                <mark
                  style={{ background: "rgba(253,224,71,0.65)", borderBottom: "2px solid #fbbf24", borderRadius: 2, padding: "0 2px" }}
                >
                  teks kuning ✓
                </mark>{" "}
                untuk lihat saran & terapkan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge
              className={cn(
                "text-[10px]",
                pendingCount === 0
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
              )}
            >
              {appliedCount}/{totalCount} diterapkan
            </Badge>
            {pendingCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1 h-7 text-[10px] px-2"
                onClick={handleAcceptAll}
              >
                <Zap className="h-3 w-3" />
                Terapkan Semua
              </Button>
            )}
            {appliedCount > 0 && (
              <Button
                size="sm"
                className="gap-1 h-7 text-[10px] px-2.5 bg-emerald-600 hover:bg-emerald-700"
                onClick={onSave}
              >
                <CheckCircle2 className="h-3 w-3" />
                Simpan
              </Button>
            )}
          </div>
        </div>

        {/* Info banner */}
        <div className="shrink-0 px-4 pt-3">
          {pendingCount > 0 ? (
            <div className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-3 py-2">
              <div className="flex items-center gap-2">
                <mark
                  style={{ background: "rgba(253,224,71,0.65)", borderBottom: "2px solid #fbbf24", borderRadius: 2, padding: "0 4px", flexShrink: 0 }}
                  className="text-[10px] font-bold"
                >
                  {pendingCount} saran
                </mark>
                <p className="text-[10px] text-yellow-900 dark:text-yellow-200 leading-relaxed">
                  Klik teks yang disorot kuning untuk melihat saran AI. Tombol{" "}
                  <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-white text-[7px] font-bold align-middle">✓</span>{" "}
                  = terapkan sekarang.
                </p>
              </div>

              {/* Right side zoom preset indicator */}
              <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                Skala: {zoomLevel}%
              </Badge>
            </div>
          ) : (
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <p className="text-[10px] text-emerald-800 dark:text-emerald-200 font-medium">
                Semua saran sudah diterapkan! Klik <strong>Simpan</strong>.
              </p>
            </div>
          )}
        </div>

        {/* CV template with DOM-injected highlights */}
        <ScrollArea className="flex-1 px-4 pb-4">
          <div>
            <div ref={rightWrapperRef} style={scaledStyle}>
              <CvPreview data={cvData} template={templateId} scale={1} />
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* ════════════════════════════════════════════════════════
          SUGGESTION MODAL DIALOG (Centered, Never Clipped)
      ════════════════════════════════════════════════════════ */}
      <Dialog open={activeIdx !== null} onOpenChange={(open) => { if (!open) closeModal(); }}>
        {activeSuggestion && activeCfg && (
          <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-2 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/60 bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold">Rekomendasi Perbaikan AI</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Kategori: {activeSuggestion.category}
                  </DialogDescription>
                </div>
              </div>
              <Badge className={cn("text-xs font-semibold px-2 py-0.5", activeCfg.badge)}>
                Prioritas {activeCfg.label}
              </Badge>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Teks Saat Ini */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Teks Saat Ini:
                </p>
                <div className="text-xs text-red-600 dark:text-red-400 line-through decoration-red-300 leading-relaxed bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-3 rounded-xl">
                  {activeSuggestion.current}
                </div>
              </div>

              {/* Rekomendasi AI */}
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                  Rekomendasi AI:
                </p>
                {editingIndex === activeIdx ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="min-h-[80px] text-xs"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 gap-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleAccept(activeIdx!)}
                      >
                        <Check className="h-3.5 w-3.5" /> Simpan Perubahan
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => { setEditingIndex(null); setEditText(""); }}
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-foreground font-medium bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-xl leading-relaxed">
                    {activeSuggestion.suggested}
                  </div>
                )}
              </div>

              {/* Impact / Alasan */}
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 border border-border/60 rounded-xl p-3">
                <Lightbulb className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                <span className="leading-relaxed">{activeSuggestion.impact}</span>
              </div>
            </div>

            {/* Modal Footer / Actions */}
            {editingIndex !== activeIdx && (
              <div className="flex items-center gap-2 p-4 border-t border-border bg-muted/20">
                <Button
                  size="default"
                  className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md"
                  onClick={() => handleAccept(activeIdx!)}
                >
                  <Check className="h-4 w-4" />
                  Terapkan Saran Ini
                </Button>
                <Button
                  size="default"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => handleEdit(activeIdx!)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Teks
                </Button>
                <Button
                  size="default"
                  variant="ghost"
                  className="px-3 text-muted-foreground hover:text-destructive"
                  onClick={() => handleReject(activeIdx!)}
                  title="Abaikan saran"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
