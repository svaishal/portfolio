import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase-server';

// Rate limiting for login attempts (per IP)
const loginAttempts = new Map<string, { count: number; resetTime: number; blocked: boolean }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5; // 5 attempts per 15 minutes
const BLOCK_DURATION = 30 * 60 * 1000; // 30 minute block after too many attempts

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; blockedUntil?: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetTime) {
    loginAttempts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW, blocked: false });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (record.blocked && now < record.resetTime) {
    return { allowed: false, remaining: 0, blockedUntil: record.resetTime };
  }

  if (record.count >= MAX_ATTEMPTS) {
    // Block the IP
    loginAttempts.set(ip, { count: record.count, resetTime: now + BLOCK_DURATION, blocked: true });
    return { allowed: false, remaining: 0, blockedUntil: now + BLOCK_DURATION };
  }

  record.count++;
  return { allowed: true, remaining: MAX_ATTEMPTS - record.count };
}

function resetRateLimit(ip: string) {
  loginAttempts.delete(ip);
}

// Verify Cloudflare Turnstile
async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secretKey = import.meta.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    // Skip verification if not configured (development)
    return true;
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
        remoteip: ip,
      }),
    });

    const data = await response.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('cf-connecting-ip') ||
      'unknown';

    // Check rate limit
    const rateLimitResult = checkRateLimit(clientIP);
    if (!rateLimitResult.allowed) {
      const retryAfter = rateLimitResult.blockedUntil
        ? Math.ceil((rateLimitResult.blockedUntil - Date.now()) / 1000)
        : 900;

      return new Response(
        JSON.stringify({ error: 'Too many login attempts. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
          }
        }
      );
    }

    const body = await request.json();
    const { email, password, turnstileToken } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify Turnstile if configured
    if (import.meta.env.TURNSTILE_SECRET_KEY) {
      if (!turnstileToken) {
        return new Response(
          JSON.stringify({ error: 'Please complete the security verification' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const isValid = await verifyTurnstile(turnstileToken, clientIP);
      if (!isValid) {
        return new Response(
          JSON.stringify({ error: 'Security verification failed. Please try again.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Don't reset rate limit on failure
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Reset rate limit on successful login
    resetRateLimit(clientIP);

    return new Response(
      JSON.stringify({
        success: true,
        redirectTo: '/admin/dashboard'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Login error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
