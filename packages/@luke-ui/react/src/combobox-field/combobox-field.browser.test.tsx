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
// as optional — the case #247 flags as otherwise colour-only and imperceptible.
test('invalid without an error message still carries a non-colour cue', async () => {
	renderVisual(
		<ComboboxField defaultItems={countryItems} isInvalid label="Invalid" name="invalid">
			{renderCountryItem}
		</ComboboxField>,
	);

	const input = page.getByRole('combobox', { name: 'Invalid' });
	await expect.element(input).toBeVisible();

	const control = input.element().closest<HTMLElement>('[role="group"]');
	if (control == null) throw new Error('Expected the combobox control group.');

	const badge = getComputedStyle(control, '::after');
	expect(badge.content).not.toBe('none');
	expect(badge.content).toContain('!');

	expect(getComputedStyle(control).borderWidth).toBe('2px');
});

test('valid control keeps the 1px boundary the invalid state widens', async () => {
	renderVisual(
		<ComboboxField defaultItems={countryItems} label="Valid" name="valid">
			{renderCountryItem}
		</ComboboxField>,
	);

	const input = page.getByRole('combobox', { name: 'Valid' });
	await expect.element(input).toBeVisible();

	const control = input.element().closest<HTMLElement>('[role="group"]');
	if (control == null) throw new Error('Expected the combobox control group.');

	expect(getComputedStyle(control).borderWidth).toBe('1px');
});

test('the badge glyph stays out of the accessible name', async () => {
	renderVisual(
		<ComboboxField defaultItems={countryItems} isInvalid label="Invalid" name="invalid">
			{renderCountryItem}
		</ComboboxField>,
	);

	const input = page.getByRole('combobox', { name: 'Invalid' });
	await expect.element(input).toHaveAccessibleName('Invalid');
});
