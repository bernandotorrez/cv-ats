CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS TABLE (
  total_users bigint,
  total_cvs bigint,
  total_ai_calls bigint,
  free_users bigint,
  starter_users bigint,
  pro_users bigint,
  recent_signups bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  WITH user_tiers AS (
    SELECT
      au.id,
      au.created_at,
      CASE
        WHEN st.slug = 'pro_plus' THEN 'pro'
        ELSE coalesce(st.slug, 'free')
      END AS tier
    FROM auth.users au
    LEFT JOIN LATERAL (
      SELECT active_sub.tier_id
      FROM public.user_subscriptions active_sub
      WHERE active_sub.user_id = au.id
        AND active_sub.status = 'active'
      ORDER BY active_sub.date_end DESC NULLS LAST, active_sub.created_at DESC
      LIMIT 1
    ) us ON true
    LEFT JOIN public.subscription_tiers st ON st.id = us.tier_id
  ),
  ai_month AS (
    SELECT count(*)::bigint AS total
    FROM public.ai_usage
    WHERE created_at >= date_trunc('month', now())
  )
  SELECT
    (SELECT count(*)::bigint FROM user_tiers) AS total_users,
    (SELECT count(*)::bigint FROM public.cvs) AS total_cvs,
    (SELECT total FROM ai_month) AS total_ai_calls,
    count(*) FILTER (WHERE tier = 'free')::bigint AS free_users,
    count(*) FILTER (WHERE tier = 'starter')::bigint AS starter_users,
    count(*) FILTER (WHERE tier = 'pro')::bigint AS pro_users,
    count(*) FILTER (WHERE created_at >= now() - interval '7 days')::bigint AS recent_signups
  FROM user_tiers;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_dashboard_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats() TO authenticated;
