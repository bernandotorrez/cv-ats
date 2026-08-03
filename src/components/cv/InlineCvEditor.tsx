/**
 * Inline CV Editor with Suggestion Highlights - Side-by-Side Layout
 * Left panel: Original CV (clean)
 * Right panel: CV with yellow stabilo highlights + green ✓ buttons per suggestion
 */

import { useState, useCallback, useMemo, useRef } from "react";
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
  ChevronUp,
  ChevronDown,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CvData, TemplateId } from "@/lib/cv-types";
import { CvPreview } from "./CvPreview";

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

const PRIORITY_CONFIG = {
  high: {
    stabilo: "bg-red-100 border-l-4 border-l-red-400",
    badge: "bg-red-100 text-red-700 border-red-200",
    checkBtn: "bg-emerald-500 hover:bg-emerald-600",
    dot: "bg-red-400",
    label: "Tinggi",
    glow: "shadow-red-200",
  },
  medium: {
    stabilo: "bg-amber-100 border-l-4 border-l-amber-400",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    checkBtn: "bg-emerald-500 hover:bg-emerald-600",
    dot: "bg-amber-400",
    label: "Sedang",
    glow: "shadow-amber-200",
  },
  low: {
    stabilo: "bg-green-50 border-l-4 border-l-green-400",
    badge: "bg-green-100 text-green-700 border-green-200",
    checkBtn: "bg-emerald-500 hover:bg-emerald-600",
    dot: "bg-green-400",
    label: "Rendah",
    glow: "shadow-green-200",
  },
};

// CV Section Text Renderer with stabilo highlight overlay
function SuggestionCard({
  suggestion,
  index,
  isApplied,
  isActive,
  editingIndex,
  editText,
  onHover,
  onAccept,
  onReject,
  onEdit,
  onEditTextChange,
  onEditSave,
  onEditCancel,
}: {
  suggestion: Suggestion & { originalIndex: number };
  index: number;
  isApplied: boolean;
  isActive: boolean;
  editingIndex: number | null;
  editText: string;
  onHover: (idx: number | null) => void;
  onAccept: (idx: number) => void;
  onReject: (idx: number) => void;
  onEdit: (idx: number) => void;
  onEditTextChange: (text: string) => void;
  onEditSave: (idx: number) => void;
  onEditCancel: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = PRIORITY_CONFIG[suggestion.priority];
  const isEditing = editingIndex === suggestion.originalIndex;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "rounded-xl border-2 overflow-hidden transition-all duration-200",
        isApplied
          ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-950/20 opacity-70"
          : isActive
          ? "border-primary/60 shadow-lg shadow-primary/10"
          : "border-border bg-card hover:border-primary/30",
      )}
      onMouseEnter={() => onHover(suggestion.originalIndex)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Header */}
      <div
        className="flex items-start gap-2 p-3 cursor-pointer"
        onClick={() => !isApplied && setExpanded((v) => !v)}
      >
        {/* Priority dot */}
        <div
          className={cn(
            "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
            config.dot,
          )}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span
              className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded border",
                config.badge,
              )}
            >
              {config.label}
            </span>
            <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded">
              {suggestion.category}
            </span>
            {isApplied && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded">
                ✓ Diterapkan
              </span>
            )}
          </div>

          {/* Current text (strikethrough) */}
          <p
            className={cn(
              "text-xs leading-relaxed line-clamp-2",
              isApplied
                ? "text-muted-foreground"
                : "text-red-500 dark:text-red-400 line-through decoration-red-300",
            )}
          >
            {suggestion.current}
          </p>
        </div>

        {!isApplied && (
          <div className="flex items-center gap-1 shrink-0">
            {/* Quick apply button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAccept(suggestion.originalIndex);
              }}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-white shadow-md transition-all hover:scale-110 active:scale-95",
                config.checkBtn,
              )}
              title="Terapkan saran"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-all hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
            >
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && !isApplied && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-2">
              {/* Suggestion text */}
              <div>
                <p className="text-[10px] font-semibold text-primary mb-1 uppercase tracking-wide">
                  Rekomendasi:
                </p>
                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => onEditTextChange(e.target.value)}
                      className="min-h-[70px] text-xs"
                    />
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        className="flex-1 gap-1 h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => onEditSave(suggestion.originalIndex)}
                      >
                        <Check className="h-3 w-3" />
                        Simpan
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
              <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                <Lightbulb className="h-3 w-3 shrink-0 text-amber-500 mt-0.5" />
                <span>{suggestion.impact}</span>
              </div>

              {/* Action buttons */}
              {!isEditing && (
                <div className="flex gap-1.5 pt-1">
                  <Button
                    size="sm"
                    className="flex-1 gap-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => onAccept(suggestion.originalIndex)}
                  >
                    <Check className="h-3 w-3" />
                    Terapkan
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 h-8 text-xs"
                    onClick={() => onEdit(suggestion.originalIndex)}
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-muted-foreground text-xs"
                    onClick={() => onReject(suggestion.originalIndex)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Overlay highlights shown on top of right-panel CV
function SuggestionHighlightOverlay({
  suggestions,
  appliedIndices,
  activeHighlight,
  onActivate,
  onQuickApply,
}: {
  suggestions: Array<Suggestion & { originalIndex: number }>;
  appliedIndices: Set<number>;
  activeHighlight: number | null;
  onActivate: (idx: number) => void;
  onQuickApply: (idx: number) => void;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {suggestions.map((s, i) => {
        if (appliedIndices.has(s.originalIndex)) return null;
        const config = PRIORITY_CONFIG[s.priority];
        const isActive = activeHighlight === s.originalIndex;
        // Position suggestions spaced down on the right side
        const topPercent = 12 + i * 9;

        return (
          <div
            key={s.originalIndex}
            className="absolute right-0 pointer-events-auto"
            style={{ top: `${Math.min(topPercent, 88)}%` }}
          >
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                "flex items-center gap-1.5 cursor-pointer transition-all",
                isActive && "scale-105",
              )}
              onMouseEnter={() => onActivate(s.originalIndex)}
              onMouseLeave={() => onActivate(-1)}
            >
              {/* Stabilo marker line */}
              <div
                className={cn(
                  "h-0.5 w-8 rounded-full opacity-60",
                  s.priority === "high"
                    ? "bg-red-400"
                    : s.priority === "medium"
                    ? "bg-amber-400"
                    : "bg-green-400",
                )}
              />

              {/* Category badge */}
              <div
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold shadow-sm",
                  config.badge,
                  isActive && "shadow-md",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    config.dot,
                  )}
                />
                {s.category}
              </div>

              {/* Quick apply check button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickApply(s.originalIndex);
                }}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-white shadow-md transition-all hover:scale-110 active:scale-95",
                  config.checkBtn,
                )}
                title="Terapkan"
              >
                <Check className="h-3 w-3" />
              </button>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

export function InlineCvEditor({
  cvData,
  templateId,
  suggestions,
  onApplySuggestion,
  onApplyAll,
  onSave,
}: InlineCvEditorProps) {
  const [appliedIndices, setAppliedIndices] = useState<Set<number>>(new Set());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [activeHighlight, setActiveHighlight] = useState<number>(-1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Augment suggestions with original index
  const indexedSuggestions = useMemo(
    () => suggestions.map((s, i) => ({ ...s, originalIndex: i })),
    [suggestions],
  );

  const handleAccept = useCallback(
    (index: number) => {
      const text = editingIndex === index ? editText : suggestions[index].suggested;
      onApplySuggestion(index, text);
      setAppliedIndices((prev) => new Set([...prev, index]));
      setEditingIndex(null);
      setEditText("");
    },
    [editText, editingIndex, suggestions, onApplySuggestion],
  );

  const handleReject = useCallback((index: number) => {
    setAppliedIndices((prev) => new Set([...prev, index]));
    setEditingIndex(null);
    setEditText("");
  }, []);

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
  }, [onApplyAll, suggestions]);

  const appliedCount = appliedIndices.size;
  const totalCount = suggestions.length;
  const pendingCount = totalCount - appliedCount;

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-0 overflow-hidden rounded-2xl border-2 border-border shadow-xl">
      {/* ═══ LEFT PANEL: Original CV ═══ */}
      <div className="flex-1 flex flex-col border-r border-border min-w-0">
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-background border border-border">
              <span className="text-xs font-bold text-muted-foreground">CV</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">CV Original</p>
              <p className="text-[10px] text-muted-foreground">Versi asli tanpa perubahan</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            Referensi
          </Badge>
        </div>

        {/* CV Preview - clean version */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            <div
              style={{
                transform: "scale(0.65)",
                transformOrigin: "top center",
                width: `${100 / 0.65}%`,
                marginLeft: `${-(100 / 0.65 - 100) / 2}%`,
              }}
            >
              <CvPreview data={cvData} template={templateId} scale={1} />
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* ═══ RIGHT PANEL: CV with highlights + suggestions sidebar ═══ */}
      <div
        className={cn(
          "flex flex-col min-w-0 transition-all duration-300",
          sidebarCollapsed ? "flex-1" : "flex-[1.45]",
        )}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 to-primary/10 px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">CV + Saran AI</p>
              <p className="text-[10px] text-muted-foreground">
                {pendingCount} saran menunggu •{" "}
                <span className="text-yellow-600 font-medium">highlight = area perbaikan</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                "text-xs",
                pendingCount === 0
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-yellow-100 text-yellow-700",
              )}
            >
              {appliedCount}/{totalCount} diterapkan
            </Badge>
            <button
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted transition-colors"
              title={sidebarCollapsed ? "Buka panel saran" : "Tutup panel saran"}
            >
              <ArrowRight
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  sidebarCollapsed ? "rotate-180" : "rotate-0",
                )}
              />
            </button>
          </div>
        </div>

        {/* Right panel body: CV with overlay + sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* CV with highlight overlays */}
          <div className="flex-1 relative overflow-hidden" ref={rightPanelRef}>
            <ScrollArea className="h-full">
              <div className="p-4">
                {/* Yellow stabilo bar at top */}
                {pendingCount > 0 && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2">
                    <span className="h-3 w-4 rounded-sm bg-yellow-300 inline-block" />
                    <p className="text-xs text-yellow-800 font-medium">
                      Highlight kuning = teks yang perlu diperbaiki. Klik ✓ hijau untuk terapkan.
                    </p>
                  </div>
                )}

                {/* CV with overlay */}
                <div className="relative">
                  {/* Stabilo highlight backgrounds behind the CV */}
                  {indexedSuggestions.map((s, i) => {
                    if (appliedIndices.has(s.originalIndex)) return null;
                    const isActive = activeHighlight === s.originalIndex;
                    const topPercent = 12 + i * 9;

                    return (
                      <motion.div
                        key={s.originalIndex}
                        className={cn(
                          "absolute left-0 right-14 rounded-sm transition-all pointer-events-none",
                          isActive ? "opacity-40" : "opacity-20",
                          s.priority === "high"
                            ? "bg-red-200"
                            : s.priority === "medium"
                            ? "bg-yellow-200"
                            : "bg-green-200",
                        )}
                        style={{
                          top: `${Math.min(topPercent, 85)}%`,
                          height: "2.5%",
                        }}
                        animate={{ opacity: isActive ? 0.4 : 0.2 }}
                      />
                    );
                  })}

                  {/* The actual CV preview */}
                  <div
                    style={{
                      transform: "scale(0.65)",
                      transformOrigin: "top center",
                      width: `${100 / 0.65}%`,
                      marginLeft: `${-(100 / 0.65 - 100) / 2}%`,
                    }}
                  >
                    <CvPreview data={cvData} template={templateId} scale={1} />
                  </div>

                  {/* Overlay: badges + quick-apply buttons along right edge */}
                  <SuggestionHighlightOverlay
                    suggestions={indexedSuggestions}
                    appliedIndices={appliedIndices}
                    activeHighlight={activeHighlight}
                    onActivate={(idx) => setActiveHighlight(idx)}
                    onQuickApply={handleAccept}
                  />
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="h-2.5 w-4 rounded-sm bg-red-200 inline-block" />
                    Prioritas Tinggi
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="h-2.5 w-4 rounded-sm bg-yellow-200 inline-block" />
                    Prioritas Sedang
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="h-2.5 w-4 rounded-sm bg-green-200 inline-block" />
                    Prioritas Rendah
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Check className="h-3 w-3 text-emerald-600" />
                    Tombol hijau = terapkan
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Suggestions Sidebar (collapsible) */}
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col border-l border-border overflow-hidden bg-muted/20"
                style={{ minWidth: 0 }}
              >
                {/* Sidebar header */}
                <div className="border-b border-border bg-background/80 px-3 py-2.5 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <p className="text-sm font-semibold">Daftar Saran</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {pendingCount} tersisa
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                      animate={{ width: `${(appliedCount / Math.max(totalCount, 1)) * 100}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>

                {/* Suggestion cards */}
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-2">
                    {indexedSuggestions.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Tidak ada saran</p>
                      </div>
                    ) : (
                      indexedSuggestions.map((s, i) => (
                        <SuggestionCard
                          key={s.originalIndex}
                          suggestion={s}
                          index={i}
                          isApplied={appliedIndices.has(s.originalIndex)}
                          isActive={activeHighlight === s.originalIndex}
                          editingIndex={editingIndex}
                          editText={editText}
                          onHover={(idx) => setActiveHighlight(idx ?? -1)}
                          onAccept={handleAccept}
                          onReject={handleReject}
                          onEdit={handleEdit}
                          onEditTextChange={setEditText}
                          onEditSave={(idx) => handleAccept(idx)}
                          onEditCancel={() => {
                            setEditingIndex(null);
                            setEditText("");
                          }}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>

                {/* Sidebar footer actions */}
                <div className="border-t border-border bg-background/80 p-3 space-y-2 shrink-0">
                  {pendingCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 text-xs h-8"
                      onClick={handleAcceptAll}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      Terapkan Semua ({pendingCount})
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="w-full gap-2 text-xs h-9 bg-emerald-600 hover:bg-emerald-700"
                    onClick={onSave}
                    disabled={appliedCount === 0}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Simpan Perubahan ({appliedCount} saran)
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
