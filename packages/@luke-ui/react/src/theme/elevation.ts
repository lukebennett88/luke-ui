import type { Oklch } from './color.js';
import { clampUnit, gamutMapOklch } from './color.js';

/** The colour mode a set of surfaces is generated for. */
type ElevationMode = 'light' | 'dark';

/**
 * The three surface colours a theme mode emits, keyed by elevation. `canvas` is the resolved
 * background anchor itself; the other two are derived from it.
 */
export interface GeneratedSurfaces {
	/** The page canvas. Always equal to the `background` input — canvas IS the background. */
	canvas: Oklch;
	/** A surface that lifts off the canvas, such as a card, menu, dialog, or popover. */
	floating: Oklch;
	/** A well recessed below the canvas (dark: darker than canvas; light: neutral white). */
	recessed: Oklch;
}

/** Input to {@link generateSurfaces}. */
export interface GenerateSurfacesRequest {
	/** The resolved canvas anchor colour for this mode. */
	background: Oklch;
	/** The colour mode being generated. */
	mode: ElevationMode;
}

const LIGHT_RECESSED_SURFACE = {
	l: 1,
	c: 0,
	h: 0,
} as const satisfies Oklch;
const DARK_RECESSED_SURFACE_LIGHTNESS_DELTA = -0.025;
const FLOATING_LIGHTNESS_DELTA = {
	dark: 0.07,
	light: 0.012,
} as const satisfies Record<ElevationMode, number>;

/**
 * Derives the mode-aware elevation surface set from a resolved background canvas anchor.
 * `surfaces.canvas` is always exactly the `background` input. `recessed` and `floating` are
 * mode-aware lightness offsets from the canvas. Colour-only: does not read or emit
 * `depth`/`actionControlFinish` shadow strings.
 */
export function generateSurfaces(request: GenerateSurfacesRequest): GeneratedSurfaces {
	const { background: canvas, mode } = request;
	const isLight = mode === 'light';
	const surfaceAt = (delta: number) => gamutMapOklch({ ...canvas, l: clampUnit(canvas.l + delta) });
	return {
		canvas,
		floating: surfaceAt(FLOATING_LIGHTNESS_DELTA[mode]),
		recessed: isLight ? LIGHT_RECESSED_SURFACE : surfaceAt(DARK_RECESSED_SURFACE_LIGHTNESS_DELTA),
	};
}
