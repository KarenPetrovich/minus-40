## Plateau Mode

The app now uses a cyclical model:

- burst;
- plateau;
- burst;
- plateau;
- ...

## Burst

- goal: reach the target weight;
- main visual mode: orange;
- overall logic stays as close as possible to the current weight-loss flow.

## Route Structure

The route is made of control milestones:

- 150 -> 140 -> 130 -> 120 -> 115 -> 110 -> ...

Each interval between two neighboring milestones is a separate burst.

Examples:

- 150 -> 140 is the first burst;
- 140 -> 130 is the second burst;
- 130 -> 120 is the third burst.

When the next milestone is reached, the current burst ends automatically and the app switches to plateau.

## Main Strategy

The app is based on a predefined weight-loss route.

- the route is fixed in advance;
- each segment between neighboring milestones is one burst;
- when a milestone is reached for the first time, the app records `lastConfirmedMilestone` and `plateauStartedAt` automatically;
- the Overview screen switches to plateau automatically at that moment;
- plateau lasts for a set number of days, currently 7;
- after plateau ends, the next burst starts automatically toward the next milestone;
- the route itself does not roll back when weight fluctuates during plateau.

## Plateau

- starts automatically after the target weight is reached;
- default duration: 7 days;
- plateau is a recommended recovery stage between bursts;
- plateau helps reduce load on the body between extreme loss phases;
- the goal of the app remains completing the whole weight-loss route;
- small weight fluctuations are allowed;
- the stage is considered complete when the 7-day plateau window ends;
- after a plateau ends, the next burst starts automatically;
- the active milestone remains the next route milestone, even if weight temporarily rises above the confirmed milestone during plateau.

## Plateau Overgain Rule

- if the user gains weight during plateau, the route is not rolled back;
- the next stage remains the next milestone on the route;
- no repeat plateau is started on the previous milestone;
- no previous stage is restored;
- the route simply becomes longer on the way to the next milestone.

## Goals Screen Temporary Loss State

- if a previously confirmed milestone becomes temporarily lost during plateau, Goals shows a red lock and a red dashed line for that milestone;
- this is a visual state only;
- the route does not change;
- the next burst still points to the next milestone;
- as soon as the user returns to the confirmed milestone or below it, the normal reached state returns.

## Shared Data Rules

- there is one continuous weight history;
- plateau does not create a separate history;
- plateau measurements remain in the same journal;
- there is one unified graph;
- plateau does not create a second graph;
- the source of truth stays the same, only calculations and visuals change by stage.

## Visual Rules

- burst uses orange accents;
- plateau uses the official `Olive Ochre` palette for active plateau visuals;
- Overview is the only screen that changes substantially by stage;
- Goals remain unchanged and continue showing the long-term route.

## Goals Screen Behavior

- Goals must honestly reflect the current state of reached milestones;
- if a milestone was reached and later temporarily lost during plateau, the route does not change;
- the next burst still points to the next milestone;
- no new plateau starts for the old milestone;
- visually, the previously reached milestone can show a red lock and a dashed red line while the weight is above it;
- as soon as the user returns to the milestone or below it, the lock disappears and the solid line returns;
- this visual state is only a reflection of current milestone status and does not affect the route, plateau order, or overall progress.
