# Architecture

## Current Shape

Minus 40 is a compact Telegram Mini App.

The frontend is a static Vite React app. Trusted cloud access lives in Supabase Edge Functions for production Telegram sync, while local Developer Preview uses a dev-only Vite endpoint for read-only snapshot refresh.

## Source Tree

```text
src/
  App.tsx
  main.tsx
  core/
    types.ts
    storage.ts
    store.ts
    progress.ts
  features/
    sync/
      cloud.ts
    telegram/
      webapp.ts
  lib/
    supabase/
      client.ts
  styles/
    index.css
    developer-preview.css
  ui/
    AppUI.tsx
    AppNav.tsx
    GoalsScreen.tsx
    DeveloperPreviewPage.tsx
supabase/
  functions/
    telegram-sync/
  migrations/
  docs/
```

## Runtime Layers

- `src/core/types.ts`: app state shape.
- `src/core/storage.ts`: local cache, legacy state, cloud snapshot import/export helpers.
- `src/core/store.ts`: in-memory store, mutations, cloud bootstrap, local rehydrate.
- `src/core/progress.ts`: derived calculations, milestones, plateau stage, chart helpers.
- `src/features/telegram/webapp.ts`: Telegram runtime integration and `initData`.
- `src/features/sync/cloud.ts`: client calls to Supabase Edge Function.
- `src/ui/`: production screens and Developer Preview shell.
- `src/styles/`: global app styles and preview-only styles.
- `supabase/functions/telegram-sync`: production trusted sync endpoint.
- `supabase/migrations`: canonical database schema changes.

## Production Data Flow

Production sync uses Telegram identity:

```text
Telegram WebApp initData
-> Supabase Edge Function telegram-sync
-> app_users + weight_entries
-> AppState
-> minus40.cloud-cache
-> React UI
```

The Edge Function validates raw Telegram `initData` server-side before reading or replacing user state.

## Developer Preview Data Flow

Developer Preview uses a local read-only snapshot path:

```text
Supabase app_users + weight_entries
-> assembled snapshot
-> minus40.cloud-cache
-> /dev-preview
```

Important details:

- there is no separate snapshot object/table in Supabase;
- the snapshot is assembled from `app_users` and `weight_entries`;
- `minus40.cloud-cache` is browser `localStorage`;
- `minus40.cloud-meta` stores snapshot metadata such as `lastSyncedAt`;
- `/dev-preview` refreshes Supabase data only when the user presses `Обновить данные`;
- auto-refresh, polling, refresh-on-render, and route-entry refresh are forbidden for `/dev-preview`.

## Local Dev Snapshot Endpoint

During `npm run dev`, Vite can expose:

```text
GET /__dev/cloud-snapshot
```

This endpoint is local-only and requires `.env.local` values:

- `VITE_SUPABASE_URL`;
- `VITE_SUPABASE_PUBLISHABLE_KEY`;
- `SUPABASE_SERVICE_ROLE_KEY`;
- `DEV_SNAPSHOT_TOKEN`.

The service role key must never be exposed in UI, committed to git, or deployed as a public client variable.

If the dev token or service role key is missing, `/dev-preview` falls back to local cache behavior.

## Local Cache Keys

- `minus40.cloud-cache`: current local AppState snapshot.
- `minus40.cloud-meta`: cloud/cache metadata.
- `minus40.app-state`: legacy fallback state.
- `minus40.app-backup`: legacy backup fallback.

Read priority:

```text
minus40.cloud-cache -> legacy app-state/app-backup -> DEFAULT_STATE
```

## Plateau Fields

Current AppState plateau facts:

- `plateauStartedAt`;
- `lastConfirmedMilestone`;
- `plateauStartWeight`.

These are stored facts. Stage, fill count, active milestone, temporarily lost milestone, and Goals statuses are derived in `progress.ts`.

If a live Supabase schema does not yet expose plateau columns, dev snapshot assembly may use `null` fallback values for these fields. The app must still render safely.

## Single UI Tree Rule

Developer Preview must use the same React screens as the ordinary app.

Do not create separate screen implementations for preview unless the user explicitly requests a one-off diagnostic tool.

Allowed preview-specific pieces:

- phone viewport/frame;
- dev buttons outside the phone viewport;
- local-only time/stage controls;
- local-only data refresh controls.

## Deployment Boundary

`/dev-preview` is a local development tool.

Do not treat it as a production page. Do not deploy after preview-only changes unless the user directly asks.

Deployment and CLI checks live in `docs/PROJECT_OPERATIONS.md`.
