/**
 * Highlighted CV Preview
 * Wraps CvPreview with highlight overlays for AI suggestions
 */

import { useMemo, useState, useCallback } from "react";
import { CvPreview } from "./CvPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Highlighter } from "lucide-react";
import type { CvData, TemplateId } from "@/lib/cv-types";
import type { CvUiLang } from "@/lib/cv-translations";
import type { SectionDef } from "./editor/SectionsNav";
import { cn } from "@/lib/utils";

interface Suggestion {
  priority: "high" | "medium" | "low";
  category: string;
  current: string;
  suggested: string;
  impact: string;
  targetSection?: string;
  bulletIndex?: number | null;
}

interface HighlightedCvPreviewProps {
  data: CvData;
  template: TemplateId;
  suggestions?: Suggestion[];
  activeSuggestionIndex?: number | null;
  onSuggestionClick?: (index: number) => void;
  showHighlights?: boolean;
  onToggleHighlights?: () => void;
  scale?: number;
  showWatermark?: boolean;
  sectionOrder?: SectionDef[];
  language?: CvUiLang;
}

export function HighlightedCvPreview({
  data,
  template,
  suggestions = [],
  activeSuggestionIndex = null,
  onSuggestionClick,
  showHighlights = true,
  onToggleHighlights,
  scale = 1,
  showWatermark = false,
  sectionOrder,
  language = "id",
}: HighlightedCvPreviewProps) {
  // Find which sections contain suggestions
  const highlightMap = useMemo(() => {
    if (!suggestions.length || !showHighlights) return new Map<string, number[]>();

    const map = new Map<string, number[]>();

    suggestions.forEach((suggestion, index) => {
      const currentLower = suggestion.current.toLowerCase().trim();
      if (!currentLower || currentLower.length < 5) return;

      // Check personal summary
      if (data.personal.summary?.toLowerCase().includes(currentLower)) {
        const key = "personal-summary";
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(index);
      }

      // Check experiences
      data.experiences.forEach((exp, expIndex) => {
        if (exp.description?.toLowerCase().includes(currentLower)) {
          const key = `experience-${expIndex}`;
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(index);
        }
      });

      // Check educations
      data.educations.forEach((edu, eduIndex) => {
        if (edu.description?.toLowerCase().includes(currentLower)) {
          const key = `education-${eduIndex}`;
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(index);
        }
      });
    });

    return map;
  }, [data, suggestions, showHighlights]);

  const getPriorityColor = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return "bg-red-400/30 border-red-400/60";
      case "medium":
        return "bg-yellow-300/40 border-yellow-400/60";
      case "low":
        return "bg-green-300/30 border-green-400/60";
    }
  };

  const hasSuggestions = suggestions.length > 0;

  return (
    <div className="relative">
      {/* Toggle button */}
      {hasSuggestions && onToggleHighlights && (
        <div className="absolute -top-10 right-0 z-10">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-7 text-xs"
            onClick={onToggleHighlights}
          >
            {showHighlights ? (
              <>
                <EyeOff className="h-3 w-3" />
                Sembunyikan Highlight
              </>
            ) : (
              <>
                <Highlighter className="h-3 w-3" />
                Tampilkan Highlight
              </>
            )}
          </Button>
        </div>
      )}

      {/* CV Preview with highlight overlay */}
      <div className="relative">
        <CvPreview
          data={data}
          template={template}
          scale={scale}
          showWatermark={showWatermark}
          sectionOrder={sectionOrder}
          language={language}
        />

        {/* Highlight overlay indicators */}
        {showHighlights && hasSuggestions && (
          <HighlightIndicators
            highlightMap={highlightMap}
            suggestions={suggestions}
            activeSuggestionIndex={activeSuggestionIndex}
            onSuggestionClick={onSuggestionClick}
            getPriorityColor={getPriorityColor}
          />
        )}
      </div>
    </div>
  );
}

interface HighlightIndicatorsProps {
  highlightMap: Map<string, number[]>;
  suggestions: Suggestion[];
  activeSuggestionIndex: number | null;
  onSuggestionClick?: (index: number) => void;
  getPriorityColor: (priority: "high" | "medium" | "low") => string;
}

function HighlightIndicators({
  highlightMap,
  suggestions,
  activeSuggestionIndex,
  onSuggestionClick,
  getPriorityColor,
}: HighlightIndicatorsProps) {
  // Get the highest priority suggestion for each section
  const sectionPriorities = useMemo(() => {
    const priorities = new Map<string, "high" | "medium" | "low">();

    highlightMap.forEach((indices, section) => {
      const sectionSuggestions = indices.map((i) => suggestions[i]);
      if (sectionSuggestions.some((s) => s.priority === "high")) {
        priorities.set(section, "high");
      } else if (sectionSuggestions.some((s) => s.priority === "medium")) {
        priorities.set(section, "medium");
      } else {
        priorities.set(section, "low");
      }
    });

    return priorities;
  }, [highlightMap, suggestions]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Floating badges for sections with suggestions */}
      {Array.from(highlightMap.entries()).map(([section, indices]) => {
        const priority = sectionPriorities.get(section) || "medium";
        const isActive = indices.some((i) => i === activeSuggestionIndex);

        return (
          <div
            key={section}
            className={cn(
              "absolute right-2 pointer-events-auto cursor-pointer transition-all",
              isActive && "scale-110 z-10",
            )}
            style={{
              top: getSectionTop(section),
            }}
            onClick={() => {
              if (onSuggestionClick && indices.length > 0) {
                onSuggestionClick(indices[0]);
              }
            }}
          >
            <Badge
              className={cn(
                "gap-1 text-[10px] shadow-md border",
                getPriorityColor(priority),
                isActive && "ring-2 ring-primary animate-pulse",
              )}
            >
              <Highlighter className="h-3 w-3" />
              {indices.length} saran
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

// Helper to estimate section position (simplified)
function getSectionTop(section: string): string {
  if (section.startsWith("personal")) return "15%";
  if (section.startsWith("experience-0")) return "35%";
  if (section.startsWith("experience-1")) return "45%";
  if (section.startsWith("experience")) return "55%";
  if (section.startsWith("education")) return "65%";
  if (section.startsWith("skills")) return "75%";
  return "50%";
}
