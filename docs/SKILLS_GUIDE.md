# Skills Guide

## Rule

Use only skills that are actually present and relevant to the task.

Do not read all skills at session start.

Do not download or install new skills without a direct user request. If an external skill seems useful, explain why first and get confirmation.

## Active Skills

These exist in `Skills/active/` and are relevant to the current project stage.

### `frontend-ui-engineering`

Use for:

- screen layout;
- visual hierarchy;
- spacing and typography;
- mobile UI polish;
- design-system consistency.

### `playwright-interactive`

Use for:

- local browser checks;
- visual verification;
- interaction testing;
- screenshot-based inspection when needed.

### `spec-driven-development`

Use for:

- new feature slices;
- architecture decisions before implementation;
- reducing scope drift;
- turning user requirements into implementation steps.

### `telegram-mini-app`

Use for:

- Telegram Mini App behavior;
- WebApp runtime constraints;
- viewport and safe area behavior;
- Telegram-specific launch and identity issues.

## Standby Skills

These exist in `Skills/standby/`.

- `accessibility`: use for UI audit, readability, forms, contrast, and interaction quality.
- `data-privacy-compliance`: use when cloud data handling, retention, or personal data policy changes.
- `security-best-practices`: use for auth, storage, backend, Edge Function, env, or API security review.
- `security-threat-model`: use when new trust boundaries or sensitive flows are introduced.

## Future Skills

These exist in `Skills/future/`.

- `fitness-nutrition`: keep inactive until food tracking or nutrition analysis becomes active product scope.

## Current Practice

- For ordinary code tasks, read no skill unless the task matches it.
- For UI tasks, prefer `frontend-ui-engineering`; add `playwright-interactive` when visual verification matters.
- For Telegram runtime issues, use `telegram-mini-app`.
- For feature planning, use `spec-driven-development`.
- For security-sensitive changes, use the relevant standby security skill.

## Priority

If instructions conflict, use this order:

1. direct user instruction;
2. `docs/CODEX_START.md`;
3. the task-relevant canonical doc;
4. the matching skill;
5. older decision/history docs.
