import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase-server';

// Tables that support draft/publish workflow
const validTables = [
  'profiles',
  'experiences',
  'certifications',
  'skills',
  'projects',
  'tools',
  'education',
  'journey_phases',
  'social_links',
  'learning'
] as const;

export const POST: APIRoute = async (context) => {
  const supabase = createSupabaseServerClient(context);

  // 1. Auth Check
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid session' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 2. Try atomic publish via RPC function
    const { data: rpcResult, error: rpcError } = await supabase.rpc('publish_all_drafts', {
      p_user_id: user.id,
      p_user_email: user.email || ''
    });

    if (!rpcError && rpcResult) {
      // RPC succeeded - atomic publish complete
      return new Response(JSON.stringify({ 
        message: 'Published successfully (atomic)', 
        results: rpcResult.tables || [],
        atomic: true
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Fallback to sequential publish if RPC not available
    console.warn('RPC publish failed, falling back to sequential:', rpcError?.message);
    
    const results = [];
    const errors = [];

    for (const table of validTables) {
      const draftTable = `${table}_draft`;
      
      // Fetch draft data
      const { data: draftData, error: fetchError } = await (supabase as any)
        .from(draftTable)
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) {
        errors.push({ table, error: fetchError.message });
        continue;
      }

      // Fetch live IDs
      const { data: liveData } = await supabase
        .from(table)
        .select('id')
        .eq('user_id', user.id);
      
      const liveIds = new Set((liveData || []).map((d: any) => d.id));
      const draftIds = new Set((draftData || []).map((d: any) => d.id));

      const toDelete = [...liveIds].filter((id: any) => !draftIds.has(id));

      // Delete removed records
      if (toDelete.length > 0) {
        await supabase.from(table).delete().in('id', toDelete);
      }

      // Upsert fresh records
      if (draftData && draftData.length > 0) {
        const cleanData = draftData.map((item: any) => ({
          ...item,
          updated_at: new Date().toISOString()
        }));

        const { error: upsertError } = await supabase
          .from(table)
          .upsert(cleanData as any);
        
        if (upsertError) {
          errors.push({ table, operation: 'upsert', error: upsertError.message });
        }
      }

      results.push({ table, status: 'synced' });
    }

    // Log to audit (if table exists)
    try {
      await supabase.from('admin_audit_logs').insert({
        user_id: user.id,
        user_email: user.email,
        action: 'PUBLISH_ALL_FALLBACK',
        new_data: { tables: validTables, errors }
      });
    } catch (e) {
      // Audit logging is optional
    }

    if (errors.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Publish partially failed', 
        details: errors,
        results,
        atomic: false
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      message: 'Published successfully', 
      results,
      atomic: false
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Publish error:', error);
    return new Response(JSON.stringify({ 
      error: 'Publish failed', 
      message: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
