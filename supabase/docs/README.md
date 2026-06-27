# Minus 40 Database

This directory contains generated and maintained database reference artifacts for the Minus 40 Supabase schema.

## Canonical Sources

- `supabase/migrations/` in the repo
- `supabase/docs/metadata.json` in the repo

## Generated Artifacts

- `schema.sql` -> concatenated SQL schema history
- `tables.md` -> table descriptions
- `relationships.md` -> relationship map
- `migrations/` -> raw migration files

## Maintenance Rule

Run `npm run db:docs` after every schema change. This updates the repo-side docs and refreshes the local archive mirror.

Archive mirror path:

- `C:\Future\Минус40_архив\database\minus-40`

## Notes

- The repo SQL migrations are the canonical database source of truth.
- The local archive mirror is regenerated from repository artifacts and should stay in sync after every schema change.
- Current production access is expected to go through validated Supabase Edge Functions even though RLS policies are already defined for future direct user-token access.
