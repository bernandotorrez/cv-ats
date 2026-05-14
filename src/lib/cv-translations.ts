export type CvUiLang = "id" | "en";

export const cvTranslations = {
  id: {
    profileSummary: "Ringkasan Profil",
    workExperience: "Pengalaman Kerja",
    education: "Pendidikan",
    skills: "Keahlian",
    languages: "Bahasa",
    certificates: "Sertifikat",
    languagesAndCertificates: "Bahasa & Sertifikat",
    contactInfo: "Info Kontak",
    email: "Email",
    phone: "Telepon",
    location: "Lokasi",
    linkedin: "LinkedIn",
    website: "Website",
    profile: "Profil",
    aboutMe: "Tentang Saya",
    workHistory: "Riwayat Pekerjaan",
    current: "Sekarang",
    profileAndContact: "Profil & Kontak",
    atsView: "ATS View",
    extras: "Bahasa & Sertifikat",
    watermark: "Dibuat dengan CV Pintar",
  },
  en: {
    profileSummary: "Professional Summary",
    workExperience: "Work Experience",
    education: "Education",
    skills: "Skills",
    languages: "Languages",
    certificates: "Certificates",
    languagesAndCertificates: "Languages & Certificates",
    contactInfo: "Contact Info",
    email: "Email",
    phone: "Phone",
    location: "Location",
    linkedin: "LinkedIn",
    website: "Website",
    profile: "Profile",
    aboutMe: "About Me",
    workHistory: "Work History",
    current: "Present",
    profileAndContact: "Profile & Contact",
    atsView: "ATS View",
    extras: "Languages & Certificates",
    watermark: "Made with CV Pintar",
  },
} as const;

export type TranslationKey = keyof typeof cvTranslations.id;

export function t(lang: CvUiLang, key: TranslationKey): string {
  return cvTranslations[lang]?.[key] ?? cvTranslations.id[key];
}
