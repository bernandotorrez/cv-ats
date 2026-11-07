/**
 * Simpan soal TIU figural (hasil generator SVG) ke database (admin only).
 *
 * Alur per soal: upload SVG soal & opsi ke bucket `tryout-images` (path UUID
 * acak) → insert `tryout_questions` dengan opsi {key, text(alt), image_url}
 * dan pembahasan detail bawaan generator. Bila insert gagal, file yang sudah
 * ter-upload dihapus lagi. RLS: hanya admin yang bisa upload & insert.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { FiguralQuestion } from "./tryout-figural";

const BUCKET = "tryout-images";

async function uploadSvg(path: string, svg: string): Promise<string> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, new Blob([svg], { type: "image/svg+xml" }), {
      contentType: "image/svg+xml",
      cacheControl: "31536000",
      upsert: false,
    });
  if (error) throw new Error(`Upload gambar gagal: ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function nextQuestionNumber(examSetId: string): Promise<number> {
  const { data, error } = await supabase
    .from("tryout_questions")
    .select("question_number")
    .eq("exam_set_id", examSetId)
    .order("question_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.question_number ?? 0) + 1;
}

export async function saveFiguralQuestions(
  examSetId: string,
  questions: FiguralQuestion[],
  onProgress?: (done: number, total: number) => void,
): Promise<{ saved: number; failed: number; errors: string[] }> {
  let number = await nextQuestionNumber(examSetId);
  let saved = 0;
  const errors: string[] = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const folder = `figural/${examSetId}/${crypto.randomUUID()}`;
    const uploaded: string[] = [];
    try {
      let questionImage: string | null = null;
      if (q.question_svg) {
        questionImage = await uploadSvg(`${folder}/soal.svg`, q.question_svg);
        uploaded.push(`${folder}/soal.svg`);
      }
      const options = [];
      for (const o of q.options) {
        const path = `${folder}/${o.key}.svg`;
        const url = await uploadSvg(path, o.svg);
        uploaded.push(path);
        options.push({ key: o.key, text: o.alt, image_url: url });
      }
      const { error } = await supabase.from("tryout_questions").insert({
        exam_set_id: examSetId,
        subtest: "tiu",
        question_number: number,
        question_text: q.question_text,
        question_image_url: questionImage,
        options: options as unknown as Json,
        correct_answer: q.correct_answer,
        scores: null,
        explanation: q.explanation,
        explanation_detail: q.explanation_detail as unknown as Json,
        explanation_detail_at: new Date().toISOString(),
        category: "Figural",
        difficulty: q.difficulty,
      });
      if (error) throw new Error(error.message);
      number += 1;
      saved += 1;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
      if (uploaded.length) await supabase.storage.from(BUCKET).remove(uploaded);
      // Nomor bentrok (soal lain masuk bersamaan) → ambil ulang nomor berikutnya.
      number = await nextQuestionNumber(examSetId).catch(() => number + 1);
    }
    onProgress?.(i + 1, questions.length);
  }

  // Sinkronkan total_questions dengan jumlah aktual (sama seperti generator AI).
  const { count } = await supabase
    .from("tryout_questions")
    .select("id", { count: "exact", head: true })
    .eq("exam_set_id", examSetId);
  if (typeof count === "number") {
    await supabase.from("tryout_exam_sets").update({ total_questions: count }).eq("id", examSetId);
  }

  return { saved, failed: questions.length - saved, errors };
}

/** data: URL untuk pratinjau SVG di admin sebelum disimpan. */
export const svgDataUrl = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const MANUAL_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
export const MANUAL_IMAGE_MAX_BYTES = 1024 * 1024;

/**
 * Upload gambar manual (soal/opsi) oleh admin. Hanya PNG/JPEG/WebP ≤ 1 MB —
 * SVG sengaja ditolak karena bisa memuat script. Nama file acak (UUID).
 */
export async function uploadManualImage(
  file: File,
  questionId: string,
  slot: "soal" | "A" | "B" | "C" | "D" | "E",
): Promise<string> {
  const ext = MANUAL_TYPES[file.type];
  if (!ext) throw new Error("Format gambar harus PNG, JPG, atau WebP.");
  if (file.size > MANUAL_IMAGE_MAX_BYTES) throw new Error("Ukuran gambar maksimal 1 MB.");
  const path = `manual/${questionId}/${slot}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(`Upload gagal: ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
