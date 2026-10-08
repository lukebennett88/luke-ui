import type { Oklch } from './color.js';
import { clampUnit, gamutMapOklch } from './color.js';
import type { SurfaceRole, ThemeSurfaceSources } from './foundation.js';

/** The colour mode a set of surfaces is generated for. */
type SurfaceMode = 'light' | 'dark';

/** The four surface colours a theme mode emits, keyed by role. */
export type GeneratedSurfaces = Record<SurfaceRole, Oklch>;

/** Input to {@link generateSurfaces}. */
export interface GenerateSurfacesRequest {
	/** The colour mode being generated. */
	mode: SurfaceMode;
	/** The resolved base surface, plus any surface the author set explicitly. */
	surface: ThemeSurfaceSources;
}

// Each missing surface is a fixed lightness offset from `base`, never from a sibling surface. Light
// mode keeps fields on the base and lifts overlays to near-white. Dark mode sinks fields and
// secondary regions below the base and lifts overlays well above it. Generated surfaces are never
// adjusted for contrast: validation throws instead, and the author can set the surface explicitly.
const SURFACE_LIGHTNESS_OFFSETS = {
	dark: { field: -0.025, overlay: 0.07, subdued: -0.03 },
	light: { field: 0, overlay: 0.015, subdued: -0.02 },
} as const satisfies Record<SurfaceMode, Record<Exclude<SurfaceRole, 'base'>, number>>;

/**
 * Resolves the four surfaces for one mode. `base` and any authored surface pass through as written.
 * Every other surface is the base moved by a fixed, mode-specific lightness offset, keeping the
 * base's hue and chroma.
 */
export function generateSurfaces(request: GenerateSurfacesRequest): GeneratedSurfaces {
	const { mode, surface } = request;
	const { base } = surface;
	const offsets = SURFACE_LIGHTNESS_OFFSETS[mode];
	function resolve(role: Exclude<SurfaceRole, 'base'>) {
		return surface[role] ?? gamutMapOklch({ ...base, l: clampUnit(base.l + offsets[role]) });
	}
	return {
		base,
		field: resolve('field'),
		overlay: resolve('overlay'),
		subdued: resolve('subdued'),
	};
}
