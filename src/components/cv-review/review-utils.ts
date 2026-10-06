/** Warna skor yang konsisten di seluruh halaman review. */
export function scoreTone(score: number) {
  if (score >= 80) {
    return {
      label: "Sangat baik",
      text: "text-green-700",
      bar: "bg-green-600",
      pill: "bg-green-50 text-green-800 ring-green-200",
    };
  }
  if (score >= 60) {
    return {
      label: "Cukup baik",
      text: "text-amber-700",
      bar: "bg-amber-500",
      pill: "bg-amber-50 text-amber-900 ring-amber-200",
    };
  }
  return {
    label: "Perlu perbaikan",
    text: "text-red-700",
    bar: "bg-red-500",
    pill: "bg-red-50 text-red-800 ring-red-200",
  };
}

export function formatReviewDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
