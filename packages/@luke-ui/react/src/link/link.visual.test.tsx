import { test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { render, visualAppearances } from '../test-utils/render.js';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	focusViaKeyboard,
	Grid,
	Stack,
} from '../test-utils/visual.js';
import { Link } from './index.js';

test('kitchen sink', async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(
			<Stack align="flex-start">
				<Link href="#">Accent link</Link>
				<Link href="#" tone="neutral">
					Neutral link
				</Link>
				<Link href="#" isStandalone>
					Standalone link
				</Link>
				<Link href="#" isDisabled>
					Disabled link
				</Link>
				<Grid columns={3}>
					<Link href="#" isStandalone>
						Accent
					</Link>
					<Link href="#" isStandalone tone="neutral">
						Neutral
					</Link>
					<Link href="#" isDisabled isStandalone>
						Disabled
					</Link>
				</Grid>
			</Stack>,
			{ appearance },
		);
		await captureVisualAppearance(locator, 'link/kitchen-sink', appearance);
	}
});

test('interactive states', async () => {
	const { locator } = render(
		<Stack align="flex-start">
			<Link href="#" isStandalone>
				Destination
			</Link>
		</Stack>,
	);
	const link = page.getByRole('link', { name: 'Destination' });

	await userEvent.hover(link);
	await captureVisual(locator, 'link/hover');
	await userEvent.unhover(link);
	await focusViaKeyboard(link);
	await captureVisual(locator, 'link/focus-visible');
	await userEvent.keyboard('{Enter>}');
	await captureVisual(locator, 'link/pressed');
	await userEvent.keyboard('{/Enter}');
});

test('forced-colors states', async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
			<Grid columns={4}>
				<Link href="#" isStandalone>
					Resting
				</Link>
				<Link href="#" isStandalone>
					Hovered
				</Link>
				<Link href="#" isStandalone>
					Pressed and focused
				</Link>
				<Link href="#" isDisabled isStandalone>
					Disabled
				</Link>
			</Grid>,
		);
		const hovered = page.getByRole('link', { name: 'Hovered' });

		await userEvent.hover(hovered);
		await userEvent.tab();
		await userEvent.tab();
		await userEvent.tab();
		await userEvent.keyboard('{Enter>}');
		await captureVisual(locator, 'link/forced-colors-states');
		await userEvent.keyboard('{/Enter}');
	} finally {
		await emulateForcedColors('none');
	}
});
