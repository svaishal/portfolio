# Architecture

## Runtime

- Astro SSR output with the Vercel adapter
- Server-rendered routes for public pages
- Optional Supabase-backed data source

## Pages

Public pages:
- `/` (home)
- `/about`
- `/experience`
- `/portfolio`
- `/contact`

## Data flow

- [src/lib/data.ts](../src/lib/data.ts) loads data from Supabase when configured.
- If Supabase is not configured, it uses [src/data/data.json](../src/data/data.json).

## API routes

- `/api/contact` handles contact form submissions with rate limiting, validation, and optional Turnstile verification.

## Middleware

Middleware provides:
- CSRF checks for non-GET requests
- Session checks for protected routes
- Additional security headers

See [src/middleware.ts](../src/middleware.ts) for details.
