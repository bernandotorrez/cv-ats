import React, { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Trash2, Upload, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoUploadProps {
  photoUrl?: string;
  userId: string;
  cvId: string;
  onPhotoChange: (url: string) => void;
}

export function PhotoUpload({ photoUrl, userId, cvId, onPhotoChange }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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
            disabled={uploading}
            className="gap-1.5 rounded-xl text-xs"
          >
            <Upload className="h-3.5 w-3.5" />
            {photoUrl ? "Ganti Foto" : "Unggah Foto"}
          </Button>

          {photoUrl && (
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
    </div>
  );
}
