import { IconButton } from '@luke-ui/react/icon-button';
import { Fragment } from 'react';
import type { JSX } from 'react';
import { expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { render, visualAppearances } from '../test-utils/render.js';
import {
	resolvedColor,
	setInteractionState,
	settledSurfaceColors,
} from '../test-utils/surface-colors.js';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	focusViaKeyboard,
	Grid,
} from '../test-utils/visual.js';

const dangerProminences = ['low', 'standard', 'high'] as const;

/** A custom SVG that deliberately omits its own `aria-hidden` and any `<title>`. */
function UnlabelledCustomIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<circle cx="12" cy="12" r="8" fill="currentColor" />
		</svg>
	);
}

function IconButtonScene() {
	return (
		<Grid columns={4}>
			<IconButton aria-label="Add small" icon="add" size="small" />
			<IconButton aria-label="Add medium" icon="add" size="medium" />
			<IconButton aria-label="Disabled" icon="delete" isDisabled size="small" />
			<IconButton aria-label="Pending" icon="add" isPending size="medium" />
			<IconButton aria-label="Standard" icon="add" />
			<IconButton aria-label="Low" icon="add" prominence="low" />
			<IconButton aria-label="High" icon="add" prominence="high" />
			<IconButton aria-label="Danger high" icon="delete" tone="danger" prominence="high" />
		</Grid>
	);
}

test('the IconButton scene has no axe violations', async () => {
	const { container } = render(<IconButtonScene />);

	await expectNoAxeViolations(container);
});

test('a built-in icon contributes no accessible name', () => {
	const { locator } = render(<IconButton aria-label="Repository" icon="search" />);

	expect(locator.getByRole('button', { name: 'Repository' }).element()).toBeTruthy();
	expect(locator.getByRole('button', { name: 'search' }).query()).toBeNull();
});

test('a custom SVG icon with no aria-hidden of its own contributes no accessible name', () => {
	const { locator } = render(<IconButton aria-label="Brand" icon={<UnlabelledCustomIcon />} />);

	const button = locator.getByRole('button', { name: 'Brand' }).element();
	expect(button).toHaveAccessibleName('Brand');
	// The wrapper hides the whole subtree, so the custom svg needs no aria-hidden of its own.
	expect(button.querySelector('svg')?.closest('[aria-hidden="true"]')).not.toBeNull();
});

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<IconButtonScene />, { appearance });
		await captureVisualAppearance(locator, 'icon-button/kitchen-sink', appearance);
	}
});

for (const appearance of visualAppearances) {
	test(
		`danger IconButton interaction and disabled states in ${appearance.theme} ${appearance.mode}`,
		{ tags: ['visual'] },
		async () => {
			const { locator } = render(
				<Grid columns={4}>
					{dangerProminences.map((prominence) => (
						<Fragment key={prominence}>
							{['rest', 'hover', 'pressed'].map((state) => (
								<IconButton
									key={state}
									aria-label={`Danger ${prominence} ${state}`}
									icon="delete"
									prominence={prominence}
									tone="danger"
								/>
							))}
							<IconButton
								aria-label={`Danger ${prominence} disabled`}
								icon="delete"
								isDisabled
								prominence={prominence}
								tone="danger"
							/>
						</Fragment>
					))}
				</Grid>,
				{ appearance },
			);
			for (const prominence of dangerProminences) {
				for (const state of ['hover', 'pressed'] as const) {
					setInteractionState(
						locator.getByRole('button', { name: `Danger ${prominence} ${state}` }).element(),
						state,
					);
				}
			}
			await captureVisualAppearance(locator, 'icon-button/danger-states', appearance);
		},
	);
}

test('focus-visible state', { tags: ['visual'] }, async () => {
	const { locator } = render(<IconButton aria-label="Action" icon="add" />);

	await focusViaKeyboard(page.getByRole('button', { name: 'Action' }));
	await captureVisual(locator, 'icon-button/focus-visible');
});

test('forced-colors resting', { tags: ['visual'] }, async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
			<Grid columns={3}>
				<IconButton aria-label="Action" icon="add" />
				<IconButton aria-label="Disabled" icon="delete" isDisabled />
				<IconButton aria-label="Pending" icon="add" isPending />
			</Grid>,
		);
		await captureVisual(locator, 'icon-button/forced-colors-resting');
	} finally {
		await emulateForcedColors('none');
	}
});

for (const appearance of visualAppearances) {
	test(
		`danger IconButtons take system colours in forced colours in ${appearance.theme} ${appearance.mode}`,
		{ tags: ['visual'] },
		async () => {
			await emulateForcedColors('active');

			try {
				const { locator } = render(
					<Grid columns={4}>
						{dangerProminences.map((prominence) => (
							<Fragment key={prominence}>
								<IconButton
									aria-label={`Danger ${prominence}`}
									icon="delete"
									prominence={prominence}
									tone="danger"
								/>
								<IconButton
									aria-label={`Danger ${prominence} disabled`}
									icon="delete"
									isDisabled
									prominence={prominence}
									tone="danger"
								/>
							</Fragment>
						))}
					</Grid>,
					{ appearance },
				);
				for (const prominence of dangerProminences) {
					const button = locator
						.getByRole('button', { exact: true, name: `Danger ${prominence}` })
						.element();
					expect(settledSurfaceColors(button)).toMatchObject({
						background: resolvedColor('ButtonFace', button),
						color: resolvedColor('ButtonText', button),
					});
					const disabled = locator
						.getByRole('button', { exact: true, name: `Danger ${prominence} disabled` })
						.element();
					expect(disabled).toBeDisabled();
					expect(settledSurfaceColors(disabled).color).toBe(resolvedColor('GrayText', disabled));
				}
				await captureVisualAppearance(locator, 'icon-button/danger-forced-colours', appearance);
			} finally {
				await emulateForcedColors('none');
			}
		},
	);
}
