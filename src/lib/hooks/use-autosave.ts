import { useRef, useCallback } from "react";
import { toast } from "sonner";

interface UseAutosaveOptions {
  onSave: (data: unknown) => Promise<boolean>;
  delay?: number;
  showToasts?: boolean;
}

/**
 * useAutosave — onChange-triggered debounced auto-save.
 * Returns a `triggerSave(data)` function to call from onChange handlers.
 * Uses a trailing debounce: only saves after `delay` ms of inactivity.
 */
export function useAutosave({ onSave, delay = 2000, showToasts = true }: UseAutosaveOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const isSavingRef = useRef(false);
  const pendingDataRef = useRef<unknown>(null);
  const lastSavedKeyRef = useRef<string>("");

  // Keep onSave always current
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const performSave = useCallback(
    async (dataToSave: unknown) => {
      if (isSavingRef.current) return;

      const key = JSON.stringify(dataToSave);
      if (key === lastSavedKeyRef.current) return;

      isSavingRef.current = true;
      const toastId = showToasts ? toast("Menyimpan...", { duration: Infinity }) : undefined;

      try {
        const ok = await onSaveRef.current(dataToSave);
        if (ok) {
          lastSavedKeyRef.current = key;
          if (showToasts) {
            toast.dismiss(toastId);
            toast("Tersimpan ✓", { duration: 2000 });
          }
        } else {
          if (showToasts) {
            toast.dismiss(toastId);
            toast("Gagal menyimpan", { duration: 3000 });
          }
        }
      } catch {
        if (showToasts) {
          toast.dismiss(toastId);
          toast("Gagal menyimpan", { duration: 3000 });
        }
      } finally {
        isSavingRef.current = false;

        // If new data arrived while we were saving, schedule another save
        if (pendingDataRef.current) {
          const pending = pendingDataRef.current;
          pendingDataRef.current = null;
          timerRef.current = setTimeout(() => performSave(pending), delay);
        }
      }
    },
    [delay, showToasts],
  );

  /**
   * Call this from onChange handlers.
   * Debounces: if called again within `delay` ms, resets timer.
   */
  const triggerSave = useCallback(
    (data: unknown) => {
      pendingDataRef.current = data;

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        performSave(data);
      }, delay);
    },
    [delay, performSave],
  );

  return { triggerSave };
}
