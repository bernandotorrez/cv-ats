export interface CvPersonal {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedin?: string;
  summary: string;
  summaryAlign?: "left" | "center" | "right" | "justify";
}

export interface CvExperience {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  description: string;
}

export interface CvEducation {
  id: string;
  school: string;
  degree: string;
  field?: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface CvSkill {
  id: string;
  name: string;
  level?: "Beginner" | "Intermediate" | "Advanced" | "Expert";
}

export interface CvLanguage {
  id: string;
  name: string;
  level: string;
}

export interface CvCertificate {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface CvData {
  personal: CvPersonal;
  experiences: CvExperience[];
  educations: CvEducation[];
  skills: CvSkill[];
  languages: CvLanguage[];
  certificates: CvCertificate[];
}

export const emptyCv: CvData = {
  personal: { fullName: "", headline: "", email: "", phone: "", location: "", website: "", linkedin: "", summary: "", summaryAlign: "left" },
  experiences: [],
  educations: [],
  skills: [],
  languages: [],
  certificates: [],
};

export const TEMPLATES = [
  { id: "jakarta", name: "Jakarta", description: "Klasik profesional, satu kolom rapi." },
  { id: "bandung", name: "Bandung", description: "Modern dengan aksen warna primary." },
  { id: "surabaya", name: "Surabaya", description: "Minimalis dengan header tegas." },
  { id: "yogya", name: "Yogyakarta", description: "Elegan dan ATS friendly." },
  { id: "medan", name: "Medan", description: "Corporate professional,ATS friendly." },
  { id: "makassar", name: "Makassar", description: "Dua kolom modern, clean layout." },
  { id: "semarang", name: "Semarang", description: "Modern corporate dengan aksen hijau." },
  { id: "bali", name: "Bali", description: "Clean minimalist dengan aksen cyan." },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]["id"];
