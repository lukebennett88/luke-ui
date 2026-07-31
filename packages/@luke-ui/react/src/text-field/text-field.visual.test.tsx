import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	focusViaKeyboard,
	pseudoElementLeft,
	renderVisual,
	Stack,
	visualAppearances,
} from '../test-utils/render-visual.js';
import { TextField } from './index.js';

test('sizes', async () => {
	const locator = renderVisual(
		<Stack>
			<TextField
				description="Small control size."
				label="Small"
				name="small"
				placeholder="Small"
				size="small"
			/>
			<TextField
				description="Medium control size."
				label="Medium"
				name="medium"
				placeholder="Medium"
				size="medium"
			/>
		</Stack>,
	);

	await captureVisual(locator, 'text-field/sizes');
});

test('states: default, disabled, read-only, invalid', async () => {
	const locator = renderVisual(
		<Stack>
			<TextField label="Default" name="default" placeholder="Type here" />
			<TextField defaultValue="Unavailable" isDisabled label="Disabled" name="disabled" />
			<TextField defaultValue="Read only" isReadOnly label="Read-only" name="readonly" />
			<TextField
				defaultValue="nope"
				errorMessage="Please enter a valid email."
				isInvalid
				label="Invalid"
				name="invalid"
			/>
		</Stack>,
	);

	await captureVisual(locator, 'text-field/states');
});

test('adornments', async () => {
	const locator = renderVisual(
		<Stack>
			<TextField adornmentStart="$" label="Amount" name="amount" placeholder="0.00" />
			<TextField adornmentEnd="USD" label="Total" name="total" placeholder="0.00" />
		</Stack>,
	);

	await captureVisual(locator, 'text-field/adornments');
});

// #247/#312: the invalid icon must land before a trailing `adornmentEnd`, not after
// it — the exact ordering that broke and the plain `adornments` scene above has no
// invalid case to catch. Geometry, not just a screenshot, pins the invariant.
test('invalid field with an adornment shows the icon before it', async () => {
	const scene = renderVisual(
		<Stack>
			<TextField
				adornmentEnd="USD"
				defaultValue="0.00"
				errorMessage="Enter a valid amount."
				isInvalid
				label="Invalid with an adornment"
				name="invalid-adornment"
				placeholder="0.00"
			/>
		</Stack>,
	);
	const input = page.getByRole('textbox', { name: 'Invalid with an adornment' });
	await expect.element(input).toBeVisible();

	const adornmentEnd = page.getByText('USD');
	const iconLeft = await pseudoElementLeft('name', 'invalid-adornment');
	expect(iconLeft).toBeLessThan(adornmentEnd.element().getBoundingClientRect().left);

	await captureVisual(scene, 'text-field/invalid-with-adornment');
});

test('keyboard focus ring', async () => {
	const scene = renderVisual(
		<Stack>
			<TextField label="Focus me" name="focus" placeholder="Type here" />
		</Stack>,
	);

	await focusViaKeyboard(page.getByRole('textbox', { name: 'Focus me' }));
	await captureVisual(scene, 'text-field/focus');
});

test.each(visualAppearances)('material states: $theme $mode', async (appearance) => {
	const scene = renderVisual(
		<Stack>
			<TextField label="Default" name="default" placeholder="Type here" />
			<TextField defaultValue="Unavailable" isDisabled label="Disabled" name="disabled" />
			<TextField defaultValue="Read only" isReadOnly label="Read-only" name="readonly" />
			<TextField
				defaultValue="nope"
				errorMessage="Please enter a valid email."
				isInvalid
				label="Invalid"
				name="invalid"
			/>
		</Stack>,
		appearance,
	);
	await expect.element(page.getByLabelText('Default')).toBeVisible();

	await captureVisualAppearance(scene, 'text-field/material-states', appearance);
});

test.each(visualAppearances)('interactive states: $theme $mode', async (appearance) => {
	const scene = renderVisual(
		<TextField label="Focus me" name="focus" placeholder="Type here" />,
		appearance,
	);
	const input = page.getByRole('textbox', { name: 'Focus me' });
	await expect.element(input).toBeVisible();

	await captureVisualAppearance(scene, 'text-field/resting', appearance);
	await userEvent.hover(input);
	await captureVisualAppearance(scene, 'text-field/hover', appearance);
	await userEvent.unhover(input);
	await focusViaKeyboard(input);
	await captureVisualAppearance(scene, 'text-field/focus-visible', appearance);
});

test.each(visualAppearances)('invalid interactive states: $theme $mode', async (appearance) => {
	const scene = renderVisual(
		<TextField
			defaultValue="nope"
			errorMessage="Please enter a valid email."
			isInvalid
			label="Invalid"
			name="invalid"
		/>,
		appearance,
	);
	const input = page.getByRole('textbox', { name: 'Invalid' });
	await expect.element(input).toBeVisible();

	await captureVisualAppearance(scene, 'text-field/invalid', appearance);
	await focusViaKeyboard(input);
	await captureVisualAppearance(scene, 'text-field/invalid-focus', appearance);
});

// #247: without `errorMessage` the icon is the only cue that the field is invalid, so
// this scene has no error text at all.
test.each(visualAppearances)(
	'invalid without an error message: $theme $mode',
	async (appearance) => {
		const scene = renderVisual(
			<TextField isInvalid label="Invalid, no message" name="invalid-no-message" />,
			appearance,
		);
		await expect.element(page.getByRole('textbox', { name: 'Invalid, no message' })).toBeVisible();

		await captureVisualAppearance(scene, 'text-field/invalid-no-message', appearance);
	},
);

// The in-control icon scales with `size` (`invalidIndicatorIcon` takes a size from
// `text-input.css.ts`'s `size` variant, `xsmall` at `small`), so this locks in the
// small control at its own icon scale rather than the `medium` default.
test('invalid at the small size', async () => {
	const scene = renderVisual(
		<TextField
			defaultValue="nope"
			errorMessage="Please enter a valid email."
			isInvalid
			label="Invalid"
			name="invalid-small"
			size="small"
		/>,
	);
	await expect.element(page.getByRole('textbox', { name: 'Invalid' })).toBeVisible();

	await captureVisual(scene, 'text-field/invalid-small');
});

test('forced-colors states', async () => {
	await emulateForcedColors('active');

	try {
		const scene = renderVisual(
			<Stack>
				<TextField label="Interactive" name="interactive" placeholder="Type here" />
				<TextField defaultValue="Unavailable" isDisabled label="Disabled" name="disabled" />
				<TextField defaultValue="Read only" isReadOnly label="Read-only" name="readonly" />
				<TextField
					defaultValue="nope"
					errorMessage="Please enter a valid email."
					isInvalid
					label="Invalid"
					name="invalid"
				/>
			</Stack>,
		);
		const input = page.getByRole('textbox', { name: 'Interactive' });

		await expect.element(page.getByRole('textbox', { name: 'Disabled' })).toBeDisabled();
		await expect
			.element(page.getByRole('textbox', { name: 'Read-only' }))
			.toHaveAttribute('readonly');
		await expect
			.element(page.getByRole('textbox', { name: 'Invalid' }))
			.toHaveAttribute('aria-invalid', 'true');
		await captureVisual(scene, 'text-field/forced-colors-resting-states');
		await userEvent.hover(input);
		await captureVisual(scene, 'text-field/forced-colors-hover');
		await userEvent.unhover(input);
		await focusViaKeyboard(input);
		await captureVisual(scene, 'text-field/forced-colors-focus-visible');
	} finally {
		await emulateForcedColors('none');
	}
});
