import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase-server';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  try {
    const supabase = createSupabaseServerClient(cookies);
    
    // Sign out from Supabase
    await supabase.auth.signOut();

    // Clear all auth cookies
    const cookieNames = [
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token'
    ];

    cookieNames.forEach(name => {
      cookies.delete(name, { path: '/' });
    });

    // Also clear any Supabase auth cookies that might be set with the project ref
    const allCookies = cookies.headers.get('cookie') || '';
    allCookies.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=');
      if (name.startsWith('sb-')) {
        cookies.delete(name, { path: '/' });
      }
    });

    return new Response(
      JSON.stringify({ success: true, redirectTo: '/admin' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Logout error:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to logout' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Also support GET for direct navigation
export const GET: APIRoute = async ({ cookies, redirect }) => {
  try {
    const supabase = createSupabaseServerClient(cookies);
    await supabase.auth.signOut();

    // Clear cookies
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });

    return redirect('/admin', 302);
  } catch {
    return redirect('/admin', 302);
  }
};
