# Content Editing

Portfolio content can be updated in two ways:

1. Local JSON (simple edits, no backend)
2. Supabase data (dynamic updates, requires configuration)

## Option 1: Local JSON

Edit [src/data/data.json](../src/data/data.json). The site will use this file when Supabase is not configured.

Key sections:

- `personal`: name, role, tagline, bio, and availability
- `experience`: roles, achievements, skills
- `projects`: portfolio cards with highlights and impact
- `skills`: technical and soft skills
- `education` and `certifications`
- `tools` and `learning`

## Option 2: Supabase

When Supabase is configured, the site reads from tables defined in the schema. See [data-model.md](data-model.md) for table and field details.

## Contact form

The contact form posts to `/api/contact`. It stores messages in Supabase when `SUPABASE_SERVICE_ROLE_KEY` is set. If it is not set, messages are logged in the server console for development.
