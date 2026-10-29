import { describe, expect, it } from 'vite-plus/test';
import { contrastRatio, parseColor } from './color.js';
import type { Oklch } from './color.js';
import { UI_RATIO } from './contrast-policy.js';
import { solveControlBorder } from './control-border.js';
import { FAMILY_RUNG, generateFamily, highContrastText } from './scale.js';

type ColorMode = 'light' | 'dark';

const BASE: Record<ColorMode, Oklch> = {
	dark: parseColor('oklch(0.18 0.004 250)'),
	light: parseColor('oklch(0.99 0.003 250)'),
};

function solve(mode: ColorMode, extraBackgrounds: ReadonlyArray<Oklch>) {
	const foreground = highContrastText(BASE[mode], mode);
	const neutral = generateFamily({
		background: BASE[mode],
		interactionSource: foreground,
		mode,
		role: 'neutral',
		source: BASE[mode],
	});
	return solveControlBorder({
		backgrounds: [BASE[mode], ...extraBackgrounds],
		foreground: neutral[FAMILY_RUNG.textPrimary],
		mode,
		neutral,
	});
}

describe('solveControlBorder', () => {
	for (const mode of ['light', 'dark'] as const) {
		it(`clears 3:1 for rest, hover, and pressed against every background (${mode})`, () => {
			// A mid-lightness fill sits between the surface and the neutral border rung, so solving
			// against the surface alone would leave it short.
			const midFill = parseColor(mode === 'light' ? 'oklch(0.82 0.04 250)' : 'oklch(0.4 0.04 250)');
			const backgrounds = [BASE[mode], midFill];
			const states = solve(mode, [midFill]);

			for (const state of [states.rest, states.hover, states.pressed]) {
				for (const background of backgrounds) {
					expect(contrastRatio(state, background)).toBeGreaterThanOrEqual(UI_RATIO);
				}
			}
		});

		it(`moves the resting border further than a surface-only solve when a fill demands it (${mode})`, () => {
			const midFill = parseColor(mode === 'light' ? 'oklch(0.82 0.04 250)' : 'oklch(0.4 0.04 250)');
			const surfaceOnly = solve(mode, []);
			const withFill = solve(mode, [midFill]);

			// Light borders darken and dark borders lighten, so the signed shift away from the surface
			// is positive in both modes.
			const direction = mode === 'light' ? -1 : 1;
			expect((withFill.rest.l - surfaceOnly.rest.l) * direction).toBeGreaterThan(0);
		});
	}

	it('returns the last candidate when no lightness can clear the matrix', () => {
		const impossible = [parseColor('oklch(0.3 0 0)')];
		const states = solve('light', impossible);

		expect(contrastRatio(states.rest, impossible[0]!)).toBeLessThan(UI_RATIO);
	});
});
