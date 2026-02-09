import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase-server';

export const POST: APIRoute = async ({ request, cookies, url }) => {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createSupabaseServerClient({ request, cookies });

    // Get the base URL from the request
    const origin = url.origin;
    const redirectTo = `${origin}/api/auth/callback?next=/admin/dashboard`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      console.error('Magic link error:', error);
      // Don't reveal whether email exists
      return new Response(
        JSON.stringify({ success: true, message: 'If the email exists, a magic link has been sent.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Magic link sent! Check your email.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Magic link error:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to send magic link' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
