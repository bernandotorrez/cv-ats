import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CvComparison } from "@/components/cv/CvComparison";
import { emptyCv, type CvData } from "@/lib/cv-types";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, ArrowLeftRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/compare")({
  head: () => buildSeo({ title: "Bandingkan CV — CV Pintar", description: "CV Comparison.", path: "/compare", noindex: true }),
  component: ComparePage,
});

function ComparePage() {
  const { user } = useAuth();
  const [cvs, setCvs] = useState<any[]>([]);
  const [tier, setTier] = useState("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: cvData } = await supabase
        .from("cvs")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      if (cvData) {
        setCvs(
          cvData.map((c) => ({
            ...c,
            data: { ...emptyCv, ...(c.data as unknown as CvData) },
          })),
        );
      }
      const { data: sub } = await supabase
        .from("user_subscriptions")
        .select("subscription_tiers!inner(slug)")
        .eq("status", "active")
        .single();
      if (sub) setTier((sub as any).subscription_tiers?.slug ?? "free");
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="container-page py-10 text-sm text-muted-foreground">Memuat...</div>;

  return (
    <div className="container-page py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link to="/cv"><ArrowLeft className="h-4 w-4" /> Kembali ke CV Saya</Link>
          </Button>
          <h1 className="font-display text-3xl font-bold text-foreground">Bandingkan CV</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Side-by-side comparison untuk optimasi CV (Pro).
          </p>
        </div>
      </div>
      <CvComparison cvs={cvs} tier={tier} />
    </div>
  );
}
