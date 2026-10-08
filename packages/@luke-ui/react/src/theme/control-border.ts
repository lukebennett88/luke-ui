/**
 * Solves `color.border.control`, the dedicated contrast boundary for form controls, and derives
 * `color.border.controlHover` from it. The resting search walks OKLCH lightness for a value that
 * clears the non-text gate, which is colour generation, so it sits with `scale.ts` and
 * `surfaces.ts` rather than with the mapping. `semantic-map.ts` only passes the resolved values
 * through.
 */

import type { Oklch } from './color.js';
import { clampUnit, contrastRatio, gamutMapOklch } from './color.js';
import { RATIO_HEADROOM, UI_RATIO } from './contrast-policy.js';
import { lightnessCandidates } from './lightness-candidates.js';
import type { ScaleFamily } from './scale.js';
import { FAMILY_RUNG } from './scale.js';

type ColorMode = 'light' | 'dark';

/** The inputs to {@link solveControlBorder}. */
interface SolveControlBorderRequest {
	/** The colour mode being solved for. */
	mode: ColorMode;
	/** The generated neutral family for this mode, whose semantic border rung seeds the search. */
	neutral: ScaleFamily;
	/** The surfaces a control sits on, which the boundary is gated against: base, field, overlay. */
	surfaces: ReadonlyArray<Oklch>;
}

/**
 * Solves `color.border.control` as a dedicated contrast boundary, rather than a subtle step-7
 * alias: the semantic border and muted rungs land at roughly 1.6-2.7:1 against the surfaces, well
 * short of the 3:1 non-text gate. Starting from {@link FAMILY_RUNG.border}'s own lightness (its hue
 * and a low, neutral chroma), the search steps in the higher-contrast direction, darker in light
 * mode and lighter in dark mode, until the candidate clears 3:1 (plus headroom) against every
 * surface a control sits on, gated on whichever currently has the lowest contrast. It stops at the
 * first clearing lightness, so the result deviates from the border-rung aesthetic by the minimum
 * needed to reach the boundary. Lightness is clamped to [0, 1]. When no lightness clears the gate,
 * it returns the last candidate and validation reports the failure.
 */
export function solveControlBorder(params: SolveControlBorderRequest): Oklch {
	const { neutral, surfaces, mode } = params;
	const seed = neutral[FAMILY_RUNG.border];
	const target = UI_RATIO + RATIO_HEADROOM;
	function worstRatio(candidate: Oklch) {
		return Math.min(...surfaces.map((surface) => contrastRatio(candidate, surface)));
	}

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

// The hovered boundary moves away from the surfaces by a fixed, tuned amount. It is not searched:
// its only guarantee is the same 3:1 gate as the resting border, which validation measures.
const CONTROL_HOVER_LIGHTNESS_OFFSET = {
	dark: 0.12,
	light: -0.12,
} as const satisfies Record<ColorMode, number>;

/** Derives `color.border.controlHover` from the resolved resting control border. */
export function controlHoverBorder(controlBorder: Oklch, mode: ColorMode): Oklch {
	return gamutMapOklch({
		...controlBorder,
		l: clampUnit(controlBorder.l + CONTROL_HOVER_LIGHTNESS_OFFSET[mode]),
	});
}
