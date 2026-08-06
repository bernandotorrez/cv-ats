-- Update Free tier quotas
UPDATE public.subscription_tiers SET
  quota_ai_suggest = 1,
  quota_ai_polish = 1
WHERE slug = 'free';

-- Update Free tier features JSON
UPDATE public.subscription_tiers SET
  features = '[
    "1 CV aktif",
    "2 Template Basic",
    "1x AI Saran/bulan",
    "1x ATS Scoring/bulan",
    "1x Perbaiki Teks AI/bulan",
    "10x Guided Mode/bulan",
    "5x AI Chat/bulan",
    "Export PDF dengan watermark"
  ]'::jsonb
WHERE slug = 'free';
