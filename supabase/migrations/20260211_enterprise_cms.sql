-- =============================================
-- ENTERPRISE CMS MIGRATION
-- Version: 3.0 (Enterprise Ready)
-- Date: 2026-02-11
-- =============================================

-- =============================================
-- SITE META TABLE (Migration Status Tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS site_meta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert migration status if not exists
INSERT INTO site_meta (key, value)
VALUES ('migration_status', '{"status": "PENDING", "migrated_at": null, "migrated_by": null}')
ON CONFLICT (key) DO NOTHING;

-- RLS for site_meta
ALTER TABLE site_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read site_meta"
  ON site_meta FOR SELECT
  USING (true);

CREATE POLICY "Only authenticated can update site_meta"
  ON site_meta FOR UPDATE
  TO authenticated
  USING (true);

-- =============================================
-- ADMIN AUDIT LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON admin_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON admin_audit_logs(created_at DESC);

-- RLS for audit logs
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only authenticated can read audit logs"
  ON admin_audit_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated can insert audit logs"
  ON admin_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =============================================
-- PUBLISH HISTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS publish_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  tables_published TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for publish history
ALTER TABLE publish_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only authenticated can read publish history"
  ON publish_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated can insert publish history"
  ON publish_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =============================================
-- ATOMIC PUBLISH FUNCTION (RPC)
-- =============================================
CREATE OR REPLACE FUNCTION publish_all_drafts(p_user_id UUID, p_user_email TEXT)
RETURNS JSONB AS $$
DECLARE
  v_tables TEXT[] := ARRAY['profiles', 'experiences', 'certifications', 'skills', 'projects', 'tools', 'education', 'journey_phases', 'social_links', 'learning'];
  v_table TEXT;
  v_draft_table TEXT;
  v_result JSONB := '{"success": true, "tables": []}'::JSONB;
  v_table_results JSONB := '[]'::JSONB;
  v_draft_ids UUID[];
  v_live_ids UUID[];
  v_to_delete UUID[];
BEGIN
  -- Start transaction is implicit in functions
  
  FOREACH v_table IN ARRAY v_tables
  LOOP
    v_draft_table := v_table || '_draft';
    
    -- Get draft IDs for this user
    EXECUTE format('SELECT COALESCE(array_agg(id), ARRAY[]::UUID[]) FROM %I WHERE user_id = $1', v_draft_table)
    INTO v_draft_ids
    USING p_user_id;
    
    -- Get live IDs for this user
    EXECUTE format('SELECT COALESCE(array_agg(id), ARRAY[]::UUID[]) FROM %I WHERE user_id = $1', v_table)
    INTO v_live_ids
    USING p_user_id;
    
    -- Find IDs to delete (in live but not in draft)
    SELECT array_agg(id) INTO v_to_delete
    FROM unnest(v_live_ids) AS id
    WHERE id != ALL(v_draft_ids);
    
    -- Delete removed records from live
    IF v_to_delete IS NOT NULL AND array_length(v_to_delete, 1) > 0 THEN
      EXECUTE format('DELETE FROM %I WHERE id = ANY($1)', v_table)
      USING v_to_delete;
    END IF;
    
    -- Upsert all draft records to live
    EXECUTE format('
      INSERT INTO %I 
      SELECT * FROM %I WHERE user_id = $1
      ON CONFLICT (id) DO UPDATE SET
        updated_at = NOW()
    ', v_table, v_draft_table)
    USING p_user_id;
    
    -- Special handling for tables with unique constraints
    -- For profiles, handle the user_id unique constraint
    IF v_table = 'profiles' THEN
      EXECUTE format('
        INSERT INTO %I (id, user_id, name, role, tagline, subtitle, location, years_experience, bio, about_intro, about_values, open_to_work, profile_photo_url, created_at, updated_at)
        SELECT id, user_id, name, role, tagline, subtitle, location, years_experience, bio, about_intro, about_values, open_to_work, profile_photo_url, created_at, NOW()
        FROM %I WHERE user_id = $1
        ON CONFLICT (user_id) DO UPDATE SET
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          tagline = EXCLUDED.tagline,
          subtitle = EXCLUDED.subtitle,
          location = EXCLUDED.location,
          years_experience = EXCLUDED.years_experience,
          bio = EXCLUDED.bio,
          about_intro = EXCLUDED.about_intro,
          about_values = EXCLUDED.about_values,
          open_to_work = EXCLUDED.open_to_work,
          profile_photo_url = EXCLUDED.profile_photo_url,
          updated_at = NOW()
      ', v_table, v_draft_table)
      USING p_user_id;
    END IF;
    
    v_table_results := v_table_results || jsonb_build_object('table', v_table, 'status', 'synced');
  END LOOP;
  
  -- Log to publish history
  INSERT INTO publish_history (user_id, user_email, tables_published, status)
  VALUES (p_user_id, p_user_email, v_tables, 'success');
  
  -- Log to audit
  INSERT INTO admin_audit_logs (user_id, user_email, action, new_data)
  VALUES (p_user_id, p_user_email, 'PUBLISH_ALL', jsonb_build_object('tables', v_tables));
  
  v_result := jsonb_set(v_result, '{tables}', v_table_results);
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  -- Log failed publish
  INSERT INTO publish_history (user_id, user_email, status, error_message)
  VALUES (p_user_id, p_user_email, 'failed', SQLERRM);
  
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- CHECK MIGRATION STATUS FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION check_migration_status()
RETURNS JSONB AS $$
DECLARE
  v_status JSONB;
BEGIN
  SELECT value INTO v_status
  FROM site_meta
  WHERE key = 'migration_status';
  
  RETURN COALESCE(v_status, '{"status": "PENDING"}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SET MIGRATION COMPLETED FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION set_migration_completed(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_current_status JSONB;
BEGIN
  -- Check if already completed
  SELECT value INTO v_current_status
  FROM site_meta
  WHERE key = 'migration_status';
  
  IF v_current_status->>'status' = 'COMPLETED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Migration already completed');
  END IF;
  
  -- Update status
  UPDATE site_meta
  SET value = jsonb_build_object(
    'status', 'COMPLETED',
    'migrated_at', NOW(),
    'migrated_by', p_user_id
  ),
  updated_at = NOW()
  WHERE key = 'migration_status';
  
  -- Log the migration
  INSERT INTO admin_audit_logs (user_id, action, new_data)
  VALUES (p_user_id, 'MIGRATION_COMPLETED', jsonb_build_object('migrated_at', NOW()));
  
  RETURN jsonb_build_object('success', true, 'status', 'COMPLETED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- UPDATE TRIGGERS FOR site_meta
-- =============================================
CREATE TRIGGER update_site_meta_updated_at
  BEFORE UPDATE ON site_meta
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- GRANT EXECUTE ON FUNCTIONS
-- =============================================
GRANT EXECUTE ON FUNCTION publish_all_drafts(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_migration_status() TO authenticated;
GRANT EXECUTE ON FUNCTION check_migration_status() TO anon;
GRANT EXECUTE ON FUNCTION set_migration_completed(UUID) TO authenticated;
