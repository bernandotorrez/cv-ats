import { useState, useRef, useEffect } from "react";
import { Download, FileText, File, ChevronDown, Loader2 } from "lucide-react";
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

export function DownloadDropdown({ cv, fileName = "CV", templateId = "jakarta", showWatermark = false, className, cvId, userId }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const trackDownload = async () => {
    if (!cvId || !userId) return;
    try {
      await (supabase as any).from("cv_analytics").insert({
        cv_id: cvId,
        user_id: userId,
        event_type: "download",
      });
    } catch {}
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

  const handleDownloadPdf = () => {
    setOpen(false);
    trackDownload();
    downloadPdf(cv, `${fileName}.pdf`);
  };

  const handleDownloadDocx = async () => {
    setLoading("docx");
    try {
      const blob = await generateDocx(cv, { template: templateId, watermark: showWatermark });
      downloadBlob(blob, `${fileName}.docx`);
      setOpen(false);
      trackDownload();
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
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left"
          >
            <FileText className="h-4 w-4 text-red-500" />
            <div className="flex-1">
              <div className="font-medium">PDF</div>
              <div className="text-xs text-muted-foreground">Cetak / Save as PDF</div>
            </div>
          </button>

          {/* DOCX Option */}
          <button
            onClick={handleDownloadDocx}
            disabled={loading === "docx"}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
          >
            {loading === "docx" ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            ) : (
              <File className="h-4 w-4 text-blue-600" />
            )}
            <div className="flex-1">
              <div className="font-medium">DOCX</div>
              <div className="text-xs text-muted-foreground">Microsoft Word</div>
            </div>
          </button>

          {showWatermark && (
            <div className="px-3 py-2 border-t border-border mt-1">
              <p className="text-xs text-muted-foreground">
                Free tier: PDF dengan watermark
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
