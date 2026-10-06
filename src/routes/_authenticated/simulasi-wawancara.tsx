import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getUserTier } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BarChart3,
  Brain,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Clock,
  Crown,
  History,
  Lightbulb,
  Loader2,
  MessageSquare,
  Mic,
  Sparkles,
  Trophy,
} from "lucide-react";
import { scoreTone } from "@/components/cv-review/review-utils";

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
  const [showAllPositions, setShowAllPositions] = useState(false);
  const [positionError, setPositionError] = useState<string | null>(null);

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
      setPositionError("Isi posisi yang ingin kamu latih.");
      document.getElementById("interview-start-form")?.focus();
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

    if (!data) return;
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
      <div className="container-page py-8 md:py-14">
        <section className="mx-auto max-w-2xl rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-700 ring-1 ring-green-200">
            <Mic aria-hidden="true" className="h-8 w-8" />
          </span>
          <p className="mt-5 inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-800">
            Fitur Pro
          </p>
          <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-balance text-gray-900">
            Latihan interview yang terasa seperti sesi sungguhan
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-gray-600">
            Jawab pertanyaan dengan ketikan atau suara, dapatkan feedback dan analisis cara bicara,
            lalu latih negosiasi gaji sebelum bertemu rekruter.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/harga"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-green-700 px-6 text-base font-bold text-white shadow-md shadow-green-700/20 transition-colors hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
            >
              <Crown aria-hidden="true" className="h-5 w-5" />
              Upgrade ke Pro
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-gray-300 bg-white px-6 text-base font-semibold text-gray-800 transition-colors hover:border-green-700 hover:bg-green-50 hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
            >
              Kembali ke Dashboard
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const visiblePositions = showAllPositions ? QUICK_POSITIONS : QUICK_POSITIONS.slice(0, 10);
  const stats = [
    {
      icon: MessageSquare,
      label: "Total sesi",
      value: String(sessions.length),
      note: "Latihan tersimpan",
    },
    {
      icon: BarChart3,
      label: "Rata-rata skor",
      value: avgScore ? `${avgScore}` : "–",
      note: progressTone,
    },
    {
      icon: Trophy,
      label: "Skor terbaik",
      value: bestScore ? `${bestScore}` : "–",
      note: "Puncak performa",
    },
    { icon: Brain, label: "Pertanyaan", value: String(totalQuestions), note: "Sudah dilatih" },
  ];

  return (
    <div className="container-page space-y-6 py-6 md:space-y-8 md:py-10">
      {/* Header */}
      <header className="min-w-0">
        <Link
          to="/dashboard"
          className="inline-flex min-h-8 items-center gap-1.5 text-sm font-semibold text-green-800 underline-offset-4 hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Dashboard
        </Link>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Simulasi wawancara
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
          Latih jawabanmu dengan AI, ukur kualitasnya, dan masuk interview dengan tenang. Pilih
          jenis latihan di bawah.
        </p>
      </header>

      {/* Pilih jenis latihan */}
      <section aria-label="Jenis latihan" className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <a
          href="#interview-start-form"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("interview-start-form")?.focus();
            document.getElementById("mulai-sesi")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="group relative overflow-hidden rounded-3xl bg-green-700 p-5 text-white shadow-xl shadow-green-900/15 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-6"
        >
          <div
            aria-hidden="true"
            className="absolute -right-10 -top-16 h-52 w-52 rounded-full bg-green-600/50 blur-2xl"
          />
          <div className="relative">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <Mic aria-hidden="true" className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-display text-xl font-extrabold">Latihan wawancara</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-green-50">
              8 pertanyaan sesuai posisi dan levelmu. Jawab dengan ketikan atau suara, lalu dapat
              skor, feedback, dan analisis cara bicara.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-yellow-300">
              Mulai di bawah
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </div>
        </a>

        <Link
          to="/simulasi-wawancara/negosiasi"
          className="group rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-green-700 hover:bg-green-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700 ring-1 ring-green-200">
              <Banknote aria-hidden="true" className="h-6 w-6" />
            </span>
            <span className="rounded-full bg-yellow-300 px-2.5 py-0.5 text-xs font-extrabold text-gray-950">
              Baru
            </span>
          </div>
          <h2 className="mt-4 font-display text-xl font-extrabold text-gray-900">
            Latihan negosiasi gaji
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
            Lawan HR virtual yang punya batas budget rahasia. Tawar, beri alasan, lalu lihat berapa
            banyak yang berhasil kamu dapatkan.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-green-800">
            Coba sekarang
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </Link>
      </section>

      {/* Ringkasan */}
      {sessions.length > 0 && (
        <section aria-label="Ringkasan latihan">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 shadow-sm lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1 bg-white p-4 sm:p-5">
                <div className="flex items-center gap-2 text-gray-600">
                  <stat.icon aria-hidden="true" className="h-4 w-4" />
                  <dt className="text-sm font-medium">{stat.label}</dt>
                </div>
                <dd className="font-display text-3xl font-extrabold leading-none text-gray-900">
                  {stat.value}
                </dd>
                <p className="text-xs text-gray-600">{stat.note}</p>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Form mulai sesi */}
      <section
        id="mulai-sesi"
        className="grid scroll-mt-24 grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
      >
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            handleStart();
          }}
          className="space-y-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <div>
            <h2 className="font-display text-xl font-extrabold tracking-tight text-gray-900">
              Mulai sesi wawancara
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              Pilih posisi, level, dan industri. AI menyusun pertanyaan yang relevan untukmu.
            </p>
          </div>

          <div>
            <p className="mb-2.5 text-sm font-bold text-gray-900">Posisi populer</p>
            <div className="flex flex-wrap gap-2">
              {visiblePositions.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={position === item}
                  onClick={() => {
                    setPosition(item);
                    setPositionError(null);
                  }}
                  className={cn(
                    "h-9 rounded-full border px-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700",
                    position === item
                      ? "border-green-700 bg-green-700 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-green-700 hover:text-green-800",
                  )}
                >
                  {item}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowAllPositions((v) => !v)}
                className="h-9 rounded-full px-3 text-sm font-bold text-green-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
              >
                {showAllPositions
                  ? "Tampilkan lebih sedikit"
                  : `Lihat semua (${QUICK_POSITIONS.length})`}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interview-start-form" className="text-sm font-bold text-gray-900">
              Posisi yang dilamar
            </Label>
            <input
              id="interview-start-form"
              value={position}
              onChange={(e) => {
                setPosition(e.target.value);
                if (positionError) setPositionError(null);
              }}
              placeholder="Contoh: Product Manager"
              autoComplete="off"
              maxLength={200}
              aria-invalid={positionError ? true : undefined}
              aria-describedby={positionError ? "position-error" : undefined}
              className={cn(
                "flex h-12 w-full rounded-xl border bg-white px-4 text-base text-gray-900 transition-colors placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2",
                positionError
                  ? "border-red-500 focus-visible:ring-red-500/20"
                  : "border-gray-300 focus-visible:border-green-700 focus-visible:ring-green-700/20",
              )}
            />
            {positionError && (
              <p id="position-error" role="alert" className="text-sm font-medium text-red-700">
                {positionError}
              </p>
            )}
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-bold text-gray-900">Level</legend>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={level === item}
                  onClick={() => setLevel(item)}
                  className={cn(
                    "h-11 rounded-xl border-2 px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700",
                    level === item
                      ? "border-green-700 bg-green-50 text-green-900"
                      : "border-gray-200 bg-white text-gray-700 hover:border-green-700",
                  )}
                >
                  {levelLabel(item)}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label className="text-sm font-bold text-gray-900">
              Industri <span className="font-normal text-gray-600">(opsional)</span>
            </Label>
            <Popover open={industryOpen} onOpenChange={setIndustryOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  role="combobox"
                  aria-expanded={industryOpen}
                  aria-label="Pilih industri"
                  className={cn(
                    "flex h-12 w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-4 text-left text-base transition-colors hover:border-green-700 focus-visible:border-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700/20",
                    industry ? "text-gray-900" : "text-gray-500",
                  )}
                >
                  <span className="truncate">{industry || "Cari dan pilih industri"}</span>
                  <ChevronsUpDown
                    aria-hidden="true"
                    className="ml-2 h-4 w-4 shrink-0 text-gray-500"
                  />
                </button>
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

          <div className="space-y-3 border-t border-gray-100 pt-5">
            <Button
              type="submit"
              disabled={starting}
              size="lg"
              className="h-12 w-full gap-2 rounded-xl bg-green-700 text-base font-extrabold text-white shadow-md shadow-green-700/20 hover:bg-green-800"
            >
              {starting ? (
                <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles aria-hidden="true" className="h-5 w-5" />
              )}
              {starting ? "Menyiapkan sesi…" : "Mulai simulasi"}
              {!starting && <ArrowRight aria-hidden="true" className="h-4 w-4" />}
            </Button>
            <p className="text-center text-sm text-gray-600">
              Sekitar 5-10 menit. Tips: jawab dengan format STAR supaya feedback lebih tajam.
            </p>
          </div>
        </form>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-green-200 bg-green-50 p-5">
            <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-gray-900">
              <Lightbulb aria-hidden="true" className="h-4 w-4 text-green-700" />
              Latihan yang baik itu kecil
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">
              Satu sesi cukup untuk menemukan pola: jawaban terlalu umum, kurang bukti, atau belum
              ditutup dengan dampak.
            </p>
            <ul className="mt-3 space-y-2.5">
              {[
                "Bicara seperti menjawab rekruter asli.",
                "Pakai contoh kerja nyata, bukan klaim kosong.",
                "Tutup jawaban dengan hasil yang terukur.",
              ].map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-gray-800">
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0 text-green-700"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-gray-900">
              <Mic aria-hidden="true" className="h-4 w-4 text-green-700" />
              Jawab dengan suara
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              Di dalam sesi, tekan <strong>Mulai bicara</strong> untuk menjawab dengan suara. Kamu
              mendapat analisis tempo bicara dan kata pengisi. Gunakan Chrome atau Edge.
            </p>
          </section>
        </aside>
      </section>

      {/* Riwayat */}
      <section aria-labelledby="riwayat-heading" className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2
            id="riwayat-heading"
            className="font-display text-xl font-extrabold tracking-tight text-gray-900"
          >
            Riwayat latihan
            <span className="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 align-middle text-sm font-bold text-gray-700">
              {sessions.length}
            </span>
          </h2>
          {latestSession && (
            <p className="max-w-md text-sm text-gray-600">
              Terakhir: <strong className="text-gray-900">{latestSession.position}</strong>. Buka
              lagi untuk melihat pertanyaan dan feedback.
            </p>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center sm:p-12">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-700 ring-1 ring-green-200">
              <History aria-hidden="true" className="h-7 w-7" />
            </span>
            <h3 className="mt-4 font-display text-lg font-extrabold text-gray-900">
              Belum ada sesi. Mulai satu latihan kecil hari ini.
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-gray-600">
              Setelah selesai, skor dan feedback muncul di sini agar progresmu mudah dibaca.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {sessions.map((session) => (
              <li key={session.id}>
                <SessionCard session={session} levelLabel={levelLabel} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
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
  const tone = score == null ? null : scoreTone(score);

  return (
    <Link
      to="/simulasi-wawancara/$id"
      params={{ id: session.id }}
      className="group flex h-full items-center gap-4 rounded-2xl border-2 border-gray-200 bg-white p-4 transition-colors hover:border-green-700 hover:bg-green-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
    >
      <span
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-lg font-extrabold ring-1",
          tone ? tone.pill : "bg-gray-50 text-gray-500 ring-gray-200",
        )}
      >
        {score ?? "–"}
        <span className="sr-only">{score == null ? "Belum dinilai" : " dari 100"}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-base font-extrabold text-gray-900">
          {session.position}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-gray-600">
          <span>{levelLabel(session.level)}</span>
          {session.industry && <span>· {session.industry}</span>}
          <span className="inline-flex items-center gap-1">
            · <Clock aria-hidden="true" className="h-3 w-3" />
            {new Date(session.created_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </span>
        <span className="mt-1 block text-xs font-semibold text-gray-600">
          {score == null ? "Belum dinilai · lanjutkan sesi" : "Lihat hasil dan feedback"}
        </span>
      </span>
      <ArrowRight
        aria-hidden="true"
        className="h-4 w-4 shrink-0 text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:text-green-700"
      />
    </Link>
  );
}

function InterviewListSkeleton() {
  return (
    <div
      className="container-page space-y-6 py-6 md:space-y-8 md:py-10"
      role="status"
      aria-label="Memuat halaman simulasi wawancara"
    >
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-44 w-full rounded-3xl" />
        <Skeleton className="h-44 w-full rounded-3xl" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Skeleton className="h-[34rem] w-full rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-52 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
