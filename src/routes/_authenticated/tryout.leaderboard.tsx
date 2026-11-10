/**
 * /tryout/leaderboard — Papan peringkat (skor terbaik tiap peserta per set).
 * Data lewat RPC get_tryout_leaderboard: tanpa UUID user, nama disamarkan,
 * cek entitlement paket (flag has_leaderboard) di server.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Medal, Trophy, Users } from "lucide-react";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LeaderboardTable,
  PageHeaderSkeleton,
  TryoutPageHeader,
  type LeaderboardEntry,
} from "@/components/tryout";
import { supabase } from "@/integrations/supabase/client";
import type { TryoutRpcClient } from "@/lib/tryout-types";

export const Route = createFileRoute("/_authenticated/tryout/leaderboard")({
  head: () =>
    buildSeo({
      title: "Leaderboard Tryout - CV Pintar",
      description: "Papan peringkat nasional tryout SKD.",
      path: "/tryout/leaderboard",
      noindex: true,
    }),
  component: TryoutLeaderboardPage,
});

type ExamSet = {
  id: string;
  name: string;
  twk_count: number;
  tiu_count: number;
  tkp_count: number;
};

function TryoutLeaderboardPage() {
  const [examSets, setExamSets] = useState<ExamSet[] | null>(null);
  const [activeSet, setActiveSet] = useState<string>("");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null);
  const [participants, setParticipants] = useState(0);

  useEffect(() => {
    void supabase
      .from("tryout_exam_sets")
      .select("id, name, twk_count, tiu_count, tkp_count")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        const list = (data as ExamSet[]) || [];
        setExamSets(list);
        // Peringkat dihitung per set → default ke set pertama.
        setActiveSet(list[0]?.id ?? "all");
      });
  }, []);

  useEffect(() => {
    if (!activeSet) return;
    void loadLeaderboard(activeSet);
  }, [activeSet]);

  async function loadLeaderboard(setId: string) {
    setLoading(true);
    const { data, error } = await (supabase as unknown as TryoutRpcClient).rpc(
      "get_tryout_leaderboard",
      { p_exam_set_id: setId === "all" ? null : setId, p_limit: 50 },
    );
    if (error) {
      setEntries([]);
      setLocked(false);
      setMyEntry(null);
      setParticipants(0);
    } else {
      const res = (data || {}) as {
        entitled?: boolean;
        entries?: LeaderboardEntry[];
        my_entry?: LeaderboardEntry | null;
        total_participants?: number;
      };
      setLocked(res.entitled === false);
      setEntries(res.entries || []);
      setMyEntry(res.my_entry ?? null);
      setParticipants(res.total_participants ?? 0);
    }
    setLoading(false);
  }

  return (
    <div className="container-page space-y-6 py-5 md:py-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link to={"/tryout" as never}>
          <ArrowLeft className="h-4 w-4" aria-hidden /> Dashboard tryout
        </Link>
      </Button>

      {examSets === null ? (
        <PageHeaderSkeleton withActions={false} />
      ) : (
        <TryoutPageHeader
          eyebrow="Leaderboard nasional"
          icon={<Trophy className="h-3.5 w-3.5" aria-hidden />}
          title="Top pejuang SKD"
          description="Peringkat memakai skor terbaik tiap peserta pada set yang sama. Skor sama diurutkan dari waktu pengerjaan tercepat."
        />
      )}

      {examSets && examSets.length > 1 && (
        <Tabs value={activeSet} onValueChange={setActiveSet}>
          <TabsList className="h-auto flex-wrap justify-start">
            {examSets.map((es) => (
              <TabsTrigger key={es.id} value={es.id}>
                {es.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {!locked && !loading && (
        <section aria-label="Posisi kamu" className="grid gap-3 sm:grid-cols-3">
          <Stat
            icon={<Medal className="h-4 w-4" aria-hidden />}
            label="Peringkatmu"
            value={myEntry ? `#${myEntry.ranking}` : "–"}
            sub={myEntry ? "di set ini" : "selesaikan tryout untuk masuk"}
            highlight={!!myEntry}
          />
          <Stat
            icon={<Trophy className="h-4 w-4" aria-hidden />}
            label="Skor terbaikmu"
            value={myEntry ? String(myEntry.score_total) : "–"}
            sub={(() => {
              const es = examSets?.find((s) => s.id === activeSet);
              return es ? `dari ${5 * (es.twk_count + es.tiu_count + es.tkp_count)}` : "skor total";
            })()}
          />
          <Stat
            icon={<Users className="h-4 w-4" aria-hidden />}
            label="Peserta"
            value={participants.toLocaleString("id-ID")}
            sub="sudah menyelesaikan set ini"
          />
        </section>
      )}

      <section aria-label="Daftar peringkat">
        <LeaderboardTable
          entries={entries}
          loading={loading || !activeSet}
          locked={locked}
          variant="full"
          showExamName={activeSet === "all"}
        />
      </section>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-2xl border border-primary/40 bg-primary/5 p-4 shadow-sm"
          : "rounded-2xl border bg-card p-4 shadow-sm"
      }
    >
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div className="mt-1.5 font-display text-3xl font-extrabold tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}
