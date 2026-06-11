import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Lightbulb, RefreshCw } from "lucide-react";

const tips = [
  {
    tip: "Mulai setiap bullet pengalaman dengan kata kerja aktif: 'Memimpin', 'Membangun', 'Meningkatkan'.",
    link: "/panduan-cv-ats",
    tag: "Penulisan",
  },
  {
    tip: "Tambahkan angka konkret ke deskripsi kerja — 'meningkatkan penjualan 30%' jauh lebih kuat dari 'meningkatkan penjualan'.",
    link: "/panduan-cv-ats",
    tag: "Dampak",
  },
  {
    tip: "Salin keyword dari job description ke CV — sistem ATS mencari kata yang cocok, bukan sinonim.",
    link: "/panduan-cv-ats",
    tag: "ATS",
  },
  {
    tip: "Ringkasan profil harus spesifik: sebutkan level, spesialisasi, dan industri targetmu.",
    link: "/panduan-cv-ats",
    tag: "Profil",
  },
  {
    tip: "Ekspor PDF setelah skor ATS ≥ 75 — di bawah itu, perbaiki dulu sebelum apply.",
    link: "/panduan-cv-ats",
    tag: "Strategi",
  },
  {
    tip: "Satu CV satu target posisi. Sesuaikan summary dan skill untuk tiap lamaran berbeda.",
    link: "/panduan-cv-ats",
    tag: "Strategi",
  },
  {
    tip: "Hindari tabel dan kolom di CV — banyak ATS tidak bisa membaca format tersebut dengan benar.",
    link: "/panduan-cv-ats",
    tag: "Format",
  },
  {
    tip: "Sertakan link LinkedIn yang up-to-date — rekruter sering cek profil sebelum interview.",
    link: "/panduan-cv-ats",
    tag: "Profil",
  },
] as const;

const tagColors: Record<string, string> = {
  Penulisan: "bg-primary/10 text-primary",
  Dampak: "bg-amber-100 text-amber-700",
  ATS: "bg-blue-100 text-blue-700",
  Profil: "bg-violet-100 text-violet-700",
  Strategi: "bg-emerald-100 text-emerald-700",
  Format: "bg-rose-100 text-rose-700",
};

// Pick tips based on day-of-month so it feels "daily" but is deterministic
function getDailyTips(count = 4) {
  const dayIndex = new Date().getDate();
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(tips[(dayIndex + i) % tips.length]);
  }
  return result;
}

export function TipsCard() {
  const [shuffled, setShuffled] = useState(false);
  const [displayed, setDisplayed] = useState(() => getDailyTips(4));

  const handleShuffle = () => {
    // Pick 4 random tips different from current
    const shuffledPool = [...tips].sort(() => Math.random() - 0.5);
    setDisplayed(shuffledPool.slice(0, 4) as typeof displayed);
    setShuffled(true);
  };

  return (
    <aside className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
            <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <h3 className="font-display font-bold text-foreground text-sm">Tips hari ini</h3>
        </div>
        <button
          type="button"
          onClick={handleShuffle}
          title="Acak tips"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Acak tips"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${shuffled ? "text-primary" : ""}`} />
        </button>
      </div>

      <ul className="px-3 py-3 space-y-1">
        {displayed.map((item, i) => (
          <li key={`${item.tip.slice(0, 20)}-${i}`}>
            <Link
              to={item.link}
              className="group flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              <span
                className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold mt-0.5 ${
                  tagColors[item.tag] ?? "bg-muted text-muted-foreground"
                }`}
              >
                {item.tag}
              </span>
              <span className="flex-1 leading-5 text-xs">{item.tip}</span>
              <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="px-5 pb-3">
        <Link
          to="/panduan-cv-ats"
          className="flex items-center justify-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Baca panduan lengkap
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </aside>
  );
}
