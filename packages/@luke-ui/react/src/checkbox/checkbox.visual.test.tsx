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

// #247: the invalid icon sits on `content`'s own `::after`, alongside the control
// and the label text, so it needs the same first-line alignment fix as the
// control — otherwise it floats at the row's top edge instead of the label's
// first line once the label wraps.
test('invalid icon aligns with a wrapping label’s first line', async () => {
	const scene = renderVisual(
		<Stack width="20rem">
			<Checkbox defaultSelected isInvalid name="invalid-wrapping">
				This label wraps onto a second line so the error icon should sit on the first line, not
				float at the row's top edge.
			</Checkbox>
		</Stack>,
	);

	await expect.element(page.getByRole('checkbox', { name: /This label wraps/ })).toBeVisible();
	await captureVisual(scene, 'checkbox/invalid-wrapping-label');
});
