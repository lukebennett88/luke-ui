/**
 * The accessibility policy the theme layer is built to guarantee, declared once. Every module that
 * solves for or validates contrast reads its thresholds from here rather than restating them: the
 * scale generator's on-solid gate (`scale.ts`), the accent pre-conditioner (`define-theme.ts`), and
 * the build-time validation matrix (`contrast-validation.ts`) and `border.control.*` solver
 * (`control-border.ts`). The lightness grid those searches walk lives in `lightness-candidates.ts`.
 *
 * The one semantic role list lives here too, because it decides both which contract leaves the
 * semantic map emits (`semantic-map.ts`) and which pairs the validation matrix gates
 * (`contrast-validation.ts`). While those two sides named roles separately, failures were asymmetric
 * and only partly reported: adding a role to the map alone emitted an ungated colour, and adding it to
 * the compiler alone threw an internal error. Declaring the roles once makes both sides move together.
 *
 * This module has no dependencies. Both the generator and compiler import it, so it cannot close an
 * import cycle.
 */

/** The WCAG 2.2 AA contrast ratio text must clear against the surface behind it. */
export const TEXT_RATIO = 4.5;

/**
 * The WCAG 2.2 SC 1.4.11 contrast ratio a non-text UI boundary must clear when it is required to
 * identify a component or state (`color.focus` and `border.control.*`).
 */
export const UI_RATIO = 3;

/** The percentage of `foreground.primary` mixed into a control border for hover feedback. */
export const CONTROL_BORDER_HOVER_STRENGTH = 0.2;

/** The percentage of `foreground.primary` mixed into a control border for pressed feedback. */
export const CONTROL_BORDER_PRESSED_STRENGTH = 0.4;

/**
 * Headroom every contrast *search* solves past its nominal ratio, so 4-decimal OKLCH emission can
 * never round a passing pair back below the gate. Validation measures the emitted values against the
 * nominal ratio; only the solvers add this.
 */
export const RATIO_HEADROOM = 0.05;

/** The OKLCH lightness increment every contrast search steps by while walking its band. */
export const CONTRAST_SEARCH_STEP = 0.0025;

/*
 * Interaction-state visibility. Two floors apply to every state pair the compiler generates, and
 * both measure fills alone: a `controlFinish` or `shadow` never counts toward them.
 *
 * - Solid fills: every role's `solid.rest`, `solid.hover`, and `solid.pressed` step apart by at
 *   least the floors below (`scale.ts` generates them).
 * - Adaptive interaction tints. One black (light) or white (dark) tint pair per theme mode is
 *   painted as a registered state layer. `interaction-tints.ts` solves its strengths, capped so
 *   every gated foreground stays at {@link TEXT_RATIO} over every surface and subtle rest with the
 *   tint on top. Both floors hold over the three structural surfaces and all six subtle fills.
 */

/** Minimum OKLab ΔE between a resting fill and its hover state. */
export const INTERACTION_HOVER_VISIBILITY = 0.04;

/** Minimum OKLab ΔE between a hover fill and its pressed state. */
export const INTERACTION_HOVER_TO_PRESSED_VISIBILITY = 0.025;

/**
 * The private margin every visibility solver targets above its floor, in OKLab ΔE. It covers the
 * 4-decimal OKLCH rounding the compiler emits and the 8-bit channels a browser paints, so a state
 * pair that clears the nominal floor when solved still clears it on screen. Solvers aim for floor
 * plus this margin. Validation measures emitted values against the nominal floors, so the public
 * thresholds do not change.
 */
export const VISIBILITY_MARGIN = 0.003;

/**
 * The canonical semantic roles, in contract order. Every role publishes the same visual slots —
 * background, foreground, on-solid, and border — so this one list drives family generation
 * (`scale.ts`), the semantic mapping (`semantic-map.ts`), the validation matrix
 * (`contrast-validation.ts`) and diagnostics (`build-theme.ts`), and the token-board tooling. A
 * role's meaning never decides what it can style, so there is nothing left to split the list on:
 * restating a subset anywhere would reintroduce the asymmetry this module exists to prevent.
 * `FamilyRole` in `scale.ts` is derived from this, so the type cannot drift from the list either.
 *
 * Every role's solid rest, hover, and pressed colours must clear 4.5:1 against on-solid text. The
 * scale generator always searches for that contrast. `contrast-validation.ts` enforces it for all
 * six roles at compile time.
 */
export const SEMANTIC_ROLES = [
	'neutral',
	'accent',
	'info',
	'success',
	'warning',
	'danger',
] as const;
