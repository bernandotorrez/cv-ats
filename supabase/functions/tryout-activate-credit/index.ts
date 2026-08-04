/**
 * tryout-activate-credit — Admin aktivasi kredit tryout user.
 *
 * Flow:
 * 1. Validasi caller adalah admin.
 * 2. Lookup user by email (atau user_id langsung).
 * 3. Lookup package by slug.
 * 4. Insert `tryout_credits` dengan status active.
 * 5. Return: kredit yang diaktifkan.
 */

import { corsHeaders } from "../_shared/cors.ts";
import { getAdminClient, getUserId } from "../_shared/ai-common.ts";

type ActivateBody = {
  user_email?: string;
  user_id?: string;
  package_slug?: string;
  credits?: number; // override jumlah kredit (default dari package)
  payment_method?: "manual" | "lynk" | "transfer";
  payment_ref?: string;
  notes?: string;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  try {
    const requesterId = await getUserId(req);
    const admin = getAdminClient();

    // 1. Validasi admin
    const { data: role } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", requesterId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) {
      return json(req, { error: "Forbidden: hanya admin." }, 403);
    }

    const body = (await req.json().catch(() => ({}))) as ActivateBody;
    let targetUserId = (body.user_id || "").trim();
    const email = (body.user_email || "").trim().toLowerCase();
    const packageSlug = (body.package_slug || "").trim();

    if (!targetUserId && !email) {
      return json(req, { error: "user_email atau user_id wajib diisi." }, 400);
    }
    if (!packageSlug) {
      return json(req, { error: "package_slug wajib diisi." }, 400);
    }

    // 2. Lookup user_id dari email jika perlu
    if (!targetUserId && email) {
      const { data: profile } = await admin
        .from("profiles")
        .select("id")
        .eq("id", (
          await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
        ).users.find((u) => u.email?.toLowerCase() === email)?.id || "00000000-0000-0000-0000-000000000000")
        .maybeSingle();

      // Fallback: cari via listUsers (untuk demo; production bisa pakai admin.auth.getUserByEmail jika ada)
      if (profile) {
        targetUserId = profile.id;
      } else {
        // Coba listUsers paginated (max 1000)
        const found = await findUserByEmail(admin, email);
        if (!found) {
          return json(req, { error: `User dengan email ${email} tidak ditemukan.` }, 404);
        }
        targetUserId = found;
      }
    }

    // 3. Lookup package
    const { data: pkg, error: pkgErr } = await admin
      .from("tryout_packages")
      .select("*")
      .eq("slug", packageSlug)
      .eq("is_active", true)
      .maybeSingle();
    if (pkgErr) throw pkgErr;
    if (!pkg) {
      return json(req, { error: `Paket ${packageSlug} tidak ditemukan.` }, 404);
    }

    const credits = body.credits && body.credits > 0 ? body.credits : pkg.credits;

    // 4. Insert credits
    const { data: credit, error: insertErr } = await admin
      .from("tryout_credits")
      .insert({
        user_id: targetUserId,
        package_id: pkg.id,
        total_credits: credits,
        used_credits: 0,
        payment_method: body.payment_method || "manual",
        payment_ref: body.payment_ref || null,
        status: "active",
        activated_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (insertErr) throw insertErr;

    return json(req, {
      success: true,
      credit: {
        id: credit.id,
        user_id: targetUserId,
        package_slug: packageSlug,
        total_credits: credit.total_credits,
        remaining_credits: credit.remaining_credits,
        activated_at: credit.activated_at,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("tryout-activate-credit error:", message);
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

async function findUserByEmail(
  admin: ReturnType<typeof getAdminClient>,
  email: string,
): Promise<string | null> {
  // Karena supabase-js tidak punya getUserByEmail, kita pakai listUsers + filter.
  let page = 1;
  const maxPages = 20; // safety
  for (let i = 0; i < maxPages; i++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    const users = data?.users || [];
    const found = users.find((u) => u.email?.toLowerCase() === email);
    if (found) return found.id;
    if (users.length < 100) return null;
    page++;
  }
  return null;
}