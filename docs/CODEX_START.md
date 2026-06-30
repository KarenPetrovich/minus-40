# Codex Start

This is the first document to read in a new Codex branch.

## Product

Minus 40 is a personal Telegram Mini App for weight tracking and weight-loss trajectory control.

It is not a generic wellness app, calorie counter, or mass-market product. The core metric is weight, and the goal is to help one user stay on a known route from about 150 kg to 110 kg.

## Weight Route

The approved route is:

```text
150 -> 140 -> 130 -> 120 -> 115 -> 110
```

Each segment between neighboring milestones is a separate burst:

- 150 -> 140;
- 140 -> 130;
- 130 -> 120;
- 120 -> 115;
- 115 -> 110.

After 120 kg, the steps become smaller because later progress is harder.

## Plateau Mode

The app uses a cycle:

```text
burst -> plateau -> burst -> plateau
```

Rules:

- a burst aims at the next route milestone;
- the first confirmed milestone starts Plateau automatically;
- Plateau lasts 7 days;
- on day 8 the app returns to burst mode;
- the route never rolls back;
- history and graph stay unified;
- only calculations, visual accents, and Overview behavior change by stage.

Canonical details: `docs/PLATEAU_MODE.md`.

## Tech Stack

- React;
- TypeScript;
- Vite;
- Telegram Mini App;
- Supabase Postgres;
- Supabase Edge Function for Telegram-validated production sync.

## Screens

- Overview;
- History;
- Graph;
- Goals/Settings;
- Plateau Overview variant;
- Developer Preview at `/dev-preview`.

## Developer Preview

`/dev-preview` is a local development tool, not a production page.

Main URL:

```text
http://127.0.0.1:5173/dev-preview
```

It renders the same app UI tree, inside a fixed Telegram-like viewport. Dev controls live outside the phone viewport.

Do not deploy Vercel after `/dev-preview` changes unless the user explicitly asks.

## Data Reality

Real cloud data lives in Supabase tables:

- `app_users`;
- `weight_entries`.

There is no separate snapshot object/table in Supabase.

For `/dev-preview`, the local dev server assembles a snapshot from `app_users + weight_entries`, writes it into browser `localStorage` as `minus40.cloud-cache`, and writes metadata into `minus40.cloud-meta`.

Plateau fields in the app state:

- `plateauStartedAt`;
- `lastConfirmedMilestone`;
- `plateauStartWeight`.

If the live database does not yet have matching plateau columns, dev snapshot assembly falls back to `null` for those fields.

## Updating Dev Preview Data

Use the `Обновить данные` button in `/dev-preview`.

Rules:

- Supabase refresh happens only by this button;
- no auto-refresh;
- no polling;
- no refresh on route render;
- if local dev credentials are missing, fallback is local cache.

Local dev-only Supabase snapshot refresh requires `.env.local`:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DEV_SNAPSHOT_TOKEN=...
```

Never commit `.env`, `.env.local`, `.env.vercel.production`, or any `.env*` secret file.

Future archives must exclude `.env*`.

## Local Commands

```bash
npm run dev
npm run build
```

Open:

```text
http://127.0.0.1:5173/dev-preview
```

## Deploy

Use Vercel for the ordinary app and rare real-phone control checks.

Before deployment, verify the current session tools:

```bash
git status
npm run build
vercel --version
```

CLI access is usually present, but check before using it and then use the available tools.

Deployment details: `docs/PROJECT_OPERATIONS.md`.

## What To Read Next

- Architecture/data flow: `docs/ARCHITECTURE.md`
- Daily commands/deploy/env: `docs/PROJECT_OPERATIONS.md`
- Plateau logic: `docs/PLATEAU_MODE.md`
- Design tokens/current UI: `docs/CURRENT_DESIGN_SYSTEM.md`
- Roadmap only: `docs/ROADMAP.md`
- Skills rules: `docs/SKILLS_GUIDE.md`
- Domain model only when needed: `knowledge/WEIGHT_LOSS_MODEL.md`
- Coaching behavior only when needed: `knowledge/COACHING_RULES.md`

## Limit-Saving Rules

- Read this file first.
- Then read only the document needed for the current task.
- Use `rg` before opening large files.
- Do not scan the whole project without a reason.
- Do not read all skills.
- Do not read `knowledge/` unless the task touches product logic, coaching, or the weight-loss model.
- Do not deploy unless the user directly asks.
- Do not install or download new skills without a direct user request.

## User Communication Rule

The user prefers very short, practical answers.

When handing off to another Codex branch, give ready-to-run prompts and concrete next actions. Do not over-explain architecture unless the task is architectural.
