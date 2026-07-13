import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import {
	captureVisual,
	captureVisualAppearance,
	focusViaKeyboard,
	Grid,
	renderVisual,
	visualAppearances,
} from '../test-utils/render-visual.js';
import { IconButton } from './index.js';

test('sizes and states', async () => {
	const locator = renderVisual(
		<Grid columns={4}>
			<IconButton aria-label="Add small" icon="add" size="small" />
			<IconButton aria-label="Add medium" icon="add" size="medium" />
			<IconButton aria-label="Disabled small" icon="delete" isDisabled size="small" />
			<IconButton aria-label="Disabled medium" icon="delete" isDisabled size="medium" />
		</Grid>,
	);

	await captureVisual(locator, 'icon-button/sizes-states');
});

test.each(visualAppearances)('action states: $theme $mode', async (appearance) => {
	const scene = renderVisual(
		<Grid columns={5}>
			<IconButton aria-label="Resting" icon="add" />
			<IconButton aria-label="Disabled" icon="delete" isDisabled />
			<IconButton aria-label="Pending" icon="add" isPending />
			<IconButton aria-label="Subtle" icon="add" variant="subtle" />
			<IconButton aria-label="Ghost" icon="add" variant="ghost" />
		</Grid>,
		appearance,
	);
	await expect
		.element(page.getByRole('button', { name: 'Pending' }))
		.toHaveAttribute('aria-disabled', 'true');

	await captureVisualAppearance(scene, 'icon-button/action-states', appearance);
});

test.each(visualAppearances)('interactive states: $theme $mode', async (appearance) => {
	const scene = renderVisual(<IconButton aria-label="Action" icon="add" />, appearance);
	const button = page.getByRole('button', { name: 'Action' });
	await expect.element(button).toBeVisible();

	await captureVisualAppearance(scene, 'icon-button/resting', appearance);
	await userEvent.hover(button);
	await captureVisualAppearance(scene, 'icon-button/hover', appearance);
	await userEvent.unhover(button);
	await focusViaKeyboard(button);
	await captureVisualAppearance(scene, 'icon-button/focus-visible', appearance);
	await userEvent.keyboard('{Space>}');
	await captureVisualAppearance(scene, 'icon-button/pressed', appearance);
	await userEvent.keyboard('{/Space}');
});

test('keyboard focus ring', async () => {
	const scene = renderVisual(
		<Grid columns={1}>
			<IconButton aria-label="Focus add" icon="add" />
		</Grid>,
	);

	await focusViaKeyboard(page.getByRole('button', { name: 'Focus add' }));
	await captureVisual(scene, 'icon-button/focus-visible');
});
