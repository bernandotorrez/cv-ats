import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    n: "1",
    title: "Pilih Template",
    desc: "Disediakan banyak pilihan template ATS Friendly maupun Kreatif.",
    img: "/step1-template.webp",
  },
  {
    n: "2",
    title: "Isi Informasi Atau Import CV Lama Kamu",
    desc: "Isi form otomatis atau import data langsung dari PDF CV lama atau LinkedIn.",
    img: "/step2-import.webp",
  },
  {
    n: "3",
    title: "Download",
    desc: "Export CV kamu ke format PDF berkualitas tinggi hanya dengan satu klik.",
    img: "/step3-download.webp",
  },
] as const;

export function ThreeSteps() {
  return (
    <section
      aria-labelledby="steps-heading"
      className="relative overflow-hidden bg-green-950 py-20 text-white lg:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-green-700/30 blur-3xl"
      />
      <div className="container-page relative">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full bg-green-800 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-green-100">
            Cara kerja
          </span>
          <h2
            id="steps-heading"
            className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl"
          >
            Buat CV profesional dalam 3 langkah
          </h2>
          <p className="mt-4 text-lg text-green-100">Lebih mudah, cepat, dan praktis.</p>
        </div>

        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute left-[16%] right-[16%] top-7 hidden border-t-2 border-dashed border-green-700 md:block"
          />
          <ol className="relative grid gap-12 md:grid-cols-3 md:gap-6">
            {steps.map((step) => (
              <li key={step.n} className="relative flex flex-col items-center text-center">
                <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-300 font-display text-2xl font-extrabold text-gray-900 ring-8 ring-green-950">
                  <span className="sr-only">Langkah </span>
                  {step.n}
                </span>
                <h3 className="mt-5 font-display text-xl font-bold leading-snug">{step.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-green-100">{step.desc}</p>
                <div className="mt-6 aspect-[4/3] w-full max-w-xs overflow-hidden md:max-w-none rounded-2xl bg-white p-4">
                  <img
                    src={step.img}
                    alt=""
                    width={640}
                    height={640}
                    className="h-full w-full object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-12 text-center">
          <Button
            asChild
            size="lg"
            className="h-14 rounded-xl bg-yellow-300 px-8 text-base font-extrabold text-gray-900 shadow-lg hover:bg-yellow-200"
          >
            <Link to="/register">
              Mulai Langkah 1 — Gratis
              <ArrowRight aria-hidden="true" className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
