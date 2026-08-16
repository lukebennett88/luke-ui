import { describe, expect, it } from 'vite-plus/test';
import { mixOklab, parseColor } from './color.js';
import { vars } from './contract.css.js';
import {
	INTERACTION_STRENGTH,
	interactionColor,
	mixInteractionColor,
} from './interaction-color.js';

describe('interactionColor', () => {
	it('emits an OKLab color-mix that uses the shared hover and pressed strengths', () => {
		expect(INTERACTION_STRENGTH).toEqual({ hover: 0.05, pressed: 0.1 });

		const source = vars.color.text.primary;
		expect(interactionColor('var(--fill)', 'hover')).toBe(
			`color-mix(in oklab, var(--fill) 95%, ${source} 5%)`,
		);
		expect(interactionColor('var(--fill)', 'pressed')).toBe(
			`color-mix(in oklab, var(--fill) 90%, ${source} 10%)`,
		);
	});

	it('emits a translucent source colour when the base is transparent', () => {
		const source = vars.color.text.primary;
		expect(interactionColor('transparent', 'hover')).toBe(
			`color-mix(in oklab, ${source} 5%, transparent)`,
		);
	});

	it('shares the OKLab mix with mixInteractionColor', () => {
		const fill = parseColor('#ffffff');
		const source = parseColor('#0160ae');
		expect(mixInteractionColor(fill, source, 'pressed')).toEqual(mixOklab(fill, source, 0.1));
	});
});
