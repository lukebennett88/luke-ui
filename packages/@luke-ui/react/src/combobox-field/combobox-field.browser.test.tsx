import { afterEach, expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import {
	comboboxTrayKeyboardInsetVar,
	comboboxTrayViewportHeightVar,
} from '../recipes/combobox.css.js';
import { cleanupVisual, renderVisual } from '../test-utils/render-visual.js';
import { ComboboxField } from './index.js';
import { ComboboxItem } from './primitive/item.js';

type CountryItem = {
	id: string;
	label: string;
};

const countryItems: Array<CountryItem> = [
	{ id: 'au', label: 'Australia' },
	{ id: 'ca', label: 'Canada' },
];

const renderCountryItem = (item: CountryItem) => <ComboboxItem>{item.label}</ComboboxItem>;

const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'visualViewport');

afterEach(() => {
	cleanupVisual();
	if (originalDescriptor) {
		Object.defineProperty(window, 'visualViewport', originalDescriptor);
	} else {
		// @ts-expect-error -- deleting a test-only own property
		delete window.visualViewport;
	}
});

test('sets the tray viewport height and keyboard inset custom properties from visualViewport', async () => {
	const fake = Object.assign(new EventTarget(), {
		height: window.innerHeight - 300,
		offsetTop: 0,
	});
	Object.defineProperty(window, 'visualViewport', { configurable: true, value: fake });

	renderVisual(
		<ComboboxField
			defaultItems={countryItems}
			label="Country"
			name="country"
			placeholder="Select a country..."
		>
			{renderCountryItem}
		</ComboboxField>,
	);

	await userEvent.click(page.getByRole('combobox', { name: 'Country' }));
	await expect.element(page.getByRole('listbox')).toBeInTheDocument();

	const popover = document.querySelector('[role="listbox"]')?.parentElement;
	if (!popover) throw new Error('expected the listbox to have a popover parent');

	expect(popover.style.getPropertyValue(comboboxTrayViewportHeightVar)).toBe(`${fake.height}px`);
	expect(popover.style.getPropertyValue(comboboxTrayKeyboardInsetVar)).toBe(
		`${window.innerHeight - fake.height}px`,
	);

	fake.height -= 100;
	fake.dispatchEvent(new Event('resize'));

	expect(popover.style.getPropertyValue(comboboxTrayViewportHeightVar)).toBe(`${fake.height}px`);
	expect(popover.style.getPropertyValue(comboboxTrayKeyboardInsetVar)).toBe(
		`${window.innerHeight - fake.height}px`,
	);
});

// Proves the invalid cue survives without `errorMessage`, which `composeField` treats
// as optional and which would otherwise leave the field colour-only and imperceptible.
// The border stays at the resting 1px (see `combobox.css.ts`): the in-control icon is
// the non-colour cue here, so the proof is the icon's presence plus the gated border
// colour, not a border-width change.
test('invalid without an error message still carries a non-colour cue', async () => {
	renderVisual(
		<>
			<ComboboxField defaultItems={countryItems} label="Resting" name="resting">
				{renderCountryItem}
			</ComboboxField>
			<ComboboxField defaultItems={countryItems} isInvalid label="Invalid" name="invalid">
				{renderCountryItem}
			</ComboboxField>
		</>,
	);

	const restingInput = page.getByRole('combobox', { name: 'Resting' });
	const invalidInput = page.getByRole('combobox', { name: 'Invalid' });
	await expect.element(invalidInput).toBeVisible();

	const restingControl = restingInput.element().closest<HTMLElement>('[role="group"]');
	const invalidControl = invalidInput.element().closest<HTMLElement>('[role="group"]');
	if (restingControl == null || invalidControl == null) {
		throw new Error('Expected both combobox control groups.');
	}

	const icon = getComputedStyle(invalidControl, '::after');
	expect(icon.content).toBe('""');
	expect(icon.maskImage).not.toBe('none');

	expect(getComputedStyle(invalidControl).borderWidth).toBe('1px');
	expect(getComputedStyle(invalidControl).borderColor).not.toBe(
		getComputedStyle(restingControl).borderColor,
	);
});

// A React Aria upgrade that stopped publishing these on `GroupContext` would silently stop the state selectors matching.
test('the control group carries its own disabled and invalid attributes', async () => {
	renderVisual(
		<>
			<ComboboxField defaultItems={countryItems} isDisabled label="Disabled" name="disabled">
				{renderCountryItem}
			</ComboboxField>
			<ComboboxField defaultItems={countryItems} isInvalid label="Invalid" name="invalid">
				{renderCountryItem}
			</ComboboxField>
			<ComboboxField defaultItems={countryItems} label="Resting" name="resting">
				{renderCountryItem}
			</ComboboxField>
		</>,
	);

	const disabledControl = getControl('Disabled');
	const invalidControl = getControl('Invalid');
	const restingControl = getControl('Resting');

	expect(disabledControl.dataset.disabled).toBe('true');
	expect(invalidControl.dataset.invalid).toBe('true');

	// The trigger is disabled too, but it is not what carries the group's treatment.
	expect(disabledControl.querySelector('button')?.disabled).toBe(true);

	const disabledStyle = getComputedStyle(disabledControl);
	expect(disabledStyle.opacity).toBe('0.55');
	expect(disabledStyle.cursor).toBe('not-allowed');

	const invalidStyle = getComputedStyle(invalidControl);
	expect(invalidStyle.borderColor).not.toBe(getComputedStyle(restingControl).borderColor);
	expect(getComputedStyle(invalidControl, '::after').content).toBe('""');
});

// React Aria disables the trigger on a read-only combobox, which must not make the control read as disabled.
test('read-only controls keep the read-only material, not the disabled one', async () => {
	renderVisual(
		<>
			<ComboboxField defaultItems={countryItems} isReadOnly label="Read-only" name="readOnly">
				{renderCountryItem}
			</ComboboxField>
			<ComboboxField defaultItems={countryItems} isDisabled label="Disabled" name="disabled">
				{renderCountryItem}
			</ComboboxField>
			<ComboboxField defaultItems={countryItems} label="Resting" name="resting">
				{renderCountryItem}
			</ComboboxField>
		</>,
	);

	const readOnlyControl = getControl('Read-only');
	const restingControl = getControl('Resting');

	// The group itself is not disabled, even though the trigger inside it is.
	expect(readOnlyControl.dataset.disabled).toBeUndefined();
	expect(readOnlyControl.querySelector('button')?.disabled).toBe(true);

	const readOnlyStyle = getComputedStyle(readOnlyControl);
	const restingStyle = getComputedStyle(restingControl);
	expect(readOnlyStyle.opacity).toBe('1');
	expect(readOnlyStyle.cursor).toBe(restingStyle.cursor);
	// The read-only slot flattens the recessed well: no depth, decorative border.
	expect(readOnlyStyle.boxShadow).toBe('none');
	expect(restingStyle.boxShadow).not.toBe('none');
	expect(readOnlyStyle.borderColor).not.toBe(restingStyle.borderColor);
	expect(getComputedStyle(getControl('Disabled')).opacity).toBe('0.55');
});

test('the indicator icon adds no text to the accessible name', async () => {
	renderVisual(
		<ComboboxField defaultItems={countryItems} isInvalid label="Invalid" name="invalid">
			{renderCountryItem}
		</ComboboxField>,
	);

	const input = page.getByRole('combobox', { name: 'Invalid' });
	await expect.element(input).toHaveAccessibleName('Invalid');
});

/** The control group wrapping the combobox input labelled `name`. */
function getControl(name: string) {
	const control = page
		.getByRole('combobox', { name })
		.element()
		.closest<HTMLElement>('[role="group"]');
	if (control == null) throw new Error(`Expected a control group for the "${name}" combobox.`);
	return control;
}
