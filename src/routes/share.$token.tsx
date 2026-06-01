import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  BriefcaseBusiness,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  Languages,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Printer,
  Share2,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { WhatsAppShare } from "@/components/share/WhatsAppShare";
import { CvPreview, cvPrintStyles } from "@/components/cv/CvPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { emptyCv, type CvData, type CvExperience, type TemplateId } from "@/lib/cv-types";
import { buildSeo, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/share/$token")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("cvs")
      .select("id, user_id, title, template_id, data, created_at, updated_at, share_token")
      .eq("share_token", params.token)
      .eq("share_enabled", true)
      .single();

    if (error || !data) throw notFound();

    const cvData = { ...emptyCv, ...(data.data as unknown as CvData) };

    return {
      title: data.title,
      templateId: data.template_id as TemplateId,
      cvData,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      cvId: data.id,
      userId: data.user_id,
      fullName: cvData.personal.fullName,
      headline: cvData.personal.headline,
      token: params.token,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "CV tidak ditemukan" }], links: [], scripts: [] };
    return buildSeo({
      title: `${loaderData.fullName || "Portfolio"} - CV & Portfolio`,
      description: `Portfolio dan CV profesional ${loaderData.fullName || ""} ${loaderData.headline ? `untuk ${loaderData.headline}` : ""}. Dibuat dengan CV Pintar.`,
      path: `/share/${loaderData.token}`,
      noindex: true,
    });
  },
  component: SharePage,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl font-bold text-foreground">CV tidak ditemukan</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Link portfolio ini tidak valid atau sudah dinonaktifkan oleh pemilik.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Kembali ke Beranda</Link>
        </Button>
      </div>
    </div>
  ),
});

function SharePage() {
  const { title, templateId, cvData, createdAt, updatedAt, cvId, userId, fullName, token } =
    Route.useLoaderData();
  const [copied, setCopied] = useState(false);
  const shareUrl = `${SITE_URL}/share/${token}`;
  const portfolioStats = useMemo(() => getPortfolioStats(cvData), [cvData]);
  const topSkills = cvData.skills.slice(0, 12);
  const featuredExperiences = cvData.experiences.slice(0, 3);
  const contactLinks = getContactLinks(cvData);

  useEffect(() => {
    if (!cvId || !userId) return;
    void supabase.from("cv_analytics").insert({
      cv_id: cvId,
      user_id: userId,
      event_type: "view",
    });
  }, [cvId, userId]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyShareLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link portfolio disalin");
    void supabase.from("cv_analytics").insert({
      cv_id: cvId,
      user_id: userId,
      event_type: "share_link",
    });
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="min-h-screen bg-background">
      <style>{cvPrintStyles}</style>

      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur print:hidden">
        <div className="container-page flex items-center justify-between gap-3 py-3">
          <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="h-4 w-4" aria-hidden />
            </span>
            <span className="hidden font-display text-sm font-bold text-foreground sm:inline">
              CV Pintar
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopyShareLink}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copied ? "Tersalin" : "Salin link"}</span>
            </Button>
            <WhatsAppShare shareUrl={shareUrl} fullName={fullName} size="sm" />
            <Button asChild size="sm">
              <Link to="/register">Buat CV</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="print:block">
        <section className="overflow-hidden bg-muted/35 print:hidden">
          <div className="container-page grid gap-8 py-10 md:grid-cols-[1fr_360px] md:items-center md:py-14 lg:py-16">
            <div>
              <Badge className="gap-1.5 bg-info text-info-foreground hover:bg-info">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Public portfolio
              </Badge>
              <h1 className="mt-5 max-w-3xl break-words font-display text-4xl font-extrabold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                {fullName || title || "Portfolio kandidat"}
              </h1>
              {cvData.personal.headline && (
                <p className="mt-3 max-w-2xl text-lg font-semibold text-primary sm:text-xl">
                  {cvData.personal.headline}
                </p>
              )}
              {cvData.personal.summary && (
                <p className="mt-5 max-w-2xl whitespace-pre-wrap text-base leading-8 text-muted-foreground">
                  {cvData.personal.summary}
                </p>
              )}

              <div className="mt-7 flex flex-wrap gap-2">
                {cvData.personal.location && (
                  <Badge variant="secondary" className="gap-1.5">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {cvData.personal.location}
                  </Badge>
                )}
                <Badge variant="secondary" className="gap-1.5">
                  <BriefcaseBusiness className="h-3.5 w-3.5" aria-hidden />
                  {portfolioStats.experienceLabel}
                </Badge>
                <Badge variant="secondary" className="gap-1.5">
                  <Award className="h-3.5 w-3.5" aria-hidden />
                  {cvData.skills.length} skill
                </Badge>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button onClick={handlePrint} size="lg" className="h-12 gap-2">
                  <Download className="h-4 w-4" aria-hidden />
                  Download / Cetak CV
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 gap-2">
                  <a href="#cv-preview">
                    Lihat CV lengkap
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </a>
                </Button>
              </div>
            </div>

            <Card className="rounded-lg border-border bg-card shadow-xl shadow-primary/10">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Snapshot kandidat
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {portfolioStats.cards.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg border border-border bg-background p-4"
                    >
                      <item.icon className="h-5 w-5 text-primary" aria-hidden />
                      <p className="mt-3 font-display text-2xl font-bold text-foreground">
                        {item.value}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-lg bg-primary p-4 text-primary-foreground">
                  <p className="text-sm font-semibold">Diperbarui</p>
                  <p className="mt-1 text-sm text-primary-foreground/90">
                    {formatDate(updatedAt || createdAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_360px] lg:items-start print:hidden">
          <div className="space-y-6">
            {topSkills.length > 0 && (
              <PortfolioSection
                icon={Award}
                title="Keahlian utama"
                description="Skill yang paling relevan dari CV ini."
              >
                <div className="flex flex-wrap gap-2">
                  {topSkills.map((skill) => (
                    <Badge key={skill.id} variant="outline" className="rounded-full px-3 py-1">
                      {skill.name}
                      {skill.level ? ` - ${skill.level}` : ""}
                    </Badge>
                  ))}
                </div>
              </PortfolioSection>
            )}

            {featuredExperiences.length > 0 && (
              <PortfolioSection
                icon={BriefcaseBusiness}
                title="Pengalaman pilihan"
                description="Ringkasan pengalaman terbaru yang bisa dibaca cepat oleh recruiter."
              >
                <div className="space-y-4">
                  {featuredExperiences.map((experience) => (
                    <ExperienceCard key={experience.id} experience={experience} />
                  ))}
                </div>
              </PortfolioSection>
            )}

            {cvData.educations.length > 0 && (
              <PortfolioSection
                icon={GraduationCap}
                title="Pendidikan"
                description="Latar belakang pendidikan kandidat."
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {cvData.educations.map((education) => (
                    <div key={education.id} className="rounded-lg border border-border bg-card p-4">
                      <p className="font-semibold text-foreground">{education.school}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[education.degree, education.field].filter(Boolean).join(" - ")}
                      </p>
                      <p className="mt-2 text-xs font-medium text-primary">
                        {formatDateRange(education.startDate, education.endDate)}
                      </p>
                    </div>
                  ))}
                </div>
              </PortfolioSection>
            )}

            {(cvData.certificates.length > 0 || cvData.languages.length > 0) && (
              <PortfolioSection
                icon={BadgeIcon}
                title="Sertifikat & bahasa"
                description="Bukti pendukung yang memperkuat profil kandidat."
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {cvData.certificates.map((certificate) => (
                    <div
                      key={certificate.id}
                      className="rounded-lg border border-border bg-card p-4"
                    >
                      <Award className="h-4 w-4 text-primary" aria-hidden />
                      <p className="mt-3 font-semibold text-foreground">{certificate.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{certificate.issuer}</p>
                      {certificate.date && (
                        <p className="mt-2 text-xs font-medium text-primary">{certificate.date}</p>
                      )}
                    </div>
                  ))}
                  {cvData.languages.map((language) => (
                    <div key={language.id} className="rounded-lg border border-border bg-card p-4">
                      <Languages className="h-4 w-4 text-primary" aria-hidden />
                      <p className="mt-3 font-semibold text-foreground">{language.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{language.level}</p>
                    </div>
                  ))}
                </div>
              </PortfolioSection>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20">
            <Card className="rounded-lg border-border bg-card">
              <CardContent className="p-5">
                <p className="font-display text-lg font-bold text-foreground">Kontak & aksi</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Gunakan detail yang tersedia di CV atau bagikan portfolio ini ke recruiter.
                </p>
                <div className="mt-5 grid gap-2">
                  {contactLinks.map((contact) => (
                    <Button
                      key={contact.label}
                      asChild
                      variant="outline"
                      className="justify-start gap-2"
                    >
                      <a
                        href={contact.href}
                        target={contact.external ? "_blank" : undefined}
                        rel={contact.external ? "noreferrer" : undefined}
                      >
                        <contact.icon className="h-4 w-4" aria-hidden />
                        {contact.label}
                      </a>
                    </Button>
                  ))}
                  <Button
                    onClick={handleCopyShareLink}
                    variant="outline"
                    className="justify-start gap-2"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                    {copied ? "Link tersalin" : "Salin link portfolio"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-border bg-muted/45">
              <CardContent className="p-5">
                <p className="font-display text-lg font-bold text-foreground">
                  Dibuat dengan CV Pintar
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Buat CV ATS friendly, aktifkan share link, lalu kirim portfolio profesional dalam
                  satu URL.
                </p>
                <Button asChild className="mt-5 w-full gap-2">
                  <Link to="/register">
                    Buat CV gratis
                    <ExternalLink className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </section>

        <section id="cv-preview" className="bg-muted/35 py-10 print:bg-white print:py-0">
          <div className="container-page print:contents">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between print:hidden">
              <div>
                <Badge variant="secondary">CV lengkap</Badge>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">
                  Preview CV ATS friendly
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Versi ini bisa dicetak atau disimpan sebagai PDF oleh penerima link.
                </p>
              </div>
              <Button onClick={handlePrint} variant="outline" className="gap-2">
                <Printer className="h-4 w-4" aria-hidden />
                Cetak
              </Button>
            </div>

            <div className="mx-auto max-w-[210mm] bg-white shadow-xl print:max-w-none print:shadow-none">
              <div className="cv-print-area p-0">
                <CvPreview data={cvData} template={templateId} />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function PortfolioSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ExperienceCard({ experience }: { experience: CvExperience }) {
  return (
    <article className="rounded-lg border border-border bg-background p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">{experience.position}</h3>
          <p className="mt-1 text-sm font-semibold text-primary">{experience.company}</p>
          {experience.location && (
            <p className="mt-1 text-xs text-muted-foreground">{experience.location}</p>
          )}
        </div>
        <Badge variant="secondary" className="w-fit">
          {formatDateRange(
            experience.startDate,
            experience.current ? "Sekarang" : experience.endDate,
          )}
        </Badge>
      </div>
      {experience.description && (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
          {experience.description}
        </p>
      )}
    </article>
  );
}

function getPortfolioStats(data: CvData) {
  const years = estimateExperienceYears(data.experiences);
  return {
    experienceLabel:
      years > 0 ? `${years}+ tahun pengalaman` : `${data.experiences.length} pengalaman`,
    cards: [
      { icon: BriefcaseBusiness, value: data.experiences.length, label: "Pengalaman" },
      { icon: Award, value: data.skills.length, label: "Skill" },
      { icon: GraduationCap, value: data.educations.length, label: "Pendidikan" },
      { icon: Languages, value: data.languages.length, label: "Bahasa" },
    ],
  };
}

function getContactLinks(data: CvData) {
  const links: { icon: LucideIcon; label: string; href: string; external?: boolean }[] = [];
  if (data.personal.email) {
    links.push({ icon: Mail, label: "Email", href: `mailto:${data.personal.email}` });
  }
  if (data.personal.phone) {
    links.push({ icon: Phone, label: "Telepon", href: `tel:${data.personal.phone}` });
  }
  const linkedin = normalizeUrl(data.personal.linkedin);
  if (linkedin) {
    links.push({ icon: Linkedin, label: "LinkedIn", href: linkedin, external: true });
  }
  const website = normalizeUrl(data.personal.website);
  if (website) {
    links.push({ icon: Globe, label: "Website", href: website, external: true });
  }
  return links;
}

function normalizeUrl(value?: string) {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function estimateExperienceYears(experiences: CvExperience[]) {
  const totalMonths = experiences.reduce((sum, item) => {
    const start = parseMonth(item.startDate);
    const end = item.current ? new Date() : parseMonth(item.endDate);
    if (!start || !end || end < start) return sum;
    return (
      sum +
      Math.max(
        1,
        (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth(),
      )
    );
  }, 0);
  return Math.floor(totalMonths / 12);
}

function parseMonth(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value?: string) {
  if (!value) return "Belum tersedia";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateRange(start?: string, end?: string) {
  return [start, end].filter(Boolean).join(" - ") || "Periode tidak dicantumkan";
}

const BadgeIcon = Award;
