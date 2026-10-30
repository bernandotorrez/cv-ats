import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Download, FileText, File, ChevronDown, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { CvData, TemplateId } from "@/lib/cv-types";
import { generateDocx, downloadBlob, downloadPdf } from "@/lib/cv-export";
import { supabase } from "@/integrations/supabase/client";
import { getVisitorId } from "@/lib/analytics";

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

type RecordDownloadResult = {
  allowed: boolean;
  reason?: "quota" | "device" | "docx_locked";
  count?: number;
  quota?: number | null;
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
  const [deviceBlocked, setDeviceBlocked] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isFreeTier = showWatermark;
  const pdfLimitReached =
    isFreeTier &&
    (deviceBlocked ||
      (pdfDownloadQuota !== null &&
        pdfDownloadCount !== null &&
        pdfDownloadCount >= pdfDownloadQuota));

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

  /**
   * Cek kuota & catat download di database (RPC record_cv_download).
   * Untuk Free, server juga menolak jika jatah gratis di device ini sudah
   * dipakai akun lain (reason "device").
   */
  const recordDownload = async (downloadType: "pdf" | "docx"): Promise<RecordDownloadResult> => {
    if (!cvId || !userId) throw new Error("CV atau user belum siap");

    // record_cv_download belum ada di generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("record_cv_download", {
      p_cv_id: cvId,
      p_download_type: downloadType,
      p_template_id: templateId,
      p_file_name: `${fileName}.${downloadType}`,
      p_visitor_id: getVisitorId(),
    });
    if (error) throw error;

    const result = data as RecordDownloadResult;
    if (result.allowed) {
      // cv_analytics belum ada di generated types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("cv_analytics")
        .insert({ cv_id: cvId, user_id: userId, event_type: "download" })
        .then(({ error: analyticsError }: { error: unknown }) => {
          if (analyticsError) console.error("Download analytics error:", analyticsError);
        });
    }
    return result;
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

    let result: RecordDownloadResult;
    try {
      result = await recordDownload("pdf");
    } catch (error) {
      console.error("Download quota check error:", error);
      if (isFreeTier) {
        setLoading(null);
        toast.error("Gagal memeriksa kuota download. Coba lagi sebentar.");
        return;
      }
      // Paket berbayar tidak dibatasi: pencatatan gagal tidak menghalangi download
      result = { allowed: true };
    }

    if (!result.allowed) {
      setLoading(null);
      if (result.reason === "device") {
        setDeviceBlocked(true);
        toast.error(
          <span>
            Jatah download gratis di perangkat ini sudah terpakai, Silahkan{" "}
            <a href="/harga" className="font-semibold underline">
              Upgrade Tier kamu
            </a>
          </span>,
        );
      } else {
        if (typeof result.count === "number") setPdfDownloadCount(result.count);
        if (result.quota !== undefined) setPdfDownloadQuota(result.quota);
        toast.error("Kuota download PDF Free sudah habis. Upgrade ke Starter untuk lanjut.");
      }
      return;
    }

    try {
      if (typeof result.count === "number") setPdfDownloadCount(result.count);
      await downloadPdf(cv, `${fileName}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Gagal membuat file PDF. Coba lagi sebentar.");
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
      await recordDownload("docx").catch((error) =>
        console.error("Download tracking error:", error),
      );
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
        className="h-10 gap-1.5 rounded-xl border-gray-200 px-3 text-sm font-semibold text-gray-800 shadow-none hover:border-green-700 hover:bg-green-50 hover:text-green-800"
        onClick={() => setOpen(!open)}
        aria-label="Unduh CV"
        aria-expanded={open}
        title="Unduh CV (PDF / DOCX)"
      >
        <Download className="h-4 w-4" />
        <span className="hidden 2xl:inline">Unduh</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-[100] mt-2 min-w-[220px] rounded-2xl border border-border bg-popover p-1.5 shadow-xl">
          {/* PDF Option */}
          <button
            onClick={handleDownloadPdf}
            disabled={loading === "pdf" || pdfLimitReached}
            title={pdfLimitReached ? "Upgrade ke Starter untuk download PDF lagi" : "Download PDF"}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-green-50 transition-colors text-left disabled:cursor-not-allowed disabled:opacity-50"
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
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-green-50 transition-colors text-left disabled:cursor-not-allowed disabled:opacity-50"
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
                {deviceBlocked ? (
                  <>
                    Jatah download gratis di perangkat ini sudah terpakai, Silahkan{" "}
                    <Link to="/harga" className="font-semibold text-foreground underline">
                      Upgrade Tier kamu
                    </Link>
                  </>
                ) : (
                  "Free tier hanya bisa 1x download PDF dengan watermark."
                )}
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
