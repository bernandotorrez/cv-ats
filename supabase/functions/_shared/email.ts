/**
 * Email transaksional via Brevo.
 *
 * Keamanan:
 * - Penerima SELALU email akun (auth.users) milik userId — tidak pernah dari input client.
 * - Semua nilai dinamis di-escape sebelum masuk HTML.
 * - Kegagalan kirim email tidak boleh menggagalkan proses utama (pembayaran/webhook).
 *
 * Secrets:
 * - BREVO_API_KEY (wajib; jika kosong email dilewati dengan log)
 * - EMAIL_FROM (opsional, default "CV Pintar <no-reply@cvpintar.web.id>" — harus sender/domain terverifikasi di Brevo)
 * - SITE_URL (opsional, default https://cvpintar.web.id)
 */
import type { getAdminClient } from "./ai-common.ts";

type AdminClient = ReturnType<typeof getAdminClient>;

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const FROM_EMAIL = Deno.env.get("EMAIL_FROM") || "CV Pintar <no-reply@cvpintar.web.id>";
export const SITE_URL = (Deno.env.get("SITE_URL") || "https://cvpintar.web.id").replace(/\/+$/, "");

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void } | undefined;

/** Jalankan tugas setelah respons dikirim (tidak menahan respons HTTP). */
export function runInBackground(task: Promise<unknown>) {
  const guarded = task.catch((e) => console.error("background task failed:", e));
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
    EdgeRuntime.waitUntil(guarded);
  }
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTimeWib(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(d) + " WIB"
  );
}

/** Email akun dari Supabase Auth (bukan dari tabel yang bisa diubah user). */
export async function getAccountEmail(
  admin: AdminClient,
  userId: string,
): Promise<{ email: string; name: string } | null> {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data?.user?.email) {
    console.error("getAccountEmail failed:", error?.message || "no email");
    return null;
  }
  const meta = (data.user.user_metadata || {}) as Record<string, unknown>;
  const name = typeof meta.full_name === "string" ? meta.full_name : "";
  return { email: data.user.email, name };
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** Pisahkan "Nama <email@domain>" menjadi { name, email }. */
function parseFrom(from: string): { name: string; email: string } {
  const match = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1].replace(/^"|"$/g, ""), email: match[2].trim() };
  return { name: "", email: from.trim() };
}

/** Kirim email via Brevo. Return true jika diterima Brevo; tidak pernah melempar error. */
export async function sendEmail(msg: EmailMessage): Promise<boolean> {
  const apiKey = Deno.env.get("BREVO_API_KEY");
  if (!apiKey) {
    console.warn("sendEmail: BREVO_API_KEY belum diset, email dilewati");
    return false;
  }

  const sender = parseFrom(FROM_EMAIL);
  try {
    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: sender.name ? sender : { email: sender.email },
        to: [{ email: msg.to }],
        subject: msg.subject,
        htmlContent: msg.html,
        textContent: msg.text,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error(`sendEmail via Brevo gagal (${res.status}):`, (await res.text()).slice(0, 500));
      return false;
    }
    return true;
  } catch (e) {
    console.error("sendEmail via Brevo gagal:", e instanceof Error ? e.message : e);
    return false;
  }
}

// ─── Layout ────────────────────────────────────────────────────────

interface LayoutOptions {
  headerTitle: string;
  heading: string;
  introHtml: string;
  summaryTitle: string;
  rows: Array<[string, string]>;
  button: { label: string; url: string };
  noteHtml?: string;
}

/** Layout branded (sama dengan emails/*.html). Semua nilai di `rows` sudah di-escape di sini. */
function renderLayout(o: LayoutOptions): string {
  const rows = o.rows
    .map(
      ([label, value]) => `
                    <tr>
                      <td style="padding: 4px 0">${escapeHtml(label)}</td>
                      <td style="padding: 4px 0; text-align: right; font-weight: 600">${escapeHtml(value)}</td>
                    </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin: 0; padding: 0; font-family: Inter, 'Plus Jakarta Sans', Arial, sans-serif; background: #f9fafb">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb">
      <tr>
        <td align="center" style="padding: 40px 16px">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(70, 132, 50, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)">
            <tr>
              <td style="background: #468432; padding: 32px 32px 24px; text-align: center">
                <div style="font-size: 22px; font-weight: 800; color: #ffffff; font-family: 'Plus Jakarta Sans', Arial, sans-serif">${escapeHtml(o.headerTitle)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px">
                <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #111827">${escapeHtml(o.heading)}</h2>
                <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #374151">${o.introHtml}</p>
                <div style="background: #f0f7ec; border-radius: 8px; padding: 16px; margin-bottom: 24px">
                  <p style="margin: 0 0 8px; font-size: 14px; color: #335f24"><strong>${escapeHtml(o.summaryTitle)}</strong></p>
                  <table cellpadding="0" cellspacing="0" style="font-size: 13px; color: #374151; width: 100%">${rows}
                  </table>
                </div>
                <table cellpadding="0" cellspacing="0" style="margin: 0 auto 24px">
                  <tr>
                    <td style="background: #468432; border-radius: 8px; text-align: center">
                      <a href="${escapeHtml(o.button.url)}" style="display: inline-block; padding: 12px 32px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px">${escapeHtml(o.button.label)}</a>
                    </td>
                  </tr>
                </table>
                <div style="border-top: 1px solid #e5e7eb; padding-top: 16px">
                  ${o.noteHtml ? `<p style="margin: 0 0 4px; font-size: 12px; color: #9ca3af">${o.noteHtml}</p>` : ""}
                  <p style="margin: 0; font-size: 12px; color: #9ca3af">Ada pertanyaan? Hubungi cs@cvpintar.web.id dan sertakan nomor order.</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background: #f3f4f6; padding: 16px 32px; text-align: center">
                <p style="margin: 0; font-size: 12px; color: #9ca3af">© ${new Date().getFullYear()} CV Pintar — cvpintar.web.id</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderText(o: LayoutOptions, introText: string): string {
  return [
    o.heading,
    "",
    introText,
    "",
    ...o.rows.map(([label, value]) => `${label}: ${value}`),
    "",
    `${o.button.label}: ${o.button.url}`,
    "",
    "Ada pertanyaan? Hubungi cs@cvpintar.web.id dan sertakan nomor order.",
  ].join("\n");
}

// ─── Templates ─────────────────────────────────────────────────────

export interface PaymentEmailOrder {
  order_id: string;
  product_name: string;
  amount_idr: number;
  gateway_amount_idr?: number | null;
  payment_link_url?: string | null;
  expires_at?: string | null;
  paid_at?: string | null;
  product_type?: string;
  fulfillment_result?: Record<string, unknown> | null;
}

export function paymentPendingEmail(order: PaymentEmailOrder, name: string) {
  const total = order.gateway_amount_idr ?? order.amount_idr;
  const fee = total - order.amount_idr;
  const rows: Array<[string, string]> = [
    ["Produk", order.product_name],
    ["Harga", formatIdr(order.amount_idr)],
    ...(fee > 0 ? ([["Biaya layanan", formatIdr(fee)]] as Array<[string, string]>) : []),
    ["Total bayar", formatIdr(total)],
    ["Metode", "QRIS (m-banking / e-wallet)"],
    ["Bayar sebelum", formatDateTimeWib(order.expires_at)],
    ["No. Order", order.order_id],
  ];
  const greeting = name ? `Hai ${escapeHtml(name)}, ` : "Hai, ";
  const layout: LayoutOptions = {
    headerTitle: "🧾 Menunggu Pembayaran",
    heading: "Selesaikan pembayaranmu",
    introHtml: `${greeting}pesananmu sudah kami buat. Klik tombol di bawah untuk membayar via QRIS. Akses akan aktif otomatis begitu pembayaran terkonfirmasi.`,
    summaryTitle: "Detail Pembayaran",
    rows,
    button: { label: "Bayar Sekarang", url: order.payment_link_url || `${SITE_URL}/harga` },
    noteHtml: `Link pembayaran berlaku sampai ${escapeHtml(formatDateTimeWib(order.expires_at))}. Abaikan email ini jika kamu tidak merasa membuat pesanan.`,
  };
  return {
    subject: `Menunggu pembayaran: ${order.product_name} (${order.order_id})`,
    html: renderLayout(layout),
    text: renderText(
      layout,
      `${name ? `Hai ${name}, ` : "Hai, "}pesananmu sudah kami buat. Bayar via QRIS lewat link di bawah. Akses aktif otomatis setelah pembayaran terkonfirmasi.`,
    ),
  };
}

const NEXT_STEP: Record<string, { path: string; label: string }> = {
  tier: { path: "/dashboard", label: "Ke Dashboard" },
  addon_upload_cv: { path: "/cv", label: "Ke CV Saya" },
  addon_pro_photo: { path: "/cv", label: "Ke CV Saya" },
  tryout: { path: "/tryout", label: "Mulai Tryout" },
};

export function paymentSuccessEmail(order: PaymentEmailOrder, name: string) {
  const total = order.gateway_amount_idr ?? order.amount_idr;
  const result = order.fulfillment_result || {};
  const rows: Array<[string, string]> = [
    ["Produk", order.product_name],
    ["Total dibayar", formatIdr(total)],
    ["Dibayar pada", formatDateTimeWib(order.paid_at)],
  ];
  if (typeof result.date_end === "string")
    rows.push(["Aktif sampai", formatDateTimeWib(result.date_end)]);
  if (typeof result.upload_cv_end_date === "string") {
    rows.push(["Upload CV aktif sampai", formatDateTimeWib(result.upload_cv_end_date)]);
  }
  if (typeof result.quota_pro_photo_purchased === "number") {
    rows.push(["Sisa kuota Foto Pro (beli)", String(result.quota_pro_photo_purchased)]);
  }
  if (typeof result.credits === "number") rows.push(["Kredit tryout", `${result.credits}x`]);
  rows.push(["No. Order", order.order_id]);

  const next = NEXT_STEP[order.product_type || ""] || NEXT_STEP.tier;
  const greeting = name ? `Hai ${escapeHtml(name)}, ` : "Hai, ";
  const layout: LayoutOptions = {
    headerTitle: "✅ Pembayaran Berhasil",
    heading: "Terima kasih!",
    introHtml: `${greeting}pembayaranmu sudah kami terima dan <strong>${escapeHtml(order.product_name)}</strong> sudah aktif di akunmu.`,
    summaryTitle: "Ringkasan Pembayaran",
    rows,
    button: { label: next.label, url: `${SITE_URL}${next.path}` },
    noteHtml: "Simpan email ini sebagai bukti pembayaran.",
  };
  return {
    subject: `Pembayaran berhasil: ${order.product_name} (${order.order_id})`,
    html: renderLayout(layout),
    text: renderText(
      layout,
      `${name ? `Hai ${name}, ` : "Hai, "}pembayaranmu sudah kami terima dan ${order.product_name} sudah aktif di akunmu.`,
    ),
  };
}

/** Kirim email pembayaran ke pemilik order. Tidak pernah melempar error. */
export async function sendPaymentEmail(
  admin: AdminClient,
  userId: string,
  kind: "pending" | "success",
  order: PaymentEmailOrder,
): Promise<void> {
  try {
    const account = await getAccountEmail(admin, userId);
    if (!account) return;
    const content =
      kind === "pending"
        ? paymentPendingEmail(order, account.name)
        : paymentSuccessEmail(order, account.name);
    await sendEmail({ to: account.email, ...content });
  } catch (e) {
    console.error(`sendPaymentEmail(${kind}) failed:`, e);
  }
}
