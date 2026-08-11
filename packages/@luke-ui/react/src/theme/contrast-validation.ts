/**
 * Runs the build-time WCAG 2.2 validation matrix over a mode's emitted colour values and reports
 * every failing pair. It owns {@link ThemeContrastFailure} because it is what produces failures,
 * which also keeps `build-theme.ts` and its own validation step from importing each other.
 */

import type { Oklch } from './color.js';
import { contrastRatio, parseColor } from './color.js';
import { SEMANTIC_ROLES, TEXT_RATIO, UI_RATIO } from './contrast-policy.js';
import type { ContrastCheck } from './diagnostics.js';
import type { SemanticColorValues } from './semantic-map.js';

type ColorMode = 'light' | 'dark';

/** One WCAG contrast failure recorded while generating a theme. */
export interface ThemeContrastFailure {
	/** Token path of the background colour, for example `color.surface.floating`. */
	background: string;
	/** Token path of the foreground colour, for example `color.text.primary`. */
	foreground: string;
	/** The colour mode the pair was generated for. */
	mode: 'light' | 'dark';
	/** The contrast ratio achieved by the best attempt. */
	ratio: number;
	/** The WCAG 2.2 AA ratio the pair must reach. */
	required: number;
}

interface ValidationResult {
	checks: Array<ContrastCheck>;
	failures: Array<ThemeContrastFailure>;
}

/**
 * Runs the full semantic validation matrix over the emitted (rounded) colour values: 92 hard checks
 * and 12 advisory checks per mode. Every pair is recorded as a {@link ContrastCheck}, and the hard
 * ones populate `failures` (which `compileTheme` raises as a
 * {@link import('./build-theme.js').ThemeContrastError}).
 *
 * Hard at the AA text ratio: functional primary and secondary text against all four elevation
 * surfaces; every role's resting and hover foreground against the base surfaces and that role's own
 * subtle ramp; and every role's on-solid foreground against its solid ramp. Hard at the non-text
 * ratio: the authored focus ring and `border.control`, which is `control-border.ts`'s solved
 * boundary rather than a scale-step alias; and `danger.solid.rest` against the base surfaces,
 * because it is the only role fill that carries a required state's boundary (the invalid field
 * boundary). This last gate is deliberately not extended to the other five roles: a role's solid
 * anchor is solved for 4.5:1 on-solid text, not for 3:1 against the surface behind it, and for
 * `warning` that lands at only 2.43:1 against canvas in light mode.
 *
 * The six semantic borders alias step 7 of the 12-step scale, a subtle separator that deliberately
 * sits below the non-text ratio for a softer look, so they are advisory only — which is why a
 * component must never let one be the sole cue for a required state. `color.border.decorative`,
 * `color.text.disabled`, and `color.loadingSkeleton` keep their own separate policies and are not
 * measured here.
 */
export function validateContrast(
	mode: ColorMode,
	colorValues: SemanticColorValues,
): ValidationResult {
	const failures: Array<ThemeContrastFailure> = [];
	const checks: Array<ContrastCheck> = [];
	const colorAt = (path: string): Oklch => {
		const value = colorValues[path];
		if (value === undefined) throw new Error(`buildTheme did not generate "${path}"`);
		return parseColor(value);
	};
	const check = (foreground: string, background: string, required: number, hard: boolean) => {
		const ratio = contrastRatio(colorAt(foreground), colorAt(background));
		const passes = ratio >= required;
		// `hard` is recorded on the check itself, so tooling reads the compiler's own decision rather
		// than re-deriving it from token paths.
		checks.push({ background, foreground, hard, passes, ratio, required });
		if (hard && !passes) failures.push({ background, foreground, mode, ratio, required });
	};

	// v2 validates only against surfaces consumers can reference (the hidden `resting` rung is gone).
	const surfacePaths = ['canvas', 'recessed', 'floating', 'overlay'].map(
		(surface) => `color.surface.${surface}`,
	);
	const basePaths = ['color.surface.canvas', 'color.surface.recessed'];

	// Functional text vs every mapped elevation surface: 8 checks.
	for (const text of ['color.text.primary', 'color.text.secondary']) {
		for (const surface of surfacePaths) check(text, surface, TEXT_RATIO, true);
	}
	// Per role: both foregrounds vs the base surfaces and that role's own subtle ramp (60 checks), and
	// the on-solid foreground vs its solid ramp (18). The scale generator already guarantees on-solid;
	// this revalidates it on the emitted, rounded values.
	for (const role of SEMANTIC_ROLES) {
		const subtleBackgrounds = ['rest', 'hover', 'pressed'].map(
			(state) => `color.background.${role}.subtle.${state}`,
		);
		for (const state of ['rest', 'hover']) {
			for (const background of [...basePaths, ...subtleBackgrounds]) {
				check(`color.foreground.${role}.${state}`, background, TEXT_RATIO, true);
			}
		}
		for (const state of ['rest', 'hover', 'pressed']) {
			check(
				`color.foreground.${role}.onSolid`,
				`color.background.${role}.solid.${state}`,
				TEXT_RATIO,
				true,
			);
		}
	}
	// The keyboard-focus ring is authored and focus-visibility critical, so it stays a hard 3:1 gate,
	// and `border.control` is a solved boundary held to the same ratio: 4 checks.
	for (const background of basePaths) check('color.border.focus', background, UI_RATIO, true);
	for (const background of basePaths) check('color.border.control', background, UI_RATIO, true);
	// `danger.solid.rest` vs the base surfaces: 2 checks. It is the only role fill that carries a
	// required state's boundary (the invalid field boundary), so it is held to the same hard
	// non-text ratio as the focus ring and `border.control`. This is deliberately NOT a per-role
	// loop: a role's solid anchor is solved for 4.5:1 on-solid text, not for 3:1 against the surface
	// behind it, and for `warning` that lands at only 2.43:1 against canvas in light mode. Extending
	// this gate to the other five roles throws `ThemeContrastError` on the bundled themes.
	for (const background of basePaths)
		check('color.background.danger.solid.rest', background, UI_RATIO, true);
	// The six semantic borders, measured and reported but not gated: 12 advisory checks.
	for (const role of SEMANTIC_ROLES) {
		for (const background of basePaths) {
			check(`color.border.${role}`, background, UI_RATIO, false);
		}
	}

	return { checks, failures };
}
