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
