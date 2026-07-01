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

  const current = recommendations[currentIndex];

  const goNext = () => setCurrentIndex((i) => (i + 1) % recommendations.length);
  const goPrev = () =>
    setCurrentIndex((i) => (i - 1 + recommendations.length) % recommendations.length);

  return (
    <aside className="rounded-3xl bg-[#061d13] p-5 shadow-xl text-white flex flex-col justify-between min-h-[340px]">
      <div>
        {/* Header row — "AI Rekomendasi" + badge */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {/* Custom Circuit-like Brain Mascot Icon */}
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0e3020]">
              <Sparkles className="h-4 w-4 text-[#94d152]" />
            </div>
            <span className="font-display font-bold text-[15px] tracking-tight">
              AI Rekomendasi
            </span>
          </div>
          {current.badge && (
            <span className="inline-flex items-center rounded-full bg-[#143224] px-2.5 py-0.5 text-[10px] font-bold text-[#94d152] border border-[#214b37]">
              {current.badge}
            </span>
          )}
        </div>

        {/* Content Block: Robot on Left, Text on Right */}
        <div className="flex items-start gap-4 mb-4">
          {/* Robot image container */}
          <div className="shrink-0 w-24 h-24 rounded-2xl bg-[#0c2f20] p-1.5 flex items-center justify-center border border-[#143d2a]">
            <img
              src="/green-robot-ats.png"
              alt="AI Robot"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>

          {/* Heading Text */}
          <div className="flex-1 min-w-0 pt-1">
            <h4 className="font-bold text-white text-base leading-snug tracking-tight">
              {current.title}
            </h4>
          </div>
        </div>

        {/* Description Text */}
        <p className="text-[13px] leading-relaxed text-[#a3b8ad] mb-5">{current.description}</p>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => onAction(current.action)}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#94d152] hover:bg-[#85c044] active:bg-[#72a439] py-3.5 text-sm font-bold text-[#0c2415] transition-all shadow-md active:scale-[0.99]"
        >
          {current.cta}
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>

      {/* Carousel navigation / dots / arrows */}
      {recommendations.length > 1 && (
        <div className="flex items-center justify-between mt-5 pt-1">
          {/* Dot indicators */}
          <div className="flex items-center gap-1.5">
            {recommendations.map((_, i) => (
              <button
                key={i}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === currentIndex ? "w-7 bg-[#94d152]" : "w-2 bg-[#214b37] hover:bg-[#346a51]",
                )}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Rekomendasi ${i + 1}`}
              />
            ))}
          </div>
          {/* Arrow buttons */}
          <div className="flex items-center gap-2">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1b3d2c] bg-[#072418] text-[#a3b8ad] hover:text-white hover:bg-[#0d3624] transition-all"
              onClick={goPrev}
              aria-label="Sebelumnya"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1b3d2c] bg-[#072418] text-[#a3b8ad] hover:text-white hover:bg-[#0d3624] transition-all"
              onClick={goNext}
              aria-label="Selanjutnya"
            >
              <ChevronRight className="h-5 w-5" />
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
