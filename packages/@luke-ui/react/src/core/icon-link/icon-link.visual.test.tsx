import type { JSX } from 'react';
import { test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { render, visualAppearances } from '../test-utils/render.js';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	focusViaKeyboard,
	Grid,
} from '../test-utils/visual.js';
import { IconLink } from './icon-link.js';

function CustomStarIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M12 2 14.9 9.1 22 9.9 16.7 14.9 18.2 22 12 18.3 5.8 22 7.3 14.9 2 9.9 9.1 9.1Z"
				fill="currentColor"
			/>
		</svg>
	);
}

test('kitchen sink', async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(
			<Grid columns={4}>
				<IconLink aria-label="Add small" href="#" icon="add" size="small" />
				<IconLink aria-label="Add medium" href="#" icon="add" size="medium" />
				<IconLink aria-label="Disabled" href="#" icon="delete" isDisabled size="small" />
				<IconLink aria-label="Custom icon" href="#" icon={<CustomStarIcon />} />
				<IconLink aria-label="Standard" href="#" icon="add" />
				<IconLink aria-label="Low" href="#" icon="add" prominence="low" />
				<IconLink aria-label="Accent low" href="#" icon="add" tone="accent" prominence="low" />
				<IconLink
					aria-label="Critical high"
					href="#"
					icon="delete"
					tone="critical"
					prominence="high"
				/>
			</Grid>,
			{ appearance },
		);
		await captureVisualAppearance(locator, 'icon-link/kitchen-sink', appearance);
	}
});

test('interactive states', async () => {
	const { locator } = render(<IconLink aria-label="Search" href="#" icon="search" />);
	const link = page.getByRole('link', { name: 'Search' });

	await userEvent.hover(link);
	await captureVisual(locator, 'icon-link/hover');
	await userEvent.unhover(link);
	await focusViaKeyboard(link);
	await captureVisual(locator, 'icon-link/focus-visible');
	await userEvent.keyboard('{Enter>}');
	await captureVisual(locator, 'icon-link/pressed');
	await userEvent.keyboard('{/Enter}');
});

test('forced-colors states', async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
			<Grid columns={2}>
				<IconLink aria-label="Search" href="#" icon="search" />
				<IconLink aria-label="Disabled" href="#" icon="delete" isDisabled />
			</Grid>,
		);
		const search = page.getByRole('link', { name: 'Search' });

		await captureVisual(locator, 'icon-link/forced-colors-resting');
		await userEvent.hover(search);
		await captureVisual(locator, 'icon-link/forced-colors-hover');
		await userEvent.unhover(search);
		await focusViaKeyboard(search);
		await captureVisual(locator, 'icon-link/forced-colors-focus-visible');
		await userEvent.keyboard('{Enter>}');
		await captureVisual(locator, 'icon-link/forced-colors-pressed');
		await userEvent.keyboard('{/Enter}');
	} finally {
		await emulateForcedColors('none');
	}
});
