/**
 * Runs the build-time WCAG 2.2 validation matrix over a mode's emitted colour values and reports
 * every failing pair. It owns {@link ThemeContrastFailure} because it is what produces failures,
 * which also keeps `build-theme.ts` and its own validation step from importing each other.
 */

import type { Oklch } from './color.js';
import { contrastRatio, parseColor } from './color.js';
import { SEMANTIC_ROLES, TEXT_RATIO, UI_RATIO } from './contrast-policy.js';
import type { ContrastCheck } from './diagnostics.js';
import type { FocusOrigin } from './foundation.js';
import type { SemanticColorValues } from './semantic-map.js';

type ColorMode = 'light' | 'dark';

/** One WCAG contrast failure recorded while generating a theme. */
export interface ThemeContrastFailure {
	/** Token path of the background colour, for example `color.background.surface.raised`. */
	background: string;
	/** Token path of the foreground colour, for example `color.foreground.primary`. */
	foreground: string;
	/** The colour mode the pair was generated for. */
	mode: 'light' | 'dark';
	/** The contrast ratio of the emitted, rounded, gamut-mapped colours. */
	ratio: number;
	/** The WCAG 2.2 AA ratio the pair must reach. */
	required: number;
	/**
	 * Where a failing `color.focus` came from: `authored` for a colour the theme author supplied,
	 * `default` for the curated mode default. Present only on `color.focus` failures.
	 */
	source?: FocusOrigin;
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
 * Content and controls can sit on any of the three surfaces, so every surface gate covers all three.
 * Hard at 4.5:1: primary and secondary text and each role's rest, hover, and pressed foreground
 * against all three surfaces and every role's subtle rest fill. The on-solid colour is gated
 * against its role's solid fills.
 * Hard at 3:1: the focus ring against all three surfaces and every role's subtle fill, `border.control.{rest,hover,pressed}`
 * against all three surfaces and every role's subtle fill, and every role's `border.<role>.strong`
 * against all three surfaces and that role's subtle fill. Solid fills are solved for on-solid text,
 * independently of their contrast against surfaces.
 * Also hard at 3:1: accent on-solid against `accent.solid.rest` and `accent.solid.pressed`.
 * The active dropdown option draws a 2px inset outline in that on-solid colour on those fills, so
 * the outline's adjacent colour is the solid, not the list surface. The existing 4.5:1 on-solid
 * text gates already cover the same pairs; these 3:1 checks name the outline contract explicitly.
 *
 * A `color.focus` failure records whether the colour was authored or the curated default, so the
 * diagnostic can say whether to change the authored value or set `ThemeInput.color.focus`. The
 * compiler never repairs the colour.
 *
 * `border.decorative` is a separator, not checked, so a component must never rely on it alone for a
 * required state.
 */
export function validateContrast(
	mode: ColorMode,
	colorValues: SemanticColorValues,
	focusOrigin: FocusOrigin = 'authored',
): ValidationResult {
	const failures: Array<ThemeContrastFailure> = [];
	const checks: Array<ContrastCheck> = [];
	const colorAt = (path: ColorPath): Oklch => {
		const value = colorValues[path];
		if (value === undefined) throw new Error(`buildTheme did not generate "${path}"`);
		return parseColor(value);
	};
	function checkValue(
		foreground: string,
		foregroundColor: Oklch,
		background: ColorPath,
		required: number,
		hard: boolean,
	) {
		const ratio = contrastRatio(foregroundColor, colorAt(background));
		const passes = ratio >= required;
		checks.push({ background, foreground, hard, passes, ratio, required });
		if (hard && !passes) {
			failures.push({
				background,
				foreground,
				mode,
				ratio,
				required,
				...(foreground === 'color.focus' ? { source: focusOrigin } : {}),
			});
		}
	}
	function check(foreground: ColorPath, background: ColorPath, required: number, hard: boolean) {
		checkValue(foreground, colorAt(foreground), background, required, hard);
	}

	const surfacePaths = [
		'color.background.surface.base',
		'color.background.surface.subdued',
		'color.background.surface.raised',
	] as const satisfies ReadonlyArray<ColorPath>;

	const subtleBackgrounds = SEMANTIC_ROLES.map((role) => {
		return `color.background.${role}.subtle` as const;
	});
	const textBackgrounds = [...surfacePaths, ...subtleBackgrounds];
	for (const text of ['color.foreground.primary', 'color.foreground.secondary'] as const) {
		for (const background of textBackgrounds) check(text, background, TEXT_RATIO, true);
	}
	for (const role of SEMANTIC_ROLES) {
		for (const state of ['rest', 'hover', 'pressed'] as const) {
			for (const background of textBackgrounds) {
				check(`color.foreground.${role}.${state}`, background, TEXT_RATIO, true);
			}
			check(
				`color.foreground.${role}.onSolid`,
				`color.background.${role}.solid.${state}`,
				TEXT_RATIO,
				true,
			);
		}
	}
	// The focus ring can be drawn beside any surface or role subtle fill.
	for (const background of textBackgrounds) check('color.focus', background, UI_RATIO, true);
	// Every control border state must read on the three surfaces and every role's subtle fill.
	for (const state of ['rest', 'hover', 'pressed'] as const) {
		for (const background of textBackgrounds) {
			check(`color.border.control.${state}`, background, UI_RATIO, true);
		}
	}
	// Each role's strong border must also read on that role's own subtle fill.
	for (const role of SEMANTIC_ROLES) {
		for (const background of [...surfacePaths, `color.background.${role}.subtle` as const]) {
			check(`color.border.${role}.strong`, background, UI_RATIO, true);
		}
	}
	// The active dropdown option's inset outline uses accent on-solid against the solid fill.
	for (const fill of [
		'color.background.accent.solid.rest',
		'color.background.accent.solid.pressed',
	] as const) {
		check('color.foreground.accent.onSolid', fill, UI_RATIO, true);
	}

	return { checks, failures };
}
