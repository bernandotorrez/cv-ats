import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CvPreview } from "@/components/cv/CvPreview";
import { TEMPLATES, type CvData, type TemplateId, emptyCv } from "@/lib/cv-types";
import { ArrowLeftRight, Lock } from "lucide-react";

interface CvVersion {
  id: string;
  title: string;
  template_id: string;
  data: CvData;
  updated_at: string;
}

interface Props {
  cvs: CvVersion[];
  tier: string;
}

export function CvComparison({ cvs, tier }: Props) {
  const [leftId, setLeftId] = useState<string>("");
  const [rightId, setRightId] = useState<string>("");

  if (tier !== "pro") {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-warning/10 text-warning">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="font-semibold">Fitur Pro</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            CV Comparison tersedia untuk pengguna Pro. Bandingkan 2 versi CV side-by-side untuk optimasi maksimal.
          </p>
          <Button asChild size="sm" variant="outline">
            <a href="/harga">Upgrade ke Pro</a>
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
          <p className="text-sm text-muted-foreground">
            Buat minimal 2 CV untuk membandingkannya.
          </p>
        </CardContent>
      </Card>
    );
  }

  const left = cvs.find((c) => c.id === leftId);
  const right = cvs.find((c) => c.id === rightId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4" /> Bandingkan CV
        </CardTitle>
        <CardDescription>
          Pilih 2 CV untuk dibandingkan side-by-side.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Select value={leftId} onValueChange={setLeftId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih CV pertama" />
              </SelectTrigger>
              <SelectContent>
                {cvs
                  .filter((c) => c.id !== rightId)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({TEMPLATES.find((t) => t.id === c.template_id)?.name})
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center text-muted-foreground">
            <ArrowLeftRight className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <Select value={rightId} onValueChange={setRightId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih CV kedua" />
              </SelectTrigger>
              <SelectContent>
                {cvs
                  .filter((c) => c.id !== leftId)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({TEMPLATES.find((t) => t.id === c.template_id)?.name})
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {left && right && (
          <div className="grid grid-cols-2 gap-4 border-t border-border pt-6">
            <div>
              <Badge variant="secondary" className="mb-2">{left.title}</Badge>
              <div className="overflow-auto rounded border border-border bg-muted/20">
                <div style={{ transform: "scale(0.42)", transformOrigin: "top left", width: "210mm" }}>
                  <CvPreview data={left.data} template={left.template_id as TemplateId} />
                </div>
              </div>
            </div>
            <div>
              <Badge variant="secondary" className="mb-2">{right.title}</Badge>
              <div className="overflow-auto rounded border border-border bg-muted/20">
                <div style={{ transform: "scale(0.42)", transformOrigin: "top left", width: "210mm" }}>
                  <CvPreview data={right.data} template={right.template_id as TemplateId} />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
