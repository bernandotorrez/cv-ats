/**
 * AI Gateway client — OpenAI-compatible API
 * Endpoint: ai.sumopod.com
 * Model: gemini/gemini-2.5-flash-lite (default, fast & capable)
 */

const AI_GATEWAY_URL =
  process.env.AI_GATEWAY_URL ||
  "https://ai.sumopod.com/v1/chat/completions";
const AI_API_KEY = process.env.AI_API_KEY || "";

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

function buildSystemPrompt(): string {
  return `Kamu adalah asisten AI untuk CV Pintar, platform pembuatan CV ATS-friendly berbahasa Indonesia. Tugasmu membantu pengguna membuat CV profesional yang lolos screening ATS (Applicant Tracking System).

PEDOMAN BAHASA:
- SELALU gunakan Bahasa Indonesia yang formal, profesional, dan mudah dipahami.
- Gunakan kata kerja aktif (action verbs) dalam Bahasa Indonesia: "memimpin", "mengembangkan", "meningkatkan", "mengelola", "merancang", "mengoptimalkan", dll.
- Hindari kata-kata pasif. Gunakan kalimat aktif.
- Sesuaikan dengan budaya kerja Indonesia.

PEDOMAN KONTEN CV ATS-FRIENDLY:
- Gunakan keyword yang relevan dengan industri dan posisi yang dituju.
- Hindari tabel, gambar, grafik, atau kolom dalam body CV.
- Gunakan heading standar: Ringkasan, Pengalaman, Pendidikan, Keahlian.
- Setiap bullet point pengalaman kerja harus:
  1. Dimulai dengan kata kerja aktif
  2. Mencantumkan metrik kuantitatif jika memungkinkan (contoh: "meningkatkan penjualan 30%")
  3. Menjelaskan dampak (impact), bukan hanya tugas
  4. Relevan dengan target posisi
- Ringkasan profil: 2-4 kalimat, mencakup peran saat ini, keahlian utama, dan value proposition.
- Skill: hard skills + soft skills yang relevan. Kelompokkan jika banyak.

FORMAT OUTPUT:
- Untuk saran pengisian: langsung berikan teks saran dalam format yang siap digunakan (bukan JSON), dalam Bahasa Indonesia.
- Untuk scoring: WAJIB output JSON valid dengan struktur yang diminta.
- Untuk chat: berikan jawaban natural dan membantu, gunakan markdown ringan.
- Untuk cover letter: berikan teks surat lengkap dalam Bahasa Indonesia.
- Untuk keyword extraction: berikan daftar keyword.`;
}

export async function aiComplete(
  messages: AiMessage[],
  options: AiCompletionOptions = {},
): Promise<string> {
  const {
    model = "gemini/gemini-2.5-flash-lite",
    temperature = 0.7,
    maxTokens = 2048,
    jsonMode = false,
  } = options;

  if (!AI_API_KEY) {
    throw new Error(
      "AI_API_KEY tidak dikonfigurasi. Tambahkan di environment variables.",
    );
  }

  const allMessages: AiMessage[] = [
    { role: "system", content: buildSystemPrompt() },
    ...messages,
  ];

  const body: Record<string, unknown> = {
    model,
    messages: allMessages,
    temperature,
    max_tokens: maxTokens,
  };

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `AI Gateway error (${res.status}): ${errText.slice(0, 300)}`,
    );
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
    usage?: { total_tokens?: number };
  };

  const content = data.choices?.[0]?.message?.content ?? "";
  return content;
}

export async function aiCompleteStream(
  messages: AiMessage[],
  options: AiCompletionOptions = {},
): Promise<ReadableStream<Uint8Array>> {
  const {
    model = "gemini/gemini-2.5-flash-lite",
    temperature = 0.7,
    maxTokens = 2048,
  } = options;

  if (!AI_API_KEY) {
    throw new Error(
      "AI_API_KEY tidak dikonfigurasi. Tambahkan di environment variables.",
    );
  }

  const allMessages: AiMessage[] = [
    { role: "system", content: buildSystemPrompt() },
    ...messages,
  ];

  const res = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: allMessages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `AI Gateway stream error (${res.status}): ${errText.slice(0, 300)}`,
    );
  }

  return res.body!;
}
