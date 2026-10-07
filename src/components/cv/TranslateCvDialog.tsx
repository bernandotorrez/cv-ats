import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Languages, Loader2, Lock, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { translateCv } from "@/lib/ai-functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getUserTierConfig } from "@/lib/subscription";
import type { CvData } from "@/lib/cv-types";
import type { CvUiLang } from "@/lib/cv-translations";

const LANGUAGE_LABEL: Record<CvUiLang, string> = {
  id: "Bahasa Indonesia",
  en: "Bahasa Inggris",
};

const TRANSLATED = [
  "Ringkasan profil & headline",
  "Jabatan dan deskripsi pekerjaan",
  "Pendidikan (gelar, jurusan) & magang",
  "Keahlian non-teknis & bahasa",
];
const UNCHANGED = [
  "Nama perusahaan, sekolah, dan orang",
  "Tanggal, angka, dan persentase",
  "Kontak, link, dan foto",
  "Nama tools, teknologi, dan sertifikat",
];

interface TranslateCvDialogProps {
  /** Bahasa tujuan; null = dialog tertutup. */
  target: CvUiLang | null;
  cvData: CvData;
  onClose: () => void;
  /** Ganti judul bagian saja, isi CV tidak diterjemahkan. */
  onLabelsOnly: (lang: CvUiLang) => void;
  /** Terjemahan berhasil: terapkan isi baru + bahasa. */
  onTranslated: (result: { data: CvData; language: CvUiLang; fields: number }) => void;
}

export function TranslateCvDialog({
  target,
  cvData,
  onClose,
  onLabelsOnly,
  onTranslated,
}: TranslateCvDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Gerbang & sisa kuota paket (diperiksa ulang tiap dialog dibuka). Server tetap penentu akhir.
  const [plan, setPlan] = useState<{ enabled: boolean; max: number | null; used: number } | null>(
    null,
  );

  useEffect(() => {
    if (!target || !user?.id) return;
    let active = true;
    setPlan(null);
    (async () => {
      const config = await getUserTierConfig(user.id);
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("ai_usage")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("feature", "translate")
        .gte("created_at", monthStart.toISOString());
      if (active) {
        setPlan({
          enabled: config.enableCvTranslate,
          max: config.maxCvTranslate,
          used: count ?? 0,
        });
      }
    })().catch(() => active && setPlan({ enabled: true, max: null, used: 0 }));
    return () => {
      active = false;
    };
  }, [target, user?.id]);

  const remaining = plan && plan.max !== null ? Math.max(0, plan.max - plan.used) : null;
  const locked = plan !== null && !plan.enabled;
  const exhausted = plan !== null && plan.enabled && remaining === 0;

  const handleClose = () => {
    if (loading) return;
    setError(null);
    onClose();
  };

  const handleTranslate = async () => {
    if (!target) return;
    setLoading(true);
    setError(null);
    try {
      const result = await translateCv({
        data: { cvData: cvData as unknown as Record<string, unknown>, target },
      });
      onTranslated({
        data: result.cvData as unknown as CvData,
        language: result.language,
        fields: result.translatedFields,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menerjemahkan.");
    } finally {
      setLoading(false);
    }
  };

  const needsUpgrade = error?.toLowerCase().includes("upgrade") ?? false;
  const label = target ? LANGUAGE_LABEL[target] : "";

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] grid-cols-[minmax(0,1fr)] gap-0 overflow-y-auto overflow-x-hidden rounded-3xl border border-gray-200 p-0 shadow-2xl sm:max-w-lg">
        <DialogHeader className="space-y-0 border-b border-gray-200 bg-green-50 px-5 py-4 pr-12 text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-700 text-white">
              <Languages aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="font-display text-lg font-extrabold text-gray-900">
                Terjemahkan isi CV ke {label}?
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-700">
                Judul bagian (mis. Pengalaman Kerja) otomatis ikut berganti.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <section className="rounded-2xl border border-green-200 bg-green-50/60 p-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-green-800">
                Diterjemahkan
              </h3>
              <ul className="mt-2 space-y-1.5">
                {TRANSLATED.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-snug text-gray-800">
                    <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-green-700" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-2xl border border-gray-200 bg-gray-50 p-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Tidak diubah
              </h3>
              <ul className="mt-2 space-y-1.5">
                {UNCHANGED.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-snug text-gray-700">
                    <Minus aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {plan && !locked && (
            <p
              className={cn(
                "rounded-xl p-3 text-sm font-semibold ring-1",
                exhausted
                  ? "bg-red-50 text-red-900 ring-red-200"
                  : "bg-green-50 text-green-900 ring-green-200",
              )}
            >
              {plan.max === null
                ? "Terjemahan tanpa batas di paketmu."
                : exhausted
                  ? `Kuota terjemahan bulan ini habis (${plan.max}).`
                  : `Sisa ${remaining} dari ${plan.max} terjemahan bulan ini.`}
            </p>
          )}

          {locked && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-sm leading-relaxed text-amber-950">
              <p className="flex items-center gap-2 font-bold">
                <Lock aria-hidden="true" className="h-4 w-4 shrink-0" />
                Terjemahan isi CV ada di paket Starter ke atas
              </p>
              <p className="mt-1">
                Mengganti judul bagian (Pengalaman Kerja → Work Experience) tetap gratis.
              </p>
            </div>
          )}

          <p className="rounded-xl bg-amber-50 p-3 text-sm leading-relaxed text-amber-950 ring-1 ring-amber-200">
            Hasil terjemahan AI perlu kamu baca ulang. Isi CV yang sekarang dicadangkan, dan kamu
            bisa membatalkan terjemahan setelah selesai.
          </p>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            >
              <p>{error}</p>
              {needsUpgrade && (
                <Link
                  to="/harga"
                  className="mt-1.5 inline-flex items-center gap-1 font-bold underline underline-offset-4"
                >
                  Lihat paket
                  <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 p-4 sm:flex-row sm:flex-wrap sm:justify-end sm:space-x-0">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
            className="h-11 rounded-xl font-semibold text-gray-700"
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => target && onLabelsOnly(target)}
            className="h-11 rounded-xl border-2 border-gray-300 font-bold hover:border-green-700 hover:bg-green-50"
          >
            Ganti judul bagian saja
          </Button>
          {locked || exhausted ? (
            <Button
              asChild
              className="h-11 gap-2 rounded-xl bg-green-700 font-bold text-white hover:bg-green-800"
            >
              <Link to="/harga">
                <Languages aria-hidden="true" className="h-4 w-4" />
                Upgrade untuk menerjemahkan
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleTranslate}
              disabled={loading || plan === null}
              className="h-11 gap-2 rounded-xl bg-green-700 font-bold text-white hover:bg-green-800"
            >
              {loading ? (
                <>
                  <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                  Menerjemahkan…
                </>
              ) : (
                <>
                  <Languages aria-hidden="true" className="h-4 w-4" />
                  Terjemahkan isi CV
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
