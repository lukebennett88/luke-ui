/**
 * Solves the one adaptive interaction tint pair per colour mode: black in light, white in dark.
 * Alphas target today's opaque subtle hover and pressed over `surface.base`, then cap so every
 * gated foreground stays at AA over every surface and subtle rest with the tint on
 * top. Visibility floors in `contrast-policy.ts` reject a theme that can only pass by making the
 * states invisible. Compositing uses encoded sRGB, matching CSS.
 */

import type { Oklch } from './color.js';
import { compositeEncodedSrgb, contrastRatio, formatOklch, parseColor } from './color.js';
import {
	INTERACTION_HOVER_TO_PRESSED_VISIBILITY,
	INTERACTION_HOVER_VISIBILITY,
	SEMANTIC_ROLES,
	TEXT_RATIO,
} from './contrast-policy.js';
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
	readonly reason: string;

	constructor(input: {
		mode: ColorMode;
		maxAlpha: number;
		targetHoverAlpha: number;
		targetPressedAlpha: number;
		limitingMiss: InteractionTintContrastMiss | null;
		provenance?: ReadonlyArray<string>;
		reason: string;
	}) {
		const message = [
			`Theme interaction tints are unsatisfiable in ${input.mode}: ${input.reason}`,
			`Target hover ${input.targetHoverAlpha.toFixed(3)}, pressed ${input.targetPressedAlpha.toFixed(3)}; contrast cap ${input.maxAlpha.toFixed(3)}.`,
			input.limitingMiss === null
				? null
				: `Limiting pair: ${input.limitingMiss.foreground} on tinted ${input.limitingMiss.background} at ${input.limitingMiss.ratio.toFixed(3)}:1.`,
		]
			.filter((line) => line !== null)
			.join(' ');
		const provenance = input.provenance ?? [];
		super(provenance.length > 0 ? `${message}\n${provenance.join(' ')}` : message);
		this.name = 'ThemeInteractionTintError';
		this.mode = input.mode;
		this.maxAlpha = input.maxAlpha;
		this.targetHoverAlpha = input.targetHoverAlpha;
		this.targetPressedAlpha = input.targetPressedAlpha;
		this.limitingMiss = input.limitingMiss;
		this.reason = input.reason;
	}
}

const WHITE: Oklch = { l: 1, c: 0, h: 0 };
const BLACK: Oklch = { l: 0, c: 0, h: 0 };
const ALPHA_SEARCH_STEPS = 1000;
const TINT_SURFACES = [
	'color.surface.base',
	'color.surface.subdued',
	'color.surface.field',
	'color.surface.overlay',
] as const satisfies ReadonlyArray<keyof SemanticColorValues>;

/**
 * Solves hover and pressed tint strengths for one mode from its emitted colour values. Throws
 * {@link ThemeInteractionTintError} when the contrast cap and visibility floors cannot both hold.
 */
export function solveInteractionTints(
	mode: ColorMode,
	colorValues: SemanticColorValues,
): InteractionTintPair {
	const tint = mode === 'dark' ? WHITE : BLACK;
	const parsed = parseColorValues(colorValues);
	const base = colorAt(parsed, 'color.surface.base');
	const targetHover = colorAt(parsed, 'color.background.neutral.subtle.hover');
	const targetPressed = colorAt(parsed, 'color.background.neutral.subtle.pressed');

	const targetHoverAlpha = alphaMatchingTarget(tint, base, targetHover);
	const targetPressedAlpha = alphaMatchingTarget(tint, base, targetPressed);
	const contrastCap = contrastCapAlpha(mode, parsed, tint);
	const maxAlpha = contrastCap.maxAlpha;
	const pair = closestVisiblePair(parsed, tint, maxAlpha, targetHoverAlpha, targetPressedAlpha);
	if (pair === null) {
		throw new ThemeInteractionTintError({
			mode,
			maxAlpha,
			targetHoverAlpha,
			targetPressedAlpha,
			limitingMiss: contrastCap.limitingMiss,
			reason: 'no hover and pressed pair clears the visibility floors below the contrast cap',
		});
	}
	const { hoverAlpha, pressedAlpha } = pair;

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
			limitingMiss: contrastCap.limitingMiss,
			reason: `hover visibility ${hoverVisibility.toFixed(3)} over surface.base is below the ${INTERACTION_HOVER_VISIBILITY} floor`,
		});
	}
	for (const surface of TINT_SURFACES) {
		const background = colorAt(parsed, surface);
		const hover = compositeEncodedSrgb(tint, background, hoverAlpha);
		const pressed = compositeEncodedSrgb(tint, background, pressedAlpha);
		const visibility = oklabDeltaE(hover, pressed);
		if (visibility < INTERACTION_HOVER_TO_PRESSED_VISIBILITY) {
			throw new ThemeInteractionTintError({
				mode,
				maxAlpha,
				targetHoverAlpha,
				targetPressedAlpha,
				limitingMiss: contrastCap.limitingMiss,
				reason: `hover-to-pressed visibility ${visibility.toFixed(3)} over ${surface} is below the ${INTERACTION_HOVER_TO_PRESSED_VISIBILITY} floor`,
			});
		}
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

function closestVisiblePair(
	colorValues: ParsedSemanticColors,
	tint: Oklch,
	maxAlpha: number,
	targetHoverAlpha: number,
	targetPressedAlpha: number,
): { hoverAlpha: number; pressedAlpha: number } | null {
	const maxStep = Math.floor(maxAlpha * ALPHA_SEARCH_STEPS);
	const contrastPairs = tintContrastPairs();
	let closest: { hoverAlpha: number; pressedAlpha: number } | null = null;
	let closestDistance = Number.POSITIVE_INFINITY;

	for (let hoverStep = 0; hoverStep < maxStep; hoverStep++) {
		const hoverAlpha = hoverStep / ALPHA_SEARCH_STEPS;
		const hover = compositeEncodedSrgb(
			tint,
			colorAt(colorValues, 'color.surface.base'),
			hoverAlpha,
		);
		if (
			oklabDeltaE(colorAt(colorValues, 'color.surface.base'), hover) < INTERACTION_HOVER_VISIBILITY
		) {
			continue;
		}

		let lowStep = hoverStep + 1;
		let highStep = maxStep;
		while (lowStep < highStep) {
			const midStep = Math.floor((lowStep + highStep) / 2);
			if (meetsStateVisibilityFloors(colorValues, tint, hoverAlpha, midStep / ALPHA_SEARCH_STEPS)) {
				highStep = midStep;
			} else {
				lowStep = midStep + 1;
			}
		}
		const minimumPressedStep = lowStep;
		const minimumPressed = minimumPressedStep / ALPHA_SEARCH_STEPS;
		if (
			!meetsStateVisibilityFloors(colorValues, tint, hoverAlpha, minimumPressed) ||
			firstContrastMiss(colorValues, tint, hoverAlpha, contrastPairs) !== null
		) {
			continue;
		}

		const pressedAlpha = nearestContrastSafePressedAlpha({
			colorValues,
			contrastPairs,
			hoverAlpha,
			maxStep,
			minimumPressedStep,
			targetPressedAlpha,
			tint,
		});
		if (pressedAlpha === null) continue;

		const distance =
			(hoverAlpha - targetHoverAlpha) ** 2 + (pressedAlpha - targetPressedAlpha) ** 2;
		if (distance < closestDistance) {
			closestDistance = distance;
			closest = { hoverAlpha, pressedAlpha };
		}
	}

	return closest;
}

function nearestContrastSafePressedAlpha({
	colorValues,
	contrastPairs,
	hoverAlpha,
	maxStep,
	minimumPressedStep,
	targetPressedAlpha,
	tint,
}: {
	colorValues: ParsedSemanticColors;
	contrastPairs: Array<{
		background: keyof SemanticColorValues;
		foreground: keyof SemanticColorValues;
	}>;
	hoverAlpha: number;
	maxStep: number;
	minimumPressedStep: number;
	targetPressedAlpha: number;
	tint: Oklch;
}): number | null {
	const targetStep = Math.round(targetPressedAlpha * ALPHA_SEARCH_STEPS);
	const preferredStep = Math.max(minimumPressedStep, Math.min(maxStep, targetStep));
	const maxOffset = Math.max(preferredStep - minimumPressedStep, maxStep - preferredStep);

	for (let offset = 0; offset <= maxOffset; offset++) {
		const candidates =
			offset === 0 ? [preferredStep] : [preferredStep - offset, preferredStep + offset];
		for (const step of candidates) {
			if (step < minimumPressedStep || step > maxStep) continue;
			const pressedAlpha = step / ALPHA_SEARCH_STEPS;
			if (!meetsStateVisibilityFloors(colorValues, tint, hoverAlpha, pressedAlpha)) continue;
			if (firstContrastMiss(colorValues, tint, pressedAlpha, contrastPairs) !== null) continue;
			return pressedAlpha;
		}
	}

	return null;
}

function meetsStateVisibilityFloors(
	colorValues: ParsedSemanticColors,
	tint: Oklch,
	hoverAlpha: number,
	pressedAlpha: number,
): boolean {
	for (const surface of TINT_SURFACES) {
		const background = colorAt(colorValues, surface);
		const hover = compositeEncodedSrgb(tint, background, hoverAlpha);
		const pressed = compositeEncodedSrgb(tint, background, pressedAlpha);
		if (oklabDeltaE(hover, pressed) < INTERACTION_HOVER_TO_PRESSED_VISIBILITY) return false;
	}
	return true;
}

type ParsedSemanticColors = { [Path in keyof SemanticColorValues]: Oklch };

function parseColorValues(colorValues: SemanticColorValues): ParsedSemanticColors {
	const parsed = {} as ParsedSemanticColors;
	for (const path of Object.keys(colorValues) as Array<keyof SemanticColorValues>) {
		const value = colorValues[path];
		if (value === undefined) throw new Error(`buildTheme did not generate "${path}"`);
		// The backdrop may carry alpha, which the colour parser does not accept, and the tint
		// solver never reads it.
		if (path === 'color.overlay.backdrop') continue;
		parsed[path] = parseColor(value);
	}
	return parsed;
}

function colorAt(colorValues: ParsedSemanticColors, path: keyof SemanticColorValues): Oklch {
	const value = colorValues[path];
	if (value === undefined) throw new Error(`buildTheme did not generate "${path}"`);
	return value;
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
 * text with the tint on top. Low Buttons use the paired opaque chip inside a solid fill.
 */
function contrastCapAlpha(
	mode: ColorMode,
	colorValues: ParsedSemanticColors,
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
	colorValues: ParsedSemanticColors,
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
	const subtleRests = SEMANTIC_ROLES.map((role) => {
		return `color.background.${role}.subtle.rest` as const;
	});
	const surfaceBackgrounds = [...TINT_SURFACES, ...subtleRests];
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
