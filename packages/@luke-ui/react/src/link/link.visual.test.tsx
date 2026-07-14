import { expect, test } from 'vite-plus/test';
import { cdp, page, userEvent } from 'vite-plus/test/context';
import {
	captureVisual,
	captureVisualAppearance,
	focusViaKeyboard,
	Grid,
	renderVisual,
	Stack,
	visualAppearances,
} from '../test-utils/render-visual.js';
import { Link } from './index.js';

test('tones and states', async () => {
	const locator = renderVisual(
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
		</Stack>,
	);

	await captureVisual(locator, 'link/tones-states');
});

test('keyboard focus ring', async () => {
	const scene = renderVisual(
		<Stack>
			<Link href="#">Focus link</Link>
		</Stack>,
	);

	await focusViaKeyboard(page.getByRole('link', { name: 'Focus link' }));
	await captureVisual(scene, 'link/focus-visible');
});

test.each(visualAppearances)('navigation states: $theme $mode', async (appearance) => {
	const scene = renderVisual(
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
		</Grid>,
		appearance,
	);
	const accent = page.getByRole('link', { name: 'Accent' });
	const neutral = page.getByRole('link', { name: 'Neutral' });
	const disabled = page.getByRole('link', { name: 'Disabled' });

	expect(getComputedStyle(accent.element()).color).not.toBe(
		getComputedStyle(neutral.element()).color,
	);
	expect(getComputedStyle(disabled.element()).opacity).toBe('0.55');

	await captureVisualAppearance(scene, 'link/navigation-states', appearance);
});

test.each(visualAppearances)('interactive states: $theme $mode', async (appearance) => {
	const scene = renderVisual(
		<Stack align="flex-start">
			<Link href="#" isStandalone>
				Destination
			</Link>
		</Stack>,
		appearance,
	);
	const link = page.getByRole('link', { name: 'Destination' });
	await expect.element(link).toBeVisible();

	await captureVisualAppearance(scene, 'link/resting', appearance);
	await userEvent.hover(link);
	await captureVisualAppearance(scene, 'link/hover', appearance);
	await userEvent.unhover(link);
	await focusViaKeyboard(link);
	await captureVisualAppearance(scene, 'link/focus-visible', appearance);
	await userEvent.keyboard('{Enter>}');
	await expect.element(link).toHaveAttribute('data-pressed', 'true');
	await captureVisualAppearance(scene, 'link/pressed', appearance);
	await userEvent.keyboard('{/Enter}');
});

test('forced-colors navigation states', async () => {
	await emulateForcedColors('active');

	try {
		const scene = renderVisual(
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
		const pressed = page.getByRole('link', { name: 'Pressed and focused' });
		const disabled = page.getByRole('link', { name: 'Disabled' });

		await userEvent.hover(hovered);
		await userEvent.tab();
		await userEvent.tab();
		await userEvent.tab();
		await userEvent.keyboard('{Enter>}');

		await expect.element(pressed).toHaveAttribute('data-pressed', 'true');
		await expect.element(pressed).toHaveAttribute('data-focus-visible', 'true');
		await expect.element(disabled).toBeVisible();
		await expect.element(disabled).toHaveStyle({ opacity: '1' });
		await captureVisual(scene, 'link/forced-colors-states');
		await userEvent.keyboard('{/Enter}');
	} finally {
		await emulateForcedColors('none');
	}
});

async function emulateForcedColors(value: 'active' | 'none') {
	await cdp().send('Emulation.setEmulatedMedia', {
		features: [{ name: 'forced-colors', value }],
	});
}
