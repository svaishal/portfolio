import type { APIRoute } from 'astro';
import { verifySession } from '../../../lib/supabase-server';

export const GET: APIRoute = async ({ request, cookies }) => {
  // ⚠️ LOCAL DEV MODE ONLY - Bypass auth for local testing
  if (import.meta.env.PUBLIC_DEV_ADMIN_BYPASS === 'true') {
    return new Response(
      JSON.stringify({
        user: {
          id: 'dev-user-123',
          email: 'dev@local.test',
          role: 'admin',
        },
        userId: 'dev-user-123',
        expiresAt: Date.now() + 3600000,
        accessToken: 'dev-token',
        refreshToken: 'dev-refresh',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

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
