/**
 * The private colour-family generator. `generateFamily` produces the semantic rungs the public
 * contract consumes, plus the high-contrast neutral used as the interaction source.
 */

import type { Oklch } from './color.js';
import { clampUnit, contrastRatio, gamutMapOklch } from './color.js';
import type { SEMANTIC_ROLES } from './contrast-policy.js';
import { CONTRAST_SEARCH_STEP, RATIO_HEADROOM, TEXT_RATIO } from './contrast-policy.js';
import type { FamilyDiagnostics, GamutReduction, SolidAnchorDiagnostics } from './diagnostics.js';
import { mixInteractionColor } from './interaction-mix.js';

/** A scale family's semantic role. Derived from the canonical role list, never restated. */
export type FamilyRole = (typeof SEMANTIC_ROLES)[number];

/** A generated family rung the public contract or interaction algorithm consumes. */
export type FamilyRung =
	| 'subtle'
	| 'decorative'
	| 'border'
	| 'mid'
	| 'solid'
	| 'foreground'
	| 'highContrast'
	| 'onSolid';

/** Family rungs in generation order, for diagnostics and tests. */
export const FAMILY_RUNGS = [
	'subtle',
	'decorative',
	'border',
	'mid',
	'solid',
	'foreground',
	'highContrast',
	'onSolid',
] as const satisfies ReadonlyArray<FamilyRung>;

type ColorMode = 'light' | 'dark';

/**
 * A generated colour family. Each field is a semantic value the mapper or interaction algorithm
 * consumes.
 */
export interface ScaleFamily {
	/** Public `background.<role>.subtle`. */
	subtle: Oklch;
	/** Neutral `border.decorative`. */
	decorative: Oklch;
	/** Public `border.<role>`. */
	border: Oklch;
	/** Neutral `loadingSkeleton` / `text.disabled`, and the default focus seed. */
	mid: Oklch;
	/** Public `background.<role>.solid`. */
	solid: Oklch;
	/** Public `foreground.<role>.default`. Neutral also maps this to `text.secondary`. */
	foreground: Oklch;
	/** Neutral `text.primary` and the interaction source. */
	highContrast: Oklch;
	/** Public `foreground.<role>.onSolid`. */
	onSolid: Oklch;
}

/** The inputs to {@link generateFamily}. */
export interface GenerateFamilyRequest {
	/** The resolved canvas anchor. Muted rungs ramp away from it toward the solid. */
	background: Oklch;
	/** The colour mode the family is generated for. */
	mode: ColorMode;
	/** The semantic role. Neutral uses a curated solid band; other roles keep the source tone. */
	role: FamilyRole;
	/** The family's hue/chroma character. Its lightness anchors vibrant solids only. */
	source: Oklch;
}

/**
 * Thrown when a family has no lightness in its solid band where a near-white or near-black
 * on-solid text clears WCAG AA against the resting solid. Carries the `role` and `mode` so the
 * caller can name the failing family, plus the best attempt for diagnostics.
 */
export class ScaleGenerationError extends Error {
	/** The role whose family could not be generated. */
	readonly role: FamilyRole;
	/** The mode the family was being generated for. */
	readonly mode: ColorMode;
	/** The closest the solid-anchor search came to satisfying the on-solid gate. */
	readonly bestAttempt: {
		/** The solid lightness of the best attempt. */
		lightness: number;
		/** The best-attempt solid colour. */
		solid: Oklch;
		/** The on-solid contrast the best attempt achieved against the resting solid. */
		onSolidRatio: number;
	};

	constructor(role: FamilyRole, mode: ColorMode, bestAttempt: ScaleGenerationError['bestAttempt']) {
		super(
			`Cannot generate the ${mode} "${role}" family: no solid lightness in the search band lets ` +
				'near-white or near-black on-solid text clear 4.5:1 against the resting solid ' +
				`(best attempt reached ${bestAttempt.onSolidRatio.toFixed(2)}:1 at lightness ` +
				`${bestAttempt.lightness.toFixed(3)}). Author an explicit, more accessible source colour.`,
		);
		this.role = role;
		this.mode = mode;
		this.bestAttempt = bestAttempt;
		this.name = 'ScaleGenerationError';
	}
}

const ON_SOLID_TARGET = TEXT_RATIO + RATIO_HEADROOM;

interface RampRungSpec {
	chromaCap: number;
	chromaFraction: number;
	offset: number;
}

const RAMP_SPEC = {
	dark: {
		subtle: { chromaCap: 0.045, chromaFraction: 0.28, offset: 0.04 },
		decorative: { chromaCap: 0.09, chromaFraction: 0.58, offset: 0.128 },
		border: { chromaCap: 0.11, chromaFraction: 0.66, offset: 0.18 },
		mid: { chromaCap: 0.14, chromaFraction: 0.78, offset: 0.25 },
	},
	light: {
		subtle: { chromaCap: 0.045, chromaFraction: 0.28, offset: 0.03 },
		decorative: { chromaCap: 0.09, chromaFraction: 0.58, offset: 0.11 },
		border: { chromaCap: 0.11, chromaFraction: 0.66, offset: 0.165 },
		mid: { chromaCap: 0.14, chromaFraction: 0.78, offset: 0.25 },
	},
} as const satisfies Record<ColorMode, Record<'subtle' | 'decorative' | 'border' | 'mid', RampRungSpec>>;

interface SolidBand {
	band: [number, number];
	target: number;
}

const VIBRANT_SOLID_MAX_DEVIATION = 0.035;
const VIBRANT_SOLID_RANGE: [number, number] = [0.3, 0.92];
const NEUTRAL_SOLID = {
	dark: { band: [0.7, 0.9], target: 0.82 },
	light: { band: [0.22, 0.45], target: 0.35 },
} as const satisfies Record<ColorMode, SolidBand>;

const TEXT_LIGHTNESS = {
	dark: { high: 0.94, low: 0.76 },
	light: { high: 0.3, low: 0.49 },
} as const satisfies Record<ColorMode, { low: number; high: number }>;
const TEXT_LOW_CHROMA_FRACTION = 0.55;
const TEXT_LOW_CHROMA_CAP = 0.13;
const TEXT_HIGH_CHROMA_FRACTION = 0.45;
const TEXT_HIGH_CHROMA_CAP = 0.1;

const ON_SOLID_WHITE_LIGHTNESS = 0.985;
const ON_SOLID_BLACK_LIGHTNESS = 0.18;
const ON_SOLID_BLACK_CHROMA = 0.01;

/** A candidate solid the on-solid gate is asked about. */
export interface OnSolidGateRequest {
	/** The candidate solid lightness. */
	lightness: number;
	/** The colour mode the candidate solid is generated for. */
	mode: ColorMode;
	/** The family character. Only its hue and chroma are read; `lightness` supplies the tone. */
	source: Oklch;
}

/**
 * The one on-solid accessibility gate: whether the near-white or near-black on-solid text this
 * generator would choose clears the AA text ratio (plus the search headroom) against the public
 * resting solid. Hover and pressed colours are derived from that fill and gated by
 * `validateContrast`.
 */
export function passesOnSolidGate(request: OnSolidGateRequest): boolean {
	return onSolidGateRatio(request) >= ON_SOLID_TARGET;
}

/**
 * The contrast {@link passesOnSolidGate} measures: the better on-solid candidate's ratio against
 * the candidate resting solid. Exposed for the solid-anchor search's best-attempt diagnostics.
 */
export function onSolidGateRatio(request: OnSolidGateRequest): number {
	const { lightness, source } = request;
	const solid = gamutMapOklch({
		l: clampUnit(lightness),
		c: source.c,
		h: source.h,
	});
	return chooseOnSolid(source.h, [solid]).minRatio;
}

/**
 * Generates the semantic family rungs plus the on-solid colour for a role. Owns the constrained
 * solid-anchor search internally; throws {@link ScaleGenerationError} when the family cannot reach
 * an accessible solid.
 */
export function generateFamily(request: GenerateFamilyRequest): ScaleFamily {
	return buildFamily(request).family;
}

/**
 * Generates a family together with its family-level {@link FamilyDiagnostics}.
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
	const { background, mode, role, source } = request;
	const hue = source.h;
	const direction = mode === 'light' ? -1 : 1;
	const backgroundLightness = clampUnit(background.l);
	const reductions: Array<GamutReduction> = [];

	const rung = (name: FamilyRung, lightness: number, requestedChroma: number): Oklch => {
		const mapped = gamutMapOklch({
			c: Math.max(requestedChroma, 0),
			h: hue,
			l: clampUnit(lightness),
		});
		if (requestedChroma - mapped.c > GAMUT_REDUCTION_EPSILON) {
			reductions.push({ requestedChroma, resolvedChroma: mapped.c, rung: name });
		}
		return mapped;
	};

	const mutedRung = (name: 'subtle' | 'decorative' | 'border' | 'mid'): Oklch => {
		const spec = RAMP_SPEC[mode][name];
		return rung(
			name,
			backgroundLightness + direction * spec.offset,
			Math.min(source.c * spec.chromaFraction, spec.chromaCap),
		);
	};

	const subtle = mutedRung('subtle');
	const decorative = mutedRung('decorative');
	const border = mutedRung('border');
	const mid = mutedRung('mid');

	const anchor = resolveSolidAnchor(request);
	const solid = rung('solid', anchor.lightness, source.c);
	const onSolid = chooseOnSolid(hue, [solid]);

	const text = TEXT_LIGHTNESS[mode];
	const highContrast = rung(
		'highContrast',
		text.high,
		Math.min(source.c * TEXT_HIGH_CHROMA_FRACTION, TEXT_HIGH_CHROMA_CAP),
	);
	const foreground = resolveForeground({
		highContrast,
		mode,
		rung,
		source,
		subtle,
	});

	const family: ScaleFamily = {
		subtle,
		decorative,
		border,
		mid,
		solid,
		foreground,
		highContrast,
		onSolid: onSolid.color,
	};

	const solidAnchor: SolidAnchorDiagnostics = {
		adaptedForOnSolid: anchor.adapted,
		band: anchor.band,
		onSolidRatioSolid: contrastRatio(onSolid.color, solid),
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
			ratioSolid: solidAnchor.onSolidRatioSolid,
		},
		role,
		solidAnchor,
		source,
	};

	return { diagnostics, family };
}

/**
 * Resolves the ordinary semantic foreground. Prefers the curated text lightness, then walks toward
 * the high-contrast lightness until the colour still clears AA against the pressed subtle fill.
 * Pressed is the stronger mix, so a pair that passes there also passes at rest and on hover.
 */
function resolveForeground({
	highContrast,
	mode,
	rung,
	source,
	subtle,
}: {
	highContrast: Oklch;
	mode: ColorMode;
	rung: (name: FamilyRung, lightness: number, requestedChroma: number) => Oklch;
	source: Oklch;
	subtle: Oklch;
}): Oklch {
	const preferred = TEXT_LIGHTNESS[mode].low;
	const toward = TEXT_LIGHTNESS[mode].high;
	const chroma = Math.min(source.c * TEXT_LOW_CHROMA_FRACTION, TEXT_LOW_CHROMA_CAP);
	const pressedSubtle = mixInteractionColor(subtle, highContrast, 'pressed');
	const colorAt = (lightness: number) => rung('foreground', lightness, chroma);
	const ratioAt = (lightness: number) => contrastRatio(colorAt(lightness), pressedSubtle);

	if (ratioAt(preferred) >= ON_SOLID_TARGET) return colorAt(preferred);

	const low = Math.min(preferred, toward);
	const high = Math.max(preferred, toward);
	let best: number | null = null;
	let bestDistance = Number.POSITIVE_INFINITY;
	const stepCount = Math.round((high - low) / CONTRAST_SEARCH_STEP);
	for (let index = 0; index <= stepCount; index++) {
		const lightness = low + index * CONTRAST_SEARCH_STEP;
		if (ratioAt(lightness) < ON_SOLID_TARGET) continue;
		const distance = Math.abs(lightness - preferred);
		if (distance < bestDistance) {
			bestDistance = distance;
			best = lightness;
		}
	}
	return colorAt(best ?? toward);
}

interface ResolvedAnchor {
	adapted: boolean;
	band: [number, number];
	lightness: number;
	target: number;
}

/**
 * Resolves the solid lightness. Searches the solid band for a lightness whose resting solid clears
 * the on-solid gate, preferring the lightness nearest the source (vibrant) or the curated target
 * (neutral), and throwing when none clears. Every semantic role publishes a solid, so every family
 * is searched.
 */
function resolveSolidAnchor(request: GenerateFamilyRequest): ResolvedAnchor {
	const { mode, role, source } = request;
	const isNeutral = role === 'neutral';
	const [rangeLow, rangeHigh] = VIBRANT_SOLID_RANGE;
	const target = isNeutral ? NEUTRAL_SOLID[mode].target : source.l;
	const band: [number, number] = isNeutral
		? NEUTRAL_SOLID[mode].band
		: [
				clamp(source.l - VIBRANT_SOLID_MAX_DEVIATION, rangeLow, rangeHigh),
				clamp(source.l + VIBRANT_SOLID_MAX_DEVIATION, rangeLow, rangeHigh),
			];
	const [low, high] = band;

	const preferred = clamp(target, low, high);
	const gateRatio = (lightness: number): number => onSolidGateRatio({ lightness, mode, source });

	if (passesOnSolidGate({ lightness: preferred, mode, source })) {
		return { adapted: false, band, lightness: preferred, target };
	}

	let best: number | null = null;
	let bestDistance = Number.POSITIVE_INFINITY;
	let bestAttemptLightness = preferred;
	let bestAttemptRatio = gateRatio(preferred);
	const stepCount = Math.round((high - low) / CONTRAST_SEARCH_STEP);
	for (let index = 0; index <= stepCount; index++) {
		const lightness = low + index * CONTRAST_SEARCH_STEP;
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
		});
	}
	return { adapted: true, band, lightness: best, target };
}

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

function oklabAxes(color: Oklch): [number, number] {
	const hueRadians = (color.h * Math.PI) / 180;
	return [color.c * Math.cos(hueRadians), color.c * Math.sin(hueRadians)];
}

const GAMUT_REDUCTION_EPSILON = 0.0001;

function clamp(value: number, low: number, high: number): number {
	return Math.min(high, Math.max(low, value));
}
