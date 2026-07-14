import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  GraduationCap,
  Compass,
  TrendingUp,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Edit3,
  Loader2,
  Check,
} from "lucide-react";
import { TemplateGallery } from "../cv/TemplateGallery";
import { TEMPLATES, type TemplateId } from "@/lib/cv-types";
import { cn } from "@/lib/utils";

interface OnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier: "free" | "starter" | "pro";
  allowedTemplates: string[] | null;
  onCreateCv: (templateId: TemplateId, guided: boolean) => void;
  creating: boolean;
}

type GoalOption = "fresh" | "pivot" | "promo" | "magang";

export function OnboardingWizard({
  open,
  onOpenChange,
  tier,
  allowedTemplates,
  onCreateCv,
  creating,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<GoalOption | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("jakarta");
  const [guidedMode, setGuidedMode] = useState<boolean | null>(null);

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    if (guidedMode === null) return;
    onCreateCv(selectedTemplate, guidedMode);
  };

  // Step 1 validation
  const isStep1Valid = goal !== null && targetRole.trim().length > 0;

  // Step 3 validation
  const isStep3Valid = guidedMode !== null;

  const goalOptions = [
    {
      id: "fresh" as GoalOption,
      label: "Cari Kerja Pertama",
      desc: "Fresh Graduate / memulai karir baru",
      icon: GraduationCap,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      activeColor: "border-blue-500 ring-2 ring-blue-100 bg-blue-50/30",
    },
    {
      id: "pivot" as GoalOption,
      label: "Pindah Bidang Kerja",
      desc: "Career switch atau merambah ke industri lain",
      icon: Compass,
      color: "text-purple-600 bg-purple-50 border-purple-200",
      activeColor: "border-purple-500 ring-2 ring-purple-100 bg-purple-50/30",
    },
    {
      id: "promo" as GoalOption,
      label: "Kenaikan Jabatan",
      desc: "Meningkatkan karir atau level up posisi sekarang",
      icon: TrendingUp,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      activeColor: "border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/30",
    },
    {
      id: "magang" as GoalOption,
      label: "Magang / Beasiswa",
      desc: "Melamar magang, freelance, atau keperluan akademis",
      icon: Briefcase,
      color: "text-amber-600 bg-amber-50 border-amber-200",
      activeColor: "border-amber-500 ring-2 ring-amber-100 bg-amber-50/30",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl gap-0 border bg-card">
        {/* Header - Progress Tracker */}
        <div className="border-b px-6 py-4 bg-muted/20 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Langkah {step} dari {totalSteps}
              </span>
              <h2 className="text-lg font-bold text-foreground mt-0.5">
                {step === 1 && "Ceritakan Sasaran Kariermu"}
                {step === 2 && "Pilih Desain CV Terfavorit"}
                {step === 3 && "Pilih Cara Membuat CV"}
              </h2>
            </div>

            {/* Progress line */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all border-2",
                      step === s
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : step > s
                          ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                          : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {step > s ? <Check className="h-4 w-4" strokeWidth={3} /> : s}
                  </div>
                  {s < totalSteps && (
                    <div
                      className={cn(
                        "h-0.5 w-8 sm:w-12 transition-all mx-1.5",
                        step > s ? "bg-emerald-500" : "bg-border",
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {/* STEP 1: CAREER GOALS & ROLE */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground">
                  Selamat datang di <strong>CV Pintar</strong>! Mari kita bantu kamu membuat CV
                  ATS-friendly terbaik. Untuk memulainya, bantu kami memahami kebutuhan kariermu
                  agar kami bisa memberikan rekomendasi yang pas.
                </p>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-semibold text-foreground block">
                  Apa tujuan utamamu saat ini?
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {goalOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = goal === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setGoal(opt.id)}
                        className={cn(
                          "flex items-start text-left gap-3.5 p-4 rounded-xl border-2 transition-all hover:shadow-sm",
                          isSelected
                            ? opt.activeColor
                            : "border-border hover:border-muted-foreground/30 bg-card",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                            opt.color,
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-foreground">{opt.label}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-normal">
                            {opt.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2.5">
                <label
                  htmlFor="target-role"
                  className="text-sm font-semibold text-foreground block"
                >
                  Posisi Pekerjaan Impian (Target Role)
                </label>
                <Input
                  id="target-role"
                  type="text"
                  placeholder="Contoh: Software Engineer, Marketing Executive, Data Analyst..."
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="rounded-xl h-11 border-border focus-visible:ring-emerald-500"
                />
                <p className="text-xs text-muted-foreground">
                  Posisi ini akan dicantumkan di headline CV dan membantu AI mengoptimalkan CV kamu
                  agar lolos seleksi ATS.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: TEMPLATE SELECTION */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Pilih desain template untuk memulai CV pertamamu. Struktur layout dan isi data CV
                  tetap dapat diubah, ditambah, atau disesuaikan kapan saja lewat editor.
                </p>
              </div>

              <div className="max-h-[50vh] overflow-y-auto -mx-2 px-2 py-1 scrollbar-thin">
                <TemplateGallery
                  selected={selectedTemplate}
                  onSelect={setSelectedTemplate}
                  tier={tier}
                  allowedTemplates={allowedTemplates}
                />
              </div>
            </div>
          )}

          {/* STEP 3: CREATION MODE CHOICE */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground">
                  Langkah terakhir! Pilih cara kamu ingin mengisi CV pertamamu.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setGuidedMode(true)}
                  disabled={creating}
                  className={cn(
                    "flex flex-col items-center text-center p-6 rounded-2xl border-2 transition-all hover:shadow-md",
                    guidedMode === true
                      ? "border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20"
                      : "border-border hover:border-emerald-300 bg-card",
                  )}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-4 shrink-0 shadow-inner">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-base text-foreground flex items-center gap-1.5 justify-center">
                    Panduan AI
                    <Badge className="text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-100 shrink-0 font-bold border-amber-200">
                      Direkomendasikan
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    AI kami akan memandu kamu mengisi data CV langkah demi langkah, melengkapi
                    bagian yang kosong, dan merumuskan deskripsi pekerjaan.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setGuidedMode(false)}
                  disabled={creating}
                  className={cn(
                    "flex flex-col items-center text-center p-6 rounded-2xl border-2 transition-all hover:shadow-md",
                    guidedMode === false
                      ? "border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20"
                      : "border-border hover:border-emerald-300 bg-card",
                  )}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4 shrink-0 shadow-inner">
                    <Edit3 className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-base text-foreground">Isi Sendiri / Upload</h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Langsung masuk ke editor interaktif. Kamu bisa mengetik isi CV secara manual
                    atau mengimpor CV PDF lamamu untuk di-parse otomatis.
                  </p>
                </button>
              </div>

              {/* Summary recap */}
              <div className="rounded-xl bg-muted/40 p-4 border border-dashed flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground block uppercase tracking-wider">
                    Ringkasan Pilihan:
                  </span>
                  <div className="text-xs text-foreground font-medium flex flex-wrap gap-x-2 gap-y-1">
                    <span>Sasaran: {goalOptions.find((o) => o.id === goal)?.label}</span>
                    <span className="text-muted-foreground">•</span>
                    <span>Role: {targetRole}</span>
                    <span className="text-muted-foreground">•</span>
                    <span>Template: {TEMPLATES.find((t) => t.id === selectedTemplate)?.name}</span>
                  </div>
                </div>
                {creating && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold shrink-0">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyiapkan CV baru...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="border-t px-6 py-4 flex items-center justify-between bg-muted/10 shrink-0">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1 || creating}
            className="gap-1 px-3 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Kembali
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={creating}
              className="text-xs hover:bg-muted/60"
            >
              Lewati Setup
            </Button>

            {step < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={step === 1 ? !isStep1Valid : false}
                className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 font-semibold"
              >
                Lanjutkan
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={!isStep3Valid || creating}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 font-bold shadow-md shadow-emerald-600/10"
              >
                Mulai Buat CV Sekarang! 🚀
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
