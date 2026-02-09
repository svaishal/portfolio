# Data Model

The site supports two data sources:

- Supabase tables (primary when configured)
- [src/data/data.json](../src/data/data.json) as a fallback

## Supabase tables (read)

The site reads these tables when configured:

- `profiles`
- `experiences`
- `certifications`
- `skills`
- `projects`
- `journey_phases`
- `education`
- `social_links`
- `tools`
- `learning`

All list tables are filtered by `visible = true` and ordered by `sort_order`.

## JSON fallback mapping

The fallback JSON is mapped into the Supabase-like structure in [src/lib/data.ts](../src/lib/data.ts).

Key mappings:

- `personal` -> `profiles`
- `experience` -> `experiences`
- `certifications` -> `certifications`
- `skills.technical` and `skills.soft` -> `skills` by category
- `projects` -> `projects`
- `personal.aboutNarrative.journey` -> `journey_phases`
- `education` -> `education`
- `social` or `personal` links -> `social_links`
- `tools` -> `tools`
- `learning` -> `learning`

## Required fields (fallback)

If using JSON only, keep these fields populated:

- `personal.name`, `personal.role`, `personal.tagline`, `personal.subtitle`
- `personal.location`, `personal.yearsExperience`, `personal.bio`
- `experience[].company`, `experience[].role`, `experience[].period`
- `projects[].title`, `projects[].description`, `projects[].impact`

## Optional fields

- `personal.openToWork` controls badges and availability copy
- `projects[].icon` and `experience[].icon`
- `tools[]` and `learning[]`
