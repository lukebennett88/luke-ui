/**
 * Runs the build-time WCAG 2.2 validation matrix over a mode's emitted colour values and reports
 * every failing pair.
 */

import type { Oklch } from './color.js';
import { contrastRatio, parseColor } from './color.js';
import { SEMANTIC_ROLES, TEXT_RATIO, UI_RATIO } from './contrast-policy.js';
import type { ContrastCheck } from './diagnostics.js';
import type { InteractionState } from './interaction-mix.js';
import { mixInteractionColor } from './interaction-mix.js';
import type { SemanticColorValues } from './semantic-map.js';

/** Ghost Button and IconButton keep these foregrounds on a transparent rest fill. */
const GHOST_FOREGROUNDS = [
	'color.text.primary',
	'color.foreground.accent.default',
	'color.foreground.danger.default',
] as const;

const BUTTON_TONES = ['neutral', 'accent', 'danger'] as const;

const INTERACTION_STATES = ['hover', 'pressed'] as const satisfies ReadonlyArray<InteractionState>;

type ColorMode = 'light' | 'dark';

/** One WCAG contrast failure recorded while generating a theme. */
export interface ThemeContrastFailure {
	/** Token path of the background colour, or a derived interaction colour on a resting fill. */
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
 * Runs the semantic validation matrix over the emitted colour values. Hard gates cover functional
 * text, role foregrounds, on-solid pairs, first-party interaction colours, and required non-text
 * boundaries. Advisory checks cover role borders.
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
	const checkResolved = (
		foreground: string,
		background: string,
		backgroundColor: Oklch,
		required: number,
		hard: boolean,
	) => {
		const ratio = contrastRatio(colorAt(foreground), backgroundColor);
		const passes = ratio >= required;
		checks.push({ background, foreground, hard, passes, ratio, required });
		if (hard && !passes) failures.push({ background, foreground, mode, ratio, required });
	};
	const check = (foreground: string, background: string, required: number, hard: boolean) => {
		checkResolved(foreground, background, colorAt(background), required, hard);
	};

	const surfacePaths = ['canvas', 'recessed', 'floating'].map(
		(surface) => `color.surface.${surface}`,
	);
	const basePaths = ['color.surface.canvas', 'color.surface.recessed'];

	for (const text of ['color.text.primary', 'color.text.secondary']) {
		for (const surface of surfacePaths) check(text, surface, TEXT_RATIO, true);
	}
	for (const role of SEMANTIC_ROLES) {
		const subtle = `color.background.${role}.subtle`;
		for (const background of [...basePaths, subtle]) {
			check(`color.foreground.${role}.default`, background, TEXT_RATIO, true);
		}
		check(`color.foreground.${role}.onSolid`, `color.background.${role}.solid`, TEXT_RATIO, true);
	}
	for (const background of basePaths) check('color.border.focus', background, UI_RATIO, true);
	for (const background of basePaths) check('color.border.control', background, UI_RATIO, true);
	for (const background of basePaths) {
		check('color.background.danger.solid', background, UI_RATIO, true);
	}
	for (const role of SEMANTIC_ROLES) {
		for (const background of basePaths) {
			check(`color.border.${role}`, background, UI_RATIO, false);
		}
	}

	const interactionSource = colorAt('color.text.primary');
	const checkInteraction = (
		foreground: string,
		state: InteractionState,
		surface: string,
	) => {
		const mixed = mixInteractionColor(colorAt(surface), interactionSource, state);
		checkResolved(foreground, `${state} on ${surface}`, mixed, TEXT_RATIO, true);
	};
	for (const state of INTERACTION_STATES) {
		for (const surface of basePaths) {
			for (const foreground of GHOST_FOREGROUNDS) {
				checkInteraction(foreground, state, surface);
			}
		}
		for (const tone of BUTTON_TONES) {
			const solidForeground = `color.foreground.${tone}.onSolid`;
			const subtleForeground =
				tone === 'neutral' ? 'color.text.primary' : `color.foreground.${tone}.default`;
			checkInteraction(solidForeground, state, `color.background.${tone}.solid`);
			checkInteraction(subtleForeground, state, `color.background.${tone}.subtle`);
		}
		checkInteraction('color.text.primary', state, 'color.background.accent.subtle');
		checkInteraction('color.text.primary', state, 'color.surface.floating');
	}

	return { checks, failures };
}
