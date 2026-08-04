/**
 * useTryoutTimer — countdown timer untuk ujian tryout.
 * Auto-submit saat waktu habis via callback `onExpire`.
 */
import { useEffect, useRef, useState } from "react";
import { formatTimer } from "@/lib/tryout-scoring";

type UseTryoutTimerOptions = {
  startedAt: string;
  durationMinutes: number;
  onExpire?: () => void;
};

export function useTryoutTimer({
  startedAt,
  durationMinutes,
  onExpire,
}: UseTryoutTimerOptions) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const startMs = new Date(startedAt).getTime();
    const expiresMs = startMs + durationMinutes * 60_000;
    return Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));
  });

  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  // Keep callback ref up to date without re-running effect
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (remainingSeconds <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current?.();
      }
      return;
    }

    const interval = setInterval(() => {
      const startMs = new Date(startedAt).getTime();
      const expiresMs = startMs + durationMinutes * 60_000;
      const remaining = Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        clearInterval(interval);
        onExpireRef.current?.();
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, durationMinutes]);

  return {
    remainingSeconds,
    display: formatTimer(remainingSeconds),
    isWarning: remainingSeconds <= 5 * 60 && remainingSeconds > 60, // ≤ 5 menit
    isCritical: remainingSeconds <= 60,
  };
}