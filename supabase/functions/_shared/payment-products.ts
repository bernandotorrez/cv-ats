/**
 * Katalog produk berbayar — SUMBER KEBENARAN HARGA ada di sini / di database.
 * Client hanya mengirim product key (mis. "tier:pro"), tidak pernah harga.
 */
import type { getAdminClient } from "./ai-common.ts";

type AdminClient = ReturnType<typeof getAdminClient>;

export type ProductType = "tier" | "addon_upload_cv" | "addon_pro_photo" | "tryout";

export interface ResolvedProduct {
  key: string;
  type: ProductType;
  ref: string;
  name: string;
  quantity: number;
  amount: number;
}

// Minimum transaksi SumoPod (IDR)
export const MIN_PAYMENT_AMOUNT = 10000;

// Harga add-on (IDR) per unit. minQty memastikan total >= MIN_PAYMENT_AMOUNT.
// Ubah di sini lalu deploy payment-create.
const ADDONS: Record<
  string,
  { type: ProductType; name: (qty: number) => string; unitPrice: number; minQty: number; maxQty: number }
> = {
  // 1 unit = 1 bulan akses
  upload_cv: {
    type: "addon_upload_cv",
    name: (qty) => `Add-on Upload CV (${qty} bulan)`,
    unitPrice: 5000,
    minQty: 2,
    maxQty: 2,
  },
  // 1 unit = 1 kuota foto
  pro_photo: {
    type: "addon_pro_photo",
    name: (qty) => `Kuota Foto Profesional AI (${qty} kuota)`,
    unitPrice: 5000,
    minQty: 2,
    maxQty: 20,
  },
};

const SLUG_RE = /^[a-z0-9_-]{1,40}$/;

export async function resolveProduct(
  admin: AdminClient,
  productKey: unknown,
  quantityInput: unknown,
): Promise<ResolvedProduct> {
  if (typeof productKey !== "string") throw new Error("Produk tidak valid.");
  const [kind, slug, ...rest] = productKey.trim().toLowerCase().split(":");
  if (rest.length > 0 || !slug || !SLUG_RE.test(slug)) throw new Error("Produk tidak valid.");

  const hasQuantity = quantityInput !== undefined && quantityInput !== null;
  const quantity = hasQuantity ? Number(quantityInput) : 1;
  if (!Number.isInteger(quantity) || quantity < 1) throw new Error("Jumlah tidak valid.");

  const product = await resolveByKind(admin, kind, slug, quantity, hasQuantity);
  if (product.amount < MIN_PAYMENT_AMOUNT) {
    throw new Error(`Minimal pembayaran Rp ${MIN_PAYMENT_AMOUNT.toLocaleString("id-ID")}.`);
  }
  return product;
}

async function resolveByKind(
  admin: AdminClient,
  kind: string,
  slug: string,
  quantity: number,
  hasQuantity: boolean,
): Promise<ResolvedProduct> {
  if (kind === "tier") {
    if (quantity !== 1) throw new Error("Jumlah tidak valid.");
    const { data, error } = await admin
      .from("subscription_tiers")
      .select("slug, name, price_monthly, is_active")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (!data || !data.is_active || !(data.price_monthly > 0)) {
      throw new Error("Paket tidak tersedia.");
    }
    return {
      key: `tier:${slug}`,
      type: "tier",
      ref: slug,
      name: `Paket ${data.name} (30 hari)`,
      quantity: 1,
      amount: data.price_monthly,
    };
  }

  if (kind === "addon") {
    const addon = ADDONS[slug];
    if (!addon) throw new Error("Produk tidak valid.");
    const qty = hasQuantity ? quantity : addon.minQty;
    if (qty < addon.minQty) throw new Error(`Minimal ${addon.minQty} per pembelian.`);
    if (qty > addon.maxQty) throw new Error(`Maksimal ${addon.maxQty} per pembelian.`);
    return {
      key: `addon:${slug}`,
      type: addon.type,
      ref: slug,
      name: addon.name(qty),
      quantity: qty,
      amount: addon.unitPrice * qty,
    };
  }

  if (kind === "tryout") {
    if (quantity !== 1) throw new Error("Jumlah tidak valid.");
    const { data, error } = await admin
      .from("tryout_packages")
      .select("slug, name, price, is_active")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (!data || !data.is_active || !(data.price > 0)) {
      throw new Error("Paket tryout tidak tersedia.");
    }
    return {
      key: `tryout:${slug}`,
      type: "tryout",
      ref: slug,
      name: data.name,
      quantity: 1,
      amount: data.price,
    };
  }

  throw new Error("Produk tidak valid.");
}
