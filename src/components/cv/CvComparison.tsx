import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CvPreview } from "@/components/cv/CvPreview";
import { TEMPLATES, type CvData, type TemplateId } from "@/lib/cv-types";
import { cn } from "@/lib/utils";
import { ArrowLeftRight, CheckCircle2, FileText, Lock, Sparkles, Target } from "lucide-react";

interface CvVersion {
  id: string;
  title: string;
  template_id: string;
  data: CvData;
  updated_at: string;
}

interface Props {
  cvs: CvVersion[];
  canCompare: boolean;
}

type CvMetrics = {
  score: number;
  filledSections: number;
  sectionCount: number;
  wordCount: number;
  skills: string[];
  experiences: number;
  educations: number;
  hasSummary: boolean;
  hasContact: boolean;
};

export function CvComparison({ cvs, canCompare }: Props) {
  const [leftId, setLeftId] = useState<string>(cvs[0]?.id ?? "");
  const [rightId, setRightId] = useState<string>(cvs[1]?.id ?? "");

  useEffect(() => {
    if (!leftId && cvs[0]?.id) setLeftId(cvs[0].id);
    if (!rightId && cvs[1]?.id) setRightId(cvs[1].id);
  }, [cvs, leftId, rightId]);

  if (!canCompare) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-warning/10 text-warning">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="font-semibold">Fitur Pro</h3>
          <p className="max-w-xs text-sm text-muted-foreground">
            CV Comparison tersedia untuk pengguna Pro. Bandingkan 2 versi CV side-by-side untuk
            optimasi maksimal.
          </p>
          <Button asChild size="sm" variant="outline">
            <Link to="/harga">Upgrade ke Pro</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (cvs.length < 2) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <ArrowLeftRight className="h-6 w-6" />
          </div>
          <h3 className="font-semibold">Butuh 2+ CV</h3>
          <p className="text-sm text-muted-foreground">Buat minimal 2 CV untuk membandingkannya.</p>
        </CardContent>
      </Card>
    );
  }

  const left = cvs.find((cv) => cv.id === leftId);
  const right = cvs.find((cv) => cv.id === rightId);
  const leftMetrics = left ? getCvMetrics(left.data) : null;
  const rightMetrics = right ? getCvMetrics(right.data) : null;
  const insight =
    left && right && leftMetrics && rightMetrics
      ? getComparisonInsight(leftMetrics, rightMetrics)
      : [];

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowLeftRight className="h-4 w-4" /> Bandingkan CV
        </CardTitle>
        <CardDescription>Pilih 2 CV untuk dibandingkan side-by-side.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <Select value={leftId} onValueChange={setLeftId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih CV pertama" />
            </SelectTrigger>
            <SelectContent>
              {cvs
                .filter((cv) => cv.id !== rightId)
                .map((cv) => (
                  <SelectItem key={cv.id} value={cv.id}>
                    {cv.title}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <div className="hidden items-center text-muted-foreground md:flex">
            <ArrowLeftRight className="h-4 w-4" />
          </div>

          <Select value={rightId} onValueChange={setRightId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih CV kedua" />
            </SelectTrigger>
            <SelectContent>
              {cvs
                .filter((cv) => cv.id !== leftId)
                .map((cv) => (
                  <SelectItem key={cv.id} value={cv.id}>
                    {cv.title}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {!left || !right || !leftMetrics || !rightMetrics ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Pilih dua CV yang berbeda untuk mulai membandingkan.
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              <MetricSummary cv={left} metrics={leftMetrics} />
              <div className="rounded-lg border border-border bg-muted/30 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Insight cepat
                </div>
                <div className="mt-4 space-y-3">
                  {insight.map((item) => (
                    <div key={item} className="flex gap-2 text-sm leading-6 text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <MetricSummary cv={right} metrics={rightMetrics} />
            </div>

            <div className="grid gap-4 border-t border-border pt-6 lg:grid-cols-2">
              <ComparisonPanel
                cv={left}
                other={right}
                metrics={leftMetrics}
                otherMetrics={rightMetrics}
              />
              <ComparisonPanel
                cv={right}
                other={left}
                metrics={rightMetrics}
                otherMetrics={leftMetrics}
              />
            </div>

            <div className="grid gap-4 border-t border-border pt-6 lg:grid-cols-2">
              <PreviewPanel cv={left} />
              <PreviewPanel cv={right} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MetricSummary({ cv, metrics }: { cv: CvVersion; metrics: CvMetrics }) {
  const templateName =
    TEMPLATES.find((template) => template.id === cv.template_id)?.name ?? cv.template_id;

  return (
    <div className="rounded-lg border border-border p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge variant="secondary">{cv.title}</Badge>
          <p className="mt-2 text-xs text-muted-foreground">Template {templateName}</p>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-bold text-foreground">{metrics.score}</div>
          <p className="text-xs text-muted-foreground">skor isi</p>
        </div>
      </div>
      <Progress value={metrics.score} className="mt-4 h-2" />
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <MiniStat label="Bagian" value={`${metrics.filledSections}/${metrics.sectionCount}`} />
        <MiniStat label="Kata" value={String(metrics.wordCount)} />
        <MiniStat label="Skill" value={String(metrics.skills.length)} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/50 px-2 py-3">
      <div className="font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-muted-foreground">{label}</div>
    </div>
  );
}

function ComparisonPanel({
  cv,
  other,
  metrics,
  otherMetrics,
}: {
  cv: CvVersion;
  other: CvVersion;
  metrics: CvMetrics;
  otherMetrics: CvMetrics;
}) {
  const uniqueSkills = metrics.skills.filter((skill) => !otherMetrics.skills.includes(skill));
  const sharedSkills = metrics.skills.filter((skill) => otherMetrics.skills.includes(skill));

  return (
    <div className="rounded-lg border border-border p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-bold text-foreground">{cv.title}</h3>
        <Badge variant={metrics.score >= otherMetrics.score ? "default" : "outline"}>
          {metrics.score >= otherMetrics.score ? "Lebih siap" : `Banding: ${other.title}`}
        </Badge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Signal
          icon={FileText}
          label="Ringkasan"
          value={metrics.hasSummary ? "Ada" : "Belum kuat"}
          good={metrics.hasSummary}
        />
        <Signal
          icon={Target}
          label="Kontak"
          value={metrics.hasContact ? "Lengkap" : "Perlu dicek"}
          good={metrics.hasContact}
        />
        <Signal
          icon={FileText}
          label="Pengalaman"
          value={`${metrics.experiences} entri`}
          good={metrics.experiences > 0}
        />
        <Signal
          icon={Target}
          label="Pendidikan"
          value={`${metrics.educations} entri`}
          good={metrics.educations > 0}
        />
      </div>

      <div className="mt-5 space-y-3">
        <SkillGroup
          label="Skill unik di CV ini"
          skills={uniqueSkills}
          empty="Belum ada skill pembeda."
        />
        <SkillGroup
          label="Skill yang sama"
          skills={sharedSkills}
          empty="Belum ada overlap skill."
        />
      </div>
    </div>
  );
}

function Signal({
  icon: Icon,
  label,
  value,
  good,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  good: boolean;
}) {
  return (
    <div className="rounded-md bg-muted/40 p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className={cn("h-3.5 w-3.5", good ? "text-primary" : "text-warning")} />
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SkillGroup({ label, skills, empty }: { label: string; skills: string[]; empty: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {skills.length > 0 ? (
          skills.slice(0, 10).map((skill) => (
            <Badge key={skill} variant="outline" className="font-normal capitalize">
              {skill}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">{empty}</span>
        )}
      </div>
    </div>
  );
}

function PreviewPanel({ cv }: { cv: CvVersion }) {
  return (
    <div>
      <Badge variant="secondary" className="mb-2">
        Preview {cv.title}
      </Badge>
      <div className="h-[620px] overflow-auto rounded-lg border border-border bg-muted/20 p-3">
        <div className="origin-top-left" style={{ transform: "scale(0.52)", width: "210mm" }}>
          <CvPreview data={cv.data} template={cv.template_id as TemplateId} />
        </div>
      </div>
    </div>
  );
}

function getCvMetrics(data: CvData): CvMetrics {
  const summary = data.personal.summary.trim();
  const contactFields = [data.personal.email, data.personal.phone, data.personal.location].filter(
    Boolean,
  );
  const sections = [
    data.personal.fullName.trim(),
    data.personal.headline.trim(),
    summary,
    data.experiences.length > 0 ? "experiences" : "",
    data.educations.length > 0 ? "educations" : "",
    data.skills.length > 0 ? "skills" : "",
    data.languages.length > 0 ? "languages" : "",
    data.certificates.length > 0 ? "certificates" : "",
  ];
  const filledSections = sections.filter(Boolean).length;
  const text = [
    data.personal.fullName,
    data.personal.headline,
    data.personal.summary,
    ...data.experiences.flatMap((item) => [item.company, item.position, item.description]),
    ...data.educations.flatMap((item) => [item.school, item.degree, item.field, item.description]),
    ...data.skills.map((item) => item.name),
    ...data.languages.map((item) => item.name),
    ...data.certificates.flatMap((item) => [item.name, item.issuer]),
  ]
    .filter(Boolean)
    .join(" ");
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const skills = data.skills
    .map((skill) => skill.name.trim().toLowerCase())
    .filter(Boolean)
    .filter((skill, index, arr) => arr.indexOf(skill) === index);
  const score = Math.min(
    100,
    Math.round(
      filledSections * 10 +
        Math.min(wordCount / 4, 30) +
        Math.min(skills.length * 2, 14) +
        contactFields.length * 2,
    ),
  );

  return {
    score,
    filledSections,
    sectionCount: sections.length,
    wordCount,
    skills,
    experiences: data.experiences.length,
    educations: data.educations.length,
    hasSummary: summary.length >= 80,
    hasContact: contactFields.length >= 3,
  };
}

function getComparisonInsight(left: CvMetrics, right: CvMetrics) {
  const scoreDiff = left.score - right.score;
  const wordDiff = left.wordCount - right.wordCount;
  const skillDiff = left.skills.length - right.skills.length;

  return [
    scoreDiff === 0
      ? "Kedua CV punya skor isi yang seimbang."
      : scoreDiff > 0
        ? "CV kiri terlihat lebih lengkap secara struktur dan isi."
        : "CV kanan terlihat lebih lengkap secara struktur dan isi.",
    wordDiff === 0
      ? "Panjang konten kedua CV relatif sama."
      : wordDiff > 0
        ? "CV kiri lebih panjang; pastikan tetap padat dan mudah dipindai."
        : "CV kanan lebih panjang; pastikan tetap padat dan mudah dipindai.",
    skillDiff === 0
      ? "Jumlah skill di kedua CV seimbang."
      : skillDiff > 0
        ? "CV kiri punya lebih banyak keyword skill untuk diuji ke job description."
        : "CV kanan punya lebih banyak keyword skill untuk diuji ke job description.",
  ];
}
