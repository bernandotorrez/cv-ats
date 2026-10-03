import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  BriefcaseBusiness,
  FileText,
  MessageCircle,
  ShieldCheck,
  UserRoundCheck,
  Video,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { buildSeo } from "@/lib/seo";
import {
  Eyebrow,
  PageHero,
  SecondaryCta,
  SectionHeader,
  TrustChecks,
} from "@/components/site/marketing";

export const Route = createFileRoute("/private-coaching")({
  head: () =>
    buildSeo({
      title: "Private Mentoring by HR Recruiter - CV Pintar",
      description:
        "Konsultasi 1-on-1 dengan HR Recruiter untuk review CV, strategi apply, dan persiapan interview. Chat session Rp25.000 dan video Zoom Rp50.000.",
      path: "/private-coaching",
      keywords:
        "private mentoring hr recruiter, konsultasi cv, review cv hr, simulasi interview, mentoring karir indonesia",
    }),
  component: PrivateCoachingPage,
});

const whatsappNumber = "6285190607141";

const packages = [
  {
    icon: MessageCircle,
    name: "Chat Session",
    price: "Rp25.000",
    desc: "Konsultasi cepat via WhatsApp untuk review CV, strategi apply, dan pertanyaan karier.",
    duration: "30 menit chat terarah",
    cta: "Booking Chat",
    message:
      "Halo CV Pintar, saya ingin booking Chat Session Private Mentoring by HR Recruiter. Mohon info jadwal dan cara pembayarannya.",
  },
  {
    icon: Video,
    name: "Video Session",
    price: "Rp50.000",
    desc: "Sesi 1-on-1 via Zoom untuk diskusi mendalam, latihan interview, dan feedback langsung.",
    duration: "30 menit via Zoom",
    cta: "Booking Video",
    message:
      "Halo CV Pintar, saya ingin booking Video Session Private Mentoring via Zoom. Mohon info jadwal, pembayaran, dan link Zoom-nya.",
  },
] as const;

const coaches = [
  {
    name: "Dewi Anindya",
    initials: "DA",
    title: "Senior HR Recruiter",
    experience: "9+ tahun pengalaman",
    specialty: "Tech, Startup, Fresh Graduate",
    bio: "Berpengalaman screening kandidat, menyusun shortlist, dan membantu pelamar membangun CV yang lebih relevan dengan kebutuhan role.",
  },
  {
    name: "Raka Pradipta",
    initials: "RP",
    title: "Talent Acquisition Specialist",
    experience: "7+ tahun pengalaman",
    specialty: "FMCG, Finance, Career Switcher",
    bio: "Fokus membantu kandidat memahami ekspektasi recruiter, merapikan story karier, dan menyiapkan jawaban interview yang lebih percaya diri.",
  },
] as const;

const steps = [
  ["01", "Pilih sesi", "Tentukan ingin konsultasi via chat atau video Zoom."],
  ["02", "Konfirmasi jadwal", "Tim akan membantu mencocokkan jadwal dengan HR Recruiter."],
  ["03", "Bayar & kirim bahan", "Kirim CV, target role, atau job description yang ingin dibahas."],
  ["04", "Mulai mentoring", "Chat dimulai via WhatsApp. Video session memakai link Zoom."],
] as const;

const faqs = [
  {
    q: "Link chat dan Zoom dikirim lewat mana?",
    a: "Semua konfirmasi dilakukan lewat WhatsApp. Chat session berjalan langsung di WhatsApp. Untuk video session, tim mengirim link Zoom setelah pembayaran dan jadwal dikonfirmasi.",
  },
  {
    q: "Apa yang perlu saya siapkan sebelum sesi?",
    a: "Siapkan CV terbaru, target posisi, dan job description bila ada. Untuk interview mentoring, siapkan juga daftar pertanyaan yang paling membuat kamu ragu.",
  },
  {
    q: "Apakah bisa memilih HR Recruiter?",
    a: "Bisa request coach tertentu. Jika jadwalnya tersedia, tim akan menyesuaikan. Jika tidak, tim akan merekomendasikan coach paling relevan dengan kebutuhanmu.",
  },
  {
    q: "Apakah sesi ini menggantikan fitur AI Review?",
    a: "Tidak. AI Review membantu screening cepat, sedangkan Private Mentoring memberi arahan personal langsung dari HR Recruiter.",
  },
] as const;

function waLink(message: string) {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

const WAITLIST_MESSAGE =
  "Halo CV Pintar, saya ingin dikabari saat Private Mentoring by HR Recruiter sudah dibuka.";

const waitlistFaq = {
  q: "Kapan Private Mentoring dibuka?",
  a: "Segera. Klik tombol “Kabari Saya” untuk masuk daftar tunggu via WhatsApp — kamu akan dikabari pertama saat jadwal booking dibuka.",
};

function NewTabHint() {
  return <span className="sr-only"> (membuka tab baru)</span>;
}

function WaitlistCta({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <a
      href={waLink(WAITLIST_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex h-14 items-center justify-center gap-2 rounded-xl px-8 text-base font-bold shadow-lg transition-colors ${
        tone === "light"
          ? "bg-green-700 text-white shadow-green-700/25 hover:bg-green-800"
          : "bg-yellow-300 text-gray-950 hover:bg-yellow-200"
      }`}
    >
      <BellRing aria-hidden="true" className="h-5 w-5" />
      Kabari Saya Saat Dibuka
      <NewTabHint />
    </a>
  );
}

function ComingSoonButton() {
  return (
    <Button
      size="lg"
      disabled
      className="h-12 w-full cursor-not-allowed rounded-xl bg-yellow-300 text-base font-extrabold text-gray-900 opacity-70 blur-[0.5px]"
    >
      Segera Hadir
    </Button>
  );
}

function PrivateCoachingPage() {
  return (
    <div className="overflow-hidden bg-white">
      <PageHero
        eyebrow={
          <>
            <span className="rounded-full bg-yellow-300 px-2 py-0.5 text-xs font-extrabold uppercase tracking-wider text-gray-900">
              Segera hadir
            </span>
            Private mentoring by HR Recruiter
          </>
        }
        title={
          <>
            Bukan cuma CV bagus.{" "}
            <span className="text-green-700">Kamu juga perlu tahu cara menjual dirimu.</span>
          </>
        }
        desc="Konsultasi 1-on-1 dengan HR Recruiter untuk review CV, strategi apply, dan persiapan interview. Daftar sekarang supaya kamu dikabari pertama saat dibuka."
        aside={<FocusCard />}
      >
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <WaitlistCta />
          <SecondaryCta to="/cv-review">Cek CV dengan AI Dulu</SecondaryCta>
        </div>
        <TrustChecks items={["Mulai Rp25.000", "Via WhatsApp / Zoom", "Dibimbing HR Recruiter"]} />
      </PageHero>

      {/* Packages (teaser) */}
      <section aria-labelledby="sesi-heading" className="bg-gray-50 py-20 lg:py-28">
        <div className="container-page">
          <SectionHeader
            id="sesi-heading"
            eyebrow="Pilihan sesi"
            title="Mulai dari chat cepat atau video yang lebih dalam."
            desc="Harga saat peluncuran. Booking dibuka segera — masuk daftar tunggu agar kebagian jadwal pertama."
          />
          <ul className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            {packages.map((item, i) => (
              <li
                key={item.name}
                className={`relative flex flex-col rounded-3xl p-7 ${
                  i === 1
                    ? "bg-green-800 text-white shadow-2xl shadow-green-900/30"
                    : "border border-gray-200 bg-white"
                }`}
              >
                {i === 1 && (
                  <p className="absolute -top-3.5 left-7 rounded-full bg-yellow-300 px-3 py-1 text-xs font-bold text-gray-900">
                    Paling lengkap
                  </p>
                )}
                <div className="flex items-start justify-between gap-4">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                      i === 1 ? "bg-white/15 text-yellow-300" : "bg-green-100 text-green-800"
                    }`}
                  >
                    <item.icon aria-hidden="true" className="h-6 w-6" />
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      i === 1 ? "bg-white/15 text-white" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {item.duration}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-2xl font-extrabold">{item.name}</h3>
                <p
                  className={`mt-2 flex-1 text-sm leading-relaxed ${i === 1 ? "text-green-50" : "text-gray-600"}`}
                >
                  {item.desc}
                </p>
                <p className="mt-6 font-display text-4xl font-extrabold">
                  {item.price}
                  <span
                    className={`ml-2 text-sm font-medium ${i === 1 ? "text-green-100" : "text-gray-600"}`}
                  >
                    / sesi
                  </span>
                </p>
                <div className="mt-6">
                  <ComingSoonButton />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-10 text-center">
            <WaitlistCta />
          </div>
        </div>
      </section>

      {/* Coaches */}
      <section aria-labelledby="coach-heading" className="py-20 lg:py-28">
        <div className="container-page">
          <SectionHeader
            id="coach-heading"
            eyebrow="Profil HR"
            title="Dibimbing oleh recruiter yang paham proses screening."
            desc="Dua HR Recruiter siap membimbingmu. Kamu bisa request coach saat booking dibuka."
          />
          <ul className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            {coaches.map((coach) => (
              <li key={coach.name} className="rounded-3xl border border-gray-200 bg-white p-7">
                <div className="flex items-center gap-5">
                  <span
                    aria-hidden="true"
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-green-700 font-display text-2xl font-extrabold text-white"
                  >
                    {coach.initials}
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-bold text-gray-900">{coach.name}</h3>
                    <p className="mt-0.5 text-sm font-semibold text-green-800">{coach.title}</p>
                    <p className="mt-0.5 text-sm text-gray-600">{coach.experience}</p>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-relaxed text-gray-700">{coach.bio}</p>
                <p className="mt-5 inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                  <span className="sr-only">Spesialisasi: </span>
                  {coach.specialty}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Steps */}
      <section aria-labelledby="alur-heading" className="bg-gray-50 py-20 lg:py-28">
        <div className="container-page">
          <SectionHeader
            id="alur-heading"
            eyebrow="Alur booking"
            title="Sederhana: pilih, jadwalkan, mulai."
            desc="Begitu dibuka, booking dan chat berjalan lewat WhatsApp. Link Zoom dikirim setelah jadwal video terkonfirmasi."
          />
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute left-[12%] right-[12%] top-7 hidden border-t-2 border-dashed border-green-300 md:block"
            />
            <ol className="relative grid gap-10 md:grid-cols-4 md:gap-6">
              {steps.map(([n, title, desc]) => (
                <li key={n} className="flex flex-col items-center text-center">
                  <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-green-700 font-display text-xl font-extrabold text-white ring-8 ring-gray-50">
                    <span className="sr-only">Langkah </span>
                    {Number(n)}
                  </span>
                  <h3 className="mt-5 font-display text-lg font-bold text-gray-900">{title}</h3>
                  <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-gray-600">{desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-heading" className="py-20 lg:py-28">
        <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <Eyebrow>FAQ</Eyebrow>
            <h2
              id="faq-heading"
              className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl"
            >
              Pertanyaan sebelum booking.
            </h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {[waitlistFaq, ...faqs].map((faq, index) => (
              <AccordionItem
                key={faq.q}
                value={`faq-${index}`}
                className="rounded-xl border border-gray-200 bg-white px-5 shadow-sm"
              >
                <AccordionTrigger className="min-h-11 text-left text-base font-bold text-gray-900 hover:no-underline hover:text-green-800">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-gray-600 sm:text-base">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Closing */}
      <section className="container-page pb-16 lg:pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-green-700 px-6 py-12 text-center text-white shadow-2xl sm:px-12 lg:py-16">
          <div
            aria-hidden="true"
            className="absolute -left-12 -top-12 h-48 w-48 rounded-full bg-green-600/40 blur-2xl"
          />
          <div className="relative mx-auto max-w-3xl">
            <ShieldCheck aria-hidden="true" className="mx-auto h-10 w-10 text-yellow-300" />
            <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Punya CV. Punya strategi. Punya cara menjawab.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-green-50 sm:text-lg">
              Masuk daftar tunggu sekarang. Sambil menunggu, rapikan CV-mu dengan AI CV Pintar.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <WaitlistCta tone="dark" />
              <Link
                to="/register"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border-2 border-white/70 px-8 text-base font-bold text-white transition-colors hover:bg-white/10"
              >
                Buat CV Gratis
                <ArrowRight aria-hidden="true" className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FocusCard() {
  return (
    <div className="relative mx-auto w-full max-w-md px-2 sm:px-0">
      <div
        aria-hidden="true"
        className="absolute inset-0 translate-x-3 translate-y-3 rotate-2 rounded-3xl bg-green-700"
      />
      <div className="relative rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-700 text-white">
            <UserRoundCheck aria-hidden="true" className="h-7 w-7" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Fokus mentoring
            </p>
            <p className="font-display text-xl font-extrabold text-gray-900">
              CV, Apply, Interview
            </p>
          </div>
        </div>
        <ul className="mt-5 grid gap-3">
          {(
            [
              [FileText, "CV positioning", "Cari pesan utama yang harus terlihat dalam 6 detik."],
              [
                BriefcaseBusiness,
                "Strategi apply",
                "Pilih role, keyword, dan angle pengalaman yang paling kuat.",
              ],
              [
                BadgeCheck,
                "Interview readiness",
                "Latih cara menjawab agar terdengar jelas dan percaya diri.",
              ],
            ] as const
          ).map(([Icon, title, desc]) => (
            <li key={title} className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-800">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold text-gray-900">{title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-gray-600">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
