import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Key,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Info,
  Lock,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LowScoreOnboardingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  score: number;
  cvTitle: string;
  cvId: string;
  onStartAction: (action: "cv-review" | "keyword-extractor" | "tailor-cv" | "score" | "upgrade") => void;
  tier: "free" | "starter" | "pro";
  scoreUsageCount: number;
  maxScoreUsage: number | null;
}

function CircularProgress({ percentage }: { percentage: number }) {
  const size = 96;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const isRed = percentage < 50;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
          opacity={0.2}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isRed ? "hsl(346, 84%, 50%)" : "hsl(38, 92%, 50%)"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-2xl font-black tracking-tight", isRed ? "text-rose-600" : "text-amber-600")}>
          {percentage}%
        </span>
        <span className="text-[8px] text-muted-foreground uppercase font-semibold mt-0.5">ATS Score</span>
      </div>
    </div>
  );
}

export function LowScoreOnboarding({
  open,
  onOpenChange,
  score,
  cvTitle,
  cvId,
  onStartAction,
  tier,
  scoreUsageCount,
  maxScoreUsage,
}: LowScoreOnboardingProps) {
  const isRed = score < 50;
  const isQuotaFull = maxScoreUsage !== null && scoreUsageCount >= maxScoreUsage;
  const remaining = maxScoreUsage !== null ? Math.max(0, maxScoreUsage - scoreUsageCount) : null;

  // Dynamic recommendations depending on user's tier
  const getRecommendations = () => {
    switch (tier) {
      case "free":
        return [
          {
            id: "score" as const,
            title: "CV Scoring (Selalu Gratis)",
            desc: "Lihat detail poin penilaian CV kamu secara rinci untuk mendeteksi apa saja yang kurang.",
            icon: BarChart3,
            badge: isQuotaFull ? "Quota Habis" : "Gratis",
            color: "text-emerald-600 bg-emerald-50 border-emerald-100",
            hoverBorder: "hover:border-emerald-400 hover:bg-emerald-50/10",
            isLocked: false,
            upgradeTier: "",
          },
          {
            id: "cv-review" as const,
            title: "Review CV dengan AI",
            desc: "Dapatkan analisis mendalam kelemahan dan saran perbaikan konten CV (membutuhkan Starter).",
            icon: Target,
            badge: "AI Review",
            color: "text-rose-600 bg-rose-50 border-rose-100",
            hoverBorder: "hover:border-amber-400 hover:bg-amber-50/10 border-dashed opacity-80",
            isLocked: true,
            upgradeTier: "Starter",
          },
          {
            id: "tailor-cv" as const,
            title: "Auto Tailor CV",
            desc: "Sesuaikan isi CV kamu secara otomatis dengan kualifikasi spesifik lowongan target (membutuhkan Pro).",
            icon: Sparkles,
            badge: "AI Tailor",
            color: "text-cyan-600 bg-cyan-50 border-cyan-100",
            hoverBorder: "hover:border-amber-400 hover:bg-amber-50/10 border-dashed opacity-80",
            isLocked: true,
            upgradeTier: "Pro",
          },
        ];
      case "starter":
        return [
          {
            id: "cv-review" as const,
            title: "Review CV dengan AI",
            desc: "Analisis menyeluruh tentang struktur, kekuatan, kelemahan, dan tips perbaikan langsung pada baris CV-mu.",
            icon: Target,
            badge: "Aktif",
            color: "text-rose-600 bg-rose-50 border-rose-100",
            hoverBorder: "hover:border-rose-400 hover:bg-rose-50/10",
            isLocked: false,
            upgradeTier: "",
          },
          {
            id: "keyword-extractor" as const,
            title: "Optimalkan ATS Keyword",
            desc: "Ambil kata kunci penting lowongan kerja dan masukkan ke CV agar lolos saringan awal ATS.",
            icon: Key,
            badge: "Aktif",
            color: "text-blue-600 bg-blue-50 border-blue-100",
            hoverBorder: "hover:border-blue-400 hover:bg-blue-50/10",
            isLocked: false,
            upgradeTier: "",
          },
          {
            id: "tailor-cv" as const,
            title: "Auto Tailor CV",
            desc: "Sesuaikan isi CV kamu secara otomatis dengan kualifikasi spesifik lowongan target (membutuhkan Pro).",
            icon: Sparkles,
            badge: "AI Tailor",
            color: "text-cyan-600 bg-cyan-50 border-cyan-100",
            hoverBorder: "hover:border-amber-400 hover:bg-amber-50/10 border-dashed opacity-80",
            isLocked: true,
            upgradeTier: "Pro",
          },
        ];
      case "pro":
      default:
        return [
          {
            id: "cv-review" as const,
            title: "Review CV dengan AI",
            desc: "Analisis menyeluruh tentang struktur, kekuatan, kelemahan, dan tips perbaikan langsung pada baris CV-mu.",
            icon: Target,
            badge: "Aktif",
            color: "text-rose-600 bg-rose-50 border-rose-100",
            hoverBorder: "hover:border-rose-400 hover:bg-rose-50/10",
            isLocked: false,
            upgradeTier: "",
          },
          {
            id: "tailor-cv" as const,
            title: "Auto Tailor CV",
            desc: "Sesuaikan isi CV kamu secara otomatis dengan kualifikasi spesifik lowongan target dalam satu kali klik.",
            icon: Sparkles,
            badge: "Aktif",
            color: "text-cyan-600 bg-cyan-50 border-cyan-100",
            hoverBorder: "hover:border-cyan-400 hover:bg-cyan-50/10",
            isLocked: false,
            upgradeTier: "",
          },
          {
            id: "keyword-extractor" as const,
            title: "Optimalkan ATS Keyword",
            desc: "Ambil kata kunci penting lowongan kerja dan masukkan ke CV agar lolos saringan awal ATS.",
            icon: Key,
            badge: "Aktif",
            color: "text-blue-600 bg-blue-50 border-blue-100",
            hoverBorder: "hover:border-blue-400 hover:bg-blue-50/10",
            isLocked: false,
            upgradeTier: "",
          },
        ];
    }
  };

  const recommendations = getRecommendations();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl gap-0 border bg-card">
        {/* Header banner alert */}
        <div className={cn(
          "px-6 py-5 shrink-0 border-b flex items-start gap-4",
          isRed ? "bg-rose-50/40 border-rose-100" : "bg-amber-50/40 border-amber-100"
        )}>
          <div className={cn(
            "p-2.5 rounded-xl border shrink-0",
            isRed ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-amber-50 text-amber-600 border-amber-200"
          )}>
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <span className={cn("text-xs font-bold uppercase tracking-wider", isRed ? "text-rose-600" : "text-amber-600")}>
              Peringatan Optimalisasi CV
            </span>
            <DialogTitle className="text-lg font-bold text-foreground mt-0.5">
              Skor ATS CV &ldquo;{cvTitle}&rdquo; Masih Rendah!
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              CV dengan skor ATS di bawah 70% berisiko tinggi langsung gugur saat disaring otomatis oleh software HRD.
            </DialogDescription>
          </div>
        </div>

        {/* Scrollable details */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Radial score card info */}
          <div className="rounded-xl border bg-muted/20 p-4 flex flex-col sm:flex-row items-center gap-5">
            <div className="shrink-0">
              <CircularProgress percentage={score} />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <h4 className="font-bold text-sm text-foreground">Kenapa skor ini rendah?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Skor dihitung berdasarkan kepadatan kata kunci, kelengkapan profil, dan formatting. 
                Pemberi kerja menggunakan ATS untuk menyeleksi ratusan pelamar, dan hanya meloloskan CV yang relevan.
              </p>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 mt-1">
                <Info className="h-3 w-3 shrink-0" /> Target minimal kelulusan ATS: 70% - 80%
              </div>
            </div>
          </div>

          {/* Recommendations list */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Rekomendasi Aksi Cepat
            </h4>
            
            <div className="grid gap-3">
              {recommendations.map((rec) => {
                const Icon = rec.icon;
                const isItemLocked = rec.isLocked || (rec.id === "score" && isQuotaFull);
                return (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => {
                      if (isItemLocked) {
                        onStartAction("upgrade");
                      } else {
                        onStartAction(rec.id);
                      }
                    }}
                    className={cn(
                      "flex items-start text-left gap-4 p-4 rounded-xl border border-border bg-card transition-all hover:shadow-sm",
                      isItemLocked
                        ? "border-dashed opacity-80 hover:border-amber-400 hover:bg-amber-50/10"
                        : rec.hoverBorder
                    )}
                  >
                    <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-sm", rec.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{rec.title}</span>
                        {rec.isLocked ? (
                          <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 border-amber-400 text-amber-700 gap-0.5 bg-amber-50/50">
                            <Lock className="h-2 w-2" /> Upgrade {rec.upgradeTier}
                          </Badge>
                        ) : rec.id === "score" && isQuotaFull ? (
                          <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 border-rose-400 text-rose-700 bg-rose-50/50">
                            Quota Habis
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 border-emerald-200 text-emerald-700 bg-emerald-50/50">
                            {rec.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        {rec.desc}
                      </p>

                      {/* Display quota information inside score recommendation */}
                      {rec.id === "score" && maxScoreUsage !== null && (
                        <div className="mt-2 text-[11px] flex flex-col gap-0.5">
                          <span className="text-muted-foreground font-medium">
                            Quota Scoring: {scoreUsageCount}/{maxScoreUsage} terpakai (Sisa: {remaining})
                          </span>
                          {isQuotaFull && (
                            <span className="text-rose-600 font-bold">
                              Quota kamu sudah habis, silahkan Upgrade tier
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="h-full flex items-center justify-center text-muted-foreground shrink-0 pl-1">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t px-6 py-4 flex items-center justify-end gap-2 bg-muted/10 shrink-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Nanti Saja
          </Button>
          <Button
            onClick={() => {
              if (tier === "free") {
                if (isQuotaFull) {
                  onStartAction("upgrade");
                } else {
                  onStartAction("score");
                }
              } else {
                onStartAction("cv-review");
              }
            }}
            className={cn(
              "text-white text-xs font-bold",
              (tier === "free" && isQuotaFull)
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            )}
          >
            {tier === "free" 
              ? (isQuotaFull ? "Upgrade Tier Sekarang" : "Mulai Cek Skor ATS") 
              : "Mulai Perbaiki CV Sekarang"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
