/**
 * The `color.border.control` solver. It is colour generation, not compilation: like `scale.ts` and
 * `elevation.ts` it runs a real OKLCH search over the same colour math and the same shared thresholds,
 * and it produces one more generated colour for `semantic-map.ts` to alias. The compiler in
 * `build-theme.ts` calls it between the surfaces and the semantic map, and hard-gates its result in the
 * validation matrix.
 */

import type { Oklch } from './color.js';
import { clampUnit, contrastRatio, gamutMapOklch } from './color.js';
import { CONTRAST_SEARCH_STEP, RATIO_HEADROOM, UI_RATIO } from './contrast-policy.js';
import type { ScaleFamily } from './scale.js';

type ColorMode = 'light' | 'dark';

/**
 * Solves `color.border.control` as a dedicated contrast boundary (Stage 6 Option B), rather than a
 * subtle step-7 alias: neutral steps 7-8 land at roughly 1.6-2.7:1 against the base surfaces, well
 * short of the 3:1 non-text gate. Starting from step 7's own lightness (its hue and a low, neutral
 * chroma), the search steps in the higher-contrast direction — darker in light mode, lighter in
 * dark mode — until the candidate clears 3:1 (plus headroom) against BOTH `canvas` and `recessed`,
 * gated on whichever of the two currently has the lower contrast. It stops at the first clearing
 * lightness, so the result deviates from the step-7 aesthetic by the minimum needed to reach the
 * boundary. Lightness is clamped to [0, 1]; a neutral hue always reaches the target within range.
 */
export function solveControlBorder(params: {
	neutral: ScaleFamily;
	canvas: Oklch;
	recessed: Oklch;
	mode: ColorMode;
}): Oklch {
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
