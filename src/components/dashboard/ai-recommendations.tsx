import { useState } from "react";
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

  const current = recommendations[Math.min(currentIndex, recommendations.length - 1)];
  const Icon = current.icon;
  const goNext = () => setCurrentIndex((i) => (i + 1) % recommendations.length);
  const goPrev = () =>
    setCurrentIndex((i) => (i - 1 + recommendations.length) % recommendations.length);

  return (
    <section
      aria-labelledby="reco-title"
      aria-roledescription="carousel"
      className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="reco-title" className="flex items-center gap-2 text-sm font-bold">
          <Sparkles aria-hidden="true" className="h-4 w-4 text-primary" />
          Rekomendasi untukmu
        </h2>
        {current.badge && (
          <span className="rounded-full bg-yellow-300/70 px-2 py-0.5 text-[10px] font-bold text-gray-900">
            {current.badge}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-start gap-3" aria-live="polite">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-bold leading-snug">{current.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {current.description}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onAction(current.action)}
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-primary/30 text-sm font-bold text-primary transition-colors hover:border-primary hover:bg-primary/5"
      >
        {current.cta}
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </button>

      {recommendations.length > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {recommendations.map((r, i) => (
              <button
                key={r.id}
                type="button"
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === currentIndex
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-border hover:bg-muted-foreground/40",
                )}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Rekomendasi ${i + 1} dari ${recommendations.length}`}
                aria-current={i === currentIndex}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={goPrev}
              aria-label="Rekomendasi sebelumnya"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={goNext}
              aria-label="Rekomendasi berikutnya"
            >
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
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
      gradient: "bg-gradient-to-br from-emerald-800 to-green-800",
      badge: "Direkomendasikan",
    });
    return recs; // Only show CV creation if no CV exists
  }

  // Keyword Extractor — always show as primary recommendation
  recs.push({
    id: "keyword-extract",
    icon: Key,
    title: "Optimalkan CV untuk lolos screening ATS",
    description: "Ekstrak keyword penting dari lowongan pekerjaan dalam hitungan detik.",
    cta: "Ekstrak Keyword",
    action: "keyword-extractor",
    gradient: "bg-gradient-to-br from-emerald-800 to-green-800",
    badge: "ATS Tools",
  });

  // Step 2: Score ATS (available to all tiers)
  if (!data.hasScore) {
    recs.push({
      id: "score-cv",
      icon: BarChart3,
      title: "Uji kesiapan ATS CV-mu",
      description: "Skor ATS membantu melihat seberapa siap CV-mu dibaca sistem HR.",
      cta: "Cek Skor ATS",
      action: "score",
      gradient: "bg-gradient-to-br from-amber-600 to-orange-600",
      badge: "Penting",
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
    gradient: "bg-gradient-to-br from-teal-600 to-emerald-700",
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
      gradient: "bg-gradient-to-br from-rose-600 to-pink-700",
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
      gradient: "bg-gradient-to-br from-cyan-600 to-blue-700",
      badge: "Pro",
    });
  }

  // Interview Simulation (Pro only)
  if (isPro) {
    recs.push({
      id: "interview-sim",
      icon: Mic,
      title: "Latihan interview dengan AI",
      description:
        "Simulasi wawancara realistis dengan feedback langsung untuk persiapan interview.",
      cta: "Mulai Simulasi",
      action: "simulasi",
      gradient: "bg-gradient-to-br from-rose-600 to-pink-700",
      badge: "Pro",
    });
  }

  // Upgrade prompt (free users only, after showing available features)
  if (tier === "free") {
    recs.push({
      id: "upgrade",
      icon: Sparkles,
      title: "Buka semua tools AI",
      description:
        "Upgrade untuk CV Review AI, Auto Tailor, simulasi interview, dan tools lainnya.",
      cta: "Lihat Paket",
      action: "upgrade",
      gradient: "bg-gradient-to-br from-amber-600 to-amber-800",
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
      gradient: "bg-gradient-to-br from-amber-600 to-orange-600",
      badge: "Mulai",
    });
  }

  return recs;
}
