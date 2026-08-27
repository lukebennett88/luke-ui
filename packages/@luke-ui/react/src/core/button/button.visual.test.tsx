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
	variantValuesFor,
} from '../test-utils/visual.js';
import { Button } from './button.js';

const tones = variantValuesFor<typeof Button, 'tone'>()(['neutral', 'accent', 'danger']);
const appearances = variantValuesFor<typeof Button, 'appearance'>()(['solid', 'subtle', 'ghost']);
const sizes = variantValuesFor<typeof Button, 'size'>()(['small', 'medium']);

test('kitchen sink', async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(
			<Grid columns={appearances.length}>
				{sizes.flatMap((size) => {
					return tones.flatMap((tone) => {
						return appearances.map((buttonAppearance) => (
							<Button
								appearance={buttonAppearance}
								key={`${size}-${tone}-${buttonAppearance}`}
								size={size}
								tone={tone}
							>
								{tone} {buttonAppearance}
							</Button>
						));
					});
				})}
				<Button>Default</Button>
				<Button isDisabled>Disabled</Button>
				<Button isPending>Pending</Button>
				<Button startIcon={<Icon name="add" />}>With icon</Button>
				<Button
					endIcon={
						<>
							<Icon name="check" />
							<Icon name="close" />
						</>
					}
					startIcon={
						<>
							<Icon name="add" />
							<Icon name="search" />
						</>
					}
				>
					New task
				</Button>
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
