import type { Oklch } from './color.js';
import { gamutMapOklch } from './color.js';

/** The colour mode a set of surfaces is generated for. */
export type ElevationMode = 'light' | 'dark';

/**
 * The four surface colours a theme mode emits, keyed by elevation. `canvas` is the resolved
 * background anchor itself; the remaining three are derived from it.
 */
export interface GeneratedSurfaces {
	/** The page canvas. Always equal to the `background` input — canvas IS the background. */
	canvas: Oklch;
	/** A well recessed below the canvas (dark: darker than canvas; light: neutral white). */
	recessed: Oklch;
	/** A surface that lifts off the canvas, such as a card or menu. */
	floating: Oklch;
	/** The most separated surface, such as a modal or popover. */
	overlay: Oklch;
}

/** Input to {@link generateSurfaces}. */
export interface GenerateSurfacesRequest {
	/** The resolved canvas anchor colour for this mode. */
	background: Oklch;
	/** The colour mode being generated. */
	mode: ElevationMode;
}

// Surface roles encode usage directly: light wells use neutral white, dark wells sit below the
// canvas, and detached surfaces separate more strongly without exposing generated palette steps.
// Mirrors the deltas `buildModeColors` in build-theme.ts uses today (minus the hidden `resting`
// rung, which has no public semantic meaning and is dropped here).
const LIGHT_RECESSED_SURFACE = { c: 0, h: 0, l: 1 } as const satisfies Oklch;
const DARK_RECESSED_SURFACE_LIGHTNESS_DELTA = -0.025;
const SURFACE_LIGHTNESS_DELTAS = {
	dark: { floating: 0.07, overlay: 0.09 },
	light: { floating: 0.012, overlay: 0.015 },
} as const satisfies Record<ElevationMode, Record<'floating' | 'overlay', number>>;

/**
 * Derives the mode-aware elevation surface set from a resolved background canvas anchor.
 * `surfaces.canvas` is always exactly the `background` input. `recessed`, `floating`, and
 * `overlay` are mode-aware lightness offsets from the canvas, preserving today's relationships:
 * dark mode separates surfaces by lightening them above the canvas (recessed is the one
 * exception, sitting slightly darker); light mode keeps `recessed` at neutral white and
 * separates `floating`/`overlay` from the canvas only slightly. Colour-only: does not read or
 * emit `depth`/`actionControlFinish` shadow strings, and does not alias onto any functional
 * colour scale.
 */
export function generateSurfaces(request: GenerateSurfacesRequest): GeneratedSurfaces {
	const { background: canvas, mode } = request;
	const isLight = mode === 'light';
	const surfaceAt = (delta: number) => gamutMapOklch({ ...canvas, l: clampUnit(canvas.l + delta) });
	const deltas = SURFACE_LIGHTNESS_DELTAS[mode];
	return {
		canvas,
		floating: surfaceAt(deltas.floating),
		overlay: surfaceAt(deltas.overlay),
		recessed: isLight ? LIGHT_RECESSED_SURFACE : surfaceAt(DARK_RECESSED_SURFACE_LIGHTNESS_DELTA),
	};
}

function clampUnit(value: number): number {
	return Math.min(1, Math.max(0, value));
}
