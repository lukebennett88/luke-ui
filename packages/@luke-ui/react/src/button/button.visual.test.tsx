import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { Icon } from '../icon/index.js';
import {
	captureVisual,
	captureVisualAppearance,
	focusViaKeyboard,
	Grid,
	renderVisual,
	visualAppearances,
	variantValuesFor,
} from '../test-utils/render-visual.js';
import { Button } from './index.js';

const tones = variantValuesFor<typeof Button, 'tone'>()(['neutral', 'accent', 'danger']);
const appearances = variantValuesFor<typeof Button, 'appearance'>()(['solid', 'subtle', 'ghost']);
const sizes = variantValuesFor<typeof Button, 'size'>()(['small', 'medium']);

test('tones and appearances across sizes', async () => {
	const locator = renderVisual(
		<Grid columns={appearances.length}>
			{sizes.flatMap((size) => {
				return tones.flatMap((tone) =>
					appearances.map((appearance) => (
						<Button
							appearance={appearance}
							key={`${size}-${tone}-${appearance}`}
							size={size}
							tone={tone}
						>
							{tone} {appearance}
						</Button>
					)),
				);
			})}
		</Grid>,
	);

	await captureVisual(locator, 'button/tones');
});

test('states: disabled, pending, with icons', async () => {
	const locator = renderVisual(
		<Grid columns={4}>
			<Button>Default</Button>
			<Button isDisabled>Disabled</Button>
			<Button isPending>Pending</Button>
			<Button startIcon={<Icon name="add" />}>With icon</Button>
		</Grid>,
	);

	await captureVisual(locator, 'button/states');
});

test('keyboard focus ring', async () => {
	const scene = renderVisual(
		<Grid columns={1}>
			<Button>Focus me</Button>
		</Grid>,
	);

	await focusViaKeyboard(page.getByRole('button', { name: 'Focus me' }));
	await captureVisual(scene, 'button/focus-visible');
});

test.each(visualAppearances)('action states: $theme $mode', async (appearance) => {
	const scene = renderVisual(
		<Grid columns={5}>
			<Button>Resting</Button>
			<Button isDisabled>Disabled</Button>
			<Button isPending>Pending</Button>
			<Button appearance="subtle">Subtle</Button>
			<Button appearance="ghost">Ghost</Button>
		</Grid>,
		appearance,
	);
	await expect
		.element(page.getByRole('button', { name: 'Pending' }))
		.toHaveAttribute('aria-disabled', 'true');

	await captureVisualAppearance(scene, 'button/action-states', appearance);
});

test.each(visualAppearances)('interactive states: $theme $mode', async (appearance) => {
	const scene = renderVisual(<Button>Action</Button>, appearance);
	const button = page.getByRole('button', { name: 'Action' });
	await expect.element(button).toBeVisible();

	await captureVisualAppearance(scene, 'button/resting', appearance);
	await userEvent.hover(button);
	await captureVisualAppearance(scene, 'button/hover', appearance);
	await userEvent.unhover(button);
	await focusViaKeyboard(button);
	await captureVisualAppearance(scene, 'button/focus-visible', appearance);
	await userEvent.keyboard('{Space>}');
	await captureVisualAppearance(scene, 'button/pressed', appearance);
	await userEvent.keyboard('{/Space}');
});
