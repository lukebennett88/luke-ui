/**
 * The private 12-step colour scale generator. `generateFamily` produces a Radix-shaped OKLCH family
 * (steps 1-12 plus a `contrast` on-solid colour) from a family character `source`, the canvas
 * `background`, a colour `mode`, a semantic `role`, and the `text.primary` colour that public hover
 * and pressed mix toward. It owns the constrained solid-anchor (step-9) search and
 * {@link passesOnSolidGate}, which `defineTheme`'s accent pre-conditioner calls rather than
 * reimplementing.
 */

import type { Oklch } from './color.js';
import { clampUnit, contrastRatio, gamutMapOklch, mixOklab } from './color.js';
import type { SEMANTIC_ROLES } from './contrast-policy.js';
import { RATIO_HEADROOM, TEXT_RATIO } from './contrast-policy.js';
import type { FamilyDiagnostics, GamutReduction, SolidAnchorDiagnostics } from './diagnostics.js';
import { lightnessCandidates } from './lightness-candidates.js';

/** A scale family's semantic role. Derived from the canonical role list, never restated. */
export type FamilyRole = (typeof SEMANTIC_ROLES)[number];

/** A step index in the 12-step scale. */
export type ScaleStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** Maps a muted-rung array index to its 1-based scale step, without widening through arithmetic. */
const MUTED_RUNG_STEP = [1, 2, 3, 4, 5, 6, 7, 8] as const satisfies ReadonlyArray<ScaleStep>;

type ColorMode = 'light' | 'dark';

/**
 * A generated 12-step colour family plus its on-solid `contrast` colour. Semantic consumers read
 * named rungs via {@link FAMILY_RUNG}: step 3 is the public subtle rest, step 7 the semantic
 * border, step 9 the public solid rest, step 11 the resting foreground, and neutral step 12 is
 * `text.primary`. Unnamed steps are private scale geometry, not public hover or pressed colours.
 * `contrast` is on-solid text that must read over solid rest, hover, and pressed.
 */
export interface ScaleFamily {
	1: Oklch;
	2: Oklch;
	3: Oklch;
	4: Oklch;
	5: Oklch;
	6: Oklch;
	7: Oklch;
	8: Oklch;
	9: Oklch;
	10: Oklch;
	11: Oklch;
	12: Oklch;
	/** On-solid text: reads over the solid rest, hover, and pressed colours, guaranteed WCAG AA. */
	contrast: Oklch;
}

/**
 * Semantic rungs of the private 12-step family. The generator stays ordinal; mapping and other
 * consumers use these names instead of remembering what 3, 7, 9, 11, and 12 mean. Steps 4, 5, and
 * 10 stay unnamed: they are private scale geometry, not public hover or pressed colours.
 */
export const FAMILY_RUNG = {
	subtle: 3,
	decorative: 6,
	border: 7,
	muted: 8,
	solid: 9,
	foreground: 11,
	textPrimary: 12,
} as const satisfies Record<string, ScaleStep>;

/** Share of `text.primary` mixed into a resting colour to produce the public hover state. */
export const INTERACTION_HOVER_STRENGTH = 0.05;

/** Share of `text.primary` mixed into a resting colour to produce the public pressed state. */
export const INTERACTION_PRESSED_STRENGTH = 0.1;

/** Mixes a resting colour toward `toward` at `strength`, then maps the result into sRGB. */
export function mixInteractionState(rest: Oklch, toward: Oklch, strength: number): Oklch {
	return gamutMapOklch(mixOklab(rest, toward, strength));
}

/**
 * The high-contrast text rung (step 12) a family emits for `source` in `mode`. Neutral's rung is
 * `text.primary`, computed before any solid-anchor search so every family can gate against it.
 */
export function highContrastText(source: Oklch, mode: ColorMode): Oklch {
	return gamutMapOklch(highContrastTextRequest(source, mode));
}

/** The inputs to {@link generateFamily}. */
export interface GenerateFamilyRequest {
	/** The resolved canvas anchor. Steps 1-8 ramp away from it toward the solid. */
	background: Oklch;
	/** The colour public hover and pressed mix toward. Production passes emitted `text.primary`. */
	interactionSource: Oklch;
	/** The colour mode the family is generated for. */
	mode: ColorMode;
	/** The semantic role. Neutral uses a curated solid band; other roles keep the source tone. */
	role: FamilyRole;
	/** The family's hue/chroma character. Its lightness anchors vibrant solids only. */
	source: Oklch;
}

/**
 * Thrown when a family has no lightness in its solid band where a near-white or near-black
 * on-solid text clears WCAG AA across the solid and its generated hover and pressed states. Carries
 * the `role` and `mode` so the caller can name the failing family, plus the best attempt for
 * diagnostics.
 */
export class ScaleGenerationError extends Error {
	/** The role whose family could not be generated. */
	readonly role: FamilyRole;
	/** The mode the family was being generated for. */
	readonly mode: ColorMode;
	/** The closest the solid-anchor search came to satisfying the on-solid gate. */
	readonly bestAttempt: {
		/** The solid step the search targets. */
		step: 9;
		/** The lightness of the best attempt. */
		lightness: number;
		/** The best-attempt step-9 solid colour. */
		solid: Oklch;
		/** The on-solid contrast the best attempt achieved across rest, hover, and pressed. */
		onSolidRatio: number;
	};

	constructor(role: FamilyRole, mode: ColorMode, bestAttempt: ScaleGenerationError['bestAttempt']) {
		super(
			`Cannot generate the ${mode} "${role}" family: no solid lightness in the search band lets ` +
				'near-white or near-black on-solid text clear 4.5:1 across the solid and its generated ' +
				'hover and pressed states ' +
				`(best attempt reached ${bestAttempt.onSolidRatio.toFixed(2)}:1 at lightness ` +
				`${bestAttempt.lightness.toFixed(3)}). Author an explicit, more accessible source colour.`,
		);
		this.role = role;
		this.mode = mode;
		this.bestAttempt = bestAttempt;
		this.name = 'ScaleGenerationError';
	}
}

// The ratio the on-solid gate solves for: the AA text ratio plus the rounding headroom every contrast
// search adds (see contrast-policy.ts). Validation re-measures the emitted values at TEXT_RATIO.
const ON_SOLID_TARGET = TEXT_RATIO + RATIO_HEADROOM;

/**
 * The OKLab ΔE floor between consecutive muted-ramp rungs (steps 3-4 and 4-5). The muted ramp's
 * fixed lightness deltas clear this comfortably for every role, including near-achromatic neutrals.
 */
export const MIN_STATE_DELTA = 0.015;

// Steps 1-8 form a "muted ramp": lightness walks away from the background toward the solid by fixed
// absolute offsets (so consecutive rungs stay distinct independent of the anchor lightness), while
// chroma grows from a faint tint to near the solid. `offset` is an absolute OKLCH lightness delta
// from the background (its sign is set by the mode: darker in light mode, lighter in dark mode);
// `chromaFraction` scales the source chroma and `chromaCap` caps it so the pale near-background
// steps stay tinted rather than saturated.
interface RampRungSpec {
	chromaCap: number;
	chromaFraction: number;
	offset: number;
}
const RAMP_SPEC = {
	dark: [
		{ chromaCap: 0.02, chromaFraction: 0.1, offset: 0 },
		{ chromaCap: 0.03, chromaFraction: 0.18, offset: 0.018 },
		{ chromaCap: 0.045, chromaFraction: 0.28, offset: 0.04 },
		{ chromaCap: 0.06, chromaFraction: 0.4, offset: 0.065 },
		{ chromaCap: 0.075, chromaFraction: 0.5, offset: 0.092 },
		{ chromaCap: 0.09, chromaFraction: 0.58, offset: 0.128 },
		{ chromaCap: 0.11, chromaFraction: 0.66, offset: 0.18 },
		{ chromaCap: 0.14, chromaFraction: 0.78, offset: 0.25 },
	],
	light: [
		{ chromaCap: 0.02, chromaFraction: 0.1, offset: 0 },
		{ chromaCap: 0.03, chromaFraction: 0.18, offset: 0.013 },
		{ chromaCap: 0.045, chromaFraction: 0.28, offset: 0.03 },
		{ chromaCap: 0.06, chromaFraction: 0.4, offset: 0.052 },
		{ chromaCap: 0.075, chromaFraction: 0.5, offset: 0.078 },
		{ chromaCap: 0.09, chromaFraction: 0.58, offset: 0.11 },
		{ chromaCap: 0.11, chromaFraction: 0.66, offset: 0.165 },
		{ chromaCap: 0.14, chromaFraction: 0.78, offset: 0.25 },
	],
} as const satisfies Record<ColorMode, ReadonlyArray<RampRungSpec>>;

// Private step-10 lightness offset from the solid rest. Public hover and pressed mix step 9 toward
// `text.primary`.
const SOLID_STEP_10_DELTA = 0.05;

interface SolidBand {
	/** The inclusive lightness range the search may explore. */
	band: [number, number];
	/** The lightness the search prefers when it clears the gate. */
	target: number;
}

// A vibrant solid (accent / danger) stays faithful to its authored lightness: the search explores a
// narrow window centred on the source lightness, so the solid keeps the family's tone rather than
// being repainted to a fixed vibrant target. The window is narrower than the on-solid "dead zone"
// (the band of solid lightnesses where neither near-white nor near-black text clears AA), so a
// source whose whole window falls inside that dead zone is honestly unsatisfiable and throws.
const VIBRANT_SOLID_MAX_DEVIATION = 0.035;
const VIBRANT_SOLID_RANGE: [number, number] = [0.3, 0.92];
// The neutral solid is a strong chip, not derived from the neutral's canvas lightness: light mode
// wants a dark chip and dark mode a light one. Its tiny chroma always clears the on-solid gate.
const NEUTRAL_SOLID = {
	dark: { band: [0.7, 0.9], target: 0.82 },
	light: { band: [0.22, 0.45], target: 0.35 },
} as const satisfies Record<ColorMode, SolidBand>;

// Text lightness targets: step 11 (low contrast) and step 12 (high contrast). Step 12 is also
// `text.primary`, the mix target for public hover and pressed colours. Light `low` sits below 0.5
// so step 11 keeps AA over generated subtle hover and pressed fills (rest mixed toward text.primary).
const TEXT_LIGHTNESS = {
	dark: { high: 0.94, low: 0.76 },
	light: { high: 0.3, low: 0.45 },
} as const satisfies Record<ColorMode, { low: number; high: number }>;
const TEXT_LOW_CHROMA_FRACTION = 0.55;
const TEXT_LOW_CHROMA_CAP = 0.13;
const TEXT_HIGH_CHROMA_FRACTION = 0.45;
const TEXT_HIGH_CHROMA_CAP = 0.1;

function highContrastTextRequest(source: Oklch, mode: ColorMode): Oklch {
	return {
		l: clampUnit(TEXT_LIGHTNESS[mode].high),
		c: Math.max(Math.min(source.c * TEXT_HIGH_CHROMA_FRACTION, TEXT_HIGH_CHROMA_CAP), 0),
		h: source.h,
	};
}

// The near-white and near-black candidates the on-solid gate chooses between.
const ON_SOLID_WHITE_LIGHTNESS = 0.985;
const ON_SOLID_BLACK_LIGHTNESS = 0.18;
const ON_SOLID_BLACK_CHROMA = 0.01;

/** A candidate solid the on-solid gate is asked about. */
export interface OnSolidGateRequest {
	/** The colour public hover and pressed mix toward. Must match the colour `generateFamily` will use. */
	interactionSource: Oklch;
	/** The candidate step-9 solid lightness. */
	lightness: number;
	/** The family character. Only its hue and chroma are read; `lightness` supplies the tone. */
	source: Oklch;
}

/**
 * Whether the near-white or near-black on-solid text this generator would choose clears the AA text
 * ratio (plus the search headroom) across the public solid rest, hover, and pressed colours a
 * candidate lightness produces. `defineTheme`'s accent pre-conditioner calls this rather than
 * reimplementing it.
 */
export function passesOnSolidGate(request: OnSolidGateRequest): boolean {
	return onSolidGateRatio(request) >= ON_SOLID_TARGET;
}

/** The minimum on-solid ratio {@link passesOnSolidGate} compares to the AA target plus headroom. */
export function onSolidGateRatio(request: OnSolidGateRequest): number {
	const { interactionSource, lightness, source } = request;
	const solid = gamutMapOklch({
		l: clampUnit(lightness),
		c: source.c,
		h: source.h,
	});
	return chooseOnSolid(source.h, publicSolidStates(solid, interactionSource)).minRatio;
}

/**
 * Generates the 12-step OKLCH family plus its on-solid `contrast` colour for a role. Owns the
 * constrained solid-anchor search internally; throws {@link ScaleGenerationError} (carrying `role`
 * and `mode`) when the family cannot reach an accessible solid.
 */
export function generateFamily(request: GenerateFamilyRequest): ScaleFamily {
	return buildFamily(request).family;
}

/**
 * Generates a family together with its family-level {@link FamilyDiagnostics}: the resolved solid
 * anchor, the on-solid colour and its rest/hover/pressed ratios, and any gamut-driven chroma
 * reductions.
 */
export function generateFamilyWithDiagnostics(request: GenerateFamilyRequest): {
	family: ScaleFamily;
	diagnostics: FamilyDiagnostics;
} {
	return buildFamily(request);
}

/** The OKLab ΔE (Euclidean distance in OKLab) between two OKLCH colours. */
export function oklabDeltaE(a: Oklch, b: Oklch): number {
	const [aA, aB] = oklabAxes(a);
	const [bA, bB] = oklabAxes(b);
	return Math.hypot(a.l - b.l, aA - bA, aB - bB);
}

function buildFamily(request: GenerateFamilyRequest): {
	family: ScaleFamily;
	diagnostics: FamilyDiagnostics;
} {
	const { background, interactionSource, mode, role, source } = request;
	const hue = source.h;
	const direction = mode === 'light' ? -1 : 1;
	const backgroundLightness = clampUnit(background.l);
	const reductions: Array<GamutReduction> = [];

	const rung = (step: ScaleStep, lightness: number, requestedChroma: number): Oklch => {
		const mapped = gamutMapOklch({
			l: clampUnit(lightness),
			c: Math.max(requestedChroma, 0),
			h: hue,
		});
		if (requestedChroma - mapped.c > GAMUT_REDUCTION_EPSILON) {
			reductions.push({ requestedChroma, resolvedChroma: mapped.c, step });
		}
		return mapped;
	};

	// Steps 1-8: the muted ramp away from the background. `index` is a literal so the spec tuple
	// lookup is exact (never `undefined`). Built before the solid/text rungs so gamut-reduction
	// diagnostics accumulate in step order.
	const mutedRung = (index: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7): Oklch => {
		const spec = RAMP_SPEC[mode][index];
		return rung(
			MUTED_RUNG_STEP[index],
			backgroundLightness + direction * spec.offset,
			Math.min(source.c * spec.chromaFraction, spec.chromaCap),
		);
	};
	const step1 = mutedRung(0);
	const step2 = mutedRung(1);
	const step3 = mutedRung(2);
	const step4 = mutedRung(3);
	const step5 = mutedRung(4);
	const step6 = mutedRung(5);
	const step7 = mutedRung(6);
	const step8 = mutedRung(7);

	// Step 9: the solid anchor, searched so on-solid text clears AA across rest, hover, and pressed.
	const anchor = resolveSolidAnchor(request);
	const solid = rung(9, anchor.lightness, source.c);
	const step10 = rung(10, anchor.lightness + direction * SOLID_STEP_10_DELTA, source.c);
	const [solidRest, publicHover, publicPressed] = publicSolidStates(solid, interactionSource);

	const onSolid = chooseOnSolid(hue, [solidRest, publicHover, publicPressed]);

	const text = TEXT_LIGHTNESS[mode];
	const lowText = rung(
		11,
		text.low,
		Math.min(source.c * TEXT_LOW_CHROMA_FRACTION, TEXT_LOW_CHROMA_CAP),
	);
	const highTextRequest = highContrastTextRequest(source, mode);
	const highText = rung(12, highTextRequest.l, highTextRequest.c);

	const family: ScaleFamily = {
		1: step1,
		2: step2,
		3: step3,
		4: step4,
		5: step5,
		6: step6,
		7: step7,
		8: step8,
		9: solid,
		10: step10,
		11: lowText,
		12: highText,
		contrast: onSolid.color,
	};

	const solidAnchor: SolidAnchorDiagnostics = {
		adaptedForOnSolid: anchor.adapted,
		band: anchor.band,
		resolvedLightness: anchor.lightness,
		satisfied: onSolid.minRatio >= TEXT_RATIO,
		targetLightness: anchor.target,
	};

	const diagnostics: FamilyDiagnostics = {
		background,
		family,
		gamutReductions: reductions,
		mode,
		onSolid: {
			color: onSolid.color,
			ratioRest: contrastRatio(onSolid.color, solid),
			ratioHover: contrastRatio(onSolid.color, publicHover),
			ratioPressed: contrastRatio(onSolid.color, publicPressed),
		},
		role,
		solidAnchor,
		source,
	};

	return { diagnostics, family };
}

interface ResolvedAnchor {
	adapted: boolean;
	band: [number, number];
	lightness: number;
	target: number;
}

/**
 * Resolves the step-9 solid lightness. Searches the solid band for a lightness whose public rest,
 * hover, and pressed colours all clear the on-solid gate, preferring the lightness nearest the
 * source (vibrant) or the curated target (neutral), and throwing when none clears. Every semantic
 * role publishes a solid, so every family is searched.
 */
function resolveSolidAnchor(request: GenerateFamilyRequest): ResolvedAnchor {
	const { mode, role, source } = request;
	const isNeutral = role === 'neutral';
	const [rangeLow, rangeHigh] = VIBRANT_SOLID_RANGE;
	// Neutral takes a curated dark/light chip; a vibrant role keeps its authored tone within a narrow
	// window around the source lightness.
	const target = isNeutral ? NEUTRAL_SOLID[mode].target : source.l;
	const band: [number, number] = isNeutral
		? NEUTRAL_SOLID[mode].band
		: [
				clamp(source.l - VIBRANT_SOLID_MAX_DEVIATION, rangeLow, rangeHigh),
				clamp(source.l + VIBRANT_SOLID_MAX_DEVIATION, rangeLow, rangeHigh),
			];
	const [low, high] = band;

	const preferred = clamp(target, low, high);
	const gateRequest = {
		interactionSource: request.interactionSource,
		source,
	};
	const gateRatio = (lightness: number): number => onSolidGateRatio({ ...gateRequest, lightness });

	if (passesOnSolidGate({ ...gateRequest, lightness: preferred })) {
		return { adapted: false, band, lightness: preferred, target };
	}

	const { best, bestAttemptLightness, bestAttemptRatio } = (() => {
		let best: number | null = null;
		let bestDistance = Number.POSITIVE_INFINITY;
		let bestAttemptLightness = preferred;
		let bestAttemptRatio = gateRatio(preferred);
		for (const lightness of lightnessCandidates(low, high)) {
			const ratio = gateRatio(lightness);
			if (ratio > bestAttemptRatio) {
				bestAttemptRatio = ratio;
				bestAttemptLightness = lightness;
			}
			if (ratio < ON_SOLID_TARGET) continue;
			const distance = Math.abs(lightness - preferred);
			if (distance < bestDistance) {
				bestDistance = distance;
				best = lightness;
			}
		}
		return { best, bestAttemptLightness, bestAttemptRatio };
	})();
	if (best === null) {
		const solid = gamutMapOklch({
			l: clampUnit(bestAttemptLightness),
			c: source.c,
			h: source.h,
		});
		throw new ScaleGenerationError(role, mode, {
			lightness: bestAttemptLightness,
			onSolidRatio: bestAttemptRatio,
			solid,
			step: 9,
		});
	}
	return { adapted: true, band, lightness: best, target };
}

/**
 * Chooses the on-solid text colour: the near-white or near-black candidate at the hue with the
 * higher minimum contrast across the given solids.
 */
function chooseOnSolid(hue: number, solids: Array<Oklch>): { color: Oklch; minRatio: number } {
	const nearWhite = gamutMapOklch({
		l: ON_SOLID_WHITE_LIGHTNESS,
		c: 0,
		h: hue,
	});
	const nearBlack = gamutMapOklch({
		l: ON_SOLID_BLACK_LIGHTNESS,
		c: ON_SOLID_BLACK_CHROMA,
		h: hue,
	});
	const whiteMinimum = minimumRatio(nearWhite, solids);
	const blackMinimum = minimumRatio(nearBlack, solids);
	if (whiteMinimum >= ON_SOLID_TARGET) return { color: nearWhite, minRatio: whiteMinimum };
	if (blackMinimum >= ON_SOLID_TARGET) return { color: nearBlack, minRatio: blackMinimum };
	return whiteMinimum >= blackMinimum
		? { color: nearWhite, minRatio: whiteMinimum }
		: { color: nearBlack, minRatio: blackMinimum };
}

function minimumRatio(foreground: Oklch, backgrounds: Array<Oklch>): number {
	return Math.min(...backgrounds.map((background) => contrastRatio(foreground, background)));
}

function publicSolidStates(solid: Oklch, toward: Oklch): [Oklch, Oklch, Oklch] {
	return [
		solid,
		mixInteractionState(solid, toward, INTERACTION_HOVER_STRENGTH),
		mixInteractionState(solid, toward, INTERACTION_PRESSED_STRENGTH),
	];
}

function oklabAxes(color: Oklch): [number, number] {
	const hueRadians = (color.h * Math.PI) / 180;
	return [color.c * Math.cos(hueRadians), color.c * Math.sin(hueRadians)];
}

const GAMUT_REDUCTION_EPSILON = 0.0001;

function clamp(value: number, low: number, high: number): number {
	return Math.min(high, Math.max(low, value));
}
