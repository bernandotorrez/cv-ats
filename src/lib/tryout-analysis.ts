/**
 * Tryout Analysis — analisis hasil tryout SKD (murni, tanpa I/O).
 *
 * Dipakai halaman hasil untuk: jarak ke passing grade, tingkat kesiapan,
 * kategori terlemah, dan rekomendasi belajar yang spesifik.
 */
import {
  SCORING,
  type TryoutAttempt,
  type TryoutAttemptStats,
  type TryoutExamSet,
  type TryoutSubtest,
} from "./tryout-types";

export const SUBTEST_MAX: Record<TryoutSubtest, number> = {
  twk: SCORING.MAX_SCORE_TWK,
  tiu: SCORING.MAX_SCORE_TIU,
  tkp: SCORING.MAX_SCORE_TKP,
};

type CompositionLike = Partial<Pick<TryoutExamSet, "twk_count" | "tiu_count" | "tkp_count">>;

/**
 * Skor maksimal per subtes dari komposisi set (5 poin per soal untuk
 * TWK/TIU benar dan TKP opsi terbaik). Tanpa komposisi → set penuh SKD.
 */
export function maxScoresOf(
  set: CompositionLike | null | undefined,
): Record<TryoutSubtest | "total", number> {
  const twk = set?.twk_count != null ? set.twk_count * 5 : SUBTEST_MAX.twk;
  const tiu = set?.tiu_count != null ? set.tiu_count * 5 : SUBTEST_MAX.tiu;
  const tkp = set?.tkp_count != null ? set.tkp_count * 5 : SUBTEST_MAX.tkp;
  return { twk, tiu, tkp, total: twk + tiu + tkp };
}

/** Skala ambang skor set penuh (dari 550) ke total maksimal set lain. */
const scaleFromFull = (score: number, maxTotal: number) =>
  Math.round((score / SCORING.MAX_SCORE_TOTAL) * maxTotal);

export const SUBTEST_LABEL: Record<TryoutSubtest, string> = {
  twk: "TWK",
  tiu: "TIU",
  tkp: "TKP",
};

export type SubtestGap = {
  subtest: TryoutSubtest;
  score: number;
  passing: number;
  max: number;
  passed: boolean;
  /** Poin yang masih kurang (0 jika lulus). */
  pointsNeeded: number;
  /** Perkiraan jumlah soal tambahan yang harus benar / ditingkatkan. */
  questionsNeeded: number;
  /** Poin di atas passing grade (0 jika belum lulus). */
  margin: number;
};

export function subtestGaps(
  attempt: Pick<TryoutAttempt, "score_twk" | "score_tiu" | "score_tkp">,
  examSet: Pick<TryoutExamSet, "passing_grade_twk" | "passing_grade_tiu" | "passing_grade_tkp"> &
    CompositionLike,
): SubtestGap[] {
  const maxes = maxScoresOf(examSet);
  const rows: Array<[TryoutSubtest, number, number]> = [
    ["twk", attempt.score_twk, examSet.passing_grade_twk],
    ["tiu", attempt.score_tiu, examSet.passing_grade_tiu],
    ["tkp", attempt.score_tkp, examSet.passing_grade_tkp],
  ];
  return rows.map(([subtest, score, passing]) => {
    const pointsNeeded = Math.max(0, passing - score);
    // TWK/TIU: +5 per soal benar. TKP: naik maks 4 poin per soal (1 → 5),
    // realistis ±2 poin per soal (3 → 5).
    const perQuestion = subtest === "tkp" ? 2 : 5;
    return {
      subtest,
      score,
      passing,
      max: maxes[subtest],
      passed: score >= passing,
      pointsNeeded,
      questionsNeeded: Math.ceil(pointsNeeded / perQuestion),
      margin: Math.max(0, score - passing),
    };
  });
}

export type Readiness = {
  level: "elite" | "competitive" | "passed" | "close" | "practice";
  label: string;
  description: string;
};

/**
 * Tingkat kesiapan. Lulus passing grade belum tentu lolos formasi: peringkat
 * ditentukan total skor, jadi ambang "kompetitif" dipakai sebagai target.
 */
export function readiness(
  attempt: Pick<TryoutAttempt, "score_total" | "pass_overall">,
  gaps: SubtestGap[],
): Readiness {
  const totalGap = gaps.reduce((s, g) => s + g.pointsNeeded, 0);
  // Ambang set penuh (450 / 400 dari 550; "hampir" ≤ 25 poin) diskalakan ke
  // total maksimal set ini, supaya set mini dinilai adil.
  const maxTotal = gaps.reduce((s, g) => s + g.max, 0) || SCORING.MAX_SCORE_TOTAL;
  const elite = scaleFromFull(450, maxTotal);
  const competitive = scaleFromFull(400, maxTotal);
  const closeGap = Math.max(5, scaleFromFull(25, maxTotal));
  if (attempt.pass_overall && attempt.score_total >= elite) {
    return {
      level: "elite",
      label: "Sangat Kompetitif",
      description: "Skor kamu setara peserta papan atas. Pertahankan konsistensi dan kecepatan.",
    };
  }
  if (attempt.pass_overall && attempt.score_total >= competitive) {
    return {
      level: "competitive",
      label: "Kompetitif",
      description: `Lulus passing grade dengan total skor yang bersaing. Kejar ${elite}+ untuk formasi favorit.`,
    };
  }
  if (attempt.pass_overall) {
    return {
      level: "passed",
      label: "Lulus Passing Grade",
      description: `Kamu lolos ambang batas. Persaingan formasi ditentukan total skor — target berikutnya ${competitive}+.`,
    };
  }
  if (totalGap <= closeGap) {
    return {
      level: "close",
      label: "Hampir Lulus",
      description: `Tinggal ${totalGap} poin lagi untuk lolos semua passing grade. Fokus pada subtes yang kurang.`,
    };
  }
  return {
    level: "practice",
    label: "Perlu Latihan Terarah",
    description: `Masih kurang ${totalGap} poin dari passing grade. Ikuti rekomendasi belajar di bawah secara bertahap.`,
  };
}

export type CategoryPerformance = {
  subtest: TryoutSubtest;
  category: string;
  /** 0–100 */
  percent: number;
  /** Untuk TWK/TIU: jumlah benar; TKP: skor diperoleh. */
  value: number;
  /** Untuk TWK/TIU: jumlah soal; TKP: skor maksimal. */
  max: number;
  total: number;
};

export function categoryPerformance(stats: TryoutAttemptStats): CategoryPerformance[] {
  const out: CategoryPerformance[] = [];
  for (const subtest of ["twk", "tiu"] as const) {
    const byCat = stats[subtest]?.by_category || {};
    for (const [category, b] of Object.entries(byCat)) {
      if (!b.total) continue;
      out.push({
        subtest,
        category,
        percent: Math.round((b.correct / b.total) * 100),
        value: b.correct,
        max: b.total,
        total: b.total,
      });
    }
  }
  const tkpCat = stats.tkp?.by_category || {};
  for (const [category, b] of Object.entries(tkpCat)) {
    if (!b.total) continue;
    const max = b.max ?? b.total * 5;
    out.push({
      subtest: "tkp",
      category,
      percent: Math.round((b.score / max) * 100),
      value: b.score,
      max,
      total: b.total,
    });
  }
  return out;
}

/** Kategori terlemah (minimal 2 soal agar tidak bias), urut dari terendah. */
export function weakestCategories(stats: TryoutAttemptStats, limit = 4): CategoryPerformance[] {
  return categoryPerformance(stats)
    .filter((c) => c.total >= 2 && c.percent < (c.subtest === "tkp" ? 85 : 70))
    .sort((a, b) => a.percent - b.percent)
    .slice(0, limit);
}

export function strongestCategories(stats: TryoutAttemptStats, limit = 3): CategoryPerformance[] {
  return categoryPerformance(stats)
    .filter((c) => c.total >= 2 && c.percent >= (c.subtest === "tkp" ? 85 : 75))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, limit);
}

/** Tips belajar per kategori (dicocokkan lewat kata kunci, case-insensitive). */
const CATEGORY_TIPS: Array<[RegExp, string]> = [
  [
    /pancasila|pilar/i,
    "Hafalkan butir-butir pengamalan tiap sila (Tap MPR No. I/MPR/2003) dan sejarah perumusan Pancasila (BPUPKI, Piagam Jakarta, PPKI).",
  ],
  [
    /uud|konstitusi|amandemen/i,
    "Pelajari pasal kunci UUD NRI 1945 hasil amandemen: lembaga negara (Pasal 2–24C), HAM (Pasal 28A–28J), dan perubahan tiap amandemen.",
  ],
  [
    /nasionalisme|sejarah|peristiwa/i,
    "Ulang tonggak sejarah kebangsaan: Budi Utomo 1908, Sumpah Pemuda 1928, Proklamasi 1945, serta nilai yang terkandung di dalamnya.",
  ],
  [
    /bela negara/i,
    "Kuasai 5 nilai dasar bela negara (UU 3/2002 & UU 23/2019) dan contoh penerapannya dalam kehidupan ASN.",
  ],
  [
    /integritas/i,
    "Latih soal studi kasus integritas: konflik kepentingan, gratifikasi, dan kejujuran dalam jabatan publik.",
  ],
  [
    /bahasa/i,
    "Perkuat EYD V: penulisan kata baku, tanda baca, kalimat efektif, serta kedudukan bahasa Indonesia (UU 24/2009).",
  ],
  [
    /nkri|bhinneka/i,
    "Pahami konsep wawasan nusantara, otonomi daerah, dan makna Bhinneka Tunggal Ika dalam menjaga persatuan.",
  ],
  [
    /analogi|sinonim|antonim|verbal/i,
    "Biasakan membuat kalimat penghubung pada soal analogi, dan perbanyak kosakata baku KBBI untuk sinonim/antonim.",
  ],
  [
    /silogisme|logis|logika/i,
    "Gunakan pola premis (Semua A adalah B…) dan diagram Venn; hindari menyimpulkan di luar premis.",
  ],
  [
    /analitis/i,
    "Tuliskan informasi soal analitis ke tabel/urutan posisi sebelum menjawab agar tidak terkecoh.",
  ],
  [
    /deret/i,
    "Cek pola selisih bertingkat, perkalian, dan deret loncat (suku ganjil/genap terpisah).",
  ],
  [
    /berhitung|numerik|hitung/i,
    "Latih hitung cepat: pecahan ↔ desimal ↔ persen, perkalian bersusun, dan estimasi untuk mengeliminasi opsi.",
  ],
  [
    /perbandingan/i,
    "Untuk perbandingan kuantitatif, sederhanakan kedua besaran ke bentuk yang sama sebelum membandingkan.",
  ],
  [
    /cerita/i,
    "Ubah soal cerita ke persamaan; kuasai topik kecepatan-jarak-waktu, untung-rugi, dan pekerjaan bersama.",
  ],
  [
    /figural|pola|gambar/i,
    "Amati perubahan posisi, rotasi, jumlah, dan arsiran secara terpisah — satu atribut per langkah.",
  ],
  [
    /pelayanan/i,
    "Pada pelayanan publik, pilih sikap yang ramah, cepat, sesuai SOP, dan tetap mengutamakan kepentingan masyarakat.",
  ],
  [
    /jejaring/i,
    "Jejaring kerja: utamakan kolaborasi, membangun relasi lintas unit, dan komunikasi yang saling menguntungkan.",
  ],
  [
    /sosial budaya/i,
    "Sosial budaya: tunjukkan sikap terbuka terhadap perbedaan, adaptif, dan menghargai keberagaman.",
  ],
  [
    /teknologi|tik/i,
    "TIK: pilih sikap yang mau belajar teknologi baru dan memanfaatkannya untuk efisiensi kerja.",
  ],
  [
    /profesionalisme/i,
    "Profesionalisme: tanggung jawab penuh, menyelesaikan tugas tepat waktu, dan terus mengembangkan diri.",
  ],
  [
    /radikalisme/i,
    "Anti radikalisme: pilih sikap yang menjaga persatuan, menolak kekerasan, dan melaporkan lewat jalur resmi.",
  ],
];

export function tipForCategory(category: string, subtest: TryoutSubtest): string {
  const hit = CATEGORY_TIPS.find(([re]) => re.test(category));
  if (hit) return hit[1];
  if (subtest === "tkp")
    return "Pada TKP, pilih jawaban yang paling proaktif, solutif, dan berorientasi pada kepentingan publik.";
  if (subtest === "tiu")
    return "Latih kecepatan: targetkan maksimal 1 menit per soal TIU dan lewati soal yang terlalu lama.";
  return "Ulangi materi dasar wawasan kebangsaan dan kerjakan latihan soal per kategori.";
}

/**
 * Slug modul /belajar-skd yang paling relevan untuk subtes/kategori lemah.
 * Sengaja tidak mengimpor `skd-modules.ts` agar isi modul tidak ikut ke bundle halaman hasil.
 */
export function skdModuleSlugFor(subtest: TryoutSubtest, category?: string): string {
  if (subtest === "twk") return "materi-twk";
  if (subtest === "tkp") return "tkp-cara-menjawab";
  const c = category ?? "";
  if (/figural|pola|gambar/i.test(c)) return "tiu-figural";
  if (/analogi|silogisme|analitis|verbal|logika/i.test(c)) return "tiu-verbal";
  return "tiu-numerik";
}

export type Recommendation = {
  title: string;
  detail: string;
  tone: "danger" | "warning" | "info" | "success";
  /** Modul belajar SKD yang relevan (slug di /belajar-skd/$slug). */
  moduleSlug?: string;
};

export function buildRecommendations(params: {
  attempt: Pick<TryoutAttempt, "score_total" | "pass_overall" | "duration_seconds">;
  examSet: Pick<TryoutExamSet, "duration_minutes">;
  stats: TryoutAttemptStats;
  gaps: SubtestGap[];
}): Recommendation[] {
  const { attempt, examSet, stats, gaps } = params;
  const recs: Recommendation[] = [];

  for (const g of gaps.filter((x) => !x.passed)) {
    recs.push({
      tone: "danger",
      title: `Prioritas: ${SUBTEST_LABEL[g.subtest]} kurang ${g.pointsNeeded} poin`,
      detail:
        g.subtest === "tkp"
          ? `Naikkan sekitar ${g.questionsNeeded} jawaban TKP ke opsi skor tertinggi. Pelajari pola jawaban ideal di pembahasan.`
          : `Butuh ±${g.questionsNeeded} jawaban benar tambahan di ${SUBTEST_LABEL[g.subtest]} untuk lolos passing grade ${g.passing}.`,
      moduleSlug: skdModuleSlugFor(g.subtest),
    });
  }

  for (const w of weakestCategories(stats, 3)) {
    recs.push({
      tone: "warning",
      title: `${SUBTEST_LABEL[w.subtest]} · ${w.category} (${w.percent}%)`,
      detail: tipForCategory(w.category, w.subtest),
      moduleSlug: skdModuleSlugFor(w.subtest, w.category),
    });
  }

  const emptyBinary = (stats.twk?.empty ?? 0) + (stats.tiu?.empty ?? 0);
  if (emptyBinary > 0) {
    recs.push({
      tone: "info",
      title: `${emptyBinary} soal TWK/TIU dibiarkan kosong`,
      detail:
        "SKD tidak memakai nilai minus — soal kosong pasti 0. Selalu isi semua jawaban, minimal dengan tebakan terbaik di menit terakhir.",
    });
  }

  const usedRatio = (attempt.duration_seconds ?? 0) / Math.max(1, examSet.duration_minutes * 60);
  const totalEmpty = emptyBinary + (stats.tkp?.empty ?? 0);
  if (usedRatio >= 0.98 && totalEmpty >= 5) {
    recs.push({
      tone: "info",
      title: "Manajemen waktu",
      detail:
        "Waktu habis sebelum semua soal terjawab. Kerjakan TKP lebih dulu (cepat & pasti dapat poin), lalu TWK, dan sisakan TIU hitungan di akhir.",
      moduleSlug: "manajemen-waktu-hari-h",
    });
  } else if (usedRatio < 0.5 && !attempt.pass_overall) {
    recs.push({
      tone: "info",
      title: "Gunakan sisa waktu",
      detail:
        "Kamu selesai jauh sebelum waktu habis. Manfaatkan sisa waktu untuk memeriksa ulang soal yang ditandai ragu.",
    });
  }

  const flagged = (stats.twk?.flagged ?? 0) + (stats.tiu?.flagged ?? 0);
  const flaggedCorrect = (stats.twk?.flagged_correct ?? 0) + (stats.tiu?.flagged_correct ?? 0);
  if (flagged >= 3) {
    const pct = Math.round((flaggedCorrect / flagged) * 100);
    recs.push({
      tone: pct >= 50 ? "success" : "info",
      title: `Soal ragu: ${flaggedCorrect}/${flagged} benar (${pct}%)`,
      detail:
        pct >= 50
          ? "Insting kamu cukup baik pada soal yang diragukan — percaya pada analisis pertama dan jangan terlalu sering mengganti jawaban."
          : "Sebagian besar soal ragu masih salah. Tandai materinya dan pelajari ulang lewat pembahasan.",
    });
  }

  if (attempt.pass_overall && recs.length === 0) {
    recs.push({
      tone: "success",
      title: "Pertahankan performa",
      detail:
        "Semua subtes lolos. Ulangi tryout dengan set berbeda untuk menjaga konsistensi dan menaikkan total skor.",
    });
  }

  return recs.slice(0, 6);
}

export const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Mudah",
  medium: "Sedang",
  hard: "Sulit",
};
