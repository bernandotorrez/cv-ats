/**
 * useTryoutTimer — countdown timer ujian tryout.
 *
 * - Dihitung dari started_at server + durasi, dikoreksi selisih jam perangkat
 *   (`clockOffsetMs` = jam server − jam perangkat) agar jam HP yang salah tidak
 *   memotong/menambah waktu.
 * - Tidak berjalan sebelum `startedAt` tersedia (mencegah auto-submit palsu).
 * - `onExpire` dipanggil sekali saat waktu habis.
 */
import { useEffect, useRef, useState } from "react";
import { formatTimer } from "@/lib/tryout-scoring";

type UseTryoutTimerOptions = {
  startedAt: string | null;
  durationMinutes: number;
  clockOffsetMs?: number;
  onExpire?: () => void;
};

function computeRemaining(startedAt: string, durationMinutes: number, offsetMs: number): number {
  const expiresMs = new Date(startedAt).getTime() + durationMinutes * 60_000;
  return Math.max(0, Math.floor((expiresMs - (Date.now() + offsetMs)) / 1000));
}

export function useTryoutTimer({
  startedAt,
  durationMinutes,
  clockOffsetMs = 0,
  onExpire,
}: UseTryoutTimerOptions) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() =>
    startedAt ? computeRemaining(startedAt, durationMinutes, clockOffsetMs) : durationMinutes * 60,
  );

  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!startedAt) return;
    expiredRef.current = false;

    const tick = () => {
      const remaining = computeRemaining(startedAt, durationMinutes, clockOffsetMs);
      setRemainingSeconds(remaining);
      if (remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current?.();
      }
      return remaining;
    };

    if (tick() <= 0) return;
    const interval = setInterval(() => {
      if (tick() <= 0) clearInterval(interval);
    }, 1000);
    // Tab kembali aktif: hitung ulang segera (setInterval di-throttle saat tab di background).
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [startedAt, durationMinutes, clockOffsetMs]);

  const totalSeconds = durationMinutes * 60;
  return {
    remainingSeconds,
    display: formatTimer(remainingSeconds),
    isWarning: remainingSeconds <= 10 * 60 && remainingSeconds > 60,
    isCritical: remainingSeconds <= 60,
    elapsedPercent:
      totalSeconds > 0
        ? Math.min(100, Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100))
        : 0,
  };
}
