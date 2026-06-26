# Project Operations

## Purpose

This is the main operational document for day-to-day work.

If the goal is to quickly understand:

- what stage the project is in;
- what we are doing right now;
- how deployment works;
- what is intentionally postponed;
- how to keep the repository clean;

start here.

## Current Stage

- Active roadmap stage: Stage 1
- Product scope: MVP for weight tracking inside Telegram Mini App
- Current implementation: local-only app with `localStorage`

## Current Focus

As of June 25, 2026, the active focus is:

1. audit of existing screens and navigation;
2. design polishing of the current MVP;
3. navigation/icon redesign and premium bottom-nav refinement;
4. keeping the product visually coherent before expanding functionality.

## Working Efficiency Rules

These rules exist to reduce unnecessary token use, iteration churn, and avoidable context rebuilding during sessions.

### Read And Search Discipline

- do not read large files end-to-end if only one block is needed;
- start with targeted search, then open only the relevant fragment;
- do not re-read large skills or long docs inside the same task if the needed context is already gathered.

### UI Iteration Discipline

- for small visual refinements, prefer one bundled pass of 2-3 related changes instead of one micro-change at a time;
- before visual polishing, explicitly define the success criteria in 1-2 short sentences;
- do not expand a narrow visual fix into broader redesign work unless it clearly helps the stated goal.

### Verification Discipline

- do not run a full production build after every tiny CSS-only tweak if reload plus visual check is enough;
- do not take a fresh screenshot for every hypothesis;
- first make a thoughtful pass, then take a verification screenshot;
- use full build and heavier verification when the change affects behavior, assets, structure, or release confidence.

## Explicitly Deferred

These items are important, but are not the current implementation focus:

1. free cloud sync between devices;
2. final logo selection and replacement of the temporary square-in-square mark;
3. broader architecture expansion beyond the current MVP needs.

## Current Product State

Already working:

- adding weight entries;
- storing entries locally;
- overview screen;
- history screen;
- graph screen;
- goals/settings screen;
- Telegram Web App initialization;
- mobile launch path through Netlify + Telegram.

## Deployment Workflow

- Primary deployment is now Vercel.
- Backup deployment remains Netlify, but day-to-day release verification should use Vercel Deployments first.
- Normal deploy path: `git push origin main`
- Vercel should auto-build from GitHub on each push to `main`.
- This project is a Vite SPA, so `vercel.json` keeps all routes rewritten to `index.html`.
- If Telegram shows an old version, first verify the latest Vercel deployment status before checking any backup host.

## Repository Hygiene Rule

Temporary and obsolete files must not stay in the main project root.

Archive location:

- `C:\Future\Минус40_архив`

Move there:

- temporary screenshots;
- logs;
- raw external exports not used as the current source of truth;
- imported design/export folders after their decisions are integrated into code;
- generated artifacts that can be rebuilt;
- obsolete project documents that were replaced by newer canonical docs.

## Source Of Truth Priority

If there is a conflict, use this order:

1. current user instructions;
2. `docs/DECISION_LOG.md`;
3. `docs/PROJECT_CONTEXT.md`;
4. `docs/PROJECT_OPERATIONS.md`;
5. `docs/CURRENT_DESIGN_SYSTEM.md`;
6. `docs/SKILLS_GUIDE.md`;
7. `docs/ROADMAP.md`.

## Read Order For New Sessions

1. `docs/PROJECT_MAP.md`
2. `docs/PROJECT_OPERATIONS.md`
3. `docs/PROJECT_CONTEXT.md`
4. `docs/CURRENT_DESIGN_SYSTEM.md`
5. `docs/SKILLS_GUIDE.md`

When starting work, treat the efficiency rules in this file as active default operating rules, not optional advice.

## Cleanup Trigger

When the user says "проведи чистку", it means:

1. move temporary and obsolete files out of the project root and active folders into `C:\Future\Минус40_архив`;
2. check whether active documents still reflect reality;
3. reduce duplicate sources of truth;
4. leave only live project files in `C:\Future\Минус 40`.
