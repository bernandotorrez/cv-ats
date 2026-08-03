/**
 * Inline CV Editor - Side-by-Side with Inline Highlights
 *
 * Left:  CvPreview — original CV (clean, no changes)
 * Right: Custom text renderer — same CV content but with yellow stabilo
 *        highlights on the exact text that has AI suggestions.
 *        Click a highlight → popover with suggestion info + green ✓ button.
 *        No sidebar needed.
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CvData, TemplateId } from "@/lib/cv-types";
import { CvPreview } from "./CvPreview";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Suggestion {
  priority: "high" | "medium" | "low";
  category: string;
  current: string;
  suggested: string;
  impact: string;
  targetSection?: string;
  bulletIndex?: number | null;
}

interface InlineCvEditorProps {
  cvData: CvData;
  templateId: TemplateId;
  suggestions: Suggestion[];
  onApplySuggestion: (index: number, newText: string) => void;
  onApplyAll: () => void;
  onSave: () => void;
}

// ─── Config ─────────────────────────────────────────────────────────────────

const PRIORITY = {
  high: {
    mark: "bg-red-100 dark:bg-red-900/40 border-b-2 border-red-400 hover:bg-red-200 dark:hover:bg-red-800/50",
    badge: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-400",
    ring: "ring-red-300",
    label: "Tinggi",
    icon: "🔴",
  },
  medium: {
    mark: "bg-yellow-100 dark:bg-yellow-900/40 border-b-2 border-amber-400 hover:bg-yellow-200 dark:hover:bg-yellow-800/50",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-400",
    ring: "ring-amber-300",
    label: "Sedang",
    icon: "🟡",
  },
  low: {
    mark: "bg-green-50 dark:bg-green-900/30 border-b-2 border-green-400 hover:bg-green-100 dark:hover:bg-green-800/40",
    badge: "bg-green-100 text-green-700 border-green-200",
    dot: "bg-green-400",
    ring: "ring-green-300",
    label: "Rendah",
    icon: "🟢",
  },
} as const;

// ─── Suggestion Popover ─────────────────────────────────────────────────────

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
  const cfg = PRIORITY[suggestion.priority];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -6 }}
      transition={{ duration: 0.15 }}
      className="fixed z-[9999] w-80 rounded-2xl border-2 border-border bg-card shadow-2xl shadow-black/15 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-border/60 bg-muted/30">
        <div className="flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
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
          className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="p-3 space-y-2.5">
        {/* Current text (strikethrough) */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Teks saat ini:
          </p>
          <p className="text-xs text-red-500 dark:text-red-400 line-through decoration-red-300 leading-relaxed bg-red-50 dark:bg-red-950/20 px-2 py-1.5 rounded-lg">
            {suggestion.current}
          </p>
        </div>

        {/* Suggested text */}
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

        {/* Action buttons */}
        {!isEditing && (
          <div className="flex gap-1.5 pt-0.5">
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
              title="Abaikan saran ini"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Text highlight renderer ────────────────────────────────────────────────

interface HighlightedTextProps {
  text: string;
  suggestions: Array<{ s: Suggestion; idx: number }>;
  appliedIndices: Set<number>;
  activeIdx: number | null;
  onClickHighlight: (idx: number, el: HTMLElement) => void;
  className?: string;
}

function HighlightedText({
  text,
  suggestions,
  appliedIndices,
  activeIdx,
  onClickHighlight,
  className,
}: HighlightedTextProps) {
  if (!text) return null;

  // Build segment list by splitting text on each suggestion.current match
  type Seg = { text: string; suggIdx?: number };
  let segs: Seg[] = [{ text }];

  for (const { s, idx } of suggestions) {
    if (appliedIndices.has(idx)) continue;
    const needle = s.current?.trim() ?? "";
    if (needle.length < 4) continue;

    const next: Seg[] = [];
    for (const seg of segs) {
      if (seg.suggIdx !== undefined) {
        next.push(seg);
        continue;
      }
      const lo = seg.text.toLowerCase();
      const pos = lo.indexOf(needle.toLowerCase());
      if (pos === -1) {
        next.push(seg);
      } else {
        if (pos > 0) next.push({ text: seg.text.slice(0, pos) });
        next.push({ text: seg.text.slice(pos, pos + needle.length), suggIdx: idx });
        const after = pos + needle.length;
        if (after < seg.text.length) next.push({ text: seg.text.slice(after) });
      }
    }
    segs = next;
  }

  return (
    <span className={className}>
      {segs.map((seg, i) => {
        if (seg.suggIdx === undefined) return <span key={i}>{seg.text}</span>;

        const matched = suggestions.find((x) => x.idx === seg.suggIdx);
        if (!matched) return <span key={i}>{seg.text}</span>;

        const cfg = PRIORITY[matched.s.priority];
        const isActive = activeIdx === seg.suggIdx;

        return (
          <mark
            key={i}
            className={cn(
              "relative cursor-pointer rounded-sm px-0.5 transition-all duration-150 select-none",
              cfg.mark,
              isActive && cn("ring-2 ring-offset-0", cfg.ring),
            )}
            onClick={(e) => {
              e.stopPropagation();
              onClickHighlight(seg.suggIdx!, e.currentTarget as HTMLElement);
            }}
          >
            {seg.text}
            {/* Mini check badge */}
            <span
              className={cn(
                "inline-flex ml-0.5 h-3.5 w-3.5 items-center justify-center",
                "rounded-full bg-emerald-500 text-white text-[8px] font-bold align-middle",
                "shadow-sm",
              )}
              aria-label="Klik untuk lihat saran"
            >
              ✓
            </span>
          </mark>
        );
      })}
    </span>
  );
}

// ─── CV Text Renderer (document-style with inline highlights) ───────────────

interface CvHighlightedViewProps {
  cvData: CvData;
  suggestions: Suggestion[];
  appliedIndices: Set<number>;
  activeIdx: number | null;
  onClickHighlight: (idx: number, el: HTMLElement) => void;
}

function CvHighlightedView({
  cvData,
  suggestions,
  appliedIndices,
  activeIdx,
  onClickHighlight,
}: CvHighlightedViewProps) {
  const p = cvData.personal;

  // Given a raw text, find which suggestions' .current appears in it
  const suggsFor = (text: string) =>
    suggestions
      .map((s, idx) => ({ s, idx }))
      .filter(
        ({ s, idx }) =>
          !appliedIndices.has(idx) &&
          (s.current?.trim().length ?? 0) >= 4 &&
          text.toLowerCase().includes((s.current?.trim() ?? "").toLowerCase()),
      );

  const HL = ({
    text,
    className,
  }: {
    text: string | undefined;
    className?: string;
  }) =>
    text ? (
      <HighlightedText
        text={text}
        suggestions={suggsFor(text)}
        appliedIndices={appliedIndices}
        activeIdx={activeIdx}
        onClickHighlight={onClickHighlight}
        className={className}
      />
    ) : null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border/60 shadow-sm p-7 text-sm leading-relaxed font-sans">
      {/* ── Header ── */}
      <div className="pb-4 mb-5 border-b-2 border-gray-800 dark:border-gray-300">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-0.5">
          <HL text={p.fullName} />
        </h1>
        {p.headline && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <HL text={p.headline} />
          </p>
        )}
        <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
          {p.email && <span>✉ {p.email}</span>}
          {p.phone && <span>📞 {p.phone}</span>}
          {(p as any).city && <span>📍 {(p as any).city}</span>}
        </div>
      </div>

      {/* ── Summary / Profile ── */}
      {p.summary && (
        <section className="mb-5">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
            Profil
          </h2>
          <p className="text-gray-800 dark:text-gray-200 leading-7">
            <HL text={p.summary} />
          </p>
        </section>
      )}

      {/* ── Experiences ── */}
      {(cvData.experiences?.length ?? 0) > 0 && (
        <section className="mb-5">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
            Pengalaman Kerja
          </h2>
          <div className="space-y-4">
            {(cvData.experiences as any[]).map((exp, i) => (
              <div
                key={i}
                className="pl-3 border-l-2 border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      <HL text={exp.position || exp.title || ""} />
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {exp.company}
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {exp.startDate} – {exp.endDate || "Sekarang"}
                  </span>
                </div>
                {exp.description && (
                  <div className="mt-1.5 space-y-0.5">
                    {String(exp.description)
                      .split("\n")
                      .filter((l: string) => l.trim())
                      .map((line: string, li: number) => {
                        const isBullet = /^[\-•*]/.test(line.trim());
                        const content = isBullet
                          ? line.replace(/^[\-•*]\s*/, "").trim()
                          : line;
                        return (
                          <p
                            key={li}
                            className="text-gray-700 dark:text-gray-300 leading-relaxed"
                          >
                            {isBullet && (
                              <span className="text-gray-400 mr-1.5">•</span>
                            )}
                            <HL text={content} />
                          </p>
                        );
                      })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Internships ── */}
      {((cvData as any).internships?.length ?? 0) > 0 && (
        <section className="mb-5">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
            Magang
          </h2>
          <div className="space-y-3">
            {((cvData as any).internships as any[]).map((exp: any, i: number) => (
              <div
                key={i}
                className="pl-3 border-l-2 border-gray-200 dark:border-gray-700"
              >
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  <HL text={exp.position || exp.title || ""} />
                </p>
                <p className="text-xs text-gray-500">{exp.company}</p>
                {exp.description && (
                  <p className="text-gray-700 dark:text-gray-300 mt-1 text-xs leading-relaxed">
                    <HL text={exp.description} />
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Education ── */}
      {(cvData.educations?.length ?? 0) > 0 && (
        <section className="mb-5">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
            Pendidikan
          </h2>
          <div className="space-y-3">
            {(cvData.educations as any[]).map((edu, i) => (
              <div
                key={i}
                className="pl-3 border-l-2 border-gray-200 dark:border-gray-700"
              >
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {edu.school || edu.institution}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {edu.degree}
                  {edu.major ? ` — ${edu.major}` : ""}
                </p>
                <span className="text-[10px] text-gray-400">
                  {edu.startDate} – {edu.endDate || "Sekarang"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Skills ── */}
      {(cvData.skills?.length ?? 0) > 0 && (
        <section className="mb-5">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
            Keahlian
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {(cvData.skills as any[]).map((skill, i) => (
              <span
                key={i}
                className="rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2.5 py-0.5 text-xs text-gray-700 dark:text-gray-300"
              >
                {skill.name ?? skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Languages ── */}
      {((cvData as any).languages?.length ?? 0) > 0 && (
        <section className="mb-5">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
            Bahasa
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {((cvData as any).languages as any[]).map((lang: any, i: number) => (
              <span
                key={i}
                className="rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2.5 py-0.5 text-xs text-gray-700 dark:text-gray-300"
              >
                {lang.name ?? lang}
                {lang.level ? ` (${lang.level})` : ""}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Certificates ── */}
      {(cvData.certificates?.length ?? 0) > 0 && (
        <section className="mb-5">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
            Sertifikat
          </h2>
          <div className="space-y-1.5">
            {(cvData.certificates as any[]).map((cert, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-gray-400 text-xs">🏅</span>
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  {cert.name}
                  {cert.issuer ? ` — ${cert.issuer}` : ""}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

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
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [legendOpen, setLegendOpen] = useState(false);

  const handleHighlightClick = useCallback(
    (idx: number, el: HTMLElement) => {
      // Toggle off if same highlight clicked
      if (activeIdx === idx) {
        setActiveIdx(null);
        setPopoverPos(null);
        setEditingIndex(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      // Position popover below the highlighted word, clamped to viewport
      setPopoverPos({
        top: rect.bottom + 6,
        left: Math.min(rect.left, window.innerWidth - 340),
      });
      setActiveIdx(idx);
      setEditingIndex(null);
      setEditText("");
    },
    [activeIdx],
  );

  const closePopover = useCallback(() => {
    setActiveIdx(null);
    setPopoverPos(null);
    setEditingIndex(null);
    setEditText("");
  }, []);

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

  // Close popover on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-popover]") && !target.closest("mark")) {
        closePopover();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [closePopover]);

  const appliedCount = appliedIndices.size;
  const totalCount = suggestions.length;
  const pendingCount = totalCount - appliedCount;

  return (
    <div className="flex h-[calc(100vh-5.5rem)] gap-0 overflow-hidden rounded-2xl border-2 border-border shadow-xl">

      {/* ══════════════════════════════════════════════════════
          LEFT PANEL — Original CV (clean, template preview)
      ══════════════════════════════════════════════════════ */}
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
          <Badge variant="outline" className="text-[10px]">
            Referensi
          </Badge>
        </div>

        {/* CV template preview, scaled to fit */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            <div
              style={{
                transform: "scale(0.62)",
                transformOrigin: "top center",
                width: `${100 / 0.62}%`,
                marginLeft: `${-(100 / 0.62 - 100) / 2}%`,
              }}
            >
              <CvPreview data={cvData} template={templateId} scale={1} />
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* ══════════════════════════════════════════════════════
          RIGHT PANEL — CV text with inline stabilo highlights
          No sidebar – all interaction is via highlight popovers
      ══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 to-primary/10 px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">CV + Saran AI</p>
              <p className="text-[10px] text-muted-foreground">
                Klik{" "}
                <mark className="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 rounded-sm px-0.5 not-italic">
                  teks kuning ✓
                </mark>{" "}
                untuk lihat & terapkan saran
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

        {/* CV text content */}
        <ScrollArea className="flex-1">
          <div className="p-5">
            {/* Info banner */}
            {pendingCount > 0 ? (
              <div className="mb-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-3.5 py-2.5">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 inline-block h-3.5 w-5 shrink-0 rounded-sm bg-yellow-300 dark:bg-yellow-600" />
                  <div className="text-xs text-yellow-900 dark:text-yellow-200 leading-relaxed">
                    <strong>{pendingCount} saran AI tersedia.</strong> Klik teks berwarna kuning untuk melihat rekomendasi perbaikan dan tombol{" "}
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white text-[8px] font-bold align-middle">
                      ✓
                    </span>{" "}
                    untuk menerapkannya.
                  </div>
                </div>

                {/* Collapsible legend */}
                <button
                  className="mt-2 flex items-center gap-1 text-[10px] text-yellow-700 dark:text-yellow-400 hover:underline"
                  onClick={() => setLegendOpen((v) => !v)}
                >
                  {legendOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  Keterangan warna
                </button>
                {legendOpen && (
                  <div className="mt-1.5 flex flex-wrap gap-3">
                    {(["high", "medium", "low"] as const).map((p) => (
                      <div key={p} className="flex items-center gap-1.5 text-[10px] text-yellow-800 dark:text-yellow-300">
                        <mark className={cn("px-1 py-0.5 rounded-sm", PRIORITY[p].mark)}>
                          Contoh ✓
                        </mark>
                        <span>{PRIORITY[p].label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3.5 py-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-800 dark:text-emerald-200 font-medium">
                  Semua saran sudah diterapkan! Klik <strong>Simpan</strong> untuk menyimpan perubahan.
                </p>
              </div>
            )}

            {/* CV with highlights */}
            <CvHighlightedView
              cvData={cvData}
              suggestions={suggestions}
              appliedIndices={appliedIndices}
              activeIdx={activeIdx}
              onClickHighlight={handleHighlightClick}
            />
          </div>
        </ScrollArea>
      </div>

      {/* ══ Fixed popover (renders outside scroll container) ══ */}
      <AnimatePresence>
        {activeIdx !== null && popoverPos && suggestions[activeIdx] && (
          <div
            data-popover
            style={{ position: "fixed", top: popoverPos.top, left: popoverPos.left, zIndex: 9999 }}
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
