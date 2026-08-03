/**
 * Inline CV Editor — Side-by-Side
 *
 * Left:  CvPreview original (clean template, no changes)
 * Right: CvPreview + yellow stabilo highlights injected directly into the
 *        rendered DOM on the exact suggestion text.
 *        Click a highlight → smart popover (flips above/below to avoid clipping).
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  X,
  Pencil,
  Sparkles,
  CheckCircle2,
  Zap,
  Lightbulb,
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

// ─── DOM helpers ─────────────────────────────────────────────────────────────

/** Remove all previously injected marks from the container */
function clearHighlights(container: HTMLElement) {
  // Unwrap every mark: move its text children back to the parent, then delete the mark
  container.querySelectorAll<HTMLElement>("mark.cv-ai-mark").forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    // Remove the badge span first so it doesn't leak as text
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
  onClick: (idx: number, el: HTMLElement) => void,
) {
  if (!needle || needle.length < 4) return;

  // Collect accepted text nodes (skip script/style/already-marked)
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

  // Concatenate all text to find position of needle
  const fullText = nodes.map((n) => n.textContent ?? "").join("");
  const pos = fullText.toLowerCase().indexOf(needle.toLowerCase());
  if (pos === -1) return;

  const end = pos + needle.length;
  const style = HIGHLIGHT_STYLE[priority];

  // Determine which text-node segments to wrap
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

  // Wrap each segment
  segs.forEach(({ node, start, end: segEnd }, segIdx) => {
    try {
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, segEnd);

      // Use extractContents + insertNode (more reliable than surroundContents)
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

      // Badge ✓ on the last segment only
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
        onClick(idx, mark);
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

// ─── Popover component ────────────────────────────────────────────────────────

interface PopoverProps {
  suggestion: Suggestion;
  index: number;
  isEditing: boolean;
  editText: string;
  onAccept: (i: number) => void;
  onReject: (i: number) => void;
  onEdit: (i: number) => void;
  onEditTextChange: (t: string) => void;
  onEditSave: (i: number) => void;
  onEditCancel: () => void;
  onClose: () => void;
}

function SuggestionPopover({
  suggestion,
  index,
  isEditing,
  editText,
  onAccept,
  onReject,
  onEdit,
  onEditTextChange,
  onEditSave,
  onEditCancel,
  onClose,
}: PopoverProps) {
  const cfg = HIGHLIGHT_STYLE[suggestion.priority];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.14 }}
      className="w-80 rounded-2xl border-2 border-border bg-card shadow-2xl shadow-black/20 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-2 border-b border-border/60 bg-muted/30">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded border",
              cfg.badge,
            )}
          >
            {cfg.label}
          </span>
          <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded bg-background">
            {suggestion.category}
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="p-3 space-y-2.5">
        {/* Current (strikethrough) */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Teks saat ini:
          </p>
          <p className="text-xs text-red-500 dark:text-red-400 line-through decoration-red-300/60 leading-relaxed bg-red-50 dark:bg-red-950/20 px-2 py-1.5 rounded-lg">
            {suggestion.current}
          </p>
        </div>

        {/* Suggested */}
        <div>
          <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">
            Rekomendasi AI:
          </p>
          {isEditing ? (
            <div className="space-y-1.5">
              <Textarea
                value={editText}
                onChange={(e) => onEditTextChange(e.target.value)}
                className="min-h-[60px] text-xs"
                autoFocus
              />
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  className="flex-1 gap-1 h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => onEditSave(index)}
                >
                  <Check className="h-3 w-3" /> Simpan
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={onEditCancel}
                >
                  Batal
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-foreground bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-2.5 py-2 leading-relaxed">
              {suggestion.suggested}
            </p>
          )}
        </div>

        {/* Impact */}
        <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground bg-muted/40 rounded-lg px-2 py-1.5">
          <Lightbulb className="h-3 w-3 shrink-0 text-amber-500 mt-0.5" />
          <span className="leading-relaxed">{suggestion.impact}</span>
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className="flex gap-1.5">
            <Button
              size="sm"
              className="flex-1 gap-1.5 h-9 text-xs bg-emerald-600 hover:bg-emerald-700 shadow-sm"
              onClick={() => onAccept(index)}
            >
              <Check className="h-3.5 w-3.5" />
              Terapkan
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 h-9 text-xs"
              onClick={() => onEdit(index)}
            >
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-9 px-2.5 text-muted-foreground hover:text-destructive"
              onClick={() => onReject(index)}
              title="Abaikan"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
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
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; flipUp: boolean } | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  // Ref for the scaled wrapper of the right CvPreview
  const rightWrapperRef = useRef<HTMLDivElement>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const closePopover = useCallback(() => {
    setActiveIdx(null);
    setPopoverPos(null);
    setEditingIndex(null);
    setEditText("");
  }, []);

  const handleHighlightClick = useCallback(
    (idx: number, el: HTMLElement) => {
      if (activeIdx === idx) {
        closePopover();
        return;
      }
      const rect = el.getBoundingClientRect();
      const POPOVER_W = 320;
      const POPOVER_H = 310;
      const PAD = 8;

      // Horizontal: clamp so popover never overflows right/left
      let left = rect.left;
      if (left + POPOVER_W > window.innerWidth - PAD) {
        left = window.innerWidth - POPOVER_W - PAD;
      }
      if (left < PAD) left = PAD;

      // Vertical: prefer below, flip above if not enough space
      const spaceBelow = window.innerHeight - rect.bottom - PAD;
      const flipUp = spaceBelow < POPOVER_H && rect.top > POPOVER_H + PAD;
      const top = flipUp
        ? rect.top - POPOVER_H - 6
        : rect.bottom + 6;

      setPopoverPos({ top, left, flipUp });
      setActiveIdx(idx);
      setEditingIndex(null);
      setEditText("");
    },
    [activeIdx, closePopover],
  );

  const handleAccept = useCallback(
    (index: number) => {
      const text = editingIndex === index ? editText : suggestions[index].suggested;
      onApplySuggestion(index, text);
      setAppliedIndices((prev) => new Set([...prev, index]));
      closePopover();
    },
    [closePopover, editText, editingIndex, onApplySuggestion, suggestions],
  );

  const handleReject = useCallback(
    (index: number) => {
      setAppliedIndices((prev) => new Set([...prev, index]));
      closePopover();
    },
    [closePopover],
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
    closePopover();
  }, [closePopover, onApplyAll, suggestions]);

  // ── Inject highlights into right-panel DOM ────────────────────────────────
  useEffect(() => {
    const wrapper = rightWrapperRef.current;
    if (!wrapper) return;

    // Delay slightly so CvPreview finishes painting
    const timer = setTimeout(() => {
      clearHighlights(wrapper);
      suggestions.forEach((s, idx) => {
        if (appliedIndices.has(idx)) return;
        injectHighlight(wrapper, s.current?.trim() ?? "", idx, s.priority, handleHighlightClick);
      });
    }, 120);

    return () => clearTimeout(timer);
  }, [suggestions, appliedIndices, cvData, handleHighlightClick]);

  // Close popover on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-popover-root]") && !t.closest("mark.cv-ai-mark")) {
        closePopover();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [closePopover]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const appliedCount = appliedIndices.size;
  const totalCount = suggestions.length;
  const pendingCount = totalCount - appliedCount;

  // Shared scale style for both panels
  const scaledStyle: React.CSSProperties = {
    transform: "scale(0.62)",
    transformOrigin: "top center",
    width: `${100 / 0.62}%`,
    marginLeft: `${-(100 / 0.62 - 100) / 2}%`,
  };

  // ── Render ────────────────────────────────────────────────────────────────

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
          <Badge variant="outline" className="text-[10px]">Referensi</Badge>
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
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-3 py-2">
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
            {/* This div is the target for DOM injection */}
            <div ref={rightWrapperRef} style={scaledStyle}>
              <CvPreview data={cvData} template={templateId} scale={1} />
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* ════════════════════════════════════════════════════════
          POPOVER (fixed, smart positioning)
      ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {activeIdx !== null && popoverPos && suggestions[activeIdx] && (
          <div
            data-popover-root
            style={{
              position: "fixed",
              top: popoverPos.top,
              left: popoverPos.left,
              zIndex: 9999,
            }}
          >
            <SuggestionPopover
              suggestion={suggestions[activeIdx]}
              index={activeIdx}
              isEditing={editingIndex === activeIdx}
              editText={editText}
              onAccept={handleAccept}
              onReject={handleReject}
              onEdit={handleEdit}
              onEditTextChange={setEditText}
              onEditSave={handleAccept}
              onEditCancel={() => {
                setEditingIndex(null);
                setEditText("");
              }}
              onClose={closePopover}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
