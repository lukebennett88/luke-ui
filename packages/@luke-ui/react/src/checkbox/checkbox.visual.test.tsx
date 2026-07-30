import { expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	focusViaKeyboard,
	renderVisual,
	Stack,
	visualAppearances,
} from '../test-utils/render-visual.js';
import { Text } from '../text/index.js';
import { Checkbox } from './index.js';

test('states: default, selected, indeterminate, disabled, invalid', async () => {
	const scene = renderVisual(
		<Stack>
			<Checkbox name="default">Default</Checkbox>
			<Checkbox defaultSelected name="selected">
				Selected
			</Checkbox>
			<Checkbox isIndeterminate name="indeterminate">
				Indeterminate
			</Checkbox>
			<Checkbox defaultSelected isDisabled name="disabled">
				Disabled
			</Checkbox>
			<Checkbox defaultSelected errorMessage="Choose an option." isInvalid name="invalid">
				Invalid
			</Checkbox>
		</Stack>,
	);

	await expect.element(page.getByRole('checkbox', { name: 'Default' })).toBeVisible();
	await captureVisual(scene, 'checkbox/states');
});

test('keyboard focus ring', async () => {
	const scene = renderVisual(<Checkbox name="focus">Focus me</Checkbox>);
	await focusViaKeyboard(page.getByRole('checkbox', { name: 'Focus me' }));
	await captureVisual(scene, 'checkbox/focus-visible');
});

test.each(visualAppearances)('material states: $theme $mode', async (appearance) => {
	const scene = renderVisual(
		<Stack>
			<Checkbox name="default">Default</Checkbox>
			<Checkbox defaultSelected name="selected">
				Selected
			</Checkbox>
			<Checkbox isIndeterminate name="indeterminate">
				Indeterminate
			</Checkbox>
			<Checkbox defaultSelected isDisabled name="disabled">
				Disabled
			</Checkbox>
			<Checkbox defaultSelected errorMessage="Choose an option." isInvalid name="invalid">
				Invalid
			</Checkbox>
		</Stack>,
		appearance,
	);
	await expect.element(page.getByRole('checkbox', { name: 'Default' })).toBeVisible();
	await captureVisualAppearance(scene, 'checkbox/material-states', appearance);
});

test('forced-colors states', async () => {
	await emulateForcedColors('active');

	try {
		const scene = renderVisual(
			<Stack>
				<Checkbox name="default">Default</Checkbox>
				<Checkbox defaultSelected name="selected">
					Selected
				</Checkbox>
				<Checkbox isIndeterminate name="indeterminate">
					Indeterminate
				</Checkbox>
				<Checkbox defaultSelected isDisabled name="disabled">
					Disabled
				</Checkbox>
				<Checkbox defaultSelected isInvalid name="invalid">
					Invalid
				</Checkbox>
			</Stack>,
		);
		await captureVisual(scene, 'checkbox/forced-colors-states');
	} finally {
		await emulateForcedColors('none');
	}
});

test('first-line label alignment across Text sizes', async () => {
	const scene = renderVisual(
		<Stack width="26rem">
			{(['100', '200', '300', '400', '500', '600', '700', '800', '900'] as const).map((size) => (
				<Text key={size} elementType="div" size={size}>
					<Checkbox name={`text-${size}`}>
						{size}: This label wraps to show that the control aligns with its first line.
					</Checkbox>
				</Text>
			))}
			<Checkbox name="standalone">Standalone control</Checkbox>
		</Stack>,
	);

	await captureVisual(scene, 'checkbox/first-line-alignment');
});
