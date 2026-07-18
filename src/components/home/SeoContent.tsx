import { CheckCircle2, ShieldCheck, Star } from "lucide-react";

export function SeoContent() {
  return (
    <section className="py-20 bg-white">
      <div className="container-page max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Cara Membuat CV ATS Friendly & CV Kreatif Yang Baik & Benar
          </h2>
          <p className="mt-4 text-base text-gray-600">
            Panduan lengkap agar CV kamu mudah dibaca oleh sistem dan menarik di mata rekruter.
          </p>
        </div>

        <div className="space-y-12">
          {/* Section 1: Apa itu CV ATS Friendly */}
          <div className="bg-green-50/50 rounded-2xl p-8 border border-green-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-green-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Apa itu CV ATS Friendly dan Mengapa Sangat Penting?</h3>
            </div>
            <div className="prose prose-green max-w-none text-gray-600 leading-relaxed text-sm sm:text-base">
              <p className="mb-4">
                <strong>CV ATS (Applicant Tracking System) Friendly</strong> adalah format Curriculum Vitae yang didesain secara khusus agar mudah dibaca dan dipindai oleh perangkat lunak ATS yang digunakan oleh perusahaan.
              </p>
              <p className="mb-4">
                Sebagian besar perusahaan besar saat ini menggunakan sistem ATS untuk menyaring ribuan lamaran yang masuk secara otomatis sebelum dibaca oleh rekruter manusia. Jika CV kamu tidak dapat dibaca oleh sistem ini, maka peluang kamu untuk lolos ke tahap interview akan sangat kecil, sebaik apapun kualifikasi yang kamu miliki.
              </p>
              <p>
                CV yang ATS Friendly memiliki struktur yang jelas, bebas dari elemen desain kompleks (seperti tabel rumit, grafik, atau font aneh), dan mengandung kata kunci (keyword) yang relevan dengan deskripsi pekerjaan.
              </p>
            </div>
          </div>

          {/* Section 2: Perbedaan CV ATS Friendly & CV Kreatif */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">
              Perbedaan CV ATS Friendly & CV Kreatif
            </h3>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-green-700 mb-4 flex items-center gap-2">
                  <span className="bg-green-100 text-green-800 w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span>
                  CV ATS Friendly
                </h4>
                <ul className="space-y-3">
                  {[
                    "Desain minimalis dan bersih",
                    "Fokus pada teks dan struktur hierarki",
                    "Tidak menggunakan grafik, tabel, atau kolom rumit",
                    "Digunakan untuk perusahaan korporat/BUMN",
                    "Font standar (Arial, Times New Roman, Calibri)"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-purple-700 mb-4 flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-800 w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span>
                  CV Kreatif
                </h4>
                <ul className="space-y-3">
                  {[
                    "Desain visual menonjol dan menarik",
                    "Bebas menggunakan warna dan tata letak",
                    "Dapat menggunakan ikon, chart, dan elemen grafis",
                    "Cocok untuk industri kreatif, desain, dan media",
                    "Kebebasan memilih font (namun tetap terbaca)"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <Star className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
