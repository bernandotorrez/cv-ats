-- Migration: Create visitor_events and analytics aggregation functions
-- Purpose: Track real-time visitor pageviews, devices, traffic sources, conversions, and live activities

CREATE TABLE IF NOT EXISTS public.visitor_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  event_name TEXT NOT NULL, -- 'page_view', 'click_whatsapp', 'click_cta', 'click_pricing', 'click_tryout', 'cv_create_start', 'session_ping', etc.
  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  referrer_channel TEXT, -- 'Direct / Akses Langsung', 'Website Eksternal', 'Google Search', 'Social Media', 'WhatsApp'
  device_type TEXT,      -- 'mobile', 'desktop', 'tablet'
  browser TEXT,          -- 'Chrome', 'Safari', 'Firefox', 'Edge', 'Other'
  os TEXT,               -- 'macOS', 'Windows', 'iOS', 'Android', 'Linux', 'Other'
  duration_seconds INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_visitor_events_created_at ON public.visitor_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_events_visitor_id ON public.visitor_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_events_session_id ON public.visitor_events(session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_events_event_name ON public.visitor_events(event_name);
CREATE INDEX IF NOT EXISTS idx_visitor_events_page_path ON public.visitor_events(page_path);

-- Enable RLS
ALTER TABLE public.visitor_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone (public/anonymous/authenticated) to insert events
DROP POLICY IF EXISTS "Allow public insert visitor_events" ON public.visitor_events;
CREATE POLICY "Allow public insert visitor_events"
  ON public.visitor_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow only admins to select analytics data directly
DROP POLICY IF EXISTS "Allow admin select visitor_events" ON public.visitor_events;
CREATE POLICY "Allow admin select visitor_events"
  ON public.visitor_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Stored function for analytics dashboard aggregation
CREATE OR REPLACE FUNCTION public.get_visitor_analytics(
  p_start_date TIMESTAMPTZ DEFAULT (now() - INTERVAL '30 days'),
  p_end_date TIMESTAMPTZ DEFAULT now()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_is_admin BOOLEAN;
  v_total_pageviews BIGINT;
  v_unique_visitors BIGINT;
  v_whatsapp_clicks BIGINT;
  v_feature_conversions BIGINT;
  v_conversion_rate NUMERIC;
  v_avg_duration_seconds NUMERIC;
  v_prev_start_date TIMESTAMPTZ;
  v_prev_pageviews BIGINT;
  v_prev_unique_visitors BIGINT;
  v_pageviews_growth NUMERIC;
  v_visitors_growth NUMERIC;
  v_daily_stats JSONB;
  v_devices JSONB;
  v_sources JSONB;
  v_top_pages JSONB;
  v_recent_events JSONB;
  v_duration_interval INTERVAL;
BEGIN
  -- Security check: only admins can run this
  v_is_admin := public.has_role(auth.uid(), 'admin');
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya admin yang dapat melihat analitik pengunjung.';
  END IF;

  v_duration_interval := p_end_date - p_start_date;
  v_prev_start_date := p_start_date - v_duration_interval;

  -- 1. KPI Current Period (excluding admin pages)
  SELECT
    COALESCE(COUNT(*) FILTER (WHERE event_name = 'page_view'), 0),
    COALESCE(COUNT(DISTINCT visitor_id), 0),
    COALESCE(COUNT(*) FILTER (WHERE event_name IN ('click_whatsapp', 'whatsapp_click', 'chat_whatsapp')), 0),
    COALESCE(COUNT(*) FILTER (WHERE event_name IN ('cv_create_start', 'click_cta', 'click_tryout', 'ats_scan', 'click_feature')), 0),
    COALESCE(AVG(duration_seconds) FILTER (WHERE duration_seconds > 0), 0)
  INTO
    v_total_pageviews,
    v_unique_visitors,
    v_whatsapp_clicks,
    v_feature_conversions,
    v_avg_duration_seconds
  FROM public.visitor_events
  WHERE created_at >= p_start_date AND created_at <= p_end_date
    AND page_path NOT LIKE '/admin%';

  -- 2. KPI Previous Period (for trend percentages, excluding admin)
  SELECT
    COALESCE(COUNT(*) FILTER (WHERE event_name = 'page_view'), 0),
    COALESCE(COUNT(DISTINCT visitor_id), 0)
  INTO
    v_prev_pageviews,
    v_prev_unique_visitors
  FROM public.visitor_events
  WHERE created_at >= v_prev_start_date AND created_at < p_start_date
    AND page_path NOT LIKE '/admin%';

  IF v_prev_pageviews > 0 THEN
    v_pageviews_growth := ROUND(((v_total_pageviews - v_prev_pageviews)::NUMERIC / v_prev_pageviews::NUMERIC) * 100, 1);
  ELSE
    v_pageviews_growth := 0;
  END IF;

  IF v_prev_unique_visitors > 0 THEN
    v_visitors_growth := ROUND(((v_unique_visitors - v_prev_unique_visitors)::NUMERIC / v_prev_unique_visitors::NUMERIC) * 100, 1);
  ELSE
    v_visitors_growth := 0;
  END IF;

  -- Conversion rate calculation
  IF v_unique_visitors > 0 THEN
    v_conversion_rate := ROUND(((v_whatsapp_clicks + v_feature_conversions)::NUMERIC / v_unique_visitors::NUMERIC) * 100, 1);
  ELSE
    v_conversion_rate := 0;
  END IF;

  -- 3. Daily Stats for Chart (excluding admin)
  SELECT COALESCE(jsonb_agg(d_row), '[]'::jsonb)
  INTO v_daily_stats
  FROM (
    SELECT
      to_char(date_trunc('day', series_date), 'YYYY-MM-DD') AS date,
      to_char(series_date, 'DD Mon') AS formatted_date,
      COALESCE(COUNT(e.id) FILTER (WHERE e.event_name = 'page_view'), 0) AS pageviews,
      COALESCE(COUNT(DISTINCT e.visitor_id), 0) AS unique_visitors,
      COALESCE(COUNT(e.id) FILTER (WHERE e.event_name IN ('click_whatsapp', 'whatsapp_click', 'chat_whatsapp')), 0) AS whatsapp_clicks,
      COALESCE(COUNT(e.id) FILTER (WHERE e.event_name IN ('cv_create_start', 'click_cta', 'click_tryout', 'ats_scan', 'click_feature')), 0) AS conversions
    FROM generate_series(
      date_trunc('day', p_start_date),
      date_trunc('day', p_end_date),
      INTERVAL '1 day'
    ) AS series_date
    LEFT JOIN public.visitor_events e
      ON date_trunc('day', e.created_at) = series_date
      AND e.page_path NOT LIKE '/admin%'
    GROUP BY series_date
    ORDER BY series_date ASC
  ) d_row;

  -- 4. Device Breakdown (excluding admin)
  SELECT COALESCE(jsonb_agg(dev_row), '[]'::jsonb)
  INTO v_devices
  FROM (
    SELECT
      CASE 
        WHEN LOWER(device_type) = 'mobile' THEN 'Mobile (Smartphone)'
        WHEN LOWER(device_type) = 'tablet' THEN 'Tablet / iPad'
        ELSE 'Desktop / Laptop'
      END AS name,
      COUNT(*) AS count,
      CASE 
        WHEN v_total_pageviews > 0 THEN ROUND((COUNT(*)::NUMERIC / v_total_pageviews::NUMERIC) * 100, 1)
        ELSE 0 
      END AS percentage
    FROM public.visitor_events
    WHERE created_at >= p_start_date AND created_at <= p_end_date
      AND event_name = 'page_view'
      AND page_path NOT LIKE '/admin%'
    GROUP BY 1
    ORDER BY count DESC
  ) dev_row;

  -- 5. Traffic Inflow Sources (excluding admin)
  SELECT COALESCE(jsonb_agg(src_row), '[]'::jsonb)
  INTO v_sources
  FROM (
    SELECT
      COALESCE(referrer_channel, 'Direct / Akses Langsung') AS name,
      COUNT(*) AS count,
      CASE 
        WHEN v_total_pageviews > 0 THEN ROUND((COUNT(*)::NUMERIC / v_total_pageviews::NUMERIC) * 100, 1)
        ELSE 0 
      END AS percentage
    FROM public.visitor_events
    WHERE created_at >= p_start_date AND created_at <= p_end_date
      AND event_name = 'page_view'
      AND page_path NOT LIKE '/admin%'
    GROUP BY 1
    ORDER BY count DESC
  ) src_row;

  -- 6. Top Visited Pages (excluding admin)
  SELECT COALESCE(jsonb_agg(page_row), '[]'::jsonb)
  INTO v_top_pages
  FROM (
    SELECT
      page_path AS path,
      COALESCE(page_title, page_path) AS title,
      COUNT(*) AS hits,
      CASE 
        WHEN v_total_pageviews > 0 THEN ROUND((COUNT(*)::NUMERIC / v_total_pageviews::NUMERIC) * 100, 1)
        ELSE 0 
      END AS percentage
    FROM public.visitor_events
    WHERE created_at >= p_start_date AND created_at <= p_end_date
      AND event_name = 'page_view'
      AND page_path NOT LIKE '/admin%'
    GROUP BY page_path, page_title
    ORDER BY hits DESC
    LIMIT 50
  ) page_row;

  -- 7. Recent Live Visitor Feed (initial 20 events, excluding admin)
  SELECT COALESCE(jsonb_agg(feed_row), '[]'::jsonb)
  INTO v_recent_events
  FROM (
    SELECT
      id,
      visitor_id,
      session_id,
      event_name,
      page_path,
      COALESCE(page_title, page_path) AS page_title,
      device_type,
      browser,
      os,
      duration_seconds,
      created_at
    FROM public.visitor_events
    WHERE page_path NOT LIKE '/admin%'
    ORDER BY created_at DESC
    LIMIT 20
  ) feed_row;

  -- Combine into comprehensive JSON response
  v_result := jsonb_build_object(
    'total_pageviews', v_total_pageviews,
    'unique_visitors', v_unique_visitors,
    'whatsapp_clicks', v_whatsapp_clicks,
    'feature_conversions', v_feature_conversions,
    'conversion_rate', v_conversion_rate,
    'avg_duration_seconds', v_avg_duration_seconds,
    'pageviews_growth', v_pageviews_growth,
    'visitors_growth', v_visitors_growth,
    'daily_stats', v_daily_stats,
    'devices', v_devices,
    'sources', v_sources,
    'top_pages', v_top_pages,
    'recent_events', v_recent_events
  );

  RETURN v_result;
END;
$$;
