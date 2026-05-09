-- Phase 5: Subscription, Templates, Interview Tips, Blog

-- Subscription tiers & user subscriptions
CREATE TYPE public.subscription_tier AS ENUM ('free', 'starter', 'pro');
CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'expired', 'past_due');

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tier subscription_tier NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 month'),
  provider TEXT,           -- 'midtrans' / 'xendit' / null (mock)
  external_id TEXT,        -- payment reference
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Auto-create free subscription on signup
CREATE OR REPLACE FUNCTION public.handle_new_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$;

-- Update handle_new_user to also create subscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active');

  RETURN NEW;
END;
$$;

-- Templates table
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  preview_url TEXT,
  color TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view templates" ON public.templates
  FOR SELECT USING (true);

-- Seed templates
INSERT INTO public.templates (slug, name, description, color, is_premium, sort_order) VALUES
  ('jakarta', 'Jakarta', 'Klasik profesional, satu kolom rapi. Cocok untuk semua industri.', '#468432', false, 1),
  ('bandung', 'Bandung', 'Modern dengan aksen warna primary. Menonjol di tumpukan CV.', '#468432', false, 2),
  ('surabaya', 'Surabaya', 'Minimalis dengan header tegas. Fokus pada konten.', '#468432', true, 3),
  ('yogya', 'Yogyakarta', 'Elegan dan ATS friendly. Desain premium untuk profesional.', '#468432', true, 4);

-- Interview tips table
CREATE TABLE public.interview_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of paragraphs
  seo_meta JSONB,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.interview_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view interview tips" ON public.interview_tips
  FOR SELECT USING (true);

-- Seed interview tips
INSERT INTO public.interview_tips (slug, title, category, excerpt, content) VALUES
  ('persiapan-interview-pertama', 'Persiapan Interview Pertama untuk Fresh Graduate', 'Fresh Graduate',
   'Riset perusahaan, latihan jawaban STAR, dan tips berpakaian untuk interview pertamamu.',
   '["Interview pertama selalu bikin deg-degan. Tapi dengan persiapan yang tepat, kamu bisa tampil percaya diri dan menonjol di antara kandidat lain.",
     "Riset perusahaan minimal 30 menit: pelajari produk, visi, berita terbaru, dan budaya kerja. Sumber bagus: website resmi, LinkedIn karyawan, Glassdoor.",
     "Siapkan jawaban untuk 10 pertanyaan paling umum dengan metode STAR (Situation, Task, Action, Result). Ini bikin jawabanmu terstruktur dan meyakinkan.",
     "Berpakaian satu level lebih formal dari budaya perusahaan. Jika startup casual, smart casual sudah cukup. Jika korporat, kemeja & celana bahan.",
     "Datang 15 menit sebelum jadwal. Bawa CV cetak, KTP, dan alat tulis. Untuk online: cek koneksi, kamera, dan mic 30 menit sebelumnya.",
     "Akhiri dengan pertanyaan cerdas ke pewawancara. Ini menunjukkan ketertarikan dan keseriusan kamu."
   ]'::jsonb),
  ('pertanyaan-hr-umum', '10 Pertanyaan HR Paling Sering Ditanyakan & Cara Jawabnya', 'HR Interview',
   'Dari Ceritakan tentang diri Anda sampai Apa kelemahan Anda — lengkap dengan contoh.',
   '["1. Ceritakan tentang diri Anda — ringkas latar belakang pendidikan, pengalaman relevan, dan apa yang kamu cari. Maksimal 90 detik.",
     "2. Mengapa tertarik posisi ini? — kaitkan kekuatanmu dengan kebutuhan perusahaan. Tunjukkan kamu sudah riset.",
     "3. Apa kelebihan Anda? — pilih 2–3 yang relevan, beri contoh konkret.",
     "4. Apa kelemahan Anda? — sebutkan kelemahan nyata + langkah perbaikan yang sedang kamu lakukan.",
     "5. Mengapa pindah dari pekerjaan sebelumnya? — jawab positif, fokus pada peluang baru, jangan menjelekkan perusahaan lama.",
     "6. Di mana Anda 5 tahun ke depan? — tunjukkan ambisi yang realistis & sejalan dengan peluang karier di perusahaan.",
     "7. Berapa ekspektasi gaji? — riset salary range dulu, beri rentang, dan siap bernegosiasi.",
     "8. Mengapa kami harus memilih Anda? — ringkas value unik yang kamu bawa.",
     "9. Bagaimana menghadapi konflik? — pakai metode STAR, fokus pada solusi.",
     "10. Ada pertanyaan untuk kami? — selalu siapkan minimal 3 pertanyaan substantif."
   ]'::jsonb),
  ('interview-technical-tech', 'Tips Interview Technical untuk Posisi Software Engineer', 'Technical',
   'Live coding, system design, dan behavioral di perusahaan tech Indonesia & global.',
   '["Tahap technical biasanya: take-home test, live coding, system design, dan behavioral. Kenali alur perusahaan target dari Glassdoor & LinkedIn.",
     "Live coding: think out loud, klarifikasi requirement dulu, mulai dari brute force lalu optimize. Komunikasi sama penting dengan kebenaran solusi.",
     "System design: pakai framework — clarify, estimate, high-level design, deep dive komponen, identifikasi bottleneck. Latih dengan studi kasus nyata.",
     "Refresh konsep: data structures, complexity, OOP, database, networking, system design. Sumber: NeetCode, ByteByteGo, Designing Data-Intensive Applications.",
     "Untuk interview di perusahaan global, latih juga komunikasi Bahasa Inggris."
   ]'::jsonb),
  ('negosiasi-gaji', 'Cara Negosiasi Gaji Tanpa Bikin Awkward', 'Karier',
   'Riset salary range, framing pertanyaan, dan kapan waktu yang tepat membahas.',
   '["Riset dulu: pakai LinkedIn Salary, Glassdoor, JobStreet, atau diskusi dengan teman seprofesi. Tentukan rentang yang realistis.",
     "Jangan sebut angka pertama kali jika bisa dihindari. Tanya range yang dialokasikan perusahaan.",
     "Saat ditanya, beri rentang dengan batas bawah = target kamu. Misal target 12 juta → sebut antara 12–15 juta.",
     "Bahas total compensation, bukan hanya gaji pokok: tunjangan, bonus, asuransi, opsi WFH, training budget.",
     "Jika offer di bawah ekspektasi, minta waktu 24 jam untuk mempertimbangkan. Kembali dengan counter-offer berbasis data."
   ]'::jsonb),
  ('pertanyaan-balik-ke-hr', '5 Pertanyaan Cerdas yang Bikin HR Terkesan', 'HR Interview',
   'Pertanyaan yang menunjukkan kamu serius dan sudah riset perusahaan.',
   '["1. Bagaimana ukuran kesuksesan untuk posisi ini dalam 6 bulan pertama?",
     "2. Tantangan terbesar apa yang akan dihadapi orang yang masuk posisi ini?",
     "3. Bagaimana budaya tim di sini, dan bagaimana keputusan dibuat?",
     "4. Bagaimana perusahaan mendukung pengembangan karier karyawan?",
     "5. Apa langkah selanjutnya dari proses ini, dan kapan saya bisa mengharapkan kabar?"
   ]'::jsonb),
  ('behavioral-star-method', 'Metode STAR untuk Jawab Pertanyaan Behavioral', 'Behavioral',
   'Situation, Task, Action, Result — framework jawaban yang terstruktur dan meyakinkan.',
   '["STAR adalah framework menjawab pertanyaan behavioral seperti Ceritakan saat Anda menghadapi konflik...",
     "Situation: konteks singkat — kapan, di mana, dengan siapa.",
     "Task: apa peran & tanggung jawab kamu dalam situasi itu.",
     "Action: langkah konkret yang kamu ambil. Pakai saya, bukan kami.",
     "Result: hasilnya, idealnya dengan angka. Apa pelajarannya.",
     "Latih 5–7 cerita STAR yang bisa dipakai untuk berbagai variasi pertanyaan: konflik, kepemimpinan, kegagalan, kesuksesan, inisiatif."
   ]'::jsonb);

-- Blog table  
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Umum',
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  image_url TEXT,
  seo_meta JSONB,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blog posts" ON public.blog_posts
  FOR SELECT USING (true);

-- Seed blog posts
INSERT INTO public.blog_posts (slug, title, excerpt, category, content) VALUES
  ('apa-itu-cv-ats', 'Apa Itu CV ATS Friendly dan Kenapa Penting?', 'Pelajari apa itu Applicant Tracking System, bagaimana cara kerjanya, dan kenapa CV kamu harus lolos screening ATS.', 'CV & Karier',
   '["ATS (Applicant Tracking System) adalah software yang digunakan perusahaan untuk menyaring ribuan CV secara otomatis sebelum dibaca manusia.",
     "Hampir 75% perusahaan besar di Indonesia dan global menggunakan ATS untuk proses rekrutmen. Jika CV kamu tidak ATS-friendly, besar kemungkinan langsung tersingkir.",
     "ATS bekerja dengan cara mengekstrak teks dari CV, mencari keyword yang relevan dengan job description, dan memberi skor. CV dengan skor rendah otomatis ditolak.",
     "Tips utama: hindari tabel, gambar, kolom, dan font dekoratif. Gunakan heading standar, keyword relevan, dan format single-column.",
     "Dengan CV ATS Indonesia, kamu bisa membuat CV ATS-friendly dalam hitungan menit. Template kami sudah dioptimasi untuk lolos screening ATS."
   ]'::jsonb),
  ('keyword-cv-ats', 'Cara Riset Keyword untuk CV ATS Friendly', 'Panduan lengkap riset keyword dari job description agar CV kamu muncul di pencarian rekruter.', 'CV & Karier',
   '["Keyword adalah kunci agar CV kamu lolos ATS dan ditemukan rekruter. Tanpa keyword yang tepat, CV terbaik pun bisa terlewat.",
     "Cara riset: baca 3-5 job description posisi yang kamu incar. Catat kata-kata yang sering muncul — itu keyword utama.",
     "Kelompokkan keyword menjadi: hard skills (tools, bahasa pemrograman, sertifikasi), soft skills (komunikasi, kepemimpinan), dan kualifikasi (pengalaman, pendidikan).",
     "Taburkan keyword secara natural di ringkasan, pengalaman, dan skill. Jangan keyword stuffing — ATS modern bisa mendeteksinya.",
     "Gunakan fitur Keyword Extractor di CV ATS Indonesia untuk otomatis mengekstrak keyword dari job description favoritmu."
   ]'::jsonb),
  ('template-cv-gratis-vs-premium', 'Template CV Gratis vs Premium: Mana yang Kamu Butuhkan?', 'Perbandingan jujur template CV gratis dan premium, plus tips memilih yang tepat untuk jenjang kariermu.', 'CV & Karier',
   '["Template CV gratis biasanya cukup untuk fresh graduate atau yang baru pertama kali bikin CV. Namun ada keterbatasan: pilihan desain sedikit, fitur AI terbatas, dan sering ada watermark.",
     "Template premium menawarkan: desain lebih profesional dan bervariasi, AI scoring unlimited, cover letter generator, dan tentunya tanpa watermark.",
     "Kapan upgrade ke premium? Jika kamu: melamar ke 10+ perusahaan, ingin ganti industri, target posisi senior, atau butuh CV dalam multiple format.",
     "Di CV ATS Indonesia, semua template — baik gratis maupun premium — sudah ATS-friendly dan dioptimasi untuk screening otomatis.",
     "Mulai dari paket Free (Rp 0 selamanya). Upgrade ke Starter (Rp 19.000/bln) atau Pro (Rp 49.000/bln) saat kamu siap level up karier."
   ]'::jsonb),
  ('cara-menulis-ringkasan-cv', 'Cara Menulis Ringkasan CV yang Bikin Rekruter Berhenti Scroll', 'Ringkasan profil adalah bagian paling krusial di CV. Pelajari formula menulis ringkasan yang memikat.', 'CV & Karier',
   '["Ringkasan profil adalah 2-4 kalimat di bagian atas CV yang menjadi first impression rekruter. Rata-rata rekruter hanya membaca 7 detik pertama — pastikan ringkasanmu powerful.",
     "Formula ringkasan: [Posisi] + [pengalaman tahun] + [keahlian utama] + [pencapaian signifikan] + [value proposition].",
     "Contoh bagus: Frontend Developer dengan 5+ tahun pengalaman membangun web app skala enterprise. Spesialis React & TypeScript, berhasil meningkatkan performa aplikasi 40%.",
     "Hindari: kalimat klise (saya pekerja keras), kata ganti berlebihan, dan informasi yang tidak relevan dengan posisi.",
     "Gunakan AI Saran di editor CV ATS Indonesia untuk otomatis membuat ringkasan profesional yang ATS-friendly."
   ]'::jsonb);
