-- =============================================
-- MIGRATION: CREATE DRAFT TABLES
-- =============================================
-- Purpose: Separate draft content from live content for "Draft -> Publish" workflow.
-- Created: 2026-02-10

-- 1. PROFILES DRAFT
CREATE TABLE IF NOT EXISTS profiles_draft (LIKE profiles INCLUDING ALL);
ALTER TABLE profiles_draft ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can manage profiles_draft" ON profiles_draft USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. EXPERIENCES DRAFT
CREATE TABLE IF NOT EXISTS experiences_draft (LIKE experiences INCLUDING ALL);
ALTER TABLE experiences_draft ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can manage experiences_draft" ON experiences_draft USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. CERTIFICATIONS DRAFT
CREATE TABLE IF NOT EXISTS certifications_draft (LIKE certifications INCLUDING ALL);
ALTER TABLE certifications_draft ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can manage certifications_draft" ON certifications_draft USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. SKILLS DRAFT
CREATE TABLE IF NOT EXISTS skills_draft (LIKE skills INCLUDING ALL);
ALTER TABLE skills_draft ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can manage skills_draft" ON skills_draft USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. PROJECTS DRAFT
CREATE TABLE IF NOT EXISTS projects_draft (LIKE projects INCLUDING ALL);
ALTER TABLE projects_draft ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can manage projects_draft" ON projects_draft USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. TOOLS DRAFT
CREATE TABLE IF NOT EXISTS tools_draft (LIKE tools INCLUDING ALL);
ALTER TABLE tools_draft ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can manage tools_draft" ON tools_draft USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. EDUCATION DRAFT
CREATE TABLE IF NOT EXISTS education_draft (LIKE education INCLUDING ALL);
ALTER TABLE education_draft ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can manage education_draft" ON education_draft USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. JOURNEY PHASES DRAFT
CREATE TABLE IF NOT EXISTS journey_phases_draft (LIKE journey_phases INCLUDING ALL);
ALTER TABLE journey_phases_draft ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can manage journey_phases_draft" ON journey_phases_draft USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 9. SOCIAL LINKS DRAFT
CREATE TABLE IF NOT EXISTS social_links_draft (LIKE social_links INCLUDING ALL);
ALTER TABLE social_links_draft ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can manage social_links_draft" ON social_links_draft USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 10. LEARNING DRAFT
CREATE TABLE IF NOT EXISTS learning_draft (LIKE learning INCLUDING ALL);
ALTER TABLE learning_draft ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can manage learning_draft" ON learning_draft USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- SEEDING DRAFT TABLES (Initial Copy)
-- =============================================
-- Insert existing live data into draft tables so the admin starts with current state

INSERT INTO profiles_draft SELECT * FROM profiles ON CONFLICT DO NOTHING;
INSERT INTO experiences_draft SELECT * FROM experiences ON CONFLICT DO NOTHING;
INSERT INTO certifications_draft SELECT * FROM certifications ON CONFLICT DO NOTHING;
INSERT INTO skills_draft SELECT * FROM skills ON CONFLICT DO NOTHING;
INSERT INTO projects_draft SELECT * FROM projects ON CONFLICT DO NOTHING;
INSERT INTO tools_draft SELECT * FROM tools ON CONFLICT DO NOTHING;
INSERT INTO education_draft SELECT * FROM education ON CONFLICT DO NOTHING;
INSERT INTO journey_phases_draft SELECT * FROM journey_phases ON CONFLICT DO NOTHING;
INSERT INTO social_links_draft SELECT * FROM social_links ON CONFLICT DO NOTHING;
INSERT INTO learning_draft SELECT * FROM learning ON CONFLICT DO NOTHING;

-- Grant permissions if necessary (usually 'authenticated' role needs access)
GRANT ALL ON profiles_draft TO authenticated;
GRANT ALL ON experiences_draft TO authenticated;
GRANT ALL ON certifications_draft TO authenticated;
GRANT ALL ON skills_draft TO authenticated;
GRANT ALL ON projects_draft TO authenticated;
GRANT ALL ON tools_draft TO authenticated;
GRANT ALL ON education_draft TO authenticated;
GRANT ALL ON journey_phases_draft TO authenticated;
GRANT ALL ON social_links_draft TO authenticated;
GRANT ALL ON learning_draft TO authenticated;

GRANT ALL ON profiles_draft TO service_role;
GRANT ALL ON experiences_draft TO service_role;
GRANT ALL ON certifications_draft TO service_role;
GRANT ALL ON skills_draft TO service_role;
GRANT ALL ON projects_draft TO service_role;
GRANT ALL ON tools_draft TO service_role;
GRANT ALL ON education_draft TO service_role;
GRANT ALL ON journey_phases_draft TO service_role;
GRANT ALL ON social_links_draft TO service_role;
GRANT ALL ON learning_draft TO service_role;
