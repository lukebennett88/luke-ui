import { describe, expect, it } from 'vite-plus/test';
import { mixSrgb, parseColor } from './color.js';
import {
	INTERACTION_OVERLAY_PERCENT,
	interactionFill,
	mixInteractionSrgb,
} from './interaction-overlay.js';

describe('interaction overlay', () => {
	it('emits an sRGB color-mix that uses the shared hover and pressed strengths', () => {
		expect(interactionFill('var(--fill)', 'var(--source)', 'hover')).toBe(
			`color-mix(in srgb, var(--fill) ${100 - INTERACTION_OVERLAY_PERCENT.hover}%, var(--source) ${INTERACTION_OVERLAY_PERCENT.hover}%)`,
		);
		expect(interactionFill('var(--fill)', 'var(--source)', 'pressed')).toBe(
			`color-mix(in srgb, var(--fill) ${100 - INTERACTION_OVERLAY_PERCENT.pressed}%, var(--source) ${INTERACTION_OVERLAY_PERCENT.pressed}%)`,
		);
	});

	it('delegates the sRGB mix to mixSrgb at the shared strength', () => {
		const fill = parseColor('#ffffff');
		const source = parseColor('#0160ae');
		expect(mixInteractionSrgb(fill, source, 'pressed')).toEqual(
			mixSrgb(fill, source, INTERACTION_OVERLAY_PERCENT.pressed / 100),
		);
	});
});
