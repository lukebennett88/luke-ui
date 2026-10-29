/**
 * Solves `color.border.control.{rest,hover,pressed}`, the contrast boundary for form controls.
 */

import type { Oklch } from './color.js';
import {
	compositeEncodedSrgb,
	contrastRatio,
	formatOklch,
	gamutMapOklch,
	parseColor,
} from './color.js';
import {
	CONTROL_BORDER_HOVER_STRENGTH,
	CONTROL_BORDER_PRESSED_STRENGTH,
	RATIO_HEADROOM,
	UI_RATIO,
} from './contrast-policy.js';
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
	/** The three structural surfaces plus the six role subtle fills. */
	backgrounds: ReadonlyArray<Oklch>;
	/** `color.foreground.primary`, the colour the hover and pressed states mix toward. */
	foreground: Oklch;
}

/** The emitted (rounded, gamut-mapped) control border colour for each interactive state. */
export interface ControlBorderStates {
	rest: Oklch;
	hover: Oklch;
	pressed: Oklch;
}

/**
 * The neutral border rung lands at roughly 1.6–2.7:1 against the surfaces, short of the 3:1 non-text
 * minimum. Starting from that rung, the search moves lightness away from the backgrounds (darker in
 * light mode, lighter in dark mode) and stops at the first resting value whose emitted rest, hover,
 * and pressed colours all clear 3:1, plus headroom, against every background. Hover and pressed mix
 * the emitted rest toward `foreground` at fixed strengths. When no candidate passes, it returns the
 * last one and validation reports the failing pair.
 */
export function solveControlBorder(params: SolveControlBorderRequest): ControlBorderStates {
	const { neutral, backgrounds, foreground, mode } = params;
	const seed = neutral[FAMILY_RUNG.border];
	const target = UI_RATIO + RATIO_HEADROOM;
	const emittedBackgrounds = backgrounds.map(emitted);
	const emittedForeground = emitted(foreground);

	let resolved = controlBorderStates(emitted(seed), emittedForeground);
	for (const lightness of lightnessCandidates(seed.l, mode === 'light' ? 0 : 1)) {
		const rest = emitted(gamutMapOklch({ l: lightness, c: seed.c, h: seed.h }));
		resolved = controlBorderStates(rest, emittedForeground);
		const worst = Math.min(
			...[resolved.rest, resolved.hover, resolved.pressed].flatMap((state) => {
				return emittedBackgrounds.map((background) => contrastRatio(state, background));
			}),
		);
		if (worst >= target) return resolved;
	}
	return resolved;
}

function controlBorderStates(rest: Oklch, foreground: Oklch): ControlBorderStates {
	return {
		rest,
		hover: mixToward(rest, foreground, CONTROL_BORDER_HOVER_STRENGTH),
		pressed: mixToward(rest, foreground, CONTROL_BORDER_PRESSED_STRENGTH),
	};
}

function mixToward(rest: Oklch, foreground: Oklch, strength: number): Oklch {
	return emitted(compositeEncodedSrgb(foreground, rest, strength));
}

function emitted(color: Oklch): Oklch {
	return parseColor(formatOklch(color));
}
