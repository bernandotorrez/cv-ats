import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface ScoreBreakdown {
  relevance: number;
  skills_match: number;
  experience: number;
  format: number;
  keywords: number;
}

interface Props {
  overallScore: number;
  breakdown?: ScoreBreakdown;
  summary?: string;
  suggestions?: string[];
  isAnalyzing?: boolean;
  onAnalyze?: () => void;
  onFixWithAi?: () => void;
  className?: string;
  compact?: boolean;
}

const BREAKDOWN_LABELS: Record<string, { label: string; description: string }> = {
  relevance: { label: "Relevansi", description: "Cocok dengan posisi target" },
  skills_match: { label: "Skill Match", description: "Keyword & skill terpenuhi" },
  experience: { label: "Pengalaman", description: "Kualitas deskripsi pekerjaan" },
  format: { label: "Format ATS", description: "Struktur & heading CV" },
  keywords: { label: "Keyword", description: "Keyword dari job description" },
};

function getGrade(score: number) {
  if (score >= 85) return { grade: "A", color: "text-primary", bg: "bg-primary/10" };
  if (score >= 70) return { grade: "B", color: "text-primary/80", bg: "bg-primary/5" };
  if (score >= 55) return { grade: "C", color: "text-warning-foreground", bg: "bg-warning/10" };
  return { grade: "D", color: "text-destructive", bg: "bg-destructive/10" };
}

function CircularScore({ score, size = 100 }: { score: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score / 100, 1);
  const strokeDashoffset = circumference * (1 - progress);

  const { grade, color } = getGrade(score);
  const trackColor = score >= 70 ? "var(--color-primary)" : score >= 55 ? "var(--color-warning)" : "var(--color-destructive)";

  return (
    <div className="relative inline-flex items-center justify-center" aria-hidden>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-2xl font-bold font-display", color)}>{score}</span>
        <span className="text-[10px] text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

export function AtsScoreWidget({
  overallScore,
  breakdown,
  summary,
  suggestions,
  isAnalyzing,
  onAnalyze,
  onFixWithAi,
  className,
  compact = false,
}: Props) {
  const [expanded, setExpanded] = useState(!compact);
  const { grade, color, bg } = getGrade(overallScore);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader
        className={cn(
          "cursor-pointer select-none",
          !compact && "cursor-default",
        )}
        onClick={compact ? () => setExpanded((v) => !v) : undefined}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Skor ATS CV Anda
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs", bg, color)}>
              Grade {grade}
            </Badge>
            {compact && (
              <span className="text-muted-foreground">
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn(compact && !expanded && "hidden")}>
        {/* Overall Score */}
        <div className="flex items-center gap-6 mb-6">
          <CircularScore score={overallScore} size={100} />
          <div className="flex-1">
            {summary ? (
              <p className="text-sm text-muted-foreground">{summary}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Analisis ATS-friendly untuk CV kamu. Optimalkan keyword dan struktur untuk meningkatkan skor.
              </p>
            )}
          </div>
        </div>

        {/* Breakdown */}
        {breakdown && (
          <div className="space-y-3 mb-4">
            {Object.entries(breakdown).map(([key, val]) => {
              const meta = BREAKDOWN_LABELS[key] || { label: key, description: "" };
              const scoreColor =
                val >= 85 ? "text-primary" : val >= 70 ? "text-warning-foreground" : "text-destructive";
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <div>
                      <span className="font-medium">{meta.label}</span>
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        ({meta.description})
                      </span>
                    </div>
                    <span className={cn("font-semibold", scoreColor)}>{val}/100</span>
                  </div>
                  <Progress
                    value={val}
                    className={`h-2 ${
                      val >= 85 ? "[&>div]:bg-primary" : val >= 70 ? "[&>div]:bg-warning" : "[&>div]:bg-destructive"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Suggestions */}
        {suggestions && suggestions.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Lightbulb className="h-3 w-3" /> Rekomendasi
            </p>
            <ul className="space-y-1.5">
              {suggestions.slice(0, 3).map((s, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-primary mt-1 shrink-0">•</span>
                  <span className="text-muted-foreground">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {onAnalyze && (
            <Button
              size="sm"
              variant="outline"
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className="gap-1"
            >
              {isAnalyzing ? (
                <span className="flex items-center gap-1">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Menganalisis...
                </span>
              ) : (
                <>
                  <TrendingUp className="h-3.5 w-3.5" /> Lihat Detail
                </>
              )}
            </Button>
          )}
          {onFixWithAi && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onFixWithAi}
              className="gap-1"
            >
              <Lightbulb className="h-3.5 w-3.5" /> Perbaiki dengan AI
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
