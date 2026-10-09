/**
 * Solves `color.border.control`, the contrast boundary for form controls, and derives
 * `color.border.controlHover` from it.
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
	/** The generated neutral family for this mode. Its border rung seeds the search. */
	neutral: ScaleFamily;
	/** The surfaces the boundary must clear. */
	surfaces: ReadonlyArray<Oklch>;
}

/**
 * The neutral border rung lands at roughly 1.6–2.7:1 against the surfaces, short of the 3:1 non-text
 * minimum. Starting from that rung, the search moves lightness away from the surfaces (darker in
 * light mode, lighter in dark mode) and stops at the first value that clears 3:1, plus headroom,
 * against every surface. When none does, it returns the last candidate and validation reports the
 * failure.
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

// A fixed, tuned step further from the surfaces. Validation holds it to the same 3:1 as the resting
// border; how distinct it looks is a visual decision, not a searched one.
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
