import { FileText, Import, Download } from "lucide-react";

export function ThreeSteps() {
  const steps = [
    {
      n: "1",
      title: "Pilih Template",
      desc: "Disediakan banyak pilihan template ATS Friendly maupun Kreatif.",
      icon: FileText,
      imagePlaceholder: "Template Selection"
    },
    {
      n: "2",
      title: "Isi Informasi Atau Import CV Lama Kamu",
      desc: "Isi form otomatis atau import data langsung dari PDF CV lama atau LinkedIn.",
      icon: Import,
      imagePlaceholder: "Import CV"
    },
    {
      n: "3",
      title: "Download",
      desc: "Export CV kamu ke format PDF berkualitas tinggi hanya dengan satu klik.",
      icon: Download,
      imagePlaceholder: "Download PDF"
    },
  ] as const;

  return (
    <section className="py-24 bg-white relative overflow-hidden border-t border-gray-100">
      <div className="container-page relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Buat CV Profesional dalam 3 langkah
          </h2>
          <p className="mt-4 text-lg text-gray-600 font-medium">
            Lebih mudah, cepat, dan praktis
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.n} className="flex flex-col rounded-2xl bg-white border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
                  <step.icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">
                    Langkah {step.n}
                  </div>
                  <h3 className="font-display text-lg font-bold text-gray-900 leading-snug">
                    {step.title}
                  </h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                {step.desc}
              </p>
              
              {/* Illustration placeholder block */}
              <div className="mt-auto aspect-[4/3] rounded-xl bg-white border border-gray-100 flex items-center justify-center p-4 relative overflow-hidden group">
                 {/* Decorative background element */}
                 <div className="absolute inset-0 bg-gradient-to-tr from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 {step.n === "1" && (
                    <img 
                      src="/step1-template.png" 
                      alt="Ilustrasi Pilih Template CV" 
                      className="w-full h-full object-contain relative z-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-lg" 
                    />
                 )}
                 {step.n === "2" && (
                    <img 
                      src="/step2-import.png" 
                      alt="Ilustrasi Import CV" 
                      className="w-full h-full object-contain relative z-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-lg" 
                    />
                 )}
                 {step.n === "3" && (
                    <img 
                      src="/step3-download.png" 
                      alt="Ilustrasi Download CV PDF" 
                      className="w-full h-full object-contain relative z-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-lg" 
                    />
                 )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
