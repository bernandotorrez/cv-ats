import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  BookOpen,
  Key,
  FileText,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/tools/")({
  head: () =>
    buildSeo({
      title: "AI Tools — CV ATS Indonesia",
      description: "Tools AI untuk optimasi CV dan lamaran kerja.",
      path: "/tools",
      noindex: true,
    }),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      cvId: (search.cvId as string) || undefined,
    };
  },
  component: ToolsIndexPage,
});

interface CvRow {
  id: string;
  title: string;
  template_id: string;
  updated_at: string;
}

function ToolsIndexPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cvs, setCvs] = useState<CvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCvPicker, setShowCvPicker] = useState<{ tool: string } | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    loadCvs();
  }, [user?.id]);

  const loadCvs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cvs")
      .select("id, title, template_id, updated_at")
      .order("updated_at", { ascending: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setCvs(data ?? []);
  };

  const tools = [
    {
      id: "cover-letter",
      icon: BookOpen,
      title: "Cover Letter Generator",
      description: "Buat surat lamaran profesional otomatis dari CV dan job description",
      badge: "AI Powered",
      color: "bg-blue-500/10 text-blue-600 border-blue-200",
      route: "/tools/cover-letter",
    },
    {
      id: "keyword-extractor",
      icon: Key,
      title: "Keyword Extractor",
      description: "Ekstrak keyword penting dari job description untuk optimasi CV ATS",
      badge: "ATS Optimizer",
      color: "bg-purple-500/10 text-purple-600 border-purple-200",
      route: "/tools/keyword",
    },
  ];

  const handleToolClick = (tool: typeof tools[0]) => {
    if (cvs.length === 0) {
      toast.error("Kamu belum punya CV. Buat CV dulu ya!");
      navigate({ to: "/cv" });
      return;
    }
    setShowCvPicker({ tool: tool.id });
  };

  const handleCvSelect = (cvId: string) => {
    if (!showCvPicker) return;
    const tool = tools.find((t) => t.id === showCvPicker.tool);
    if (!tool) return;
    
    // Navigate to the specific tool page with cvId
    if (tool.id === "cover-letter") {
      navigate({ to: "/tools/cover-letter/$cvId", params: { cvId } });
    } else if (tool.id === "keyword-extractor") {
      navigate({ to: "/tools/keyword/$cvId", params: { cvId } });
    }
    
    setShowCvPicker(null);
  };

  return (
    <div className="container-page py-10">
      {/* Header */}
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Dashboard
          </Link>
        </Button>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">AI Tools</h1>
            <p className="text-sm text-muted-foreground">
              Tools AI untuk optimasi CV dan lamaran kerja
            </p>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool)}
            className="group block text-left w-full"
          >
            <Card className={`h-full border-2 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 ${tool.color}`}>
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-sm">
                    <tool.icon className="h-6 w-6" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {tool.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {tool.title}
                </CardTitle>
                <CardDescription className="text-sm">
                  {tool.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm font-medium text-primary">
                  Gunakan Tool
                  <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {/* Info Section */}
      <Card className="mt-8 border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Tips Menggunakan AI Tools</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Pastikan CV kamu sudah terisi dengan lengkap untuk hasil optimal</li>
                <li>• Copy-paste job description lengkap untuk hasil yang lebih akurat</li>
                <li>• Review dan edit hasil AI sebelum digunakan</li>
                <li>• Sesuaikan dengan gaya bahasa dan konteks perusahaan target</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CV Picker Modal */}
      <Dialog open={showCvPicker !== null} onOpenChange={() => setShowCvPicker(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pilih CV</DialogTitle>
            <DialogDescription>
              Pilih CV yang ingin kamu gunakan untuk tool ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Memuat CV...
              </div>
            ) : cvs.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Belum ada CV. Buat CV dulu ya.
              </div>
            ) : (
              cvs.map((cv) => (
                <button
                  key={cv.id}
                  onClick={() => handleCvSelect(cv.id)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{cv.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(cv.updated_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))
            )}
          </div>
          {cvs.length === 0 && !loading && (
            <div className="flex justify-center pb-2">
              <Button asChild size="sm">
                <Link to="/cv">Buat CV Baru</Link>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
