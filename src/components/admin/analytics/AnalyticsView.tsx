import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  Download,
  Eye,
  FileText,
  Globe,
  Laptop,
  MessageCircle,
  RotateCw,
  Search,
  Share2,
  Smartphone,
  Sparkles,
  Tablet,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { formatDuration } from "./format";

/* ------------------------------------------------------------------ */
/* Tipe data                                                           */
/* ------------------------------------------------------------------ */

export type TimeRange = "today" | "7d" | "30d" | "all";
export type ChartTab = "traffic" | "whatsapp" | "conversions";

export interface DailyStat {
  date: string;
  formatted_date: string;
  pageviews: number;
  unique_visitors: number;
  whatsapp_clicks: number;
  conversions: number;
}

export interface BreakdownItem {
  name: string;
  count: number;
  percentage: number;
}

export interface TopPageItem {
  path: string;
  title: string;
  hits: number;
  percentage: number;
}

export interface RecentEventItem {
  id: string;
  visitor_id: string;
  session_id: string;
  event_name: string;
  page_path: string;
  page_title: string;
  device_type?: string;
  browser?: string;
  os?: string;
  duration_seconds?: number;
  created_at: string;
}

export interface AnalyticsData {
  total_pageviews: number;
  unique_visitors: number;
  whatsapp_clicks: number;
  feature_conversions: number;
  conversion_rate: number;
  /** null = tidak tersedia (jalur cadangan tanpa RPC tidak menghitungnya). */
  avg_duration_seconds: number | null;
  pageviews_growth: number | null;
  visitors_growth: number | null;
  daily_stats: DailyStat[];
  devices: BreakdownItem[];
  sources: BreakdownItem[];
  top_pages: TopPageItem[];
  recent_events: RecentEventItem[];
}

/* ------------------------------------------------------------------ */
/* Helper                                                              */
/* ------------------------------------------------------------------ */

const num = (n: number) => n.toLocaleString("id-ID");

function formatTimeAgo(dateString: string): string {
  if (!dateString) return "baru saja";
  const diff = Math.max(1, Math.floor((Date.now() - new Date(dateString).getTime()) / 1000));
  if (diff < 60) return `${diff} dtk lalu`;
  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

const RANGES: Array<{ id: TimeRange; label: string }> = [
  { id: "today", label: "Hari ini" },
  { id: "7d", label: "7 hari" },
  { id: "30d", label: "30 hari" },
  { id: "all", label: "90 hari" },
];

/**
 * Warna chart sengaja berupa hex tetap, bukan hsl(var(--…)): token warna situs berformat oklch,
 * sehingga hsl(var(--border)) tidak valid dan sumbu/garis chart kehilangan warnanya.
 */
const CHART = {
  grid: "#e5e7eb",
  tick: "#4b5563",
  green: "#15803d",
  sky: "#0ea5e9",
  whatsapp: "#16a34a",
  violet: "#7c3aed",
} as const;

interface Series {
  key: keyof Pick<DailyStat, "pageviews" | "unique_visitors" | "whatsapp_clicks" | "conversions">;
  name: string;
  color: string;
}

const SERIES: Record<ChartTab, { label: string; series: Series[] }> = {
  traffic: {
    label: "Kunjungan & visitor",
    series: [
      { key: "pageviews", name: "Kunjungan", color: CHART.green },
      { key: "unique_visitors", name: "Pengunjung unik", color: CHART.sky },
    ],
  },
  whatsapp: {
    label: "Klik WhatsApp",
    series: [{ key: "whatsapp_clicks", name: "Klik WhatsApp", color: CHART.whatsapp }],
  },
  conversions: {
    label: "Aksi fitur",
    series: [{ key: "conversions", name: "Aksi fitur", color: CHART.violet }],
  },
};

/* ------------------------------------------------------------------ */
/* Potongan UI                                                         */
/* ------------------------------------------------------------------ */

function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-gray-200 bg-white shadow-sm", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <h2 className="font-display text-base font-extrabold text-gray-900">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-gray-600">{description}</p>}
        </div>
        {action}
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function Delta({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-xs text-gray-500">Perbandingan belum tersedia</span>;
  }
  const up = value > 0;
  const down = value < 0;
  const Icon = down ? TrendingDown : TrendingUp;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
        up && "bg-green-50 text-green-800",
        down && "bg-red-50 text-red-800",
        !up && !down && "bg-gray-100 text-gray-700",
      )}
    >
      <Icon aria-hidden="true" className="h-3 w-3" />
      {up ? "+" : down ? "−" : ""}
      {Math.abs(value)}%<span className="sr-only"> dibanding periode sebelumnya</span>
    </span>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  footer,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  footer: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-700">
          <Icon aria-hidden="true" className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 font-display text-3xl font-extrabold leading-none tabular-nums text-gray-900">
        {value}
      </p>
      <div className="mt-2.5 min-h-6 text-sm text-gray-600">{footer}</div>
    </div>
  );
}

function BarRow({
  icon: Icon,
  name,
  count,
  percentage,
}: {
  icon: LucideIcon;
  name: string;
  count: number;
  percentage: number;
}) {
  return (
    <li className="rounded-xl border border-gray-100 p-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
          <Icon aria-hidden="true" className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-gray-900">{name}</p>
          <p className="text-xs text-gray-600">{num(count)} hit</p>
        </div>
        <p className="font-display text-lg font-extrabold tabular-nums text-gray-900">
          {percentage}%
        </p>
      </div>
      <div
        className="mt-2.5 h-2 overflow-hidden rounded-full bg-gray-100"
        role="progressbar"
        aria-label={name}
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-green-700" style={{ width: `${percentage}%` }} />
      </div>
    </li>
  );
}

function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-600">
      {children}
    </p>
  );
}

function deviceIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes("mobile") || n.includes("phone")) return Smartphone;
  if (n.includes("tablet") || n.includes("ipad")) return Tablet;
  return Laptop;
}

function sourceIcon(name: string): LucideIcon {
  if (name.includes("Direct")) return Compass;
  if (name.includes("Google") || name.includes("Search")) return Search;
  if (name.includes("Social")) return Share2;
  if (name.includes("WhatsApp")) return MessageCircle;
  return Globe;
}

function eventInfo(eventName: string, duration?: number): { label: string; icon: LucideIcon } {
  switch (eventName) {
    case "page_view":
      return { label: "Membuka halaman", icon: Eye };
    case "click_whatsapp":
    case "whatsapp_click":
      return { label: "Klik WhatsApp CS", icon: MessageCircle };
    case "session_ping":
      return { label: `Sesi aktif (${duration || 60} dtk)`, icon: Clock };
    case "cv_create_start":
      return { label: "Mulai buat CV baru", icon: Sparkles };
    case "ats_scan":
      return { label: "Cek skor ATS", icon: Activity };
    case "click_tryout":
      return { label: "Buka simulasi tryout", icon: CheckCircle2 };
    default:
      return { label: "Interaksi fitur", icon: Sparkles };
  }
}

/* ------------------------------------------------------------------ */
/* Tampilan utama                                                      */
/* ------------------------------------------------------------------ */

export interface AnalyticsViewProps {
  data: AnalyticsData;
  loading: boolean;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  onRefresh: () => void;
  onExportCsv: () => void;
  feedEvents: RecentEventItem[];
  totalFeedCount: number;
  hasMoreFeed: boolean;
  loadingMoreFeed: boolean;
  onLoadMoreFeed: () => void;
  topPagesLimit: number;
  topPagesPageSize: number;
  onLoadMoreTopPages: () => void;
}

export function AnalyticsView({
  data,
  loading,
  timeRange,
  onTimeRangeChange,
  onRefresh,
  onExportCsv,
  feedEvents,
  totalFeedCount,
  hasMoreFeed,
  loadingMoreFeed,
  onLoadMoreFeed,
  topPagesLimit,
  topPagesPageSize,
  onLoadMoreTopPages,
}: AnalyticsViewProps) {
  const [chartTab, setChartTab] = useState<ChartTab>("traffic");
  const active = SERIES[chartTab];

  const totals = useMemo(
    () =>
      active.series.map((s) => ({
        ...s,
        total: data.daily_stats.reduce((sum, d) => sum + d[s.key], 0),
      })),
    [active, data.daily_stats],
  );
  const chartEmpty = totals.every((t) => t.total === 0);
  const feedTotal = totalFeedCount > 0 ? totalFeedCount : feedEvents.length;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-800">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600" />
            </span>
            Data langsung
          </p>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            Statistik pengunjung
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-gray-600">
            Pantau trafik, interaksi, dan konversi CV Pintar. Halaman admin tidak ikut dihitung.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div
            role="group"
            aria-label="Rentang waktu"
            className="flex rounded-xl border border-gray-200 bg-gray-50 p-0.5 sm:inline-flex"
          >
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onTimeRangeChange(r.id)}
                aria-pressed={timeRange === r.id}
                className={cn(
                  "h-9 flex-1 whitespace-nowrap rounded-[10px] px-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700",
                  timeRange === r.id
                    ? "bg-white text-green-800 shadow-sm ring-1 ring-gray-200"
                    : "text-gray-600 hover:text-gray-900",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onExportCsv}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 text-sm font-bold text-gray-800 transition-colors hover:border-green-700 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 sm:flex-initial"
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              Ekspor CSV
            </button>
            <button
              type="button"
              onClick={onRefresh}
              aria-label="Muat ulang data"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-gray-300 bg-white text-gray-800 transition-colors hover:border-green-700 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
            >
              <RotateCw
                aria-hidden="true"
                className={cn("h-4 w-4", loading && "motion-safe:animate-spin text-green-700")}
              />
            </button>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard
          label="Total kunjungan"
          value={num(data.total_pageviews)}
          icon={Eye}
          footer={<Delta value={data.pageviews_growth} />}
        />
        <KpiCard
          label="Pengunjung unik"
          value={num(data.unique_visitors)}
          icon={Users}
          footer={<Delta value={data.visitors_growth} />}
        />
        <KpiCard
          label="Klik WhatsApp"
          value={num(data.whatsapp_clicks)}
          icon={MessageCircle}
          footer="Calon prospek chat"
        />
        <KpiCard
          label="Aksi fitur"
          value={num(data.feature_conversions)}
          icon={Activity}
          footer="Buat CV, ATS, tryout"
        />
        <div className="col-span-2 rounded-2xl bg-green-700 p-4 text-white shadow-lg shadow-green-900/10 sm:p-5 lg:col-span-1">
          <p className="text-sm font-medium text-green-100">Tingkat konversi</p>
          <p className="mt-2 font-display text-3xl font-extrabold leading-none tabular-nums">
            {data.conversion_rate}%
          </p>
          <p className="mt-2.5 text-sm text-green-50">
            Durasi rata-rata:{" "}
            <span className="font-bold">{formatDuration(data.avg_duration_seconds)}</span>
          </p>
        </div>
      </div>

      {/* Chart */}
      <Panel
        title="Tren harian"
        description="Pilih metrik untuk melihat pergerakannya per hari."
        action={
          <div
            role="group"
            aria-label="Metrik chart"
            className="flex max-w-full overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-0.5"
          >
            {(Object.keys(SERIES) as ChartTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setChartTab(tab)}
                aria-pressed={chartTab === tab}
                className={cn(
                  "h-9 shrink-0 rounded-[10px] px-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700",
                  chartTab === tab
                    ? "bg-white text-green-800 shadow-sm ring-1 ring-gray-200"
                    : "text-gray-600 hover:text-gray-900",
                )}
              >
                {SERIES[tab].label}
              </button>
            ))}
          </div>
        }
      >
        {/* Ringkasan + legenda */}
        <ul className="mb-4 flex flex-wrap gap-x-6 gap-y-2">
          {totals.map((t) => (
            <li key={t.key} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: t.color }}
              />
              <span className="text-sm text-gray-600">{t.name}</span>
              <span className="font-display text-base font-extrabold tabular-nums text-gray-900">
                {num(t.total)}
              </span>
            </li>
          ))}
        </ul>

        <div className="relative h-[240px] w-full sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.daily_stats}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              barGap={4}
              accessibilityLayer={false}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
              <XAxis
                dataKey="formatted_date"
                tickLine={false}
                axisLine={false}
                minTickGap={12}
                tick={{ fontSize: 12, fill: CHART.tick }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tick={{ fontSize: 12, fill: CHART.tick }}
              />
              <Tooltip
                cursor={{ fill: "#f0fdf4" }}
                content={({ active: isActive, payload }) => {
                  const item = payload?.[0]?.payload as DailyStat | undefined;
                  if (!isActive || !item) return null;
                  return (
                    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
                      <p className="text-sm font-bold text-gray-900">{item.formatted_date}</p>
                      <ul className="mt-1.5 space-y-1">
                        {active.series.map((s) => (
                          <li
                            key={s.key}
                            className="flex items-center justify-between gap-5 text-sm"
                          >
                            <span className="flex items-center gap-2 text-gray-700">
                              <span
                                aria-hidden="true"
                                className="h-2.5 w-2.5 rounded-sm"
                                style={{ backgroundColor: s.color }}
                              />
                              {s.name}
                            </span>
                            <span className="font-bold tabular-nums text-gray-900">
                              {num(item[s.key])}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }}
              />
              {/*
                Jangan bungkus <Bar> dalam Fragment (<>…</>): recharts 2.x memakai react-is 18 yang
                tidak mengenali Fragment React 19, sehingga bar-nya tidak pernah digambar.
              */}
              {active.series.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.name}
                  fill={s.color}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={active.series.length > 1 ? 26 : 38}
                  minPointSize={chartEmpty ? 0 : 2}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
          {chartEmpty && (
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium text-gray-600">
              Belum ada data pada periode ini.
            </p>
          )}
        </div>

        {/* Padanan tabel untuk pembaca layar */}
        <table className="sr-only">
          <caption>Data harian: {active.label}</caption>
          <thead>
            <tr>
              <th scope="col">Tanggal</th>
              {active.series.map((s) => (
                <th key={s.key} scope="col">
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.daily_stats.map((d) => (
              <tr key={d.date}>
                <th scope="row">{d.formatted_date}</th>
                {active.series.map((s) => (
                  <td key={s.key}>{d[s.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {/* Perangkat & sumber */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Perangkat pengunjung" description="Sebaran jenis perangkat.">
          <ul className="space-y-2.5">
            {data.devices.map((d) => (
              <BarRow
                key={d.name}
                icon={deviceIcon(d.name)}
                name={d.name}
                count={d.count}
                percentage={d.percentage}
              />
            ))}
          </ul>
        </Panel>
        <Panel title="Sumber trafik" description="Dari mana pengunjung datang.">
          <ul className="space-y-2.5">
            {data.sources.map((s) => (
              <BarRow
                key={s.name}
                icon={sourceIcon(s.name)}
                name={s.name}
                count={s.count}
                percentage={s.percentage}
              />
            ))}
          </ul>
        </Panel>
      </div>

      {/* Halaman populer & aktivitas */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel
          title="Halaman terpopuler"
          description={`${Math.min(topPagesLimit, data.top_pages.length)} dari ${data.top_pages.length} halaman`}
          action={<FileText aria-hidden="true" className="h-5 w-5 text-green-700" />}
        >
          {data.top_pages.length === 0 ? (
            <EmptyNote>Belum ada kunjungan halaman tercatat.</EmptyNote>
          ) : (
            <>
              <ol className="max-h-[520px] space-y-2.5 overflow-y-auto pr-1">
                {data.top_pages.slice(0, topPagesLimit).map((page, index) => (
                  <li key={page.path} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-700 font-display text-xs font-extrabold text-white">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-gray-900">{page.title}</p>
                        <p className="truncate font-mono text-xs text-gray-600">{page.path}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold tabular-nums text-gray-900">
                          {num(page.hits)} hit
                        </p>
                        <p className="text-xs text-gray-600">{page.percentage}%</p>
                      </div>
                    </div>
                    <div
                      className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-gray-100"
                      role="presentation"
                    >
                      <div
                        className="h-full rounded-full bg-green-700"
                        style={{ width: `${page.percentage}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
              <div className="pt-3">
                {topPagesLimit < data.top_pages.length ? (
                  <button
                    type="button"
                    onClick={onLoadMoreTopPages}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 text-sm font-bold text-gray-700 transition-colors hover:border-green-700 hover:bg-green-50 hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
                  >
                    <ChevronDown aria-hidden="true" className="h-4 w-4" />
                    Tampilkan {topPagesPageSize} lagi
                  </button>
                ) : (
                  <p className="flex items-center justify-center gap-1.5 py-1 text-xs text-gray-600">
                    <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-green-700" />
                    Semua halaman sudah ditampilkan
                  </p>
                )}
              </div>
            </>
          )}
        </Panel>

        <Panel
          title="Aktivitas terkini"
          description={`${feedEvents.length} dari ${num(feedTotal)} aktivitas`}
          action={<Activity aria-hidden="true" className="h-5 w-5 text-green-700" />}
        >
          {feedEvents.length === 0 ? (
            <EmptyNote>Belum ada aktivitas pengunjung tercatat.</EmptyNote>
          ) : (
            <>
              <ul className="max-h-[520px] space-y-2.5 overflow-y-auto pr-1">
                {feedEvents.map((ev) => {
                  const info = eventInfo(ev.event_name, ev.duration_seconds);
                  const Icon = info.icon;
                  return (
                    <li key={ev.id} className="rounded-xl border border-gray-100 p-3">
                      <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
                          <Icon aria-hidden="true" className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-gray-900">
                            {ev.page_title || ev.page_path}
                          </p>
                          <p className="text-sm text-gray-700">{info.label}</p>
                          <p className="mt-0.5 truncate text-xs text-gray-600">
                            {ev.device_type || "Desktop"} · {ev.os || "OS tidak diketahui"} ·{" "}
                            {ev.browser || "Browser tidak diketahui"}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-gray-600">
                          {formatTimeAgo(ev.created_at)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="pt-3">
                {hasMoreFeed ? (
                  <button
                    type="button"
                    disabled={loadingMoreFeed}
                    onClick={onLoadMoreFeed}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 text-sm font-bold text-gray-700 transition-colors hover:border-green-700 hover:bg-green-50 hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 disabled:opacity-60"
                  >
                    {loadingMoreFeed ? (
                      <>
                        <RotateCw aria-hidden="true" className="h-4 w-4 motion-safe:animate-spin" />
                        Memuat…
                      </>
                    ) : (
                      <>
                        <ChevronDown aria-hidden="true" className="h-4 w-4" />
                        Muat lebih banyak
                      </>
                    )}
                  </button>
                ) : (
                  <p className="flex items-center justify-center gap-1.5 py-1 text-xs text-gray-600">
                    <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-green-700" />
                    Semua aktivitas sudah dimuat
                  </p>
                )}
              </div>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
