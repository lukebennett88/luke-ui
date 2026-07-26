/**
 * The accessibility policy the theme layer is built to guarantee, declared once. Every module that
 * solves for or validates contrast reads its thresholds from here rather than restating them: the
 * scale generator's on-solid gate (`scale.ts`), the accent pre-conditioner (`define-theme.ts`), the
 * `border.control` solver (`control-border.ts`), and the build-time validation matrix
 * (`validate-contrast.ts`).
 *
 * The intent role groups live here too, because they decide both which contract leaves the semantic
 * map emits (`semantic-map.ts`) and which pairs the validation matrix gates
 * (`validate-contrast.ts`). Split across the two modules the failure was asymmetric and half silent:
 * adding a role to the map alone emitted an ungated colour, while adding it to the compiler alone threw
 * an internal error. One declaration makes both sides move together.
 *
 * Dependency-free on purpose — it is the leaf both the generator and the compiler import, so it can
 * never close an import cycle.
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
 * Action intents render the full interactive ramp (subtle trio + solid trio + onSolid), so they are
 * the intents whose on-solid text is gated.
 */
export const ACTION_INTENTS = ['neutral', 'accent', 'danger'] as const;

/** Feedback intents are static and expose only the soft kit (subtle surface + border + text). */
export const FEEDBACK_INTENTS = ['info', 'success', 'warning'] as const;

/**
 * Action intents that additionally expose a border and low-contrast text. Neutral does not — its
 * borders and text are the global neutral leaves instead.
 */
export const BORDER_AND_TEXT_INTENTS = ['accent', 'danger'] as const;
