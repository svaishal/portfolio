import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { AstroCookies } from 'astro';
import type { Database } from './database.types';

export function createSupabaseServerClient(cookies: AstroCookies) {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables not configured');
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookies.headers.get('cookie')?.split('; ').map((cookie) => {
          const [name, ...value] = cookie.split('=');
          return { name, value: value.join('=') };
        }) ?? [];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, {
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
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
    },
  });
}

// Session timeout in seconds (30 minutes)
export const SESSION_TIMEOUT = 30 * 60;

// Verify session is valid and not expired
export async function verifySession(cookies: AstroCookies) {
  try {
    const supabase = createSupabaseServerClient(cookies);
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
