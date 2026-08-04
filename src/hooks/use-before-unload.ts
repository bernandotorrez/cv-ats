/**
 * useBeforeUnload — Mencegah user meninggalkan halaman saat ujian berlangsung.
 * Browser akan menampilkan dialog konfirmasi native.
 */
import { useEffect } from "react";

type Options = {
  enabled: boolean;
  message?: string;
};

export function useBeforeUnload({ enabled, message }: Options) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message ?? "Ujian sedang berlangsung. Yakin ingin keluar?";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [enabled, message]);
}