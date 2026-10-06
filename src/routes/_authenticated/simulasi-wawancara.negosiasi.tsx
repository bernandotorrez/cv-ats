import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import {
  negotiationEvaluate,
  negotiationGet,
  negotiationList,
  negotiationStart,
  negotiationTurn,
  type NegotiationListItem,
  type NegotiationResult,
  type NegotiationSession,
} from "@/lib/ai-functions";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  CheckCircle2,
  Crown,
  History,
  Lightbulb,
  Loader2,
  Mic,
  Quote,
  RotateCcw,
  SendHorizontal,
  Square,
  Target,
  X,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/simulasi-wawancara/negosiasi")({
  head: () =>
    buildSeo({
      title: "Latihan Negosiasi Gaji - CV Pintar",
      description: "Latihan menawar gaji dengan HR virtual dan dapatkan penilaian taktikmu.",
      path: "/simulasi-wawancara/negosiasi",
      noindex: true,
    }),
  validateSearch: (search: Record<string, unknown>): { s?: string } => ({
    s: typeof search.s === "string" && search.s ? search.s : undefined,
  }),
  component: NegotiationPage,
});

const LEVELS: Array<{ id: string; label: string }> = [
  { id: "entry", label: "Entry" },
  { id: "mid", label: "Mid" },
  { id: "senior", label: "Senior" },
  { id: "manager", label: "Manager" },
  { id: "director", label: "Director" },
];

const MIN_SALARY = 1_000_000;
const MAX_SALARY = 500_000_000;
const MAX_MESSAGE = 1_000;

const rupiah = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;

function scoreTone(score: number) {
  if (score >= 80)
    return {
      text: "text-green-700",
      ring: "stroke-green-600",
      pill: "bg-green-50 text-green-800 ring-green-200",
    };
  if (score >= 60)
    return {
      text: "text-amber-700",
      ring: "stroke-amber-500",
      pill: "bg-amber-50 text-amber-900 ring-amber-200",
    };
  return {
    text: "text-red-700",
    ring: "stroke-red-500",
    pill: "bg-red-50 text-red-800 ring-red-200",
  };
}

function NegotiationPage() {
  const { s: sessionId } = Route.useSearch();
  const navigate = useNavigate();

  const open = (id: string | undefined) =>
    navigate({ to: "/simulasi-wawancara/negosiasi", search: { s: id } });

  return (
    <div className="container-page space-y-6 py-6 md:space-y-8 md:py-10">
      <header className="min-w-0">
        <Link
          to="/simulasi-wawancara"
          className="inline-flex min-h-8 items-center gap-1.5 text-sm font-semibold text-green-800 underline-offset-4 hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Simulasi Wawancara
        </Link>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Latihan negosiasi gaji
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
          Hadapi HR virtual yang punya batas budget rahasia. Tawar, beri alasan yang kuat, lalu
          lihat berapa banyak yang berhasil kamu dapatkan.
        </p>
      </header>

      {sessionId ? (
        <SessionView key={sessionId} sessionId={sessionId} onExit={() => open(undefined)} />
      ) : (
        <SetupView onStarted={(id) => open(id)} onOpen={(id) => open(id)} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Setup                                                               */
/* ------------------------------------------------------------------ */

function parseRupiah(text: string): number | null {
  const digits = text.replace(/\D/g, "");
  return digits ? Number(digits) : null;
}

function RupiahField({
  id,
  label,
  hint,
  value,
  onChange,
  error,
  optional,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  optional?: boolean;
}) {
  const number = parseRupiah(value);
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-bold text-gray-900">
        {label} {optional && <span className="font-normal text-gray-600">(opsional)</span>}
      </label>
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold text-gray-500"
        >
          Rp
        </span>
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          value={number === null ? "" : number.toLocaleString("id-ID")}
          onChange={(e) => onChange(e.target.value)}
          placeholder="12.000.000"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(
            "flex h-12 w-full rounded-xl border bg-white pl-11 pr-4 text-base tabular-nums text-gray-900 transition-colors placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2",
            error
              ? "border-red-500 focus-visible:ring-red-500/20"
              : "border-gray-300 focus-visible:border-green-700 focus-visible:ring-green-700/20",
          )}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-gray-600">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  optional,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string | null;
  optional?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-bold text-gray-900">
        {label} {optional && <span className="font-normal text-gray-600">(opsional)</span>}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        maxLength={200}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "flex h-12 w-full rounded-xl border bg-white px-4 text-base text-gray-900 transition-colors placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2",
          error
            ? "border-red-500 focus-visible:ring-red-500/20"
            : "border-gray-300 focus-visible:border-green-700 focus-visible:ring-green-700/20",
        )}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function ProRequired({ message }: { message: string }) {
  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-10">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-700 ring-1 ring-green-200">
        <Crown aria-hidden="true" className="h-8 w-8" />
      </span>
      <h2 className="mt-5 font-display text-2xl font-extrabold text-gray-900">Fitur paket Pro</h2>
      <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-gray-600">{message}</p>
      <Link
        to="/harga"
        className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-green-700 px-6 text-base font-bold text-white transition-colors hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
      >
        Lihat Paket & Upgrade
      </Link>
    </section>
  );
}

function SetupView({
  onStarted,
  onOpen,
}: {
  onStarted: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const [position, setPosition] = useState("");
  const [level, setLevel] = useState("mid");
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [current, setCurrent] = useState("");
  const [expected, setExpected] = useState("");
  const [errors, setErrors] = useState<{ position?: string; expected?: string; current?: string }>(
    {},
  );
  const [starting, setStarting] = useState(false);
  const [proMessage, setProMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<NegotiationListItem[] | null>(null);

  useEffect(() => {
    let active = true;
    negotiationList()
      .then((res) => active && setHistory(res.sessions))
      .catch((err: unknown) => {
        if (!active) return;
        setHistory([]);
        const message = err instanceof Error ? err.message : "";
        if (message.includes("Pro")) setProMessage(message);
      });
    return () => {
      active = false;
    };
  }, []);

  const validate = () => {
    const next: typeof errors = {};
    if (!position.trim()) next.position = "Isi posisi yang kamu lamar.";
    const expectedNumber = parseRupiah(expected);
    if (expectedNumber === null) next.expected = "Isi gaji bulanan yang kamu harapkan.";
    else if (expectedNumber < MIN_SALARY || expectedNumber > MAX_SALARY)
      next.expected = `Masukkan angka antara ${rupiah(MIN_SALARY)} dan ${rupiah(MAX_SALARY)}.`;
    const currentNumber = parseRupiah(current);
    if (currentNumber !== null && (currentNumber < MIN_SALARY || currentNumber > MAX_SALARY))
      next.current = `Masukkan angka antara ${rupiah(MIN_SALARY)} dan ${rupiah(MAX_SALARY)}.`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleStart = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setStarting(true);
    try {
      const { session } = await negotiationStart({
        position: position.trim(),
        level,
        industry: industry.trim() || undefined,
        city: city.trim() || undefined,
        currentSalary: parseRupiah(current),
        expectedSalary: parseRupiah(expected)!,
      });
      onStarted(session.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memulai negosiasi.";
      if (message.includes("Pro")) setProMessage(message);
      else toast.error(message);
    } finally {
      setStarting(false);
    }
  };

  if (proMessage) return <ProRequired message={proMessage} />;

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <form
        onSubmit={handleStart}
        noValidate
        className="space-y-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
      >
        <div>
          <h2 className="font-display text-xl font-extrabold tracking-tight text-gray-900">
            Siapkan skenariomu
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            Isi data seakurat mungkin supaya tawaran HR terasa realistis.
          </p>
        </div>

        <TextField
          id="neg-position"
          label="Posisi yang dilamar"
          value={position}
          onChange={(v) => {
            setPosition(v);
            if (errors.position) setErrors((e) => ({ ...e, position: undefined }));
          }}
          placeholder="Contoh: QA Engineer"
          error={errors.position}
        />

        <fieldset className="space-y-2">
          <legend className="text-sm font-bold text-gray-900">Level</legend>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={level === item.id}
                onClick={() => setLevel(item.id)}
                className={cn(
                  "h-11 rounded-xl border-2 px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700",
                  level === item.id
                    ? "border-green-700 bg-green-50 text-green-900"
                    : "border-gray-200 bg-white text-gray-700 hover:border-green-700",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            id="neg-industry"
            label="Industri"
            value={industry}
            onChange={setIndustry}
            placeholder="Contoh: Teknologi"
            optional
          />
          <TextField
            id="neg-city"
            label="Kota"
            value={city}
            onChange={setCity}
            placeholder="Contoh: Jakarta"
            optional
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <RupiahField
            id="neg-expected"
            label="Harapan gaji per bulan"
            hint="Gaji kotor (gross) yang kamu inginkan."
            value={expected}
            onChange={(v) => {
              setExpected(v);
              if (errors.expected) setErrors((e) => ({ ...e, expected: undefined }));
            }}
            error={errors.expected}
          />
          <RupiahField
            id="neg-current"
            label="Gaji saat ini"
            hint="Dipakai HR sebagai pembanding."
            value={current}
            onChange={(v) => {
              setCurrent(v);
              if (errors.current) setErrors((e) => ({ ...e, current: undefined }));
            }}
            error={errors.current}
            optional
          />
        </div>

        <div className="space-y-3 border-t border-gray-100 pt-5">
          <Button
            type="submit"
            disabled={starting}
            className="h-12 w-full gap-2 rounded-xl bg-green-700 text-base font-extrabold text-white shadow-md shadow-green-700/20 hover:bg-green-800"
          >
            {starting ? (
              <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
            ) : (
              <Banknote aria-hidden="true" className="h-5 w-5" />
            )}
            {starting ? "Menyiapkan HR…" : "Mulai negosiasi"}
            {!starting && <ArrowRight aria-hidden="true" className="h-4 w-4" />}
          </Button>
          <p className="text-center text-sm text-gray-600">
            Maksimal 10 giliran. Memakai 1 kuota simulasi wawancara.
          </p>
        </div>
      </form>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-green-200 bg-green-50 p-5">
          <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-gray-900">
            <Lightbulb aria-hidden="true" className="h-4 w-4 text-green-700" />
            Cara kerjanya
          </h2>
          <ol className="mt-3 space-y-2.5">
            {[
              "HR membuka dengan tawaran di bawah harapanmu.",
              "Kamu menawar balik dan memberi alasan.",
              "HR menaikkan tawaran hanya jika alasanmu kuat.",
              "Setelah selesai, kamu melihat batas budget HR dan penilaian taktikmu.",
            ].map((step, i) => (
              <li key={step} className="flex gap-3 text-sm leading-relaxed text-gray-800">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-700 text-xs font-bold text-white"
                >
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="neg-history-heading" className="space-y-2.5">
          <h2
            id="neg-history-heading"
            className="flex items-center gap-2 font-display text-base font-extrabold text-gray-900"
          >
            <History aria-hidden="true" className="h-4 w-4 text-green-700" />
            Riwayat latihan
          </h2>
          {history === null ? (
            <Skeleton className="h-16 w-full rounded-xl" />
          ) : history.length === 0 ? (
            <p className="rounded-xl border-2 border-dashed border-gray-200 p-4 text-sm text-gray-600">
              Belum ada latihan negosiasi.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
              {history.map((item) => {
                const tone = item.score !== null ? scoreTone(item.score) : null;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onOpen(item.id)}
                      className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-700"
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-sm font-extrabold ring-1",
                          tone ? tone.pill : "bg-gray-50 text-gray-500 ring-gray-200",
                        )}
                      >
                        {item.score ?? "–"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-gray-900">
                          {item.position}
                        </span>
                        <span className="block text-xs text-gray-600">
                          {new Date(item.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          · {item.status === "evaluated" ? "Sudah dinilai" : "Belum dinilai"}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sesi: obrolan + hasil                                               */
/* ------------------------------------------------------------------ */

function SessionView({ sessionId, onExit }: { sessionId: string; onExit: () => void }) {
  const [session, setSession] = useState<NegotiationSession | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputBaseRef = useRef("");

  const {
    isListening,
    transcript,
    error: speechError,
    isSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition({ lang: "id-ID" });

  useEffect(() => {
    let active = true;
    negotiationGet(sessionId)
      .then((res) => active && setSession(res.session))
      .catch((err: unknown) => {
        if (active) setLoadError(err instanceof Error ? err.message : "Gagal memuat sesi.");
      });
    return () => {
      active = false;
    };
  }, [sessionId]);

  // Transkrip suara ditambahkan ke isi kotak pesan
  useEffect(() => {
    if (isListening) {
      setInput(
        [inputBaseRef.current, transcript].filter(Boolean).join(" ").trim().slice(0, MAX_MESSAGE),
      );
    }
  }, [transcript, isListening]);

  useEffect(() => {
    if (!speechError) return;
    toast.error(speechError);
    stopListening();
  }, [speechError, stopListening]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [session?.messages.length, sending]);

  const toggleMic = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }
    inputBaseRef.current = input;
    startListening();
  }, [input, isListening, startListening, stopListening]);

  const handleSend = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const text = input.trim();
    if (!text || !session || sending || session.status !== "active") return;
    if (isListening) stopListening();

    const before = session;
    setSending(true);
    setInput("");
    // Tampilkan pesan kandidat langsung; dikembalikan jika gagal
    setSession({ ...session, messages: [...session.messages, { role: "user", content: text }] });
    try {
      const res = await negotiationTurn(session.id, text);
      setSession(res.session);
    } catch (err) {
      setSession(before);
      setInput(text);
      toast.error(err instanceof Error ? err.message : "Gagal mengirim pesan.");
    } finally {
      setSending(false);
    }
  };

  const handleEvaluate = async () => {
    if (!session) return;
    if (isListening) stopListening();
    setEvaluating(true);
    try {
      const res = await negotiationEvaluate(session.id);
      setSession(res.session);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menilai negosiasi.");
    } finally {
      setEvaluating(false);
    }
  };

  if (loadError) {
    if (loadError.includes("Pro")) return <ProRequired message={loadError} />;
    return (
      <section className="mx-auto max-w-xl rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h2 className="font-display text-xl font-extrabold text-gray-900">
          Sesi tidak bisa dibuka
        </h2>
        <p className="mt-2 text-sm text-gray-600">{loadError}</p>
        <Button
          onClick={onExit}
          className="mt-5 h-11 rounded-xl bg-green-700 font-bold text-white hover:bg-green-800"
        >
          Kembali
        </Button>
      </section>
    );
  }

  if (!session) {
    return (
      <div
        className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
        role="status"
        aria-label="Memuat sesi"
      >
        <Skeleton className="h-[28rem] w-full rounded-3xl" />
        <Skeleton className="h-60 w-full rounded-3xl" />
      </div>
    );
  }

  if (session.status === "evaluated" && session.result) {
    return <ResultView session={session} result={session.result} onRetry={onExit} />;
  }

  const userTurns = session.messages.filter((m) => m.role === "user").length;
  const opening = session.messages[0]?.offer ?? session.currentOffer;
  const raisedPercent =
    opening > 0 ? Math.round(((session.currentOffer - opening) / opening) * 1000) / 10 : 0;
  const ended = session.status === "ended";

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section
        aria-label="Percakapan negosiasi"
        className="flex min-h-[32rem] flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="flex items-center gap-3 border-b border-gray-200 bg-green-50 px-4 py-3 sm:px-5">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-700 font-display text-sm font-extrabold text-white"
          >
            {session.hrName.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-extrabold text-gray-900">
              {session.hrName} · HR
            </p>
            <p className="truncate text-sm text-gray-700">{session.company}</p>
          </div>
          <span className="ml-auto shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-green-900 ring-1 ring-green-200">
            {ended ? "Selesai" : `Sisa ${session.turnsLeft} giliran`}
          </span>
        </div>

        <div
          className="flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-5"
          style={{ maxHeight: "34rem" }}
        >
          {session.messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
                  m.role === "user"
                    ? "rounded-br-md bg-green-700 text-white"
                    : "rounded-bl-md bg-gray-100 text-gray-900",
                )}
              >
                {m.content}
                {m.role === "hr" && m.offer ? (
                  <span className="mt-2 block text-xs font-bold text-green-800">
                    Tawaran: {rupiah(m.offer)}/bulan
                  </span>
                ) : null}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start" role="status" aria-label="HR sedang mengetik">
              <div className="flex gap-1 rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3.5">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="h-2 w-2 rounded-full bg-gray-400 motion-safe:animate-bounce"
                    style={{ animationDelay: `${d * 120}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {ended ? (
          <div className="border-t border-gray-200 bg-gray-50 p-4 sm:p-5">
            <p className="text-sm font-semibold text-gray-900">
              Negosiasi selesai. Lihat bagaimana hasilmu dan batas budget HR yang sebenarnya.
            </p>
            <Button
              onClick={handleEvaluate}
              disabled={evaluating}
              className="mt-3 h-12 w-full gap-2 rounded-xl bg-green-700 font-extrabold text-white hover:bg-green-800 sm:w-auto sm:px-6"
            >
              {evaluating ? (
                <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
              ) : (
                <Target aria-hidden="true" className="h-5 w-5" />
              )}
              {evaluating ? "Menilai…" : "Lihat penilaian"}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="border-t border-gray-200 bg-gray-50 p-3 sm:p-4">
            <label htmlFor="neg-message" className="sr-only">
              Balasanmu
            </label>
            <textarea
              id="neg-message"
              value={input}
              onChange={(e) => !isListening && setInput(e.target.value.slice(0, MAX_MESSAGE))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) handleSend(e);
              }}
              rows={3}
              placeholder="Tulis balasanmu, atau tekan mikrofon. Contoh: “Berdasarkan riset pasar, kisaran untuk posisi ini…”"
              readOnly={isListening}
              className={cn(
                "w-full resize-none rounded-xl border bg-white p-3 text-[15px] text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2",
                isListening
                  ? "border-red-400 bg-red-50 focus-visible:ring-red-500/20"
                  : "border-gray-300 focus-visible:border-green-700 focus-visible:ring-green-700/20",
              )}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {isSupported && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={toggleMic}
                  aria-pressed={isListening}
                  className={cn(
                    "h-11 gap-2 rounded-xl border-2 font-bold",
                    isListening
                      ? "border-red-500 bg-red-50 text-red-800 hover:bg-red-100"
                      : "border-gray-300 hover:border-green-700 hover:bg-green-50",
                  )}
                >
                  {isListening ? (
                    <Square aria-hidden="true" className="h-4 w-4 fill-current" />
                  ) : (
                    <Mic aria-hidden="true" className="h-4 w-4" />
                  )}
                  {isListening ? "Selesai bicara" : "Bicara"}
                </Button>
              )}
              <span className="text-xs tabular-nums text-gray-600">
                {input.length}/{MAX_MESSAGE}
              </span>
              <Button
                type="submit"
                disabled={!input.trim() || sending}
                className="ml-auto h-11 gap-2 rounded-xl bg-green-700 px-5 font-bold text-white hover:bg-green-800"
              >
                {sending ? (
                  <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                ) : (
                  <SendHorizontal aria-hidden="true" className="h-4 w-4" />
                )}
                Kirim
              </Button>
            </div>
          </form>
        )}
      </section>

      <aside className="space-y-4">
        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-base font-extrabold text-gray-900">Posisi tawar</h2>
          <dl className="mt-3 space-y-3">
            <div className="rounded-2xl bg-green-50 p-3.5 ring-1 ring-green-200">
              <dt className="text-xs font-bold uppercase tracking-wider text-green-800">
                Tawaran HR saat ini
              </dt>
              <dd className="mt-1 font-display text-2xl font-extrabold tabular-nums text-gray-900">
                {rupiah(session.currentOffer)}
              </dd>
              <dd className="mt-0.5 text-sm text-gray-700">
                {raisedPercent > 0
                  ? `Naik ${raisedPercent}% dari tawaran awal`
                  : "Belum naik dari tawaran awal"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <dt className="text-gray-600">Harapanmu</dt>
              <dd className="font-bold tabular-nums text-gray-900">
                {rupiah(session.expectedSalary)}
              </dd>
            </div>
            {session.currentSalary ? (
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <dt className="text-gray-600">Gaji sekarang</dt>
                <dd className="font-bold tabular-nums text-gray-900">
                  {rupiah(session.currentSalary)}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-gray-900">
            <Lightbulb aria-hidden="true" className="h-4 w-4 text-green-700" />
            Tips cepat
          </h2>
          <ul className="mt-3 space-y-2.5">
            {[
              "Jangan terima tawaran pertama.",
              "Sebut angka spesifik, bukan rentang lebar.",
              "Beri alasan: data pasar, pencapaian terukur.",
              "Tanyakan paket non-gaji: bonus, hybrid, pelatihan.",
            ].map((tip) => (
              <li key={tip} className="flex gap-2.5 text-sm leading-relaxed text-gray-700">
                <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-green-700" />
                {tip}
              </li>
            ))}
          </ul>
        </section>

        {!ended && (
          <Button
            variant="outline"
            onClick={handleEvaluate}
            disabled={evaluating || userTurns < 2}
            className="h-12 w-full gap-2 rounded-xl border-2 border-gray-300 font-bold hover:border-green-700 hover:bg-green-50"
          >
            {evaluating ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Target aria-hidden="true" className="h-4 w-4" />
            )}
            {userTurns < 2 ? "Tawar minimal 2 kali" : "Akhiri & minta penilaian"}
          </Button>
        )}
      </aside>
    </div>
  );
}

function ResultView({
  session,
  result,
  onRetry,
}: {
  session: NegotiationSession;
  result: NegotiationResult;
  onRetry: () => void;
}) {
  const tone = scoreTone(result.overall);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const deal = result.outcome === "deal";
  const leftOnTable = Math.max(0, result.hrCeiling - result.finalOffer);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <section
          aria-label="Skor negosiasi"
          className="relative flex flex-col items-center overflow-hidden rounded-3xl bg-green-700 p-6 text-center text-white shadow-xl shadow-green-900/15"
        >
          <div
            aria-hidden="true"
            className="absolute -right-10 -top-16 h-52 w-52 rounded-full bg-green-600/50 blur-2xl"
          />
          <div className="relative flex flex-col items-center">
            <p className="text-xs font-bold uppercase tracking-wider text-yellow-300">
              Skor negosiasi
            </p>
            <div className="relative mt-4 h-36 w-36">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  strokeWidth="10"
                  className="stroke-white/20"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - result.overall / 100)}
                  className="stroke-yellow-300"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-5xl font-extrabold leading-none">
                  {result.overall}
                </span>
                <span className="mt-1 text-xs font-semibold text-green-100">dari 100</span>
              </div>
            </div>
            <p className="mt-4 font-display text-xl font-extrabold">
              {deal ? "Kesepakatan tercapai" : "Belum ada kesepakatan"}
            </p>
            <div className="mt-3 grid w-full grid-cols-2 gap-2 text-left text-sm">
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/20">
                <p className="text-xs text-green-100">Hasil angka</p>
                <p className="font-display text-lg font-extrabold">{result.moneyScore}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/20">
                <p className="text-xs text-green-100">Teknik</p>
                <p className="font-display text-lg font-extrabold">{result.techniqueScore}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-green-800">
            {session.position}
          </p>
          <h2 className="mt-1 font-display text-xl font-extrabold text-gray-900">Hasil angkamu</h2>

          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Tawaran awal", value: rupiah(result.openingOffer) },
              {
                label: deal ? "Disepakati" : "Tawaran terakhir",
                value: rupiah(result.finalOffer),
                strong: true,
              },
              { label: "Harapanmu", value: rupiah(result.expectedSalary) },
              {
                label: "Kenaikan",
                value: `${result.gainPercent > 0 ? "+" : ""}${result.gainPercent}%`,
              },
            ].map((item) => (
              <div
                key={item.label}
                className={cn(
                  "rounded-2xl p-3",
                  item.strong ? "bg-green-50 ring-1 ring-green-200" : "bg-gray-50",
                )}
              >
                <dt className="text-xs font-semibold text-gray-600">{item.label}</dt>
                <dd className="mt-1 font-display text-base font-extrabold tabular-nums text-gray-900">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
            <p className="text-sm font-bold text-amber-950">Batas budget HR yang sebenarnya</p>
            <p className="mt-1 font-display text-xl font-extrabold tabular-nums text-amber-950">
              {rupiah(result.hrCeiling)}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-amber-950">
              {leftOnTable > 0
                ? `Masih ada ${rupiah(leftOnTable)} per bulan yang tidak berhasil kamu ambil.`
                : "Kamu berhasil mengambil hampir seluruh ruang negosiasi."}
            </p>
          </div>

          {result.summary && (
            <p className="mt-4 text-base leading-relaxed text-gray-800">{result.summary}</p>
          )}
        </section>
      </div>

      {result.tactics.length > 0 && (
        <section aria-labelledby="taktik-heading" className="space-y-3">
          <h2 id="taktik-heading" className="font-display text-xl font-extrabold text-gray-900">
            Taktikmu
          </h2>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {result.tactics.map((t, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    t.verdict === "baik" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700",
                  )}
                >
                  {t.verdict === "baik" ? (
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <X aria-hidden="true" className="h-4 w-4" />
                  )}
                  <span className="sr-only">{t.verdict === "baik" ? "Baik" : "Kurang"}</span>
                </span>
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.label}</p>
                  {t.note && (
                    <p className="mt-0.5 text-sm leading-relaxed text-gray-700">{t.note}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.betterPhrases.length > 0 && (
        <section aria-labelledby="kalimat-heading" className="space-y-3">
          <h2 id="kalimat-heading" className="font-display text-xl font-extrabold text-gray-900">
            Kalimat yang bisa lebih kuat
          </h2>
          <ul className="space-y-3">
            {result.betterPhrases.map((p, i) => (
              <li
                key={i}
                className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-2"
              >
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-600">
                    Kamu bilang
                  </p>
                  <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-relaxed text-red-800">
                    <Quote aria-hidden="true" className="mr-1 inline h-3.5 w-3.5" />
                    {p.instead}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-green-800">
                    Coba katakan
                  </p>
                  <p className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium leading-relaxed text-gray-900">
                    {p.say}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(result.missed.length > 0 || result.tips.length > 0) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {result.missed.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="font-display text-base font-extrabold text-gray-900">
                Peluang yang terlewat
              </h2>
              <ul className="mt-3 space-y-2.5">
                {result.missed.map((m) => (
                  <li key={m} className="flex gap-2.5 text-sm leading-relaxed text-gray-800">
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                    />
                    {m}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {result.tips.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="font-display text-base font-extrabold text-gray-900">
                Latihan berikutnya
              </h2>
              <ul className="mt-3 space-y-2.5">
                {result.tips.map((t) => (
                  <li key={t} className="flex gap-2.5 text-sm leading-relaxed text-gray-800">
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-green-600"
                    />
                    {t}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <details className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-bold text-gray-900">
          Lihat transkrip percakapan
        </summary>
        <ul className="mt-3 space-y-2.5">
          {session.messages.map((m, i) => (
            <li key={i} className="text-sm leading-relaxed text-gray-800">
              <span
                className={cn("font-bold", m.role === "hr" ? "text-green-800" : "text-gray-900")}
              >
                {m.role === "hr" ? session.hrName : "Kamu"}:
              </span>{" "}
              {m.content}
            </li>
          ))}
        </ul>
      </details>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={onRetry}
          className="h-12 gap-2 rounded-xl bg-green-700 px-6 font-extrabold text-white hover:bg-green-800"
        >
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          Latihan lagi
        </Button>
        <Link
          to="/simulasi-wawancara"
          className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-gray-300 bg-white px-6 text-base font-semibold text-gray-800 transition-colors hover:border-green-700 hover:bg-green-50"
        >
          Simulasi wawancara
        </Link>
      </div>
    </div>
  );
}
