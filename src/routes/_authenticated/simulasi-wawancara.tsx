import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
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
import { cn } from "@/lib/utils";
import {
  Mic, ArrowLeft, Play, History, Star, Clock, Sparkles,
  BarChart3, TrendingUp, Loader2, Zap, MessageSquare,
  Target, Brain, ArrowRight, Trophy, FileText,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/simulasi-wawancara")({
  head: () => buildSeo({ title: "Simulasi Wawancara — CV Pintar", description: "Latihan interview dengan AI.", path: "/simulasi-wawancara", noindex: true }),
  component: SimulasiWawancaraPage,
});

const LEVELS = ["entry", "mid", "senior", "manager", "director"];
const INDUSTRIES = ["Teknologi", "Finance", "Marketing", "FMCG", "Startup", "BUMN", "Konsultan", "Healthcare", "Pendidikan", "Lainnya"];
const QUICK_POSITIONS = ["Software Engineer", "Product Manager", "Data Analyst", "UI/UX Designer", "Marketing Manager", "Business Development", "HR Manager", "Finance Analyst"];

interface Session {
  id: string;
  position: string;
  level: string;
  industry: string;
  overall_score: number;
  questions: any[];
  created_at: string;
}

function SimulasiWawancaraPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
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

  if (pathname !== "/simulasi-wawancara") {
    return <Outlet />;
  }

  const loadData = async () => {
    const t = await getUserTier(user!.id);
    setTier(t);

    const { data } = await (supabase as any)
      .from("interview_sessions")
      .select("id, position, level, industry, overall_score, questions, created_at")
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

  const scoredSessions = sessions.filter(s => s.overall_score != null);
  const avgScore = scoredSessions.length > 0
    ? Math.round(scoredSessions.reduce((sum, s) => sum + s.overall_score, 0) / scoredSessions.length)
    : 0;
  const bestScore = scoredSessions.length > 0
    ? Math.max(...scoredSessions.map(s => s.overall_score))
    : 0;
  const totalQuestions = sessions.reduce((sum, s) => sum + (s.questions?.length || 0), 0);

  if (loading) {
    return <div className="container-page py-10"><Skeleton className="h-8 w-64 mb-4" /><Skeleton className="h-96" /></div>;
  }

  if (tier !== "pro") {
    return (
      <div className="container-page py-20 text-center">
        <div className="mx-auto max-w-md">
          <div className="relative mx-auto h-24 w-24 flex items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 mb-6">
            <Mic className="h-10 w-10 text-rose-500" />
            <div className="absolute -top-2 -right-2 h-8 w-8 flex items-center justify-center rounded-full bg-warning/20 border border-warning/30">
              <Star className="h-4 w-4 text-warning" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold">Fitur Pro</h1>
          <p className="mt-2 text-muted-foreground">
            Simulasi Wawancara AI tersedia untuk pengguna Pro. Latih kemampuan interview kamu dengan pertanyaan realistis dan feedback instan dari AI.
          </p>
          <Button asChild size="lg" className="mt-6 gap-2 shadow-lg shadow-primary/20">
            <Link to="/harga">
              <Zap className="h-4 w-4" /> Upgrade ke Pro
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-rose-500/90 to-pink-600 px-6 py-8 text-white md:px-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-orange-400/20 blur-xl" />
        <div className="pointer-events-none absolute right-20 top-4 h-3 w-3 rounded-full bg-warning animate-pulse" />
        <div className="pointer-events-none absolute right-40 bottom-6 h-2 w-2 rounded-full bg-yellow-300 animate-pulse" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <Mic className="h-6 w-6" />
              </span>
              <div>
                <h1 className="font-display text-2xl font-bold md:text-3xl">
                  Simulasi Wawancara AI
                </h1>
                <p className="mt-1 text-sm text-white/80">
                  Latihan interview realistis dengan AI — dapatkan feedback instan & tingkatkan kepercayaan dirimu.
                </p>
              </div>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="shrink-0 gap-1.5 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Quick Stats ── */}
      {sessions.length > 0 && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card className="border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10">
                  <MessageSquare className="h-4 w-4 text-rose-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Sesi</p>
                  <p className="text-lg font-bold font-display text-foreground">{sessions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                  <BarChart3 className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rata-rata Skor</p>
                  <p className="text-lg font-bold font-display text-foreground">{avgScore || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Trophy className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Skor Tertinggi</p>
                  <p className="text-lg font-bold font-display text-foreground">{bestScore || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                  <Brain className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Latihan</p>
                  <p className="text-lg font-bold font-display text-foreground">{totalQuestions} soal</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Start New Session ── */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Play className="h-5 w-5 text-rose-500" />
          <h2 className="font-display text-lg font-bold text-foreground">Mulai Simulasi Baru</h2>
        </div>
        <Card className="border-2 border-rose-500/10 bg-gradient-to-br from-rose-500/5 via-card to-card">
          <CardContent className="p-5 md:p-6">
            {/* Quick Picks */}
            <p className="text-xs font-medium text-muted-foreground mb-3">Posisi Populer:</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {QUICK_POSITIONS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPosition(p)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-full border transition-all",
                    position === p
                      ? "border-rose-500/50 bg-rose-500/10 text-rose-600"
                      : "border-border bg-card hover:border-rose-500/30 hover:bg-rose-500/5 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="position" className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-rose-500" /> Posisi yang Dilamar *
                </Label>
                <Input
                  id="position"
                  value={position}
                  onChange={e => setPosition(e.target.value)}
                  placeholder="cth: Software Engineer"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-amber-500" /> Level
                </Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEVELS.map(l => <SelectItem key={l} value={l}>{levelLabel(l)} Level</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-blue-500" /> Industri (opsional)
                </Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger><SelectValue placeholder="Pilih industri" /></SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="mt-5 gap-2 shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 transition-shadow"
              onClick={handleStart}
              disabled={starting}
              size="lg"
            >
              {starting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Mulai Simulasi
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* ── History ── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold text-foreground">Riwayat Simulasi</h2>
          </div>
          {sessions.length > 0 && (
            <span className="text-xs text-muted-foreground">{sessions.length} sesi</span>
          )}
        </div>

        {sessions.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10">
                <Mic className="h-8 w-8 text-rose-500" />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground">Belum ada sesi simulasi</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                  Mulai latihan interview pertamamu dan dapatkan feedback instan dari AI.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => {
              const score = s.overall_score;
              const scoreVariant = score != null
                ? score >= 75 ? "green" : score >= 50 ? "warning" : "red"
                : null;

              return (
                <Link key={s.id} to="/simulasi-wawancara/$id" params={{ id: s.id }}>
                  <div className="flex items-center justify-between rounded-2xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 group">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br",
                        scoreVariant === "green" ? "from-emerald-500/20 to-green-500/20" :
                        scoreVariant === "warning" ? "from-amber-500/20 to-orange-500/20" :
                        scoreVariant === "red" ? "from-rose-500/20 to-red-500/20" :
                        "from-rose-500/20 to-pink-500/20"
                      )}>
                        <Mic className="h-5 w-5 text-rose-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{s.position}</p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{levelLabel(s.level)}</span>
                          {s.industry && (
                            <>
                              <span>·</span>
                              <span>{s.industry}</span>
                            </>
                          )}
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(s.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {score != null ? (
                        <div className="text-right">
                          <Badge className={cn(
                            "font-bold text-xs",
                            scoreVariant === "green" ? "bg-emerald-100 text-emerald-700" :
                            scoreVariant === "warning" ? "bg-warning/20 text-warning" :
                            "bg-red-100 text-red-700"
                          )}>
                            {score}/100
                          </Badge>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Belum dinilai</Badge>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
