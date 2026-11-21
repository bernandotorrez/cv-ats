/**
 * Logika checklist "Panduan CV Bagus" di editor CV.
 *
 * Murni dan deterministik: status tiap langkah dihitung dari isi CV (tanpa AI, tanpa jaringan),
 * jadi bisa dipanggil di setiap render. Aturan kualitas (panjang ringkasan, jumlah skill,
 * bullet berkata kerja + angka) sengaja diselaraskan dengan `local-scoring.ts` supaya saran
 * panduan dan skor ATS tidak saling bertentangan.
 */
import type { CvData } from "@/lib/cv-types";
import {
  EMAIL_REGEX,
  METRIC_REGEX,
  asText,
  startsWithActionVerb,
  toBullets,
} from "@/lib/local-scoring";

export type GuideItemId =
  | "target"
  | "contact"
  | "headline"
  | "summary"
  | "education"
  | "experience"
  | "impact"
  | "skills"
  | "languages"
  | "certificate"
  | "ats";

export const GUIDE_GROUPS = ["Dasar", "Isi utama", "Pelengkap", "Finishing"] as const;

export interface GuideItem {
  id: GuideItemId;
  /** Indeks di GUIDE_GROUPS. */
  group: number;
  title: string;
  hint: string;
  example: string;
  /** Estimasi menit untuk menyelesaikan langkah ini. */
  minutes: number;
  /** Langkah opsional tidak dihitung ke progres. */
  optional?: boolean;
  /** Section editor tujuan. `null` = field "Target posisi" di atas daftar section. */
  sectionId: string | null;
  /** Kunci `data-guide-field`; field kosong pertama yang cocok akan difokuskan. */
  fields: string[];
}

export interface GuideItemResult extends GuideItem {
  done: boolean;
  /** Sudah dimulai tetapi belum memenuhi kriteria. */
  partial: boolean;
  /** Keterangan status singkat, mis. "3/5 keahlian". */
  meta: string;
  /** Meta berisi peringatan (ditampilkan dengan warna peringatan). */
  warn: boolean;
}

export interface GuideState {
  items: GuideItemResult[];
  /** Hanya item wajib. */
  doneCount: number;
  total: number;
  percent: number;
  remainingMinutes: number;
  /** Langkah wajib pertama yang belum selesai; `null` bila semua selesai. */
  next: GuideItemResult | null;
}

export const GUIDE_ITEMS: GuideItem[] = [
  {
    id: "target",
    group: 0,
    title: "Tentukan target posisi",
    hint: "Target posisi dipakai untuk menghitung skor ATS dan menyesuaikan saran AI. Tanpa target, kamu mendapat saran yang umum.",
    example: "Frontend Developer, Staff Akuntansi, Admin Marketplace",
    minutes: 1,
    sectionId: null,
    fields: ["target"],
  },
  {
    id: "contact",
    group: 0,
    title: "Lengkapi nama & kontak",
    hint: "Rekruter perlu menghubungimu dengan cepat. Pastikan nama, email aktif, nomor HP, dan lokasi terisi.",
    example: "Rina Kartika · rina@email.com · 0812 3456 7890 · Bandung",
    minutes: 1,
    sectionId: "personal",
    fields: ["personal.fullName", "personal.email", "personal.phone", "personal.location"],
  },
  {
    id: "headline",
    group: 0,
    title: "Tulis headline profesional",
    hint: "Headline adalah kalimat pertama yang dibaca rekruter, tepat di bawah namamu. Tulis posisi + 1–2 keahlian utama.",
    example: "Frontend Developer · React & TypeScript · 3 tahun pengalaman",
    minutes: 1,
    sectionId: "personal",
    fields: ["personal.headline"],
  },
  {
    id: "summary",
    group: 1,
    title: "Isi ringkasan profil",
    hint: "Ringkasan 3–5 kalimat yang merangkum siapa kamu, pengalaman utama, dan nilai yang kamu bawa. Ideal 200–800 karakter.",
    example:
      "Frontend Developer dengan 3 tahun pengalaman membangun aplikasi web yang cepat dan mudah diakses…",
    minutes: 2,
    sectionId: "personal",
    fields: ["personal.summary"],
  },
  {
    id: "education",
    group: 1,
    title: "Isi riwayat pendidikan",
    hint: "Cantumkan pendidikan terakhir: nama institusi dan jenjang/gelar. Fresh graduate boleh menaruhnya di atas pengalaman.",
    example: "Universitas Padjadjaran — S1 Teknik Informatika (2017–2021)",
    minutes: 2,
    sectionId: "education",
    fields: ["education.school", "education.degree"],
  },
  {
    id: "experience",
    group: 1,
    title: "Isi pengalaman kerja",
    hint: "Tambahkan minimal satu pengalaman (kerja atau magang) lengkap dengan posisi, perusahaan, dan tanggal mulai.",
    example: "Frontend Developer — PT Teknologi Nusantara (Jan 2022 – Sekarang)",
    minutes: 3,
    sectionId: "experience",
    fields: ["experience.position", "experience.company", "experience.startDate"],
  },
  {
    id: "impact",
    group: 1,
    title: "Tulis pencapaian dengan angka",
    hint: "Sistem ATS dan rekruter menyukai bukti. Tulis minimal 3 poin, awali dengan kata kerja aksi (memimpin, membangun, menurunkan), dan sertakan angka atau persen.",
    example: "Memimpin migrasi dashboard ke React sehingga waktu muat turun 40%",
    minutes: 3,
    sectionId: "experience",
    fields: ["experience.description"],
  },
  {
    id: "skills",
    group: 2,
    title: "Tambahkan 5+ keahlian",
    hint: "Daftar 5–25 keahlian yang relevan dengan target posisi. Gunakan istilah yang biasa muncul di lowongan.",
    example: "React, TypeScript, Next.js, Tailwind CSS, Figma",
    minutes: 2,
    sectionId: "skills",
    fields: ["skills.name"],
  },
  {
    id: "languages",
    group: 2,
    title: "Tambahkan bahasa",
    hint: "Cantumkan bahasa yang kamu kuasai beserta tingkatnya. Banyak lowongan mensyaratkan kemampuan bahasa Inggris.",
    example: "Indonesia (Native), Inggris (Fasih)",
    minutes: 1,
    sectionId: "languages",
    fields: ["languages.name"],
  },
  {
    id: "certificate",
    group: 2,
    title: "Sertifikat",
    optional: true,
    hint: "Opsional, tetapi menambah kredibilitas bila relevan dengan posisi yang kamu lamar.",
    example: "Meta Front-End Developer — Coursera (2023)",
    minutes: 1,
    sectionId: "certificate",
    fields: ["certificate.name"],
  },
  {
    id: "ats",
    group: 3,
    title: "Cek tampilan ATS",
    hint: "Lihat bagaimana mesin ATS membaca CV kamu sebagai teks polos. Pastikan semua informasi penting terbaca berurutan.",
    example: "Semua nama, tanggal, dan keahlian muncul sebagai teks biasa",
    minutes: 1,
    sectionId: "ats",
    fields: ["ats.view"],
  },
];

type Verdict = Pick<GuideItemResult, "done" | "partial" | "meta" | "warn">;
const v = (
  done: boolean,
  meta: string,
  opts: { partial?: boolean; warn?: boolean } = {},
): Verdict => ({
  done,
  meta,
  partial: !done && !!opts.partial,
  warn: !!opts.warn,
});

function evaluate(id: GuideItemId, data: CvData, targetRole: string, atsViewed: boolean): Verdict {
  const personal = data.personal ?? ({} as CvData["personal"]);
  // Pengalaman = kerja + magang, sama seperti local-scoring.
  const roles = [...(data.experiences ?? []), ...(data.internships ?? [])];

  switch (id) {
    case "target": {
      const t = targetRole.trim();
      return v(t.length >= 3, t || "Belum diisi");
    }
    case "contact": {
      const missing: string[] = [];
      if (!asText(personal.fullName).trim()) missing.push("nama");
      if (!EMAIL_REGEX.test(asText(personal.email).trim())) missing.push("email");
      if (!asText(personal.phone).trim()) missing.push("no. HP");
      if (!asText(personal.location).trim()) missing.push("lokasi");
      return missing.length
        ? v(false, `Kurang: ${missing.join(", ")}`, { partial: missing.length < 4, warn: true })
        : v(true, "Lengkap");
    }
    case "headline": {
      const n = asText(personal.headline).trim().length;
      if (n >= 10) return v(true, "Sudah baik");
      return n
        ? v(false, "Terlalu pendek, tambahkan keahlian utama", { partial: true, warn: true })
        : v(false, "Belum diisi");
    }
    case "summary": {
      const n = asText(personal.summary).trim().length;
      if (n >= 200 && n <= 800) return v(true, `${n} karakter`);
      if (n > 800)
        return v(false, `${n} karakter, ringkas hingga ±800`, { partial: true, warn: true });
      return n
        ? v(false, `${n}/200 karakter`, { partial: true, warn: true })
        : v(false, "Belum diisi");
    }
    case "education": {
      const list = data.educations ?? [];
      const ok = list.some((e) => e.school?.trim() && e.degree?.trim());
      if (ok) return v(true, `${list.length} riwayat`);
      return list.length
        ? v(false, "Institusi atau gelar belum terisi", { partial: true, warn: true })
        : v(false, "Belum ada");
    }
    case "experience": {
      const ok = roles.some((r) => r.position?.trim() && r.company?.trim() && r.startDate?.trim());
      if (ok) return v(true, `${roles.length} pengalaman`);
      return roles.length
        ? v(false, "Posisi, perusahaan, atau tanggal belum lengkap", { partial: true, warn: true })
        : v(false, "Belum ada");
    }
    case "impact": {
      const bullets = roles.flatMap((r) => toBullets(r.description));
      const action = bullets.filter(startsWithActionVerb).length;
      const metric = bullets.filter((b) => METRIC_REGEX.test(b)).length;
      const done = bullets.length >= 3 && action >= 3 && metric >= 2;
      if (done) return v(true, `${bullets.length} poin, ${metric} berangka`);
      return bullets.length
        ? v(false, `${bullets.length} poin · ${action} diawali kata kerja · ${metric} berangka`, {
            partial: true,
            warn: true,
          })
        : v(false, "Belum ada poin pencapaian");
    }
    case "skills": {
      const n = (data.skills ?? []).filter((s) => s?.name?.trim()).length;
      if (n >= 5 && n <= 25) return v(true, `${n} keahlian`);
      if (n > 25)
        return v(false, `${n} keahlian, terlalu banyak (maks. 25)`, { partial: true, warn: true });
      return n ? v(false, `${n}/5 keahlian`, { partial: true, warn: true }) : v(false, "Belum ada");
    }
    case "languages": {
      const n = (data.languages ?? []).filter((l) => l.name?.trim()).length;
      return n ? v(true, `${n} bahasa`) : v(false, "Belum ada");
    }
    case "certificate": {
      const n = (data.certificates ?? []).filter((c) => c.name?.trim()).length;
      return n ? v(true, `${n} sertifikat`) : v(false, "Belum ada, boleh dilewati");
    }
    case "ats":
      return atsViewed ? v(true, "Sudah dicek") : v(false, "Belum dibuka");
  }
}

export function evaluateCvGuide(data: CvData, targetRole: string, atsViewed: boolean): GuideState {
  const items: GuideItemResult[] = GUIDE_ITEMS.map((item) => ({
    ...item,
    ...evaluate(item.id, data, targetRole, atsViewed),
  }));
  const required = items.filter((i) => !i.optional);
  const doneCount = required.filter((i) => i.done).length;
  return {
    items,
    doneCount,
    total: required.length,
    percent: Math.round((doneCount / required.length) * 100),
    remainingMinutes: required.filter((i) => !i.done).reduce((sum, i) => sum + i.minutes, 0),
    next: required.find((i) => !i.done) ?? null,
  };
}

export function guideLevel(percent: number): string {
  if (percent >= 100) return "CV siap dikirim";
  if (percent >= 70) return "Hampir siap";
  if (percent >= 30) return "Sudah mulai terbentuk";
  return "Baru mulai";
}

/** Section editor yang dianggap "lengkap" bila semua langkah terkait selesai (untuk tanda centang di daftar section). */
export const GUIDE_SECTION_ITEMS: Record<string, GuideItemId[]> = {
  personal: ["contact", "headline", "summary"],
  education: ["education"],
  experience: ["experience", "impact"],
  skills: ["skills"],
  languages: ["languages"],
  ats: ["ats"],
};
