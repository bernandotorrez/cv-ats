-- Move Pro+ features to Pro tier.
-- Features: Interview Simulator, CV Analytics, LinkedIn Optimize
-- These features are no longer Pro+ exclusive — Pro users get them too.

UPDATE public.subscription_tiers SET
  enable_interview_simulator = true,
  enable_analytics = true,
  enable_linkedin_optimize = true
WHERE slug = 'pro';

-- Update Pro tier features JSON to include the new features
UPDATE public.subscription_tiers SET
  features = '["CV Unlimited", "AI Saran Unlimited", "AI Scoring Unlimited", "Semua Template Premium", "AI Chat Unlimited", "Cover Letter Unlimited", "CV Review HR Expert", "Keyword Extractor", "CV Comparison", "Perbaiki Teks Unlimited", "LinkedIn Profile Optimizer", "AI Interview Simulator", "CV Analytics", "Priority Support 24/7", "Export PDF & DOCX"]'::jsonb
WHERE slug = 'pro';
