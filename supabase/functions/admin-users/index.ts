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
  has_upload_cv?: boolean;
  upload_cv_end_date?: string | null;
  quota_pro_photo?: number;
  quota_pro_photo_purchased?: number;
  quota_upload_cv?: number;
  tryout_credits?: number;
  tryout_used?: number;
};

type UpdateUserRequest = {
  userId?: string;
  tier?: string;
  role?: string;
  has_upload_cv?: boolean;
  quota_pro_photo?: number;
  quota_upload_cv?: number;
  tryout_credits?: number;
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
      const result = await updateUser(req, admin, requesterId);
      return json(req, result);
    }

    if (req.method !== "GET") {
      return json(req, { error: "Method not allowed" }, 405);
    }

    const url = new URL(req.url);
    const page = clampNumber(Number(url.searchParams.get("page") || "1"), 1, 10000);
    const perPage = clampNumber(Number(url.searchParams.get("perPage") || "10"), 1, 1000);
    const search = (url.searchParams.get("search") || "").trim().toLowerCase();
    const tier = (url.searchParams.get("tier") || "all").trim().toLowerCase();
    const sort = (url.searchParams.get("sort") || "desc").trim().toLowerCase();
    const sortOrder = sort === "asc" ? "asc" : "desc";

    if (perPage > 100) {
      const allAuthUsers: AuthUser[] = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore && allAuthUsers.length < 5000) {
        const { data: authData, error: authError } = await admin.auth.admin.listUsers({
          page: currentPage,
          perPage: 1000,
        });

        if (authError || !authData?.users || authData.users.length === 0) {
          hasMore = false;
        } else {
          allAuthUsers.push(...(authData.users as AuthUser[]));
          const totalInAuth = authData.total || 0;
          if (
            (totalInAuth > 0 && allAuthUsers.length >= totalInAuth) ||
            authData.users.length < 50
          ) {
            hasMore = false;
          } else {
            currentPage++;
          }
        }
      }

      if (allAuthUsers.length > 0) {
        const users = await buildUserRows(admin, allAuthUsers);

        let filteredUsers = users;
        if (search) {
          filteredUsers = users.filter(
            (u) =>
              u.email?.toLowerCase().includes(search) ||
              u.full_name?.toLowerCase().includes(search) ||
              u.id.toLowerCase().includes(search) ||
              u.role?.toLowerCase().includes(search),
          );
        }

        return json(req, {
          users: filteredUsers,
          page,
          perPage,
          total: users.length,
          totalPages: 1,
        });
      }
    }

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

      const userIds = rows.map((u) => u.id);
      let profileMap = new Map();
      if (userIds.length > 0) {
        const { data: profiles } = await admin
          .from("profiles")
          .select(
            "id, has_upload_cv, upload_cv_end_date, quota_pro_photo, quota_pro_photo_purchased, quota_upload_cv",
          )
          .in("id", userIds);
        profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      }

      const now = new Date();
      const rowsWithUploadCv = rows.map((user) => {
        const p = profileMap.get(user.id);
        const endDateStr = p?.upload_cv_end_date;
        let isUnlocked = p?.has_upload_cv || false;
        if (endDateStr) {
          isUnlocked = new Date(endDateStr) > now;
        }

        return {
          ...user,
          has_upload_cv: isUnlocked,
          upload_cv_end_date: endDateStr || null,
          quota_pro_photo: p?.quota_pro_photo || 0,
          quota_pro_photo_purchased: p?.quota_pro_photo_purchased || 0,
          quota_upload_cv: p?.quota_upload_cv || 0,
        };
      });

      const total = Number((data?.[0] as AdminUsersPageRow | undefined)?.total_count || 0);

      return json(req, {
        users: rowsWithUploadCv,
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
    const message = error instanceof Error ? error.message : String(error);
    console.error("admin-users error:", message);
    if (error instanceof BadRequestError) {
      return json(req, { error: message }, 400);
    }
    if (message.startsWith("Unauthorized")) {
      return json(req, { error: "Unauthorized" }, 401);
    }
    return json(req, { error: "Internal server error" }, 500);
  }
});

class BadRequestError extends Error {}

/**
 * PATCH /admin-users — partial update.
 *
 * The admin UI always sends every field, so each field is compared with the
 * user's current state and only written when it actually changes. This keeps
 * unrelated edits (e.g. a quota change) from resetting the subscription
 * date_end or the upload-CV unlock.
 */
async function updateUser(
  req: Request,
  admin: ReturnType<typeof getAdminClient>,
  requesterId: string,
) {
  const body = (await req.json().catch(() => ({}))) as UpdateUserRequest;
  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const tier = typeof body.tier === "string" ? body.tier.trim().toLowerCase() : undefined;
  const role = typeof body.role === "string" ? body.role.trim().toLowerCase() : undefined;
  const hasUploadCv = typeof body.has_upload_cv === "boolean" ? body.has_upload_cv : undefined;
  const quota_pro_photo =
    typeof body.quota_pro_photo === "number" ? body.quota_pro_photo : undefined;
  const quota_upload_cv =
    typeof body.quota_upload_cv === "number" ? body.quota_upload_cv : undefined;
  const tryoutCredits = typeof body.tryout_credits === "number" ? body.tryout_credits : undefined;

  // SECURITY: Validate everything before writing anything
  const MAX_QUOTA_PRO_PHOTO = 100;
  const MAX_QUOTA_UPLOAD_CV = 200;

  if (!isUuid(userId)) {
    throw new BadRequestError("User ID tidak valid");
  }
  if (tier !== undefined && !VALID_TIERS.has(tier)) {
    throw new BadRequestError("Tier tidak valid");
  }
  if (role !== undefined && !VALID_ROLES.has(role)) {
    throw new BadRequestError("Role tidak valid");
  }
  if (quota_pro_photo !== undefined) {
    if (
      !Number.isInteger(quota_pro_photo) ||
      quota_pro_photo < 0 ||
      quota_pro_photo > MAX_QUOTA_PRO_PHOTO
    ) {
      throw new BadRequestError(`Kuota Pro Photo harus antara 0-${MAX_QUOTA_PRO_PHOTO}`);
    }
  }
  if (quota_upload_cv !== undefined) {
    if (
      !Number.isInteger(quota_upload_cv) ||
      quota_upload_cv < 0 ||
      quota_upload_cv > MAX_QUOTA_UPLOAD_CV
    ) {
      throw new BadRequestError(`Kuota Upload CV harus antara 0-${MAX_QUOTA_UPLOAD_CV}`);
    }
  }
  if (tryoutCredits !== undefined) {
    if (!Number.isInteger(tryoutCredits) || tryoutCredits < 0 || tryoutCredits > 100) {
      throw new BadRequestError("Kuota Tryout harus antara 0-100");
    }
  }

  const changes: string[] = [];
  const now = new Date();

  // ── Role (validated first so a forbidden demotion changes nothing) ──────────
  const { data: currentRoles, error: currentRolesError } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (currentRolesError) throw currentRolesError;

  const roleRows = (currentRoles || []) as Array<{ role: string }>;
  const currentRole = roleRows.some((r) => r.role === "admin")
    ? "admin"
    : (roleRows[0]?.role ?? null);
  const roleChanged = role !== undefined && (currentRole !== role || roleRows.length > 1);

  if (roleChanged && currentRole === "admin" && role !== "admin") {
    const { count: adminCount, error: adminCountError } = await admin
      .from("user_roles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "admin");
    if (adminCountError) throw adminCountError;
    if ((adminCount ?? 0) <= 1) {
      throw new BadRequestError(
        userId === requesterId
          ? "Anda adalah admin terakhir — tidak bisa menurunkan role sendiri."
          : "Tidak bisa menghapus admin terakhir.",
      );
    }
  }

  // ── Subscription tier (only when provided and different) ───────────────────
  if (tier !== undefined) {
    const { data: activeSub, error: activeSubError } = await admin
      .from("user_subscriptions")
      .select("id, tier_id, subscription_tiers(slug)")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("date_end", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (activeSubError) throw activeSubError;

    const currentTier = activeSub
      ? ((activeSub as unknown as { subscription_tiers?: { slug?: string } | null })
          .subscription_tiers?.slug ?? null)
      : null;

    if (!activeSub || currentTier !== tier) {
      const { data: tierData, error: tierError } = await admin
        .from("subscription_tiers")
        .select("id")
        .eq("slug", tier)
        .single();
      if (tierError || !tierData) {
        throw new BadRequestError("Tier subscription tidak ditemukan");
      }

      // date_end NOT NULL: free tier "tidak kedaluwarsa" = +100 tahun (sama dengan handle_new_user);
      // paid tiers granted manually run 30 days.
      const end = new Date(now);
      if (tier === "free") end.setFullYear(end.getFullYear() + 100);
      else end.setDate(end.getDate() + 30);
      const dateEnd = end.toISOString();

      if (activeSub?.id) {
        const { error: updateSubError } = await admin
          .from("user_subscriptions")
          .update({
            tier_id: tierData.id,
            status: "active",
            date_start: now.toISOString(),
            date_end: dateEnd,
          })
          .eq("id", activeSub.id);
        if (updateSubError) throw updateSubError;
      } else {
        const { error: insertSubError } = await admin.from("user_subscriptions").insert({
          user_id: userId,
          tier_id: tierData.id,
          status: "active",
          date_start: now.toISOString(),
          date_end: dateEnd,
          provider: "manual",
        });
        if (insertSubError) throw insertSubError;
      }
      changes.push("tier");
    }
  }

  // ── Role change: add the new role first, then remove the others, so the user
  //    is never left without a role if a step fails. ──────────────────────────
  if (roleChanged && role !== undefined) {
    const { error: upsertRoleError } = await admin
      .from("user_roles")
      .upsert({ user_id: userId, role }, { onConflict: "user_id,role", ignoreDuplicates: true });
    if (upsertRoleError) throw upsertRoleError;

    const { error: deleteOtherRolesError } = await admin
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .neq("role", role);
    if (deleteOtherRolesError) throw deleteOtherRolesError;
    changes.push("role");
  }

  // ── Profile flags & quotas (only fields that were provided and differ) ──────
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("has_upload_cv, upload_cv_end_date, quota_pro_photo, quota_upload_cv")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) throw profileError;

  const currentUploadCvEnd = (profile?.upload_cv_end_date as string | null | undefined) ?? null;
  const currentUploadCvUnlocked = currentUploadCvEnd
    ? new Date(currentUploadCvEnd) > now
    : Boolean(profile?.has_upload_cv);

  const profilePayload: Record<string, unknown> = {};
  let uploadCvEndDate: string | null = currentUploadCvEnd;

  if (hasUploadCv !== undefined && hasUploadCv !== currentUploadCvUnlocked) {
    if (hasUploadCv) {
      const end = new Date(now);
      end.setMonth(end.getMonth() + 1);
      uploadCvEndDate = end.toISOString();
    } else {
      uploadCvEndDate = null;
    }
    profilePayload.has_upload_cv = hasUploadCv;
    profilePayload.upload_cv_end_date = uploadCvEndDate;
  }
  if (quota_pro_photo !== undefined && quota_pro_photo !== profile?.quota_pro_photo) {
    profilePayload.quota_pro_photo = quota_pro_photo;
  }
  if (quota_upload_cv !== undefined && quota_upload_cv !== profile?.quota_upload_cv) {
    profilePayload.quota_upload_cv = quota_upload_cv;
  }

  if (Object.keys(profilePayload).length > 0) {
    const { error: profileUpdateError } = await admin
      .from("profiles")
      .update(profilePayload)
      .eq("id", userId);
    if (profileUpdateError) throw profileUpdateError;
    changes.push(...Object.keys(profilePayload));
  }

  // ── Tryout credits ──────────────────────────────────────────────────────────
  let tryoutCreditsResult = null;

  if (tryoutCredits !== undefined) {
    // Get the tryout package "satuan" for credit reference
    const { data: tryoutPackage } = await admin
      .from("tryout_packages")
      .select("id")
      .eq("slug", "satuan")
      .maybeSingle();

    if (tryoutPackage) {
      // Check if user has existing tryout credits
      const { data: existingCredits } = await admin
        .from("tryout_credits")
        .select("id, total_credits, used_credits")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingCredits) {
        if (existingCredits.total_credits !== tryoutCredits) {
          // Set total_credits to new value, preserve used_credits
          const newUsed = Math.min(existingCredits.used_credits, tryoutCredits);
          const { error: updateCreditsError } = await admin
            .from("tryout_credits")
            .update({
              total_credits: tryoutCredits,
              used_credits: newUsed,
            })
            .eq("id", existingCredits.id);
          if (updateCreditsError) throw updateCreditsError;
          tryoutCreditsResult = {
            total: tryoutCredits,
            used: newUsed,
            remaining: tryoutCredits - newUsed,
          };
          changes.push("tryout_credits");
        }
      } else if (tryoutCredits > 0) {
        const { error: insertCreditsError } = await admin.from("tryout_credits").insert({
          user_id: userId,
          package_id: tryoutPackage.id,
          total_credits: tryoutCredits,
          used_credits: 0,
          payment_method: "manual",
          status: "active",
          activated_at: new Date().toISOString(),
        });
        if (insertCreditsError) throw insertCreditsError;
        tryoutCreditsResult = { total: tryoutCredits, used: 0, remaining: tryoutCredits };
        changes.push("tryout_credits");
      }
    }
  }

  // Audit trail (server logs)
  console.log(
    JSON.stringify({
      event: "admin_user_update",
      admin_id: requesterId,
      target_user_id: userId,
      changes,
    }),
  );

  return {
    ok: true,
    userId,
    tier,
    role,
    has_upload_cv: hasUploadCv,
    upload_cv_end_date: uploadCvEndDate,
    quota_pro_photo,
    quota_upload_cv,
    tryout_credits: tryoutCreditsResult,
    changes,
  };
}

async function buildUserRows(admin: ReturnType<typeof getAdminClient>, authUsers: AuthUser[]) {
  const userIds = authUsers.map((user) => user.id);

  const [profiles, roles, subs, cvs, aiUsage, tryoutCreditsData] = await Promise.all([
    userIds.length
      ? admin
          .from("profiles")
          .select(
            "id, full_name, created_at, has_upload_cv, upload_cv_end_date, quota_pro_photo, quota_pro_photo_purchased, quota_upload_cv",
          )
          .in("id", userIds)
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
    userIds.length
      ? admin
          .from("tryout_credits")
          .select("user_id, total_credits, used_credits")
          .in("user_id", userIds)
          .eq("status", "active")
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap = new Map(
    (profiles.data || []).map(
      (profile: {
        id: string;
        full_name?: string;
        created_at?: string;
        has_upload_cv?: boolean;
        upload_cv_end_date?: string | null;
        quota_pro_photo?: number;
        quota_pro_photo_purchased?: number;
        quota_upload_cv?: number;
      }) => [profile.id, profile],
    ),
  );
  const roleMap = new Map(
    (roles.data || []).map((role: { user_id: string; role: string }) => [role.user_id, role.role]),
  );
  const subMap = new Map(
    (
      (subs.data || []) as unknown as Array<{
        user_id: string;
        status: string;
        subscription_tiers?: { slug?: string };
      }>
    ).map((sub) => [sub.user_id, sub]),
  );
  const cvCountMap = countByUser(cvs.data || []);
  const aiCountMap = countByUser(aiUsage.data || []);

  // Process tryout credits - aggregate per user
  const tryoutCreditsMap: Record<string, { total: number; used: number }> = {};
  for (const tc of tryoutCreditsData.data || []) {
    const uid = tc.user_id;
    if (!tryoutCreditsMap[uid]) tryoutCreditsMap[uid] = { total: 0, used: 0 };
    tryoutCreditsMap[uid].total += tc.total_credits || 0;
    tryoutCreditsMap[uid].used += tc.used_credits || 0;
  }

  return authUsers.map((user) => {
    const profile = profileMap.get(user.id);
    const sub = subMap.get(user.id);
    const metadataName = user.user_metadata?.full_name || user.user_metadata?.name;
    const tc = tryoutCreditsMap[user.id];

    const now = new Date();
    let isUnlocked = profile?.has_upload_cv || false;
    if (profile?.upload_cv_end_date) {
      isUnlocked = new Date(profile.upload_cv_end_date) > now;
    }

    return {
      id: user.id,
      email: user.email || "",
      full_name: profile?.full_name || metadataName || "",
      role: roleMap.get(user.id) || "user",
      tier: sub?.subscription_tiers?.slug || "free",
      tier_status: sub?.status || "active",
      cv_count: cvCountMap[user.id] || 0,
      ai_count: aiCountMap[user.id] || 0,
      has_upload_cv: isUnlocked,
      upload_cv_end_date: profile?.upload_cv_end_date || null,
      quota_pro_photo: profile?.quota_pro_photo || 0,
      quota_pro_photo_purchased: profile?.quota_pro_photo_purchased || 0,
      quota_upload_cv: profile?.quota_upload_cv || 0,
      tryout_credits: tc?.total || 0,
      tryout_used: tc?.used || 0,
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
