/**
 * The accessibility policy the theme layer is built to guarantee, declared once. Every module that
 * solves for or validates contrast reads its thresholds from here rather than restating them: the
 * scale generator's on-solid and foreground-vs-interaction gates (`scale.ts`), the accent
 * pre-conditioner (`define-theme.ts`), and the build-time validation matrix
 * (`contrast-validation.ts`) and `border.control` solver (`control-border.ts`).
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
 * identify a component or state (`border.focus` and `border.control`).
 */
export const UI_RATIO = 3;

/**
 * Headroom every contrast *search* solves past its nominal ratio, so 4-decimal OKLCH emission can
 * never round a passing pair back below the gate. Validation measures the emitted values against the
 * nominal ratio; only the solvers add this.
 */
export const RATIO_HEADROOM = 0.05;

/** The OKLCH lightness increment every contrast search steps by while walking its band. */
export const CONTRAST_SEARCH_STEP = 0.0025;

/**
 * The canonical semantic roles, in contract order. Every role publishes the same visual slots —
 * background, foreground, on-solid, and border — so this one list drives family generation
 * (`scale.ts`), the semantic mapping (`semantic-map.ts`), the validation matrix
 * (`contrast-validation.ts`) and diagnostics (`build-theme.ts`), and the token-board tooling. A
 * role's meaning never decides what it can style, so there is nothing left to split the list on:
 * restating a subset anywhere would reintroduce the asymmetry this module exists to prevent.
 * `FamilyRole` in `scale.ts` is derived from this, so the type cannot drift from the list either.
 *
 * Every role's solid must clear 4.5:1 against on-solid text. The scale generator always searches
 * for that contrast. `contrast-validation.ts` enforces it for all six roles at compile time.
 */
export const SEMANTIC_ROLES = [
	'neutral',
	'accent',
	'info',
	'success',
	'warning',
	'danger',
] as const;
