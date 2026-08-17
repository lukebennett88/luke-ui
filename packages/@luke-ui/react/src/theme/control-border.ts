/**
 * Solves `color.border.control`, the dedicated contrast boundary for form controls. It searches
 * OKLCH lightness for a value that clears the non-text gate, which is colour generation, so it sits
 * with `scale.ts` and `elevation.ts` rather than with the mapping. `semantic-map.ts` only passes the
 * resolved value through.
 */

import type { Oklch } from './color.js';
import { contrastRatio, gamutMapOklch } from './color.js';
import { RATIO_HEADROOM, UI_RATIO } from './contrast-policy.js';
import { lightnessCandidates } from './lightness-candidates.js';
import type { ScaleFamily } from './scale.js';
import { FAMILY_RUNG } from './scale.js';

type ColorMode = 'light' | 'dark';

/** The inputs to {@link solveControlBorder}. */
interface SolveControlBorderRequest {
	/** The canvas surface the boundary is gated against. */
	canvas: Oklch;
	/** The colour mode being solved for. */
	mode: ColorMode;
	/** The generated neutral family for this mode, whose semantic border rung seeds the search. */
	neutral: ScaleFamily;
	/** The recessed surface the boundary is gated against. */
	recessed: Oklch;
}

/**
 * Solves `color.border.control` as a dedicated contrast boundary, rather than a subtle step-7
 * alias: the semantic border and muted rungs land at roughly 1.6-2.7:1 against the base surfaces,
 * well short of the 3:1 non-text gate. Starting from {@link FAMILY_RUNG.border}'s own lightness
 * (its hue and a low, neutral chroma), the search steps in the higher-contrast direction, darker in
 * light mode and lighter in dark mode, until the candidate clears 3:1 (plus headroom) against both
 * `canvas` and `recessed`, gated on whichever of the two currently has the lower contrast. It stops
 * at the first clearing lightness, so the result deviates from the border-rung aesthetic by the
 * minimum needed to reach the boundary. Lightness is clamped to [0, 1]; a neutral hue always
 * reaches the target within range.
 */
export function solveControlBorder(params: SolveControlBorderRequest): Oklch {
	const { neutral, canvas, recessed, mode } = params;
	const seed = neutral[FAMILY_RUNG.border];
	const target = UI_RATIO + RATIO_HEADROOM;
	const worstRatio = (candidate: Oklch) => {
		return Math.min(contrastRatio(candidate, canvas), contrastRatio(candidate, recessed));
	};

	let resolved: Oklch | undefined;
	for (const lightness of lightnessCandidates(seed.l, mode === 'light' ? 0 : 1)) {
		const candidate = gamutMapOklch({
			l: lightness,
			c: seed.c,
			h: seed.h,
		});
		resolved = candidate;
		if (worstRatio(candidate) >= target) return candidate;
	}
	return (
		resolved ??
		gamutMapOklch({
			l: seed.l,
			c: seed.c,
			h: seed.h,
		})
	);
}
