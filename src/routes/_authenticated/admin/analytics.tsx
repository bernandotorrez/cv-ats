import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useCallback } from "react";
import { buildSeo } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDuration } from "@/components/admin/analytics/format";
import {
  AnalyticsView,
  type AnalyticsData,
  type BreakdownItem,
  type DailyStat,
  type RecentEventItem,
  type TimeRange,
  type TopPageItem,
} from "@/components/admin/analytics/AnalyticsView";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  beforeLoad: async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw redirect({ to: "/login", search: {} as any });
    }
    const { data } = await supabase.rpc("has_role", {
      _user_id: sessionData.session.user.id,
      _role: "admin",
    });
    if (!data) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () =>
    buildSeo({
      title: "Analitik & Statistik Pengunjung — Admin CV Pintar",
      description:
        "Dashboard performa trafik, demografi perangkat, konversi simulasi, dan interaksi WhatsApp.",
      path: "/admin/analytics",
      noindex: true,
    }),
  component: AdminAnalyticsPage,
});

function getLocalDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Initialize clean empty analytics state
function getEmptyAnalytics(days: number): AnalyticsData {
  const dailyStats: DailyStat[] = [];
  const now = new Date();

  // Indonesian month abbreviations
  const idMonths = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const day = d.getDate();
    const month = idMonths[d.getMonth()];
    const dateStr = getLocalDateKey(d);

    dailyStats.push({
      date: dateStr,
      formatted_date: `${day} ${month}`,
      pageviews: 0,
      unique_visitors: 0,
      whatsapp_clicks: 0,
      conversions: 0,
    });
  }

  return {
    total_pageviews: 0,
    unique_visitors: 0,
    whatsapp_clicks: 0,
    feature_conversions: 0,
    conversion_rate: 0,
    avg_duration_seconds: null,
    pageviews_growth: null,
    visitors_growth: null,
    daily_stats: dailyStats,
    devices: [
      { name: "Desktop / Laptop", count: 0, percentage: 0 },
      { name: "Mobile (Smartphone)", count: 0, percentage: 0 },
      { name: "Tablet / iPad", count: 0, percentage: 0 },
    ],
    sources: [
      { name: "Direct / Akses Langsung", count: 0, percentage: 0 },
      { name: "Website Eksternal", count: 0, percentage: 0 },
      { name: "Google / Search Engine", count: 0, percentage: 0 },
      { name: "Social Media", count: 0, percentage: 0 },
      { name: "WhatsApp", count: 0, percentage: 0 },
    ],
    top_pages: [],
    recent_events: [],
  };
}

const FEED_PAGE_SIZE = 20;
const TOP_PAGES_PAGE_SIZE = 5;

function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>(() => getEmptyAnalytics(7));

  // Top pages pagination state (5 items per batch)
  const [topPagesLimit, setTopPagesLimit] = useState(TOP_PAGES_PAGE_SIZE);

  // Live feed pagination states (20 items per page)
  const [feedEvents, setFeedEvents] = useState<RecentEventItem[]>([]);
  const [totalFeedCount, setTotalFeedCount] = useState<number>(0);
  const [loadingMoreFeed, setLoadingMoreFeed] = useState(false);
  const [hasMoreFeed, setHasMoreFeed] = useState(false);

  const daysCount = useMemo(() => {
    switch (timeRange) {
      case "today":
        return 1;
      case "7d":
        return 7;
      case "30d":
        return 30;
      case "all":
        return 90;
      default:
        return 7;
    }
  }, [timeRange]);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (daysCount === 1 ? 0 : daysCount - 1));
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    try {
      // 0. Fetch total visitor events count for pagination
      const { count: totalEvents } = await (supabase as any)
        .from("visitor_events")
        .select("id", { count: "exact", head: true })
        .not("page_path", "like", "/admin%");

      if (typeof totalEvents === "number") {
        setTotalFeedCount(totalEvents);
      }

      // 1. Try Supabase RPC aggregation function
      const { data: rpcData, error: rpcError } = await (supabase as any).rpc(
        "get_visitor_analytics",
        {
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString(),
        },
      );

      if (
        !rpcError &&
        rpcData &&
        typeof rpcData === "object" &&
        rpcData.total_pageviews !== undefined
      ) {
        const normalizedData: AnalyticsData = {
          ...rpcData,
          total_pageviews: Number(rpcData.total_pageviews || 0),
          unique_visitors: Number(rpcData.unique_visitors || 0),
          whatsapp_clicks: Number(rpcData.whatsapp_clicks || 0),
          feature_conversions: Number(rpcData.feature_conversions || 0),
          conversion_rate: Number(rpcData.conversion_rate || 0),
          avg_duration_seconds:
            rpcData.avg_duration_seconds == null ? null : Number(rpcData.avg_duration_seconds),
          pageviews_growth:
            rpcData.pageviews_growth == null ? null : Number(rpcData.pageviews_growth),
          visitors_growth: rpcData.visitors_growth == null ? null : Number(rpcData.visitors_growth),
          daily_stats: (rpcData.daily_stats || []).map((s: any) => ({
            date: String(s.date || ""),
            formatted_date: String(s.formatted_date || s.date || ""),
            pageviews: Number(s.pageviews || 0),
            unique_visitors: Number(s.unique_visitors || 0),
            whatsapp_clicks: Number(s.whatsapp_clicks || 0),
            conversions: Number(s.conversions || 0),
          })),
        };
        setData(normalizedData);
        const events = rpcData.recent_events || [];
        setFeedEvents(events.slice(0, FEED_PAGE_SIZE));
        const total = typeof totalEvents === "number" ? totalEvents : events.length;
        setHasMoreFeed(total > FEED_PAGE_SIZE);
        setLoading(false);
        return;
      }

      if (rpcError) {
        console.warn(
          "[Analytics] get_visitor_analytics RPC error, trying direct query fallback:",
          rpcError,
        );
      }

      // 2. Direct table query fallback (excluding admin pages)
      const { data: rawEvents, error: tableError } = await (supabase as any)
        .from("visitor_events")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false });

      if (!tableError && Array.isArray(rawEvents)) {
        const dbEvents = rawEvents.filter(
          (e: any) => e.page_path && !e.page_path.startsWith("/admin"),
        );

        const pageviews = dbEvents.filter((e: any) => e.event_name === "page_view").length;
        const uniqueVisitorIds = new Set(dbEvents.map((e: any) => e.visitor_id)).size;
        const waClicks = dbEvents.filter((e: any) =>
          ["click_whatsapp", "whatsapp_click", "chat_whatsapp"].includes(e.event_name),
        ).length;
        const conversions = dbEvents.filter((e: any) =>
          ["cv_create_start", "click_cta", "click_tryout", "ats_scan", "click_feature"].includes(
            e.event_name,
          ),
        ).length;

        // Group by day
        const dayMap = new Map<string, DailyStat>();
        const idMonths = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "Mei",
          "Jun",
          "Jul",
          "Agu",
          "Sep",
          "Okt",
          "Nov",
          "Des",
        ];

        for (let i = daysCount - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(endDate.getDate() - i);
          const dateStr = getLocalDateKey(d);
          const formatted = `${d.getDate()} ${idMonths[d.getMonth()]}`;
          dayMap.set(dateStr, {
            date: dateStr,
            formatted_date: formatted,
            pageviews: 0,
            unique_visitors: 0,
            whatsapp_clicks: 0,
            conversions: 0,
          });
        }

        const visitorsByDay = new Map<string, Set<string>>();
        dbEvents.forEach((ev: any) => {
          const evDate = new Date(ev.created_at);
          const dStr = getLocalDateKey(evDate);
          if (!dayMap.has(dStr)) return;
          const stat = dayMap.get(dStr)!;
          if (ev.event_name === "page_view") stat.pageviews += 1;
          if (["click_whatsapp", "whatsapp_click", "chat_whatsapp"].includes(ev.event_name))
            stat.whatsapp_clicks += 1;
          if (
            ["cv_create_start", "click_cta", "click_tryout", "ats_scan", "click_feature"].includes(
              ev.event_name,
            )
          )
            stat.conversions += 1;

          if (!visitorsByDay.has(dStr)) visitorsByDay.set(dStr, new Set());
          visitorsByDay.get(dStr)!.add(ev.visitor_id);
        });

        visitorsByDay.forEach((set, dStr) => {
          if (dayMap.has(dStr)) {
            dayMap.get(dStr)!.unique_visitors = set.size;
          }
        });

        // Device breakdown
        const deviceCounts: Record<string, number> = {
          "Desktop / Laptop": 0,
          "Mobile (Smartphone)": 0,
          "Tablet / iPad": 0,
        };
        dbEvents.forEach((ev: any) => {
          const dt = (ev.device_type || "").toLowerCase();
          if (dt === "mobile") deviceCounts["Mobile (Smartphone)"] += 1;
          else if (dt === "tablet") deviceCounts["Tablet / iPad"] += 1;
          else deviceCounts["Desktop / Laptop"] += 1;
        });

        const totalDev =
          Object.values(deviceCounts).reduce((a, b) => a + b, 0) || (pageviews > 0 ? pageviews : 1);
        const devices: BreakdownItem[] = Object.entries(deviceCounts).map(([name, count]) => ({
          name,
          count,
          percentage: totalDev > 0 ? Math.round((count / totalDev) * 100) : 0,
        }));

        // Source breakdown
        const sourceCounts: Record<string, number> = {};
        dbEvents.forEach((ev: any) => {
          const src = ev.referrer_channel || "Direct / Akses Langsung";
          sourceCounts[src] = (sourceCounts[src] || 0) + 1;
        });
        const totalSrc =
          Object.values(sourceCounts).reduce((a, b) => a + b, 0) || (pageviews > 0 ? pageviews : 1);
        const sources: BreakdownItem[] = Object.entries(sourceCounts).map(([name, count]) => ({
          name,
          count,
          percentage: totalSrc > 0 ? Math.round((count / totalSrc) * 100) : 0,
        }));

        // Top pages (excluding /admin)
        const pageHits: Record<string, { title: string; hits: number }> = {};
        dbEvents
          .filter((e: any) => e.event_name === "page_view" && !e.page_path?.startsWith("/admin"))
          .forEach((ev: any) => {
            const path = ev.page_path || "/";
            if (!pageHits[path]) pageHits[path] = { title: ev.page_title || path, hits: 0 };
            pageHits[path].hits += 1;
          });
        const totalHits = Object.values(pageHits).reduce((a, b) => a + b.hits, 0) || 1;
        const topPages: TopPageItem[] = Object.entries(pageHits)
          .map(([path, info]) => ({
            path,
            title: info.title,
            hits: info.hits,
            percentage: Math.round((info.hits / totalHits) * 100),
          }))
          .sort((a, b) => b.hits - a.hits);

        const realData: AnalyticsData = {
          total_pageviews: pageviews,
          unique_visitors: uniqueVisitorIds,
          whatsapp_clicks: waClicks,
          feature_conversions: conversions,
          conversion_rate:
            uniqueVisitorIds > 0
              ? Number((((waClicks + conversions) / uniqueVisitorIds) * 100).toFixed(1))
              : 0,
          // Jalur cadangan tidak membandingkan periode lalu / menghitung durasi: jangan karang angka
          avg_duration_seconds: null,
          pageviews_growth: null,
          visitors_growth: null,
          daily_stats: Array.from(dayMap.values()),
          devices,
          sources,
          top_pages: topPages,
          recent_events: dbEvents.slice(0, FEED_PAGE_SIZE),
        };

        setData(realData);
        setFeedEvents(dbEvents.slice(0, FEED_PAGE_SIZE));
        const total = typeof totalEvents === "number" ? totalEvents : dbEvents.length;
        setHasMoreFeed(total > FEED_PAGE_SIZE);
        setLoading(false);
        return;
      }

      // 3. Fallback to clean empty state ONLY if both RPC and direct query fail
      const emptyRes = getEmptyAnalytics(daysCount);
      setData(emptyRes);
      setFeedEvents([]);
      setHasMoreFeed(false);
    } catch (err) {
      console.warn("[Analytics] Loading error, fallback:", err);
      const emptyRes = getEmptyAnalytics(daysCount);
      setData(emptyRes);
      setFeedEvents([]);
      setHasMoreFeed(false);
    } finally {
      setLoading(false);
    }
  }, [daysCount]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  // Load more recent activity events (pagination: 20 data per click)
  const handleLoadMoreFeed = async () => {
    if (loadingMoreFeed) return;
    setLoadingMoreFeed(true);

    try {
      const from = feedEvents.length;
      const to = from + FEED_PAGE_SIZE - 1;

      const { data: rawEvents, error } = await (supabase as any)
        .from("visitor_events")
        .select("*")
        .not("page_path", "like", "/admin%")
        .order("created_at", { ascending: false })
        .range(from, to);

      const dbEvents = (rawEvents || []).filter(
        (e: any) => e.page_path && !e.page_path.startsWith("/admin"),
      );

      if (!error && dbEvents && dbEvents.length > 0) {
        setFeedEvents((prev) => {
          const next = [...prev, ...dbEvents];
          setHasMoreFeed(
            totalFeedCount > 0 ? next.length < totalFeedCount : dbEvents.length >= FEED_PAGE_SIZE,
          );
          return next;
        });
      } else {
        setHasMoreFeed(false);
      }
    } catch (err) {
      console.warn("[Analytics] Gagal memuat lebih banyak feed:", err);
      setHasMoreFeed(false);
    } finally {
      setLoadingMoreFeed(false);
    }
  };

  // Load more top pages (pagination: 5 items per click)
  const handleLoadMoreTopPages = () => {
    setTopPagesLimit((prev) => prev + TOP_PAGES_PAGE_SIZE);
  };

  // Export to CSV Functionality
  const handleExportCsv = () => {
    try {
      // Setiap sel di-escape; memakai Blob (bukan data: URI) agar karakter seperti "#" tidak memotong file
      const cell = (value: string | number | null) =>
        `"${String(value ?? "").replace(/"/g, '""')}"`;
      const row = (...values: Array<string | number | null>) => values.map(cell).join(",");
      const rows: string[] = [
        row("RINGKASAN ANALITIK PENGUNJUNG CV PINTAR"),
        row("Periode", timeRange),
        row("Total kunjungan (pageviews)", data.total_pageviews),
        row("Pengunjung unik", data.unique_visitors),
        row("Klik WhatsApp", data.whatsapp_clicks),
        row("Aksi fitur", data.feature_conversions),
        row("Tingkat konversi", `${data.conversion_rate}%`),
        row("Rata-rata durasi sesi", formatDuration(data.avg_duration_seconds)),
        "",
        row("TREN HARIAN"),
        row("Tanggal", "Label", "Pageviews", "Pengunjung unik", "Klik WhatsApp", "Aksi fitur"),
        ...data.daily_stats.map((d) =>
          row(
            d.date,
            d.formatted_date,
            d.pageviews,
            d.unique_visitors,
            d.whatsapp_clicks,
            d.conversions,
          ),
        ),
        "",
        row("PERANGKAT"),
        row("Perangkat", "Hit", "Persentase"),
        ...data.devices.map((d) => row(d.name, d.count, `${d.percentage}%`)),
        "",
        row("SUMBER TRAFIK"),
        row("Sumber", "Jumlah", "Persentase"),
        ...data.sources.map((s) => row(s.name, s.count, `${s.percentage}%`)),
        "",
        row("HALAMAN TERPOPULER"),
        row("Path", "Judul", "Hit", "Persentase"),
        ...data.top_pages.map((p) => row(p.path, p.title, p.hits, `${p.percentage}%`)),
      ];

      const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analitik-pengunjung-cvpintar-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);

      toast.success("File CSV analitik berhasil diekspor!");
    } catch {
      toast.error("Gagal mengekspor data CSV.");
    }
  };

  return (
    <AnalyticsView
      data={data}
      loading={loading}
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
      onRefresh={() => void loadAnalytics()}
      onExportCsv={handleExportCsv}
      feedEvents={feedEvents}
      totalFeedCount={totalFeedCount}
      hasMoreFeed={hasMoreFeed}
      loadingMoreFeed={loadingMoreFeed}
      onLoadMoreFeed={handleLoadMoreFeed}
      topPagesLimit={topPagesLimit}
      topPagesPageSize={TOP_PAGES_PAGE_SIZE}
      onLoadMoreTopPages={handleLoadMoreTopPages}
    />
  );
}
