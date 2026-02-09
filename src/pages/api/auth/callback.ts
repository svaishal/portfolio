import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase-server';

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/admin/dashboard';

  if (!code) {
    return redirect('/admin?error=no_code', 302);
  }

  try {
    const supabase = createSupabaseServerClient(cookies);
    
    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error);
      return redirect('/admin?error=auth_failed', 302);
    }

    // Validate the redirect URL to prevent open redirect
    const allowedPaths = ['/admin', '/admin/dashboard'];
    const redirectPath = next.startsWith('/') && allowedPaths.some(p => next.startsWith(p)) 
      ? next 
      : '/admin/dashboard';

    return redirect(redirectPath, 302);
  } catch (err) {
    console.error('Callback error:', err);
    return redirect('/admin?error=internal', 302);
  }
};
