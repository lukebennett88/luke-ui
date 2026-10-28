/**
 * Solves `color.border.<role>.strong`, the functional semantic boundary every role publishes beside
 * its decorative `subtle` border.
 */

import type { Oklch } from './color.js';
import { contrastRatio, formatOklch, gamutMapOklch, parseColor } from './color.js';
import { RATIO_HEADROOM, UI_RATIO } from './contrast-policy.js';
import { lightnessCandidates } from './lightness-candidates.js';
import type { ScaleFamily } from './scale.js';
import { FAMILY_RUNG } from './scale.js';

type ColorMode = 'light' | 'dark';

/** The inputs to {@link solveStrongBorder}. */
interface SolveStrongBorderRequest {
	/** The role's generated family for this mode. Its border rung seeds the search. */
	family: ScaleFamily;
	/** The colour mode being solved for. */
	mode: ColorMode;
	/** The three structural surfaces plus the role's own subtle fill. */
	backgrounds: ReadonlyArray<Oklch>;
}

/**
 * Starting from the role's decorative border rung, moves lightness away from the backgrounds (darker
 * in light mode, lighter in dark mode), keeping hue and chroma, and stops at the first value whose
 * emitted (rounded, gamut-mapped) colour clears 3:1, plus headroom, against every background. When
 * none does, it returns the last candidate and validation reports the failure.
 */
export function solveStrongBorder(params: SolveStrongBorderRequest): Oklch {
	const { family, backgrounds, mode } = params;
	const seed = family[FAMILY_RUNG.border];
	const target = UI_RATIO + RATIO_HEADROOM;
	const emittedBackgrounds = backgrounds.map(emitted);

	let resolved = emitted(seed);
	for (const lightness of lightnessCandidates(seed.l, mode === 'light' ? 0 : 1)) {
		resolved = emitted(gamutMapOklch({ l: lightness, c: seed.c, h: seed.h }));
		const worst = Math.min(
			...emittedBackgrounds.map((background) => contrastRatio(resolved, background)),
		);
		if (worst >= target) return resolved;
	}
	return resolved;
}

function emitted(color: Oklch): Oklch {
	return parseColor(formatOklch(color));
}
