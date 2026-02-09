import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { AstroCookies } from 'astro';
import type { Database } from './database.types';

export function createSupabaseServerClient(context: { request: Request; cookies: AstroCookies }) {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables not configured');
  }

  // Capture values upfront to avoid closure issues with async operations
  const cookieHeader = context.request?.headers?.get('Cookie') || '';
  const parsedCookies = cookieHeader
    ? cookieHeader.split(';').map((cookie) => {
        const [name, ...value] = cookie.trim().split('=');
        return { name, value: value.join('=') };
      })
    : [];

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parsedCookies;
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          context.cookies.set(name, value, {
            path: '/',
            httpOnly: true,
            secure: import.meta.env.PROD,
            sameSite: 'lax',
            maxAge: options?.maxAge,
            ...options,
          });
        });
      },
    },
    auth: {
      flowType: 'pkce',
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

// Session timeout in seconds (30 minutes)
export const SESSION_TIMEOUT = 30 * 60;

// Verify session is valid and not expired
export async function verifySession(context: { request: Request; cookies: AstroCookies }) {
  try {
    const supabase = createSupabaseServerClient(context);
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      return { valid: false, session: null };
    }

    // Check if session is expired (additional server-side check)
    const expiresAt = session.expires_at;
    if (expiresAt && expiresAt * 1000 < Date.now()) {
      return { valid: false, session: null };
    }

    return { valid: true, session };
  } catch {
    return { valid: false, session: null };
  }
}
