-- Add sort_order parameter to admin_list_users_page
-- Default 'desc' = newest first, 'asc' = oldest first

CREATE OR REPLACE FUNCTION public.admin_list_users_page(
  search_text text DEFAULT '',
  tier_filter text DEFAULT 'all',
  page_num integer DEFAULT 1,
  page_size integer DEFAULT 10,
  sort_order text DEFAULT 'desc'
)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
  tier text,
  tier_status text,
  cv_count bigint,
  ai_count bigint,
  created_at timestamptz,
  auth_created_at timestamptz,
  last_sign_in_at timestamptz,
  total_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH params AS (
    SELECT
      lower(trim(coalesce(search_text, ''))) AS q,
      lower(trim(coalesce(tier_filter, 'all'))) AS tier_q,
      greatest(coalesce(page_num, 1), 1) AS safe_page,
      least(greatest(coalesce(page_size, 10), 1), 100) AS safe_page_size,
      CASE WHEN lower(trim(coalesce(sort_order, 'desc'))) = 'asc' THEN true ELSE false END AS oldest_first
  ),
  user_base AS (
    SELECT
      au.id,
      au.email::text AS email,
      coalesce(
        nullif(p.full_name, ''),
        nullif(au.raw_user_meta_data ->> 'full_name', ''),
        nullif(au.raw_user_meta_data ->> 'name', ''),
        ''
      ) AS full_name,
      coalesce(role_row.role::text, 'user') AS role,
      coalesce(st.slug, 'free') AS tier,
      coalesce(us.status, 'active') AS tier_status,
      coalesce(p.created_at, au.created_at) AS created_at,
      au.created_at AS auth_created_at,
      au.last_sign_in_at
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    LEFT JOIN LATERAL (
      SELECT ur.role
      FROM public.user_roles ur
      WHERE ur.user_id = au.id
      ORDER BY (ur.role = 'admin') DESC, ur.created_at DESC
      LIMIT 1
    ) role_row ON true
    LEFT JOIN LATERAL (
      SELECT active_sub.status, active_sub.tier_id
      FROM public.user_subscriptions active_sub
      WHERE active_sub.user_id = au.id
        AND active_sub.status = 'active'
      ORDER BY active_sub.date_end DESC NULLS LAST, active_sub.created_at DESC
      LIMIT 1
    ) us ON true
    LEFT JOIN public.subscription_tiers st ON st.id = us.tier_id
    CROSS JOIN params
    WHERE (params.tier_q = 'all' OR coalesce(st.slug, 'free') = params.tier_q)
      AND (
        params.q = ''
        OR au.id::text ILIKE ('%' || params.q || '%')
        OR au.email ILIKE ('%' || params.q || '%')
        OR coalesce(
          nullif(p.full_name, ''),
          nullif(au.raw_user_meta_data ->> 'full_name', ''),
          nullif(au.raw_user_meta_data ->> 'name', ''),
          ''
        ) ILIKE ('%' || params.q || '%')
      )
  ),
  counted AS (
    SELECT count(*)::bigint AS total
    FROM user_base
  ),
  paged AS (
    SELECT user_base.*
    FROM user_base
    CROSS JOIN params
    ORDER BY
      CASE WHEN params.oldest_first THEN user_base.created_at END ASC,
      CASE WHEN NOT params.oldest_first THEN user_base.created_at END DESC,
      user_base.id DESC
    LIMIT (SELECT safe_page_size FROM params)
    OFFSET ((SELECT safe_page FROM params) - 1) * (SELECT safe_page_size FROM params)
  ),
  cv_counts AS (
    SELECT cvs.user_id, count(*)::bigint AS total
    FROM public.cvs
    WHERE cvs.user_id IN (SELECT paged.id FROM paged)
    GROUP BY cvs.user_id
  ),
  ai_counts AS (
    SELECT ai_usage.user_id, count(*)::bigint AS total
    FROM public.ai_usage
    WHERE ai_usage.user_id IN (SELECT paged.id FROM paged)
      AND ai_usage.created_at >= date_trunc('month', now())
    GROUP BY ai_usage.user_id
  )
  SELECT
    paged.id,
    paged.email,
    paged.full_name,
    paged.role,
    paged.tier,
    paged.tier_status,
    coalesce(cv_counts.total, 0) AS cv_count,
    coalesce(ai_counts.total, 0) AS ai_count,
    paged.created_at,
    paged.auth_created_at,
    paged.last_sign_in_at,
    counted.total AS total_count
  FROM paged
  CROSS JOIN counted
  LEFT JOIN cv_counts ON cv_counts.user_id = paged.id
  LEFT JOIN ai_counts ON ai_counts.user_id = paged.id;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users_page(text, text, integer, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_users_page(text, text, integer, integer, text) TO service_role;
