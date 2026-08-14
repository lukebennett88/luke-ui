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
import { IconButton } from './index.js';

test('kitchen sink', async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(
			<Grid columns={4}>
				<IconButton aria-label="Add small" icon="add" size="small" />
				<IconButton aria-label="Add medium" icon="add" size="medium" />
				<IconButton aria-label="Disabled" icon="delete" isDisabled size="small" />
				<IconButton aria-label="Pending" icon="add" isPending size="medium" />
				<IconButton appearance="subtle" aria-label="Subtle" icon="add" />
				<IconButton appearance="ghost" aria-label="Ghost" icon="add" />
			</Grid>,
			{ appearance },
		);
		await captureVisualAppearance(locator, 'icon-button/kitchen-sink', appearance);
	}
});

test('interactive states', async () => {
	const { locator } = render(<IconButton aria-label="Action" icon="add" />);
	const button = page.getByRole('button', { name: 'Action' });

	await userEvent.hover(button);
	await captureVisual(locator, 'icon-button/hover');
	await userEvent.unhover(button);
	await focusViaKeyboard(button);
	await captureVisual(locator, 'icon-button/focus-visible');
	await userEvent.keyboard('{Space>}');
	await captureVisual(locator, 'icon-button/pressed');
	await userEvent.keyboard('{/Space}');
});

test('ghost interactive states', async () => {
	render(<IconButton appearance="ghost" aria-label="Action" icon="add" />);
	const button = page.getByRole('button', { name: 'Action' });

	await userEvent.hover(button);
	await captureVisual(button, 'icon-button/ghost-hover');
	await userEvent.unhover(button);
	await focusViaKeyboard(button);
	await userEvent.keyboard('{Space>}');
	await captureVisual(button, 'icon-button/ghost-pressed');
	await userEvent.keyboard('{/Space}');
});

test('ghost interactive states in dark mode', async () => {
	render(<IconButton appearance="ghost" aria-label="Action" icon="add" />, {
		appearance: { mode: 'dark', theme: 'tactile' },
	});
	const button = page.getByRole('button', { name: 'Action' });

	await userEvent.hover(button);
	await captureVisual(button, 'icon-button/ghost-hover-tactile-dark');
	await userEvent.unhover(button);
	await focusViaKeyboard(button);
	await userEvent.keyboard('{Space>}');
	await captureVisual(button, 'icon-button/ghost-pressed-tactile-dark');
	await userEvent.keyboard('{/Space}');
});

test('forced-colors states', async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
			<Grid columns={3}>
				<IconButton aria-label="Action" icon="add" />
				<IconButton aria-label="Disabled" icon="delete" isDisabled />
				<IconButton aria-label="Pending" icon="add" isPending />
			</Grid>,
		);
		const action = page.getByRole('button', { name: 'Action' });

		await captureVisual(locator, 'icon-button/forced-colors-resting');
		await userEvent.hover(action);
		await captureVisual(locator, 'icon-button/forced-colors-hover');
		await userEvent.unhover(action);
		await focusViaKeyboard(action);
		await captureVisual(locator, 'icon-button/forced-colors-focus-visible');
		await userEvent.keyboard('{Space>}');
		await captureVisual(locator, 'icon-button/forced-colors-pressed');
		await userEvent.keyboard('{/Space}');
	} finally {
		await emulateForcedColors('none');
	}
});
