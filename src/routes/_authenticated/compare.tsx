import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CvComparison } from "@/components/cv/CvComparison";
import { emptyCv, type CvData } from "@/lib/cv-types";
import { useAuth } from "@/lib/auth-context";
import { getUserLimits, type TierLimits } from "@/lib/subscription";
import { BackButton } from "@/components/ui/back-button";

interface CvRow {
  id: string;
  title: string;
  template_id: string;
  data: unknown;
  updated_at: string;
}

export const Route = createFileRoute("/_authenticated/compare")({
  head: () =>
    buildSeo({
      title: "Bandingkan CV - CV Pintar",
      description: "Bandingkan dua versi CV untuk melihat kekuatan, gap, dan kesiapan apply.",
      path: "/compare",
      noindex: true,
    }),
  component: ComparePage,
});

function ComparePage() {
  const { user } = useAuth();
  const [cvs, setCvs] = useState<CvRow[]>([]);
  const [limits, setLimits] = useState<TierLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const [cvResult, userLimits] = await Promise.all([
        supabase
          .from("cvs")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false }),
        getUserLimits(user.id),
      ]);

      if (cvResult.data) {
        setCvs(
          cvResult.data.map((cv) => ({
            ...cv,
            data: { ...emptyCv, ...(cv.data as unknown as CvData) },
          })),
        );
      }
      setLimits(userLimits);
      setLoading(false);
    })();
  }, [user?.id]);

  if (loading) {
    return <div className="container-page py-10 text-sm text-muted-foreground">Memuat...</div>;
  }

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <BackButton />
          <h1 className="font-display text-3xl font-bold text-foreground">Bandingkan CV</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lihat perbedaan struktur, keyword, dan kelengkapan dua versi CV sebelum apply.
          </p>
        </div>
      </div>

      <CvComparison cvs={cvs as unknown as CvVersion[]} canCompare={limits?.canCompare ?? false} />
    </div>
  );
}
