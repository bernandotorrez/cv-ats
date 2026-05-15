import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/kontak")({
  head: () =>
    buildSeo({
      title: "Kontak - CV Pintar",
      description:
        "Hubungi tim CV Pintar untuk bantuan akun, CV, kerja sama, private coaching, dan pertanyaan layanan.",
      path: "/kontak",
    }),
  component: KontakPage,
});

const contactChannels = [
  {
    icon: Mail,
    label: "Email support",
    value: "mail.bernand@gmail.com",
    description:
      "Paling pas untuk pertanyaan akun, invoice, kerja sama, atau detail yang butuh jejak tertulis.",
    href: "mailto:mail.bernand@gmail.com",
    action: "Kirim email",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "0851-9060-7141",
    description:
      "Untuk pertanyaan cepat, konfirmasi pembayaran manual, upload bukti transfer, atau jadwal private coaching.",
    href: "https://wa.me/6285190607141",
    action: "Chat WhatsApp",
  },
];

const responseNotes = [
  {
    icon: Clock,
    title: "Jam respons",
    text: "Senin sampai Jumat, 09.00-18.00 WIB. Pesan di luar jam kerja tetap kami antrekan.",
  },
  {
    icon: BadgeCheck,
    title: "Balasan manusia",
    text: "Kami bantu dengan konteks, bukan template kosong. Ceritakan kendalamu, kami urai satu per satu.",
  },
  {
    icon: Users,
    title: "Untuk kolaborasi",
    text: "Terbuka untuk kampus, komunitas karier, perusahaan, dan HR yang ingin bantu talenta Indonesia.",
  },
];

const quickTopics = [
  "Akun dan login",
  "Review CV by HR Expert AI",
  "Simulasi wawancara AI",
  "Private coaching",
  "Konfirmasi pembayaran",
  "Template dan export PDF",
  "Kerja sama komunitas",
];

function KontakPage() {
  return (
    <main className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-primary-soft/70 to-transparent" />
        <div className="container-page relative grid gap-10 py-16 sm:py-20 lg:grid-cols-[1.04fr_0.96fr] lg:items-end lg:py-24">
          <div className="max-w-3xl">
            <Badge className="mb-5 gap-2 rounded-full px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Kontak CV Pintar
            </Badge>
            <h1 className="max-w-4xl text-balance font-display text-4xl font-bold leading-tight tracking-normal text-foreground sm:text-5xl lg:text-6xl">
              Ada yang perlu dibantu? Ceritakan saja, kami dengarkan.
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              Butuh bantuan CV, akun, private coaching, atau kerja sama? Tim CV Pintar siap bantu
              dengan bahasa yang jelas dan langkah yang praktis.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-lg">
                <a href="https://wa.me/6285190607141" target="_blank" rel="noreferrer">
                  Chat sekarang
                  <MessageCircle className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-lg">
                <a href="mailto:mail.bernand@gmail.com">
                  Kirim email
                  <Send className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          <Card className="border-border/80 bg-card/95 shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Biar cepat kami bantu</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Sertakan email akun, halaman yang bermasalah, dan satu kalimat tujuanmu. Makin
                    jelas konteksnya, makin cepat solusinya.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-3">
                {quickTopics.map((topic) => (
                  <div
                    key={topic}
                    className="flex items-center gap-3 rounded-lg border border-border/70 bg-background px-3 py-2.5 text-sm"
                  >
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="font-medium text-foreground">{topic}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container-page py-14 sm:py-16">
        <div className="grid gap-4 md:grid-cols-2">
          {contactChannels.map((channel) => (
            <a
              key={channel.label}
              href={channel.href}
              target={channel.href.startsWith("http") ? "_blank" : undefined}
              rel={channel.href.startsWith("http") ? "noreferrer" : undefined}
              className="group rounded-xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <channel.icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <h2 className="mt-5 font-display text-xl font-semibold">{channel.label}</h2>
              <p className="mt-1 font-medium text-primary">{channel.value}</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{channel.description}</p>
              <span className="mt-5 inline-flex text-sm font-semibold text-foreground">
                {channel.action}
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="border-y border-border/70 bg-muted/25">
        <div className="container-page grid gap-4 py-12 md:grid-cols-3">
          {responseNotes.map((note) => (
            <Card key={note.title} className="border-border/80 bg-background">
              <CardContent className="p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <note.icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 font-display text-lg font-semibold">{note.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{note.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container-page py-14 sm:py-16">
        <div className="grid gap-6 rounded-2xl border border-border bg-card p-5 sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Badge variant="secondary" className="rounded-full">
              Kantor digital
            </Badge>
            <h2 className="mt-4 max-w-xl font-display text-2xl font-bold sm:text-3xl">
              Dibangun dari Indonesia, untuk perjalanan karier yang lebih percaya diri.
            </h2>
          </div>
          <div className="grid gap-3 text-sm leading-6 text-muted-foreground sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-background p-4">
              <MapPin className="mb-3 h-5 w-5 text-primary" />
              <p className="font-semibold text-foreground">Indonesia</p>
              <p className="mt-1">
                Layanan berbasis online. Support dan konsultasi dilakukan melalui email, WhatsApp,
                chat, atau video meeting.
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background p-4">
              <Sparkles className="mb-3 h-5 w-5 text-primary" />
              <p className="font-semibold text-foreground">Mau langsung mulai?</p>
              <p className="mt-1">
                Buat CV pertamamu gratis. Untuk upgrade, transfer manual lalu konfirmasi lewat
                WhatsApp dengan bukti transfer.
              </p>
              <Button asChild variant="link" className="mt-2 h-auto p-0">
                <Link to="/register">
                  Mulai gratis
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
