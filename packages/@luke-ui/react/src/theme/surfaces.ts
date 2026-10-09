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

// Offsets from `base`, never from a sibling surface. Generated surfaces are never adjusted for
// contrast: validation throws instead, and the author sets the surface explicitly.
const SURFACE_LIGHTNESS_OFFSETS = {
	dark: { field: -0.025, overlay: 0.07, subdued: -0.03 },
	light: { field: 0, overlay: 0.015, subdued: -0.02 },
} as const satisfies Record<SurfaceMode, Record<Exclude<SurfaceRole, 'base'>, number>>;

/**
 * Resolves the four surfaces for one mode. `base` and authored surfaces pass through. Each other
 * surface is `base` with its lightness moved by a fixed offset.
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
