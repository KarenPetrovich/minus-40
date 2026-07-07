# Project Map

## Start Here

Read first:

- `docs/CODEX_START.md`

Then open only the document needed for the task.

## Current Docs

- `docs/CODEX_START.md`: main entry point for new Codex branches.
- `docs/ARCHITECTURE.md`: actual code and data architecture.
- `docs/PROJECT_OPERATIONS.md`: commands, env, deploy, CLI checks, repository hygiene.
- `docs/PROJECT_CONTEXT.md`: product/user context.
- `docs/ROADMAP.md`: current and future product stages.
- `docs/PLATEAU_MODE.md`: canonical Plateau model.
- `docs/CURRENT_DESIGN_SYSTEM.md`: visual system and UI tokens.
- `docs/SKILLS_GUIDE.md`: project-local skill usage.
- `docs/DECISION_LOG.md`: active decisions that still matter.
- `docs/DEFINITION_OF_DONE.md`: completion criteria.
- `docs/DEPLOY_VERCEL.md`: Vercel-specific notes.

## Domain Knowledge

Read only when the task needs product/behavioral context:

- `knowledge/WEIGHT_LOSS_MODEL.md`;
- `knowledge/COACHING_RULES.md`.

## Code Layout

- `src/core/`: types, storage, store, calculations.
- `src/features/sync/`: cloud sync calls.
- `src/features/telegram/`: Telegram WebApp integration.
- `src/lib/supabase/`: Supabase client setup.
- `src/ui/`: screens and preview shell.
- `src/styles/`: app and preview styles.
- `public/`: static assets.
- `supabase/`: migrations, Edge Function, database docs.
- `Skills/`: project-local skills.

## Archive Rule

Temporary exports, screenshots, logs, raw research, and obsolete docs belong outside the active working set.

Never include `.env*`, `node_modules`, `dist`, `.git`, `.vercel`, logs, or screenshots in handoff archives unless explicitly requested.
