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
