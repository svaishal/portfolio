import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase-server';
import { z } from 'astro/zod';

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

// Types for table names
type TableName = typeof validTables[number];

export const POST: APIRoute = async (context) => {
  const supabase = createSupabaseServerClient(context);

  // 1. Auth Check
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid session' }), { status: 401 });
  }

  // 2. Perform Publish (Transaction)
  // We need to copy data from ALL _draft tables to their live counterparts for this user.
  // Ideally, we'd do this in a Postgres function (RPC) for true atomicity.
  // For now, we will do it sequentially here, which is safer than client-side but not strictly atomic if server crashes mid-way.
  // TODO: Move to RPC function `publish_all_drafts(user_id)` for production-grade atomicity.

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

    if (!draftData || draftData.length === 0) {
      // Nothing to publish for this table, maybe clear live data?
      // Policy: If draft is empty, it might mean user deleted everything.
      // But usually we seed draft with live.
      // If draft is explicit empty, we should probably reflect that.
      // However, deleting all live data is risky.
      // Let's assume draft always has the full state we want.
      
      // If we simply upsert, we might miss deletions (records removed from draft but present in live).
      // Strategy: Delete all from live for user, then Insert all from draft.
      // CAUTION: This causes downtime/flicker.
      // Better Strategy: RPC.
    }

    // Since we don't have RPC yet, standard sync approach:
    // 1. Get Live IDs
    // 2. Get Draft IDs
    // 3. Delete Live IDs not in Draft
    // 4. Upsert all from Draft to Live
    
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
      // Remove draft-specific fields if any (dynamic destructuring)
      const cleanData = draftData.map((item: any) => {
        // Ensure proper updated_at
        return {
          ...item,
          updated_at: new Date().toISOString()
        };
      });

      const { error: upsertError } = await supabase
        .from(table)
        .upsert(cleanData as any);
      
      if (upsertError) {
        errors.push({ table, operation: 'upsert', error: upsertError.message });
      }
    }

    results.push({ table, status: 'synced' });
  }

  if (errors.length > 0) {
    return new Response(JSON.stringify({ 
      error: 'Publish partially failed', 
      details: errors,
      results 
    }), { status: 500 });
  }

  return new Response(JSON.stringify({ 
    message: 'Published successfully', 
    results 
  }), { status: 200 });
};
