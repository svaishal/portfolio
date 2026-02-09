-- =============================================
-- SUPABASE DATABASE SCHEMA FOR PORTFOLIO CMS
-- =============================================
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  tagline TEXT DEFAULT '',
  subtitle TEXT DEFAULT '',
  location TEXT DEFAULT 'India',
  years_experience TEXT DEFAULT '4+',
  bio TEXT DEFAULT '',
  about_intro TEXT DEFAULT '',
  about_values TEXT DEFAULT '',
  open_to_work BOOLEAN DEFAULT true,
  profile_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =============================================
-- EXPERIENCES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS experiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  period TEXT NOT NULL,
  type TEXT DEFAULT 'Full-time',
  icon TEXT DEFAULT '💼',
  achievements TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  is_current BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CERTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📜',
  issuer TEXT,
  date TEXT,
  url TEXT,
  visible BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SKILLS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('technical', 'soft')) NOT NULL,
  visible BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PROJECTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'Project',
  icon TEXT DEFAULT '📁',
  highlights TEXT[] DEFAULT '{}',
  impact TEXT DEFAULT '',
  image_url TEXT,
  link TEXT,
  visible BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- JOURNEY PHASES TABLE (About page narrative)
-- =============================================
CREATE TABLE IF NOT EXISTS journey_phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phase TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- EDUCATION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  degree TEXT NOT NULL,
  institution TEXT NOT NULL,
  field TEXT DEFAULT '',
  year TEXT DEFAULT '',
  visible BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SOCIAL LINKS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS social_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  visible BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SETTINGS TABLE (Key-value store for misc settings)
-- =============================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key)
);

-- =============================================
-- TOOLS TABLE (Tools & Applications Used)
-- =============================================
CREATE TABLE IF NOT EXISTS tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT DEFAULT 'default',
  visible BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LEARNING TABLE (Currently Learning)
-- =============================================
CREATE TABLE IF NOT EXISTS learning (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'in-progress',
  visible BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CONTACT MESSAGES TABLE (Contact form submissions)
-- =============================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  ip_address TEXT,
  read BOOLEAN DEFAULT false,
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for contact messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_read ON contact_messages(read);

-- RLS for contact_messages - only service role can insert, authenticated users can read
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert (used by the API)
CREATE POLICY "Service role can insert contact messages"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to read contact messages (for admin dashboard)
CREATE POLICY "Authenticated users can read contact messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update (mark as read)
CREATE POLICY "Authenticated users can update contact messages"
  ON contact_messages FOR UPDATE
  TO authenticated
  USING (true);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_experiences_user_id ON experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_experiences_sort ON experiences(sort_order);
CREATE INDEX IF NOT EXISTS idx_certifications_user_id ON certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_phases_user_id ON journey_phases(user_id);
CREATE INDEX IF NOT EXISTS idx_education_user_id ON education(user_id);
CREATE INDEX IF NOT EXISTS idx_social_links_user_id ON social_links(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_key ON settings(user_id, key);
CREATE INDEX IF NOT EXISTS idx_tools_user_id ON tools(user_id);
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
CREATE INDEX IF NOT EXISTS idx_learning_user_id ON learning(user_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES POLICIES
-- =============================================
-- Public can read profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Only owner can insert/update/delete
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- EXPERIENCES POLICIES
-- =============================================
CREATE POLICY "Public can view visible experiences"
  ON experiences FOR SELECT
  USING (visible = true);

CREATE POLICY "Owner can view all experiences"
  ON experiences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert experiences"
  ON experiences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update experiences"
  ON experiences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can delete experiences"
  ON experiences FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- CERTIFICATIONS POLICIES
-- =============================================
CREATE POLICY "Public can view visible certifications"
  ON certifications FOR SELECT
  USING (visible = true);

CREATE POLICY "Owner can view all certifications"
  ON certifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert certifications"
  ON certifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update certifications"
  ON certifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can delete certifications"
  ON certifications FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- SKILLS POLICIES
-- =============================================
CREATE POLICY "Public can view visible skills"
  ON skills FOR SELECT
  USING (visible = true);

CREATE POLICY "Owner can view all skills"
  ON skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert skills"
  ON skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update skills"
  ON skills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can delete skills"
  ON skills FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- PROJECTS POLICIES
-- =============================================
CREATE POLICY "Public can view visible projects"
  ON projects FOR SELECT
  USING (visible = true);

CREATE POLICY "Owner can view all projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can delete projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- JOURNEY PHASES POLICIES
-- =============================================
CREATE POLICY "Public can view visible journey phases"
  ON journey_phases FOR SELECT
  USING (visible = true);

CREATE POLICY "Owner can view all journey phases"
  ON journey_phases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert journey phases"
  ON journey_phases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update journey phases"
  ON journey_phases FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can delete journey phases"
  ON journey_phases FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- EDUCATION POLICIES
-- =============================================
CREATE POLICY "Public can view visible education"
  ON education FOR SELECT
  USING (visible = true);

CREATE POLICY "Owner can view all education"
  ON education FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert education"
  ON education FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update education"
  ON education FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can delete education"
  ON education FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- SOCIAL LINKS POLICIES
-- =============================================
CREATE POLICY "Public can view visible social links"
  ON social_links FOR SELECT
  USING (visible = true);

CREATE POLICY "Owner can view all social links"
  ON social_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert social links"
  ON social_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update social links"
  ON social_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can delete social links"
  ON social_links FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- SETTINGS POLICIES
-- =============================================
CREATE POLICY "Owner can view own settings"
  ON settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert settings"
  ON settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update settings"
  ON settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can delete settings"
  ON settings FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- TOOLS POLICIES
-- =============================================
CREATE POLICY "Public can view visible tools"
  ON tools FOR SELECT
  USING (visible = true);

CREATE POLICY "Owner can view all tools"
  ON tools FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert tools"
  ON tools FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update tools"
  ON tools FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can delete tools"
  ON tools FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- LEARNING POLICIES
-- =============================================
CREATE POLICY "Public can view visible learning"
  ON learning FOR SELECT
  USING (visible = true);

CREATE POLICY "Owner can view all learning"
  ON learning FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert learning"
  ON learning FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update learning"
  ON learning FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can delete learning"
  ON learning FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experiences_updated_at
  BEFORE UPDATE ON experiences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certifications_updated_at
  BEFORE UPDATE ON certifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at
  BEFORE UPDATE ON skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journey_phases_updated_at
  BEFORE UPDATE ON journey_phases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_education_updated_at
  BEFORE UPDATE ON education
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_links_updated_at
  BEFORE UPDATE ON social_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- STORAGE BUCKET POLICIES
-- =============================================
-- Note: Run these in Supabase Dashboard > Storage > Policies

-- Create the avatars bucket (if not exists, do this in Dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage Policies SQL (run in SQL Editor):

-- Allow public read access to avatars
CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================
-- COMPLETED SCHEMA SETUP
-- =============================================
-- After running this SQL, configure the following in Supabase Dashboard:
-- 
-- 1. Storage > Create bucket "avatars" with Public access
-- 2. Authentication > Enable Email auth
-- 3. Authentication > URL Configuration > Set Site URL to your domain
-- 4. Settings > API > Note your anon key and URL

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tools_updated_at
  BEFORE UPDATE ON tools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_updated_at
  BEFORE UPDATE ON learning
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- STORAGE BUCKET FOR PROFILE PHOTOS
-- =============================================
-- Run this in Supabase Dashboard > Storage > Create Bucket
-- Bucket name: avatars
-- Public: true (for public access to profile photos)

-- Storage policy for avatars bucket (run in SQL editor):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- CREATE POLICY "Avatar images are publicly accessible"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'avatars');

-- CREATE POLICY "Users can upload their own avatar"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can update their own avatar"
--   ON storage.objects FOR UPDATE
--   USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete their own avatar"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
