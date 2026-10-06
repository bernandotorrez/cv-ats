import type { CvData } from "@/lib/cv-types";

/** Apakah CV punya teks yang layak diterjemahkan (supaya dialog tidak muncul untuk CV kosong). */
export function hasTranslatableContent(cv: CvData): boolean {
  const text = (value: unknown) => typeof value === "string" && value.trim().length > 0;
  if (text(cv.personal?.headline) || text(cv.personal?.summary)) return true;
  return (
    cv.experiences?.some((e) => text(e.position) || text(e.description)) ||
    cv.educations?.some((e) => text(e.degree) || text(e.field) || text(e.description)) ||
    cv.skills?.some((s) => text(s.name)) ||
    cv.languages?.some((l) => text(l.name)) ||
    cv.internships?.some((i) => text(i.position) || text(i.description)) ||
    cv.organizations?.some((o) => text(o.role) || text(o.description)) ||
    false
  );
}
