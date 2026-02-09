# Security Remediation Checklist

## Audit Findings Fixed

### CRIT-001: Server-Side Authentication ✅
- [x] Migrated from static (GitHub Pages) to SSR (Vercel)
- [x] Implemented Astro middleware for route protection
- [x] Admin routes `/admin/*` require valid session before rendering
- [x] Session verification happens server-side, not client-side
- [x] Removed GitHub Pages deployment workflow

### CRIT-002: CSRF Protection ✅
- [x] Origin header validation in middleware
- [x] SameSite=lax cookies for session tokens
- [x] Astro `security.checkOrigin: true` in config

### CRIT-003/004: Storage Security ✅
- [x] Server-side file validation endpoint `/api/admin/upload`
- [x] File size limit: 5MB max
- [x] MIME type validation (JPG, PNG, WebP, GIF)
- [x] Magic byte verification
- [x] Storage policies: owner-only write, public read
- [x] Filename sanitization

### CRIT-005: Contact Form ✅
- [x] Replaced Formspree placeholder with secure API endpoint
- [x] Rate limiting (5 requests/minute per IP)
- [x] Cloudflare Turnstile integration
- [x] Honeypot field for basic bot detection
- [x] Input sanitization
- [x] Email validation

### HIGH-001/004: Session Hardening ✅
- [x] HttpOnly cookies via Supabase SSR
- [x] PKCE authentication flow
- [x] Server-side session expiry check
- [x] Auto-redirect on expired session

### HIGH-003: Data Security ✅
- [x] All tables have `visible` boolean for public filtering
- [x] User-specific data queries in API endpoints
- [x] RLS policies on all database tables

### HIGH-005: Secrets Management ✅
- [x] `.env.example` documents all variables
- [x] `.gitignore` excludes all `.env*` files
- [x] Service role key only used server-side
- [x] No secrets in client-side code

## Security Headers (via vercel.json) ✅
- [x] Content-Security-Policy
- [x] Strict-Transport-Security (HSTS)
- [x] X-Frame-Options: DENY
- [x] X-Content-Type-Options: nosniff
- [x] Referrer-Policy: strict-origin-when-cross-origin
- [x] Permissions-Policy

## Rate Limiting ✅
- [x] Login: 5 attempts per 15 minutes, 30-minute block
- [x] Contact form: 5 submissions per minute

## Bot Protection ✅
- [x] Cloudflare Turnstile on login page
- [x] Cloudflare Turnstile on contact form
- [x] Honeypot fields

---

## Deployment Steps

### 1. Push to GitHub
```bash
git push origin security-hardening/v1
```

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import the GitHub repository
3. Select the `security-hardening/v1` branch
4. Framework: Astro (auto-detected)

### 3. Configure Environment Variables in Vercel
Add these in Project Settings > Environment Variables:

| Variable | Description | Sensitive |
|----------|-------------|-----------|
| `PUBLIC_SUPABASE_URL` | Supabase project URL | No |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | **Yes** |
| `PUBLIC_TURNSTILE_SITE_KEY` | Turnstile widget key | No |
| `TURNSTILE_SECRET_KEY` | Turnstile verification | **Yes** |
| `CONTACT_EMAIL` | Your contact email | No |

### 4. Configure Custom Domain
1. Vercel Dashboard > Project > Settings > Domains
2. Add `vaishal.hawklab.in`
3. Configure DNS at your registrar:
   - Type: CNAME
   - Name: vaishal
   - Value: cname.vercel-dns.com

### 5. Supabase Configuration
1. Update Authentication > URL Configuration:
   - Site URL: `https://vaishal.hawklab.in`
   - Redirect URLs: `https://vaishal.hawklab.in/api/auth/callback`

2. Run the updated schema SQL (includes contact_messages table and storage policies)

3. Create storage bucket `avatars` with public access

### 6. Cloudflare Turnstile Setup
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Turnstile > Add Site
3. Domain: `vaishal.hawklab.in`
4. Mode: Managed
5. Copy Site Key and Secret Key to Vercel env vars

---

## Verification Checklist

Before declaring production-ready:

- [ ] Visit `/admin/dashboard` directly - should redirect to login
- [ ] Disable JavaScript and try `/admin/dashboard` - should still redirect
- [ ] Test login rate limiting (6+ failed attempts)
- [ ] Test contact form rate limiting (6+ rapid submissions)
- [ ] Verify Turnstile widget appears on login
- [ ] Test file upload with invalid type (should reject)
- [ ] Check security headers at securityheaders.com
- [ ] Verify HTTPS and HSTS
- [ ] Test on mobile devices
- [ ] Keyboard navigation works

---

## Files Modified

### New Files
- `src/middleware.ts` - Auth & CSRF protection
- `src/lib/supabase-server.ts` - SSR Supabase client
- `src/pages/api/auth/login.ts` - Server-side login
- `src/pages/api/auth/logout.ts` - Server-side logout
- `src/pages/api/auth/callback.ts` - OAuth callback
- `src/pages/api/auth/session.ts` - Session verification
- `src/pages/api/auth/magic-link.ts` - Passwordless login
- `src/pages/api/admin/upload.ts` - Secure file uploads
- `src/pages/api/contact.ts` - Contact form handler
- `src/env.d.ts` - TypeScript environment types
- `vercel.json` - Security headers & config

### Modified Files
- `astro.config.mjs` - SSR + Vercel adapter
- `src/components/admin/AdminLogin.tsx` - Server-side auth
- `src/components/admin/AdminDashboard.tsx` - Secure uploads
- `src/pages/admin/index.astro` - Turnstile integration
- `src/pages/contact.astro` - Secure form
- `supabase/schema.sql` - contact_messages + storage policies
- `.env.example` - All required variables
- `.gitignore` - Exclude build artifacts

### Deleted Files
- `.github/workflows/deploy.yml` - GitHub Pages workflow
