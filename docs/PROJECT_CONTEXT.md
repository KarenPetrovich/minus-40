# Project Context

## Product

Minus 40 is a personal Telegram Mini App for one user.

Its job is to help maintain a real weight-loss trajectory. It is not a generic health platform, calorie tracker, or broad wellness app.

## Main Goal

- start: about 150 kg;
- target: 110 kg;
- mission: lose the extra 40 kg and stay on track.

## User Context

- male;
- 45 years old;
- height: 183 cm;
- already has prior successful weight-loss experience;
- does not need basic dieting education;
- needs discipline support, continuity, and visible control.

## Product Role

The app should work as:

- an external control system;
- a progress mirror;
- a return-to-track tool after drift.

## Product Boundaries

Current focus is weight tracking and route control.

Lower priority:

- full food logging;
- calorie/macro platform features;
- broad activity analytics;
- large backend-first redesign.

## UX Direction

- mobile-first;
- fast to read;
- emotionally calm;
- premium but not flashy;
- one clear focal metric per block.

## Reference

For current route, Plateau mode, commands, architecture, and read order, start with:

- `docs/CODEX_START.md`

## Current Status

- route `150 -> 140 -> 130 -> 125 -> 120 -> 115 -> 110` is active and stable;
- 125 kg is fully wired into business logic and Goals;
- Plateau mode is active in the current release flow;
- milestone and day comments work in the app;
- comments now sync through cloud and are expected in `/dev-preview` after refresh;
- Supabase `telegram-sync` is aligned with the current frontend state model;
- weekly graph tooltip now shows delta for the first visible point when a previous real entry exists;
- no known open tails remain for route 125, comments sync, or this graph tooltip fix.
