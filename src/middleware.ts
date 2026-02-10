import { defineMiddleware, sequence } from 'astro:middleware';
import { verifySession, createSupabaseServerClient } from './lib/supabase-server';

// CSRF protection middleware
const csrfProtection = defineMiddleware(async ({ request, cookies }, next) => {
  // Only check non-GET requests
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    // Check origin matches host for mutations
    if (origin) {
      const originUrl = new URL(origin);
      const expectedHosts = [
        'localhost',
        '127.0.0.1',
        'vaishal.hawklab.in',
        host?.split(':')[0],
      ].filter(Boolean);

      if (!expectedHosts.includes(originUrl.hostname)) {
        return new Response('CSRF validation failed', { status: 403 });
      }
    }
  }

  return next();
});

// Auth protection middleware
const authProtection = defineMiddleware(async ({ request, url, cookies, redirect, locals }, next) => {
  const isAdminRoute = url.pathname.startsWith('/admin');
  const isLoginPage = url.pathname === '/admin' || url.pathname === '/admin/';
  const isApiRoute = url.pathname.startsWith('/api/');

  // Protect admin routes
  if (isAdminRoute && !isLoginPage) {
    const { valid, session } = await verifySession({ request: request as Request, cookies });

    if (!valid || !session) {
      // Clear any stale session cookies
      cookies.delete('sb-access-token', { path: '/' });
      cookies.delete('sb-refresh-token', { path: '/' });

      // Redirect to login
      return redirect('/admin', 302);
    }

    // Attach session to locals for use in pages
    locals.session = session;
    locals.user = session.user;
  }

  // If authenticated user visits login page, redirect to dashboard
  if (isLoginPage) {
    const { valid, session } = await verifySession({ request: request as Request, cookies });
    if (valid && session) {
      return redirect('/admin/dashboard', 302);
    }
  }

  // API routes also need protection
  if (isApiRoute && url.pathname.startsWith('/api/admin')) {
    const { valid, session } = await verifySession({ request: request as Request, cookies });

    if (!valid || !session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    locals.session = session;
    locals.user = session.user;
  }

  return next();
});

// Security headers middleware
const securityHeaders = defineMiddleware(async ({ request }, next) => {
  const response = await next();

  // Additional security headers (supplement vercel.json)
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
});

import { rateLimit } from './middleware/rateLimit';

// Export combined middleware
export const onRequest = sequence(csrfProtection, rateLimit, authProtection, securityHeaders);
