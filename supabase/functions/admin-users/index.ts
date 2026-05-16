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

    const url = new URL(req.url);
    const page = clampNumber(Number(url.searchParams.get("page") || "1"), 1, 10000);
    const perPage = clampNumber(Number(url.searchParams.get("perPage") || "10"), 1, 100);
    const search = (url.searchParams.get("search") || "").trim().toLowerCase();
    const tier = (url.searchParams.get("tier") || "all").trim().toLowerCase();

    if (search || tier !== "all") {
      const allAuthUsers = await fetchAllAuthUsers(admin);
      const rows = await buildUserRows(admin, allAuthUsers);
      const filteredRows = rows.filter((user) => {
        const matchesTier = tier === "all" || user.tier === tier;
        const matchesQuery = matchesSearch(user, search);
        return matchesTier && matchesQuery;
      });
      const total = filteredRows.length;
      const start = (page - 1) * perPage;
      const users = filteredRows.slice(start, start + perPage);

      return json(req, {
        users,
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      });
    }

    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });

    if (error) throw error;

    const authUsers = (data.users || []) as AuthUser[];
    const users = await buildUserRows(admin, authUsers);

    return json(req, {
      users,
      page,
      perPage,
      total: data.total || users.length,
      totalPages: Math.ceil((data.total || users.length) / perPage),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("admin-users error:", message);
    return json(req, { error: message }, message.startsWith("Unauthorized") ? 401 : 500);
  }
});

async function fetchAllAuthUsers(admin: ReturnType<typeof getAdminClient>) {
  const perPage = 100;
  let page = 1;
  let total = 0;
  const users: AuthUser[] = [];

  do {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const pageUsers = (data.users || []) as AuthUser[];
    users.push(...pageUsers);
    total = data.total || users.length;
    page += 1;

    if (pageUsers.length === 0) break;
  } while (users.length < total);

  return users;
}

function matchesSearch(user: { id: string; email?: string; full_name?: string }, search: string) {
  if (!search) return true;

  return (
    user.id.toLowerCase().includes(search) ||
    (user.email || "").toLowerCase().includes(search) ||
    (user.full_name || "").toLowerCase().includes(search)
  );
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
