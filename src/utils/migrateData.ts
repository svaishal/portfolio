import { supabase } from '../lib/supabase';
// @ts-ignore
import data from '../data/data.json';

interface MigrationResult {
  success: boolean;
  error?: any;
  alreadyCompleted?: boolean;
}

export const checkMigrationStatus = async (): Promise<{ status: string; migrated_at?: string; migrated_by?: string }> => {
  try {
    const { data, error } = await supabase.rpc('check_migration_status');
    if (error) {
      console.warn('Migration status check failed:', error);
      return { status: 'PENDING' };
    }
    return data || { status: 'PENDING' };
  } catch (e) {
    return { status: 'PENDING' };
  }
};

export const migrateData = async (userId: string): Promise<MigrationResult> => {
  console.log('Starting migration for user:', userId);

  try {
    // 1. Check if migration already completed
    const migrationStatus = await checkMigrationStatus();
    if (migrationStatus.status === 'COMPLETED') {
      console.warn('Migration already completed. Blocking re-run.');
      return { 
        success: false, 
        alreadyCompleted: true,
        error: 'Migration has already been completed and cannot be run again.'
      };
    }

    // 2. Profile
    const profileData = {
      user_id: userId,
      name: data.personal.name,
      role: data.personal.role,
      tagline: data.personal.tagline,
      subtitle: data.personal.subtitle,
      location: data.personal.location,
      years_experience: data.personal.yearsExperience,
      bio: data.personal.bio,
      about_intro: data.personal.aboutNarrative?.intro || '',
      about_values: data.personal.aboutNarrative?.values || '',
      open_to_work: data.personal.openToWork,
    };

    const { error: profileError } = await (supabase as any)
      .from('profiles_draft')
      .upsert(profileData, { onConflict: 'user_id' });

    if (profileError) {
      console.error('Profile error:', profileError);
      throw new Error('Failed to migrate profile');
    }

    // 2. Clear existing child data to avoid duplicates (since we can't map text IDs to UUIDs easily)
    await Promise.all([
      (supabase as any).from('experiences_draft').delete().eq('user_id', userId),
      (supabase as any).from('projects_draft').delete().eq('user_id', userId),
      (supabase as any).from('skills_draft').delete().eq('user_id', userId),
      (supabase as any).from('certifications_draft').delete().eq('user_id', userId),
      (supabase as any).from('tools_draft').delete().eq('user_id', userId),
      (supabase as any).from('journey_phases_draft').delete().eq('user_id', userId),
      (supabase as any).from('education_draft').delete().eq('user_id', userId),
      (supabase as any).from('social_links_draft').delete().eq('user_id', userId),
      (supabase as any).from('learning_draft').delete().eq('user_id', userId),
    ]);

    // 3. Insert new data
    
    // Experience
    if (data.experience?.length) {
      const items = data.experience.map((exp: any, i: number) => ({
        user_id: userId,
        company: exp.company,
        role: exp.role,
        period: exp.period,
        type: exp.type,
        icon: exp.icon,
        achievements: exp.achievements,
        skills: exp.skills,
        is_current: exp.current,
        sort_order: i,
        visible: true
      }));
      const { error } = await (supabase as any).from('experiences_draft').insert(items);
      if (error) throw error;
    }

    // Projects
    if (data.projects?.length) {
      const items = data.projects.map((p: any, i: number) => ({
        user_id: userId,
        title: p.title,
        description: p.description,
        category: p.category,
        icon: p.icon,
        highlights: p.highlights,
        impact: p.impact,
        visible: true,
        sort_order: i
      }));
      const { error } = await (supabase as any).from('projects_draft').insert(items);
      if (error) throw error;
    }

    // Skills
    if (data.skills) {
      const tech = (data.skills.technical || []).map((name: string, i: number) => ({
        user_id: userId,
        name,
        category: 'technical' as const,
        visible: true,
        sort_order: i
      }));
      const soft = (data.skills.soft || []).map((name: string, i: number) => ({
        user_id: userId,
        name,
        category: 'soft' as const,
        visible: true,
        sort_order: i
      }));
      const { error } = await (supabase as any).from('skills_draft').insert([...tech, ...soft]);
      if (error) throw error;
    }

    // Certifications
    if (data.certifications?.length) {
      const items = data.certifications.map((c: any, i: number) => ({
        user_id: userId,
        name: typeof c === 'string' ? c : c.name,
        icon: typeof c === 'string' ? '📜' : (c.icon || '📜'),
        visible: true,
        sort_order: i
      }));
      const { error } = await (supabase as any).from('certifications_draft').insert(items);
      if (error) throw error;
    }

    // Tools
    if (data.tools?.length) {
      const items = data.tools.map((t: any, i: number) => ({
        user_id: userId,
        name: t.name,
        category: t.category,
        description: t.description,
        icon: t.icon,
        visible: true,
        sort_order: i
      }));
      const { error } = await (supabase as any).from('tools_draft').insert(items);
      if (error) throw error;
    }

    // Journey Phases
    if (data.personal.aboutNarrative?.journey?.length) {
      const items = data.personal.aboutNarrative.journey.map((p: any, i: number) => ({
        user_id: userId,
        phase: p.phase,
        description: p.description,
        visible: true,
        sort_order: i
      }));
      const { error } = await (supabase as any).from('journey_phases_draft').insert(items);
      if (error) throw error;
    }

    // Education
    if (data.education?.length) {
      const items = data.education.map((e: any, i: number) => ({
        user_id: userId,
        degree: e.degree,
        institution: e.institution,
        year: e.year,
        field: e.field,
        visible: true,
        sort_order: i
      }));
      const { error } = await (supabase as any).from('education_draft').insert(items);
      if (error) throw error;
    }

    // Social Links
    const socials = [];
    if (data.social?.github || data.personal.github) {
      socials.push({
          user_id: userId,
          platform: 'github',
          url: data.social?.github || `https://github.com/${data.personal.github}`,
          visible: true,
          sort_order: 0
      });
    }
    if (data.social?.linkedin || data.personal.linkedin) {
      socials.push({
          user_id: userId,
          platform: 'linkedin',
          url: data.social?.linkedin || data.personal.linkedin,
          visible: true,
          sort_order: 1
    });
    }
    if (socials.length) {
      const { error } = await (supabase as any).from('social_links_draft').insert(socials);
      if (error) throw error;
    }

    // Learning
    if (data.learning?.length) {
      const items = data.learning.map((l: any, i: number) => ({
        user_id: userId,
        name: l.name,
        description: l.description,
        status: l.status,
        visible: true,
        sort_order: i
      }));
      const { error } = await (supabase as any).from('learning_draft').insert(items);
      if (error) throw error;
    }

    // 3. Mark migration as completed
    try {
      const { data: completionResult, error: completionError } = await supabase.rpc('set_migration_completed', {
        p_user_id: userId
      });
      
      if (completionError) {
        console.warn('Failed to mark migration as completed:', completionError);
        // Don't fail the migration, just log
      } else {
        console.log('Migration marked as completed:', completionResult);
      }
    } catch (e) {
      console.warn('Migration completion tracking not available:', e);
    }

    return { success: true };
    
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error };
  }
};
