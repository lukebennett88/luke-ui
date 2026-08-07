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
	/** The generated neutral family for this mode, whose step 7 seeds the search. */
	neutral: ScaleFamily;
	/** The canvas surface the boundary is gated against. */
	canvas: Oklch;
	/** The recessed surface the boundary is gated against. */
	recessed: Oklch;
	/** The colour mode being solved for. */
	mode: ColorMode;
}

/**
 * Solves `color.border.control` as a dedicated contrast boundary, rather than a subtle step-7
 * alias: neutral steps 7-8 land at roughly 1.6-2.7:1 against the base surfaces, well
 * short of the 3:1 non-text gate. Starting from step 7's own lightness (its hue and a low, neutral
 * chroma), the search steps in the higher-contrast direction, darker in light mode and lighter in
 * dark mode, until the candidate clears 3:1 (plus headroom) against both `canvas` and `recessed`,
 * gated on whichever of the two currently has the lower contrast. It stops at the first clearing
 * lightness, so the result deviates from the step-7 aesthetic by the minimum needed to reach the
 * boundary. Lightness is clamped to [0, 1]; a neutral hue always reaches the target within range.
 */
export function solveControlBorder(params: SolveControlBorderRequest): Oklch {
	const { neutral, canvas, recessed, mode } = params;
	const seed = neutral[7];
	const direction = mode === 'light' ? -1 : 1;
	const target = UI_RATIO + RATIO_HEADROOM;
	const worstRatio = (candidate: Oklch) =>
		Math.min(contrastRatio(candidate, canvas), contrastRatio(candidate, recessed));

	let lightness = seed.l;
	for (;;) {
		const clamped = clampUnit(lightness);
		const candidate = gamutMapOklch({ c: seed.c, h: seed.h, l: clamped });
		if (worstRatio(candidate) >= target || clamped === 0 || clamped === 1) return candidate;
		lightness = clamped + direction * CONTRAST_SEARCH_STEP;
	}
}
