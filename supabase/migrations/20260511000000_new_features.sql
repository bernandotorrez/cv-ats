-- ============================================================
-- FITUR BARU — May 2026
-- Job Board, Application Tracker, CV Analytics, Referral, Interview Simulator
-- ============================================================

-- 1. Job Listings (Lowongan Pekerjaan)
CREATE TABLE IF NOT EXISTS public.job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_logo TEXT,
  location TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'full-time',
  level TEXT NOT NULL DEFAULT 'entry',
  industry TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  description TEXT NOT NULL,
  requirements TEXT,
  qualifications TEXT,
  source_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Admins can manage job listings" ON public.job_listings;
CREATE POLICY "Anyone can view active job listings" ON public.job_listings FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage job listings" ON public.job_listings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 2. Job Applications (Pelacak Lamaran)
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cv_id UUID REFERENCES public.cvs(id) ON DELETE SET NULL,
  position TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'applied',
  notes TEXT,
  source TEXT,
  contact_name TEXT,
  contact_email TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own applications" ON public.job_applications;
CREATE POLICY "Users can manage own applications" ON public.job_applications FOR ALL USING (auth.uid() = user_id);

-- 3. CV Analytics
CREATE TABLE IF NOT EXISTS public.cv_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id UUID REFERENCES public.cvs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  viewer_ip TEXT,
  viewer_country TEXT,
  viewer_city TEXT,
  viewer_device TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.cv_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own analytics" ON public.cv_analytics;
DROP POLICY IF EXISTS "Public can insert analytics" ON public.cv_analytics;
CREATE POLICY "Users can view own analytics" ON public.cv_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public can insert analytics" ON public.cv_analytics FOR INSERT WITH CHECK (true);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_cv_analytics_cv_created ON public.cv_analytics(cv_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cv_analytics_user ON public.cv_analytics(user_id, created_at DESC);

-- 4. Referral Codes
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  total_referrals INTEGER DEFAULT 0,
  successful_referrals INTEGER DEFAULT 0,
  rewards_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own referral code" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can insert own referral code" ON public.referral_codes;
CREATE POLICY "Users can view own referral code" ON public.referral_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own referral code" ON public.referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Referral Tracking
CREATE TABLE IF NOT EXISTS public.referral_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'clicked',
  reward_granted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  upgraded_at TIMESTAMPTZ
);
ALTER TABLE public.referral_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own referral tracking" ON public.referral_tracking;
DROP POLICY IF EXISTS "Public can insert referral clicks" ON public.referral_tracking;
DROP POLICY IF EXISTS "Users can update own referral tracking" ON public.referral_tracking;
CREATE POLICY "Users can view own referral tracking" ON public.referral_tracking FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Public can insert referral clicks" ON public.referral_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own referral tracking" ON public.referral_tracking FOR UPDATE USING (auth.uid() = referrer_id);

-- 6. Interview Sessions (Simulasi Wawancara)
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  position TEXT NOT NULL,
  level TEXT NOT NULL,
  industry TEXT,
  questions JSONB DEFAULT '[]',
  answers JSONB DEFAULT '[]',
  scores JSONB DEFAULT '[]',
  overall_score INTEGER,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own interview sessions" ON public.interview_sessions;
CREATE POLICY "Users can manage own interview sessions" ON public.interview_sessions FOR ALL USING (auth.uid() = user_id);

-- 7. RPC: generate referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(user_id_input UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_code TEXT;
  existing RECORD;
BEGIN
  -- Check if user already has a code
  SELECT code INTO existing FROM public.referral_codes WHERE user_id = user_id_input;
  IF FOUND THEN
    RETURN existing.code;
  END IF;

  -- Generate unique 8-char code
  LOOP
    new_code := upper(substring(encode(gen_random_bytes(6), 'base64') from 1 for 8));
    -- Remove non-alphanumeric
    new_code := regexp_replace(new_code, '[^A-Z0-9]', 'X', 'g');
    BEGIN
      INSERT INTO public.referral_codes (user_id, code) VALUES (user_id_input, new_code);
      RETURN new_code;
    EXCEPTION WHEN unique_violation THEN
      -- Collision, try again
    END;
  END LOOP;
END;
$$;

-- 8. RPC: track referral signup
CREATE OR REPLACE FUNCTION public.track_referral_signup(p_code TEXT, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_referrer_id UUID;
BEGIN
  SELECT user_id INTO v_referrer_id FROM public.referral_codes WHERE code = p_code;
  IF NOT FOUND THEN RETURN; END IF;

  INSERT INTO public.referral_tracking (referrer_id, referred_user_id, referral_code, status)
  VALUES (v_referrer_id, p_user_id, p_code, 'signed_up');

  UPDATE public.referral_codes
  SET total_referrals = total_referrals + 1
  WHERE code = p_code;
END;
$$;

-- 9. Seed: Sample job listings
INSERT INTO public.job_listings (slug, title, company, location, type, level, industry, salary_min, salary_max, description, requirements, qualifications) VALUES
  ('software-engineer-jakarta', 'Software Engineer', 'TechCorp Indonesia', 'Jakarta Selatan', 'full-time', 'mid', 'Teknologi', 8000000, 15000000,
   'Kami mencari Software Engineer berpengalaman untuk bergabung dengan tim engineering kami. Anda akan membangun dan memelihara aplikasi skala besar.',
   'Pengalaman 2+ tahun dengan React/Node.js\nMemahami database SQL dan NoSQL\nTerbiasa dengan Git dan CI/CD\nBahasa Inggris aktif',
   'S1 Teknik Informatika/Ilmu Komputer\nPortfolio proyek yang relevan'
  ),
  ('data-analyst-bandung', 'Data Analyst', 'DataInsight Nusantara', 'Bandung', 'full-time', 'entry', 'Data & Analytics', 6000000, 10000000,
   'DataInsight mencari Data Analyst untuk membantu tim membuat keputusan berbasis data. Fresh graduate dipersilakan melamar.',
   'Menguasai SQL dan Excel\nPengalaman dengan tools visualisasi data (Tableau/Looker)\nKemampuan analitis yang kuat',
   'S1 Statistik/Matematika/Informatika\nFresh graduate dipersilakan'
  ),
  ('marketing-manager-surabaya', 'Marketing Manager', 'Karya Bangkit Group', 'Surabaya', 'full-time', 'senior', 'Marketing', 12000000, 20000000,
   'Memimpin tim marketing untuk brand consumer goods terkemuka. Bertanggung jawab atas strategi marketing digital dan tradisional.',
   '5+ tahun pengalaman marketing\n3+ tahun di posisi manajerial\nPengalaman dengan budget >Rp 2M/tahun\nPortofolio campaign sukses',
   'S1 Marketing/Komunikasi/Bisnis\nSertifikasi digital marketing nilai plus'
  ),
  ('ui-ux-designer-remote', 'UI/UX Designer', 'Kreatif Digital Studio', 'Remote', 'full-time', 'mid', 'Design', 7000000, 12000000,
   'Mendesain pengalaman pengguna yang intuitif untuk produk digital. Bekerja remote dengan tim yang tersebar.',
   'Portofolio UI/UX yang kuat\nMahir Figma dan prototyping tools\nMemahami design system\nPengalaman user research',
   'S1 Desain Komunikasi Visual atau setara\nPengalaman dengan startup nilai plus'
  ),
  ('hr-officer-jakarta', 'HR Officer', 'Maju Bersama Corporation', 'Jakarta Pusat', 'full-time', 'entry', 'Human Resources', 5000000, 8000000,
   'Mengelola proses rekrutmen end-to-end dan administrasi HR untuk perusahaan dengan 500+ karyawan.',
   'Pengalaman recruitment/HR min 1 tahun\nMenguasai Microsoft Office\nKemampuan komunikasi yang baik\nTeliti dan terorganisir',
   'S1 Psikologi/Manajemen SDM/Hukum\nFresh graduate dengan magang HR dipersilakan'
  ),
  ('accountant-medan', 'Senior Accountant', 'Sumatera Finance Group', 'Medan', 'full-time', 'senior', 'Finance', 10000000, 18000000,
   'Mengelola laporan keuangan, pajak, dan audit untuk grup perusahaan di Sumatera Utara.',
   '5+ tahun pengalaman akuntansi\nSertifikasi Brevet A&B\nPengalaman dengan PSAK\nERP experience (SAP/Oracle)',
   'S1 Akuntansi\nCPA/CA nilai plus'
  )
ON CONFLICT (slug) DO NOTHING;
