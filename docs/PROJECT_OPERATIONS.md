# Project Operations

## Purpose

This is the main operational document for day-to-day work.

If the goal is to quickly understand:

- what stage the project is in;
- what we are doing right now;
- how deployment works;
- what is intentionally postponed;
- how to keep the repository clean;

start here.

## Current Stage

- Active roadmap stage: Stage 1
- Product scope: MVP for weight tracking inside Telegram Mini App
- Current implementation: Supabase-backed cloud sync with local cache and legacy migration support

## Current Focus

As of June 27, 2026, the active focus is:

1. stabilizing the shipped Supabase sync baseline;
2. keeping Telegram-validated cloud access host-independent;
3. keeping the local database backup mirror in sync with schema changes;
4. removing temporary diagnostics and duplicate sources of truth after verification.

## Working Efficiency Rules

Keep work narrow, search before reading, and verify at the right scale.

- search first, then open only the relevant fragment;
- do not reread long docs or skills if the needed context is already gathered;
- bundle small UI tweaks into one pass;
- use reload/spot checks for tiny style changes;
- reserve full builds for behavior, asset, structure, or release changes.
- prefer the local preview laboratory at `http://127.0.0.1:5173/preview` for UI iteration;
- avoid exchanging screenshots unless they are strictly needed for a bug report or final verification;
- treat the preview page as the primary visual feedback loop to save time and token budget.

## Explicitly Deferred

These items are important, but are not the current implementation focus:

1. realtime push sync beyond refresh/reload based cloud reconciliation;
2. final logo selection and replacement of the temporary square-in-square mark;
3. broader architecture expansion beyond the current MVP needs.

## Current Product State

Already working:

- adding weight entries;
- storing entries locally as legacy/cache state;
- Supabase cloud bootstrap and refresh;
- overview screen;
- history screen;
- graph screen;
- goals/settings screen;
- Telegram Web App initialization;
- mobile launch path through Netlify + Telegram.

In progress:

- keeping the local database backup artifacts under `C:\Future\Минус40_архив\database\minus-40` aligned with schema changes;
- cleaning up temporary diagnostics after verification passes.

## Deployment Workflow

- Primary deployment is Vercel.
- Backup deployment remains Netlify.
- Vercel should auto-build from GitHub on each push to `main`.
- This project is a Vite SPA, so `vercel.json` keeps all routes rewritten to `index.html`.

### Host Transition Notes

- Telegram WebView is sensitive to root-page overscroll, so scrolling must stay inside the app container, not at the `body` level.
- Different hosts still mean different browser origins, so browser local storage is not automatically shared between Netlify and Vercel.
- Cloud sync stays independent from the frontend host and relies only on Supabase plus Telegram identity validation.

## Repository Hygiene Rule

Temporary and obsolete files must not stay in the main project root.

Archive location:

- `C:\Future\Минус40_архив`

Move there:

- temporary screenshots;
- logs;
- raw external exports not used as the current source of truth;
- imported design/export folders after their decisions are integrated into code;
- generated artifacts that can be rebuilt;
- obsolete project documents that were replaced by newer canonical docs.

## Source Of Truth Priority

If there is a conflict, use this order:

1. current user instructions;
2. `docs/DECISION_LOG.md`;
3. `docs/PROJECT_CONTEXT.md`;
4. `docs/PROJECT_OPERATIONS.md`;
5. `docs/CURRENT_DESIGN_SYSTEM.md`;
6. `docs/SKILLS_GUIDE.md`;
7. `docs/ROADMAP.md`.

## Read Order For New Sessions

1. `docs/PROJECT_MAP.md`
2. `docs/PROJECT_OPERATIONS.md`
3. `docs/PROJECT_CONTEXT.md`
4. `docs/CURRENT_DESIGN_SYSTEM.md`
5. `docs/SKILLS_GUIDE.md`

When starting work, treat the efficiency rules in this file as active default operating rules, not optional advice.

## Cleanup Trigger

When the user says "проведи чистку", it means:

1. move temporary and obsolete files out of the project root and active folders into `C:\Future\Минус40_архив`;
2. check whether active documents still reflect reality;
3. reduce duplicate sources of truth;
4. leave only live project files in `C:\Future\Минус 40`.
- use `http://127.0.0.1:5173/preview` as the first-stop visual lab for UI changes;
- avoid screenshot ping-pong unless a bug specifically requires it.
