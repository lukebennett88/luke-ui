import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { LoadingSpinner } from '../loading-spinner/index.js';
import { mockScreenWidth } from '../test-utils/mock-screen-width.js';
import { render, visualAppearances } from '../test-utils/render.js';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	focusViaKeyboard,
	Stack,
} from '../test-utils/visual.js';
import { ComboboxField } from './index.js';
import { ComboboxItem, ComboboxLoadMoreItem } from './primitive/item.js';
import { ComboboxSection } from './primitive/section.js';

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

test('kitchen sink', async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(
			<Stack>
				<ComboboxField
					defaultItems={countryItems}
					label="Resting"
					name="resting"
					placeholder="Select a country..."
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxField
					defaultItems={countryItems}
					defaultValue="ca"
					isDisabled
					label="Disabled"
					name="disabled"
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxField
					defaultItems={countryItems}
					defaultValue="ca"
					isReadOnly
					label="Read-only"
					name="readonly"
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxField
					defaultItems={countryItems}
					errorMessage="Choose a valid country."
					isInvalid
					label="Invalid"
					name="invalid"
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxField
					defaultItems={countryItems}
					defaultValue="ca"
					errorMessage="Choose a different country."
					isInvalid
					label="Invalid with a selection"
					name="invalid-with-selection"
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxField
					defaultItems={countryItems}
					isInvalid
					label="Invalid, no message"
					name="invalid-no-message"
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxField
					defaultItems={countryItems}
					defaultValue="ca"
					errorMessage="Choose a different country."
					isInvalid
					label="Invalid small"
					name="invalid-small"
					size="small"
				>
					{renderCountryItem}
				</ComboboxField>
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
			{ appearance },
		);
		await captureVisualAppearance(locator, 'combobox-field/kitchen-sink', appearance);
	}
});

test('interactive states', async () => {
	const { locator } = render(
		<ComboboxField defaultItems={countryItems} defaultValue="ca" label="Country" name="country">
			{renderCountryItem}
		</ComboboxField>,
	);
	const input = page.getByRole('combobox', { name: 'Country' });
	const clear = page.getByRole('button', { name: 'Clear selection' });
	const trigger = page.getByRole('button', { name: 'Toggle options' });

	await captureVisual(locator, 'combobox-field/resting');
	await userEvent.hover(input);
	await captureVisual(locator, 'combobox-field/hover');
	await userEvent.unhover(input);
	await userEvent.hover(clear);
	await captureVisual(locator, 'combobox-field/clear-hover');
	await userEvent.unhover(clear);
	await userEvent.hover(trigger);
	await captureVisual(locator, 'combobox-field/trigger-hover');
	await userEvent.unhover(trigger);
	await focusViaKeyboard(input);
	await captureVisual(locator, 'combobox-field/focus-visible');
	await userEvent.tab();
	await captureVisual(locator, 'combobox-field/clear-focus-visible');
	await userEvent.keyboard('{Space>}');
	await captureVisual(locator, 'combobox-field/clear-pressed');
	await userEvent.keyboard('{/Space}');
});

test('open option and selection states', async () => {
	render(
		<ComboboxField
			defaultItems={countryItems}
			defaultValue="ca"
			disabledKeys={['se']}
			label="Country"
			loadMoreItem={
				<ComboboxLoadMoreItem isLoading>
					<LoadingSpinner aria-label="Loading more options..." size="small" />
				</ComboboxLoadMoreItem>
			}
			name="country"
		>
			{renderCountryItem}
		</ComboboxField>,
	);
	const input = page.getByRole('combobox', { name: 'Country' });

	await userEvent.click(input);
	await captureVisual(
		page.elementLocator(document.body),
		'combobox-field/open-selected-disabled-loading',
	);
	await userEvent.keyboard('{Home}');
	await captureVisual(page.elementLocator(document.body), 'combobox-field/option-keyboard-focus');
});

test('mobile tray', async () => {
	await page.viewport(390, 700);
	const restoreScreenWidth = mockScreenWidth(700);
	try {
		render(
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
		await userEvent.click(page.getByRole('button', { name: 'Country' }));
		await waitForMobileTrayToSettle();
		await captureVisual(page.elementLocator(document.body), 'combobox-field/tray');
	} finally {
		restoreScreenWidth();
		await page.viewport(1024, 800);
	}
});

test('mobile tray short list', async () => {
	await page.viewport(390, 700);
	const restoreScreenWidth = mockScreenWidth(700);
	try {
		render(
			<Stack>
				<ComboboxField
					defaultItems={countryItems.slice(0, 2)}
					description="Select where the user is located."
					label="Country"
					name="country"
					placeholder="Select a country..."
				>
					{renderCountryItem}
				</ComboboxField>
			</Stack>,
		);
		await userEvent.click(page.getByRole('button', { name: 'Country' }));
		await waitForMobileTrayToSettle();
		await captureVisual(page.elementLocator(document.body), 'combobox-field/tray-short');
	} finally {
		restoreScreenWidth();
		await page.viewport(1024, 800);
	}
});

test('forced-colors states', async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
			<Stack>
				<ComboboxField
					defaultItems={countryItems}
					defaultValue="ca"
					disabledKeys={['se']}
					label="Interactive"
					name="interactive"
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxField
					defaultItems={countryItems}
					defaultValue="ca"
					isDisabled
					label="Disabled"
					name="disabled"
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxField
					defaultItems={countryItems}
					defaultValue="ca"
					isReadOnly
					label="Read-only"
					name="readonly"
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxField
					defaultItems={countryItems}
					errorMessage="Choose a valid country."
					isInvalid
					label="Invalid"
					name="invalid"
				>
					{renderCountryItem}
				</ComboboxField>
			</Stack>,
		);
		const input = page.getByRole('combobox', { name: 'Interactive' });
		const trigger = page.getByRole('button', { name: 'Toggle options' }).first();

		await captureVisual(locator, 'combobox-field/forced-colors-resting-states');
		await userEvent.hover(trigger);
		await captureVisual(locator, 'combobox-field/forced-colors-trigger-hover');
		await userEvent.unhover(trigger);
		await focusViaKeyboard(input);
		await captureVisual(locator, 'combobox-field/forced-colors-focus-visible');
		await userEvent.keyboard('{ArrowDown}{Home}');
		await captureVisual(
			page.elementLocator(document.body),
			'combobox-field/forced-colors-open-options',
		);
		await userEvent.keyboard('{Escape}');
	} finally {
		await emulateForcedColors('none');
	}
});

test('rich section title', async () => {
	render(
		<Stack width="14rem">
			<ComboboxField label="Country" name="grouped-rich" placeholder="Select a country...">
				<ComboboxSection
					id="north"
					title={
						<>
							Northern <strong>hemisphere</strong> countries and <em>territories</em>
						</>
					}
				>
					<ComboboxItem id="ca">Canada</ComboboxItem>
					<ComboboxItem id="us">United States</ComboboxItem>
				</ComboboxSection>
			</ComboboxField>
		</Stack>,
	);

	await userEvent.click(page.getByRole('combobox', { name: 'Country' }));
	await captureVisual(
		page.elementLocator(document.body),
		'combobox-field/section-title-rich-content',
	);
});

async function waitForMobileTrayToSettle() {
	const searchbox = page.getByRole('searchbox', { name: 'Country' });
	const dialog = page.getByRole('dialog');

	await expect
		.poll(() => {
			const searchboxRect = searchbox.element().getBoundingClientRect();
			const dialogRect = dialog.element().getBoundingClientRect();
			const modal = dialog.element().parentElement;
			if (modal == null) return false;

			const modalTop = modal.getBoundingClientRect().top;
			const finalTop = 32;
			return {
				dialogBottomInside: dialogRect.bottom <= window.innerHeight + 1,
				dialogTopInside: dialogRect.top >= 0,
				modalAtFinalTop: Math.abs(modalTop - finalTop) < 0.5,
				searchboxBottomInside: searchboxRect.bottom <= window.innerHeight,
				searchboxTopInside: searchboxRect.top >= 0,
				windowScrollY: window.scrollY,
			};
		})
		.toEqual({
			dialogBottomInside: true,
			dialogTopInside: true,
			modalAtFinalTop: true,
			searchboxBottomInside: true,
			searchboxTopInside: true,
			windowScrollY: 0,
		});
}
