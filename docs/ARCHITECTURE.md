# Architecture

## Current Reality

The current codebase is a compact Telegram Mini App with a lightweight cloud sync layer.

The frontend remains intentionally small.
Trusted server-side logic is expected to live in Supabase Edge Functions rather than in host-specific server runtimes.

## Current Source Tree

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
  ui/
    AppUI.tsx
    motion.ts
supabase/
  functions/
    telegram-sync/
      index.ts
  migrations/
  docs/
```

Local generated database mirror:

- `C:\Future\Минус40_архив\database\minus-40`

## Actual Architectural Layers

### `src/core`

Responsibilities:

- app state shape;
- legacy/cache storage;
- state mutations and cloud bootstrap;
- derived progress calculations.

### `src/features/sync`

Responsibilities:

- frontend calls to Supabase Edge Functions;
- bootstrap and replace-state cloud sync requests.

### `src/features/telegram`

Responsibilities:

- Telegram Web App integration;
- platform-specific initialization, raw `initData`, and haptics/runtime helpers.

### `src/lib/supabase`

Responsibilities:

- host-agnostic Supabase client setup from environment variables.

### `supabase/`

Responsibilities:

- canonical SQL migrations;
- trusted Telegram-validated Edge Function logic;
- generated database reference artifacts mirrored into `C:\Future\Минус40_архив\database\minus-40`.

### `src/ui`

Responsibilities:

- app screens;
- component composition;
- UI motion helpers.

### `src/styles`

Responsibilities:

- global styling;
- design tokens implemented in CSS;
- card, nav, typography, and state styling.

## State Flow

1. `storage.ts` loads cached cloud state or legacy local state
2. `store.ts` boots the in-memory state and tries cloud bootstrap
3. `App.tsx` subscribes via `useSyncExternalStore`
4. `AppUI.tsx` renders screens from the store snapshot
5. UI actions call store methods
6. store writes cache locally and queues canonical state replacement through Supabase Edge Functions
7. Supabase Edge Functions validate Telegram `initData` and persist the state in Postgres

## Current Contradictions Removed

The repo should not suggest a bigger feature-folder architecture than the app actually uses.

Current rule:

- do not keep empty structural placeholders only for a hypothetical future;
- keep the tree aligned with what is genuinely implemented.

## Intentional Simplicity

At this stage, the simple store is acceptable because:

- there is one user;
- state is small;
- sync is snapshot-based rather than realtime;
- the app is still in MVP scope.

## Next Architectural Pressure Point

The next real architecture decision will happen after the secure cloud-sync baseline is stable.

That is the moment to revisit:

- realtime subscriptions vs periodic refresh;
- conflict handling beyond cloud-wins bootstrap;
- optional direct user-scoped tokens vs Edge Function mediation;
- security/privacy review.
