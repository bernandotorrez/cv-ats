import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getUserTier } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Brain,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Clock,
  Crown,
  FileText,
  History,
  Loader2,
  MessageSquare,
  Mic,
  Play,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/simulasi-wawancara")({
  head: () =>
    buildSeo({
      title: "Simulasi Wawancara - CV Pintar",
      description: "Latihan interview dengan AI.",
      path: "/simulasi-wawancara",
      noindex: true,
    }),
  component: SimulasiWawancaraPage,
});

const LEVELS = ["entry", "mid", "senior", "manager", "director"];
const INDUSTRIES = [
  "Teknologi",
  "Finance",
  "Perbankan",
  "Asuransi",
  "Marketing",
  "Sales",
  "Retail",
  "E-commerce",
  "FMCG",
  "Startup",
  "BUMN",
  "Konsultan",
  "Otomotif",
  "Manufaktur",
  "Real Estate",
  "Properti",
  "Konstruksi",
  "Logistik",
  "Supply Chain",
  "Healthcare",
  "Farmasi",
  "Pendidikan",
  "Media & Kreatif",
  "Hospitality",
  "Pariwisata",
  "Telekomunikasi",
  "Energi",
  "Pertambangan",
  "Agribisnis",
  "Legal",
  "Non-profit",
  "Pemerintahan",
  "Lainnya",
];
const QUICK_POSITIONS = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Mobile Developer",
  "Product Manager",
  "Data Analyst",
  "Data Scientist",
  "Business Analyst",
  "UI/UX Designer",
  "Graphic Designer",
  "Project Manager",
  "Scrum Master",
  "QA Engineer",
  "DevOps Engineer",
  "Cybersecurity Analyst",
  "Marketing Manager",
  "Digital Marketing Specialist",
  "Content Strategist",
  "Social Media Specialist",
  "SEO Specialist",
  "Business Development",
  "Sales Executive",
  "Account Manager",
  "Customer Success",
  "Operations Manager",
  "Supply Chain Analyst",
  "HR Manager",
  "Talent Acquisition",
  "Recruiter",
  "Finance Analyst",
  "Accounting Staff",
  "Auditor",
  "Legal Officer",
  "Admin Staff",
];

interface Session {
  id: string;
  position: string;
  level: string;
  industry: string | null;
  overall_score: number | null;
  questions: Array<{ id: string; question: string }>;
  created_at: string;
}

interface DbError {
  message: string;
}

interface InterviewSelectQuery<T> {
  eq: (column: string, value: unknown) => InterviewSelectQuery<T>;
  order: (column: string, options: { ascending: boolean }) => InterviewSelectQuery<T>;
  limit: (count: number) => Promise<{ data: T | null; error: DbError | null }>;
}

interface InterviewInsertSelectQuery<T> {
  single: () => Promise<{ data: T | null; error: DbError | null }>;
}

interface InterviewInsertQuery<T> {
  select: (columns: string) => InterviewInsertSelectQuery<T>;
}

interface InterviewTable {
  select: (columns: string) => InterviewSelectQuery<Session[]>;
  insert: (value: unknown) => InterviewInsertQuery<{ id: string }>;
}

const interviewSessions = () =>
  (supabase.from as unknown as (table: string) => InterviewTable)("interview_sessions");

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
  const [industryOpen, setIndustryOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const t = await getUserTier(user.id);
    setTier(t);

    const { data, error } = await interviewSessions()
      .select("id, position, level, industry, overall_score, questions, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) toast.error("Gagal memuat riwayat simulasi.");
    setSessions((data ?? []) as Session[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    loadData();
  }, [user?.id, loadData]);

  if (pathname !== "/simulasi-wawancara") {
    return <Outlet />;
  }

  const levelLabel = (l: string) => {
    const map: Record<string, string> = {
      entry: "Entry",
      mid: "Mid",
      senior: "Senior",
      manager: "Manager",
      director: "Director",
    };
    return map[l] ?? l;
  };

  const handleStart = async () => {
    if (!position.trim()) {
      toast.error("Masukkan posisi yang ingin kamu latih.");
      return;
    }

    setStarting(true);
    const { data, error } = await interviewSessions()
      .insert({
        user_id: user!.id,
        position: position.trim(),
        level,
        industry: industry || null,
        questions: [],
        answers: [],
      })
      .select("id")
      .single();
    setStarting(false);

    if (error) {
      toast.error("Gagal memulai sesi.");
      return;
    }

    navigate({ to: "/simulasi-wawancara/$id", params: { id: data.id } });
  };

  const scoredSessions = sessions.filter((s) => s.overall_score != null);
  const avgScore =
    scoredSessions.length > 0
      ? Math.round(
          scoredSessions.reduce((sum, s) => sum + (s.overall_score ?? 0), 0) /
            scoredSessions.length,
        )
      : 0;
  const bestScore =
    scoredSessions.length > 0 ? Math.max(...scoredSessions.map((s) => s.overall_score ?? 0)) : 0;
  const totalQuestions = sessions.reduce((sum, s) => sum + (s.questions?.length || 0), 0);
  const latestSession = sessions[0];
  const progressTone =
    avgScore >= 80
      ? "Interview-ready"
      : avgScore >= 60
        ? "Sudah terbentuk"
        : sessions.length > 0
          ? "Butuh repetisi"
          : "Mulai latihan";

  if (loading) {
    return <InterviewListSkeleton />;
  }

  if (tier !== "pro") {
    return (
      <div className="container-page py-8 md:py-12">
        <section className="mx-auto max-w-3xl rounded-[1.25rem] border bg-card p-6 text-center shadow-sm md:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Mic className="h-8 w-8" />
          </div>
          <Badge className="mt-5 bg-warning/20 text-warning hover:bg-warning/20">Fitur Pro</Badge>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground">
            Latihan interview yang terasa seperti sesi sungguhan.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
            Simulasi Wawancara AI membantu kamu menjawab pertanyaan, membaca pola kelemahan, dan
            membangun kepercayaan diri sebelum bertemu rekruter.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link to="/harga">
                <Crown className="h-4 w-4" />
                Upgrade ke Pro
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Link>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="container-page space-y-7 py-5 md:space-y-8 md:py-8">
      <section className="rounded-[1.25rem] border bg-card p-5 shadow-sm sm:p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Mic className="h-3.5 w-3.5" />
              Interview practice
            </div>
            <h1 className="max-w-3xl font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
              Latih jawaban, ukur kualitas, masuk interview dengan tenang.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              AI menyiapkan pertanyaan sesuai role, mendengar jawabanmu, lalu memberi feedback yang
              bisa langsung dipakai untuk latihan berikutnya.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="gap-2"
                onClick={() => document.getElementById("interview-start-form")?.focus()}
              >
                <Play className="h-4 w-4" />
                Mulai Latihan
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <Link to="/dashboard">
                  <ArrowLeft className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border bg-muted/35 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Mode latihan</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Pertanyaan, jawaban, feedback, lalu ulang. Sederhana, cepat, dan terukur.
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["Tanya", "Jawab", "Perbaiki"].map((item, index) => (
                <div key={item} className="rounded-xl border bg-background p-3 text-center">
                  <p className="text-xs font-bold text-primary">0{index + 1}</p>
                  <p className="mt-1 text-[11px] font-medium text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {sessions.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={MessageSquare}
            label="Total Sesi"
            value={sessions.length.toString()}
            note="Latihan tersimpan"
            tone="primary"
          />
          <MetricCard
            icon={BarChart3}
            label="Rata-rata Skor"
            value={avgScore ? `${avgScore}/100` : "-"}
            note={progressTone}
            tone="amber"
          />
          <MetricCard
            icon={Trophy}
            label="Skor Terbaik"
            value={bestScore ? `${bestScore}/100` : "-"}
            note="Puncak performa"
            tone="emerald"
          />
          <MetricCard
            icon={Brain}
            label="Pertanyaan"
            value={totalQuestions.toString()}
            note="Sudah dilatih"
            tone="sky"
          />
        </section>
      )}

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-2 inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                Mulai sesi
              </p>
              <h2 className="font-display text-xl font-bold text-foreground">
                Pilih role, lalu biarkan AI membuat ruang latihan.
              </h2>
            </div>
            <Badge variant="outline" className="w-fit">
              5-10 menit
            </Badge>
          </div>

          <div className="mt-5">
            <p className="mb-3 text-xs font-semibold text-muted-foreground">Posisi populer</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_POSITIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPosition(item)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    position === item
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="interview-start-form" className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Posisi yang dilamar
              </Label>
              <Input
                id="interview-start-form"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Contoh: Product Manager"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-amber-600" />
                Level
              </Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {levelLabel(item)} Level
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-2">
                <BriefcaseBusiness className="h-4 w-4 text-sky-700" />
                Industri
              </Label>
              <Popover open={industryOpen} onOpenChange={setIndustryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={industryOpen}
                    className={cn(
                      "h-10 w-full justify-between px-3 font-normal",
                      !industry && "text-muted-foreground",
                    )}
                  >
                    <span className="truncate">{industry || "Opsional, cari industri"}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Cari industri..." />
                    <CommandList>
                      <CommandEmpty>Industri tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="Tanpa industri"
                          onSelect={() => {
                            setIndustry("");
                            setIndustryOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              industry === "" ? "opacity-100" : "opacity-0",
                            )}
                          />
                          Tanpa industri spesifik
                        </CommandItem>
                        {INDUSTRIES.map((item) => (
                          <CommandItem
                            key={item}
                            value={item}
                            onSelect={() => {
                              setIndustry(item);
                              setIndustryOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                industry === item ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {item}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-muted-foreground">
              Tips: jawab dengan format STAR supaya feedback AI lebih tajam.
            </p>
            <Button onClick={handleStart} disabled={starting} size="lg" className="gap-2">
              {starting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Mulai Simulasi
            </Button>
          </div>
        </div>

        <aside className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground">
                Latihan yang baik itu kecil.
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Satu sesi cukup untuk menemukan pola: jawaban terlalu umum, kurang bukti, atau belum
                menutup dengan impact.
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {[
              "Bicara seperti sedang menjawab rekruter asli.",
              "Gunakan contoh kerja nyata, bukan klaim kosong.",
              "Tutup jawaban dengan hasil yang bisa diukur.",
            ].map((item) => (
              <div key={item} className="flex gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              Riwayat
            </p>
            <h2 className="font-display text-xl font-bold text-foreground">
              Lanjutkan dari sesi sebelumnya
            </h2>
          </div>
          {latestSession && (
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              Terakhir latihan untuk <strong>{latestSession.position}</strong>. Buka lagi untuk
              melihat pertanyaan dan feedback.
            </p>
          )}
        </div>

        {sessions.length === 0 ? (
          <section className="rounded-2xl border border-dashed bg-card p-8 text-center shadow-sm md:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <History className="h-8 w-8" />
            </div>
            <h3 className="mt-5 font-display text-xl font-bold text-foreground">
              Belum ada sesi. Mulai satu latihan kecil hari ini.
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Setelah selesai, skor dan feedback akan muncul di sini agar progresmu mudah dibaca.
            </p>
          </section>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} levelLabel={levelLabel} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
  tone,
}: {
  icon: typeof MessageSquare;
  label: string;
  value: string;
  note: string;
  tone: "primary" | "amber" | "emerald" | "sky";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-500/10 text-amber-700",
    emerald: "bg-emerald-500/10 text-emerald-700",
    sky: "bg-sky-500/10 text-sky-700",
  }[tone];

  return (
    <article className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            toneClass,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-display text-xl font-bold text-foreground">{value}</p>
          <p className="text-[11px] text-muted-foreground">{note}</p>
        </div>
      </div>
    </article>
  );
}

function SessionCard({
  session,
  levelLabel,
}: {
  session: Session;
  levelLabel: (level: string) => string;
}) {
  const score = session.overall_score;
  const scoreTone =
    score == null
      ? "bg-muted text-muted-foreground"
      : score >= 80
        ? "bg-emerald-500/10 text-emerald-700"
        : score >= 60
          ? "bg-amber-500/10 text-amber-700"
          : "bg-red-500/10 text-red-700";

  return (
    <Link to="/simulasi-wawancara/$id" params={{ id: session.id }} className="group block">
      <article className="flex h-full flex-col rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Mic className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-display font-bold text-foreground group-hover:text-primary">
              {session.position}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span>{levelLabel(session.level)}</span>
              {session.industry && <span>{session.industry}</span>}
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(session.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 sm:mt-0 sm:shrink-0">
          <Badge className={cn("font-semibold hover:bg-inherit", scoreTone)}>
            {score == null ? "Belum dinilai" : `${score}/100`}
          </Badge>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
        </div>
      </article>
    </Link>
  );
}

function InterviewListSkeleton() {
  return (
    <div className="container-page space-y-7 py-5 md:space-y-8 md:py-8">
      <section className="rounded-[1.25rem] border bg-card p-5 shadow-sm sm:p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-center">
          <div>
            <Skeleton className="h-7 w-40 rounded-full" />
            <Skeleton className="mt-5 h-10 w-full max-w-2xl sm:h-12" />
            <Skeleton className="mt-3 h-10 w-4/5 max-w-xl sm:h-12" />
            <Skeleton className="mt-5 h-4 w-full max-w-xl" />
            <Skeleton className="mt-2 h-4 w-5/6 max-w-lg" />
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Skeleton className="h-11 w-full sm:w-36" />
              <Skeleton className="h-11 w-full sm:w-32" />
            </div>
          </div>
          <div className="rounded-2xl border bg-muted/35 p-4">
            <div className="flex gap-3">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-2 h-3 w-full" />
                <Skeleton className="mt-1 h-3 w-4/5" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-16 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-2 h-6 w-16" />
                <Skeleton className="mt-2 h-3 w-24" />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="mt-3 h-7 w-full max-w-xl" />
          <div className="mt-5 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((item) => (
              <Skeleton key={item} className="h-8 w-32 rounded-full" />
            ))}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Skeleton className="h-16 rounded-xl md:col-span-3" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl md:col-span-2" />
          </div>
          <div className="mt-6 flex justify-end">
            <Skeleton className="h-11 w-full sm:w-40" />
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="mt-2 h-3 w-full" />
              <Skeleton className="mt-1 h-3 w-4/5" />
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-5 w-full" />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="mt-3 h-7 w-64" />
          </div>
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-24 rounded-2xl" />
          ))}
        </div>
      </section>
    </div>
  );
}
