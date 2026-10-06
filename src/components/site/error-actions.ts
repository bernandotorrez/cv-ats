import { ArrowLeft } from "lucide-react";
import type { ErrorAction } from "./ErrorState";

/** "Kembali" action that falls back to the home page when there is no history. */
export function goBackAction(label = "Kembali"): ErrorAction {
  return {
    label,
    icon: ArrowLeft,
    onClick: () => {
      if (window.history.length > 1) window.history.back();
      else window.location.assign("/");
    },
  };
}
