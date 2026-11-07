/**
 * Generator soal TIU Figural (gambar SVG) berbasis aturan.
 *
 * Setiap gambar dibuat dari sebuah "state". Kunci jawaban dihitung dari aturan
 * yang sama dengan yang menggambar, sehingga kunci tidak mungkin salah.
 * Pengecoh = state yang melanggar TEPAT SATU aturan. Setiap soal divalidasi
 * (opsi unik, tepat satu kunci, tidak ada opsi lain yang "beda sendiri")
 * sebelum dikembalikan; soal yang gagal validasi dibuat ulang dengan seed lain.
 *
 * Jenis soal:
 *  - serial        : lanjutkan deret 4 gambar.
 *  - ketidaksamaan : cari 1 gambar yang tidak mengikuti aturan.
 *  - analogi       : A → B, maka C → ?
 */
import type { TryoutExplanationDetail } from "./tryout-types";

export type FiguralType = "serial" | "ketidaksamaan" | "analogi";
export type FiguralDifficulty = "easy" | "medium" | "hard";

export type FiguralQuestion = {
  type: FiguralType;
  difficulty: FiguralDifficulty;
  question_text: string;
  /** SVG gambar soal (null untuk ketidaksamaan: semua gambar ada di opsi). */
  question_svg: string | null;
  options: Array<{ key: string; svg: string; alt: string }>;
  correct_answer: string;
  explanation: string;
  explanation_detail: TryoutExplanationDetail;
};

const KEYS = ["A", "B", "C", "D", "E"] as const;
const INK = "#0f172a";
const SHADE = "#cbd5e1";

// ─── RNG deterministik ──────────────────────────────────────────────────────
type Rng = () => number;
function makeRng(seed: number): Rng {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}
const pick = <T>(r: Rng, arr: readonly T[]): T => arr[Math.floor(r() * arr.length)];
function shuffle<T>(r: Rng, arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── State & gambar ─────────────────────────────────────────────────────────
type Shape = "arrow" | "triangle" | "flag";
type State = {
  shape: Shape;
  rot: number; // 0/90/180/270
  dot: number; // sudut 0..3 searah jarum jam dari kiri atas
  shade: "left" | "right";
  bars: number; // 1..6
};

const CORNERS: Array<[number, number]> = [
  [22, 22],
  [98, 22],
  [98, 98],
  [22, 98],
];
const CORNER_NAME = ["kiri atas", "kanan atas", "kanan bawah", "kiri bawah"];
const DIR_NAME: Record<number, string> = { 0: "atas", 90: "kanan", 180: "bawah", 270: "kiri" };

const SHAPE_PATH: Record<Shape, string> = {
  arrow: `<path d="M60 26 L80 54 L67 54 L67 92 L53 92 L53 54 L40 54 Z" fill="${INK}"/>`,
  triangle: `<path d="M60 30 L88 84 L32 84 Z" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`,
  // bendera: asimetris, sehingga rotasinya jelas terlihat
  flag: `<path d="M48 28 L48 92" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M50 30 L84 42 L50 56 Z" fill="${INK}"/>`,
};

function cellSvg(st: State): string {
  const [cx, cy] = CORNERS[st.dot];
  const shade =
    st.shade === "left"
      ? `<rect x="6" y="6" width="54" height="108" fill="${SHADE}"/>`
      : `<rect x="60" y="6" width="54" height="108" fill="${SHADE}"/>`;
  const start = 60 - ((st.bars - 1) * 10 + 6) / 2;
  const bars = Array.from(
    { length: st.bars },
    (_, i) => `<rect x="${start + i * 10}" y="102" width="6" height="11" rx="1" fill="${INK}"/>`,
  ).join("");
  return [
    `<rect x="6" y="6" width="108" height="108" rx="4" fill="#fff"/>`,
    shade,
    `<g transform="rotate(${st.rot} 60 60)">${SHAPE_PATH[st.shape]}</g>`,
    `<circle cx="${cx}" cy="${cy}" r="8" fill="${INK}"/>`,
    bars,
    `<rect x="6" y="6" width="108" height="108" rx="4" fill="none" stroke="${INK}" stroke-width="3"/>`,
  ].join("");
}

const wrap = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="Arial, Helvetica, sans-serif">${body}</svg>`;

const singleSvg = (st: State) =>
  wrap(140, 140, `<g transform="translate(10 10)">${cellSvg(st)}</g>`);

function rowSvg(cells: Array<State | "?" | "arrow">): string {
  const parts = cells.map((c, i) => {
    const x = 10 + i * 140;
    if (c === "?")
      return `<g transform="translate(${x} 10)"><rect x="6" y="6" width="108" height="108" rx="4" fill="#f1f5f9" stroke="#94a3b8" stroke-width="3" stroke-dasharray="8 6"/><text x="60" y="76" text-anchor="middle" font-size="44" font-weight="700" fill="#64748b">?</text></g>`;
    if (c === "arrow")
      return `<g transform="translate(${x} 10)"><path d="M24 60 L88 60 M72 44 L92 60 L72 76" fill="none" stroke="#64748b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    return `<g transform="translate(${x} 10)">${cellSvg(c)}</g>`;
  });
  return wrap(cells.length * 140 + 10, 140, parts.join(""));
}

const sig = (s: State) => `${s.shape}|${s.rot}|${s.dot}|${s.shade}|${s.bars}`;

function describe(st: State): string {
  const shapeName =
    st.shape === "arrow" ? "Panah" : st.shape === "triangle" ? "Segitiga" : "Bendera";
  return `${shapeName} menghadap ${DIR_NAME[st.rot]}, titik di ${CORNER_NAME[st.dot]}, arsiran ${st.shade === "left" ? "kiri" : "kanan"}, ${st.bars} batang`;
}

// ─── Aturan perubahan ───────────────────────────────────────────────────────
type Rule = {
  id: "rot" | "dot" | "shade" | "bars";
  desc: string;
  apply: (s: State, step: number) => State;
  /** Pengecoh: hasil yang melanggar aturan ini saja. */
  violate: (correct: State) => State;
  violation: string;
  /** Nama perubahan (untuk pengecoh yang menambah perubahan tak semestinya). */
  change: string;
};

function rules(r: Rng): Rule[] {
  const rotStep = pick(r, [90, 270]); // searah / berlawanan jarum jam
  const dotStep = pick(r, [1, 3]);
  const rotDir = rotStep === 90 ? "searah" : "berlawanan arah";
  const dotDir = dotStep === 1 ? "searah" : "berlawanan arah";
  return [
    {
      id: "rot",
      desc: `bentuk berputar 90° ${rotDir} jarum jam`,
      apply: (s, n) => ({ ...s, rot: (s.rot + rotStep * n) % 360 }),
      violate: (c) => ({ ...c, rot: (c.rot + 180) % 360 }),
      violation: "arah bentuk tidak sesuai putaran",
      change: "arah bentuk ikut berubah",
    },
    {
      id: "dot",
      desc: `titik berpindah ke sudut berikutnya ${dotDir} jarum jam`,
      apply: (s, n) => ({ ...s, dot: (s.dot + dotStep * n) % 4 }),
      violate: (c) => ({ ...c, dot: (c.dot + 2) % 4 }),
      violation: "posisi titik tidak sesuai perpindahan",
      change: "posisi titik ikut berubah",
    },
    {
      id: "shade",
      desc: "arsiran berpindah sisi kiri/kanan bergantian",
      apply: (s, n) => ({
        ...s,
        shade: n % 2 === 0 ? s.shade : s.shade === "left" ? "right" : "left",
      }),
      violate: (c) => ({ ...c, shade: c.shade === "left" ? "right" : "left" }),
      violation: "arsiran tidak berpindah sisi",
      change: "arsiran ikut berpindah",
    },
    {
      id: "bars",
      desc: "jumlah batang di bawah bertambah satu",
      apply: (s, n) => ({ ...s, bars: s.bars + n }),
      violate: (c) => ({ ...c, bars: c.bars - 1 }),
      violation: "jumlah batang tidak bertambah",
      change: "jumlah batang ikut berubah",
    },
  ];
}

const RULE_COUNT: Record<FiguralDifficulty, number> = { easy: 2, medium: 3, hard: 4 };

function randomBase(r: Rng): State {
  return {
    shape: pick(r, ["arrow", "triangle", "flag"] as const),
    rot: pick(r, [0, 90, 180, 270]),
    dot: Math.floor(r() * 4),
    shade: r() < 0.5 ? "left" : "right",
    bars: 1,
  };
}

/** Susun opsi: kunci + pengecoh, acak urutan, validasi keunikan. */
function buildOptions(
  r: Rng,
  answer: State,
  distractors: Array<{ st: State; why: string }>,
): { options: Array<{ st: State; why: string | null }>; key: string } {
  const all = shuffle(r, [{ st: answer, why: null as string | null }, ...distractors]);
  const sigs = all.map((o) => sig(o.st));
  if (new Set(sigs).size !== 5) throw new Error("opsi kembar");
  if (all.filter((o) => sig(o.st) === sig(answer)).length !== 1) throw new Error("kunci ganda");
  if (all.some((o) => o.st.bars < 1 || o.st.bars > 6)) throw new Error("batang di luar rentang");
  return { options: all, key: KEYS[all.findIndex((o) => o.why === null)] };
}

function detail(
  key: string,
  summary: string,
  concept: string,
  steps: string[],
  options: Array<{ why: string | null }>,
  tips: string,
): TryoutExplanationDetail {
  return {
    v: 1,
    answer: key,
    summary,
    concept,
    steps,
    options: Object.fromEntries(
      options.map((o, i) => [
        KEYS[i],
        o.why ? `Salah — ${o.why}.` : "Benar — memenuhi semua aturan perubahan.",
      ]),
    ),
    tips,
    reference: null,
    generated_at: new Date().toISOString(),
  };
}

// ─── Serial ─────────────────────────────────────────────────────────────────
function serial(r: Rng, difficulty: FiguralDifficulty): FiguralQuestion {
  const active = shuffle(r, rules(r)).slice(0, RULE_COUNT[difficulty]);
  const base = randomBase(r);
  const at = (n: number) => active.reduce((s, rule) => rule.apply(s, n), { ...base });
  const frames = [0, 1, 2, 3].map(at);
  const answer = at(4);

  // 4 pengecoh: tiap aturan aktif dilanggar sekali; sisanya kombinasi 2 pelanggaran.
  const distractors = active.map((rule) => ({ st: rule.violate(answer), why: rule.violation }));
  while (distractors.length < 4) {
    const [a, b] = shuffle(r, active).slice(0, 2);
    const st = b ? b.violate(a.violate(answer)) : a.violate(a.violate(answer));
    const why = b ? `${a.violation} dan ${b.violation}` : a.violation;
    if (!distractors.some((d) => sig(d.st) === sig(st)) && sig(st) !== sig(answer)) {
      distractors.push({ st, why });
    } else {
      // pakai aturan non-aktif sebagai pengecoh tambahan
      const extra = rules(r).find((x) => !active.some((y) => y.id === x.id));
      if (!extra) throw new Error("pengecoh kurang");
      const st2 = extra.violate(answer);
      if (distractors.some((d) => sig(d.st) === sig(st2))) throw new Error("pengecoh kembar");
      distractors.push({
        st: st2,
        why: `${extra.change}, padahal atribut itu tetap sepanjang deret`,
      });
    }
  }
  const { options, key } = buildOptions(r, answer, distractors.slice(0, 4));
  const ruleText = active.map((x) => x.desc);
  return {
    type: "serial",
    difficulty,
    question_text: "Gambar manakah yang tepat untuk melanjutkan deret gambar berikut?",
    question_svg: rowSvg([...frames, "?"]),
    options: options.map((o, i) => ({ key: KEYS[i], svg: singleSvg(o.st), alt: describe(o.st) })),
    correct_answer: key,
    explanation: `Jawaban ${key}. Pada setiap langkah: ${ruleText.join("; ")}.`,
    explanation_detail: detail(
      key,
      `Jawaban yang tepat adalah ${key}. Deret mengikuti ${active.length} aturan perubahan sekaligus, dan hanya gambar ${key} yang memenuhi semuanya.`,
      "TIU figural serial: mengenali beberapa aturan perubahan yang berjalan bersamaan pada setiap langkah deret.",
      [
        ...ruleText.map((t, i) => `Aturan ${i + 1}: ${t}.`),
        "Terapkan semua aturan pada gambar ke-4 untuk mendapatkan gambar ke-5, lalu cocokkan dengan pilihan.",
      ],
      options,
      "Amati satu atribut dalam satu waktu (arah, titik, arsiran, jumlah) dan coret pilihan yang melanggar.",
    ),
  };
}

// ─── Ketidaksamaan ──────────────────────────────────────────────────────────
// Aturan: titik selalu berada di salah satu sudut yang ditunjuk ujung bentuk.
const POINTED: Record<number, number[]> = { 0: [0, 1], 90: [1, 2], 180: [2, 3], 270: [3, 0] };

function oddOneOut(r: Rng, difficulty: FiguralDifficulty): FiguralQuestion {
  const shape: Shape = pick(r, ["arrow", "triangle"] as const);
  const rots = shuffle(r, [0, 90, 180, 270, pick(r, [0, 90, 180, 270])]);
  // Atribut pengecoh seimbang: tiap nilai muncul ≥ 2x (tidak ada "beda sendiri" lain).
  const barsPool = shuffle(r, difficulty === "easy" ? [1, 1, 1, 1, 1] : [1, 1, 2, 2, 2]);
  const shadePool = shuffle(r, ["left", "left", "right", "right", "right"] as const);
  const items: State[] = rots.map((rot, i) => ({
    shape,
    rot,
    dot: pick(r, POINTED[rot]),
    shade: shadePool[i],
    bars: barsPool[i],
  }));
  const odd = Math.floor(r() * 5);
  items[odd] = {
    ...items[odd],
    dot: [0, 1, 2, 3].find((c) => !POINTED[items[odd].rot].includes(c))!,
  };

  // Anti-ambigu: tidak boleh ada gambar LAIN (selain kunci) yang "beda sendiri"
  // pada atribut atau relasi turunan apa pun — kalau ada, gambar itu juga bisa
  // dibela sebagai jawaban.
  const features: Array<(st: State) => string> = [
    (st) => `bars:${st.bars}`,
    (st) => `shade:${st.shade}`,
    (st) => `dotLeft:${st.dot === 0 || st.dot === 3}`,
    (st) => `dotTop:${st.dot === 0 || st.dot === 1}`,
    (st) => `dotOnShade:${(st.dot === 0 || st.dot === 3) === (st.shade === "left")}`,
    (st) => `pointed:${POINTED[st.rot].includes(st.dot)}`,
  ];
  for (const f of features) {
    const counts = new Map<string, number>();
    items.forEach((it) => counts.set(f(it), (counts.get(f(it)) || 0) + 1));
    items.forEach((it, i) => {
      if (i !== odd && counts.get(f(it)) === 1) throw new Error("gambar lain beda sendiri");
    });
  }
  if (new Set(items.map(sig)).size !== 5) throw new Error("gambar kembar");

  const key = KEYS[odd];
  return {
    type: "ketidaksamaan",
    difficulty,
    question_text: "Gambar manakah yang TIDAK mengikuti pola yang sama dengan gambar lainnya?",
    question_svg: null,
    options: items.map((st, i) => ({ key: KEYS[i], svg: singleSvg(st), alt: describe(st) })),
    correct_answer: key,
    explanation: `Jawaban ${key}. Pada gambar lain, titik selalu berada di sudut yang ditunjuk ujung bentuk; pada gambar ${key} titik berada di sisi yang berlawanan.`,
    explanation_detail: {
      v: 1,
      answer: key,
      summary: `Jawaban yang tepat adalah ${key}. Empat gambar lain menempatkan titik di sudut yang ditunjuk ujung bentuk, sedangkan gambar ${key} tidak.`,
      concept:
        "TIU figural ketidaksamaan: menemukan aturan yang dipatuhi mayoritas gambar, lalu mencari satu gambar yang melanggarnya.",
      steps: [
        "Bandingkan arah ujung bentuk dengan posisi titik di setiap gambar.",
        "Pada empat gambar, titik selalu berada di salah satu sudut di sisi yang ditunjuk ujung bentuk.",
        `Gambar ${key} menempatkan titik di sisi yang berlawanan — itulah yang berbeda.`,
        "Arsiran dan jumlah batang tersebar merata sehingga hanya pengecoh.",
      ],
      options: Object.fromEntries(
        items.map((st, i) => [
          KEYS[i],
          i === odd
            ? `Benar — ${describe(st)}; titik tidak berada di sisi yang ditunjuk ujung bentuk.`
            : `Mengikuti pola — ${describe(st)}.`,
        ]),
      ),
      tips: "Cari aturan yang menghubungkan dua elemen (mis. arah dan posisi), bukan atribut yang muncul acak.",
      reference: null,
      generated_at: new Date().toISOString(),
    },
  };
}

// ─── Analogi ────────────────────────────────────────────────────────────────
function analogy(r: Rng, difficulty: FiguralDifficulty): FiguralQuestion {
  const all = rules(r);
  const n = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
  const active = shuffle(r, all).slice(0, n);
  const transform = (s: State) => active.reduce((acc, rule) => rule.apply(acc, 1), { ...s });

  const a = randomBase(r);
  let c = randomBase(r);
  // C harus berbeda bentuk/arah dari A agar analogi tidak trivial.
  let guard = 0;
  while (c.shape === a.shape && c.rot === a.rot && guard++ < 10) c = randomBase(r);
  const b = transform(a);
  const answer = transform(c);

  const distractors: Array<{ st: State; why: string }> = active.map((rule) => ({
    st: rule.violate(answer),
    why: rule.violation,
  }));
  distractors.push({ st: c, why: "tidak ada perubahan yang diterapkan pada gambar ketiga" });
  for (const extra of shuffle(
    r,
    all.filter((x) => !active.includes(x)),
  )) {
    if (distractors.length >= 4) break;
    distractors.push({
      st: extra.apply(answer, 1),
      why: `${extra.change}, padahal perubahan itu tidak ada dari gambar pertama ke kedua`,
    });
  }
  const unique: Array<{ st: State; why: string }> = [];
  for (const d of distractors) {
    if (sig(d.st) !== sig(answer) && !unique.some((u) => sig(u.st) === sig(d.st))) unique.push(d);
  }
  if (unique.length < 4) throw new Error("pengecoh kurang");
  const { options, key } = buildOptions(r, answer, unique.slice(0, 4));
  const ruleText = active.map((x) => x.desc);

  return {
    type: "analogi",
    difficulty,
    question_text:
      "Hubungan gambar pertama dengan gambar kedua sama dengan hubungan gambar ketiga dengan gambar …",
    question_svg: rowSvg(
      [a, "arrow", b, c, "arrow", "?"].map((x) => x) as Array<State | "?" | "arrow">,
    ),
    options: options.map((o, i) => ({ key: KEYS[i], svg: singleSvg(o.st), alt: describe(o.st) })),
    correct_answer: key,
    explanation: `Jawaban ${key}. Dari gambar pertama ke kedua: ${ruleText.join("; ")}. Perubahan yang sama diterapkan pada gambar ketiga.`,
    explanation_detail: detail(
      key,
      `Jawaban yang tepat adalah ${key}. Perubahan dari gambar pertama ke kedua diterapkan persis sama pada gambar ketiga.`,
      "TIU figural analogi: menemukan transformasi antara dua gambar, lalu menerapkannya pada gambar lain.",
      [
        ...ruleText.map((t, i) => `Perubahan ${i + 1}: ${t}.`),
        "Terapkan semua perubahan itu pada gambar ketiga, lalu cari pilihan yang identik.",
      ],
      options,
      "Tuliskan daftar perubahan A → B (arah, titik, arsiran, jumlah) sebelum melihat pilihan jawaban.",
    ),
  };
}

const GENERATORS: Record<FiguralType, (r: Rng, d: FiguralDifficulty) => FiguralQuestion> = {
  serial,
  ketidaksamaan: oddOneOut,
  analogi: analogy,
};

/**
 * Buat satu soal figural. Bila validasi gagal untuk seed tertentu, dicoba
 * seed berikutnya (maks 50x) — soal yang dikembalikan selalu lolos validasi.
 */
export function generateFigural(
  type: FiguralType,
  difficulty: FiguralDifficulty,
  seed: number,
): FiguralQuestion {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      return GENERATORS[type](makeRng(seed + attempt * 7919), difficulty);
    } catch {
      /* coba seed lain */
    }
  }
  throw new Error(`Gagal membuat soal figural ${type}`);
}

/** Buat beberapa soal dengan jenis bergantian & seed acak (kripto). */
export function generateFiguralBatch(
  count: number,
  difficulty: FiguralDifficulty,
  types: FiguralType[] = ["serial", "ketidaksamaan", "analogi"],
): FiguralQuestion[] {
  const out: FiguralQuestion[] = [];
  const seen = new Set<string>();
  const seeds = new Uint32Array(count * 4);
  crypto.getRandomValues(seeds);
  for (let i = 0, s = 0; out.length < count && s < seeds.length; s++, i++) {
    const q = generateFigural(types[i % types.length], difficulty, seeds[s]);
    const fp = q.options.map((o) => o.alt).join("|") + q.question_svg;
    if (seen.has(fp)) continue;
    seen.add(fp);
    out.push(q);
  }
  return out;
}
