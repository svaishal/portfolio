# Deployment (Vercel)

## 1. Create a Vercel project

- Import the repository into Vercel
- Framework: Astro (auto-detected)
- Output: server

## 2. Configure environment variables

Add the values from `.env.example` in Vercel Project Settings -> Environment Variables.

Recommended minimum:
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:
- `PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `CONTACT_EMAIL`

## 3. Domain configuration

- Add your custom domain in Vercel
- Update DNS records with your registrar

## 4. Supabase configuration

- Update Auth -> URL Configuration
  - Site URL: your production domain
  - Redirect URLs: include `/api/auth/callback`
- Apply [supabase/schema.sql](../supabase/schema.sql)
- Create the `avatars` storage bucket

## 5. Verify

- Confirm `/contact` posts successfully
- Check security headers in the response
- Ensure routes render without client-side errors
