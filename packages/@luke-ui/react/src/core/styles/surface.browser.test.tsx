import { Box } from '@luke-ui/react/box';
import { expect, test } from 'vite-plus/test';
import { render, visualAppearances } from '../test-utils/render.js';
import { pairedColors, surfaceColors } from '../test-utils/surface-colors.js';
import { INTERACTION_STATE_LAYER_PROPERTY } from './interaction-state-layer.js';
import {
	solidStatesFixture,
	subtleToSolidFixture,
	transparentToSubtleFixture,
} from './surface.fixtures.css.js';

const TRANSPARENT = 'rgba(0, 0, 0, 0)';

function byTestId(container: HTMLElement, id: string): HTMLElement {
	const element = container.querySelector<HTMLElement>(`[data-testid="${id}"]`);
	if (element === null) throw new Error(`Expected [data-testid="${id}"].`);
	return element;
}

for (const appearance of visualAppearances) {
	const name = `${appearance.theme} ${appearance.mode}`;

	test(`solid hover and pressed fills keep the on-solid context in ${name}`, () => {
		const { container } = render(
			<div className={solidStatesFixture} data-testid="solid">
				<span data-testid="label">Save</span>
			</div>,
			{ appearance },
		);
		const solid = byTestId(container, 'solid');
		const label = byTestId(container, 'label');
		const rest = surfaceColors(solid);

		expect(rest).toEqual(pairedColors(solid, 'accent.solid.rest'));
		solid.toggleAttribute('data-hovered', true);
		expect(surfaceColors(solid)).toEqual(pairedColors(solid, 'accent.solid.hover'));
		solid.toggleAttribute('data-pressed', true);
		const pressed = surfaceColors(solid);
		expect(pressed).toEqual(pairedColors(solid, 'accent.solid.pressed'));
		expect(surfaceColors(label)).toEqual({ ...pressed, background: TRANSPARENT });

		// The fill changes with the state while the foreground stays on-solid.
		expect(pressed.background).not.toBe(rest.background);
		expect(pressed.foreground).toEqual(rest.foreground);
	});

	test(`a transparent fill keeps its resting context under adaptive feedback in ${name}`, () => {
		const { container } = render(
			<Box backgroundColor="success.solid" data-testid="parent" padding="space.8">
				<div className={transparentToSubtleFixture} data-testid="control">
					<span data-testid="label">Cancel</span>
				</div>
			</Box>,
			{ appearance },
		);
		const parent = byTestId(container, 'parent');
		const control = byTestId(container, 'control');
		const label = byTestId(container, 'label');

		// At rest the control paints nothing, so it keeps the solid parent's context.
		expect(surfaceColors(control)).toEqual({
			...pairedColors(parent, 'success.solid'),
			background: TRANSPARENT,
		});
		const resting = surfaceColors(control);
		control.toggleAttribute('data-hovered', true);
		const hoverLayer = getComputedStyle(control).getPropertyValue(INTERACTION_STATE_LAYER_PROPERTY);
		expect(hoverLayer).not.toBe('transparent');
		expect(surfaceColors(control)).toEqual(resting);
		control.toggleAttribute('data-pressed', true);
		const pressedLayer = getComputedStyle(control).getPropertyValue(
			INTERACTION_STATE_LAYER_PROPERTY,
		);
		expect(pressedLayer).not.toBe(hoverLayer);
		expect(surfaceColors(control)).toEqual(resting);
		expect(surfaceColors(label)).toEqual(resting);
	});

	test(`switching between subtle and solid resets every foreground slot in ${name}`, () => {
		const { container } = render(
			<Box backgroundColor="accent.solid" padding="space.8">
				<div className={subtleToSolidFixture} data-testid="toggle">
					<span data-testid="label">Delete</span>
				</div>
			</Box>,
			{ appearance },
		);
		const toggle = byTestId(container, 'toggle');
		const label = byTestId(container, 'label');

		for (const [isSelected, background] of [
			[false, 'danger.subtle.rest'],
			[true, 'danger.solid.rest'],
			[false, 'danger.subtle.rest'],
		] as const) {
			toggle.toggleAttribute('data-selected', isSelected);
			expect(surfaceColors(toggle)).toEqual(pairedColors(toggle, background));
			expect(surfaceColors(label)).toEqual({
				...pairedColors(label, background),
				background: TRANSPARENT,
			});
		}
	});
}
