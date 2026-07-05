import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { renderVisual, Stack } from '../test-utils/render-visual.js';
import { ComboboxField } from './index.js';
import { ComboboxItem } from './primitive/index.js';

type CountryItem = {
	id: string;
	label: string;
};

const countryItems: Array<CountryItem> = [
	{ id: 'au', label: 'Australia' },
	{ id: 'ca', label: 'Canada' },
	{ id: 'nz', label: 'New Zealand' },
	{ id: 'us', label: 'United States' },
	{ id: 'se', label: 'Sweden' },
];

const renderCountryItem = (item: CountryItem) => <ComboboxItem>{item.label}</ComboboxItem>;

test('default closed combobox', async () => {
	const locator = renderVisual(
		<Stack>
			<ComboboxField
				defaultItems={countryItems}
				description="Select where the user is located."
				label="Country"
				name="country"
				placeholder="Select a country..."
			>
				{renderCountryItem}
			</ComboboxField>
		</Stack>,
	);

	await expect.element(locator).toMatchScreenshot('combobox-field-default');
});

test('open menu', async () => {
	renderVisual(
		<Stack>
			<ComboboxField
				defaultItems={countryItems}
				description="Select where the user is located."
				label="Country"
				name="country"
				placeholder="Select a country..."
			>
				{renderCountryItem}
			</ComboboxField>
		</Stack>,
	);

	// Open the listbox by clicking the input.
	await userEvent.click(page.getByRole('combobox', { name: 'Country' }));
	await expect.element(page.getByRole('option', { name: 'Australia' })).toBeInTheDocument();

	// The popover renders in a portal appended to document.body, so screenshot the
	// whole viewport (fixed by the visual project config) rather than the listbox
	// alone. This captures the popover's alignment to the trigger and its layering,
	// not just the listbox's own styling.
	await expect.element(page.elementLocator(document.body)).toMatchScreenshot('combobox-field-open');
});

test('sizes', async () => {
	const locator = renderVisual(
		<Stack>
			<ComboboxField
				defaultItems={countryItems}
				label="Small"
				name="small"
				placeholder="Small"
				size="small"
			>
				{renderCountryItem}
			</ComboboxField>
			<ComboboxField
				defaultItems={countryItems}
				label="Medium"
				name="medium"
				placeholder="Medium"
				size="medium"
			>
				{renderCountryItem}
			</ComboboxField>
		</Stack>,
	);

	await expect.element(locator).toMatchScreenshot('combobox-field-sizes');
});
