/**
 * Solves `color.border.control`, the dedicated contrast boundary for form controls. It searches
 * OKLCH lightness for a value that clears the non-text gate, which is colour generation, so it sits
 * with `scale.ts` and `elevation.ts` rather than with the mapping. `semantic-map.ts` only passes the
 * resolved value through.
 */

import type { Oklch } from './color.js';
import { clampUnit, contrastRatio, gamutMapOklch } from './color.js';
import { CONTRAST_SEARCH_STEP, RATIO_HEADROOM, UI_RATIO } from './contrast-policy.js';
import type { ScaleFamily } from './scale.js';

type ColorMode = 'light' | 'dark';

/** The inputs to {@link solveControlBorder}. */
interface SolveControlBorderRequest {
	/** The canvas surface the boundary is gated against. */
	canvas: Oklch;
	/** The colour mode being solved for. */
	mode: ColorMode;
	/** The generated neutral family for this mode, whose border rung seeds the search. */
	neutral: ScaleFamily;
	/** The recessed surface the boundary is gated against. */
	recessed: Oklch;
}

/**
 * Solves `color.border.control` as a dedicated contrast boundary, rather than a family-border
 * alias: the muted border and mid rungs land short of the 3:1 non-text gate. Starting from the
 * border rung's lightness, the search steps in the higher-contrast direction until the candidate
 * clears 3:1 (plus headroom) against both `canvas` and `recessed`. Lightness is clamped to [0, 1];
 * a neutral hue always reaches the target within range.
 */
export function solveControlBorder(params: SolveControlBorderRequest): Oklch {
	const { neutral, canvas, recessed, mode } = params;
	const seed = neutral.border;
	const direction = mode === 'light' ? -1 : 1;
	const target = UI_RATIO + RATIO_HEADROOM;
	const worstRatio = (candidate: Oklch) => {
		return Math.min(contrastRatio(candidate, canvas), contrastRatio(candidate, recessed));
	};

	let lightness = seed.l;
	for (;;) {
		const clamped = clampUnit(lightness);
		const candidate = gamutMapOklch({
			l: clamped,
			c: seed.c,
			h: seed.h,
		});
		if (worstRatio(candidate) >= target || clamped === 0 || clamped === 1) return candidate;
		lightness = clamped + direction * CONTRAST_SEARCH_STEP;
	}
}
