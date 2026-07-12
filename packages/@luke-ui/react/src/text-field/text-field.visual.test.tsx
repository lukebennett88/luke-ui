import { test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import {
	captureVisual,
	focusViaKeyboard,
	renderVisual,
	Stack,
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
