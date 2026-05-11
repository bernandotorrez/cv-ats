import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Link2, AlertCircle } from "lucide-react";
import type { CvData } from "@/lib/cv-types";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  onImport: (data: Partial<CvData>) => void;
}

export function LinkedInImport({ onImport }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidLinkedInUrl = (inputUrl: string) => {
    return inputUrl.includes("linkedin.com/in/");
  };

  const handleImport = async () => {
    setError(null);
    
    const inputText = url.trim();
    
    if (!inputText) {
      toast.error("Masukkan URL LinkedIn dulu.");
      return;
    }

    if (!isValidLinkedInUrl(inputText)) {
      toast.error("URL tidak valid. Pastikan formatnya seperti linkedin.com/in/username");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Silakan login terlebih dahulu");
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/linkedin-import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ linkedinUrl: inputText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengimpor profil");
      }

      const { data: cvData } = await response.json();

      onImport(cvData as Partial<CvData>);
      toast.success("Profil LinkedIn berhasil diimpor! Data sudah diisi di editor.");
    } catch (e: any) {
      const message = e.message || "Gagal mengimpor profil LinkedIn";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="linkedin-url">URL Profil LinkedIn</Label>
        <Input
          id="linkedin-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://linkedin.com/in/username"
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">
          Contoh: https://linkedin.com/in/namakamu
        </p>
      </div>
      
      <div className="bg-primary/5 rounded-lg p-3 text-xs">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-muted-foreground">
            Data akan di-scrape langsung dari profil LinkedIn publik kamu. Nama, headline, pengalaman, 
            pendidikan, skill, dan sertifikat akan otomatis terisi di editor CV.
          </p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          {error}
        </div>
      )}

      <Button 
        onClick={handleImport} 
        disabled={loading || !url.trim()} 
        className="w-full gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Mengambil data LinkedIn...
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4" />
            Import dari LinkedIn
          </>
        )}
      </Button>

      <div className="text-xs text-muted-foreground text-center">
        <p>Profil harus publik agar bisa di-scrape. Data bisa diedit setelahnya.</p>
      </div>
    </div>
  );
}
