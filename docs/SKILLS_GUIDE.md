# Skills Guide

## Purpose

This document defines which skills are relevant for this project, when they should activate, and how to treat them operationally.

## Automatic Use Rule

If a task clearly falls into the area of an available skill, that skill should be read and used before work starts.

This is not optional for matching tasks.

## Active Skill Set For The Current Stage

### `telegram-mini-app`

Use when the task involves:

- Telegram Web App behavior;
- Mini App platform constraints;
- safe area / Telegram runtime specifics;
- product decisions tightly bound to Telegram UX.

### `spec-driven-development`

Use when the task involves:

- a new feature slice;
- defining scope before coding;
- reducing the risk of drifting beyond the current stage.

### `frontend-ui-engineering`

Use when the task involves:

- screen design changes;
- hierarchy, spacing, readability;
- mobile UI refinement;
- component-level UX polishing.

### `playwright-interactive`

Use when the task involves:

- checking flows in the browser;
- visual verification after UI changes;
- regression checks for the current interface.

## Standby Skills

### `accessibility`

Use when:

- the UI is stabilizing;
- forms, contrast, and readability need audit;
- a major screen pass is happening.

Operational rule:

- for every future UI audit, run an accessibility pass by default;
- treat accessibility as part of UI quality, not as a late optional extra.

### `security-threat-model`

Use when:

- backend or sync architecture is being introduced;
- new trust boundaries appear;
- personal data exposure risks increase.

### `data-privacy-compliance`

Use when:

- cloud sync is being designed;
- retention and privacy choices are being made;
- sensitive user data handling changes.

### `security-best-practices`

Use when:

- API/backend work starts;
- storage/auth/session logic appears;
- the app begins handling more sensitive flows.

## Future Skills

### `fitness-nutrition`

Use only when food tracking or food analysis actually enters implementation.

## Built-In Skills Worth Remembering

These are not project-local files, but they are highly relevant:

### `browser:control-in-app-browser`

Use for browser-based inspection and app verification when local runtime checking matters.

### `visual-test-skill`

Use for repeatable visual verification when UI complexity grows further.

Operational rule:

- when we begin systematic visual regression checking, use `visual-test-skill` as the standard path;
- use it for repeatable screenshot-based checks, not just one-off manual inspection.

### `data-vis` / dedicated data-visualization skill

Rule:

- do not install or activate a separate data-visualization skill yet;
- introduce it only when the graph becomes a truly important product block rather than a secondary screen.

## Priority When Skills Disagree

1. direct user instruction;
2. `docs/DECISION_LOG.md`;
3. `docs/PROJECT_CONTEXT.md`;
4. `docs/PROJECT_OPERATIONS.md`;
5. the skill that most directly matches the current task;
6. broader supporting skills.

## Practical Rule

Do not activate a skill "just in case".
Do activate it when the task clearly belongs to its domain.

## Current Installation State

- `accessibility` is already present in the project skill set
- `visual-test-skill` is already available as a built-in skill in this environment
- separate `data-vis` skill is intentionally deferred
