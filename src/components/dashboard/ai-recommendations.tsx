import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Brain,
  BarChart3,
  FileCheck,
  Mic,
  FileText,
  Sparkles,
  Target,
  Key,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Recommendation {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  cta: string;
  action: string;
  gradient: string;
  badge?: string;
}

interface AiRecommendationsProps {
  recommendations: Recommendation[];
  onAction: (action: string) => void;
}

export function AiRecommendations({ recommendations, onAction }: AiRecommendationsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (recommendations.length === 0) return null;

  const current = recommendations[currentIndex];
  const Icon = current.icon;

  const goNext = () => setCurrentIndex((i) => (i + 1) % recommendations.length);
  const goPrev = () =>
    setCurrentIndex((i) => (i - 1 + recommendations.length) % recommendations.length);

  return (
    <aside className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-card to-sky-50/50 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-display font-bold text-foreground text-sm">AI Rekomendasi</h3>
        </div>
        {current.badge && (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            {current.badge}
          </span>
        )}
      </div>

      {/* Card content */}
      <div className="px-5 pb-4">
        <div
          className={cn(
            "rounded-xl p-4 text-white",
            current.gradient,
          )}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Icon className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-base leading-tight">{current.title}</h4>
          </div>
          <p className="text-sm leading-relaxed text-white/85 mb-4">{current.description}</p>
          <Button
            size="sm"
            variant="secondary"
            className="w-full gap-1.5 text-foreground"
            onClick={() => onAction(current.action)}
          >
            {current.cta}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Carousel navigation */}
      {recommendations.length > 1 && (
        <div className="px-5 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {recommendations.map((_, i) => (
              <button
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === currentIndex ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/25",
                )}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Rekomendasi ${i + 1}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              className="flex h-7 w-7 items-center justify-center rounded-lg border text-muted-foreground hover:bg-muted transition-colors"
              onClick={goPrev}
              aria-label="Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-lg border text-muted-foreground hover:bg-muted transition-colors"
              onClick={goNext}
              aria-label="Selanjutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

// Helper to generate recommendations based on user state
export function getRecommendations(data: {
  hasCv: boolean;
  hasScore: boolean;
  tier: string;
  cvCount: number;
}): Recommendation[] {
  const recs: Recommendation[] = [];
  const { tier } = data;
  const isPro = tier === "pro";
  const isStarterPlus = tier === "starter" || tier === "pro";

  // Step 1: Create CV (always first if no CV)
  if (!data.hasCv) {
    recs.push({
      id: "create-first-cv",
      icon: FileText,
      title: "Mulai dari CV pertama",
      description: "Gunakan Guided Mode dengan AI untuk menyusun CV langkah demi langkah.",
      cta: "Buat CV Sekarang",
      action: "create-cv",
      gradient: "bg-gradient-to-br from-primary to-sky-600",
      badge: "Direkomendasikan",
    });
    return recs; // Only show CV creation if no CV exists
  }

  // Step 2: Score ATS (available to all tiers)
  if (!data.hasScore) {
    recs.push({
      id: "score-cv",
      icon: BarChart3,
      title: "Uji kesiapan ATS CV-mu",
      description: "Skor ATS membantu melihat seberapa siap CV-mu dibaca sistem HR.",
      cta: "Cek Skor ATS",
      action: "score",
      gradient: "bg-gradient-to-br from-amber-500 to-orange-500",
      badge: "Penting",
    });
  }

  // Keyword Extractor (available to all tiers)
  if (data.hasScore) {
    recs.push({
      id: "keyword-extract",
      icon: Key,
      title: "Ekstrak keyword dari lowongan",
      description: "Temukan keyword penting yang harus ada di CV agar lolos screening ATS.",
      cta: "Ekstrak Keyword",
      action: "keyword-extractor",
      gradient: "bg-gradient-to-br from-blue-500 to-indigo-600",
      badge: "ATS Tools",
    });
  }

  // Cover Letter (available to all tiers, limited for free)
  recs.push({
    id: "cover-letter",
    icon: FileCheck,
    title: "Buat Cover Letter dengan AI",
    description: "Tulis surat lamaran yang sinkron dengan CV dan role yang kamu target.",
    cta: "Buat Cover Letter",
    action: "cover-letter",
    gradient: "bg-gradient-to-br from-teal-500 to-emerald-600",
    badge: "AI Tools",
  });

  // CV Review (Starter+ only)
  if (isStarterPlus) {
    recs.push({
      id: "review-cv",
      icon: Target,
      title: "Review CV dengan AI",
      description: "Dapatkan analisis mendalam tentang kekuatan dan kelemahan CV-mu.",
      cta: "Review Sekarang",
      action: "cv-review",
      gradient: "bg-gradient-to-br from-rose-500 to-pink-600",
      badge: "Powerful",
    });
  }

  // Auto Tailor CV (Pro only)
  if (isPro && data.hasScore) {
    recs.push({
      id: "tailor-cv",
      icon: RefreshCw,
      title: "Sesuaikan CV untuk tiap lowongan",
      description: "Auto Tailor menyesuaikan summary dan skill CV dengan job description target.",
      cta: "Coba Auto Tailor",
      action: "tailor-cv",
      gradient: "bg-gradient-to-br from-cyan-500 to-blue-600",
      badge: "Pro",
    });
  }

  // Interview Simulation (Pro only)
  if (isPro) {
    recs.push({
      id: "interview-sim",
      icon: Mic,
      title: "Latihan interview dengan AI",
      description: "Simulasi wawancara realistis dengan feedback langsung untuk persiapan interview.",
      cta: "Mulai Simulasi",
      action: "simulasi",
      gradient: "bg-gradient-to-br from-rose-500 to-pink-600",
      badge: "Pro",
    });
  }

  // Upgrade prompt (free users only, after showing available features)
  if (tier === "free") {
    recs.push({
      id: "upgrade",
      icon: Sparkles,
      title: "Buka semua tools AI",
      description: "Upgrade untuk CV Review AI, Auto Tailor, simulasi interview, dan tools lainnya.",
      cta: "Lihat Paket",
      action: "upgrade",
      gradient: "bg-gradient-to-br from-amber-500 to-amber-700",
      badge: "Upgrade",
    });
  }

  // Fallback: always have at least one recommendation
  if (recs.length === 0) {
    recs.push({
      id: "score-cv-fallback",
      icon: BarChart3,
      title: "Cek skor ATS CV-mu",
      description: "Ukur kesiapan CV untuk sistem ATS dan dapatkan saran perbaikan.",
      cta: "Cek Skor",
      action: "score",
      gradient: "bg-gradient-to-br from-amber-500 to-orange-500",
      badge: "Mulai",
    });
  }

  return recs;
}
