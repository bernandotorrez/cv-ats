import { Link } from "@tanstack/react-router";
import { CheckCircle2, FileText, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AtsVsCreative() {
  return (
    <section className="py-20 bg-green-50/30">
      <div className="container-page">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 uppercase tracking-wider">
            Format CV
          </span>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            CV ATS-Friendly Atau Kreatif? Mana yang cocok?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-600">
            Pilih format CV yang tepat agar peluang diterima lebih besar sesuai dengan perusahaan yang kamu lamar.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* ATS-Friendly Card */}
          <div className="rounded-2xl border-2 border-green-600 bg-white p-8 shadow-xl relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 bg-green-600 text-white px-4 py-1.5 rounded-bl-xl text-xs font-bold">
              Paling Direkomendasikan
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="font-display text-2xl font-bold text-gray-900">ATS-Friendly</h3>
            </div>
            
            <p className="text-gray-600 mb-6 flex-grow">
              Sangat direkomendasikan untuk melamar ke perusahaan besar, BUMN, multinasional, atau startup mapan yang menggunakan Applicant Tracking System (ATS) untuk menyaring kandidat.
            </p>
            
            <div className="space-y-3 mb-8">
              {[
                "Format teks bersih tanpa elemen grafis rumit",
                "Struktur standar yang mudah dibaca robot (parser)",
                "Fokus pada kata kunci (keyword) dan pencapaian",
                "Meminimalkan risiko CV ditolak sebelum dibaca HRD"
              ].map((point, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-gray-700">{point}</span>
                </div>
              ))}
            </div>
            
            <Button asChild size="lg" className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold">
              <Link to="/template">
                Buat CV ATS-Friendly
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Kreatif Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-md hover:shadow-lg transition-shadow flex flex-col">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-display text-2xl font-bold text-gray-900">CV Kreatif</h3>
            </div>
            
            <p className="text-gray-600 mb-6 flex-grow">
              Cocok digunakan saat melamar posisi di industri kreatif seperti Graphic Designer, UI/UX Designer, Videographer, atau perusahaan agensi yang menilai sisi estetika.
            </p>
            
            <div className="space-y-3 mb-8">
              {[
                "Desain visual menarik dan warna lebih bebas",
                "Bisa mencantumkan elemen grafis, chart, dan ikon",
                "Menunjukkan personal branding & skill desain",
                "Sebaiknya dikirim langsung via email, bukan portal ATS"
              ].map((point, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-gray-700">{point}</span>
                </div>
              ))}
            </div>
            
            <Button asChild size="lg" variant="outline" className="w-full border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold">
              <Link to="/template">
                Lihat Template Kreatif
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
