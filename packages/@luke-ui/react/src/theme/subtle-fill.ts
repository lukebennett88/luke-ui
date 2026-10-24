/**
 * Generates a role's translucent subtle fills: one tint colour per role, at a rising alpha for rest,
 * hover, and pressed. A translucent fill keeps the same visual weight on every surface it sits on,
 * where an opaque fill tuned against `surface.base` crosses a lighter or darker surface.
 *
 * The fit reproduces the role's opaque subtle colours, its {@link SubtleFillTargets}, over
 * `surface.base`, matching their lightness first. Compositing matches the browser, a per-channel
 * blend in gamma-encoded sRGB, and every difference is measured in OKLab. The tint is the most
 * distant in-gamut colour along the direction the targets move away from `base`, so its alpha stays
 * as small as possible and the fill changes each surface by nearly the same amount.
 */

import type { Oklch, SrgbTriple } from './color.js';
import {
	compositeOver,
	formatOklch,
	gamutMapOklch,
	oklabDistance,
	oklchToSrgb,
	parseColor,
	srgbToOklch,
} from './color.js';
import { SUBTLE_FILL_MIN_STEP, SUBTLE_FILL_STEP_FLOOR } from './contrast-policy.js';
import type { SubtleFillDiagnostics, SubtleFillLayer, WeakSubtleFillStep } from './diagnostics.js';
import { SURFACE_ROLES } from './foundation.js';
import type { ScaleFamily } from './scale.js';
import {
	FAMILY_RUNG,
	INTERACTION_HOVER_STRENGTH,
	INTERACTION_PRESSED_STRENGTH,
	mixInteractionState,
} from './scale.js';
import type { GeneratedSurfaces } from './surfaces.js';

/** The interaction states a subtle fill publishes, in the order their weight rises. */
export const SUBTLE_FILL_STATES = ['rest', 'hover', 'pressed'] as const;

/** One of {@link SUBTLE_FILL_STATES}. */
export type SubtleFillState = (typeof SUBTLE_FILL_STATES)[number];

/** The opaque colour each state should look like when its fill sits on `surface.base`. */
export type SubtleFillTargets = Record<SubtleFillState, Oklch>;

/** A generated translucent fill: one tint colour and the alpha each state paints it at. */
export interface SubtleFill {
	/** Each state's alpha, rounded to the precision `formatOklch` emits. */
	alpha: Record<SubtleFillState, number>;
	/** The opaque tint colour, rounded and gamut-mapped as emitted. */
	tint: Oklch;
}

/**
 * A role's opaque subtle colours, the fit's targets: the family's subtle rung at rest, mixed toward
 * `text.primary` at the fixed interaction strengths for hover and pressed.
 */
export function subtleFillTargets(family: ScaleFamily, textPrimary: Oklch): SubtleFillTargets {
	const rest = family[FAMILY_RUNG.subtle];
	return {
		rest,
		hover: mixInteractionState(rest, textPrimary, INTERACTION_HOVER_STRENGTH),
		pressed: mixInteractionState(rest, textPrimary, INTERACTION_PRESSED_STRENGTH),
	};
}

/** The inputs to {@link generateSubtleFill}. */
export interface GenerateSubtleFillRequest {
	/** The four resolved surfaces. The fit targets `base`. Order and steps are kept on all four. */
	surfaces: GeneratedSurfaces;
	/** The opaque colours each state reproduces over `surface.base`. */
	targets: SubtleFillTargets;
}

// `formatOklch` emits alpha to three decimals, so the fit searches that grid directly.
const ALPHA_GRID = 1000;

/**
 * Fits one role's tint and per-state alpha to its opaque targets over `surface.base`, then raises
 * any state whose step from the one before it misses {@link SUBTLE_FILL_MIN_STEP} on a standard
 * surface. Because every state paints the same tint, rising alpha keeps the states ordered by
 * distance from each surface.
 */
export function generateSubtleFill(request: GenerateSubtleFillRequest): SubtleFillDiagnostics {
	const { surfaces, targets } = request;
	const base = surfaces.base;
	const tint = fitTint(base, targets);
	const alpha = {} as Record<SubtleFillState, number>;
	const raised: Array<SubtleFillState> = [];
	let previous = 0;
	for (const state of SUBTLE_FILL_STATES) {
		const fitted = fitAlpha(base, tint, targets[state]);
		const kept = keepMinimumStep(surfaces, tint, previous, fitted);
		if (kept > fitted) raised.push(state);
		alpha[state] = kept;
		previous = kept;
	}

	const residual = {} as Record<SubtleFillState, number>;
	for (const state of SUBTLE_FILL_STATES) {
		residual[state] = oklabDistance(compositeOver(base, tint, alpha[state]), targets[state]);
	}
	const layers = {} as SubtleFillDiagnostics['layers'];
	const weakSteps: Array<WeakSubtleFillStep> = [];
	for (const surface of SURFACE_ROLES) {
		layers[surface] = measureLayers(surfaces[surface], tint, alpha);
		for (const state of SUBTLE_FILL_STATES) {
			const { step } = layers[surface][state];
			if (step < SUBTLE_FILL_STEP_FLOOR) weakSteps.push({ state, step, surface });
		}
	}
	return { alpha, layers, raised, residual, targets, tint, weakSteps };
}

/** Composites each state's fill over `surface` and measures its distance and step. */
function measureLayers(
	surface: Oklch,
	tint: Oklch,
	alpha: Record<SubtleFillState, number>,
): Record<SubtleFillState, SubtleFillLayer> {
	const layers = {} as Record<SubtleFillState, SubtleFillLayer>;
	let previous = surface;
	for (const state of SUBTLE_FILL_STATES) {
		const color = compositeOver(surface, tint, alpha[state]);
		layers[state] = {
			color,
			distance: oklabDistance(color, surface),
			step: oklabDistance(color, previous),
		};
		previous = color;
	}
	return layers;
}

/**
 * The tint the fills share. The targets' offsets from `base` in gamma-encoded sRGB are fitted to one
 * direction, the line every composite of a single tint lies on, and the tint is where that direction
 * leaves the sRGB cube. The result is rounded the way it is emitted, so the alpha fit sees the
 * colour the browser paints.
 */
function fitTint(base: Oklch, targets: SubtleFillTargets): Oklch {
	const origin = oklchToSrgb(base);
	const offsets = SUBTLE_FILL_STATES.map((state) => {
		return subtract(oklchToSrgb(targets[state]), origin);
	});
	const direction = dominantDirection(offsets) ?? fallbackDirection(origin);
	const edge = add(origin, scale(direction, distanceToCubeEdge(origin, direction)));
	return gamutMapOklch(parseColor(formatOklch(gamutMapOklch(srgbToOklch(edge)))));
}

/**
 * The alpha on the emitted grid whose composite over `base` matches the target's OKLab lightness,
 * with OKLab distance breaking ties. Text contrast follows lightness, so the fit keeps it and lets
 * chroma carry the residual a single tint cannot avoid. The smallest alpha the grid emits is the
 * floor, so a fill never disappears.
 */
function fitAlpha(base: Oklch, tint: Oklch, target: Oklch): number {
	let best = 1;
	let bestLightness = Number.POSITIVE_INFINITY;
	let bestDistance = Number.POSITIVE_INFINITY;
	for (let step = 1; step <= ALPHA_GRID; step++) {
		const candidate = step / ALPHA_GRID;
		const painted = compositeOver(base, tint, candidate);
		const lightness = Math.abs(painted.l - target.l);
		if (lightness > bestLightness) continue;
		const distance = oklabDistance(painted, target);
		if (lightness < bestLightness || distance < bestDistance) {
			best = candidate;
			bestLightness = lightness;
			bestDistance = distance;
		}
	}
	return best;
}

/**
 * Raises `alpha` until its composite sits at least {@link SUBTLE_FILL_MIN_STEP} from the previous
 * state's composite (or from the bare surface) on every standard surface. Never lowers it, and stops
 * at full opacity.
 */
function keepMinimumStep(
	surfaces: GeneratedSurfaces,
	tint: Oklch,
	previousAlpha: number,
	alpha: number,
): number {
	let step = Math.max(Math.round(alpha * ALPHA_GRID), Math.round(previousAlpha * ALPHA_GRID) + 1);
	while (step < ALPHA_GRID) {
		const candidate = step / ALPHA_GRID;
		const clears = SURFACE_ROLES.every((role) => {
			const surface = surfaces[role];
			const before = compositeOver(surface, tint, previousAlpha);
			return oklabDistance(compositeOver(surface, tint, candidate), before) >= SUBTLE_FILL_MIN_STEP;
		});
		if (clears) break;
		step++;
	}
	return Math.min(step, ALPHA_GRID) / ALPHA_GRID;
}

/**
 * The unit direction that best fits every offset in the least-squares sense: the dominant
 * eigenvector of the offsets' uncentred scatter, pointed the way the fills move. `null` when every
 * offset is zero.
 */
function dominantDirection(offsets: Array<SrgbTriple>): SrgbTriple | null {
	const scatter: [SrgbTriple, SrgbTriple, SrgbTriple] = [
		[0, 0, 0],
		[0, 0, 0],
		[0, 0, 0],
	];
	let vector: SrgbTriple = [0, 0, 0];
	for (const offset of offsets) {
		for (const row of [0, 1, 2] as const) {
			for (const column of [0, 1, 2] as const) scatter[row][column] += offset[row] * offset[column];
		}
		if (dot(offset, offset) > dot(vector, vector)) vector = offset;
	}
	if (dot(vector, vector) === 0) return null;
	for (let iteration = 0; iteration < 64; iteration++) {
		vector = normalize([dot(scatter[0], vector), dot(scatter[1], vector), dot(scatter[2], vector)]);
	}
	let heading = 0;
	for (const offset of offsets) heading += dot(offset, vector);
	return heading < 0 ? scale(vector, -1) : vector;
}

/** With nothing to fit, move toward black on a light base and toward white on a dark one. */
function fallbackDirection(origin: SrgbTriple): SrgbTriple {
	const towardWhite = origin[0] + origin[1] + origin[2] < 1.5;
	return normalize(towardWhite ? subtract([1, 1, 1], origin) : scale(origin, -1));
}

/** How far `origin` can travel along the unit `direction` before a channel leaves 0 to 1. */
function distanceToCubeEdge(origin: SrgbTriple, direction: SrgbTriple): number {
	let reach = Number.POSITIVE_INFINITY;
	for (let channel = 0; channel < 3; channel++) {
		const heading = direction[channel]!;
		const position = origin[channel]!;
		if (heading > 0) reach = Math.min(reach, (1 - position) / heading);
		if (heading < 0) reach = Math.min(reach, -position / heading);
	}
	return Number.isFinite(reach) ? reach : 0;
}

function add(a: SrgbTriple, b: SrgbTriple): SrgbTriple {
	return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function subtract(a: SrgbTriple, b: SrgbTriple): SrgbTriple {
	return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(a: SrgbTriple, factor: number): SrgbTriple {
	return [a[0] * factor, a[1] * factor, a[2] * factor];
}

function dot(a: SrgbTriple, b: SrgbTriple): number {
	return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function normalize(a: SrgbTriple): SrgbTriple {
	const length = Math.sqrt(dot(a, a));
	return length === 0 ? a : scale(a, 1 / length);
}
