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
		const source = vars.color.text.primary;
		expect(interactionColor('var(--fill)', 'hover')).toBe(
			`color-mix(in oklab, var(--fill) ${100 - INTERACTION_STRENGTH.hover * 100}%, ${source} ${INTERACTION_STRENGTH.hover * 100}%)`,
		);
		expect(interactionColor('var(--fill)', 'pressed')).toBe(
			`color-mix(in oklab, var(--fill) ${100 - INTERACTION_STRENGTH.pressed * 100}%, ${source} ${INTERACTION_STRENGTH.pressed * 100}%)`,
		);
	});

	it('emits a translucent source colour when the base is transparent', () => {
		const source = vars.color.text.primary;
		expect(interactionColor('transparent', 'hover')).toBe(
			`color-mix(in oklab, ${source} ${INTERACTION_STRENGTH.hover * 100}%, transparent)`,
		);
	});

	it('shares the OKLab mix with mixInteractionColor', () => {
		const fill = parseColor('#ffffff');
		const source = parseColor('#0160ae');
		expect(mixInteractionColor(fill, source, 'pressed')).toEqual(
			mixOklab(fill, source, INTERACTION_STRENGTH.pressed),
		);
	});
});
