import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { Button } from '../button/index.js';
import { Icon } from '../icon/index.js';
import { inputGroup } from '../recipes/input-group.css.js';
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
import {
	InputGroup,
	InputGroupInput,
	InputGroupPrefix,
	InputGroupSuffix,
} from './primitive/index.js';

// The `invalidIndicator` slot's `marginInlineEnd` now has a `size` variant (it matches
// the control's own horizontal padding at each size, see `input-group.css.ts`), so the
// full class string differs between `small` and `medium`. Only its first token — the
// slot's base class — is stable across sizes, so that is what a lookup keys on.
const invalidIndicatorClass = inputGroup().invalidIndicator().split(' ')[0];

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

test('prefix and suffix', async () => {
	const locator = renderVisual(
		<Stack>
			<TextField label="Amount" name="amount" placeholder="0.00" prefix="$" />
			<TextField label="Total" name="total" placeholder="0.00" suffix="USD" />
		</Stack>,
	);

	await captureVisual(locator, 'text-field/prefix-and-suffix');
});

// #247/#312: the invalid icon must land before a trailing `suffix`, not after it — the
// exact ordering that broke and the plain `prefix and suffix` scene above has no invalid
// case to catch. Geometry, not just a screenshot, pins the invariant: the icon is
// appended after the suffix in DOM order and only the suffix's flex `order` puts it
// back in front, so its rendered position is the thing worth asserting.
test('invalid field with a suffix shows the icon before it', async () => {
	const scene = renderVisual(
		<Stack>
			<TextField
				defaultValue="0.00"
				errorMessage="Enter a valid amount."
				isInvalid
				label="Invalid with a suffix"
				name="invalid-suffix"
				placeholder="0.00"
				suffix="USD"
			/>
		</Stack>,
	);
	const input = page.getByRole('textbox', { name: 'Invalid with a suffix' });
	await expect.element(input).toBeVisible();

	const group = input.element().parentElement;
	const icon = group?.querySelector(`.${invalidIndicatorClass}`);
	if (icon == null) throw new Error('Expected the invalid indicator icon.');

	const suffixText = page.getByText('USD');
	expect(icon.getBoundingClientRect().left).toBeLessThan(
		suffixText.element().getBoundingClientRect().left,
	);

	await captureVisual(scene, 'text-field/invalid-with-suffix');
});

// The compositions the primitive exists to serve: a prefix, a plain-text suffix, and an
// interactive suffix. The interactive one is not reachable through the composed
// `TextField`'s prop API at all, and none of the three was covered before this scene.
// The prefix icon carries no `size`: it takes the control's own step from the
// `IconSizeProvider` `InputGroup` supplies, which is the behaviour worth capturing.
test('input group composition', async () => {
	const scene = renderVisual(
		<Stack>
			<InputGroup>
				<InputGroupPrefix>$</InputGroupPrefix>
				<InputGroupInput aria-label="Amount" defaultValue="1250.00" inputMode="decimal" />
				<InputGroupSuffix>USD</InputGroupSuffix>
			</InputGroup>
			<InputGroup>
				<InputGroupInput aria-label="Workspace" defaultValue="acme" />
				<InputGroupSuffix>.luke-ui.dev</InputGroupSuffix>
			</InputGroup>
			<InputGroup>
				<InputGroupPrefix>
					<Icon aria-hidden name="search" />
				</InputGroupPrefix>
				<InputGroupInput aria-label="Search" defaultValue="invoices" />
				<InputGroupSuffix>
					<Button appearance="subtle" size="small">
						Clear
					</Button>
				</InputGroupSuffix>
			</InputGroup>
			<InputGroup isInvalid size="small">
				<InputGroupPrefix>$</InputGroupPrefix>
				<InputGroupInput aria-label="Refund" defaultValue="-1" inputMode="decimal" />
				<InputGroupSuffix>USD</InputGroupSuffix>
			</InputGroup>
		</Stack>,
	);
	await expect.element(page.getByRole('textbox', { name: 'Refund' })).toBeVisible();

	await captureVisual(scene, 'text-field/input-group-composition');
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

for (const appearance of visualAppearances) {
	test(`material states: ${appearance.theme} ${appearance.mode}`, async () => {
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
}

for (const appearance of visualAppearances) {
	test(`interactive states: ${appearance.theme} ${appearance.mode}`, async () => {
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
}

for (const appearance of visualAppearances) {
	test(`invalid interactive states: ${appearance.theme} ${appearance.mode}`, async () => {
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
}

// #247: without `errorMessage` the icon is the only cue that the field is invalid, so
// this scene has no error text at all.
for (const appearance of visualAppearances) {
	test(`invalid without an error message: ${appearance.theme} ${appearance.mode}`, async () => {
		const scene = renderVisual(
			<TextField isInvalid label="Invalid, no message" name="invalid-no-message" />,
			appearance,
		);
		await expect.element(page.getByRole('textbox', { name: 'Invalid, no message' })).toBeVisible();

		await captureVisualAppearance(scene, 'text-field/invalid-no-message', appearance);
	});
}

// The in-control icon scales with `size` (`INPUT_GROUP_ICON_SIZE` maps `small` to the
// `xsmall` icon step, applied through `IconSizeProvider`), so this locks in the small
// control at its own icon scale rather than the `medium` default.
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
