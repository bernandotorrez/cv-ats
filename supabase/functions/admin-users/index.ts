import { corsHeaders } from "../_shared/cors.ts";
import { getAdminClient, getUserId } from "../_shared/ai-common.ts";

type AuthUser = {
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string | null;
  user_metadata?: {
    full_name?: string;
    name?: string;
  };
};

type AdminUsersPageRow = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  role?: string | null;
  tier?: string | null;
  tier_status?: string | null;
  cv_count?: number | null;
  ai_count?: number | null;
  created_at?: string | null;
  auth_created_at?: string | null;
  last_sign_in_at?: string | null;
  total_count?: number | null;
};

type UpdateUserRequest = {
  userId?: string;
  tier?: string;
  role?: string;
};

const VALID_TIERS = new Set(["free", "starter", "pro"]);
const VALID_ROLES = new Set(["user", "admin"]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  try {
    const requesterId = await getUserId(req);
    const admin = getAdminClient();

    const { data: requesterRole, error: roleError } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", requesterId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) throw roleError;
    if (!requesterRole) {
      return json(req, { error: "Forbidden" }, 403);
    }

    if (req.method === "PATCH") {
      const result = await updateUser(req, admin);
      return json(req, result);
    }

    if (req.method !== "GET") {
      return json(req, { error: "Method not allowed" }, 405);
    }

    const url = new URL(req.url);
    const page = clampNumber(Number(url.searchParams.get("page") || "1"), 1, 10000);
    const perPage = clampNumber(Number(url.searchParams.get("perPage") || "10"), 1, 100);
    const search = (url.searchParams.get("search") || "").trim().toLowerCase();
    const tier = (url.searchParams.get("tier") || "all").trim().toLowerCase();
    const sort = (url.searchParams.get("sort") || "desc").trim().toLowerCase();
    const sortOrder = sort === "asc" ? "asc" : "desc";

    const { data, error } = await admin.rpc("admin_list_users_page", {
      search_text: search,
      tier_filter: tier,
      page_num: page,
      page_size: perPage,
      sort_order: sortOrder,
    });

    if (!error) {
      const rows = ((data || []) as AdminUsersPageRow[]).map((user) => ({
        id: user.id,
        email: user.email || "",
        full_name: user.full_name || "",
        role: user.role || "user",
        tier: user.tier || "free",
        tier_status: user.tier_status || "active",
        cv_count: Number(user.cv_count || 0),
        ai_count: Number(user.ai_count || 0),
        created_at: user.created_at || user.auth_created_at || "",
        auth_created_at: user.auth_created_at || "",
        last_sign_in_at: user.last_sign_in_at || null,
      }));
      const total = Number((data?.[0] as AdminUsersPageRow | undefined)?.total_count || 0);

      return json(req, {
        users: rows,
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      });
    }

    console.warn("admin-users rpc fallback:", error.message);

    const { data: authData, error: authError } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (authError) throw authError;

    const authUsers = (authData.users || []) as AuthUser[];
    const users = await buildUserRows(admin, authUsers);

    return json(req, {
      users,
      page,
      perPage,
      total: authData.total || users.length,
      totalPages: Math.ceil((authData.total || users.length) / perPage),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("admin-users error:", message);
    return json(req, { error: message }, message.startsWith("Unauthorized") ? 401 : 500);
  }
});

async function updateUser(req: Request, admin: ReturnType<typeof getAdminClient>) {
  const body = (await req.json().catch(() => ({}))) as UpdateUserRequest;
  const userId = (body.userId || "").trim();
  const tier = (body.tier || "").trim().toLowerCase();
  const role = (body.role || "").trim().toLowerCase();

  if (!isUuid(userId)) {
    throw new Error("User ID tidak valid");
  }
  if (!VALID_TIERS.has(tier)) {
    throw new Error("Tier tidak valid");
  }
  if (!VALID_ROLES.has(role)) {
    throw new Error("Role tidak valid");
  }

  const { data: tierData, error: tierError } = await admin
    .from("subscription_tiers")
    .select("id")
    .eq("slug", tier)
    .single();

  if (tierError || !tierData) {
    throw new Error("Tier subscription tidak ditemukan");
  }

  const now = new Date();
  const defaultEnd = new Date(now);
  defaultEnd.setFullYear(defaultEnd.getFullYear() + (tier === "free" ? 100 : 1));

  const { data: activeSub, error: activeSubError } = await admin
    .from("user_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("date_end", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeSubError) throw activeSubError;

  if (activeSub?.id) {
    const subscriptionUpdate: Record<string, string> = {
      tier_id: tierData.id,
      status: "active",
    };
    if (tier === "free") {
      subscriptionUpdate.date_end = defaultEnd.toISOString();
    }

    const { error: updateSubError } = await admin
      .from("user_subscriptions")
      .update(subscriptionUpdate)
      .eq("id", activeSub.id);

    if (updateSubError) throw updateSubError;
  } else {
    const { error: insertSubError } = await admin.from("user_subscriptions").insert({
      user_id: userId,
      tier_id: tierData.id,
      status: "active",
      date_start: now.toISOString(),
      date_end: defaultEnd.toISOString(),
      provider: "manual",
    });

    if (insertSubError) throw insertSubError;
  }

  const { error: insertRoleError } = await admin
    .from("user_roles")
    .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });

  if (insertRoleError) throw insertRoleError;

  const oldRole = role === "admin" ? "user" : "admin";
  const { error: deleteOldRoleError } = await admin
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", oldRole);
  if (deleteOldRoleError) throw deleteOldRoleError;

  return { ok: true, userId, tier, role };
}

async function buildUserRows(admin: ReturnType<typeof getAdminClient>, authUsers: AuthUser[]) {
  const userIds = authUsers.map((user) => user.id);

  const [profiles, roles, subs, cvs, aiUsage] = await Promise.all([
    userIds.length
      ? admin.from("profiles").select("id, full_name, created_at").in("id", userIds)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? admin.from("user_roles").select("user_id, role").in("user_id", userIds)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? admin
          .from("user_subscriptions")
          .select("user_id, status, subscription_tiers!inner(slug)")
          .in("user_id", userIds)
          .eq("status", "active")
      : Promise.resolve({ data: [] }),
    userIds.length
      ? admin.from("cvs").select("user_id").in("user_id", userIds)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? admin
          .from("ai_usage")
          .select("user_id")
          .in("user_id", userIds)
          .gte("created_at", getMonthStartIso())
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap = new Map(
    (profiles.data || []).map(
      (profile: { id: string; full_name?: string; created_at?: string }) => [profile.id, profile],
    ),
  );
  const roleMap = new Map(
    (roles.data || []).map((role: { user_id: string; role: string }) => [role.user_id, role.role]),
  );
  const subMap = new Map(
    (subs.data || []).map(
      (sub: { user_id: string; status: string; subscription_tiers?: { slug?: string } }) => [
        sub.user_id,
        sub,
      ],
    ),
  );
  const cvCountMap = countByUser(cvs.data || []);
  const aiCountMap = countByUser(aiUsage.data || []);

  return authUsers.map((user) => {
    const profile = profileMap.get(user.id);
    const sub = subMap.get(user.id);
    const metadataName = user.user_metadata?.full_name || user.user_metadata?.name;

    return {
      id: user.id,
      email: user.email || "",
      full_name: profile?.full_name || metadataName || "",
      role: roleMap.get(user.id) || "user",
      tier: sub?.subscription_tiers?.slug || "free",
      tier_status: sub?.status || "active",
      cv_count: cvCountMap[user.id] || 0,
      ai_count: aiCountMap[user.id] || 0,
      created_at: profile?.created_at || user.created_at || "",
      auth_created_at: user.created_at || "",
      last_sign_in_at: user.last_sign_in_at || null,
    };
  });
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.floor(value), min), max);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getMonthStartIso() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  return monthStart.toISOString();
}

function countByUser(rows: Array<{ user_id?: string }>) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    if (!row.user_id) return acc;
    acc[row.user_id] = (acc[row.user_id] || 0) + 1;
    return acc;
  }, {});
}
