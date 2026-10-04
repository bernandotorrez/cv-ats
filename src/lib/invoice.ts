/**
 * Invoice / bukti pembayaran (PDF) — dibuat di browser dari data order milik
 * user sendiri (tabel payment_orders, dilindungi RLS). Hanya untuk order lunas.
 *
 * Dibuat dengan teks vektor jsPDF (bukan screenshot halaman) sehingga tajam
 * dan berukuran kecil. jsPDF di-import dinamis agar tidak masuk bundle awal.
 */

export interface InvoiceOrder {
  order_id: string;
  product_name: string;
  quantity: number;
  amount_idr: number;
  gateway_amount_idr: number | null;
  paid_at: string | null;
  created_at: string;
  payment_method: string | null;
}

export interface InvoiceCustomer {
  name: string;
  email: string;
}

export const formatIdr = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

export const formatDate = (iso: string | null | undefined, withTime = false) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Asia/Jakarta",
  }).format(d);
};

/** "4 Okt 2026, 15.20 WIB" — ringkas agar muat di kolom detail invoice. */
export const formatDateTimeShort = (iso: string | null | undefined) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const parts = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")} ${get("month")} ${get("year")}, ${get("hour")}.${get("minute")} WIB`;
};

function paymentMethodLabel(method: string | null): string {
  if (!method) return "QRIS";
  return method.toUpperCase() === "QRIS" ? "QRIS" : method;
}

const GREEN: [number, number, number] = [70, 132, 50];
const DARK: [number, number, number] = [17, 24, 39];
const MUTED: [number, number, number] = [107, 114, 128];
const LINE: [number, number, number] = [229, 231, 235];

export async function downloadInvoicePdf(order: InvoiceOrder, customer: InvoiceCustomer) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const left = 20;
  const right = 190;
  const total = order.gateway_amount_idr ?? order.amount_idr;
  const fee = Math.max(total - order.amount_idr, 0);
  const paidAt = order.paid_at || order.created_at;
  let y = 24;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...GREEN);
  doc.text("CV Pintar", left, y);

  doc.setFontSize(22);
  doc.setTextColor(...DARK);
  doc.text("INVOICE", right, y, { align: "right" });

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("cvpintar.web.id", left, y);
  doc.text(`No. ${order.order_id}`, right, y, { align: "right" });

  // Status
  y += 12;
  doc.setDrawColor(...GREEN);
  doc.setFillColor(240, 247, 236);
  doc.roundedRect(right - 28, y - 6, 28, 9, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...GREEN);
  doc.text("LUNAS", right - 14, y, { align: "center" });

  // Billed to / details
  y += 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("DITAGIHKAN KEPADA", left, y);
  doc.text("DETAIL", 120, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text(customer.name || customer.email || "-", left, y, { maxWidth: 85 });
  if (customer.name && customer.email) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(customer.email, left, y + 6, { maxWidth: 85 });
  }

  const details: Array<[string, string]> = [
    ["Tanggal bayar", formatDateTimeShort(paidAt)],
    ["Metode", paymentMethodLabel(order.payment_method)],
    ["Dibuat", formatDate(order.created_at)],
  ];
  details.forEach(([label, value], i) => {
    const rowY = y + i * 6;
    doc.setTextColor(...MUTED);
    doc.text(label, 120, rowY);
    doc.setTextColor(...DARK);
    doc.text(value, right, rowY, { align: "right" });
  });

  // Items table
  y += 28;
  doc.setFillColor(...GREEN);
  doc.rect(left, y, right - left, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("DESKRIPSI", left + 3, y + 6);
  doc.text("QTY", 135, y + 6, { align: "center" });
  doc.text("JUMLAH", right - 3, y + 6, { align: "right" });

  y += 9;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  const nameLines = doc.splitTextToSize(order.product_name, 95) as string[];
  doc.text(nameLines, left + 3, y + 7);
  doc.text(String(order.quantity || 1), 135, y + 7, { align: "center" });
  doc.text(formatIdr(order.amount_idr), right - 3, y + 7, { align: "right" });

  y += 7 + nameLines.length * 5 + 3;
  doc.setDrawColor(...LINE);
  doc.line(left, y, right, y);

  // Totals
  y += 9;
  const totalsLeft = 125;
  const row = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 12 : 10);
    doc.setTextColor(...(bold ? DARK : MUTED));
    doc.text(label, totalsLeft, y);
    doc.setTextColor(...DARK);
    doc.text(value, right - 3, y, { align: "right" });
    y += bold ? 8 : 6;
  };
  row("Subtotal", formatIdr(order.amount_idr));
  if (fee > 0) row("Biaya layanan", formatIdr(fee));
  doc.setDrawColor(...LINE);
  doc.line(totalsLeft, y - 3, right, y - 3);
  y += 2;
  row("Total dibayar", formatIdr(total), true);

  // Footer
  y = 262;
  doc.setDrawColor(...LINE);
  doc.line(left, y, right, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(
    "Dokumen ini dibuat otomatis dan sah sebagai bukti pembayaran tanpa tanda tangan.",
    left,
    y + 6,
  );
  doc.text("Pertanyaan? Hubungi cs@cvpintar.web.id dan sertakan nomor invoice.", left, y + 11);

  const safeId = order.order_id.replace(/[^A-Za-z0-9_-]/g, "");
  doc.save(`Invoice-${safeId}.pdf`);
}
