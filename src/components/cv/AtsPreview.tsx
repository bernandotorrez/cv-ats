import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import type { CvData } from "@/lib/cv-types";

interface Props {
  data: CvData;
}

export function AtsPreview({ data }: Props) {
  const text = useMemo(() => {
    const lines: string[] = [];
    const { personal, experiences, educations, skills, languages, certificates } = data;

    if (personal.fullName) lines.push(personal.fullName.toUpperCase());
    if (personal.headline) lines.push(personal.headline);
    lines.push("");
    if (personal.summary) {
      lines.push("RINGKASAN PROFIL");
      lines.push(personal.summary);
      lines.push("");
    }
    if (experiences.length > 0) {
      lines.push("PENGALAMAN KERJA");
      experiences.forEach((e) => {
        lines.push(
          `${e.position} — ${e.company} (${e.startDate} – ${e.current ? "Sekarang" : e.endDate})`,
        );
        if (e.location) lines.push(`  Lokasi: ${e.location}`);
        if (e.description) lines.push(`  ${e.description}`);
        lines.push("");
      });
    }
    if (educations.length > 0) {
      lines.push("PENDIDIKAN");
      educations.forEach((ed) => {
        lines.push(
          `${ed.degree}${ed.field ? `, ${ed.field}` : ""} — ${ed.school} (${ed.startDate} – ${ed.endDate})`,
        );
        if (ed.description) lines.push(`  ${ed.description}`);
        lines.push("");
      });
    }
    if (skills.length > 0) {
      lines.push("KEAHLIAN");
      lines.push(skills.map((s) => s.name).join(", "));
      lines.push("");
    }
    if (languages.length > 0) {
      lines.push("BAHASA");
      lines.push(languages.map((l) => `${l.name} (${l.level})`).join(", "));
      lines.push("");
    }
    if (certificates.length > 0) {
      lines.push("SERTIFIKAT");
      certificates.forEach((c) => {
        lines.push(`${c.name} — ${c.issuer} (${c.date})`);
      });
      lines.push("");
    }
    lines.push("KONTAK");
    const contact = [personal.email, personal.phone, personal.location, personal.linkedin]
      .filter(Boolean)
      .join(" | ");
    if (contact) lines.push(contact);

    return lines.join("\n");
  }, [data]);

  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Eye className="h-4 w-4" /> ATS Preview
        </CardTitle>
        <Badge variant="secondary" className="text-xs">
          Plain Text
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          Seperti inilah kira-kira CV kamu dibaca oleh Applicant Tracking System (ATS). Format plain
          text, tanpa styling, tabel, atau gambar.
        </p>
        <pre className="bg-muted/50 rounded-lg p-4 text-xs font-mono whitespace-pre-wrap max-h-96 overflow-y-auto border border-border">
          {text || "Belum ada data CV."}
        </pre>
      </CardContent>
    </Card>
  );
}
