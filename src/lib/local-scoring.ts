/**
 * Local/Heuristic ATS Scoring — tanpa AI, instant
 * Digunakan sebagai fallback cepat atau preview skor real-time.
 * Breakdown keys diselaraskan dengan AI scoring: relevance, skills_match, experience, format, keywords
 *
 * Prinsip:
 * - Bukti diambil dari ISI CV (ringkasan, judul & bullet pengalaman), bukan dari field yang
 *   sedang dicocokkan. Mis. skill tidak dihitung "muncul di CV" hanya karena ada di daftar
 *   skill, dan target posisi tidak dihitung cocok hanya karena sama dengan headline.
 * - Kualitas pengalaman dinilai per bullet (kata kerja aksi di awal, angka/metrik, panjang).
 * - Keyword stuffing (skill terlalu banyak, kata diulang berlebihan) diberi penalti.
 */
import type { CvData } from "@/lib/cv-types";

export interface ScoreResult {
  overallScore: number;
  breakdown: {
    relevance: number;
    skills_match: number;
    experience: number;
    format: number;
    keywords: number;
  };
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

// ─── Kamus ───────────────────────────────────────────────────────────────────

const EN_ACTION_VERBS = new Set([
  "achieved",
  "analyzed",
  "architected",
  "automated",
  "built",
  "collaborated",
  "coordinated",
  "created",
  "delivered",
  "designed",
  "developed",
  "drove",
  "enhanced",
  "established",
  "executed",
  "generated",
  "grew",
  "implemented",
  "improved",
  "increased",
  "initiated",
  "launched",
  "led",
  "managed",
  "mentored",
  "migrated",
  "negotiated",
  "optimized",
  "organized",
  "owned",
  "planned",
  "produced",
  "reduced",
  "redesigned",
  "resolved",
  "scaled",
  "shipped",
  "simplified",
  "spearheaded",
  "streamlined",
  "supervised",
  "tested",
  "trained",
  "transformed",
  "wrote",
]);

/** Kata pembuka yang lemah / pasif — bukan kata kerja aksi. */
const WEAK_OPENERS = new Set([
  "bertanggung",
  "membantu",
  "mengerjakan",
  "melakukan",
  "responsible",
  "helped",
  "assisted",
  "worked",
  "involved",
  "tasked",
  "duties",
]);

const STOPWORDS = new Set([
  // id
  "dan",
  "atau",
  "yang",
  "untuk",
  "dengan",
  "dari",
  "pada",
  "dalam",
  "ke",
  "di",
  "sebagai",
  "serta",
  "agar",
  "oleh",
  "para",
  "ini",
  "itu",
  "juga",
  "lebih",
  "secara",
  "telah",
  "akan",
  "bagi",
  "hingga",
  "antar",
  "tim",
  "kerja",
  // en
  "and",
  "or",
  "the",
  "for",
  "with",
  "from",
  "into",
  "onto",
  "of",
  "to",
  "in",
  "on",
  "at",
  "as",
  "by",
  "an",
  "a",
  "is",
  "are",
  "was",
  "were",
  "be",
  "this",
  "that",
  "team",
  "work",
  "senior",
  "junior",
  "staff",
  "lead",
  "head",
]);

/** Angka yang bermakna: persen, mata uang, jumlah + satuan, atau bilangan ≥ 2 digit (bukan tahun). */
const METRIC_REGEX =
  /(\d+([.,]\d+)?\s*(%|persen|x\b|kali|juta|jt|miliar|m\b|ribu|rb|k\b|orang|klien|client|clients|user|users|pengguna|proyek|project|projects|tim|team|jam|hours|hari|days|minggu|weeks|bulan|months|ms|detik|seconds|transaksi|transactions|request|requests|kueri|query|queries|outlet|cabang|toko|produk|products))|(rp\.?\s?\d)|(\$\s?\d)|(\b(?!(19|20)\d{2}\b)\d{2,}\b)/i;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+(\.[^\s@]+)*$/;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function asText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string").join("\n");
  return "";
}

/** Pecah deskripsi jadi bullet: per baris, buang penanda bullet di awal. */
function toBullets(description: unknown): string[] {
  return asText(description)
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*([•●▪◦*\-–—]|\d+[.)])\s*/, "").trim())
    .filter((line) => line.length >= 15);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

function firstWord(bullet: string): string {
  return (bullet.toLowerCase().match(/[a-z]+/) || [""])[0];
}

/** Kata kerja aksi di awal bullet: me-/mem-/men-/meng-/meny- (ID) atau kata kerja lampau (EN). */
function startsWithActionVerb(bullet: string): boolean {
  const word = firstWord(bullet);
  if (!word || WEAK_OPENERS.has(word)) return false;
  if (EN_ACTION_VERBS.has(word)) return true;
  if (/^me(m|n|ng|ny)?[a-z]{3,}$/.test(word)) return true; // memimpin, mengembangkan, menyusun
  return /^[a-z]{4,}ed$/.test(word); // EN past tense lain (deployed, refactored)
}

/** Cocokkan nama skill sebagai frasa utuh (bukan substring: "Go" ≠ "good"). */
function mentions(text: string, phrase: string): boolean {
  const p = phrase.trim().toLowerCase();
  if (p.length < 2) return false;
  const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i").test(text);
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

// ─── Scoring ─────────────────────────────────────────────────────────────────

export function scoreCvLocally(data: CvData, targetRole?: string): ScoreResult {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];

  const personal = data.personal || ({} as CvData["personal"]);
  const experiences = data.experiences || [];
  const internships = data.internships || [];
  const organizations = data.organizations || [];
  const educations = data.educations || [];
  const skills = (data.skills || []).filter((s) => s?.name?.trim());
  const summary = asText(personal.summary).trim();

  // Peran yang dinilai sebagai "pengalaman": kerja + magang (organisasi sebagai pelengkap)
  const roles = [...experiences, ...internships];
  const roleBullets = roles.map((r) => toBullets(r.description));
  const bullets = roleBullets.flat();
  const orgBullets = organizations.flatMap((o) => toBullets(o.description));

  /** Bukti isi CV — sengaja TANPA headline & daftar skill (hindari mencocokkan diri sendiri). */
  const evidenceText = [
    summary,
    ...roles.map((r) => r.position || ""),
    ...bullets,
    ...orgBullets,
    ...educations.map((e) => asText(e.description)),
  ]
    .join("\n")
    .toLowerCase();
  const evidenceTokens = tokenize(evidenceText);
  /** Nilai dasar (netral / bebas stuffing) hanya diberikan kalau CV sudah berisi. */
  const hasContent = evidenceTokens.length >= 10;

  // ===== 1. FORMAT (0-100) — kelengkapan & keterbacaan struktur =====
  let format = 0;
  const contactMissing: string[] = [];
  if (personal.fullName?.trim()) format += 8;
  else contactMissing.push("nama");
  if (personal.email && EMAIL_REGEX.test(personal.email)) format += 8;
  else contactMissing.push(personal.email ? "email valid" : "email");
  if (personal.phone?.trim()) format += 8;
  else contactMissing.push("nomor HP");
  if (personal.location?.trim()) format += 6;
  else contactMissing.push("lokasi");
  if (personal.linkedin?.trim() || personal.website?.trim()) format += 5;
  else suggestions.push("Tambahkan link LinkedIn atau portfolio");
  if (contactMissing.length) weaknesses.push(`Kontak belum lengkap: ${contactMissing.join(", ")}`);

  if (personal.headline?.trim()) format += 5;
  else suggestions.push("Isi headline/posisi di bawah nama agar rekruter langsung paham peranmu");

  if (summary.length >= 200 && summary.length <= 800) {
    format += 20;
  } else if (summary.length >= 80) {
    format += 10;
    if (summary.length > 800)
      suggestions.push("Ringkas ringkasan profil jadi 3-5 kalimat (maks. ±800 karakter)");
    else suggestions.push("Perkuat ringkasan profil jadi 3-5 kalimat (±200-800 karakter)");
  } else {
    weaknesses.push(summary ? "Ringkasan profil terlalu pendek" : "Belum ada ringkasan profil");
  }

  if (roles.length > 0) {
    const complete = roles.filter(
      (r) => r.position?.trim() && r.company?.trim() && r.startDate?.trim(),
    );
    format += (complete.length / roles.length) * 15;
    if (complete.length < roles.length) {
      weaknesses.push(
        `${roles.length - complete.length} pengalaman belum lengkap (posisi, perusahaan, atau tanggal mulai)`,
      );
    }
  } else {
    weaknesses.push("Belum ada pengalaman kerja atau magang");
  }

  if (educations.some((e) => e.school?.trim() && e.degree?.trim())) format += 10;
  else weaknesses.push("Belum ada data pendidikan yang lengkap");

  if (skills.length >= 5 && skills.length <= 25) format += 10;
  else if (skills.length > 0) format += 5;

  if ((data.languages?.length || 0) > 0 || (data.certificates?.length || 0) > 0) format += 5;

  if (
    personal.fullName &&
    personal.email &&
    personal.phone &&
    summary &&
    roles.length &&
    educations.length &&
    skills.length
  ) {
    strengths.push("Struktur CV lengkap: kontak, ringkasan, pengalaman, pendidikan, skill");
  }

  // ===== 2. EXPERIENCE (0-100) — kualitas bullet pengalaman =====
  let experience = 0;
  if (bullets.length > 0) {
    const actionCount = bullets.filter(startsWithActionVerb).length;
    const metricCount = bullets.filter((b) => METRIC_REGEX.test(b)).length;
    const goodLength = bullets.filter((b) => b.length >= 50 && b.length <= 260).length;
    const actionRatio = actionCount / bullets.length;
    const metricRatio = metricCount / bullets.length;

    // Jumlah bullet per peran: ideal 3-6
    const perRole = roleBullets.filter((b) => b.length > 0);
    const avgPerRole = perRole.length ? bullets.length / perRole.length : 0;
    if (avgPerRole >= 3 && avgPerRole <= 6) experience += 20;
    else if (avgPerRole > 6) {
      experience += 12;
      suggestions.push("Pilih 3-6 bullet terkuat per pengalaman agar mudah dipindai");
    } else {
      experience += 10;
      suggestions.push("Tulis 3-6 bullet pencapaian untuk setiap pengalaman");
    }

    experience += actionRatio * 35;
    // Setengah bullet berisi angka sudah dianggap maksimal
    experience += Math.min(1, metricRatio / 0.5) * 35;
    experience += (goodLength / bullets.length) * 10;

    if (actionRatio >= 0.7) strengths.push("Bullet pengalaman diawali kata kerja aksi");
    else {
      suggestions.push(
        `${bullets.length - actionCount} dari ${bullets.length} bullet belum diawali kata kerja aksi (mis. Memimpin, Mengembangkan, Meningkatkan)`,
      );
    }

    if (metricRatio >= 0.5) strengths.push("Banyak pencapaian sudah terukur dengan angka");
    else if (metricCount === 0) weaknesses.push("Belum ada pencapaian dengan angka/metrik");
    else {
      suggestions.push(
        `${bullets.length - metricCount} dari ${bullets.length} bullet belum ada angka — tambahkan %, jumlah, waktu, atau nilai Rp`,
      );
    }

    const tooLong = bullets.filter((b) => b.length > 260).length;
    if (tooLong > 0) suggestions.push(`${tooLong} bullet terlalu panjang — pecah jadi 1-2 baris`);
  } else if (roles.length > 0) {
    weaknesses.push("Pengalaman belum berisi deskripsi/bullet pencapaian");
  }

  // ===== 3. RELEVANCE (0-100) — kecocokan isi CV dengan target posisi =====
  let relevance: number;
  const roleTokens = [...new Set(tokenize(targetRole || ""))];
  if (roleTokens.length > 0) {
    const covered = roleTokens.filter((t) => evidenceTokens.includes(t));
    const coverage = covered.length / roleTokens.length;
    relevance = coverage * 60;

    const latestTitle = tokenize(roles[0]?.position || "");
    if (roleTokens.some((t) => latestTitle.includes(t))) relevance += 25;
    if (roleTokens.some((t) => tokenize(summary).includes(t))) relevance += 15;

    if (coverage >= 0.75) strengths.push(`Isi CV sudah selaras dengan posisi "${targetRole}"`);
    else {
      const missing = roleTokens.filter((t) => !covered.includes(t));
      suggestions.push(
        `Tunjukkan pengalaman yang relevan dengan "${targetRole}" di ringkasan/bullet (belum muncul: ${missing.join(", ")})`,
      );
    }
  } else {
    relevance = hasContent ? 60 : 0;
    suggestions.push("Isi target posisi agar skor relevansi & keyword lebih akurat");
  }

  // ===== 4. SKILLS_MATCH (0-100) — jumlah wajar & terbukti di pengalaman =====
  let skillsMatch = 0;
  const uniqueSkillNames = [...new Set(skills.map((s) => s.name.trim().toLowerCase()))];
  const duplicates = skills.length - uniqueSkillNames.length;

  if (uniqueSkillNames.length === 0) {
    weaknesses.push("Belum ada daftar keahlian");
  } else {
    const n = uniqueSkillNames.length;
    if (n >= 6 && n <= 20) skillsMatch += 40;
    else if (n >= 3 && n < 6) {
      skillsMatch += 25;
      suggestions.push("Tambahkan skill hingga ±6-20 yang paling relevan");
    } else if (n > 20 && n <= 30) {
      skillsMatch += 30;
      suggestions.push(`Ada ${n} skill — pangkas ke ±20 yang paling relevan dengan posisi`);
    } else if (n > 30) {
      skillsMatch += 18;
      weaknesses.push(
        `${n} skill terlalu banyak, terlihat seperti keyword stuffing — pilih ±20 terkuat`,
      );
    } else skillsMatch += 12;

    const proven = uniqueSkillNames.filter((s) => mentions(evidenceText, s));
    const provenRatio = proven.length / n;
    skillsMatch += Math.min(1, provenRatio / 0.6) * 40;

    const inSummary = uniqueSkillNames.filter((s) => mentions(summary.toLowerCase(), s)).length;
    skillsMatch += inSummary >= 2 ? 20 : inSummary === 1 ? 10 : 0;

    if (provenRatio >= 0.6) strengths.push("Sebagian besar skill terbukti di pengalaman kerja");
    else {
      suggestions.push(
        `Baru ${proven.length} dari ${n} skill disebut di pengalaman — tunjukkan skill utama dipakai di bullet mana`,
      );
    }
    if (duplicates > 0) {
      skillsMatch -= 10;
      weaknesses.push(`${duplicates} skill tercantum ganda`);
    }
  }

  // ===== 5. KEYWORDS (0-100) — keyword tersebar wajar di isi CV =====
  let keywords = 0;
  const bulletText = bullets.join("\n").toLowerCase();

  if (roleTokens.length > 0) {
    const inBullets = roleTokens.filter((t) => tokenize(bulletText).includes(t)).length;
    keywords += (inBullets / roleTokens.length) * 40;
  } else if (hasContent) {
    keywords += 20;
  }

  const skillsInBullets = uniqueSkillNames.filter((s) => mentions(bulletText, s)).length;
  keywords += skillsInBullets >= 5 ? 30 : skillsInBullets >= 3 ? 20 : skillsInBullets >= 1 ? 10 : 0;

  const hardInSummary = uniqueSkillNames.filter((s) => mentions(summary.toLowerCase(), s)).length;
  keywords += hardInSummary >= 3 ? 15 : hardInSummary >= 1 ? 8 : 0;

  // Stuffing: satu kata mendominasi teks
  const freq = new Map<string, number>();
  for (const t of evidenceTokens) freq.set(t, (freq.get(t) || 0) + 1);
  const [topWord, topCount] = [...freq.entries()].sort((a, b) => b[1] - a[1])[0] || ["", 0];
  const stuffed = topCount >= 8 && topCount / Math.max(1, evidenceTokens.length) > 0.05;
  if (stuffed)
    weaknesses.push(
      `Kata "${topWord}" diulang ${topCount}x — variasikan agar tidak terkesan keyword stuffing`,
    );
  else if (hasContent) keywords += 15;

  if (skillsInBullets >= 5 && !stuffed)
    strengths.push("Keyword skill tersebar alami di pengalaman");

  // ===== Weighted Total =====
  // experience: 30%, format: 20%, keywords: 20%, relevance: 15%, skills_match: 15%
  const breakdown = {
    relevance: clamp(relevance),
    skills_match: clamp(skillsMatch),
    experience: clamp(experience),
    format: clamp(format),
    keywords: clamp(keywords),
  };
  const overallScore = clamp(
    breakdown.experience * 0.3 +
      breakdown.format * 0.2 +
      breakdown.keywords * 0.2 +
      breakdown.relevance * 0.15 +
      breakdown.skills_match * 0.15,
  );

  return {
    overallScore,
    breakdown,
    strengths: [...new Set(strengths)].slice(0, 5),
    weaknesses: [...new Set(weaknesses)].slice(0, 5),
    suggestions: [...new Set(suggestions)].slice(0, 5),
  };
}
