
import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase-server';

export const GET: APIRoute = async (context) => {
  const supabase = createSupabaseServerClient(context);

  // Fetch all public data concurrently
  const [
    profileRes,
    expRes,
    certRes,
    skillRes,
    projRes,
    toolsRes,
    eduRes,
    journeyRes,
    socialRes,
    learningRes
  ] = await Promise.all([
    supabase.from('profiles').select('*').single(),
    supabase.from('experiences').select('*').eq('visible', true).order('sort_order'),
    supabase.from('certifications').select('*').eq('visible', true).order('sort_order'),
    supabase.from('skills').select('*').eq('visible', true).order('sort_order'),
    supabase.from('projects').select('*').eq('visible', true).order('sort_order'),
    supabase.from('tools').select('*').eq('visible', true).order('sort_order'),
    supabase.from('education').select('*').eq('visible', true).order('sort_order'),
    supabase.from('journey_phases').select('*').eq('visible', true).order('sort_order'),
    supabase.from('social_links').select('*').eq('visible', true).order('sort_order'),
    supabase.from('learning').select('*').eq('visible', true).order('sort_order'),
  ]);

  const data = {
    profile: profileRes.data,
    experiences: expRes.data || [],
    certifications: certRes.data || [],
    skills: skillRes.data || [],
    projects: projRes.data || [],
    tools: toolsRes.data || [],
    education: eduRes.data || [],
    journey_phases: journeyRes.data || [],
    social_links: socialRes.data || [],
    learning: learningRes.data || [],
  };

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
};
