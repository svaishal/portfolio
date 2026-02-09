# Setup

## Prerequisites

- Node.js 18+
- npm

## Install

```bash
npm install
```

## Configure environment

1. Copy `.env.example` to `.env`.
2. Fill in your Supabase values and optional Turnstile keys.

Minimum for Supabase-backed data:
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

Contact storage requires:
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:
- `PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `CONTACT_EMAIL`

## Run locally

```bash
npm run dev
```

Local site: http://localhost:4321

## Build and preview

```bash
npm run build
npm run preview
```

## Data source behavior

- If Supabase environment variables are present, the site fetches content from Supabase.
- If they are missing, the site falls back to [src/data/data.json](../src/data/data.json).
