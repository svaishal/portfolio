import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase-server';
import { z } from 'astro/zod';

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

const draftSchema = z.object({
  table: z.enum(validTables),
  data: z.record(z.any()),
});

export const PUT: APIRoute = async (context) => {
  const supabase = createSupabaseServerClient(context);

  // 1. Auth Check
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid session' }), { status: 401 });
  }

  // 2. Parse & Validate Body
  let body;
  try {
    body = await context.request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const result = draftSchema.safeParse(body);

  if (!result.success) {
    return new Response(JSON.stringify({ 
      error: 'Validation Error', 
      details: result.error.flatten() 
    }), { status: 400 });
  }

  const { table, data } = result.data;
  const draftTable = `${table}_draft`;

  // 3. Upsert to Draft Table
  const payload = {
    ...data,
    user_id: user.id,
    updated_at: new Date().toISOString(),
  };

  // Save to draft table
  const { data: savedData, error: dbError } = await (supabase as any)
    .from(draftTable)
    .upsert(payload as any)
    .select()
    .single();

  if (dbError) {
    console.error(`Database Error (${draftTable}):`, dbError);
    return new Response(JSON.stringify({ 
      error: 'Database Error', 
      message: dbError.message 
    }), { status: 500 });
  }

  return new Response(JSON.stringify({ 
    message: 'Draft saved successfully', 
    data: savedData 
  }), { status: 200 });
};

export const DELETE: APIRoute = async (context) => {
  const supabase = createSupabaseServerClient(context);

  // 1. Auth Check
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid session' }), { status: 401 });
  }

  // 2. Parse Body for ID and Table
  let body;
  try {
    body = await context.request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const schema = z.object({
    table: z.enum(validTables),
    id: z.string().uuid(),
  });

  const result = schema.safeParse(body);

  if (!result.success) {
    return new Response(JSON.stringify({ 
      error: 'Validation Error', 
      details: result.error.flatten() 
    }), { status: 400 });
  }

  const { table, id } = result.data;
  const draftTable = `${table}_draft`;

  const { error: dbError } = await (supabase as any)
    .from(draftTable)
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // Ensure ownership

  if (dbError) {
    return new Response(JSON.stringify({ 
      error: 'Database Error', 
      message: dbError.message 
    }), { status: 500 });
  }

  return new Response(JSON.stringify({ message: 'Deleted successfully' }), { status: 200 });
};
