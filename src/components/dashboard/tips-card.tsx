import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

const tips = [
  { tip: "Gunakan kata kerja aktif di deskripsi pengalaman kerjamu", link: "/panduan-cv-ats" },
  { tip: "Sertakan angka & metrik (contoh: meningkatkan penjualan 30%)", link: "/panduan-cv-ats" },
  { tip: "Sesuaikan keyword CV dengan job description target", link: "/blog/keyword-cv-ats" },
  { tip: "Simpan CV dalam format PDF agar layout tetap rapi", link: "/panduan-cv-ats" },
];

export function TipsCard() {
  const randomTip = tips[Math.floor(Math.random() * tips.length)];

  return (
    <Card className="overflow-hidden border-2 border-info/20 bg-gradient-to-br from-info/5 to-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">💡</span>
          <h3 className="font-display font-bold">Tips Cepat</h3>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {tips.map((item, i) => (
            <li key={i}>
              <Link
                to={item.link as any}
                className="flex items-start gap-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground group"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-info/10 text-[10px] font-bold text-info">
                  {i + 1}
                </span>
                <span className="group-hover:underline">{item.tip}</span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
