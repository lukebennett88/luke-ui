/**
 * The build-time WCAG 2.2 validation matrix. It measures the emitted (rounded) colour values a mode
 * resolved to, records every pair it checked as a {@link ContrastCheck}, and reports the hard-gate
 * misses `build-theme.ts` raises as a `ThemeContrastError`.
 *
 * It reads its thresholds and intent role groups from `contrast-policy.ts`, the same declarations the
 * generator solves against and the semantic map emits from, so a role can never be emitted without
 * being gated here. It shares nothing with the stylesheet writer but the value map it measures, and it
 * runs on values only — it never generates or adjusts a colour.
 */

import type { Oklch } from './color.js';
import { contrastRatio, parseColor } from './color.js';
import {
	ACTION_INTENTS,
	BORDER_AND_TEXT_INTENTS,
	FEEDBACK_INTENTS,
	TEXT_RATIO,
	UI_RATIO,
} from './contrast-policy.js';
import type { ContrastCheck } from './diagnostics.js';
import type { SemanticColorValues } from './semantic-map.js';

type ColorMode = 'light' | 'dark';

/** One WCAG contrast failure recorded while generating a theme. */
export interface ThemeContrastFailure {
	/** The colour mode the pair was generated for. */
	mode: 'light' | 'dark';
	/** Token path of the foreground colour, for example `color.text.primary`. */
	foreground: string;
	/** Token path of the background colour, for example `color.surface.floating`. */
	background: string;
	/** The contrast ratio achieved by the best attempt. */
	ratio: number;
	/** The WCAG 2.2 AA ratio the pair must reach. */
	required: number;
}

interface ValidationResult {
	failures: Array<ThemeContrastFailure>;
	checks: Array<ContrastCheck>;
}

/**
 * Runs the full semantic validation matrix over the emitted (rounded) colour values. Every pair is
 * recorded as a {@link ContrastCheck}; the AA text/on-solid pairs, the authored focus ring, and
 * `border.control` are hard gates that populate `failures` (which `compileTheme` raises as a
 * `ThemeContrastError`). `border.control` is `solveControlBorder`'s dedicated boundary, not a
 * scale-step alias, so it is hard-gated at 3:1 against both base surfaces (Stage 6 Option B). The
 * generated neutral/intent borders (decorative and the per-intent border) still map to the
 * Radix-style step 6/7 (a subtle separator) and stay advisory checks only — v2 deliberately keeps
 * those below the old solver's 3:1 for the reference scale's softer look.
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
		// `hard` is recorded on the check itself, so tooling reads the compiler's own decision instead of
		// re-deriving it from token paths.
		checks.push({ background, foreground, hard, passes, ratio, required });
		if (hard && !passes) failures.push({ background, foreground, mode, ratio, required });
	};

	// v2 validates only against surfaces consumers can reference (the hidden `resting` rung is gone).
	const surfacePaths = ['canvas', 'recessed', 'floating', 'overlay'].map(
		(surface) => `color.surface.${surface}`,
	);
	const basePaths = ['color.surface.canvas', 'color.surface.recessed'];
	const actionTextBackgrounds = (intent: string) => [
		...basePaths,
		`color.intent.${intent}.surface.subtle`,
		`color.intent.${intent}.surface.subtleHover`,
		`color.intent.${intent}.surface.subtlePressed`,
	];
	const feedbackTextBackgrounds = (intent: string) => [
		...basePaths,
		`color.intent.${intent}.surface.subtle`,
	];

	// Global text vs every mapped elevation surface, plus the neutral subtle trio behind neutral
	// controls and the neutral/gray badge (carried from #137/#139).
	for (const text of ['color.text.primary', 'color.text.secondary']) {
		for (const surface of surfacePaths) check(text, surface, TEXT_RATIO, true);
	}
	for (const state of ['subtle', 'subtleHover', 'subtlePressed']) {
		check('color.text.primary', `color.intent.neutral.surface.${state}`, TEXT_RATIO, true);
	}
	// Accent/danger text (and accent textHover) vs the base surfaces and their own subtle trio.
	for (const intent of BORDER_AND_TEXT_INTENTS) {
		for (const background of actionTextBackgrounds(intent)) {
			check(`color.intent.${intent}.text`, background, TEXT_RATIO, true);
		}
	}
	for (const background of actionTextBackgrounds('accent')) {
		check('color.intent.accent.textHover', background, TEXT_RATIO, true);
	}
	// Feedback text vs the base surfaces and its single subtle surface.
	for (const intent of FEEDBACK_INTENTS) {
		for (const background of feedbackTextBackgrounds(intent)) {
			check(`color.intent.${intent}.text`, background, TEXT_RATIO, true);
		}
	}
	// On-solid text vs the solid ladder — the scale generator already guarantees this for the action
	// intents; revalidated here on the emitted values.
	for (const intent of ACTION_INTENTS) {
		for (const state of ['solid', 'solidHover', 'solidPressed']) {
			check(
				`color.intent.${intent}.onSolid`,
				`color.intent.${intent}.surface.${state}`,
				TEXT_RATIO,
				true,
			);
		}
	}
	// The keyboard-focus ring is authored and focus-visibility critical, so it stays a hard 3:1 gate.
	for (const background of basePaths) check('color.border.focus', background, UI_RATIO, true);
	// border.control is a solved contrast boundary (Stage 6 Option B): hard-gated at 3:1 against both
	// base surfaces in both modes. Decorative and intent borders (step 6/7) stay advisory Radix-style
	// separators below 3:1.
	for (const background of basePaths) check('color.border.control', background, UI_RATIO, true);
	for (const intent of [...BORDER_AND_TEXT_INTENTS, ...FEEDBACK_INTENTS]) {
		for (const background of basePaths) {
			check(`color.intent.${intent}.border`, background, UI_RATIO, false);
		}
	}

	return { checks, failures };
}
