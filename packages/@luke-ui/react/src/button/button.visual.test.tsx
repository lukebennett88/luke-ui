import { expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { Icon } from '../icon/index.js';
import {
	focusViaKeyboard,
	Grid,
	renderVisual,
	variantValuesFor,
} from '../test-utils/render-visual.js';
import { Button } from './index.js';

const tones = variantValuesFor<typeof Button, 'tone'>()([
	'primary',
	'critical',
	'ghost',
	'neutral',
]);
const sizes = variantValuesFor<typeof Button, 'size'>()(['small', 'medium']);

test('tones across sizes', async () => {
	const locator = renderVisual(
		<Grid columns={tones.length}>
			{sizes.flatMap((size) =>
				tones.map((tone) => (
					<Button key={`${size}-${tone}`} size={size} tone={tone}>
						{tone}
					</Button>
				)),
			)}
		</Grid>,
	);

	await expect.element(locator).toMatchScreenshot('button-tones');
});

test('states: disabled, pending, with icons', async () => {
	const locator = renderVisual(
		<Grid columns={4}>
			<Button tone="primary">Default</Button>
			<Button isDisabled tone="primary">
				Disabled
			</Button>
			<Button isPending tone="primary">
				Pending
			</Button>
			<Button startIcon={<Icon name="add" />} tone="primary">
				With icon
			</Button>
		</Grid>,
	);

	await expect.element(locator).toMatchScreenshot('button-states');
});

test('keyboard focus ring', async () => {
	const scene = renderVisual(
		<Grid columns={1}>
			<Button tone="primary">Focus me</Button>
		</Grid>,
	);

	await focusViaKeyboard(page.getByRole('button', { name: 'Focus me' }));
	await expect.element(scene).toMatchScreenshot('button-focus-visible');
});
