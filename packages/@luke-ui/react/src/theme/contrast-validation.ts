/**
 * Runs the build-time WCAG 2.2 validation matrix over a mode's emitted colour values and reports
 * every failing pair. It owns {@link ThemeContrastFailure} because it is what produces failures,
 * which also keeps `build-theme.ts` and its own validation step from importing each other.
 */

import type { Oklch } from './color.js';
import { compositeOver, contrastRatio, parseColorWithAlpha } from './color.js';
import { SEMANTIC_ROLES, TEXT_RATIO, UI_RATIO } from './contrast-policy.js';
import type { ContrastCheck } from './diagnostics.js';
import type { SemanticColorValues } from './semantic-map.js';

type ColorMode = 'light' | 'dark';

/** One WCAG contrast failure recorded while generating a theme. */
export interface ThemeContrastFailure {
	/** Token path of the background colour, for example `color.surface.overlay`. */
	background: string;
	/** Token path of the foreground colour, for example `color.text.primary`. */
	foreground: string;
	/** The colour mode the pair was generated for. */
	mode: 'light' | 'dark';
	/** The contrast ratio of the emitted, rounded, gamut-mapped colours. */
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
 * Runs the validation matrix over the emitted (rounded) colour values. Every pair is recorded as a
 * {@link ContrastCheck}; failing hard pairs populate `failures`, which `compileTheme` throws.
 *
 * Content and controls can sit on any of the four surfaces, so every surface gate covers all four.
 * Hard at 4.5:1: primary and secondary text and each role's rest, hover, and pressed foreground
 * against all four surfaces and every role's subtle fills. Both on-solid hierarchy leaves are gated
 * against their role's solid fills.
 * Hard at 3:1: the focus ring, the control border and its hover, and `danger.solid.rest`, the
 * invalid control boundary. Only danger is gated as a boundary: the other roles' solid fills are
 * solved for on-solid text and `warning` lands well under 3:1 in light mode.
 *
 * Role borders are decorative tints, measured but not gated, so a component must never rely on one
 * alone for a required state.
 *
 * Subtle fills are translucent. Until the composited matrix lands
 * ([#916](https://github.com/lukebennett88/luke-ui/issues/916)), each one is measured as it paints
 * over `surface.base`, the surface its alpha was fitted against. The other three surfaces, stacked
 * fills, and fills over solids are not checked yet.
 */
export function validateContrast(
	mode: ColorMode,
	colorValues: SemanticColorValues,
): ValidationResult {
	const failures: Array<ThemeContrastFailure> = [];
	const checks: Array<ContrastCheck> = [];
	const parsedAt = (path: ColorPath) => {
		const value = colorValues[path];
		if (value === undefined) throw new Error(`buildTheme did not generate "${path}"`);
		return parseColorWithAlpha(value);
	};
	const base = parsedAt('color.surface.base').color;
	const colorAt = (path: ColorPath): Oklch => {
		const { alpha, color } = parsedAt(path);
		return alpha < 1 ? compositeOver(base, color, alpha) : color;
	};
	function check(foreground: ColorPath, background: ColorPath, required: number, hard: boolean) {
		const ratio = contrastRatio(colorAt(foreground), colorAt(background));
		const passes = ratio >= required;
		checks.push({ background, foreground, hard, passes, ratio, required });
		if (hard && !passes) failures.push({ background, foreground, mode, ratio, required });
	}

	const surfacePaths = [
		'color.surface.base',
		'color.surface.subdued',
		'color.surface.field',
		'color.surface.overlay',
	] as const satisfies ReadonlyArray<ColorPath>;

	const subtleBackgrounds = SEMANTIC_ROLES.flatMap((role) => {
		return (['rest', 'hover', 'pressed'] as const).map((state) => {
			return `color.background.${role}.subtle.${state}` as const;
		});
	});
	const textBackgrounds = [...surfacePaths, ...subtleBackgrounds];
	for (const text of ['color.text.primary', 'color.text.secondary'] as const) {
		for (const background of textBackgrounds) check(text, background, TEXT_RATIO, true);
	}
	for (const role of SEMANTIC_ROLES) {
		for (const state of ['rest', 'hover', 'pressed'] as const) {
			for (const background of textBackgrounds) {
				check(`color.foreground.${role}.${state}`, background, TEXT_RATIO, true);
			}
			for (const hierarchy of ['primary', 'secondary'] as const) {
				check(
					`color.foreground.${role}.onSolid.${hierarchy}`,
					`color.background.${role}.solid.${state}`,
					TEXT_RATIO,
					true,
				);
			}
		}
	}
	const boundaries = [
		'color.border.focus',
		'color.border.control',
		'color.border.controlHover',
		'color.background.danger.solid.rest',
	] as const satisfies ReadonlyArray<ColorPath>;
	for (const boundary of boundaries) {
		for (const surface of surfacePaths) check(boundary, surface, UI_RATIO, true);
	}
	for (const role of SEMANTIC_ROLES) {
		for (const surface of surfacePaths) check(`color.border.${role}`, surface, UI_RATIO, false);
	}

	return { checks, failures };
}
