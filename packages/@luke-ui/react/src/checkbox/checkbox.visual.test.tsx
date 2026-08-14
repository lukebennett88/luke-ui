import { test } from 'vite-plus/test';
import type { Locator } from 'vite-plus/test/context';
import { page, userEvent } from 'vite-plus/test/context';
import { render, visualAppearances } from '../test-utils/render.js';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	focusViaKeyboard,
	Stack,
} from '../test-utils/visual.js';
import { Text } from '../text/index.js';
import { typeStyles } from '../theme/contract.js';
import { Checkbox } from './index.js';

test('kitchen sink', async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(
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
				{typeStyles.map((typography) => (
					<Text elementType="div" key={typography} typography={typography}>
						<Checkbox name={`text-${typography}`}>
							{typography}: This label wraps to show that the control aligns with its first line.
						</Checkbox>
					</Text>
				))}
				<Checkbox name="standalone">Standalone control</Checkbox>
				<Checkbox defaultSelected isInvalid name="invalid-wrapping">
					This label wraps onto a second line so the control should sit on the first line, not float
					at the row's top edge.
				</Checkbox>
				<Checkbox
					defaultSelected
					errorMessage="This error message wraps onto a second and third line so the icon should sit on the first line, not centre itself against the whole block."
					isInvalid
					name="invalid-wrapping-message"
				>
					Accept the terms
				</Checkbox>
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
			{ appearance },
		);
		await captureVisualAppearance(locator, 'checkbox/kitchen-sink', appearance);
	}
});

test('keyboard focus ring', async () => {
	const { locator } = render(<Checkbox name="focus">Focus me</Checkbox>);
	await focusViaKeyboard(page.getByRole('checkbox', { name: 'Focus me' }));
	await captureVisual(locator, 'checkbox/focus-visible');
});

test('interactive states', async () => {
	const { locator } = render(
		<Stack>
			<Checkbox isInvalid name="invalid-unchecked">
				Invalid
			</Checkbox>
			<Checkbox defaultSelected isInvalid name="invalid-selected">
				Invalid selected
			</Checkbox>
			<Checkbox isIndeterminate isInvalid name="invalid-indeterminate">
				Invalid indeterminate
			</Checkbox>
		</Stack>,
	);
	const unchecked = page.getByRole('checkbox', { exact: true, name: 'Invalid' });
	const selected = page.getByRole('checkbox', { exact: true, name: 'Invalid selected' });
	const indeterminate = page.getByRole('checkbox', {
		exact: true,
		name: 'Invalid indeterminate',
	});

	for (const [name, checkbox] of [
		['unchecked', unchecked],
		['selected', selected],
		['indeterminate', indeterminate],
	] as const) {
		const label = checkboxLabel(checkbox);
		await userEvent.hover(label);
		await captureVisual(locator, `checkbox/invalid-hover-${name}`);
		await userEvent.unhover(label);
		await pressCheckbox(checkbox);
		await captureVisual(locator, `checkbox/invalid-pressed-${name}`);
		await userEvent.keyboard('{/Space}');
	}
});

test('unchecked interactive states', async () => {
	render(<Checkbox name="terms">Accept terms</Checkbox>);
	const checkbox = page.getByRole('checkbox', { name: 'Accept terms' });
	const label = page.elementLocator(checkboxLabel(checkbox));

	await userEvent.hover(checkboxLabel(checkbox));
	await captureVisual(label, 'checkbox/unchecked-hover');
	await userEvent.unhover(checkboxLabel(checkbox));
	await pressCheckbox(checkbox);
	await captureVisual(label, 'checkbox/unchecked-pressed');
	await userEvent.keyboard('{/Space}');
});

test('unchecked interactive states in dark mode', async () => {
	render(<Checkbox name="terms">Accept terms</Checkbox>, {
		appearance: { mode: 'dark', theme: 'tactile' },
	});
	const checkbox = page.getByRole('checkbox', { name: 'Accept terms' });
	const label = page.elementLocator(checkboxLabel(checkbox));

	await userEvent.hover(checkboxLabel(checkbox));
	await captureVisual(label, 'checkbox/unchecked-hover-tactile-dark');
	await userEvent.unhover(checkboxLabel(checkbox));
	await pressCheckbox(checkbox);
	await captureVisual(label, 'checkbox/unchecked-pressed-tactile-dark');
	await userEvent.keyboard('{/Space}');
});

test('selected interactive states', async () => {
	render(
		<Checkbox defaultSelected name="terms">
			Accept terms
		</Checkbox>,
	);
	const checkbox = page.getByRole('checkbox', { name: 'Accept terms' });
	const label = page.elementLocator(checkboxLabel(checkbox));

	await userEvent.hover(checkboxLabel(checkbox));
	await captureVisual(label, 'checkbox/selected-hover');
	await userEvent.unhover(checkboxLabel(checkbox));
	await pressCheckbox(checkbox);
	await captureVisual(label, 'checkbox/selected-pressed');
	await userEvent.keyboard('{/Space}');
});

test('invalid hover keeps the danger border', async () => {
	render(
		<Checkbox isInvalid name="terms">
			Accept terms
		</Checkbox>,
	);
	const checkbox = page.getByRole('checkbox', { name: 'Accept terms' });
	const label = page.elementLocator(checkboxLabel(checkbox));

	await userEvent.hover(checkboxLabel(checkbox));
	await captureVisual(label, 'checkbox/invalid-unchecked-hover');
});

/** The clickable `<label>` carrying a checkbox's interactive data attributes. */
function checkboxLabel(checkbox: Locator): HTMLElement {
	const label = checkbox.element().closest('label');
	if (label == null) throw new Error('Expected the checkbox content label.');
	return label;
}

/** Focuses a checkbox and holds the space key so its label enters its pressed state. */
async function pressCheckbox(checkbox: Locator): Promise<void> {
	checkbox.element().focus();
	await userEvent.keyboard('{Space>}');
}

test('forced-colors states', async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
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
		await captureVisual(locator, 'checkbox/forced-colors-states');
	} finally {
		await emulateForcedColors('none');
	}
});
