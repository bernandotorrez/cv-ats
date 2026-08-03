/**
 * Suggestion Editor Panel
 * Shows AI suggestions with highlight and allows applying changes to CV
 */

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Highlighter,
  Lightbulb,
  Pencil,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HighlightRegion } from "./highlight-utils";

interface Suggestion {
  priority: "high" | "medium" | "low";
  category: string;
  current: string;
  suggested: string;
  impact: string;
  targetSection?: string;
  bulletIndex?: number | null;
}

interface SuggestionEditorProps {
  suggestions: Suggestion[];
  highlightRegions: HighlightRegion[];
  activeHighlight: number | null;
  onHighlightClick: (index: number) => void;
  onApplySuggestion: (index: number, newText: string) => void;
  onApplyAll: () => void;
  onClose: () => void;
}

export function SuggestionEditor({
  suggestions,
  highlightRegions,
  activeHighlight,
  onHighlightClick,
  onApplySuggestion,
  onApplyAll,
  onClose,
}: SuggestionEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [appliedIndices, setAppliedIndices] = useState<Set<number>>(new Set());

  // Group suggestions by priority
  const groupedSuggestions = useMemo(() => {
    const high = suggestions
      .map((s, i) => ({ ...s, originalIndex: i }))
      .filter((s) => s.priority === "high");
    const medium = suggestions
      .map((s, i) => ({ ...s, originalIndex: i }))
      .filter((s) => s.priority === "medium");
    const low = suggestions
      .map((s, i) => ({ ...s, originalIndex: i }))
      .filter((s) => s.priority === "low");
    return { high, medium, low };
  }, [suggestions]);

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditText(suggestions[index].suggested);
  };

  const handleApply = (index: number) => {
    onApplySuggestion(index, editText || suggestions[index].suggested);
    setAppliedIndices((prev) => new Set([...prev, index]));
    setEditingIndex(null);
  };

  const handleCopySuggestion = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getPriorityConfig = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return {
          bg: "bg-red-50 dark:bg-red-950/30",
          border: "border-red-200 dark:border-red-800",
          badge: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
          highlight: "border-l-red-500",
          icon: "🔴",
          label: "Tinggi",
        };
      case "medium":
        return {
          bg: "bg-yellow-50 dark:bg-yellow-950/30",
          border: "border-yellow-200 dark:border-yellow-800",
          badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
          highlight: "border-l-yellow-500",
          icon: "🟡",
          label: "Sedang",
        };
      case "low":
        return {
          bg: "bg-green-50 dark:bg-green-950/30",
          border: "border-green-200 dark:border-green-800",
          badge: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
          highlight: "border-l-green-500",
          icon: "🟢",
          label: "Rendah",
        };
    }
  };

  const totalSuggestions = suggestions.length;
  const appliedCount = appliedIndices.size;
  const hasHighlights = highlightRegions.length > 0;

  return (
    <Card className="border-primary/20 bg-card shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Highlighter className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Suggestion Editor</CardTitle>
              <p className="text-xs text-muted-foreground">
                {appliedCount}/{totalSuggestions} saran diterapkan
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {hasHighlights && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1 text-xs">
              <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
              Prioritas Tinggi
            </Badge>
            <Badge variant="outline" className="gap-1 text-xs">
              <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" />
              Prioritas Sedang
            </Badge>
            <Badge variant="outline" className="gap-1 text-xs">
              <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
              Prioritas Rendah
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-4">
          <div className="space-y-4 pb-4">
            {/* High Priority */}
            {groupedSuggestions.high.length > 0 && (
              <SuggestionGroup
                title="Prioritas Tinggi"
                icon="🔴"
                suggestions={groupedSuggestions.high}
                editingIndex={editingIndex}
                editText={editText}
                appliedIndices={appliedIndices}
                activeHighlight={activeHighlight}
                onHighlightClick={onHighlightClick}
                onStartEdit={handleStartEdit}
                onEditTextChange={setEditText}
                onApply={handleApply}
                onCopy={handleCopySuggestion}
                getPriorityConfig={getPriorityConfig}
              />
            )}

            {/* Medium Priority */}
            {groupedSuggestions.medium.length > 0 && (
              <SuggestionGroup
                title="Prioritas Sedang"
                icon="🟡"
                suggestions={groupedSuggestions.medium}
                editingIndex={editingIndex}
                editText={editText}
                appliedIndices={appliedIndices}
                activeHighlight={activeHighlight}
                onHighlightClick={onHighlightClick}
                onStartEdit={handleStartEdit}
                onEditTextChange={setEditText}
                onApply={handleApply}
                onCopy={handleCopySuggestion}
                getPriorityConfig={getPriorityConfig}
              />
            )}

            {/* Low Priority */}
            {groupedSuggestions.low.length > 0 && (
              <SuggestionGroup
                title="Prioritas Rendah"
                icon="🟢"
                suggestions={groupedSuggestions.low}
                editingIndex={editingIndex}
                editText={editText}
                appliedIndices={appliedIndices}
                activeHighlight={activeHighlight}
                onHighlightClick={onHighlightClick}
                onStartEdit={handleStartEdit}
                onEditTextChange={setEditText}
                onApply={handleApply}
                onCopy={handleCopySuggestion}
                getPriorityConfig={getPriorityConfig}
              />
            )}
          </div>
        </ScrollArea>

        <Separator />

        <div className="flex gap-2 p-4">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={onApplyAll}
            disabled={appliedCount === totalSuggestions}
          >
            <Sparkles className="h-4 w-4" />
            Terapkan Semua
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={onClose}
          >
            <CheckCircle2 className="h-4 w-4" />
            Selesai
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface SuggestionGroupProps {
  title: string;
  icon: string;
  suggestions: Array<Suggestion & { originalIndex: number }>;
  editingIndex: number | null;
  editText: string;
  appliedIndices: Set<number>;
  activeHighlight: number | null;
  onHighlightClick: (index: number) => void;
  onStartEdit: (index: number) => void;
  onEditTextChange: (text: string) => void;
  onApply: (index: number) => void;
  onCopy: (text: string) => void;
  getPriorityConfig: (priority: "high" | "medium" | "low") => {
    bg: string;
    border: string;
    badge: string;
    highlight: string;
    icon: string;
    label: string;
  };
}

function SuggestionGroup({
  title,
  icon,
  suggestions,
  editingIndex,
  editText,
  appliedIndices,
  activeHighlight,
  onHighlightClick,
  onStartEdit,
  onEditTextChange,
  onApply,
  onCopy,
  getPriorityConfig,
}: SuggestionGroupProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span>{icon}</span>
        <span>{title}</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {suggestions.length}
        </Badge>
      </div>

      {suggestions.map((suggestion) => {
        const isApplied = appliedIndices.has(suggestion.originalIndex);
        const isEditing = editingIndex === suggestion.originalIndex;
        const isActive = activeHighlight === suggestion.originalIndex;
        const config = getPriorityConfig(suggestion.priority);

        return (
          <div
            key={suggestion.originalIndex}
            className={cn(
              "rounded-lg border-l-4 p-3 transition-all cursor-pointer",
              config.bg,
              config.border,
              config.highlight,
              isActive && "ring-2 ring-primary shadow-md",
              isApplied && "opacity-60",
            )}
            onClick={() => onHighlightClick(suggestion.originalIndex)}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <Badge className={cn("text-[10px]", config.badge)}>
                {suggestion.category}
              </Badge>
              {isApplied && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 text-[10px]">
                  ✓ Diterapkan
                </Badge>
              )}
            </div>

            {/* Current text */}
            <div className="text-xs mb-2">
              <span className="text-muted-foreground">Saat ini:</span>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 line-through decoration-red-400/50">
                {suggestion.current}
              </p>
            </div>

            {/* Suggested text */}
            {isEditing ? (
              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                <Textarea
                  value={editText}
                  onChange={(e) => onEditTextChange(e.target.value)}
                  className="min-h-[80px] text-sm"
                  placeholder="Edit suggestion..."
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => onApply(suggestion.originalIndex)}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Terapkan
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStartEdit(-1)}
                  >
                    Batal
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-xs text-primary">Rekomendasi:</span>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {suggestion.suggested}
                </p>

                {/* Impact */}
                <p className="mt-2 flex items-start gap-1 text-xs text-muted-foreground">
                  <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                  {suggestion.impact}
                </p>

                {/* Actions */}
                {!isApplied && (
                  <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 h-7 text-xs"
                      onClick={() => onStartEdit(suggestion.originalIndex)}
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1 h-7 text-xs"
                      onClick={() => onApply(suggestion.originalIndex)}
                    >
                      <Zap className="h-3 w-3" />
                      Terapkan
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 h-7 text-xs"
                      onClick={() => onCopy(suggestion.suggested)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
