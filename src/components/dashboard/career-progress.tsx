import { FileText, BarChart3, FileCheck, Mic, Send } from "lucide-react";

export interface CareerStep {
  id: string;
  label: string;
  description: string;
  icon: typeof FileText;
  done: boolean;
  link?: string;
  actionLabel?: string;
}

// Default steps definition — filtered by tier
// Free: Buat CV, Cek Skor ATS, Lamaran (no Cover Letter / Interview)
// Starter: Buat CV, Cek Skor ATS, Cover Letter, Lamaran (no Interview)
// Pro: all 5 steps
export function getCareerSteps(data: {
  hasCv: boolean;
  hasScore: boolean;
  hasCoverLetter: boolean;
  hasInterview: boolean;
  hasApplied: boolean;
  tier: "free" | "starter" | "pro";
  interviewCount?: number;
}): CareerStep[] {
  const allSteps: (CareerStep & { hidden?: boolean })[] = [
    {
      id: "create-cv",
      label: "Buat CV",
      description: "Mulai buat CV profesional",
      icon: FileText,
      done: data.hasCv,
      link: "/cv",
      actionLabel: "Buat CV Kamu",
    },
    {
      id: "score-cv",
      label: "Cek Skor ATS",
      description: "Cek kecocokan CV kamu",
      icon: BarChart3,
      done: data.hasScore,
      actionLabel: "Cek Skor ATS",
    },
    {
      id: "cover-letter",
      label: "Cover Letter",
      description: "Tingkatkan daya tarik",
      icon: FileCheck,
      done: data.hasCoverLetter,
      // Starter+ only
      hidden: data.tier === "free",
      actionLabel: "Buat Cover Letter",
    },
    {
      id: "interview",
      label: "Interview",
      description: "Latihan & persiapan",
      icon: Mic,
      done: data.hasInterview,
      link: "/simulasi-wawancara",
      // Pro only
      hidden: data.tier !== "pro",
      actionLabel:
        data.interviewCount && data.interviewCount > 0
          ? "Lanjutkan Simulasi Wawancara"
          : "Belajar Simulasi Wawancara",
    },
    {
      id: "apply",
      label: "Lamaran",
      description: "Kirim ke perusahaan",
      icon: Send,
      done: data.hasApplied,
      link: "/lamaran",
      actionLabel: "Kirim Lamaran",
    },
  ];

  return allSteps.filter((s) => !("hidden" in s && s.hidden));
}
