import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getUserTier } from "@/lib/subscription";
import { Skeleton } from "@/components/ui/skeleton-loading";
import {
  Mic, ArrowLeft, Play, History, MessageSquare, Star, Clock,
  BarChart3, TrendingUp, Loader2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/simulasi-wawancara")({
  head: () => buildSeo({ title: "Simulasi Wawancara — CV Pintar", description: "Latihan interview dengan AI.", path: "/simulasi-wawancara", noindex: true }),
  component: SimulasiWawancaraPage,
});

const LEVELS = ["entry", "mid", "senior", "manager", "director"];
const INDUSTRIES = ["Teknologi", "Finance", "Marketing", "FMCG", "Startup", "BUMN", "Konsultan", "Healthcare", "Pendidikan", "Lainnya"];

interface Session {
  id: string;
  position: string;
  level: string;
  industry: string;
  overall_score: number;
  created_at: string;
}

function SimulasiWawancaraPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState("free");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [position, setPosition] = useState("");
  const [level, setLevel] = useState("mid");
  const [industry, setIndustry] = useState("");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    const t = await getUserTier(user!.id);
    setTier(t);

    const { data } = await (supabase as any)
      .from("interview_sessions")
      .select("id, position, level, industry, overall_score, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(10);

    setSessions(data ?? []);
    setLoading(false);
  };

  const handleStart = async () => {
    if (!position.trim()) {
      toast.error("Masukkan posisi yang dilamar.");
      return;
    }
    setStarting(true);

    // Create session in DB
    const { data, error } = await (supabase as any)
      .from("interview_sessions")
      .insert({
        user_id: user!.id,
        position,
        level,
        industry: industry || null,
        questions: [],
        answers: [],
      })
      .select("id")
      .single();

    setStarting(false);
    if (error) { toast.error("Gagal memulai sesi."); return; }

    navigate({ to: "/simulasi-wawancara/$id", params: { id: data.id } });
  };

  const levelLabel = (l: string) => {
    const map: Record<string, string> = { entry: "Entry", mid: "Mid", senior: "Senior", manager: "Manager", director: "Director" };
    return map[l] ?? l;
  };

  if (loading) {
    return <div className="container-page py-10"><Skeleton className="h-8 w-64 mb-4" /><Skeleton className="h-64" /></div>;
  }

  if (tier !== "pro" && tier !== "pro_plus") {
    return (
      <div className="container-page py-20 text-center">
        <Mic className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 font-display text-2xl font-bold">Fitur Pro</h1>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
          Simulasi Wawancara AI tersedia untuk pengguna Pro. Latih kemampuan interview kamu dengan AI.
        </p>
        <Button asChild className="mt-6">
          <Link to="/harga">Upgrade ke Pro</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold">Simulasi Wawancara AI</h1>
          <p className="text-sm text-muted-foreground">Latihan interview dengan AI. Dapatkan feedback instan untuk setiap jawaban.</p>
        </div>
      </div>

      {/* Setup Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">Mulai Simulasi Baru</CardTitle>
          <CardDescription>Pilih posisi dan level untuk simulasi yang relevan.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="position">Posisi yang Dilamar *</Label>
              <Input
                id="position"
                value={position}
                onChange={e => setPosition(e.target.value)}
                placeholder="Software Engineer"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map(l => <SelectItem key={l} value={l}>{levelLabel(l)} Level</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Industri (opsional)</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger><SelectValue placeholder="Pilih industri" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Industri</SelectItem>
                  {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="mt-4" onClick={handleStart} disabled={starting}>
            {starting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Play className="h-4 w-4 mr-1.5" />}
            Mulai Simulasi
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Riwayat Simulasi</CardTitle>
            <CardDescription>Sesi simulasi yang sudah kamu lakukan.</CardDescription>
          </div>
          <History className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mic className="mx-auto h-8 w-8 mb-2" />
              <p>Belum ada sesi simulasi. Mulai latihan pertama kamu!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <Link key={s.id} to="/simulasi-wawancara/$id" params={{ id: s.id }}>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10">
                        <Mic className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{s.position}</p>
                        <p className="text-xs text-muted-foreground">
                          {levelLabel(s.level)} {s.industry ? `· ${s.industry}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {s.overall_score != null && (
                        <Badge className={s.overall_score >= 75 ? "bg-green-100 text-green-700" : s.overall_score >= 50 ? "bg-warning/20 text-warning" : "bg-red-100 text-red-700"}>
                          Skor: {s.overall_score}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(s.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
