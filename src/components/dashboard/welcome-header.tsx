import { User } from "@supabase/supabase-js";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Plus, Sparkles } from "lucide-react";

interface WelcomeHeaderProps {
  user: User | null;
  onCreateCv?: () => void;
}

export function WelcomeHeader({ user, onCreateCv }: WelcomeHeaderProps) {
  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "pejuang karier";

  return (
    <section className="rounded-[1.25rem] border bg-card px-5 py-6 shadow-sm sm:px-6 md:px-8 md:py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-center">
        <div className="min-w-0">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Dashboard kerja, bukan sekadar tempat simpan CV
          </div>
          <h1 className="max-w-3xl font-display text-3xl font-bold leading-tight tracking-normal text-foreground sm:text-4xl">
            Halo, {displayName}. Siapkan lamaran yang lebih tajam hari ini.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            Mulai dari CV utama, cek skor ATS, poles isi dengan AI, lalu lanjutkan sampai simulasi
            interview. Semua langkah penting ada di satu tempat.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {onCreateCv ? (
              <Button size="lg" onClick={onCreateCv} className="gap-2">
                <Plus className="h-4 w-4" />
                Buat CV Baru
              </Button>
            ) : (
              <Button asChild size="lg" className="gap-2">
                <Link to="/cv">
                  <Plus className="h-4 w-4" />
                  Buat CV Baru
                </Link>
              </Button>
            )}
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link to="/cv">
                Kelola CV
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border bg-muted/35 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Fokus terbaik hari ini</p>
              <p className="text-xs leading-5 text-muted-foreground">
                Update satu CV, ukur skornya, lalu kirim versi PDF yang siap dibaca HR.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              ["01", "Tulis"],
              ["02", "Ukur"],
              ["03", "Kirim"],
            ].map(([step, label]) => (
              <div key={step} className="rounded-xl border bg-background px-2 py-3">
                <p className="text-xs font-bold text-primary">{step}</p>
                <p className="mt-1 text-[11px] font-medium text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
