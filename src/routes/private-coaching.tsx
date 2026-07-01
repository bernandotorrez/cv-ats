import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  FileText,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  UserRoundCheck,
  Video,
  Zap,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildSeo } from "@/lib/seo";

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
    a: "Untuk MVP, semua konfirmasi dilakukan lewat WhatsApp. Chat session berjalan langsung di WhatsApp. Untuk video session, tim mengirim link Zoom setelah pembayaran dan jadwal dikonfirmasi.",
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

function PrivateCoachingPage() {
  return (
    <>
      <section className="overflow-hidden bg-background">
        <div className="container-page grid gap-10 py-14 md:grid-cols-[1.02fr_0.98fr] md:items-center md:py-20 lg:py-24">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge className="gap-1.5 bg-info text-info-foreground hover:bg-info">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Private mentoring by HR Recruiter
              </Badge>
              <Badge
                variant="outline"
                className="border-amber-400 text-amber-700 font-bold bg-amber-50"
              >
                Segera Hadir
              </Badge>
            </div>
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Bukan cuma CV bagus. Kamu juga perlu tahu cara menjual dirimu.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              Konsultasi 1-on-1 dengan HR Recruiter untuk review CV, strategi apply, dan persiapan
              interview agar kamu lebih siap menghadapi proses rekrutmen.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                disabled
                size="lg"
                className="h-12 px-6 text-base opacity-75 cursor-not-allowed"
              >
                Segera Hadir
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
                <Link to="/cv-review">Cek CV dengan AI dulu</Link>
              </Button>
            </div>
            <ul className="mt-6 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
              {["Mulai Rp25.000", "Via WhatsApp / Zoom", "Dibimbing HR Recruiter"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 shadow-xl shadow-primary/10">
            <div className="rounded-md bg-background p-5">
              <div className="flex items-center gap-4 border-b border-border pb-5">
                <div className="grid h-14 w-14 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <UserRoundCheck className="h-7 w-7" aria-hidden />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Mentoring focus
                  </p>
                  <h2 className="font-display text-xl font-bold">CV, Apply, Interview</h2>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {[
                  [
                    FileText,
                    "CV positioning",
                    "Cari pesan utama yang harus terlihat dalam 6 detik.",
                  ],
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
                ].map(([Icon, title, desc]) => (
                  <div key={title as string} className="rounded-lg border border-border p-4">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" aria-hidden />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{title as string}</h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {desc as string}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/45 py-16 md:py-24">
        <div className="container-page">
          <SectionIntro
            eyebrow="Pilih sesi"
            title="Mulai dari chat cepat atau video yang lebih dalam."
            desc="Untuk tahap awal, booking dan konfirmasi berjalan lewat WhatsApp agar prosesnya ringan dan cepat."
          />

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {packages.map((item) => (
              <Card key={item.name} className="rounded-lg border-border bg-card shadow-none">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
                      <item.icon className="h-6 w-6" aria-hidden />
                    </div>
                    <Badge variant="secondary">{item.duration}</Badge>
                  </div>
                  <h2 className="mt-6 font-display text-2xl font-bold">{item.name}</h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.desc}</p>
                  <div className="mt-6 font-display text-4xl font-extrabold text-foreground">
                    {item.price}
                  </div>
                  <Button
                    disabled
                    size="lg"
                    className="mt-6 h-12 w-full gap-2 opacity-75 cursor-not-allowed"
                  >
                    Segera Hadir
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 md:py-24">
        <SectionIntro
          eyebrow="Profil HR"
          title="Dibimbing oleh recruiter yang paham proses screening."
          desc="Saat ini tersedia dua HR Recruiter. Kamu bisa request coach saat booking melalui WhatsApp."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {coaches.map((coach) => (
            <article key={coach.name} className="rounded-lg border border-border bg-card p-6">
              <div className="flex flex-col gap-5 sm:flex-row">
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <span className="font-display text-2xl font-bold">{coach.initials}</span>
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-foreground">{coach.name}</h3>
                  <p className="mt-1 text-sm font-medium text-primary">{coach.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{coach.experience}</p>
                  <Badge variant="outline" className="mt-3">
                    {coach.specialty}
                  </Badge>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-muted-foreground">{coach.bio}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-card py-16 md:py-24">
        <div className="container-page">
          <SectionIntro
            eyebrow="Alur booking"
            title="Sederhana dulu, otomatis nanti."
            desc="MVP paling aman: WhatsApp untuk booking dan chat, Zoom link dikirim setelah jadwal video terkonfirmasi."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {steps.map(([n, title, desc]) => (
              <div key={n} className="rounded-lg border border-border bg-background p-6">
                <div className="font-display text-sm font-bold text-primary">{n}</div>
                <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 md:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <Badge variant="secondary">FAQ</Badge>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Pertanyaan sebelum booking.
            </h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.q} value={`faq-${index}`}>
                <AccordionTrigger className="text-left text-base">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm leading-7 text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="container-page pb-16 md:pb-24">
        <div className="rounded-lg bg-primary px-6 py-12 text-center text-primary-foreground md:px-10 md:py-16">
          <ShieldCheck className="mx-auto h-8 w-8" aria-hidden />
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-bold tracking-tight md:text-4xl">
            Punya CV. Punya strategi. Punya cara menjawab.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-primary-foreground/90 md:text-base">
            Booking sesi mentoring dan bawa proses apply kamu ke langkah yang lebih terarah.
          </p>
          <Button
            disabled
            size="lg"
            variant="secondary"
            className="mt-8 h-12 px-7 text-base opacity-75 cursor-not-allowed"
          >
            Segera Hadir
            <CalendarClock className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </section>
    </>
  );
}

function SectionIntro({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Badge variant="secondary">{eyebrow}</Badge>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-8 text-muted-foreground">{desc}</p>
    </div>
  );
}
