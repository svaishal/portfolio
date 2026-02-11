import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase-server';

export const GET: APIRoute = async (context) => {
  const supabase = createSupabaseServerClient(context);
  
  try {
    // Check migration status using RPC
    const { data, error } = await supabase.rpc('check_migration_status');
    
    if (error) {
      // Fallback: table might not exist yet
      console.error('Migration status check error:', error);
      return new Response(JSON.stringify({ 
        status: 'PENDING',
        error: 'Migration status table not found' 
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ 
      status: 'PENDING',
      error: err.message 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
