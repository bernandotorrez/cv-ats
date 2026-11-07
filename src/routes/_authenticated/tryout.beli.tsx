/**
 * /tryout/beli — Beli paket tryout (checkout QRIS).
 * Harga & link pembayaran dibuat server (payment-create); client hanya
 * mengirim product key `tryout:<slug>`.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  CreditCard,
  MessageCircle,
  Minus,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Zap,
} from "lucide-react";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PackageGridSkeleton, TryoutPackageCard, TryoutPageHeader } from "@/components/tryout";
import { supabase } from "@/integrations/supabase/client";
import { type TryoutPackage } from "@/lib/tryout-types";
import { useCheckout } from "@/lib/payment";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tryout/beli")({
  head: () =>
    buildSeo({
      title: "Beli Paket Tryout SKD - CV Pintar",
      description: "Beli paket tryout SKD satuan atau lengkap.",
      path: "/tryout/beli",
      noindex: true,
    }),
  component: TryoutBeliPage,
});

const WHATSAPP_NUMBER = "6285190607141";

const STEPS = [
  {
    icon: ShoppingBag,
    title: "Pilih paket",
    desc: "Satuan untuk mencoba, Lengkap untuk latihan rutin.",
  },
  { icon: QrCode, title: "Bayar via QRIS", desc: "Scan dari m-banking atau e-wallet apa pun." },
  {
    icon: Zap,
    title: "Kredit aktif otomatis",
    desc: "Kembali ke dashboard dan langsung mulai tryout.",
  },
];

const FAQ = [
  {
    q: "Berapa lama kredit aktif setelah bayar?",
    a: "Biasanya beberapa detik setelah pembayaran terkonfirmasi. Halaman pembayaran akan mengarahkanmu kembali dan status order diperbarui otomatis.",
  },
  {
    q: "Apakah kredit punya masa berlaku?",
    a: "Kredit dari pembelian tidak memiliki masa kedaluwarsa. Gunakan kapan saja sesuai jadwal belajarmu.",
  },
  {
    q: "Sudah bayar tapi kredit belum masuk?",
    a: "Tunggu beberapa menit lalu muat ulang dashboard tryout. Jika masih belum masuk, hubungi kami via WhatsApp dengan menyertakan nomor order.",
  },
  {
    q: "Bisa beli lebih dari satu paket?",
    a: "Bisa. Kredit dari semua paket dijumlahkan dan dipakai berurutan dari yang paling lama.",
  },
];

function TryoutBeliPage() {
  const [packages, setPackages] = useState<TryoutPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const { checkout, pending } = useCheckout();

  useEffect(() => {
    void supabase
      .from("tryout_packages")
      .select(
        "id, slug, name, description, price, credits, features, has_pembahasan, has_analytics, has_leaderboard, is_active, sort_order",
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setPackages((data as unknown as TryoutPackage[]) || []);
        setLoading(false);
      });
  }, []);

  // Harga per tryout termahal sebagai acuan badge "Hemat x%".
  const basePerCredit = packages.reduce(
    (max, p) => (p.credits > 0 ? Math.max(max, p.price / p.credits) : max),
    0,
  );
  const bestValue = packages.reduce<TryoutPackage | null>(
    (best, p) =>
      p.credits > 0 && (!best || p.price / p.credits < best.price / best.credits) ? p : best,
    null,
  );

  const whatsappHelp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Halo, saya butuh bantuan pembelian paket tryout SKD di CV Pintar.",
  )}`;

  return (
    <div className="container-page space-y-8 py-5 md:py-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link to={"/tryout" as never}>
          <ArrowLeft className="h-4 w-4" aria-hidden /> Dashboard tryout
        </Link>
      </Button>

      <TryoutPageHeader
        eyebrow="Paket tryout"
        icon={<CreditCard className="h-3.5 w-3.5" aria-hidden />}
        title="Pilih paket latihanmu"
        description="Bayar sekali via QRIS, kredit langsung aktif. 1 kredit = 1 tryout SKD lengkap 110 soal."
      />

      <ul className="flex flex-wrap gap-2" aria-label="Keunggulan pembayaran">
        {["Bayar via QRIS", "Kredit aktif otomatis", "Kredit tanpa masa kedaluwarsa"].map((t) => (
          <li
            key={t}
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold shadow-sm"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden /> {t}
          </li>
        ))}
      </ul>

      <section aria-label="Daftar paket">
        {loading ? (
          <PackageGridSkeleton />
        ) : packages.length === 0 ? (
          <p className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
            Paket belum tersedia. Hubungi kami via WhatsApp untuk pembelian.
          </p>
        ) : (
          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2 md:items-stretch">
            {packages.map((pkg) => {
              const perCredit = pkg.credits > 0 ? pkg.price / pkg.credits : pkg.price;
              const savings =
                basePerCredit > 0 ? Math.round((1 - perCredit / basePerCredit) * 100) : 0;
              const featured = bestValue?.id === pkg.id && packages.length > 1;
              return (
                <div key={pkg.id} className={featured ? "order-first md:order-none" : undefined}>
                  <TryoutPackageCard
                    slug={pkg.slug}
                    name={pkg.name}
                    description={pkg.description || ""}
                    price={pkg.price}
                    credits={pkg.credits}
                    features={pkg.features || []}
                    featured={featured}
                    savingsPercent={savings}
                    onBuy={() => checkout(`tryout:${pkg.slug}`)}
                    buying={pending === `tryout:${pkg.slug}`}
                    buyDisabled={!!pending}
                    whatsappNumber={WHATSAPP_NUMBER}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {!loading && packages.length > 1 && <ComparisonTable packages={packages} />}

      <section
        aria-labelledby="cara-beli"
        className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6"
      >
        <h2 id="cara-beli" className="font-display text-lg font-bold">
          Cara pembelian
        </h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex items-start gap-3">
              <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" aria-hidden />
                <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {i + 1}
                </span>
              </span>
              <div>
                <p className="text-sm font-semibold">{s.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="mb-3 font-display text-lg font-bold">Pertanyaan seputar pembayaran</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {FAQ.map((f, i) => (
              <AccordionItem
                key={f.q}
                value={`faq-${i}`}
                className="rounded-xl border bg-card px-4 shadow-sm"
              >
                <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <div className="h-fit rounded-2xl border bg-card p-5 shadow-sm">
          <p className="flex items-center gap-2 font-semibold text-primary">
            <MessageCircle className="h-4 w-4" aria-hidden /> Butuh bantuan?
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Transfer manual, kode promo, atau kendala pembayaran — tim kami siap membantu lewat
            WhatsApp.
          </p>
          <Button asChild variant="outline" className="mt-4 w-full gap-2 rounded-xl">
            <a href={whatsappHelp} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" aria-hidden /> Chat WhatsApp
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}

/** Perbandingan fitur yang benar-benar dibedakan sistem per paket. */
function ComparisonTable({ packages }: { packages: TryoutPackage[] }) {
  const rows: Array<{ label: string; value: (p: TryoutPackage) => boolean | string }> = [
    { label: "Jumlah tryout", value: (p) => `${p.credits}x` },
    { label: "110 soal TWK · TIU · TKP, timer 100 menit", value: () => true },
    { label: "Skor instan & passing grade resmi", value: () => true },
    { label: "Analisis hasil & rekomendasi belajar", value: () => true },
    { label: "Pembahasan detail tiap soal", value: (p) => p.has_pembahasan },
    { label: "Mode latihan ulang soal salah", value: (p) => p.has_pembahasan },
    { label: "Leaderboard nasional", value: (p) => p.has_leaderboard },
  ];
  return (
    <section
      aria-labelledby="banding"
      className="overflow-hidden rounded-2xl border bg-card shadow-sm"
    >
      <h2 id="banding" className="border-b px-5 py-4 font-display text-lg font-bold">
        Bandingkan paket
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th scope="col" className="px-5 py-3 font-semibold text-muted-foreground">
                Fitur
              </th>
              {packages.map((p) => (
                <th key={p.id} scope="col" className="px-5 py-3 text-center font-bold">
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b last:border-0">
                <th scope="row" className="px-5 py-3 text-left font-normal text-foreground">
                  {r.label}
                </th>
                {packages.map((p) => {
                  const v = r.value(p);
                  return (
                    <td key={p.id} className="px-5 py-3 text-center">
                      {typeof v === "string" ? (
                        <span className="font-bold">{v}</span>
                      ) : v ? (
                        <Check
                          className="mx-auto h-5 w-5 text-emerald-600 dark:text-emerald-400"
                          aria-label="Termasuk"
                        />
                      ) : (
                        <Minus
                          className={cn("mx-auto h-5 w-5 text-muted-foreground/60")}
                          aria-label="Tidak termasuk"
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
