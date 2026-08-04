/**
 * /tryout/leaderboard — Leaderboard global tryout.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { buildSeo } from "@/lib/seo";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeaderboardTable, type LeaderboardEntry } from "@/components/tryout";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/ui/back-button";

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

type ExamSet = { id: string; name: string };

function TryoutLeaderboardPage() {
  const { user } = useAuth();
  const [examSets, setExamSets] = useState<ExamSet[]>([]);
  const [activeSet, setActiveSet] = useState<string>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void supabase
      .from("tryout_exam_sets")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        const list = (data as ExamSet[]) || [];
        setExamSets(list);
      });
  }, []);

  useEffect(() => {
    void loadLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSet]);

  async function loadLeaderboard() {
    setLoading(true);
    let query = supabase
      .from("tryout_leaderboard")
      .select("*")
      .order("ranking", { ascending: true })
      .limit(50);
    if (activeSet !== "all") {
      query = query.eq("exam_set_id", activeSet);
    }
    const { data } = await query;
    setEntries((data as unknown as LeaderboardEntry[]) || []);
    setLoading(false);
  }

  return (
    <div className="container-page space-y-6 py-5 md:py-8">
      <BackButton />

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-6 text-white sm:p-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
            <Trophy className="h-3.5 w-3.5" /> Leaderboard
          </div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            Top Pejuang SKD
          </h1>
          <p className="mt-2 max-w-2xl text-sm opacity-90">
            Bersaing sehat dengan pejuang SKD se-Indonesia. Selesaikan tryout dan
            masuk papan peringkat.
          </p>
        </div>
      </section>

      {examSets.length > 1 && (
        <Tabs value={activeSet} onValueChange={setActiveSet}>
          <TabsList>
            <TabsTrigger value="all">Semua Set</TabsTrigger>
            {examSets.map((es) => (
              <TabsTrigger key={es.id} value={es.id}>
                {es.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <section>
        <LeaderboardTable
          entries={entries}
          currentUserId={user?.id}
          loading={loading}
        />
      </section>

      <section className="rounded-2xl border bg-muted/30 p-5 text-center text-sm text-muted-foreground">
        <p>
          Belum ada di papan peringkat?{" "}
          <Link to={"/tryout" as never} className="font-semibold text-primary hover:underline">
            Mulai tryout sekarang →
          </Link>
        </p>
      </section>
    </div>
  );
}