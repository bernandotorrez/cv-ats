import type { TemplateSlug } from "@/components/site/TemplatePreview";

const FREE_TEMPLATES = ["jakarta", "bandung"];
const PRO_TEMPLATES = ["semarang", "surabaya", "malang", "ubud", "bogor"];

export const templatesData = [
  {
    slug: "ubud" as TemplateSlug,
    name: "Ubud",
    desc: "Desain dua kolom kreatif dengan sidebar kontras gelap yang elegan. Sangat cocok untuk menonjolkan portfolio, keahlian kreatif, dan personal branding.",
    bestFor: "Creative, Design & Art",
    tags: ["Kreatif", "Modern", "Sidebar"],
    type: "Kreatif",
  },
  {
    slug: "bogor" as TemplateSlug,
    name: "Bogor",
    desc: "Elegan dengan aksen cokelat dan layout foto overlap.",
    bestFor: "Creative & Professional",
    tags: ["Kreatif", "Elegan", "Overlap"],
    type: "Kreatif",
  },
  {
    slug: "malang" as TemplateSlug,
    name: "Malang",
    desc: "Desain dua kolom kreatif dengan sidebar warna soft. Menarik perhatian rekruter namun tetap terbaca rapi oleh ATS.",
    bestFor: "Creative & Marketing",
    tags: ["Kreatif", "Marketing", "Sidebar"],
    type: "Kreatif",
  },
  {
    slug: "bali" as TemplateSlug,
    name: "Bali",
    desc: "Rapi, segar, dan mudah dipindai. Cocok untuk creative, hospitality, dan peran yang butuh kesan hangat.",
    bestFor: "Creative & hospitality",
    tags: ["Kreatif", "Hospitality", "Modern"],
    type: "Kreatif",
  },
  {
    slug: "makassar" as TemplateSlug,
    name: "Makassar",
    desc: "Informasi kontak dan skill langsung terlihat. Enak untuk HR, admin, operations, dan support role.",
    bestFor: "HR & admin",
    tags: ["HR", "Admin", "Sidebar"],
    type: "Kreatif",
  },
  {
    slug: "jakarta" as TemplateSlug,
    name: "Jakarta",
    desc: "Tegas tanpa berlebihan. Pilihan aman untuk corporate, management trainee, dan posisi profesional.",
    bestFor: "Corporate & management",
    tags: ["Korporat", "Formal", "Manager"],
    type: "ATS-Friendly",
  },
  {
    slug: "bandung" as TemplateSlug,
    name: "Bandung",
    desc: "Modern, ringan, dan terasa gesit. Cocok untuk tech, startup, product, dan digital marketing.",
    bestFor: "Tech & startup",
    tags: ["Tech", "Startup", "Fresh"],
    type: "ATS-Friendly",
  },
  {
    slug: "medan" as TemplateSlug,
    name: "Medan",
    desc: "Struktur formal dengan ritme baca yang tenang. Pas untuk finance, banking, dan analyst role.",
    bestFor: "Finance & analyst",
    tags: ["Finance", "Banking", "Corporate"],
    type: "ATS-Friendly",
  },
  {
    slug: "semarang" as TemplateSlug,
    name: "Semarang",
    desc: "Lebih dinamis tanpa kehilangan kesan profesional. Bagus untuk project manager dan operations.",
    bestFor: "PM & operations",
    tags: ["PM", "Operations", "Dynamic"],
    type: "ATS-Friendly",
  },
  {
    slug: "surabaya" as TemplateSlug,
    name: "Surabaya",
    desc: "Bold, presisi, dan siap untuk peran lapangan. Cocok untuk supply chain, manufacturing, dan engineering.",
    bestFor: "Supply chain & engineering",
    tags: ["Supply Chain", "Manufacturing", "Industrial"],
    type: "ATS-Friendly",
  },
  {
    slug: "yogya" as TemplateSlug,
    name: "Yogyakarta",
    desc: "Tipografi bersih dengan karakter halus. Kuat untuk content, brand, design, dan komunikasi.",
    bestFor: "Content & communication",
    tags: ["Kreatif", "Content", "Modern"],
    type: "Kreatif",
  },
].map((template) => {
  const isFree = FREE_TEMPLATES.includes(template.slug);
  const isPro = PRO_TEMPLATES.includes(template.slug);

  return {
    ...template,
    isFree,
    isPro,
    badge: isFree ? "Gratis" : isPro ? "Pro" : "Starter",
  };
});
