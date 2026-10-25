/**
 * Solves the one adaptive interaction tint pair per colour mode: black in light, white in dark.
 * Alphas target today's opaque subtle hover and pressed over `surface.base`, then cap so every
 * gated foreground stays at AA over every surface, subtle rest, and solid fill with the tint on
 * top. Visibility floors in `contrast-policy.ts` reject a theme that can only pass by making the
 * states invisible. Compositing uses encoded sRGB, matching CSS.
 */

import type { Oklch } from './color.js';
import {
	clampUnit,
	compositeEncodedSrgb,
	contrastRatio,
	formatOklch,
	parseColor,
} from './color.js';
import {
	INTERACTION_HOVER_TO_PRESSED_VISIBILITY,
	INTERACTION_HOVER_VISIBILITY,
	SEMANTIC_ROLES,
	TEXT_RATIO,
} from './contrast-policy.js';
import { interactionTintVarName } from './interaction-tint-vars.js';
import { oklabDeltaE } from './scale.js';
import type { SemanticColorValues } from './semantic-map.js';

type ColorMode = 'light' | 'dark';

/** The solved tint pair for one colour mode, ready to emit as private CSS variables. */
export interface InteractionTintPair {
	/** CSS colour for hover, including alpha. */
	hover: string;
	/** CSS colour for pressed, including alpha. */
	pressed: string;
	/** Hover alpha before CSS formatting. */
	hoverAlpha: number;
	/** Pressed alpha before CSS formatting. */
	pressedAlpha: number;
	/** OKLab ΔE from `surface.base` to the hover composite over it. */
	hoverVisibility: number;
	/** OKLab ΔE from the hover composite to the pressed composite over `surface.base`. */
	hoverToPressedVisibility: number;
}

/** One contrast miss under a candidate tint alpha. */
export interface InteractionTintContrastMiss {
	/** Token path of the background the tint was composited over. */
	background: string;
	/** Token path of the foreground that fell below AA. */
	foreground: string;
	/** Contrast ratio of the foreground over the tinted background. */
	ratio: number;
}

/**
 * Thrown when a theme cannot meet both the 4.5:1 tint contrast cap and the visibility floors. The
 * compiler must not silently weaken interaction feedback until it disappears.
 */
export class ThemeInteractionTintError extends Error {
	readonly mode: ColorMode;
	readonly maxAlpha: number;
	readonly targetHoverAlpha: number;
	readonly targetPressedAlpha: number;
	readonly limitingMiss: InteractionTintContrastMiss | null;

	constructor(input: {
		mode: ColorMode;
		maxAlpha: number;
		targetHoverAlpha: number;
		targetPressedAlpha: number;
		limitingMiss: InteractionTintContrastMiss | null;
		reason: string;
	}) {
		super(
			[
				`Theme interaction tints are unsatisfiable in ${input.mode}: ${input.reason}`,
				`Target hover ${input.targetHoverAlpha.toFixed(3)}, pressed ${input.targetPressedAlpha.toFixed(3)}; contrast cap ${input.maxAlpha.toFixed(3)}.`,
				input.limitingMiss === null
					? null
					: `Limiting pair: ${input.limitingMiss.foreground} on tinted ${input.limitingMiss.background} at ${input.limitingMiss.ratio.toFixed(3)}:1.`,
			]
				.filter((line) => line !== null)
				.join(' '),
		);
		this.name = 'ThemeInteractionTintError';
		this.mode = input.mode;
		this.maxAlpha = input.maxAlpha;
		this.targetHoverAlpha = input.targetHoverAlpha;
		this.targetPressedAlpha = input.targetPressedAlpha;
		this.limitingMiss = input.limitingMiss;
	}
}

const WHITE: Oklch = { l: 1, c: 0, h: 0 };
const BLACK: Oklch = { l: 0, c: 0, h: 0 };
const ALPHA_SEARCH_STEPS = 1000;

/**
 * Solves hover and pressed tint strengths for one mode from its emitted colour values. Throws
 * {@link ThemeInteractionTintError} when the contrast cap and visibility floors cannot both hold.
 */
export function solveInteractionTints(
	mode: ColorMode,
	colorValues: SemanticColorValues,
): InteractionTintPair {
	const tint = mode === 'dark' ? WHITE : BLACK;
	const base = colorAt(colorValues, 'color.surface.base');
	const targetHover = colorAt(colorValues, 'color.background.neutral.subtle.hover');
	const targetPressed = colorAt(colorValues, 'color.background.neutral.subtle.pressed');

	const targetHoverAlpha = alphaMatchingTarget(tint, base, targetHover);
	const targetPressedAlpha = alphaMatchingTarget(tint, base, targetPressed);
	const contrastCap = contrastCapAlpha(mode, colorValues, tint);
	const maxAlpha = contrastCap.maxAlpha;
	let limitingMiss = contrastCap.limitingMiss;

	// When the contrast cap binds the stronger (pressed) tint, scale both strengths by the same
	// factor so the hover-to-pressed step stays proportional to today's states instead of
	// collapsing hover against a clipped pressed alpha. Round to the three decimal places
	// `formatOklch` emits, then walk pressed down if rounding nudged a pair under AA.
	const scale = Math.min(1, maxAlpha / targetPressedAlpha);
	let pressedAlpha = roundAlpha(targetPressedAlpha * scale);
	let hoverAlpha = roundAlpha(targetHoverAlpha * scale);
	while (pressedAlpha > 0) {
		const miss = firstContrastMiss(colorValues, tint, pressedAlpha, tintContrastPairs());
		if (miss === null) break;
		limitingMiss = miss;
		pressedAlpha = roundAlpha(pressedAlpha - 0.001);
		hoverAlpha = roundAlpha(targetHoverAlpha * (pressedAlpha / targetPressedAlpha));
	}

	const hoverComposite = compositeEncodedSrgb(tint, base, hoverAlpha);
	const pressedComposite = compositeEncodedSrgb(tint, base, pressedAlpha);
	const hoverVisibility = oklabDeltaE(base, hoverComposite);
	const hoverToPressedVisibility = oklabDeltaE(hoverComposite, pressedComposite);

	if (hoverVisibility < INTERACTION_HOVER_VISIBILITY) {
		throw new ThemeInteractionTintError({
			mode,
			maxAlpha,
			targetHoverAlpha,
			targetPressedAlpha,
			limitingMiss,
			reason: `hover visibility ${hoverVisibility.toFixed(3)} over surface.base is below the ${INTERACTION_HOVER_VISIBILITY} floor`,
		});
	}
	if (hoverToPressedVisibility < INTERACTION_HOVER_TO_PRESSED_VISIBILITY) {
		throw new ThemeInteractionTintError({
			mode,
			maxAlpha,
			targetHoverAlpha,
			targetPressedAlpha,
			limitingMiss,
			reason: `hover-to-pressed visibility ${hoverToPressedVisibility.toFixed(3)} over surface.base is below the ${INTERACTION_HOVER_TO_PRESSED_VISIBILITY} floor`,
		});
	}

	return {
		hover: formatOklch(tint, hoverAlpha),
		pressed: formatOklch(tint, pressedAlpha),
		hoverAlpha,
		pressedAlpha,
		hoverVisibility,
		hoverToPressedVisibility,
	};
}

function roundAlpha(alpha: number): number {
	return Math.round(clampUnit(alpha) * 1000) / 1000;
}

/** Private CSS declarations for one mode's tint pair. */
export function interactionTintDeclarations(tints: InteractionTintPair): Array<string> {
	return [
		`${interactionTintVarName('hover')}: ${tints.hover};`,
		`${interactionTintVarName('pressed')}: ${tints.pressed};`,
	];
}

function colorAt(colorValues: SemanticColorValues, path: keyof SemanticColorValues): Oklch {
	const value = colorValues[path];
	if (value === undefined) throw new Error(`buildTheme did not generate "${path}"`);
	return parseColor(value);
}

/** Alpha whose encoded-sRGB composite over `destination` is closest in OKLab to `target`. */
function alphaMatchingTarget(source: Oklch, destination: Oklch, target: Oklch): number {
	let bestAlpha = 0;
	let bestDistance = Number.POSITIVE_INFINITY;
	for (let step = 0; step <= ALPHA_SEARCH_STEPS; step++) {
		const alpha = step / ALPHA_SEARCH_STEPS;
		const distance = oklabDeltaE(compositeEncodedSrgb(source, destination, alpha), target);
		if (distance < bestDistance) {
			bestDistance = distance;
			bestAlpha = alpha;
		}
	}
	return bestAlpha;
}

/**
 * Largest alpha where every supported pair still clears {@link TEXT_RATIO}: surface and subtle-rest
 * text hierarchy colours with the tint on top. On-solid pairs are omitted: a translucent tint over
 * a solid can fail AA when the solid carries dark on-solid text, so transparent controls use an
 * opaque subtle chip on solids instead (`solidStateFill`).
 */
function contrastCapAlpha(
	mode: ColorMode,
	colorValues: SemanticColorValues,
	tint: Oklch,
): { maxAlpha: number; limitingMiss: InteractionTintContrastMiss | null } {
	const pairs = tintContrastPairs();
	let low = 0;
	let high = 1;
	let limitingMiss: InteractionTintContrastMiss | null = null;

	for (let iteration = 0; iteration < 24; iteration++) {
		const mid = (low + high) / 2;
		const miss = firstContrastMiss(colorValues, tint, mid, pairs);
		if (miss === null) {
			low = mid;
		} else {
			high = mid;
			limitingMiss = miss;
		}
	}

	// Re-check the floor of the passing band so a float that still fails is not returned.
	const verified = firstContrastMiss(colorValues, tint, low, pairs);
	if (verified !== null) {
		throw new ThemeInteractionTintError({
			mode,
			maxAlpha: 0,
			targetHoverAlpha: 0,
			targetPressedAlpha: 0,
			limitingMiss: verified,
			reason: 'even a zero-strength tint leaves a foreground below 4.5:1',
		});
	}

	return { maxAlpha: low, limitingMiss };
}

function firstContrastMiss(
	colorValues: SemanticColorValues,
	tint: Oklch,
	alpha: number,
	pairs: Array<{ background: keyof SemanticColorValues; foreground: keyof SemanticColorValues }>,
): InteractionTintContrastMiss | null {
	for (const { background, foreground } of pairs) {
		const tinted = compositeEncodedSrgb(tint, colorAt(colorValues, background), alpha);
		const ratio = contrastRatio(colorAt(colorValues, foreground), tinted);
		if (ratio < TEXT_RATIO) {
			return { background, foreground, ratio };
		}
	}
	return null;
}

function tintContrastPairs(): Array<{
	background: keyof SemanticColorValues;
	foreground: keyof SemanticColorValues;
}> {
	const surfaces = [
		'color.surface.base',
		'color.surface.subdued',
		'color.surface.field',
		'color.surface.overlay',
	] as const satisfies ReadonlyArray<keyof SemanticColorValues>;
	const subtleRests = SEMANTIC_ROLES.map((role) => {
		return `color.background.${role}.subtle.rest` as const;
	});
	const surfaceBackgrounds = [...surfaces, ...subtleRests];
	const surfaceForegrounds = [
		'color.text.primary',
		'color.text.secondary',
		...SEMANTIC_ROLES.flatMap((role) => {
			return (['rest', 'hover', 'pressed'] as const).map((state) => {
				return `color.foreground.${role}.${state}` as const;
			});
		}),
	] as const satisfies ReadonlyArray<keyof SemanticColorValues>;

	const pairs: Array<{
		background: keyof SemanticColorValues;
		foreground: keyof SemanticColorValues;
	}> = [];
	for (const background of surfaceBackgrounds) {
		for (const foreground of surfaceForegrounds) {
			pairs.push({ background, foreground });
		}
	}
	return pairs;
}
