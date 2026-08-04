# Fix Fitur Paket Lengkap Tryout SKD

## Masalah

Dari screenshot halaman hasil tryout, hanya tampil **ScoreCard** dan **Analisis Per Kategori**. Fitur berikut **tidak muncul** meskipun sudah ada kode-nya:

| Fitur | Masalah |
|-------|---------|
| **Pembahasan lengkap setiap soal** | Section pembahasan tidak muncul sama sekali |
| **Analisis kelemahan perkategori** | Sudah muncul, tapi data kosong (0/0) |
| **Leaderboard nasional** | Hanya link di header, tidak ada ranking user |
| **Statistik per attempt** | Skor semua 0 karena data tidak terload dengan benar |

## Root Cause

### Bug #1: Halaman hasil memanggil `tryout-submit` sebagai data loader

File: `src/routes/_authenticated/tryout.$examId.hasil.$attemptId.tsx` (line 66)

```tsx
// Halaman HASIL memanggil endpoint SUBMIT untuk load data
const res = await fetch(`${supabaseUrl}/functions/v1/tryout-submit`, {
  method: "POST",
  body: JSON.stringify({ attempt_id: attemptId }),
});
```

Edge function `tryout-submit` (line 61-63) **menolak** request ini karena attempt sudah `completed`:

```ts
if (attempt.status !== "in_progress") {
  return json(req, { error: `Attempt sudah ${attempt.status}.` }, 400);
}
```

Akibatnya → masuk ke **fallback path** (catch block).

### Bug #2: Fallback path tidak set `hasPembahasan`

Di fallback (line 87-104), data di-load dari Supabase client langsung, tapi:
- `hasPembahasan` **TIDAK PERNAH DI-SET** → tetap `false` (initial state)
- Sehingga section pembahasan tidak pernah render

```tsx
// Fallback: hasPembahasan TIDAK di-set di sini!
const { data: att } = await supabase
  .from("tryout_attempts")
  .select("*, tryout_exam_sets(*)")
  .eq("id", attemptId)
  .maybeSingle();
// ... setAttempt, setExamSet, setQuestions — tapi BUKAN setHasPembahasan
```

### Bug #3: Tidak ada edge function khusus untuk baca hasil

Saat ini hanya ada `tryout-submit` yang berfungsi ganda (submit + return result), tapi **hanya bisa dipanggil 1x saat submit**. Kunjungan berikutnya ke halaman hasil selalu gagal di endpoint ini.

## Solusi

### 1. [NEW] Buat edge function `tryout-result`

Edge function baru khusus untuk **membaca hasil attempt yang sudah selesai**. Endpoint ini:
- Validasi user owns attempt
- Fetch attempt + exam set + questions (full dengan jawaban + pembahasan)
- Cek paket kredit user → tentukan `has_pembahasan`
- Return data lengkap

**File:** `supabase/functions/tryout-result/index.ts`

```ts
/**
 * tryout-result — Baca hasil attempt tryout yang sudah selesai.
 *
 * Input: { attempt_id: string }
 * Output: { attempt, exam_set, questions, has_pembahasan }
 */
import { corsHeaders } from "../_shared/cors.ts";
import { getAdminClient, getUserId } from "../_shared/ai-common.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  try {
    const userId = await getUserId(req);
    const admin = getAdminClient();

    const body = await req.json().catch(() => ({}));
    const attemptId = (body.attempt_id || "").trim();
    if (!attemptId) {
      return json(req, { error: "attempt_id wajib diisi." }, 400);
    }

    // 1. Fetch attempt + exam set
    const { data: attempt, error: attErr } = await admin
      .from("tryout_attempts")
      .select("*, tryout_exam_sets!inner(*)")
      .eq("id", attemptId)
      .maybeSingle();
    if (attErr) throw attErr;
    if (!attempt) return json(req, { error: "Attempt tidak ditemukan." }, 404);
    if (attempt.user_id !== userId) return json(req, { error: "Forbidden." }, 403);

    // Hanya untuk attempt yang sudah selesai
    if (attempt.status === "in_progress") {
      return json(req, { error: "Attempt masih berjalan." }, 400);
    }

    const examSet = attempt.tryout_exam_sets;

    // 2. Fetch questions (full: termasuk correct_answer, scores, explanation)
    const { data: questions, error: qErr } = await admin
      .from("tryout_questions")
      .select("*")
      .eq("exam_set_id", examSet.id)
      .order("question_number", { ascending: true });
    if (qErr) throw qErr;

    const normalizedQuestions = (questions || []).map((q) => ({
      ...q,
      options: Array.isArray(q.options) ? q.options : [],
    }));

    // 3. Cek apakah paket user termasuk pembahasan
    let hasPembahasan = false;
    if (attempt.credit_id) {
      const { data: credit } = await admin
        .from("tryout_credits")
        .select("tryout_packages!inner(has_pembahasan)")
        .eq("id", attempt.credit_id)
        .maybeSingle();
      hasPembahasan = !!credit?.tryout_packages?.has_pembahasan;
    }

    return json(req, {
      attempt: {
        id: attempt.id,
        user_id: attempt.user_id,
        exam_set_id: examSet.id,
        status: attempt.status,
        score_twk: attempt.score_twk,
        score_tiu: attempt.score_tiu,
        score_tkp: attempt.score_tkp,
        score_total: attempt.score_total,
        pass_twk: attempt.pass_twk,
        pass_tiu: attempt.pass_tiu,
        pass_tkp: attempt.pass_tkp,
        pass_overall: attempt.pass_overall,
        started_at: attempt.started_at,
        finished_at: attempt.finished_at,
        duration_seconds: attempt.duration_seconds,
        answers: attempt.answers || {},
        stats: attempt.stats || {},
      },
      exam_set: examSet,
      questions: normalizedQuestions,
      has_pembahasan: hasPembahasan,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("tryout-result error:", message);
    const status = message.startsWith("Unauthorized") ? 401 : 500;
    return json(req, { error: message }, status);
  }
});

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}
```

---

### 2. [MODIFY] Update halaman hasil untuk pakai `tryout-result`

**File:** `src/routes/_authenticated/tryout.$examId.hasil.$attemptId.tsx`

Ubah fungsi `load()` agar memanggil `tryout-result` (bukan `tryout-submit`):

```tsx
async function load() {
  setLoading(true);
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    // Panggil tryout-result (bukan tryout-submit)
    const res = await fetch(`${supabaseUrl}/functions/v1/tryout-result`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ attempt_id: attemptId }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal memuat hasil");

    setAttempt(data.attempt as TryoutAttempt);
    setExamSet(data.exam_set as TryoutExamSet);
    setQuestions((data.questions || []) as TryoutQuestionFull[]);
    setHasPembahasan(!!data.has_pembahasan);
  } catch (error) {
    console.error("Load result error:", error);

    // Fallback: load dari DB langsung + cek hasPembahasan
    const { data: att } = await supabase
      .from("tryout_attempts")
      .select("*, tryout_exam_sets(*)")
      .eq("id", attemptId)
      .maybeSingle();

    if (att) {
      setAttempt(att as unknown as TryoutAttempt);
      setExamSet((att as any).tryout_exam_sets as TryoutExamSet);

      const { data: qs } = await supabase
        .from("tryout_questions")
        .select("*")
        .eq("exam_set_id", examId)
        .order("question_number", { ascending: true });
      setQuestions((qs as unknown as TryoutQuestionFull[]) || []);

      // FIX: Cek hasPembahasan dari kredit user
      if ((att as any).credit_id) {
        const { data: credit } = await supabase
          .from("tryout_credits")
          .select("package_id, tryout_packages!inner(has_pembahasan)")
          .eq("id", (att as any).credit_id)
          .maybeSingle();
        setHasPembahasan(!!(credit as any)?.tryout_packages?.has_pembahasan);
      }
    }
  } finally {
    setLoading(false);
  }
}
```

---

### 3. [MODIFY] Update `tryout-submit` untuk return hasil setelah submit

**File:** `supabase/functions/tryout-submit/index.ts`

Tidak perlu diubah banyak — fungsi ini sudah benar untuk **submit**. Tapi kita perlu memastikan halaman ujian meredirect ke halaman hasil setelah submit berhasil, dan halaman hasil pakai `tryout-result`.

---

## Checklist Implementasi

- [x] Buat edge function `supabase/functions/tryout-result/index.ts`
- [x] Deploy edge function `tryout-result` ke Supabase
- [x] Update `tryout.$examId.hasil.$attemptId.tsx` → panggil `tryout-result`
- [x] Update fallback path → tambah cek `hasPembahasan` dari kredit
- [ ] Test: buka halaman hasil dari riwayat → pembahasan harus muncul (paket Lengkap)
- [ ] Test: user paket Satuan → pembahasan TIDAK muncul
- [ ] Test: submit tryout baru → redirect ke hasil → pembahasan muncul

## File yang Perlu Diubah

| File | Aksi | Keterangan |
|------|------|------------|
| `supabase/functions/tryout-result/index.ts` | **NEW** | Edge function baca hasil |
| `src/routes/_authenticated/tryout.$examId.hasil.$attemptId.tsx` | **MODIFY** | Ganti `tryout-submit` → `tryout-result` + fix fallback |
