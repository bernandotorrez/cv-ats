import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
  Users,
} from "lucide-react";

import { buildSeo } from "@/lib/seo";
import { CtaBanner, Eyebrow, PageHero, SectionHeader } from "@/components/site/marketing";

export const Route = createFileRoute("/kontak")({
  head: () =>
    buildSeo({
      title: "Kontak CV Pintar: Bantuan Akun, CV & Pembayaran",
      description:
        "Hubungi tim CV Pintar untuk bantuan akun, CV, kerja sama, private mentoring, dan pertanyaan layanan.",
      path: "/kontak",
    }),
  component: KontakPage,
});

const WHATSAPP_NUMBER = "6285190607141";
const EMAIL = "cs@cvpintar.web.id";

const waLink = (text?: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

const contactChannels = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "0851-9060-7141",
    description:
      "Untuk pertanyaan cepat, bantuan pembayaran, atau daftar tunggu private mentoring.",
    href: waLink(),
    action: "Chat WhatsApp",
    event: "click_whatsapp",
    external: true,
  },
  {
    icon: Mail,
    label: "Email support",
    value: EMAIL,
    description:
      "Paling pas untuk pertanyaan akun, invoice, kerja sama, atau detail yang butuh jejak tertulis.",
    href: `mailto:${EMAIL}`,
    action: "Kirim email",
    event: "click_email",
    external: false,
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
  "Daftar tunggu private mentoring",
  "Konfirmasi pembayaran",
  "Template dan export PDF",
  "Kerja sama komunitas",
];

function NewTabHint() {
  return <span className="sr-only"> (membuka tab baru)</span>;
}

function KontakPage() {
  return (
    <div className="overflow-hidden bg-white">
      <PageHero
        eyebrow={
          <>
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            Kontak CV Pintar
          </>
        }
        title={
          <>
            Ada yang perlu dibantu?{" "}
            <span className="text-green-700">Ceritakan saja, kami dengarkan.</span>
          </>
        }
        desc="Butuh bantuan CV, akun, pembayaran, atau kerja sama? Tim CV Pintar siap bantu dengan bahasa yang jelas dan langkah yang praktis."
        aside={<TopicPicker />}
      >
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <a
            href={waLink()}
            target="_blank"
            rel="noreferrer"
            data-analytics-event="click_whatsapp"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-green-700 px-8 text-base font-bold text-white shadow-lg shadow-green-700/25 transition-colors hover:bg-green-800"
          >
            <MessageCircle aria-hidden="true" className="h-5 w-5" />
            Chat Sekarang
            <NewTabHint />
          </a>
          <a
            href={`mailto:${EMAIL}`}
            data-analytics-event="click_email"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-8 text-base font-semibold text-gray-800 transition-colors hover:border-green-700 hover:bg-green-50 hover:text-green-800"
          >
            <Send aria-hidden="true" className="h-5 w-5" />
            Kirim Email
          </a>
        </div>
        <p className="mt-6 flex items-center gap-2 text-sm font-medium text-gray-700">
          <Clock aria-hidden="true" className="h-4 w-4 text-green-700" />
          Senin–Jumat, 09.00–18.00 WIB
        </p>
      </PageHero>

      {/* Channels */}
      <section aria-labelledby="channel-heading" className="pb-20 lg:pb-28">
        <div className="container-page">
          <h2 id="channel-heading" className="sr-only">
            Saluran kontak
          </h2>
          <ul className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            {contactChannels.map((channel, i) => (
              <li key={channel.label}>
                <a
                  href={channel.href}
                  data-analytics-event={channel.event}
                  target={channel.external ? "_blank" : undefined}
                  rel={channel.external ? "noreferrer" : undefined}
                  className={`group flex h-full flex-col rounded-3xl p-7 transition-all hover:-translate-y-1 hover:shadow-xl ${
                    i === 0
                      ? "bg-green-800 text-white"
                      : "border border-gray-200 bg-white hover:border-green-600"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        i === 0 ? "bg-white/15 text-yellow-300" : "bg-green-100 text-green-800"
                      }`}
                    >
                      <channel.icon aria-hidden="true" className="h-6 w-6" />
                    </span>
                    {i === 0 && (
                      <span className="rounded-full bg-yellow-300 px-2.5 py-1 text-xs font-bold text-gray-900">
                        Paling cepat
                      </span>
                    )}
                  </div>
                  <h3 className="mt-5 font-display text-xl font-bold">{channel.label}</h3>
                  <p
                    className={`mt-1 text-lg font-semibold ${i === 0 ? "text-yellow-200" : "text-green-800"}`}
                  >
                    {channel.value}
                  </p>
                  <p
                    className={`mt-3 flex-1 text-sm leading-relaxed ${i === 0 ? "text-green-50" : "text-gray-600"}`}
                  >
                    {channel.description}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold">
                    {channel.action}
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    />
                    {channel.external && <NewTabHint />}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Response notes */}
      <section aria-labelledby="respons-heading" className="bg-gray-50 py-20 lg:py-28">
        <div className="container-page">
          <SectionHeader
            id="respons-heading"
            eyebrow="Cara kami membantu"
            title="Cepat, jelas, dan dibalas manusia."
          />
          <ul className="grid gap-5 md:grid-cols-3">
            {responseNotes.map((note) => (
              <li key={note.title} className="rounded-2xl border border-gray-200 bg-white p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-800">
                  <note.icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold text-gray-900">{note.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{note.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Office */}
      <section aria-labelledby="kantor-heading" className="py-20 lg:py-28">
        <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Eyebrow>Kantor digital</Eyebrow>
            <h2
              id="kantor-heading"
              className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl"
            >
              Dibangun dari Indonesia, untuk perjalanan karier yang lebih percaya diri.
            </h2>
          </div>
          <div className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-800">
              <MapPin aria-hidden="true" className="h-6 w-6" />
            </span>
            <div>
              <p className="font-display text-lg font-bold text-gray-900">Indonesia</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                Layanan berbasis online. Support dan konsultasi dilakukan melalui email, WhatsApp,
                chat, atau video meeting.
              </p>
              <p className="mt-3 text-sm text-gray-600">
                Mau upgrade?{" "}
                <Link to="/harga" className="font-bold text-green-800 underline underline-offset-4">
                  Lihat paket Starter & Pro
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <CtaBanner
        title="Mau langsung mulai? Buat CV pertamamu gratis."
        desc="Tidak perlu menunggu balasan — template ATS dan AI siap dipakai sekarang."
        cta="Mulai Gratis"
      />
    </div>
  );
}

function TopicPicker() {
  return (
    <div className="relative mx-auto w-full max-w-md px-2 sm:px-0">
      <div
        aria-hidden="true"
        className="absolute inset-0 translate-x-3 translate-y-3 rotate-2 rounded-3xl bg-green-700"
      />
      <div className="relative rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
        <h2 className="font-display text-xl font-extrabold text-gray-900">
          Pilih topik, langsung chat
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-gray-600">
          Pesan WhatsApp terisi otomatis. Tambahkan email akun & kendalamu supaya lebih cepat
          dibantu.
        </p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {quickTopics.map((topic) => (
            <li key={topic}>
              <a
                href={waLink(`Halo CV Pintar, saya butuh bantuan soal: ${topic}.`)}
                target="_blank"
                rel="noreferrer"
                data-analytics-event="click_whatsapp"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 transition-colors hover:border-green-700 hover:bg-green-50 hover:text-green-800"
              >
                {topic}
                <NewTabHint />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
