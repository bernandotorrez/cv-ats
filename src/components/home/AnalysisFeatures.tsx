import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Search, FileText, MessageCircle, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AnalysisFeatures() {
  return (
    <section className="py-20 bg-slate-50 relative overflow-hidden">
      <div className="container-page relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Fitur Utama CV Pintar
          </h2>
          {/* <p className="mt-4 text-base sm:text-lg text-gray-600">
            Dapatkan feedback instan untuk CV kamu. Cek seberapa cocok profile kamu dengan lowongan impianmu.
          </p> */}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {[
            {
              icon: Search,
              title: "Analisa Score CV",
              desc: "Dapatkan saran perbaikan secara AI untuk mengoptimalkan CV agar ATS-friendly."
            },
            {
              icon: FileText,
              title: "AI Cover Letter Builder",
              desc: "Buat Surat Lamaran dengan AI yang disesuaikan khusus untuk posisi yang dituju."
            },
            {
              icon: MessageCircle,
              title: "Simulasi Interview",
              desc: "Latih kemampuan wawancara kamu dengan AI kami dan dapatkan feedback langsung."
            },
            {
              icon: Briefcase,
              title: "CV Review by AI",
              desc: "Dapatkan feedback instan untuk CV kamu. Mana bagian yang perlu diperbaiki dan mana yang sudah oke."
            }
          ].map((feature, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-700 mb-6">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{feature.desc}</p>
              <Link to="/register" className="text-green-600 hover:text-green-700 text-sm font-semibold flex items-center gap-1">
                Coba Sekarang <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button asChild size="lg" className="h-12 px-8 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-md shadow-md">
            <Link to="/fitur">
              Lihat Semua Fitur
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
