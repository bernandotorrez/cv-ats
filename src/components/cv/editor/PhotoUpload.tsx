import React, { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Trash2, Upload, User, Sparkles, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PhotoUploadProps {
  photoUrl?: string;
  userId: string;
  cvId: string;
  onPhotoChange: (url: string) => void;
  proPhotoQuota: number;
}

export function PhotoUpload({ photoUrl, userId, cvId, onPhotoChange, proPhotoQuota }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [generatingProPhoto, setGeneratingProPhoto] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [proPhotoProgressText, setProPhotoProgressText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract storage path from signed URL to delete the correct file
  const getPathFromUrl = (url: string) => {
    try {
      const decodedUrl = decodeURIComponent(url);
      const parts = decodedUrl.split("/cv-photos/");
      if (parts.length > 1) {
        return parts[1].split("?")[0];
      }
    } catch (e) {
      console.error("Gagal parse URL foto:", e);
    }
    return null;
  };

  const handleFile = async (file: File) => {
    // 1. Validasi tipe file
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format file tidak didukung. Gunakan JPG, PNG, atau WebP.");
      return;
    }

    // 2. Validasi ukuran file (2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Ukuran file terlalu besar. Maksimal 2MB.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/${cvId}.${fileExt}`;

      // Upload/replace ke storage
      const { error: uploadError } = await supabase.storage
        .from("cv-photos")
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Buat signed URL (1 tahun)
      const { data: signedData, error: signedError } = await supabase.storage
        .from("cv-photos")
        .createSignedUrl(filePath, 31536000); // 1 tahun

      if (signedError) throw signedError;
      if (!signedData?.signedUrl) throw new Error("Gagal membuat url bertanda tangan.");

      onPhotoChange(signedData.signedUrl);
      toast.success("Foto profil berhasil diperbarui!");
    } catch (error: any) {
      console.error("Error upload foto:", error);
      toast.error(error.message || "Gagal mengunggah foto profil.");
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await handleFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await handleFile(file);
    }
  };

  const handleRemovePhoto = async () => {
    if (!photoUrl) return;

    const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus foto profil ini?");
    if (!confirmDelete) return;

    setUploading(true);
    try {
      const pathToDelete = getPathFromUrl(photoUrl);
      if (pathToDelete) {
        // Delete dari Supabase Storage
        const { error: deleteError } = await supabase.storage
          .from("cv-photos")
          .remove([pathToDelete]);

        if (deleteError) {
          console.warn("Gagal menghapus file dari storage (mungkin sudah tidak ada):", deleteError);
        }
      }

      onPhotoChange("");
      toast.success("Foto profil berhasil dihapus.");
    } catch (error: any) {
      console.error("Error hapus foto:", error);
      toast.error("Gagal menghapus foto profil.");
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateProPhotoClick = () => {
    if (!photoUrl) {
      toast.error("Unggah foto kasualmu terlebih dahulu.");
      return;
    }

    if (proPhotoQuota <= 0) {
      setShowUnlockModal(true);
      return;
    }

    setShowConfirmModal(true);
  };

  const executeGenerateProPhoto = async () => {

    setGeneratingProPhoto(true);
    setProPhotoProgressText("Memulai pembuatan foto...");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      if (!token || !supabaseUrl) {
        toast.error("Sesi tidak valid. Silakan login ulang.");
        setGeneratingProPhoto(false);
        return;
      }

      // 1. Create taskId
      const response = await fetch(`${supabaseUrl}/functions/v1/pro-photo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl: photoUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal menghubungi server AI.");
      }

      const { taskId } = await response.json();
      if (!taskId) throw new Error("Gagal menerima ID tugas AI.");

      setProPhotoProgressText("AI sedang memproses foto...");

      // 2. Poll for status
      let attempts = 0;
      const maxAttempts = 40; // 40 * 3s = 120s max

      const pollInterval = setInterval(async () => {
        attempts++;
        if (attempts > maxAttempts) {
          clearInterval(pollInterval);
          setGeneratingProPhoto(false);
          toast.error("Waktu tunggu habis. Silakan coba beberapa saat lagi.");
          return;
        }

        try {
          const statusResponse = await fetch(
            `${supabaseUrl}/functions/v1/pro-photo?taskId=${taskId}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!statusResponse.ok) {
            // ignore temporary network failures
            return;
          }

          const statusData = await statusResponse.json();

          if (statusData.status === "success" && statusData.imageUrl) {
            clearInterval(pollInterval);
            onPhotoChange(statusData.imageUrl);
            setGeneratingProPhoto(false);
            setShowConfirmModal(false);
            toast.success("Foto profesional AI kamu siap!");
          } else if (statusData.status === "failed") {
            clearInterval(pollInterval);
            setGeneratingProPhoto(false);
            setShowConfirmModal(false);
            toast.error(statusData.error || "Gagal membuat foto profesional.");
          } else {
            // status === "generating"
            setProPhotoProgressText(`AI sedang menjahit jas... (${attempts * 3}s)`);
          }
        } catch (pollError) {
          console.error("Polling error:", pollError);
        }
      }, 3000);

    } catch (error: any) {
      console.error("AI photo generation error:", error);
      toast.error(error.message || "Terjadi kesalahan saat memproses foto.");
      setGeneratingProPhoto(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6 pb-6 border-b border-border/50 mb-6">
      <div
        className={`relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-dashed transition-all overflow-hidden bg-muted/30 ${
          isDragging ? "border-primary bg-primary/5 scale-105" : "border-muted-foreground/30"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {photoUrl ? (
          <img src={photoUrl} alt="Foto Profil" className="h-full w-full object-cover" />
        ) : (
          <div className="text-muted-foreground">
            <User className="h-10 w-10 stroke-[1.5]" />
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 text-center sm:text-left">
        <h4 className="text-sm font-semibold text-foreground">Foto Profil (Opsional)</h4>
        <p className="text-xs text-muted-foreground max-w-xs">
          Format JPG, PNG, atau WebP. Maksimal 2MB. Disarankan berasio 1:1.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start mt-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || generatingProPhoto}
            className="gap-1.5 rounded-xl text-xs"
          >
            <Upload className="h-3.5 w-3.5" />
            {photoUrl ? "Ganti Foto" : "Unggah Foto"}
          </Button>

          {photoUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateProPhotoClick}
              disabled={uploading || generatingProPhoto}
              className="gap-1.5 rounded-xl text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border-yellow-200"
            >
              {generatingProPhoto ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {proPhotoProgressText}
                </>
              ) : (
                <>
                  {proPhotoQuota > 0 ? (
                    <Sparkles className="h-3.5 w-3.5 text-yellow-600 fill-yellow-600 animate-pulse" />
                  ) : (
                    <LockKeyhole className="h-3.5 w-3.5 text-yellow-600" />
                  )}
                  {proPhotoQuota > 0 ? `Foto Pro AI (Sisa: ${proPhotoQuota})` : "Foto Pro AI (Jas)"}
                </>
              )}
            </Button>
          )}

          {photoUrl && !generatingProPhoto && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemovePhoto}
              disabled={uploading}
              className="gap-1.5 rounded-xl text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Hapus Foto
            </Button>
          )}
        </div>
      </div>

      {/* Unlock Pro Photo Modal */}
      <Dialog open={showUnlockModal} onOpenChange={setShowUnlockModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <LockKeyhole className="h-5 w-5 text-yellow-600" />
              Fitur Foto Profesional AI
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              Fitur Foto Profesional AI memerlukan kuota generasi. Beli Kuota Add-on untuk menggunakan fitur ini dan menyempurnakan fotomu layaknya di studio profesional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center justify-center space-y-2 rounded-xl bg-muted/50 p-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contoh Hasil</span>
              <img 
                src="/contoh_enhance_photo.png" 
                alt="Contoh Hasil Foto Profesional AI" 
                className="w-48 h-48 object-cover rounded-xl shadow-md border"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold">
                <a href="https://lynk.id/ben-yt-ai/zz5m163mknj6" target="_blank" rel="noopener noreferrer">
                  Beli Kuota Foto Pro (Rp 5.000 / Foto)
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Generate Modal */}
      <Dialog open={showConfirmModal} onOpenChange={(open) => !generatingProPhoto && setShowConfirmModal(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-yellow-600" />
              Konfirmasi Pembuatan Foto
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              Proses ini akan mengkonsumsi <strong>1 Kuota Foto Pro</strong>. Apakah Anda yakin ingin membuat pas foto profesional dari foto profil saat ini?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center justify-center space-y-2 rounded-xl bg-muted/50 p-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contoh Hasil Pas Foto</span>
              <img 
                src="/contoh_enhance_photo.png" 
                alt="Contoh Hasil Foto Profesional AI" 
                className="w-48 h-48 object-cover rounded-xl shadow-md border"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button 
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold"
                onClick={executeGenerateProPhoto}
                disabled={generatingProPhoto}
              >
                {generatingProPhoto ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {proPhotoProgressText || "Memproses..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Enhance Sekarang (Sisa Kuota: {proPhotoQuota})
                  </>
                )}
              </Button>
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => setShowConfirmModal(false)}
                disabled={generatingProPhoto}
              >
                Batal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
