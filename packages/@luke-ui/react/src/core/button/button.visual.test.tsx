import { test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { Icon } from '../icon/icon.js';
import { render, visualAppearances } from '../test-utils/render.js';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	focusViaKeyboard,
	Grid,
} from '../test-utils/visual.js';
import { Button } from './button.js';

test('kitchen sink', async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(
			<Grid columns={3}>
				<Button prominence="low">Neutral low button</Button>
				<Button>Neutral standard button</Button>
				<Button tone="accent" prominence="low">
					Accent low button
				</Button>
				<Button tone="accent">Accent standard button</Button>
				<Button tone="accent" prominence="high">
					Accent high button
				</Button>
				<Button tone="critical" prominence="low">
					Critical low button
				</Button>
				<Button tone="critical">Critical standard button</Button>
				<Button tone="critical" prominence="high">
					Critical high button
				</Button>
				<Button appearance="text" prominence="low">
					Neutral low text Button
				</Button>
				<Button appearance="text">Neutral standard text Button</Button>
				<Button appearance="text" tone="accent">
					Accent standard text Button
				</Button>
				<Button appearance="text" tone="accent" prominence="high">
					Accent high text Button
				</Button>
				<Button appearance="text" tone="critical" prominence="low">
					Critical low text Button
				</Button>
				<Button appearance="text" tone="critical">
					Critical standard text Button
				</Button>
				<Button isDisabled>Disabled</Button>
				<Button isPending>Standard pending</Button>
				<Button isPending tone="accent" prominence="high">
					High pending
				</Button>
				<Button startContent={<Icon name="add" />}>With icon</Button>
				<Button endContent={<Icon name="arrowRight" />}>With end content</Button>
			</Grid>,
			{ appearance },
		);
		await captureVisualAppearance(locator, 'button/kitchen-sink', appearance);
	}
});

test('interactive states', async () => {
	const { locator } = render(<Button>Action</Button>);
	const button = page.getByRole('button', { name: 'Action' });

	await userEvent.hover(button);
	await captureVisual(locator, 'button/hover');
	await userEvent.unhover(button);
	await focusViaKeyboard(button);
	await captureVisual(locator, 'button/focus-visible');
	await userEvent.keyboard('{Space>}');
	await captureVisual(locator, 'button/pressed');
	await userEvent.keyboard('{/Space}');
});

test('forced-colors states', async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
			<Grid columns={3}>
				<Button>Action</Button>
				<Button isDisabled>Disabled</Button>
				<Button isPending>Pending</Button>
			</Grid>,
		);
		const action = page.getByRole('button', { name: 'Action' });

		await captureVisual(locator, 'button/forced-colors-resting');
		await userEvent.hover(action);
		await captureVisual(locator, 'button/forced-colors-hover');
		await userEvent.unhover(action);
		await focusViaKeyboard(action);
		await captureVisual(locator, 'button/forced-colors-focus-visible');
		await userEvent.keyboard('{Space>}');
		await captureVisual(locator, 'button/forced-colors-pressed');
		await userEvent.keyboard('{/Space}');
	} finally {
		await emulateForcedColors('none');
	}
});
