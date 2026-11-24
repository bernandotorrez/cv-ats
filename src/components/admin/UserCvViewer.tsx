import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { CvPreview } from "@/components/cv/CvPreview";
import { TEMPLATES, emptyCv, type CvData, type TemplateId } from "@/lib/cv-types";

interface CvSummary {
  id: string;
  title: string;
  template_id: string;
  language: "id" | "en" | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CvFull extends CvSummary {
  user_id: string;
  data: unknown;
}

interface Props {
  user: { id: string; full_name?: string; email?: string } | null;
  onClose: () => void;
}

const VALID_TEMPLATE_IDS = new Set<string>(TEMPLATES.map((t) => t.id));

async function callAdminUsers<T>(params: Record<string, string>): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!token || !supabaseUrl) throw new Error("Session admin tidak valid. Silakan login ulang.");

  const response = await fetch(
    `${supabaseUrl}/functions/v1/admin-users?${new URLSearchParams(params)}`,
    { method: "GET", headers: { Authorization: `Bearer ${token}` } },
  );
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.error) throw new Error(body.error || "Gagal memuat data CV");
  return body as T;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

/** Dialog admin: daftar CV milik satu user + pratinjau read-only tiap CV. */
export function UserCvViewer({ user, onClose }: Props) {
  const [cvs, setCvs] = useState<CvSummary[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [selected, setSelected] = useState<CvFull | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    setSelected(null);
    setCvs([]);
    if (!userId) return;

    let cancelled = false;
    setListLoading(true);
    callAdminUsers<{ cvs: CvSummary[] }>({ userId, cvs: "1" })
      .then((res) => {
        if (!cancelled) setCvs(res.cvs);
      })
      .catch((err: Error) => {
        if (!cancelled) toast.error(err.message);
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const openCv = useCallback(async (cvId: string) => {
    setDetailLoading(true);
    try {
      const res = await callAdminUsers<{ cv: CvFull }>({ cvId });
      setSelected(res.cv);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memuat CV");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const templateId = (
    selected && VALID_TEMPLATE_IDS.has(selected.template_id)
      ? selected.template_id
      : TEMPLATES[0].id
  ) as TemplateId;
  const cvData = selected
    ? ({ ...emptyCv, ...((selected.data as CvData | null) ?? {}) } as CvData)
    : emptyCv;
  const label = user?.full_name || user?.email || "user";

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl w-[95vw] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {selected ? selected.title || "CV tanpa judul" : `CV — ${label}`}
          </DialogTitle>
          <DialogDescription>
            {selected
              ? `Pratinjau read-only · diperbarui ${formatDate(selected.updated_at)}`
              : "Daftar CV milik user ini. Pilih salah satu untuk melihat isinya."}
          </DialogDescription>
        </DialogHeader>

        {selected ? (
          <div className="space-y-3">
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setSelected(null)}>
              <ArrowLeft className="h-4 w-4" /> Kembali ke daftar
            </Button>
            <div className="overflow-x-auto rounded-lg border bg-muted/30 p-2 sm:p-4">
              <div className="mx-auto" style={{ width: "fit-content" }}>
                <CvPreview
                  data={cvData}
                  template={templateId}
                  scale={0.6}
                  language={selected.language ?? "id"}
                />
              </div>
            </div>
          </div>
        ) : listLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : cvs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">User ini belum punya CV.</p>
        ) : (
          <ul className="space-y-2">
            {cvs.map((cv) => (
              <li
                key={cv.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-sm font-medium">
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="truncate">{cv.title || "CV tanpa judul"}</span>
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {cv.template_id}
                    </Badge>
                    <span>{(cv.language ?? "id").toUpperCase()}</span>
                    <span>Diperbarui {formatDate(cv.updated_at)}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={detailLoading}
                  onClick={() => openCv(cv.id)}
                >
                  {detailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lihat"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
