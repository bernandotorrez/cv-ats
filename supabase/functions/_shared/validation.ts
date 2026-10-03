/**
 * Validasi input sederhana untuk edge functions (batas ukuran → cegah
 * penyalahgunaan biaya AI & DoS). Error-nya aman ditampilkan ke user.
 */

export class ValidationError extends Error {}

/** Batas default (karakter). */
export const LIMITS = {
  shortText: 500,
  text: 5_000,
  longText: 30_000,
  jobDescription: 15_000,
  json: 100_000,
} as const;

/** Pastikan string (opsional) tidak melebihi `max` karakter. */
export function limitText(value: unknown, max: number, field: string): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") throw new ValidationError(`Input ${field} tidak valid.`);
  if (value.length > max) {
    throw new ValidationError(`Input ${field} terlalu panjang (maks ${max} karakter).`);
  }
  return value;
}

/** Pastikan nilai JSON (objek/array) tidak melebihi `max` karakter saat diserialisasi. */
export function limitJson<T>(value: T, max: number, field: string): T {
  if (value === undefined || value === null) return value;
  let size = 0;
  try {
    size = JSON.stringify(value).length;
  } catch {
    throw new ValidationError(`Input ${field} tidak valid.`);
  }
  if (size > max) throw new ValidationError(`Input ${field} terlalu besar.`);
  return value;
}

/**
 * Baca body JSON dengan batas ukuran (default 1 MB).
 * Gunakan sebagai pengganti `await req.json()`.
 */
export async function readJsonBody<T = Record<string, unknown>>(
  req: Request,
  maxBytes = 1_000_000,
): Promise<T> {
  const declared = Number(req.headers.get("content-length") || "0");
  if (declared > maxBytes) throw new ValidationError("Request terlalu besar.");
  const text = await req.text();
  if (text.length > maxBytes) throw new ValidationError("Request terlalu besar.");
  try {
    return (text ? JSON.parse(text) : {}) as T;
  } catch {
    throw new ValidationError("Body JSON tidak valid.");
  }
}
