/**
 * Local/Heuristic ATS Scoring — tanpa AI, instant
 * Digunakan sebagai fallback cepat atau preview skor real-time.
 * Breakdown keys diselaraskan dengan AI scoring: relevance, skills_match, experience, format, keywords
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

const ACTION_VERBS = [
  "memimpin", "mengembangkan", "meningkatkan", "mengelola", "merancang",
  "mengoptimalkan", "membangun", "mengimplementasikan", "mengkoordinasi",
  "menganalisis", "menyusun", "menginisiasi", "menyelesaikan", "mencapai",
  "mengurangi", "menghasilkan", "mendapatkan", "memperoleh", "mendesain",
  "lead", "led", "develop", "developed", "improve", "improved", "manage",
  "managed", "design", "designed", "build", "built", "implement", "implemented",
  "optimize", "optimized", "coordinate", "coordinated", "analyze", "analyzed",
  "achieve", "achieved", "reduce", "reduced", "generate", "generated",
];

const METRIC_PATTERNS = [
  /\d+%/, /\d+\s*orang/, /\d+\s*orang tim/, /\d+\s*klien/,
  /\d+\s*juta/, /\d+\s*miliar/, /\d+\s*Rp/, /Rp\s*\d+/,
  /\d+\s*proyek/, /\d+\s*pengguna/, /\d+\s*user/,
  /\d+x/, /\d+\s*kali/, /meningkat.*\d+/, /menurun.*\d+/,
];

/** Validasi email — support subdomain (contoh: user+tag@domain.co.id) */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+(\.[^\s@]+)*$/;

export function scoreCvLocally(data: CvData, targetRole?: string): ScoreResult {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];

  // ===== 1. FORMAT (0-100) — struktur CV & info kontak =====
  let formatScore = 100;

  const hasPersonal = !!(data.personal.fullName && data.personal.email && data.personal.phone);
  const hasSummary = !!(data.personal.summary && data.personal.summary.length >= 100);
  const hasExperience = data.experiences.length > 0;
  const hasEducation = data.educations.length > 0;
  const hasSkills = data.skills.length > 0;
  const hasLanguages = data.languages.length > 0;
  const hasCertificates = data.certificates.length > 0;

  if (!hasPersonal) { formatScore -= 25; weaknesses.push("Informasi kontak tidak lengkap"); }
  if (!hasSummary) { formatScore -= 15; weaknesses.push("Ringkasan profil minimal 100 karakter"); }
  if (!hasExperience) { formatScore -= 15; weaknesses.push("Belum ada pengalaman kerja"); }
  if (!hasEducation) { formatScore -= 10; weaknesses.push("Belum ada data pendidikan"); }
  if (!hasSkills) { formatScore -= 10; weaknesses.push("Belum ada daftar keahlian"); }
  if (hasLanguages) { formatScore += 5; }
  if (hasCertificates) { formatScore += 5; }

  // Contact completeness (bagian dari format)
  if (!data.personal.fullName) formatScore -= 5;
  if (!data.personal.email) formatScore -= 5;
  else if (!EMAIL_REGEX.test(data.personal.email)) formatScore -= 5;
  if (!data.personal.phone) formatScore -= 5;
  if (!data.personal.location) formatScore -= 5;
  if (!data.personal.linkedin) formatScore -= 5;

  if (hasPersonal && hasSummary && hasExperience && hasEducation && hasSkills) {
    strengths.push("Struktur CV lengkap (kontak, ringkasan, pengalaman, pendidikan, skill)");
  }
  if (data.personal.linkedin) {
    strengths.push("Profil LinkedIn tercantum");
  }
  if (hasLanguages) {
    strengths.push("Mencantumkan kemampuan bahasa");
  }
  if (hasCertificates) {
    strengths.push("Mencantumkan sertifikasi");
  }

  formatScore = Math.max(0, Math.min(100, formatScore));

  // ===== 2. EXPERIENCE (0-100) — kualitas deskripsi pengalaman =====
  let experienceScore = 0;
  const allDescriptions: string[] = [];

  if (data.personal.summary && typeof data.personal.summary === "string") allDescriptions.push(data.personal.summary);
  for (const exp of data.experiences) {
    if (exp.description) {
      if (typeof exp.description === "string") allDescriptions.push(exp.description);
      else if (Array.isArray(exp.description)) allDescriptions.push(exp.description.join("\n"));
    }
  }
  for (const edu of data.educations) {
    if (edu.description) {
      if (typeof edu.description === "string") allDescriptions.push(edu.description);
      else if (Array.isArray(edu.description)) allDescriptions.push(edu.description.join("\n"));
    }
  }

  let totalActionVerbs = 0;
  let totalMetrics = 0;
  let totalPoints = 0;

  for (const desc of allDescriptions) {
    if (typeof desc !== "string") continue;
    const lower = desc.toLowerCase();
    for (const verb of ACTION_VERBS) {
      if (lower.includes(verb)) totalActionVerbs++;
    }
    for (const pattern of METRIC_PATTERNS) {
      if (pattern.test(lower)) totalMetrics++;
    }
    const points = desc.split(/\n|•|-|\*/).filter((p) => p.trim().length > 10);
    totalPoints += points.length;
  }

  // Summary quality
  if (data.personal.summary && data.personal.summary.length >= 100) {
    experienceScore += 20;
    strengths.push("Ringkasan profil cukup detail");
  } else if (data.personal.summary && data.personal.summary.length > 0) {
    experienceScore += 10;
    weaknesses.push("Ringkasan profil terlalu pendek (minimal 100 karakter)");
  }

  // Action verbs in experience
  if (totalActionVerbs >= 5) {
    experienceScore += 30;
    strengths.push("Menggunakan kata kerja aksi yang kuat");
  } else if (totalActionVerbs > 0) {
    experienceScore += 15;
    suggestions.push("Gunakan lebih banyak kata kerja aksi (memimpin, mengembangkan, meningkatkan)");
  } else if (data.experiences.length > 0) {
    weaknesses.push("Deskripsi pengalaman tidak menggunakan kata kerja aksi");
  }

  // Metrics
  if (totalMetrics >= 3) {
    experienceScore += 30;
    strengths.push("Mencantumkan metrik kuantitatif dalam pencapaian");
  } else if (totalMetrics > 0) {
    experienceScore += 15;
    suggestions.push("Tambahkan lebih banyak metrik/angka pada pencapaian");
  } else if (data.experiences.length > 0) {
    weaknesses.push("Kurang metrik kuantitatif — tambahkan angka, persentase, atau jumlah");
  }

  // Bullet points quantity
  if (totalPoints >= 8) {
    experienceScore += 20;
  } else if (totalPoints >= 4) {
    experienceScore += 10;
  }

  experienceScore = Math.max(0, Math.min(100, experienceScore));

  // ===== 3. RELEVANCE (0-100) — kecocokan dengan posisi target =====
  let relevanceScore = 0;

  const allText = [
    data.personal.summary || "",
    data.personal.headline || "",
    ...data.experiences.map((e) => `${e.position} ${e.company} ${e.description || ""}`),
    ...data.educations.map((e) => `${e.degree} ${e.school} ${e.field || ""} ${e.description || ""}`),
    ...data.skills.map((s) => s.name),
  ].join(" ").toLowerCase();

  if (targetRole && targetRole.trim().length > 0) {
    const positionWords = targetRole.toLowerCase().split(/\s+/);
    const matched = positionWords.filter((w) => w.length > 3 && allText.includes(w));
    relevanceScore += Math.min(matched.length * 20, 80);
    if (matched.length >= 3) {
      strengths.push(`Keyword posisi "${targetRole}" cocok dengan konten CV`);
    } else {
      suggestions.push(`Sesuaikan konten CV dengan keyword dari posisi "${targetRole}"`);
    }
  } else {
    // No target role — partial score based on headline/summary alignment
    relevanceScore = 50;
  }

  // Additional relevance: education & experience alignment
  if (data.experiences.length >= 2) relevanceScore += 10;
  if (data.educations.length > 0) relevanceScore += 10;

  relevanceScore = Math.max(0, Math.min(100, relevanceScore));

  // ===== 4. SKILLS_MATCH (0-100) — kecocokan & kelengkapan skill =====
  let skillsMatchScore = 0;

  const skillCount = data.skills.length;
  if (skillCount >= 12) {
    skillsMatchScore = 100;
    strengths.push("Daftar skill sangat lengkap");
  } else if (skillCount >= 8) {
    skillsMatchScore = 85;
    strengths.push("Daftar skill lengkap dan beragam");
  } else if (skillCount >= 5) {
    skillsMatchScore = 65;
  } else if (skillCount >= 3) {
    skillsMatchScore = 45;
  } else if (skillCount > 0) {
    skillsMatchScore = 25;
    suggestions.push("Tambahkan lebih banyak skill (target: 8-12 skill)");
  } else {
    skillsMatchScore = 0;
    weaknesses.push("Belum ada daftar keahlian");
  }

  // Bonus: skills with level specified
  const skillsWithLevel = data.skills.filter((s) => s.level).length;
  if (skillsWithLevel >= 5) skillsMatchScore += 5;
  else if (skillsWithLevel > 0) skillsMatchScore += 2;

  skillsMatchScore = Math.max(0, Math.min(100, skillsMatchScore));

  // ===== 5. KEYWORDS (0-100) — optimasi keyword di seluruh CV =====
  let keywordScore = 0;

  // Position match keywords (dari target role)
  if (targetRole && targetRole.trim().length > 0) {
    const positionWords = targetRole.toLowerCase().split(/\s+/);
    const matched = positionWords.filter((w) => w.length > 3 && allText.includes(w));
    keywordScore += Math.min(matched.length * 15, 45);
  }

  // Keyword density: skills mentioned in descriptions
  const skillsMentionedInText = data.skills.filter((s) => {
    const name = s.name.toLowerCase();
    return name.length > 2 && allText.includes(name);
  }).length;
  if (skillsMentionedInText >= 5) {
    keywordScore += 25;
  } else if (skillsMentionedInText >= 3) {
    keywordScore += 15;
  } else if (skillsMentionedInText > 0) {
    keywordScore += 5;
  }

  // Headline match
  if (data.personal.headline && targetRole) {
    const headlineWords = data.personal.headline.toLowerCase().split(/\s+/);
    const targetWords = targetRole.toLowerCase().split(/\s+/);
    const headlineMatch = headlineWords.filter((w) => targetWords.includes(w)).length;
    if (headlineMatch >= 2) keywordScore += 15;
    else if (headlineMatch > 0) keywordScore += 5;
  }

  // Education keywords
  for (const edu of data.educations) {
    if (edu.field && allText.includes(edu.field.toLowerCase())) keywordScore += 5;
    if (edu.degree && allText.includes(edu.degree.toLowerCase())) keywordScore += 3;
  }

  keywordScore = Math.max(0, Math.min(100, keywordScore));

  // ===== Weighted Total =====
  // format: 25%, experience: 25%, relevance: 15%, skills_match: 15%, keywords: 20%
  const overallScore = Math.round(
    formatScore * 0.25 +
    experienceScore * 0.25 +
    relevanceScore * 0.15 +
    skillsMatchScore * 0.15 +
    keywordScore * 0.20
  );

  // Pastikan strength/weakness/suggestions tidak terlalu banyak
  const uniqueStrengths = [...new Set(strengths)].slice(0, 5);

  return {
    overallScore: Math.min(100, Math.max(0, overallScore)),
    breakdown: {
      relevance: Math.min(100, Math.max(0, relevanceScore)),
      skills_match: Math.min(100, Math.max(0, skillsMatchScore)),
      experience: Math.min(100, Math.max(0, experienceScore)),
      format: Math.min(100, Math.max(0, formatScore)),
      keywords: Math.min(100, Math.max(0, keywordScore)),
    },
    strengths: uniqueStrengths,
    weaknesses: [...new Set(weaknesses)].slice(0, 5),
    suggestions: [...new Set(suggestions)].slice(0, 5),
  };
}
