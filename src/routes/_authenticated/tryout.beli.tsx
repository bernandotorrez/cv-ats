/**
 * /tryout/beli — Halaman beli paket tryout.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, CreditCard, MessageCircle, Info, Sparkles } from "lucide-react";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TryoutPackageCard } from "@/components/tryout";
import { supabase } from "@/integrations/supabase/client";
import type { TryoutPackage } from "@/lib/tryout-types";
import { BackButton } from "@/components/ui/back-button";

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

function TryoutBeliPage() {
  const [packages, setPackages] = useState<TryoutPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void supabase
      .from("tryout_packages")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data) setPackages(data as unknown as TryoutPackage[]);
        setLoading(false);
      });
  }, []);

  const lynkBaseUrl = "https://lynk.id/ben-yt-ai/";
  const whatsappNumber = "6285190607141";
  const whatsappGeneral = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    "Halo, saya ingin beli paket tryout SKD di CV Pintar.",
  )}`;

  return (
    <div className="container-page space-y-6 py-5 md:py-8">
      <BackButton />

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="bg-gradient-to-br from-primary via-emerald-600 to-emerald-700 p-6 text-white sm:p-8">
          <Badge variant="secondary" className="mb-3 gap-1.5 bg-white/20 text-white">
            <Sparkles className="h-3 w-3" /> Pilih Paket
          </Badge>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            Beli Kredit Tryout SKD
          </h1>
          <p className="mt-2 max-w-2xl text-sm opacity-90 sm:text-base">
            Pilih paket yang sesuai kebutuhanmu. Aktivasi dilakukan setelah bukti
            transfer diverifikasi admin (1x24 jam) atau otomatis via Lynk.
          </p>
        </div>
      </section>

      {/* Cara pembelian */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-bold">Cara Pembelian</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Step n={1} title="Pilih Paket" desc="Tentukan paket yang kamu mau." />
          <Step n={2} title="Bayar" desc="Lewat Lynk (otomatis) atau transfer manual via WhatsApp." />
          <Step n={3} title="Aktivasi" desc="Kredit langsung aktif & bisa langsung mulai tryout." />
        </div>
      </section>

      {/* Packages */}
      <section>
        <h2 className="mb-4 font-display text-xl font-bold">Paket Tersedia</h2>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {packages.map((pkg) => (
              <TryoutPackageCard
                key={pkg.id}
                slug={pkg.slug}
                name={pkg.name}
                description={pkg.description || ""}
                price={pkg.price}
                credits={pkg.credits}
                features={pkg.features || []}
                featured={pkg.slug === "lengkap"}
                hasPembahasan={pkg.has_pembahasan}
                hasAnalytics={pkg.has_analytics}
                hasLeaderboard={pkg.has_leaderboard}
                lynkUrl={`${lynkBaseUrl}tryout-${pkg.slug}`}
                whatsappNumber={whatsappNumber}
              />
            ))}
          </div>
        )}
      </section>

      {/* Manual transfer help */}
      <section className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-primary">
              <MessageCircle className="h-4 w-4" />
              <h3 className="font-bold">Butuh Bantuan?</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Hubungi kami via WhatsApp untuk transfer manual, kode promo, atau bantuan
              lainnya. Tim kami fast response.
            </p>
            <Button asChild variant="outline" className="mt-4 w-full gap-2">
              <a href={whatsappGeneral} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Chat WhatsApp
              </a>
            </Button>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-primary">
              <CreditCard className="h-4 w-4" />
              <h3 className="font-bold">Sudah Punya Kredit?</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Cek dashboard tryout untuk lihat sisa kredit dan mulai ujian pertama kamu.
            </p>
            <Button asChild className="mt-4 w-full gap-2">
              <Link to={"/tryout" as never}>Ke Dashboard Tryout</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {n}
      </span>
      <div>
        <h3 className="text-sm font-bold">{title}</h3>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}