import { createFileRoute } from "@tanstack/react-router";
import { buildSeo } from "@/lib/seo";
import { PageHero } from "@/components/site/PageHero";
import { Mail, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/kontak")({
  head: () =>
    buildSeo({
      title: "Kontak — CV ATS Indonesia",
      description: "Hubungi tim CV ATS Indonesia untuk pertanyaan, kerja sama, atau dukungan akun.",
      path: "/kontak",
    }),
  component: () => (
    <>
      <PageHero eyebrow="Kontak" title="Hubungi kami" description="Tim kami siap bantu di hari kerja, 09.00–18.00 WIB." />
      <div className="container-page max-w-2xl py-16 grid gap-4 sm:grid-cols-2">
        <a href="mailto:halo@cvats.id" className="rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow">
          <Mail className="h-6 w-6 text-primary" />
          <div className="mt-3 font-display font-semibold">Email</div>
          <div className="text-sm text-muted-foreground">halo@cvats.id</div>
        </a>
        <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow">
          <MessageCircle className="h-6 w-6 text-primary" />
          <div className="mt-3 font-display font-semibold">WhatsApp</div>
          <div className="text-sm text-muted-foreground">+62 812-3456-7890</div>
        </a>
      </div>
    </>
  ),
});
