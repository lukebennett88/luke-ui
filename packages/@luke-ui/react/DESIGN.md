---
name: Luke UI
description: A themable, accessible React component library built on one shared token architecture with two deliberately divergent bundled themes
colors:
  accent: "oklch(0.52 0.0884 200)"
  accent-hover: "oklch(0.47 0.0799 200)"
  accent-on-solid: "oklch(0.985 0 200)"
  neutral-solid: "oklch(0.35 0 0)"
  canvas: "oklch(0.985 0 0)"
  surface-recessed: "oklch(1 0 0)"
  text-primary: "oklch(0.3 0 0)"
  text-secondary: "oklch(0.49 0 0)"
  border-control: "oklch(0.6525 0 0)"
  border-focus: "oklch(0.55 0.17 255)"
  border-accent: "oklch(0.82 0.0583 200)"
  info: "oklch(0.52 0.16 255)"
  success: "oklch(0.5 0.13 150)"
  warning: "oklch(0.72 0.14 75)"
  danger: "oklch(0.52 0.18 27)"
typography:
  "100":
    fontFamily: "'Inter', system-ui, sans-serif"
    fontSize: "12px"
    lineHeight: "16px"
    letterSpacing: "0.0025em"
  "200":
    fontFamily: "'Inter', system-ui, sans-serif"
    fontSize: "14px"
    lineHeight: "20px"
    letterSpacing: "0"
  "300":
    fontFamily: "'Inter', system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
    letterSpacing: "0"
  "600":
    fontFamily: "'Inter', system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "30px"
    letterSpacing: "-0.00625em"
  "900":
    fontFamily: "'Inter', system-ui, sans-serif"
    fontSize: "60px"
    fontWeight: 600
    lineHeight: "60px"
    letterSpacing: "-0.025em"
rounded:
  detail: "4px"
  control: "8px"
  surface: "12px"
  overlay: "16px"
  full: "9999px"
spacing:
  "100": "4px"
  "200": "8px"
  "300": "12px"
  "400": "16px"
  "600": "24px"
  "800": "32px"
  "1000": "40px"
  "1200": "48px"
  "1600": "64px"
components:
  button-solid-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-on-solid}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-solid-accent-hover:
    backgroundColor: "{colors.accent-hover}"
  input-group:
    backgroundColor: "{colors.surface-recessed}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "40px"
---

# Design System: Luke UI

## Overview

**Creative North Star: "Two Materials, One Skeleton"**

Luke UI is a component architecture first and a look second. Everything an app developer touches —
the six semantic color roles, the two-tier border policy, the depth ladder, the type scale, the
radius steps — is fixed, tested, and shared by every theme. What each theme does with that skeleton
is not fixed at all: Tactile and Paper, the two bundled themes, prove the same components can carry
a glossy, pressable, physically-shadowed material or a flat, soft, paper-like one without a single
component file changing. There is no confirmed visual anti-reference and no single "Luke UI look" to
protect — deep themeability is the point. The one thing that doesn't bend is accessibility: contrast
thresholds are enforced at build time regardless of which theme, or which future theme, is active.

**Key Characteristics:**
- One `defineTheme` contract, many valid looks — Tactile and Paper diverge in accent hue, neutral
  chroma, control radius, and shadow character, and any theme a consumer authors is free to diverge
  further.
- Six semantic color roles (`neutral`, `accent`, `info`, `success`, `warning`, `danger`), each
  publishing an identical set of capabilities — no role is a partial citizen.
- A two-tier border policy: hard-gated borders (contrast-solved, ~3:1) for anything that must be
  seen, advisory borders (deliberately sub-3:1) for everything else, enforced by build-time tests.
- Depth (`box-shadow` ladder) and the `actionControlFinish` gradient sheen exist to communicate
  interactive state, not to decorate — they change together, on hover and press.
- No aesthetic property is claimed as a brand constant. Color, radius character, and shadow
  character are all theme-owned and expected to diverge.

## Colors

Six uniform semantic roles plus a small set of functional surface/text/border tokens; every color
value below is theme-owned, and the two bundled themes intentionally disagree on most of them.

### Primary

- **accent** (`oklch(0.52 0.0884 200)` light / `oklch(0.75 0.1 200)` dark in Tactile — a teal;
  `oklch(0.4264 0.0975 247.47)` light / `oklch(0.7 0.11 250)` dark in Paper — a blue): the sole
  brand-carrying role. Drives `background.accent.*`, `foreground.accent.*`, and `border.accent`
  everywhere in the system; there is no separate "brand color" outside this token.

### Neutral

- **canvas / surface** (Tactile: `oklch(0.985 0 0)` light, a slightly chromatic off-white /
  `oklch(0.25 0.015 210)` dark. Paper: `oklch(1 0 0)` light, pure white / `oklch(0.22 0.01 250)`
  dark): the base page/app background each theme's other surfaces are built from.
- **neutral solid** (`oklch(0.35 0 0)` light / `oklch(0.82 0.015 210)` dark in Tactile): the
  achromatic scale used for default (non-tone) solid UI chrome.
- **text.primary / text.secondary / text.disabled**: achromatic in Tactile light
  (`oklch(0.3/0.49/0.735 0 0)`), lightly hue-210-tinted in dark mode to match the canvas tint.

### Feedback roles (info, success, warning, danger)

Each publishes the same background (subtle/solid × rest/hover/pressed), foreground
(rest/hover/onSolid), and border shape as accent and neutral — nothing about a feedback role is
structurally different from the brand role. Tactile uses shared curated defaults for all four; Paper
explicitly overrides light-mode hue for all four (e.g. `danger.solid.rest`: Tactile
`oklch(0.52 0.18 27)`, Paper `oklch(0.5269 0.1889 24.44)`) but falls back to the same shared dark-mode
values Tactile uses when it doesn't override dark — confirming dark-mode feedback colors are shared
infrastructure, not per-theme identity.

### Named Rules

**The Advisory Border Rule.** `border.control`, `border.focus`, and the invalid-field boundary
(aliased to `background.danger.solid.rest`, not `border.danger`) are contrast-solved and hard-gated
at the WCAG non-text minimum (~3:1). The six semantic `border.{role}` tokens plus `border.decorative`
alias scale step 7 — deliberately sub-3:1 (measured ~1.4–2.0:1 across both themes, light and dark) —
advisory only, and must never be the sole cue for a state change.

## Typography

**Body Font:** 'Inter', system-ui, sans-serif (both bundled themes; theme-authorable but neither
overrides it)
**Label/Mono Font:** ui-monospace, 'SFMono-Regular', 'SF Mono', Menlo, Consolas,
'Liberation Mono', monospace

**Character:** A neutral, Capsize-trimmed system-UI scale — the type system carries no per-theme
identity of its own; Tactile and Paper differ in color and material, never in typeface.

### Hierarchy

Nine numbered steps (100–900), not named roles — the scale key is the API. Every step carries its own
Capsize baseline/cap-height trim so line-boxes match the font's visual metrics exactly.

- **900** (600 weight, 60px / 60px, −0.025em): largest available step.
- **800** (600 weight, 35px / 40px, −0.01em): `Heading` level 1.
- **700** (600 weight, 28px / 36px, −0.0075em): `Heading` level 2.
- **600** (600 weight, 24px / 30px, −0.00625em): `Heading` level 3.
- **500** (600 weight, 20px / 28px, −0.005em): `Heading` level 4.
- **400** (600 weight, 18px / 26px, −0.0025em): `Heading` level 5.
- **300** (400 weight, 16px / 24px): `Heading` level 6; also `Text`'s and the document root's default
  body size.
- **200** (400 weight, 14px / 20px): secondary/dense body text.
- **100** (400 weight, 12px / 16px): smallest step (labels, captions).

Four weight roles, independent of size step: `body` 400, `label` 500, `heading` 600, `emphasis` 700.

### Named Rules

**The Un-styled Heading Rule.** The reset sets `font: unset; margin: 0` on every heading element —
browsers contribute zero typographic character. All type character comes from the `Text`/`Heading`
recipe, never from a bare `<h1>`–`<h6>`.

## Layout

`Box` (over `@luke-ui/rainbow-sprinkles`) is the only layout primitive: flex/grid, spacing
(margin/padding/gap on the same 9-step space scale as components: 100/200/300/400/600/800/1000/1200/1600
→ 4/8/12/16/24/32/40/48/64px — note the scale intentionally skips 500/700/900/1100/1300–1500), sizing,
position, and overflow, all responsive across six breakpoints: `xsmall` (default, no media query),
`small` (≥640px), `medium` (≥768px), `large` (≥1024px), `xlarge` (≥1280px), `xxlarge` (≥1536px). `Box`
carries no color, typography, or radius props — those come only from `Text`/recipes, keeping layout
and visual-identity concerns in separate primitives.

Two control heights cover every sized component: `small` 32px, `medium` 40px. Icon sizing is a
separate four-step scale: `xsmall` 16px, `small` 20px, `medium` 24px, `large` 32px.

## Elevation & Depth

Not a flat system — both themes use real, theme-authored shadows, but with opposite character.
`depth` is a five-rung ladder (`recessed`, `resting`, `raised`, `floating`, `overlay`) and
`actionControlFinish` is a paired radial-gradient sheen that layers a "face lighting" effect on top of
`depth` for Button/IconButton appearances.

- **Tactile** (hue 220, blue-grey tint): `resting` and `raised` include a hard `0 Npx 0` offset
  component — a drawn bottom edge — plus a higher-opacity gradient sheen. This is a genuinely
  pressable, tactile material.
- **Paper** (hue 250, neutral tint): blur-only shadows, no offset edge, lower-opacity sheen.
  `recessed` is literally `none` in light mode — no inset shadow at all. This is a flat, soft
  material.

### Shadow Vocabulary

- **recessed**: inset shadow for wells (e.g. `InputGroup`'s background) — absent entirely in Paper
  light mode.
- **resting**: a control's default at-rest elevation (Button default state).
- **raised**: hover elevation (Button hover — paired with `translateY(-1px)`).
- **floating**: elements that sit above page content (menus, popovers).
- **overlay**: modal/dialog-level elevation, the largest blur radius in the ladder.

### Named Rules

**The Depth-as-Feedback Rule.** Every interactive control changes its depth rung on hover and press —
Button moves `resting → raised` (+ `translateY(-1px)`) on hover and `resting → recessed` (+
`translateY(1px)`) on press. The rung change itself is a fixed invariant; only how dramatic it looks
(Tactile's drawn edge vs Paper's soft blur) is theme-owned.

## Shapes

Five radius steps, most shared across themes: `detail` 4px, `control` 8px, `surface` 12px, `overlay`
16px, `full` 9999px. `control` is the one step either bundled theme actually overrides — Tactile keeps
the generated default (8px, rounder), Paper tightens it to 4px (sharper) — and that difference is
itself part of each theme's material character, not an inconsistency to reconcile. Components with a
radius identity independent of theme: `IconButton` always uses `full` (fully circular), `Checkbox`
always uses `detail` (the smallest step, for boxes/tags/badges).

## Components

### Buttons

- **Shape:** `radius.control` (8px Tactile / 4px Paper)
- **Variants:** `appearance` (`solid | subtle | ghost`) × `tone` (`neutral | accent | danger`) ×
  `size` (`small | medium`), plus `isBlock`.
- **Solid:** `background.{tone}.solid.{rest,hover,pressed}` against `foreground.{tone}.onSolid`,
  layered with the `actionControlFinish` gradient sheen.
- **Subtle:** `background.{tone}.subtle.*` against `text.primary` / `foreground.{tone}.rest`.
- **Ghost:** transparent at rest, `foreground.{tone}.rest`; the subtle background ramp only appears
  on hover/press.
- **Hover / Press:** see The Depth-as-Feedback Rule.
- **Focus:** 2px solid `border.focus` outline, 2px offset — shared with every focusable element via
  the global reset, not re-implemented per component.
- **Sizes:** `medium` 40px height / 16px inline padding; `small` 32px / 12px.

### IconButton

Shares Button's appearance/tone/depth system entirely; the only difference is `radius.full` (fully
circular) in place of `radius.control`.

### Checkbox

`radius.detail` (4px) — the smallest radius step in the system, reserved for boxes/tags/badges.

### Inputs / Fields (`Field` + `InputGroup`)

- **Style:** the `InputGroup` "well" owns the visual boundary — `background.surface.recessed`,
  1px `border.control`, `radius.control`, `depth.recessed` — inset by default, the opposite of
  Button's raised-by-default posture.
- **Hover / Focus:** border shifts `border.control → border.accent` on hover and on focus-within,
  plus the shared focus ring.
- **Error:** border recolors to `background.danger.solid.rest` — a hard-gated color, deliberately not
  the advisory `border.danger` token, so an invalid field is never relying on a sub-3:1 border alone.
- **Read-only:** drops the shadow; background falls back to `surface.canvas`, border to
  `border.decorative`.
- **Sizes:** `medium` — `controlSize.medium` height, `font.300`, `space.300` padding. `small` —
  `controlSize.small`, `font.200`, `space.200` padding.
- Field labels use `text.primary` (`text.disabled` when disabled); error messages and the required
  `*` indicator use `foreground.danger.rest`.

## Do's and Don'ts

### Do:

- **Do** keep every new semantic role uniform across all six capabilities (subtle/solid states,
  onSolid, text, border) — the system currently has zero partial roles, and that's load-bearing.
- **Do** route any state that must be seen (invalid, required, disabled) through a hard-gated color
  (`background.*.solid.rest` or `border.control`/`border.focus`), never through an advisory border
  alone.
- **Do** give every new interactive control a depth-ladder change on hover and press, even if a
  theme chooses to render that change subtly.
- **Do** let new themes diverge in accent hue, neutral chroma, control radius, and shadow character —
  that divergence is the design, not drift to reconcile.

### Don't:

- **Don't** invent or protect a single fixed "Luke UI look." Tactile and Paper exist specifically to
  prove there isn't one.
- **Don't** let an advisory border (`border.{role}`, `border.decorative`) be the sole indicator of a
  state change — it's calibrated below the non-text contrast minimum by design.
- **Don't** hand-author component files or hand-edit generated exports/barrels; components come from
  `pnpm generate:component`.
- **Don't** apply the `actionControlFinish` gradient sheen independent of the `depth` shadow on the
  same control — they're a paired face-lighting + physical-depth cue for one state, not two separate
  decorations.
