# Decision Log

## Purpose

This file records active decisions that should not be rediscovered repeatedly.

Keep it short.
Keep only decisions that still matter.

## Active Decisions

### 2026-06-24 - Product Scope

Decision:

- Minus 40 is a personal product for one user, not a mass-market app.

Why:

- the user context, weight-loss history, and working strategy are already known and specific.

### 2026-06-24 - Core Metric

Decision:

- the main metric of the product is weight.

Why:

- weight is the clearest signal for the actual goal of the project.

### 2026-06-24 - Product Philosophy

Decision:

- the app is not being built as a calorie-counting platform.

Why:

- the user does not need generic diet education;
- the product should support trajectory and discipline, not full nutrition bureaucracy.

### 2026-06-24 - Product Role

Decision:

- the app should function as an external control system.

Why:

- the main need is consistency, visibility, and recovery after drift.

### 2026-06-24 - Delivery Style

Decision:

- development proceeds in small iterations with strict respect for the current stage.

Why:

- this keeps the MVP useful and reduces premature complexity.

### 2026-06-24 - Current Roadmap Entry

Decision:

- implementation starts with Stage 1: weight tracking.

Why:

- it is the shortest path to a useful product and the main metric already lives there.

### 2026-06-24 - Technical Base

Decision:

- the app is built as a Telegram Mini App on React + TypeScript + Vite.

Why:

- this matches the real platform target and keeps the stack small.

### 2026-06-24 - Skills Structure

Decision:

- project-local skills are organized as `active`, `standby`, and `future`.

Why:

- it keeps current helpers separate from later-stage capabilities.

### 2026-06-25 - Current Product Window

Decision:

- the immediate work window is screen audit and design improvement, not cloud sync.

Why:

- the user found real UX issues after entering live data;
- cleaning the current MVP has higher value than expanding architecture right now.

### 2026-06-25 - Logo Handling

Decision:

- the current square-in-square sign is temporary and will be replaced later.

Why:

- branding should be revisited after the screen/navigation audit is complete.

### 2026-06-25 - Regression Color

Decision:

- weight gain / regression uses `#BA1A1A`.

Why:

- it is an intentional negative signal in the design system and should not be softened into pink or muted warning tones.

### 2026-06-25 - Skill Rules

Decision:

- `accessibility` should be used by default in future UI audits;
- `visual-test-skill` becomes the standard path once visual regressions are checked systematically;
- separate `data-vis` skill remains deferred until graphs become a primary product concern.

Why:

- this captures the intended operating model now, before it is forgotten.

### 2026-06-25 - Bottom Navigation Direction

Decision:

- bottom navigation uses custom Stitch-derived icons integrated directly into app code;
- active state should feel premium but restrained, with no cartoon-level motion;
- once such exports are integrated, the raw export folders belong in archive storage, not in the active project tree.

Why:

- navigation is part of the core product identity;
- the app needs a more intentional premium feel without playful over-animation;
- keeping raw imports in the active tree creates noise and weakens repository hygiene.

### 2026-06-25 - Forecast Calendar Asset Naming

Decision:

- the forecast icon asset uses the canonical filename `forecast-calendar.png`;
- the earlier typo `kalandar.png` is incorrect and should not be reused.

Why:

- asset names should stay searchable and unambiguous in the active project tree;
- avoiding spelling drift reduces broken imports and future confusion.

### 2026-06-26 - Deployment Host Priority

Decision:

- Vercel is the primary live deployment host at `https://minus-40.vercel.app`;
- Netlify remains the legacy backup host at `https://adorable-wisp-fb63cf.netlify.app/`.

Why:

- Netlify deployment capacity is currently constrained;
- the project still needs a secondary fallback host recorded for recovery and migration work.

### 2026-06-26 - Goals Screen Reward Area

Decision:

- the free lower space on the `Цели` screen is used for milestone reward art;
- each unlocked milestone from `150 кг` down to `110 кг` maps to its own dedicated image in `src/assets/ui/milestones/`;
- the reward area should stay inside the same card and remain visually supportive rather than dominant.

Why:

- the compact goals layout leaves a natural lower zone for emotional reinforcement;
- that space now reinforces achievement instead of being filled with random UI;
- milestone imagery is part of the motivation layer, but still subordinate to the weight goal itself.

### 2026-06-26 - Cloud Sync Architecture

Decision:

- cloud persistence uses Supabase Postgres plus Supabase Edge Functions;
- frontend hosting must stay static-host compatible and must not depend on Vercel or Netlify server APIs;
- Telegram identity is accepted only after server-side validation of raw `initData` using `TELEGRAM_BOT_TOKEN`.

Why:

- this keeps the project portable across hosts;
- it avoids insecure client-only identity assumptions;
- it centralizes trusted logic next to the database instead of inside a host-specific runtime.

### 2026-06-27 - Production Verification

Decision:

- production builds must include the current Supabase env values before sync verification;
- temporary diagnostics must be removed after verification;
- test data should be deleted after it is no longer needed.

Why:

- the first production bundle missed the Supabase env values;
- temporary diagnostics helped isolate the issue and were then removed;
- keeping test data in the database makes later checks noisier.

### 2026-06-29 - Goals Baseline

Decision:

- the current Goals screen is the accepted baseline;
- the final composition is approved;
- milestone logic is approved;
- the color scheme is approved;
- small technical implementation compromises are acceptable if the visible result stays stable.

Why:

- repeated micro-adjustments did not improve the screen beyond this state;
- locking the baseline prevents endless rework;
- the screen now matches the intended product direction.

### 2026-06-29 - Developer Preview Practice

Decision:

- keep a single production code path for screens;
- use Developer Preview as the local visual workspace;
- do not maintain a second screen implementation only for preview purposes;
- treat `/dev-preview` as a local-only development tool;
- use `http://localhost:5173/dev-preview` as the default working URL;
- follow the local loop `change -> F5 -> evaluate`;
- do not deploy Vercel after `dev-preview` changes unless explicitly requested;
- use screenshots sparingly and only when they really add value.

Why:

- duplicated UI code creates drift between preview and production;
- a single code path keeps the app easier to reason about;
- the main goal is to save time and token budget.

### 2026-06-29 - Future Local Database Direction

Idea to revisit later:

- keep Supabase as the source of truth;
- use a local SQLite database as a full mirrored working copy;
- make the app read from the local database;
- sync in the background to keep local data aligned with Supabase;
- let Developer Preview read the same local database so it always reflects current app state;
- keep this as a separate next-stage architecture task, not part of Developer Preview work.

### 2026-06-29 - Plateau Mode

Decision:

- the product now officially uses a burst -> plateau -> burst cycle.

Why:

- the user wants plateau to be a real phase of the weight journey, not a pause;
- the app should support holding the achieved weight before the next burst;
- history and graph must remain unified so the product does not fragment into multiple data models.

Operational rule:

- one data source;
- one history;
- one graph;
- stage-specific visuals and Overview behavior only.

### 2026-06-29 - Plateau Route Structure

Decision:

- the route is made of control milestones, and each interval between neighboring milestones is a separate burst;
- plateau starts automatically after the next milestone is reached;
- plateau duration defaults to 7 days.

Why:

- this makes the cycle readable and predictable;
- it keeps the product focused on a sequence of controlled phases rather than one vague long-term goal;
- it preserves the single-history / single-graph rule while adding a stage-based strategy.

### 2026-06-29 - Plateau Recovery Behavior

Decision:

- plateau is a recommended recovery stage between bursts, not a separate test;
- if weight rises during plateau, the route is not rolled back;
- the next milestone remains the next milestone on the route;
- temporarily lost milestones are reflected visually only and do not change the route.

Why:

- the product should support recovery between aggressive phases;
- the route must stay stable and never punish the user by resetting progress;
- visual honesty is enough; the route itself should remain forward-moving.
