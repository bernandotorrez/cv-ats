import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2, Link2, AlertCircle } from "lucide-react";
import type { CvData } from "@/lib/cv-types";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  onImport: (data: Partial<CvData>) => void;
}

export function LinkedInImport({ onImport }: Props) {
  const [mode, setMode] = useState<"url" | "text">("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidLinkedInUrl = (inputUrl: string) => {
    return inputUrl.includes("linkedin.com/in/");
  };

  const handleImport = async () => {
    setError(null);
    
    const inputText = mode === "url" ? url.trim() : text.trim();
    
    if (!inputText) {
      toast.error(mode === "url" ? "Masukkan URL LinkedIn dulu." : "Tempel teks profil LinkedIn dulu.");
      return;
    }

    if (mode === "url" && !isValidLinkedInUrl(inputText)) {
      toast.error("URL tidak valid. Pastikan formatnya seperti linkedin.com/in/username");
      return;
    }

    setLoading(true);
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Silakan login terlebih dahulu");
      }

      // Call edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/linkedin-import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          input: inputText,
          mode: mode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengimpor profil");
      }

      const { data: cvData } = await response.json();

      onImport(cvData as Partial<CvData>);
      toast.success("Profil berhasil diimpor! Silakan review dan edit di editor.");
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
      {/* Mode Tabs */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as "url" | "text")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url" className="gap-2">
            <Link2 className="h-4 w-4" />
            URL Profil
          </TabsTrigger>
          <TabsTrigger value="text" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Paste Teks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-3 mt-3">
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
              Contoh: https://linkedin.com/in/johndoe
            </p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3 text-xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-muted-foreground">
                AI akan membuat data CV profesional berdasarkan username LinkedIn. 
                Data bisa berbeda dari profil asli — silakan edit sesuai kebutuhan.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="text" className="space-y-3 mt-3">
          <div className="space-y-2">
            <Label htmlFor="linkedin-text">Teks Profil LinkedIn</Label>
            <textarea
              id="linkedin-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tempel teks profil LinkedIn kamu di sini (Ctrl+A, Ctrl+C dari profil)..."
              rows={5}
              maxLength={15000}
              disabled={loading}
              className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Copy teks dari profil LinkedIn (bukan URL). AI akan parse otomatis.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Import Button */}
      <Button 
        onClick={handleImport} 
        disabled={loading || (mode === "url" ? !url.trim() : !text.trim())} 
        className="w-full gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Memproses...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Import dengan AI
          </>
        )}
      </Button>

      {/* Compact guide */}
      <div className="text-xs text-muted-foreground text-center">
        <p>Data yang diimpor bisa diedit setelahnya</p>
      </div>
    </div>
  );
}
