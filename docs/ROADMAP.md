# Roadmap

## Principle

Move in small useful iterations. Do not add future complexity before the current stage genuinely needs it.

## Stage 1: Weight MVP

Goal:

- reliable Telegram Mini App for weight tracking and route control.

Scope:

- add weight entries;
- show Overview;
- show History;
- show Graph;
- show Goals;
- support burst -> plateau -> burst cycle;
- keep Developer Preview aligned with the same UI tree.

Status:

- active.

## Stage 2: Food Logging

Goal:

- capture eating behavior without turning the app into a calorie platform.

Likely scope:

- meal/event logging;
- food photo capture;
- simple categorization.

## Stage 3: AI Food Analysis

Goal:

- reduce manual effort and provide concise structured feedback on food patterns.

Likely scope:

- photo analysis;
- preliminary classification;
- short AI observations.

## Stage 4: Activity Context

Goal:

- add training and activity context around weight dynamics.

Likely scope:

- workout logging;
- activity screenshots/photos;
- simple activity interpretation.

## Stage 5: Factor Analytics

Goal:

- understand which factors most strongly affect progress and regress.

Likely scope:

- cross-analysis of weight, food, and activity;
- pattern detection;
- clearer factor-based insights.

## Future Architecture Candidate

Potential later direction:

- Supabase remains the source of truth;
- local SQLite or similar database becomes a full mirrored working copy;
- the app reads from the local database;
- background sync keeps local data aligned with Supabase;
- Developer Preview reads the same local database.

This is a separate future architecture task, not part of the current Developer Preview work.
