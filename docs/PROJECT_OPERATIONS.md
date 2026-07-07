# Project Operations

## Start Point

Read `docs/CODEX_START.md` before this file.

This document is for commands, local environment, deployment, and repository hygiene.

## Local Run

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5173/dev-preview
```

Use `/dev-preview` as the first visual workspace for UI work. The normal loop is:

```text
change -> F5 -> evaluate
```

Do not deploy Vercel for `/dev-preview` work unless the user explicitly asks.

## Build

```bash
npm run build
```

Run this after documentation changes requested by the user, shared logic changes, UI changes, env/config changes, or before deploy.

## Dev Preview Data Refresh

`/dev-preview` reads local browser cache first:

```text
minus40.cloud-cache
```

The `Обновить данные` button can use a local dev-only Vite endpoint:

```text
GET /__dev/cloud-snapshot
```

That endpoint assembles a read-only snapshot from:

```text
Supabase app_users + weight_entries + comments
```

Then the app writes:

- `minus40.cloud-cache`;
- `minus40.cloud-meta`.

Rules:

- refresh only by button;
- no polling;
- no auto-refresh;
- no refresh on route render;
- no Supabase writes from dev-preview refresh.

## Local Env

`.env.local` is required only for local dev snapshot refresh.

Expected keys:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DEV_SNAPSHOT_TOKEN=...
```

Safety:

- never print secret values;
- never commit `.env`, `.env.local`, `.env.vercel.production`, or any `.env*` secret file;
- future project archives must exclude `.env*`;
- `.env.example` is allowed because it contains placeholders only.

## CLI Checks

CLI access is usually available in this project, but verify the current session before using a tool:

```bash
git status
gh --version
vercel --version
supabase --version
```

After checking, use the tools that are available. If a tool is missing or unauthenticated, say exactly what is missing and use the next safe path.

## Git Workflow

Before commit or deploy:

```bash
git status
git diff --stat
npm run build
```

Do not commit broad accidental changes. Keep commits scoped to user-approved work.

## Vercel Deploy

Production host:

```text
https://minus-40.vercel.app
```

Deploy only when the user asks.

Recommended preflight:

```bash
git status
npm run build
vercel --version
```

If GitHub/Vercel integration is expected, verify instead of assuming it. If CLI deploy is needed, use the project's current Vercel setup and report the published URL and commit hash.

After deploy, verify:

- production URL loads;
- ordinary app opens, not dev-preview;
- core screens render;
- no build or publish errors;
- Telegram Mini App URL still points to the intended production URL.

## Repository Hygiene

Keep the project root clean.

Do not keep these in active project folders:

- temporary archives;
- screenshots;
- raw external exports after decisions are integrated;
- logs;
- build output;
- obsolete research dumps.

Archive location for temporary material:

```text
C:\Future\Минус40_архив
```

Never include `node_modules`, `dist`, `.git`, `.vercel`, `.env*`, logs, or screenshots in handoff archives unless the user explicitly asks for one of them.
