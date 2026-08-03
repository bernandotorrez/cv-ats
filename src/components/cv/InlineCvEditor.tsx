/**
 * Inline CV Editor with Suggestion Highlights
 * Shows CV with highlighted suggestions that can be accepted/rejected inline
 */

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Pencil,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Zap,
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
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<number>>(new Set());
  const [activeHighlight, setActiveHighlight] = useState<number | null>(null);

  // Group suggestions by section
  const groupedSuggestions = useMemo(() => {
    const groups: Record<string, Array<Suggestion & { originalIndex: number }>> = {};
    
    suggestions.forEach((s, i) => {
      const section = s.targetSection?.split(".")[0] || "other";
      if (!groups[section]) groups[section] = [];
      groups[section].push({ ...s, originalIndex: i });
    });

    return groups;
  }, [suggestions]);

  const handleAccept = useCallback((index: number) => {
    const text = editText || suggestions[index].suggested;
    onApplySuggestion(index, text);
    setAppliedIndices((prev) => new Set([...prev, index]));
    setEditingIndex(null);
    setEditText("");
  }, [editText, suggestions, onApplySuggestion]);

  const handleReject = useCallback((index: number) => {
    setAppliedIndices((prev) => new Set([...prev, index]));
    setEditingIndex(null);
    setEditText("");
  }, []);

  const handleEdit = useCallback((index: number) => {
    setEditingIndex(index);
    setEditText(suggestions[index].suggested);
  }, [suggestions]);

  const handleAcceptAll = useCallback(() => {
    onApplyAll();
    const allIndices = new Set(suggestions.map((_, i) => i));
    setAppliedIndices(allIndices);
  }, [onApplyAll, suggestions]);

  const toggleExpand = useCallback((index: number) => {
    setExpandedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const appliedCount = appliedIndices.size;
  const totalCount = suggestions.length;
  const allApplied = appliedCount === totalCount;

  const getPriorityConfig = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return {
          bg: "bg-red-50 dark:bg-red-950/20",
          border: "border-red-200 dark:border-red-800",
          highlight: "bg-yellow-200/70 dark:bg-yellow-800/50",
          badge: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
          icon: "🔴",
        };
      case "medium":
        return {
          bg: "bg-amber-50 dark:bg-amber-950/20",
          border: "border-amber-200 dark:border-amber-800",
          highlight: "bg-yellow-200/60 dark:bg-yellow-800/40",
          badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
          icon: "🟡",
        };
      case "low":
        return {
          bg: "bg-green-50 dark:bg-green-950/20",
          border: "border-green-200 dark:border-green-800",
          highlight: "bg-yellow-200/50 dark:bg-yellow-800/30",
          badge: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
          icon: "🟢",
        };
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,400px] h-[calc(100vh-200px)]">
      {/* Left Panel - CV Preview with Highlights */}
      <Card className="overflow-hidden border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">CV Preview</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Highlight kuning menunjukkan area yang perlu diperbaiki
                </p>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              <span className="h-2 w-2 rounded-full bg-yellow-400" />
              {totalCount} saran
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="relative p-4">
              {/* CV Preview with highlight overlay */}
              <div className="relative">
                <CvPreview
                  data={cvData}
                  template={templateId}
                  scale={0.6}
                />
                
                {/* Highlight overlays */}
                {suggestions.map((suggestion, index) => {
                  if (appliedIndices.has(index)) return null;
                  
                  const config = getPriorityConfig(suggestion.priority);
                  const isActive = activeHighlight === index;
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn(
                        "absolute right-0 top-0 cursor-pointer transition-all",
                        isActive && "scale-105 z-10"
                      )}
                      style={{
                        top: `${15 + (index * 8)}%`,
                      }}
                      onMouseEnter={() => setActiveHighlight(index)}
                      onMouseLeave={() => setActiveHighlight(null)}
                      onClick={() => toggleExpand(index)}
                    >
                      <Badge
                        className={cn(
                          "gap-1 shadow-md border cursor-pointer",
                          config.badge,
                          isActive && "ring-2 ring-primary"
                        )}
                      >
                        <span className="h-2 w-2 rounded-full bg-current" />
                        {suggestion.category}
                      </Badge>
                    </motion.div>
                  );
                })}
              </div>

              {/* Stabilo highlight legend */}
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-3 w-3 rounded bg-yellow-200 dark:bg-yellow-800" />
                  <span className="text-muted-foreground">Perlu diperbaiki</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-3 w-3 rounded bg-green-200 dark:bg-green-800" />
                  <span className="text-muted-foreground">Sudah diterapkan</span>
                </div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Right Panel - Suggestions List */}
      <Card className="overflow-hidden border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Saran Perbaikan</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {appliedCount}/{totalCount} saran diterapkan
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-2 w-full bg-white/50 dark:bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(appliedCount / totalCount) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-380px)]">
            <div className="p-4 space-y-3">
              {Object.entries(groupedSuggestions).map(([section, sectionSuggestions]) => (
                <div key={section} className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {section === "personal" ? "Profil" : 
                       section === "experiences" ? "Pengalaman" :
                       section === "educations" ? "Pendidikan" :
                       section === "other" ? "Lainnya" : section}
                    </h4>
                    <Separator className="flex-1" />
                  </div>

                  {sectionSuggestions.map((suggestion) => {
                    const isApplied = appliedIndices.has(suggestion.originalIndex);
                    const isEditing = editingIndex === suggestion.originalIndex;
                    const isExpanded = expandedSuggestions.has(suggestion.originalIndex);
                    const config = getPriorityConfig(suggestion.priority);

                    return (
                      <motion.div
                        key={suggestion.originalIndex}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "rounded-xl border-2 overflow-hidden transition-all",
                          isApplied ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20" : `${config.border} ${config.bg}`,
                          activeHighlight === suggestion.originalIndex && "ring-2 ring-primary shadow-lg"
                        )}
                        onMouseEnter={() => setActiveHighlight(suggestion.originalIndex)}
                        onMouseLeave={() => setActiveHighlight(null)}
                      >
                        {/* Suggestion header */}
                        <div
                          className="flex items-start gap-3 p-3 cursor-pointer"
                          onClick={() => !isApplied && toggleExpand(suggestion.originalIndex)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={cn("text-[10px]", config.badge)}>
                                {suggestion.priority === "high" ? "Tinggi" :
                                 suggestion.priority === "medium" ? "Sedang" : "Rendah"}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                {suggestion.category}
                              </Badge>
                              {isApplied && (
                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 text-[10px]">
                                  ✓ Diterapkan
                                </Badge>
                              )}
                            </div>
                            
                            {/* Current text preview */}
                            <p className={cn(
                              "text-sm line-clamp-2",
                              isApplied ? "text-muted-foreground" : "text-red-600 dark:text-red-400 line-through decoration-red-400/50"
                            )}>
                              {suggestion.current}
                            </p>
                          </div>

                          {!isApplied && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>

                        {/* Expanded content */}
                        <AnimatePresence>
                          {isExpanded && !isApplied && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-3 pb-3 space-y-3">
                                <Separator />
                                
                                {/* Suggested text */}
                                <div>
                                  <p className="text-xs font-medium text-primary mb-1">Rekomendasi:</p>
                                  {isEditing ? (
                                    <div className="space-y-2">
                                      <Textarea
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        className="min-h-[80px] text-sm"
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          className="gap-1 h-7"
                                          onClick={() => handleAccept(suggestion.originalIndex)}
                                        >
                                          <Check className="h-3 w-3" />
                                          Simpan
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7"
                                          onClick={() => setEditingIndex(null)}
                                        >
                                          Batal
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-sm font-medium text-foreground bg-yellow-100/50 dark:bg-yellow-900/20 px-2 py-1 rounded">
                                      {suggestion.suggested}
                                    </p>
                                  )}
                                </div>

                                {/* Impact */}
                                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                  <Lightbulb className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
                                  <span>{suggestion.impact}</span>
                                </div>

                                {/* Action buttons */}
                                {!isEditing && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="flex-1 gap-1 h-9 bg-emerald-600 hover:bg-emerald-700"
                                      onClick={() => handleAccept(suggestion.originalIndex)}
                                    >
                                      <Check className="h-4 w-4" />
                                      Terapkan
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 gap-1 h-9"
                                      onClick={() => handleEdit(suggestion.originalIndex)}
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-9 px-3 text-muted-foreground"
                                      onClick={() => handleReject(suggestion.originalIndex)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Bottom actions */}
          <div className="border-t bg-muted/30 p-4 space-y-3">
            {!allApplied && (
              <Button
                className="w-full gap-2"
                variant="outline"
                onClick={handleAcceptAll}
              >
                <Zap className="h-4 w-4" />
                Terapkan Semua Saran
              </Button>
            )}
            <Button
              className="w-full gap-2"
              onClick={onSave}
              disabled={appliedCount === 0}
            >
              <CheckCircle2 className="h-4 w-4" />
              Simpan Perubahan ({appliedCount} saran diterapkan)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
