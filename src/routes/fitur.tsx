import { createFileRoute, Link } from "@tanstack/react-router";
import { buildSeo } from "@/lib/seo";
import { PageHero } from "@/components/site/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Target, Bot, ShieldCheck, FileText, Download,
  Languages, GitCompare, Share2, Wand2, BookOpen, FileSearch,
  UserCircle, Crown, Heart, Clock, Award, TrendingUp, CheckCircle2,
  ArrowRight, Users, Star, Briefcase, Mic, Gift, Search,
} from "lucide-react";

export const Route = createFileRoute("/fitur")({
  head: () =>
    buildSeo({
      title: "Fitur — CV ATS Indonesia",
      description:
        "Saran AI Bahasa Indonesia, scoring CV otomatis, template ATS friendly, cover letter generator, dan banyak fitur lain untuk pencari kerja Indonesia.",
      path: "/fitur",
      keywords: "fitur cv builder, ai cv indonesia, scoring cv ats, cover letter ai",
    }),
  component: FiturPage,
});

const groups = [
  {
    title: "Pembuatan CV",
    items: [
      { icon: FileText, name: "Template ATS Friendly", desc: "Format single-column standar yang teruji lolos screening ATS perusahaan Indonesia & multinasional." },
      { icon: Wand2, name: "Editor Live Preview", desc: "Form di kiri, hasil CV di kanan — perubahan langsung terlihat." },
      { icon: Download, name: "Export PDF", desc: "PDF rapi, ringan, dan terbaca sempurna oleh ATS maupun rekruter." },
    ],
  },
  {
    title: "AI Assistant",
    items: [
      { icon: Bot, name: "Saran Pengisian AI", desc: "Tombol 'Sarankan' di tiap section — AI bantu menulis ringkasan, deskripsi pengalaman, & skill." },
      { icon: Target, name: "CV Scoring", desc: "Cek kecocokan CV dengan job description: keyword, skill, format, & saran perbaikan instan." },
      { icon: UserCircle, name: "Review CV by HR Expert", desc: "Analisis mendalam dari HR profesional 20+ tahun. Dapat feedback kekuatan, kelemahan, quick wins, & benchmark industri.", badge: "Starter" },
      { icon: BookOpen, name: "Panduan AI Step-by-Step", desc: "Pemandu chat AI yang menemani pengisian — cocok untuk fresh graduate." },
      { icon: FileSearch, name: "Keyword Extractor", desc: "Paste lowongan kerja, AI ekstrak skill & keyword wajib yang harus ada di CV." },
      { icon: Sparkles, name: "Cover Letter Generator", desc: "Bikin surat lamaran personal dari data CV & lowongan target." },
    ],
  },
  {
    title: "Pencarian Kerja",
    items: [
      { icon: Briefcase, name: "Pelacak Lamaran", desc: "Catat & lacak status lamaran dalam satu dashboard. Lihat progress di kanban board.", badge: "Baru" },
      { icon: Search, name: "Lowongan Pekerjaan", desc: "Temukan lowongan terbaru yang sesuai dengan skill dan level kamu.", badge: "Baru" },
      { icon: Mic, name: "Simulasi Wawancara AI", desc: "Latihan interview dengan AI — dapatkan pertanyaan, jawab, dan terima feedback.", badge: "Pro+" },
      { icon: Gift, name: "Program Referral", desc: "Ajak teman daftar & upgrade, dapatkan 1 bulan Starter gratis.", badge: "Baru" },
    ],
  },
  {
    title: "Produktivitas",
    items: [
      { icon: GitCompare, name: "Bandingkan Versi", desc: "Bandingkan 2 versi CV side-by-side untuk lihat mana yang lebih kuat (Pro)." },
      { icon: Share2, name: "Share Link Publik", desc: "Bagikan CV lewat link read-only, bisa di-nonaktifkan kapan saja." },
      { icon: Languages, name: "Mode Preview ATS", desc: "Lihat CV-mu sebagaimana terbaca oleh mesin ATS (plain text)." },
      { icon: ShieldCheck, name: "Aman & Privasi Terjaga", desc: "Data terenkripsi, akses dibatasi RLS, tidak dijual ke pihak ketiga." },
    ],
  },
];

const socialProof = [
  { icon: Users, stat: "5.000+", label: "Pengguna Aktif" },
  { icon: FileText, stat: "10.000+", label: "CV Dibuat" },
  { icon: TrendingUp, stat: "92%", label: "Lolos Screening ATS" },
  { icon: Star, stat: "4.9/5", label: "Rating Pengguna" },
];

function FiturPage() {
  return (
    <>
      

      {/* HASIL NYATA */}
      <section className="bg-gradient-to-b from-primary/5 via-primary/10 to-transparent py-16 md:py-20">
        <div className="container-page text-center max-w-2xl mx-auto">
          <Badge variant="secondary">Hasil Nyata</Badge>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Fitur Kami = Lebih Banyak Interview
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
            92% pengguna lolos screening ATS. Rata-rata <strong className="text-foreground">3x lebih banyak</strong> panggilan interview.
            Setiap fitur kami bangun untuk satu hal: mengantarmu ke meja wawancara.
          </p>
          <br/>
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
        </div>
      </section>

      <div className="container-page space-y-16 py-16">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="font-display text-2xl font-bold md:text-3xl">{g.title}</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((it) => (
                <Card key={it.name} className={it.badge ? 'relative border-amber-200' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                        <it.icon className="h-5 w-5" />
                      </div>
                      {it.badge && (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          <Crown className="h-3 w-3 mr-1" />
                          {it.badge}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-display text-lg font-semibold">{it.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{it.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* FINAL CTA */}
      <section className="container-page pb-20 text-center">
        <div className="rounded-3xl bg-primary px-6 py-14 text-primary-foreground md:px-12 md:py-16">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Fitur bagus cuma berguna kalau kamu pakai
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-primary-foreground/85">
            Coba sendiri. Gratis. Tanpa kartu kredit. Dalam 10 menit kamu sudah punya CV siap kirim.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8 h-12 px-8 text-base">
            <Link to="/register">Mulai Gratis Sekarang <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </>
  );
}
