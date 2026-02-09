import type { APIRoute } from 'astro';
import { verifySession } from '../../../lib/supabase-server';

export const GET: APIRoute = async ({ request, cookies }) => {
  const { valid, session } = await verifySession({ request, cookies });

  if (!valid || !session) {
    return new Response(
      JSON.stringify({ error: 'Not authenticated' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
      userId: session.user.id,
      expiresAt: session.expires_at,
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
