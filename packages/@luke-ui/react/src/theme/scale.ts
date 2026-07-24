/**
 * The private 12-step colour scale generator. `generateFamily` produces a Radix-shaped OKLCH family
 * (steps 1-12 plus a `contrast` on-solid colour) from a family character `source`, the canvas
 * `background`, a colour `mode`, and a semantic `role`. It owns the constrained solid-anchor (step-9)
 * search and the capability-based role guarantees; it is calibrated to testable scale properties
 * rather than to exact Radix reproduction.
 *
 * Isolated by design: nothing here is wired into `buildTheme` yet (that is a later stage). It reuses
 * the dependency-free colour math in `color.ts` and never distorts a family to satisfy a guarantee
 * the public contract does not consume.
 */

import type { Oklch } from './color.js';
import { contrastRatio, gamutMapOklch } from './color.js';
import type { FamilyDiagnostics, GamutReduction, SolidAnchorDiagnostics } from './diagnostics.js';

/** A scale family's semantic role. Drives the capability guarantees, not the geometry. */
export type FamilyRole = 'neutral' | 'accent' | 'danger' | 'info' | 'success' | 'warning';

/** A step index in the 12-step scale. */
export type ScaleStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

type ColorMode = 'light' | 'dark';

/**
 * The capabilities a role's family must guarantee, driven by what the public colour contract
 * actually consumes (not by hue). Named for capabilities so the flags do not leak token names.
 */
export interface FamilyRequirements {
	/** Steps 3-5: component surface trio (normal / hover / active). */
	needsSubtleStates: boolean;
	/** Steps 9-10: solid surface and its hover. */
	needsSolidStates: boolean;
	/** `contrast` clears WCAG AA text contrast against steps 9 and 10. */
	needsOnSolid: boolean;
	/** Step 11 low-contrast text (neutral additionally uses 12 / secondary / disabled). */
	needsText: boolean;
	/** Step 7: UI border and focus ring. */
	needsBorder: boolean;
}

/**
 * The locked capability matrix. `neutral` is explicit, not fall-through: it publicly supplies the
 * subtle trio, the solid ladder, `contrast`, text, borders, and the loading skeleton. Feedback roles
 * consume only steps 3 / 7 / 11 publicly, so they do NOT require on-solid or solid states — their
 * families are never distorted to satisfy an unused on-solid guarantee.
 */
export const FAMILY_REQUIREMENTS = {
	accent: {
		needsBorder: true,
		needsOnSolid: true,
		needsSolidStates: true,
		needsSubtleStates: true,
		needsText: true,
	},
	danger: {
		needsBorder: true,
		needsOnSolid: true,
		needsSolidStates: true,
		needsSubtleStates: true,
		needsText: true,
	},
	info: {
		needsBorder: true,
		needsOnSolid: false,
		needsSolidStates: false,
		needsSubtleStates: true,
		needsText: true,
	},
	neutral: {
		needsBorder: true,
		needsOnSolid: true,
		needsSolidStates: true,
		needsSubtleStates: true,
		needsText: true,
	},
	success: {
		needsBorder: true,
		needsOnSolid: false,
		needsSolidStates: false,
		needsSubtleStates: true,
		needsText: true,
	},
	warning: {
		needsBorder: true,
		needsOnSolid: false,
		needsSolidStates: false,
		needsSubtleStates: true,
		needsText: true,
	},
} as const satisfies Record<FamilyRole, FamilyRequirements>;

/**
 * A generated 12-step colour family plus its on-solid `contrast` colour. Step roles: 1-2 app/subtle
 * backgrounds, 3-5 component surface (normal / hover / active), 6-8 borders (subtle / UI+focus /
 * hover), 9-10 solid (9 = anchor, 10 = hover), 11-12 text (low / high contrast).
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
	/** On-solid text: reads over steps 9 and 10 (guaranteed AA only when `needsOnSolid`). */
	contrast: Oklch;
}

/** The inputs to {@link generateFamily}. */
export interface GenerateFamilyRequest {
	/** The family's hue/chroma character. Its lightness anchors vibrant solids only. */
	source: Oklch;
	/** The resolved canvas anchor. Steps 1-8 ramp away from it toward the solid. */
	background: Oklch;
	/** The colour mode the family is generated for. */
	mode: ColorMode;
	/** The semantic role, which selects the capability guarantees. */
	role: FamilyRole;
}

/**
 * Thrown when a family that must guarantee on-solid contrast (`needsOnSolid`) has no lightness in
 * its solid band where a near-white or near-black on-solid text clears WCAG AA across the solid and
 * its hover. Carries the `role` and `mode` so the caller can name the failing family, plus the best
 * attempt for diagnostics.
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
		/** The on-solid contrast the best attempt achieved across the solid and its hover. */
		onSolidRatio: number;
	};

	constructor(role: FamilyRole, mode: ColorMode, bestAttempt: ScaleGenerationError['bestAttempt']) {
		super(
			`Cannot generate the ${mode} "${role}" family: no solid lightness in the search band lets ` +
				'near-white or near-black on-solid text clear 4.5:1 across the solid and its hover ' +
				`(best attempt reached ${bestAttempt.onSolidRatio.toFixed(2)}:1 at lightness ` +
				`${bestAttempt.lightness.toFixed(3)}). Author an explicit, more accessible source colour.`,
		);
		this.role = role;
		this.mode = mode;
		this.bestAttempt = bestAttempt;
		this.name = 'ScaleGenerationError';
	}
}

// The WCAG 2.2 AA text ratio the on-solid gate must clear. Matches build-theme's TEXT_RATIO so the
// solid-anchor search agrees with the (later) build-time validation.
const TEXT_RATIO = 4.5;
// Solve slightly past the target so 4-decimal OKLCH emission cannot round a passing pair below it.
const RATIO_HEADROOM = 0.05;

/**
 * The OKLab ΔE floor between consecutive component states (steps 3-4 and 4-5). The muted ramp's
 * fixed lightness deltas clear this comfortably for every role, including near-achromatic neutrals.
 */
export const MIN_STATE_DELTA = 0.015;

// Steps 1-8 form a "muted ramp": lightness walks away from the background toward the solid by fixed
// absolute offsets (so component-state distinctness never depends on the anchor lightness), while
// chroma grows from a faint tint to near the solid. `offset` is an absolute OKLCH lightness delta
// from the background (its sign is set by the mode: darker in light mode, lighter in dark mode);
// `chromaFraction` scales the source chroma and `chromaCap` caps it so the pale near-background
// steps stay tinted rather than saturated.
interface RampRungSpec {
	offset: number;
	chromaFraction: number;
	chromaCap: number;
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

// The solid step 10 (hover) offset from step 9: darker in light mode, lighter in dark mode.
const SOLID_HOVER_DELTA = 0.05;
const SOLID_SEARCH_STEP = 0.0025;

interface SolidBand {
	/** The lightness the search prefers when it clears the gate. */
	target: number;
	/** The inclusive lightness range the search may explore. */
	band: [number, number];
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

// Text lightness targets: step 11 (low contrast) and step 12 (high contrast). Step 12 is a
// scale-quality rung only — no semantic leaf consumes a high-contrast contract guarantee yet. Light
// `low` sits at 0.49 (not 0.5) so step 11 keeps a small AA margin over the pressed subtle surface
// (step 5) even for the highest-luminance hues — accent/danger text is mapped onto that subtle trio.
const TEXT_LIGHTNESS = {
	dark: { high: 0.94, low: 0.76 },
	light: { high: 0.3, low: 0.49 },
} as const satisfies Record<ColorMode, { low: number; high: number }>;
const TEXT_LOW_CHROMA_FRACTION = 0.55;
const TEXT_LOW_CHROMA_CAP = 0.13;
const TEXT_HIGH_CHROMA_FRACTION = 0.45;
const TEXT_HIGH_CHROMA_CAP = 0.1;

// The near-white and near-black candidates the on-solid gate chooses between, mirroring build-theme.
const ON_SOLID_WHITE_LIGHTNESS = 0.985;
const ON_SOLID_BLACK_LIGHTNESS = 0.18;
const ON_SOLID_BLACK_CHROMA = 0.01;

/**
 * Generates the 12-step OKLCH family plus its on-solid `contrast` colour for a role. Owns the
 * constrained solid-anchor search internally; throws {@link ScaleGenerationError} (carrying `role`
 * and `mode`) when a `needsOnSolid` role cannot reach an accessible solid.
 */
export function generateFamily(request: GenerateFamilyRequest): ScaleFamily {
	return buildFamily(request).family;
}

/**
 * Generates a family together with its family-level {@link FamilyDiagnostics}: the resolved solid
 * anchor (authored vs resolved lightness, whether it was adapted for on-solid, achieved ratios),
 * the on-solid choice, and any gamut-driven chroma reductions.
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
	const requirements = FAMILY_REQUIREMENTS[role];
	const hue = source.h;
	const direction = mode === 'light' ? -1 : 1;
	const backgroundLightness = clampUnit(background.l);
	const reductions: Array<GamutReduction> = [];

	const rung = (step: ScaleStep, lightness: number, requestedChroma: number): Oklch => {
		const mapped = gamutMapOklch({
			c: Math.max(requestedChroma, 0),
			h: hue,
			l: clampUnit(lightness),
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
			(index + 1) as ScaleStep,
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

	// Step 9: the solid anchor, searched only when the role must guarantee on-solid contrast.
	const anchor = resolveSolidAnchor(request, requirements);
	const solid = rung(9, anchor.lightness, source.c);
	const solidHover = rung(10, anchor.lightness + direction * SOLID_HOVER_DELTA, source.c);

	// The on-solid text: the better of near-white / near-black across the solid and its hover.
	const onSolid = chooseOnSolid(hue, [solid, solidHover]);

	// Steps 11-12: text rungs. Step 12 is a scale-quality rung, not a contract guarantee.
	const text = TEXT_LIGHTNESS[mode];
	const lowText = rung(
		11,
		text.low,
		Math.min(source.c * TEXT_LOW_CHROMA_FRACTION, TEXT_LOW_CHROMA_CAP),
	);
	const highText = rung(
		12,
		text.high,
		Math.min(source.c * TEXT_HIGH_CHROMA_FRACTION, TEXT_HIGH_CHROMA_CAP),
	);

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
		10: solidHover,
		11: lowText,
		12: highText,
		contrast: onSolid.color,
	};

	const solidAnchor: SolidAnchorDiagnostics = {
		adaptedForOnSolid: anchor.adapted,
		band: anchor.band,
		onSolidRatioSolid: contrastRatio(onSolid.color, solid),
		onSolidRatioSolidHover: contrastRatio(onSolid.color, solidHover),
		resolvedLightness: anchor.lightness,
		satisfied: !requirements.needsOnSolid || onSolid.minRatio >= TEXT_RATIO,
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
			ratioSolidHover: solidAnchor.onSolidRatioSolidHover,
		},
		requirements,
		role,
		solidAnchor,
		source,
	};

	return { diagnostics, family };
}

interface ResolvedAnchor {
	lightness: number;
	target: number;
	band: [number, number];
	adapted: boolean;
}

/**
 * Resolves the step-9 solid lightness. Feedback roles (`needsOnSolid: false`) take their source
 * lightness verbatim as a pure geometric anchor — never distorted for an unused guarantee. Roles
 * that must guarantee on-solid contrast search their solid band for a lightness whose solid and
 * hover both clear the on-solid gate, preferring the lightness nearest the source (vibrant) or the
 * curated target (neutral), and throwing when none clears.
 */
function resolveSolidAnchor(
	request: GenerateFamilyRequest,
	requirements: FamilyRequirements,
): ResolvedAnchor {
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

	if (!requirements.needsOnSolid) {
		// Geometric anchor only: honour the source lightness exactly, gamut mapping aside.
		return { adapted: false, band, lightness: clampUnit(source.l), target: source.l };
	}

	const direction = mode === 'light' ? -1 : 1;
	const preferred = clamp(target, low, high);
	const gateRatio = (lightness: number): number => {
		const solid = gamutMapOklch({ c: source.c, h: source.h, l: clampUnit(lightness) });
		const hover = gamutMapOklch({
			c: source.c,
			h: source.h,
			l: clampUnit(lightness + direction * SOLID_HOVER_DELTA),
		});
		return chooseOnSolid(source.h, [solid, hover]).minRatio;
	};
	const passes = (lightness: number): boolean =>
		gateRatio(lightness) >= TEXT_RATIO + RATIO_HEADROOM;

	if (passes(preferred)) {
		return { adapted: false, band, lightness: preferred, target };
	}

	let best: number | null = null;
	let bestDistance = Number.POSITIVE_INFINITY;
	let bestAttemptLightness = preferred;
	let bestAttemptRatio = gateRatio(preferred);
	const stepCount = Math.round((high - low) / SOLID_SEARCH_STEP);
	for (let index = 0; index <= stepCount; index++) {
		const lightness = low + index * SOLID_SEARCH_STEP;
		const ratio = gateRatio(lightness);
		if (ratio > bestAttemptRatio) {
			bestAttemptRatio = ratio;
			bestAttemptLightness = lightness;
		}
		if (ratio < TEXT_RATIO + RATIO_HEADROOM) continue;
		const distance = Math.abs(lightness - preferred);
		if (distance < bestDistance) {
			bestDistance = distance;
			best = lightness;
		}
	}
	if (best === null) {
		const solid = gamutMapOklch({ c: source.c, h: source.h, l: clampUnit(bestAttemptLightness) });
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
 * higher minimum contrast across the given solids. Mirrors build-theme's `chooseOnSolid`.
 */
function chooseOnSolid(hue: number, solids: Array<Oklch>): { color: Oklch; minRatio: number } {
	const nearWhite = gamutMapOklch({ c: 0, h: hue, l: ON_SOLID_WHITE_LIGHTNESS });
	const nearBlack = gamutMapOklch({
		c: ON_SOLID_BLACK_CHROMA,
		h: hue,
		l: ON_SOLID_BLACK_LIGHTNESS,
	});
	const whiteMinimum = minimumRatio(nearWhite, solids);
	const blackMinimum = minimumRatio(nearBlack, solids);
	if (whiteMinimum >= TEXT_RATIO + RATIO_HEADROOM)
		return { color: nearWhite, minRatio: whiteMinimum };
	if (blackMinimum >= TEXT_RATIO + RATIO_HEADROOM)
		return { color: nearBlack, minRatio: blackMinimum };
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

function clampUnit(value: number): number {
	return clamp(value, 0, 1);
}
