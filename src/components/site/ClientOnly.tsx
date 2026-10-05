import { useEffect, useState, type ReactNode } from "react";

/**
 * Render `children` hanya di browser (setelah hydration).
 *
 * Dipakai untuk pratinjau dekoratif yang berisi konten palsu (mis. CV contoh
 * dengan <h1> nama tokoh). Kalau ikut dirender di server, mesin pencari ikut
 * membaca puluhan <h1> dan ribuan kata CV contoh sebagai isi halaman.
 * Render server dan render client pertama sama-sama menampilkan `fallback`,
 * jadi tidak ada hydration mismatch; wadahnya harus punya ukuran tetap agar
 * tidak ada layout shift.
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <>{mounted ? children : fallback}</>;
}
