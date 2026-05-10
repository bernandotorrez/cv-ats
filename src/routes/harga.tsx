import { createFileRoute, Link } from "@tanstack/react-router";
import { buildSeo } from "@/lib/seo";
import { PageHero } from "@/components/site/PageHero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Zap,
  Sparkles,
  Star,
  Shield,
  Users,
  TrendingUp,
  Gift,
  ArrowRight,
  CreditCard,
  Smartphone,
  Lock,
  FileText,
  Crown,
  BookOpen
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const tiers = [
  {
    name: "Free",
    price: "Rp 0",
    period: "selamanya",
    desc: "Untuk eksplorasi & bikin CV pertamamu tanpa biaya.",
    highlight: "Tidak kartu kredit",
    features: [
      "1 CV aktif",
      "2 template basic",
      "10x saran AI / bulan",
      "3x scoring / bulan",
      "10x perbaiki teks / bulan",
      "Export PDF (watermark kecil)",
    ],
    cta: "Mulai Gratis Sekarang",
    ctaVariant: "outline" as const,
  },
  {
    name: "Starter",
    price: "Rp 19.000",
    period: "/bulan",
    badge: "Paling Populer",
    desc: "Pas untuk pencari kerja aktif yang butuh hasil maksimal.",
    highlight: "Setara 1 kopi kekinian",
    features: [
      "3 CV aktif",
      "Semua template premium",
      "50x saran AI / bulan",
      "10x scoring / bulan",
      "50x perbaiki teks / bulan",
      "Tanpa watermark sama sekali",
      "Cover letter AI generator",
      "Keyword extractor AI",
      "Review CV by HR Expert",
    ],
    cta: "Pilih Paket Starter",
    ctaVariant: "default" as const,
    popular: true,
  },
  {
    name: "Pro",
    price: "Rp 49.000",
    period: "/bulan",
    badge: "Best Value",
    desc: "Untuk profesional yang serius naikkan level karir.",
    highlight: "Semua fitur unlimited",
    features: [
      "CV unlimited — buat sesuka hati",
      "AI suggestions unlimited",
      "Scoring unlimited",
      "Perbaiki teks AI unlimited",
      "Review CV by HR Expert",
      "Keyword extractor unlimited",
      "Bandingkan versi CV",
      "Tips interview premium",
      "Dukungan prioritas 24/7",
    ],
    cta: "Pilih Paket Pro",
    ctaVariant: "outline" as const,
  },
];

const socialProof = [
  { icon: Users, stat: "5.000+", label: "Pengguna Aktif" },
  { icon: FileText, stat: "10.000+", label: "CV Dibuat" },
  { icon: TrendingUp, stat: "92%", label: "Lolos Screening ATS" },
  { icon: Star, stat: "4.9/5", label: "Rating Pengguna" },
];

const faqs = [
  { q: "Apakah ada uji coba gratis?", a: "Paket Free bisa dipakai selamanya tanpa batas waktu. Tidak perlu kartu kredit sama sekali. Untuk Starter & Pro, kamu bisa berhenti kapan saja tanpa penalti biaya." },
  { q: "Metode pembayaran apa saja?", a: "Kami menerima QRIS, e-wallet (GoPay, OVO, Dana, ShopeePay), dan transfer VA bank lokal (BCA, Mandiri, BNI, BRI). Semua aman & terenkripsi." },
  { q: "Bisa ganti atau berhenti paket kapan saja?", a: "Tentu! Upgrade langsung aktif setelah pembayaran. Downgrade berlaku di periode tagihan berikutnya. Berhenti? Tidak ada biaya tersembunyi." },
  { q: "Bagaimana jika tidak cocok? Apakah bisa refund?", a: "Kami berikan refund 100% dalam 7 hari pertama jika kamu merasa tidak cocok. Tanpa pertanyaan. Kepuasan kamu adalah prioritas kami." },
  { q: "Apakah CV saya aman dan privasi?", a: "Ya! Semua data dienkripsi dan tidak pernah dibagikan ke pihak ketiga. Kamu bisa hapus semua data kapan saja." },
];

export const Route = createFileRoute("/harga")({
  pendingComponent: () => <div className="container-page py-20"><div className="animate-pulse space-y-4"><div className="h-64 bg-muted rounded-xl" /><div className="grid md:grid-cols-3 gap-4"><div className="h-96 bg-muted rounded-xl" /><div className="h-96 bg-muted rounded-xl" /><div className="h-96 bg-muted rounded-xl" /></div></div></div>,
  head: () =>
    buildSeo({
      title: "Harga — CV ATS Indonesia",
      description:
        "Mulai gratis selamanya. Paket berbayar mulai Rp 19.000/bulan dengan AI saran, scoring, dan cover letter unlimited.",
      path: "/harga",
      keywords: "harga cv builder, cv ats murah, langganan cv ai indonesia",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Product",
          name: "CV ATS Indonesia Subscription",
          offers: tiers.map((t) => ({
            "@type": "Offer",
            name: t.name,
            price: t.name === "Free" ? "0" : t.name === "Starter" ? "19000" : "49000",
            priceCurrency: "IDR",
            availability: "https://schema.org/InStock",
          })),
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
      ],
    }),
  component: HargaPage,
});

function HargaPage() {
  return (
    <>
      <PageHero
        eyebrow="Harga Transparan"
        title="Investasi Kecil, Peluang Besar"
        description="Tidak ada biaya tersembunyi. Tidak perlu kartu kredit untuk mulai. Berhenti kapan saja, tanpa drama."
      />
      
      <div className="container-page py-12 space-y-16">
        {/* Social Proof Stats */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-primary font-medium uppercase tracking-wide">Dipercaya Pencaker Indonesia</p>
            <h2 className="text-2xl md:text-3xl font-bold">Hasil yang Sudah Terbukti</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {socialProof.map((item, i) => (
              <Card key={i} className="text-center py-6">
                <CardContent>
                  <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-3">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-primary">{item.stat}</div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="space-y-6">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold">
              Pilih Paket yang Tepat untukmu
            </h2>
            <p className="text-muted-foreground text-lg">
              Mulai dari gratis, upgrade kapan siap. Tidak ada tekanan, tidak ada kontrak mengikat.
            </p>
          </div>
          <br />
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {tiers.map((t) => (
              <Card 
                key={t.name} 
                className={`relative transition-all duration-300 ${
                  t.popular 
                    ? "border-2 border-primary shadow-2xl shadow-primary/20 scale-105" 
                    : "hover:shadow-lg hover:-translate-y-1"
                }`}
              >
                {t.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className={`${t.popular ? "bg-primary" : "bg-amber-500"} text-white px-4 py-1 text-sm shadow-lg`}>
                      {t.badge}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="flex items-center justify-center gap-2 text-xl">
                    {t.popular && <Crown className="w-5 h-5 text-primary" />}
                    {t.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{t.desc}</p>
                  
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl md:text-5xl font-bold">{t.price}</span>
                      <span className="text-muted-foreground">{t.period}</span>
                    </div>
                    <p className="flex items-center justify-center gap-1 mt-2 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-4 h-4" />
                      {t.highlight}
                    </p>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <Button 
                    asChild 
                    size="lg" 
                    className={`w-full ${t.popular ? "shadow-lg shadow-primary/30" : ""}`}
                    variant={t.ctaVariant}
                  >
                    <Link to="/register" className="flex items-center justify-center gap-2">
                      {t.cta}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                  
                  <ul className="space-y-3">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-green-500 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Comparison Table */}
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold">Perbandingan Fitur</h2>
            <p className="text-muted-foreground mt-2">Lihat detail perbedaan setiap paket</p>
          </div>
          
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-semibold">Fitur</th>
                    <th className="text-center p-4 font-semibold">Free</th>
                    <th className="text-center p-4 font-semibold bg-primary/5">Starter</th>
                    <th className="text-center p-4 font-semibold">Pro</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    ["Jumlah CV aktif", "1", "3", "Unlimited"],
                    ["Template tersedia", "2 basic", "Semua", "Semua + eksklusif"],
                    ["AI suggestions/bulan", "10x", "50x", "Unlimited"],
                    ["ATS Scoring/bulan", "3x", "10x", "Unlimited"],
                    ["Perbaiki Teks AI/bulan", "10x", "50x", "Unlimited"],
                    ["Export PDF", "Watermark", "Bersih", "Bersih + priority"],
                    ["Cover Letter AI", "—", "✓", "✓"],
                    ["Keyword Extractor", "—", "10x/bulan", "Unlimited"],
                    ["Review CV by HR Expert", "—", "✓", "✓"],
                    ["Bandingkan versi CV", "—", "—", "✓"],
                    ["Tips interview premium", "—", "—", "✓"],
                    ["Support prioritas", "—", "—", "✓"],
                  ].map((row, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium">{row[0]}</td>
                      <td className="p-4 text-center">{row[1]}</td>
                      <td className="p-4 text-center bg-primary/5 font-medium">{row[2]}</td>
                      <td className="p-4 text-center">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* Money Back Guarantee */}
        <section className="space-y-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200">
            <CardContent className="p-8 text-center">
              <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/50 w-fit mx-auto mb-4">
                <Shield className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-green-800 dark:text-green-400 mb-3">
                Jaminan 7 Hari Uang Kembali
              </h2>
              <p className="text-green-700/80 dark:text-green-400/80 max-w-xl mx-auto text-lg">
                Tidak puas dengan fitur premium? Kami refund 100% tanpa pertanyaan dalam 7 hari pertama. 
                <span className="font-semibold"> Risikonya nol.</span>
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Payment Methods */}
        <section className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">Pembayaran mudah & aman</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {[
                { icon: Smartphone, label: "QRIS" },
                { icon: CreditCard, label: "E-Wallet" },
                { icon: Lock, label: "VA Bank" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="space-y-6">
          <Card className="bg-gradient-to-br from-primary via-primary/90 to-blue-600 border-0 text-white">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="p-4 rounded-full bg-white/20 w-fit mx-auto mb-6">
                <Sparkles className="w-12 h-12" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Buatkan CV ATS-mu Sekarang!
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Tak perlu repot-edit manual. AI kami otomatis menyarankan keyword, mengoreksi struktur, dan memberi skor ATS sebelum kamu kirim lamaran.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/cv" 
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary font-semibold rounded-xl hover:bg-white/90 transition-all hover:scale-105 shadow-lg"
                >
                  <Zap className="w-5 h-5" />
                  Buat CV dengan AI
                </a>
                <a 
                  href="/template" 
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
                >
                  <BookOpen className="w-5 h-5" />
                  Lihat Templates
                </a>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ */}
        <section className="space-y-6 max-w-3xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold">Pertanyaan Umum</h2>
            <p className="text-muted-foreground mt-2">Masih punya pertanyaan? Hubungi kami</p>
          </div>
          
          <Accordion type="single" collapsible className="bg-card rounded-xl border">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`f-${i}`} className="px-4">
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  <span className="font-medium">{f.q}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </>
  );
}
