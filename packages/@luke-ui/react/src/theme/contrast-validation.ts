/**
 * Runs the build-time WCAG 2.2 validation matrix over a mode's emitted colour values and reports
 * every failing pair. It owns {@link ThemeContrastFailure} because it is what produces failures,
 * which also keeps `build-theme.ts` and its own validation step from importing each other.
 */

import type { Oklch } from './color.js';
import { compositeSourceOver, contrastRatio, parseColor } from './color.js';
import { SEMANTIC_ROLES, TEXT_RATIO, UI_RATIO } from './contrast-policy.js';
import type { ContrastCheck } from './diagnostics.js';
import type { InteractionState } from './interaction-mix.js';
import { INTERACTION_STRENGTH, mixInteractionColor } from './interaction-mix.js';
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

type ColorPath = keyof SemanticColorValues;

/**
 * Runs the semantic validation matrix over the emitted colour values. Hard gates cover functional
 * text, role foregrounds, on-solid pairs, first-party interaction colours, and required non-text
 * boundaries. Advisory checks cover role borders.
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
	const colorAt = (path: ColorPath): Oklch => {
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
		foregroundColor: Oklch,
	) => {
		const ratio = contrastRatio(foregroundColor, backgroundColor);
		const passes = ratio >= required;
		checks.push({ background, foreground, hard, passes, ratio, required });
		if (hard && !passes) failures.push({ background, foreground, mode, ratio, required });
	};
	const check = (foreground: ColorPath, background: ColorPath, required: number, hard: boolean) => {
		checkResolved(foreground, background, colorAt(background), required, hard, colorAt(foreground));
	};

	const surfacePaths = [
		'color.surface.canvas',
		'color.surface.recessed',
		'color.surface.floating',
		'color.surface.overlay',
	] as const satisfies ReadonlyArray<ColorPath>;
	const basePaths = [
		'color.surface.canvas',
		'color.surface.recessed',
	] as const satisfies ReadonlyArray<ColorPath>;

	for (const text of ['color.text.primary', 'color.text.secondary'] as const) {
		for (const surface of surfacePaths) check(text, surface, TEXT_RATIO, true);
	}
	for (const role of SEMANTIC_ROLES) {
		const subtle = `color.background.${role}.subtle` as const;
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
	// Recipes emit CSS through `interactionColor`. Validation uses `mixInteractionColor` for an
	// opaque base and `compositeSourceOver` for a transparent base, so the measured paint matches
	// what the browser actually does. The mix source is the same neutral `text.primary` runtime CSS
	// mixes toward (neutral step 12).
	const checkOpaqueInteraction = (
		foreground: ColorPath,
		state: InteractionState,
		surface: ColorPath,
	) => {
		const mixed = mixInteractionColor(colorAt(surface), interactionSource, state);
		checkResolved(foreground, `${state} on ${surface}`, mixed, TEXT_RATIO, true, colorAt(foreground));
	};
	const checkTransparentInteraction = (
		foreground: ColorPath,
		state: InteractionState,
		surface: ColorPath,
	) => {
		const composited = compositeSourceOver(
			interactionSource,
			colorAt(surface),
			INTERACTION_STRENGTH[state],
		);
		checkResolved(
			foreground,
			`${state} on ${surface}`,
			composited,
			TEXT_RATIO,
			true,
			colorAt(foreground),
		);
	};
	for (const state of INTERACTION_STATES) {
		for (const surface of basePaths) {
			for (const foreground of GHOST_FOREGROUNDS) {
				checkTransparentInteraction(foreground, state, surface);
			}
		}
		for (const tone of BUTTON_TONES) {
			const solidForeground = `color.foreground.${tone}.onSolid` as const;
			const subtleForeground =
				tone === 'neutral' ? 'color.text.primary' : (`color.foreground.${tone}.default` as const);
			checkOpaqueInteraction(solidForeground, state, `color.background.${tone}.solid`);
			checkOpaqueInteraction(subtleForeground, state, `color.background.${tone}.subtle`);
		}
		checkOpaqueInteraction('color.text.primary', state, 'color.background.accent.subtle');
		checkTransparentInteraction('color.text.primary', state, 'color.surface.floating');
		const linkForeground = mixInteractionColor(
			colorAt('color.foreground.accent.default'),
			interactionSource,
			state,
		);
		for (const surface of surfacePaths) {
			checkResolved(
				`${state} of color.foreground.accent.default`,
				surface,
				colorAt(surface),
				TEXT_RATIO,
				true,
				linkForeground,
			);
		}
	}

	return { checks, failures };
}
