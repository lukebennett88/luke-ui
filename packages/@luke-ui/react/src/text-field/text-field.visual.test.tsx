import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	focusViaKeyboard,
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
