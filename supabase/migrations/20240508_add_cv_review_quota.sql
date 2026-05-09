-- Migration: Add CV Review quota tracking
-- Add quota column for CV review feature in subscription_tiers

ALTER TABLE subscription_tiers ADD COLUMN IF NOT EXISTS quota_cv_review INTEGER DEFAULT 0;

-- Update existing tiers to have CV review quota
UPDATE subscription_tiers SET quota_cv_review = 0 WHERE slug = 'free';
UPDATE subscription_tiers SET quota_cv_review = 10 WHERE slug = 'starter';
UPDATE subscription_tiers SET quota_cv_review = NULL WHERE slug = 'pro'; -- unlimited
UPDATE subscription_tiers SET quota_cv_review = NULL WHERE slug = 'pro_plus'; -- unlimited

-- Create cv_reviews table to store review history
CREATE TABLE IF NOT EXISTS cv_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cv_id UUID,
  target_role TEXT,
  job_description TEXT,
  overall_score INTEGER,
  scores JSONB,
  strengths TEXT[],
  weaknesses TEXT[],
  suggestions JSONB,
  industry_benchmark JSONB,
  hr_verdict JSONB,
  quick_wins TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cv_reviews_user_id ON cv_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_reviews_created_at ON cv_reviews(created_at);

-- Enable RLS
ALTER TABLE cv_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own reviews" ON cv_reviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reviews" ON cv_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT ON cv_reviews TO authenticated;
GRANT SELECT, INSERT ON cv_reviews TO anon;
