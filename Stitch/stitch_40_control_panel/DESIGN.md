---
name: Precision Discipline
colors:
  surface: '#f8f9f9'
  surface-dim: '#d9dada'
  surface-bright: '#f8f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f4'
  surface-container: '#edeeee'
  surface-container-high: '#e7e8e8'
  surface-container-highest: '#e1e3e3'
  on-surface: '#191c1c'
  on-surface-variant: '#434749'
  inverse-surface: '#2e3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#747879'
  outline-variant: '#c3c7c8'
  surface-tint: '#586062'
  primary: '#181f21'
  on-primary: '#ffffff'
  primary-container: '#2d3436'
  on-primary-container: '#959c9f'
  inverse-primary: '#c1c8ca'
  secondary: '#3d6561'
  on-secondary: '#ffffff'
  secondary-container: '#bde8e2'
  on-secondary-container: '#416a65'
  tertiary: '#1b1e1f'
  on-tertiary: '#ffffff'
  tertiary-container: '#303333'
  on-tertiary-container: '#989b9b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde4e6'
  primary-fixed-dim: '#c1c8ca'
  on-primary-fixed: '#161d1f'
  on-primary-fixed-variant: '#41484a'
  secondary-fixed: '#c0ebe5'
  secondary-fixed-dim: '#a4cfc9'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#244d49'
  tertiary-fixed: '#e1e3e3'
  tertiary-fixed-dim: '#c4c7c7'
  on-tertiary-fixed: '#191c1d'
  on-tertiary-fixed-variant: '#444748'
  background: '#f8f9f9'
  on-background: '#191c1c'
  surface-variant: '#e1e3e3'
typography:
  display-weight:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  data-mono:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-padding: 1rem
  stack-gap: 0.75rem
  section-margin: 2rem
  gutter: 1rem
---

## Brand & Style
The design system is built upon the pillars of discipline, privacy, and clinical precision. It rejects the frantic energy of typical fitness apps in favor of a "Utility-First" philosophy. The aesthetic is heavily influenced by **Minimalism** and **Modern Corporate** design, positioning the app as a sophisticated tool for data management rather than a lifestyle blog.

The target audience seeks a calm, judgment-free environment to track metrics. The UI evokes an emotional response of control and stability. Every element is intentional, utilizing heavy whitespace to reduce cognitive load and high-quality typography to ensure that data remains the hero of the experience.

## Colors
The palette is intentionally restrained to maintain a focused, professional atmosphere. 
- **Primary (Deep Charcoal):** Used for primary actions, headers, and key data points to signify authority and grounding.
- **Secondary (Muted Teal):** A "calm progress" color. It is used exclusively for success states, progress bars, and positive trend indicators. It avoids the anxiety of "neon health" greens.
- **Surface & Background:** The system uses a multi-layered off-white approach. The base background is `#F9FAFA`, while internal cards and containers use a slightly more saturated `#F0F2F2` to create subtle depth without relying on heavy shadows.
- **Status Colors:** Use a desaturated amber for warnings and a muted slate for neutral states. Avoid bright red; use the Primary Charcoal for "delete" or "stop" actions to maintain the serious tone.

## Typography
Inter is used across all levels to provide a systematic, utilitarian feel. The hierarchy prioritizes **Weight Values** (Display/Data-Mono) to allow users to scan their progress instantly.
- **Numerical Data:** Use `display-weight` for the current weight and `data-mono` for historical logs.
- **Cyrillic Rendering:** Ensure the `Inter` font-face is loaded with full Cyrillic support, specifically monitoring the "б" and "д" glyphs for clarity at small sizes.
- **Labels:** Use `label-md` in medium-gray (#636E72) for secondary information like "kg", "BMI", or timestamps.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model optimized for the Telegram Mini App environment. 
- **The Container:** Content is housed in a centered container with a maximum width of 480px. 
- **Rhythm:** A strictly linear vertical stack is preferred. Use `stack-gap` for items within a group (e.g., list items) and `section-margin` to separate distinct functional areas (e.g., Progress Chart vs. History Log).
- **Safe Areas:** Adhere to Telegram's top-bar and bottom-button safe areas. Ensure the primary action button is always accessible within the "thumb-zone" at the bottom of the viewport.

## Elevation & Depth
This design system avoids high-elevation shadows to maintain its "tool" aesthetic. 
- **Tonal Layers:** Depth is primarily communicated through color shifts. The main background is the lowest layer, with cards sitting on top in a slightly different neutral shade.
- **Outlines:** Use 1px solid borders in `#E2E8F0` for all container elements. This provides a "blueprint" or "spreadsheet" feel that reinforces the professional nature of the app.
- **Focus States:** When an element is active or focused, use a 2px Primary Charcoal border. Do not use glow effects.

## Shapes
The shape language is "Soft-Geometric." 
- **Base Elements:** Cards, input fields, and buttons use a 0.25rem (`rounded`) corner radius. This creates a modern look that isn't as aggressive as sharp corners, but more professional than pill-shaped buttons.
- **Progress Bars:** These are the only exception, utilizing a 1rem radius to make the "fill" feel fluid and continuous.
- **Interactive Elements:** Use consistent corner radiuses across all form factors to maintain a rigorous structural grid.

## Components
- **Buttons:** Large, full-width blocks with Primary Charcoal fill and white text. Labels should be uppercase for added "tool-like" authority.
- **Data Cards:** Use a white background with a 1px slate border. Place the primary metric (e.g., 85.4 kg) in the top left and the label in the bottom left.
- **Progress Indicators:** A horizontal track in `#F0F2F2` with a fill of Secondary Teal. No percentage text inside the bar; place metrics above the bar for readability.
- **Input Fields:** Clean, underlined or lightly boxed fields with "Inter" as the input font. Use a "unit suffix" (e.g., кг) permanently visible on the right side of the field.
- **List Items:** Minimalist rows with a simple divider line. Use chevron-right icons only if the row is navigable. Text should be high-contrast Primary Charcoal.
- **Charts:** Use simple line graphs with the Secondary Teal color. Avoid area fills under the line; keep the visualization "thin" and precise.