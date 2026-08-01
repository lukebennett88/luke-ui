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

for (const appearance of visualAppearances) {
	test(`material states: ${appearance.theme} ${appearance.mode}`, async () => {
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
}

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

// An invalid checkbox's control still needs the same first-line alignment fix as
// any other checkbox once its label wraps — it just no longer carries the error
// icon itself (see the message-icon test below for that).
test('invalid control aligns with a wrapping label’s first line', async () => {
	const scene = renderVisual(
		<Stack width="20rem">
			<Checkbox defaultSelected isInvalid name="invalid-wrapping">
				This label wraps onto a second line so the control should sit on the first line, not float
				at the row's top edge.
			</Checkbox>
		</Stack>,
	);

	await expect.element(page.getByRole('checkbox', { name: /This label wraps/ })).toBeVisible();
	await captureVisual(scene, 'checkbox/invalid-wrapping-label');
});

// #247/#312: the error icon now sits on the message (not the control), so it needs
// its own first-line alignment proof — the message text wraps to several lines and
// the icon must stay pinned to the first one instead of centring against the whole
// block.
test('error message icon aligns with a wrapping message’s first line', async () => {
	const scene = renderVisual(
		<Stack width="20rem">
			<Checkbox
				defaultSelected
				errorMessage="This error message wraps onto a second and third line so the icon should sit on the first line, not centre itself against the whole block."
				isInvalid
				name="invalid-wrapping-message"
			>
				Accept the terms
			</Checkbox>
		</Stack>,
	);

	await expect.element(page.getByRole('checkbox', { name: 'Accept the terms' })).toBeVisible();
	await captureVisual(scene, 'checkbox/invalid-wrapping-message');
});

// `errorMessage` is typed `ReactNode`, so rich content (not just a plain string) is
// supported and common. A `flex` message container turned each top-level child of
// content like this into its own independently-wrapping column — this scene is the
// regression guard for that, uncovered until it was found by rendering exactly this
// case.
test('error message renders rich content without breaking into flex columns', async () => {
	const scene = renderVisual(
		<Stack width="20rem">
			<Checkbox
				defaultSelected
				errorMessage={
					<>
						Please accept the <strong>updated terms</strong> before continuing.
					</>
				}
				isInvalid
				name="invalid-rich-message"
			>
				Accept the terms
			</Checkbox>
		</Stack>,
	);

	await expect.element(page.getByRole('checkbox', { name: 'Accept the terms' })).toBeVisible();
	await captureVisual(scene, 'checkbox/invalid-rich-message');
});
