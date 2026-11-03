import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { expect, test } from 'vite-plus/test';
import { render, visualAppearances } from '../test-utils/render.js';
import {
	pairedColors,
	setInteractionState,
	settledSurfaceColors,
	surfaceColors,
} from '../test-utils/surface-colors.js';
import { solidStatesFixture, subtleToSolidFixture } from './surface.fixtures.css.js';

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

	test(`a low Button keeps its parent's context in every state in ${name}`, () => {
		const { container } = render(
			<Box backgroundColor="success.solid" data-testid="parent" padding="space.8">
				<Button prominence="low" tone="danger">
					<span data-testid="label">Cancel</span>
				</Button>
			</Box>,
			{ appearance },
		);
		const parent = byTestId(container, 'parent');
		const button = container.querySelector('button');
		if (button === null) throw new Error('Expected a button.');
		const label = byTestId(container, 'label');
		const context = pairedColors(parent, 'success.solid.rest');

		for (const state of ['rest', 'hover', 'pressed'] as const) {
			setInteractionState(button, state);
			// The Button paints its parent's fill, and its state fill sits above that in the layer.
			expect(settledSurfaceColors(button), `${state} button`).toEqual({
				...context,
				color: context.foreground.danger,
			});
			expect(settledSurfaceColors(label).foreground, `${state} label`).toEqual(context.foreground);
		}
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
			[false, 'danger.subtle'],
			[true, 'danger.solid.rest'],
			[false, 'danger.subtle'],
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
