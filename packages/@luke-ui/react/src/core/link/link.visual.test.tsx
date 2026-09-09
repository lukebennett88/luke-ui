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
import { Link } from './link.js';

test('kitchen sink', async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(
			<Stack align="flex-start">
				<Link href="#" prominence="low">
					Text neutral low
				</Link>
				<Link href="#">Text neutral standard</Link>
				<Link href="#" tone="accent">
					Text accent standard
				</Link>
				<Link href="#" prominence="high" tone="accent">
					Text accent high
				</Link>
				<Grid columns={4}>
					<Link appearance="button" href="#" prominence="low">
						Button neutral low
					</Link>
					<Link appearance="button" href="#">
						Button neutral standard
					</Link>
					<Link appearance="button" href="#" tone="accent">
						Button accent standard
					</Link>
					<Link appearance="button" href="#" prominence="high" tone="accent">
						Button accent high
					</Link>
				</Grid>
				<Link href="#" isDisabled>
					Disabled text link
				</Link>
				<Link appearance="button" href="#" isDisabled tone="accent">
					Disabled button link
				</Link>
			</Stack>,
			{ appearance },
		);
		await captureVisualAppearance(locator, 'link/kitchen-sink', appearance);
	}
});

test('interactive states', async () => {
	const { locator } = render(
		<Stack align="flex-start">
			<Link href="#" prominence="low">
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
				<Link href="#" prominence="low">
					Resting
				</Link>
				<Link href="#" prominence="low">
					Hovered
				</Link>
				<Link href="#" prominence="low">
					Pressed and focused
				</Link>
				<Link href="#" isDisabled prominence="low">
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
