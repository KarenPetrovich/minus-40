# Architecture

## Current Reality

The current codebase is a compact frontend-only Telegram Mini App.

There is no backend yet.
The real architecture is intentionally small.

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
    telegram/
      webapp.ts
  styles/
    index.css
  ui/
    AppUI.tsx
    motion.ts
```

## Actual Architectural Layers

### `src/core`

Responsibilities:

- app state shape;
- storage;
- state mutations;
- derived progress calculations.

### `src/features/telegram`

Responsibilities:

- Telegram Web App integration;
- platform-specific initialization and haptics/runtime helpers.

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

1. `storage.ts` loads persisted app state from `localStorage`
2. `store.ts` keeps in-memory state and emits updates
3. `App.tsx` subscribes via `useSyncExternalStore`
4. `AppUI.tsx` renders screens from the store snapshot
5. UI actions call store methods
6. store writes the updated state back through `storage.ts`

## Current Contradictions Removed

The repo previously suggested a bigger feature-folder architecture than the app actually uses.

That was misleading.

Current rule:

- do not keep empty structural placeholders only for a hypothetical future;
- keep the tree aligned with what is genuinely implemented.

## Intentional Simplicity

At this stage, the simple store is acceptable because:

- there is one user;
- state is small;
- there is no sync layer yet;
- the app is still in MVP scope.

## Next Architectural Pressure Point

The next real architecture decision will happen when we move from local-only storage to cloud sync.

That is the moment to revisit:

- storage abstraction;
- sync conflict handling;
- auth or identity assumptions;
- security/privacy review.
