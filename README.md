# Vaishal S - Professional Portfolio

A production-ready portfolio built with Astro, Tailwind CSS, and Framer Motion. Content is sourced from Supabase when configured, with a local JSON fallback for simple edits and offline development.

Live site: https://vaishal.hawklab.in

## Features

- Server-rendered pages with Astro and Vercel adapter
- Data-driven content from Supabase with local JSON fallback
- Secure contact flow with rate limiting and optional Turnstile
- Responsive, mobile-first layout with accessible components
- Security headers and SSR middleware protections

## Tech Stack

- Framework: Astro
- Styling: Tailwind CSS
- Animations: Framer Motion
- Language: TypeScript
- Data: Supabase (optional, with JSON fallback)
- Hosting: Vercel

## Documentation

- [docs/index.md](docs/index.md)
- [docs/setup.md](docs/setup.md)
- [docs/content.md](docs/content.md)
- [docs/data-model.md](docs/data-model.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/deployment.md](docs/deployment.md)
- [docs/security.md](docs/security.md)

Admin workflows are intentionally not documented in public-facing docs. Maintain internal notes separately.

## Quick Start

Prerequisites:
- Node.js 18+
- npm

Install and run:

```bash
npm install
npm run dev
```

Local site: http://localhost:4321

## Environment Variables

Copy [./.env.example](.env.example) to `.env` and fill values.

Required for Supabase-backed data:
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

Required for contact storage:
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:
- `PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `CONTACT_EMAIL`

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run astro
```

## Security

Security hardening details and verification steps live in [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md).

## License

MIT
