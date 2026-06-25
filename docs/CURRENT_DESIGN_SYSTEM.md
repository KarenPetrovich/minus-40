# Minus 40: Current Design System

## Status

This document describes the actual design system currently implemented in the app as of June 25, 2026.

It replaces older visual notes that are no longer fully accurate.

## Design Direction

- Product type: premium personal weight-tracking mini app
- Emotional tone: calm, precise, supportive, non-medical, non-gamified
- Visual character: clean white cards, deep blue structure, orange progress accents, soft rounded geometry
- UX principle: one strong number per block, minimal clutter, clear hierarchy

## Brand Personality

- Serious but not cold
- Premium but not luxury-for-luxury's-sake
- Encouraging without being childish
- Focused on progress, control, and clarity

## Core Visual Rules

- Use light background as the default canvas
- Use deep blue as the primary structural color
- Use orange only for progress, key positive numeric emphasis, and the main action button
- Prefer soft rounded corners over hard geometric edges
- Keep screens airy, but not wasteful
- Prefer one dominant metric per card
- Avoid visual noise, duplicate labels, and decorative overload

## Color System

### Primary Colors

- Primary blue: `#00328A`
- Accent orange: `#FC820C`
- Warm dark orange for secondary emphasis: `#964900`

### Neutrals

- Main text: `#1A1C1E`
- Secondary text: `#434653`
- Muted text: `#737685`
- Soft muted blue text: `#5F6C89`
- App background: `#F9F9FC`
- Card border light: `#E2E2E5`
- Divider/border medium: `#C3C6D6`
- Progress track: `#E8E8EA`

### Supporting Backgrounds

- Active blue pill / selected support: `#DBE1FF`
- Hover blue tint: `#EDF1FF`
- Forecast card background: `#EEF4FF`
- Forecast border: `#C9D8FF`
- Soft warm milestone background: `#FFDCC6`

### State Colors

- Positive / loss trend / progress line: `#FC820C`
- Weight gain / warning state: `#BA1A1A`
- Critical pale red text support: `#FFDAD6`

### Regression Rule

- Weight gain, regression, and negative weight dynamics must use `#BA1A1A`
- Do not replace this with pink, dusty rose, or softened warning tones
- This red is intentional and should read as a clear negative signal

## Typography

### Primary Typeface

- Font family: `Manrope`
- Weights in use: `400`, `500`, `600`, `700`, `800`

### Typography Principles

- The app uses one type family for consistency and polish
- Large numbers are bold, tight, and compact
- Labels are uppercase, spaced out, and quiet
- Supporting text is lighter and lower-contrast

### Numeric Styling

- Main weight number uses:
  - `font-weight: 700`
  - very tight tracking
  - tabular and lining numerals
  - very large scale
- Main weight color: primary blue
- `кг` is smaller than the number, but visually aligned on the same baseline

### Text Hierarchy

- Eyebrow labels: 10-11px, uppercase, letter-spaced, muted
- Body support text: 14-15px
- Card titles: 16px, bold
- Highlight values: 17-20px for medium emphasis, 48px+ for primary metrics

## Layout System

### Screen Frame

- Max content width: `500px`
- Main horizontal padding: `16px`
- Header is fixed
- Bottom navigation is fixed
- Content scrolls between them

### Spacing Character

- Cards are arranged in a vertical stack
- Default card gap: `14px`
- Interior spacing is generous but compact enough for mobile

## Shape Language

- Large hero card radius: `28px`
- Medium card radius: `24px`
- Standard card radius: `18px`
- FAB radius: `18px`
- Small active icon container radius: `16px`
- Rounded shapes should feel soft and intentional, not bubbly

## Header

### Current Pattern

- Minimal fixed header
- Uses a small blue-tinted brand chip
- No duplicate screen title on the Overview screen

### Current Brand Placeholder

- Temporary mark: square-in-square placeholder
- This is not final branding
- It should remain easy to replace globally later

## Card System

### Hero Card

- White background
- Thin light border
- Large radius
- Used for the current weight and next milestone progress
- Centered composition

### Forecast Card

- Light blue background instead of a heavy blue block
- Blue border
- Deep blue text for key forecast line
- Secondary muted blue support text
- Should feel informative, not dominant

### Total Card

- White background
- Strong blue border
- Main number in orange
- Supporting text in muted blue
- Purpose: highlight cumulative result without overpowering the page

### Generic Data Cards

- White background
- Light neutral border
- Rounded corners
- Minimal decoration

## Components

### Main Weight Metric

- The current weight is the main visual anchor of the Overview screen
- It should remain the largest typography on the page
- The decimal composition must stay clean and readable

### Progress Bar

- Thick rounded capsule track
- Light neutral track
- Orange fill
- Percentage sits on the right in warm dark orange
- Footer line uses "Осталось" plus value aligned as a compact pair

### Floating Action Button

- Bright orange fill
- White plus sign
- Soft shadow
- Rounded square form
- Reserved for adding a new measurement

### Bottom Navigation

- Fixed bottom bar on light blurred background
- Labels are separate text, not part of the icon
- Current implementation uses custom SVG icons with subtle active-state motion
- This navigation is still considered visually provisional and will likely be redesigned

## Motion

### Motion Principles

- Motion should be subtle and purposeful
- No looping decorative animation
- Animation should reinforce state change, not demand attention

### Current Motion Language

- Fade in for screen/dialog transitions
- Slide up for modal surfaces
- Number interpolation for live metric updates
- Soft micro-motion for active navigation icons
- Button press uses slight scale-down and saturation shift

## Tone Of UI Copy

- Short
- Practical
- Calm
- Non-dramatic
- Supportive

Examples of the desired tone:

- "Недостаточно данных за 7 дней"
- "До следующей цели 140,0 кг"
- "Осталось 8,2 кг"

## Data Visualization

- Use orange as the default "good progress" line
- Use red only when the trend indicates weight gain or a negative direction
- Red for regression must be `#BA1A1A`
- Charts should stay simple, readable, and secondary to the main metric

## What Is Final Enough To Reuse

- Overall light premium direction
- Blue + orange color architecture
- Manrope as the app-wide typeface
- Large rounded card language
- Lightened forecast card
- White bordered total card with orange key number
- Main metric hierarchy on the Overview screen

## What Is Still Temporary Or Open

- Final brand logo
- Final icon system for bottom navigation
- Final navigation proportions and spacing
- Whether trend visualization belongs on the main screen
- Long-term behavior and presentation of forecasting

## Practical Rules For New Screens

- Start with a light background and white cards
- Use primary blue for structure and main numbers
- Use orange only where progress or action needs emphasis
- Keep only one visual focal point per card
- Prefer compact supportive text under the main metric
- Avoid duplicate labels and repeated meaning
- Make actions visually obvious, but not loud
- Keep the interface feeling premium, quiet, and controlled

## Prompt Summary For External Design Tools

Use this summary when generating screens or components in tools like Stitch:

> Premium light mobile UI for a personal weight-loss tracker. White rounded cards on a soft off-white background, deep royal blue as the primary structural color, vivid orange as the progress/action accent, Manrope typography, very large clean numeric weight display, soft rounded geometry, minimal clutter, calm and precise tone, supportive but not playful, premium fintech/wellness feel without dark mode.
