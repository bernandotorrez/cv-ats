import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Download, FileText, File, ChevronDown, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { CvData, TemplateId } from "@/lib/cv-types";
import { generateDocx, downloadBlob, downloadPdf } from "@/lib/cv-export";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  cv: CvData;
  fileName?: string;
  templateId?: TemplateId;
  showWatermark?: boolean;
  className?: string;
  cvId?: string;
  userId?: string;
}

type DownloadStatus = {
  count: number;
  quota: number | null;
};

type SubscriptionWithDownloadQuota = {
  subscription_tiers?: {
    slug?: string;
    quota_cv_downloads?: number | null;
  } | null;
} | null;

export function DownloadDropdown({
  cv,
  fileName = "CV",
  templateId = "jakarta",
  showWatermark = false,
  className,
  cvId,
  userId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [pdfDownloadCount, setPdfDownloadCount] = useState<number | null>(null);
  const [pdfDownloadQuota, setPdfDownloadQuota] = useState<number | null>(showWatermark ? 1 : null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isFreeTier = showWatermark;
  const pdfLimitReached =
    isFreeTier &&
    pdfDownloadQuota !== null &&
    pdfDownloadCount !== null &&
    pdfDownloadCount >= pdfDownloadQuota;

  const fetchDownloadStatus = useCallback(async (): Promise<DownloadStatus> => {
    if (!userId) {
      return { count: 0, quota: isFreeTier ? 1 : null };
    }

    let quota: number | null = isFreeTier ? 1 : null;

    try {
      const { data: rawSub } = await supabase
        .from("user_subscriptions")
        .select("subscription_tiers!inner(slug, quota_cv_downloads)")
        .eq("user_id", userId)
        .eq("status", "active")
        .single();

      const sub = rawSub as SubscriptionWithDownloadQuota;
      const tier = sub?.subscription_tiers;
      quota = tier?.quota_cv_downloads ?? (tier?.slug === "free" ? 1 : null);
    } catch {
      quota = isFreeTier ? 1 : null;
    }

    const { count, error } = await supabase
      .from("cv_downloads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("download_type", "pdf");

    if (error) throw error;

    return { count: count ?? 0, quota };
  }, [isFreeTier, userId]);

  const refreshDownloadStatus = useCallback(async () => {
    try {
      const status = await fetchDownloadStatus();
      setPdfDownloadCount(status.count);
      setPdfDownloadQuota(status.quota);
      return status;
    } catch (error) {
      console.error("Download quota check error:", error);
      return null;
    }
  }, [fetchDownloadStatus]);

  const trackDownload = async (downloadType: "pdf" | "docx") => {
    if (!cvId || !userId) return;
    try {
      await supabase.from("cv_downloads").insert({
        cv_id: cvId,
        user_id: userId,
        download_type: downloadType,
        template_id: templateId,
        file_name: `${fileName}.${downloadType}`,
        user_tier: isFreeTier ? "free" : null,
      });

      await supabase.from("cv_analytics").insert({
        cv_id: cvId,
        user_id: userId,
        event_type: "download",
      });
    } catch (error) {
      console.error("Download tracking error:", error);
      if (downloadType === "pdf" && isFreeTier) throw error;
    }
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open || !userId) return;
    void refreshDownloadStatus();
  }, [open, refreshDownloadStatus, userId]);

  const handleDownloadPdf = async () => {
    setLoading("pdf");
    const status = await refreshDownloadStatus();

    if (!status) {
      setLoading(null);
      toast.error("Gagal memeriksa kuota download. Coba lagi sebentar.");
      return;
    }

    if (status.quota !== null && status.count >= status.quota) {
      setLoading(null);
      toast.error("Kuota download PDF Free sudah habis. Upgrade ke Starter untuk lanjut.");
      return;
    }

    try {
      await trackDownload("pdf");
      setPdfDownloadCount(status.count + 1);
      downloadPdf(cv, `${fileName}.pdf`);
    } catch {
      toast.error("Gagal menyimpan data download. Coba lagi sebentar.");
      setLoading(null);
      return;
    }

    setOpen(false);
    setLoading(null);
  };

  const handleDownloadDocx = async () => {
    if (isFreeTier) return;
    setLoading("docx");
    try {
      const blob = await generateDocx(cv, { template: templateId, watermark: false });
      downloadBlob(blob, `${fileName}.docx`);
      setOpen(false);
      await trackDownload("docx");
    } catch (e) {
      console.error("DOCX generation error:", e);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1"
        onClick={() => setOpen(!open)}
      >
        <Download className="h-3.5 w-3.5" />

        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-[100] bg-popover rounded-lg border border-border shadow-lg py-1 min-w-[160px]">
          {/* PDF Option */}
          <button
            onClick={handleDownloadPdf}
            disabled={loading === "pdf" || pdfLimitReached}
            title={pdfLimitReached ? "Upgrade ke Starter untuk download PDF lagi" : "Download PDF"}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading === "pdf" ? (
              <Loader2 className="h-4 w-4 animate-spin text-red-500" />
            ) : pdfLimitReached ? (
              <Lock className="h-4 w-4 text-muted-foreground" />
            ) : (
              <FileText className="h-4 w-4 text-red-500" />
            )}
            <div className="flex-1">
              <div className="font-medium">{pdfLimitReached ? "Upgrade ke Starter" : "PDF"}</div>
              <div className="text-xs text-muted-foreground">Cetak / Save as PDF</div>
            </div>
          </button>

          {/* DOCX Option */}
          <button
            onClick={handleDownloadDocx}
            disabled={loading === "docx" || isFreeTier}
            title={
              isFreeTier ? "DOCX tersedia untuk paket Starter ke atas" : "Download Microsoft Word"
            }
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading === "docx" ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            ) : isFreeTier ? (
              <Lock className="h-4 w-4 text-muted-foreground" />
            ) : (
              <File className="h-4 w-4 text-blue-600" />
            )}
            <div className="flex-1">
              <div className="font-medium">DOCX</div>
              <div className="text-xs text-muted-foreground">
                {isFreeTier ? "Upgrade untuk download Word" : "Microsoft Word"}
              </div>
            </div>
          </button>

          {isFreeTier && (
            <div className="px-3 py-2 border-t border-border mt-1">
              <p className="text-xs text-muted-foreground">
                Free tier hanya bisa 1x download PDF dengan watermark.
              </p>
              {pdfLimitReached && (
                <Button asChild size="sm" className="mt-2 h-8 w-full text-xs">
                  <Link to="/harga">Upgrade ke Starter</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
