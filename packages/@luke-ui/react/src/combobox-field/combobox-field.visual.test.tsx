import { expect, test } from 'vite-plus/test';
import type { Locator } from 'vite-plus/test/context';
import { cdp, page, userEvent } from 'vite-plus/test/context';
import { Icon } from '../icon/index.js';
import { LoadingSpinner } from '../loading-spinner/index.js';
import { ComboboxItem, ComboboxLoadMoreItem } from '../primitives/combobox/item.js';
import { ComboboxSection } from '../primitives/combobox/section.js';
import { mockScreenWidth } from '../test-utils/mock-screen-width.js';
import { render, visualAppearances } from '../test-utils/render.js';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	focusViaKeyboard,
	Stack,
} from '../test-utils/visual.js';
import { waitForOverlayEnter } from '../test-utils/wait-for-overlay-enter.js';
import { ComboboxField } from './index.js';

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

const renderIconItem = (item: CountryItem) => (
	<ComboboxItem>
		<Icon aria-hidden name="bookOpen" />
		{item.label}
	</ComboboxItem>
);

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

	await userEvent.hover(input);
	await captureVisual(locator, 'combobox-field/hover');
	await userEvent.unhover(input);
	await userEvent.hover(clear);
	await captureVisual(clear, 'combobox-field/clear-hover');
	await userEvent.unhover(clear);
	await userEvent.hover(trigger);
	await captureVisual(trigger, 'combobox-field/trigger-hover');
	await userEvent.unhover(trigger);
	await focusViaKeyboard(input);
	await captureVisual(locator, 'combobox-field/focus-visible');
	await userEvent.tab();
	await captureVisual(locator, 'combobox-field/clear-focus-visible');
	await userEvent.keyboard('{Space>}');
	await captureVisual(clear, 'combobox-field/clear-pressed');
	await userEvent.keyboard('{/Space}');
});

test('trigger hover in dark mode', async () => {
	render(
		<ComboboxField defaultItems={countryItems} defaultValue="ca" label="Country" name="country">
			{renderCountryItem}
		</ComboboxField>,
		{ appearance: { mode: 'dark', theme: 'tactile' } },
	);
	const trigger = page.getByRole('button', { name: 'Toggle options' });

	await userEvent.hover(trigger);
	await captureVisual(trigger, 'combobox-field/trigger-hover-tactile-dark');
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
});

test('option keyboard focus', async () => {
	render(
		<ComboboxField defaultItems={countryItems} label="Country" name="country">
			{renderCountryItem}
		</ComboboxField>,
	);
	await captureVisual(await openFocusedComboboxOption(), 'combobox-field/option-keyboard-focus');
});

test('option pressed', async () => {
	render(
		<ComboboxField defaultItems={countryItems} label="Country" name="country">
			{renderCountryItem}
		</ComboboxField>,
	);
	await userEvent.click(page.getByRole('combobox', { name: 'Country' }));
	const option = page.getByRole('option', { exact: true, name: 'Australia' });
	await expect.element(option).toBeVisible();

	const release = await pressComboboxOption(option);
	await captureVisual(page.elementLocator(document.body), 'combobox-field/option-pressed');
	await release();
});

test('selected option pressed', async () => {
	render(
		<ComboboxField defaultItems={countryItems} label="Country" name="country">
			{renderCountryItem}
		</ComboboxField>,
	);
	// Selecting through the combobox itself (rather than a `defaultValue`) keeps DOM focus on the
	// input the whole time. A fresh focus event on a combobox that already has a matching value only
	// re-opens reliably right after page load; once another combobox has mounted and unmounted first,
	// that reopen silently no-ops in this test environment. Staying selected-and-focused, then
	// reopening with the keyboard, sidesteps that rather than depending on run order.
	await withPopoverScrollStub(async () => {
		const input = page.getByRole('combobox', { name: 'Country' });
		await userEvent.tab();
		await expect.element(input).toHaveFocus();
		await userEvent.keyboard('{ArrowDown}{ArrowDown}');
		const canadaFocused = page.getByRole('option', { exact: true, name: 'Canada' });
		await expect.poll(() => canadaFocused.element().getAttribute('data-focused')).toBe('true');
		await userEvent.keyboard('{Enter}');
		await expect.poll(() => input.element().getAttribute('aria-expanded')).toBe('false');

		await userEvent.keyboard('{ArrowDown}');
		const option = page.getByRole('option', { exact: true, name: 'Canada' });
		await expect.element(option).toBeVisible();

		const release = await pressComboboxOption(option);
		await captureVisual(
			page.elementLocator(document.body),
			'combobox-field/option-selected-pressed',
		);
		await release();
	});
});

test('option with leading icon at both sizes', async () => {
	render(
		<Stack>
			<ComboboxField defaultItems={countryItems} label="Medium" name="medium">
				{renderIconItem}
			</ComboboxField>
			<ComboboxField defaultItems={countryItems} label="Small" name="small" size="small">
				{renderIconItem}
			</ComboboxField>
		</Stack>,
	);
	await userEvent.click(page.getByRole('combobox', { name: 'Medium' }));
	await captureVisual(
		page.elementLocator(document.body),
		'combobox-field/option-leading-icon-medium',
	);
	await userEvent.keyboard('{Escape}');
	await userEvent.click(page.getByRole('combobox', { name: 'Small' }));
	await captureVisual(
		page.elementLocator(document.body),
		'combobox-field/option-leading-icon-small',
	);
});

test('mobile tray', async () => {
	await page.viewport(390, 700);
	const restoreScreenWidth = mockScreenWidth(390);
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
	const restoreScreenWidth = mockScreenWidth(390);
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

/**
 * Opens with a click, then moves keyboard focus onto the first option. React Aria closes the
 * popover when an option is scrolled into view, so `scrollIntoView` is stubbed for that step.
 * The page is captured rather than the option: Playwright's element screenshot also scrolls, which
 * detaches the portalled list.
 */
async function withPopoverScrollStub<T>(run: () => Promise<T>): Promise<T> {
	const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView');
	if (descriptor == null) throw new Error('Expected Element.prototype.scrollIntoView');
	Object.defineProperty(Element.prototype, 'scrollIntoView', {
		...descriptor,
		value: () => {},
	});
	try {
		return await run();
	} finally {
		Object.defineProperty(Element.prototype, 'scrollIntoView', descriptor);
	}
}

async function openFocusedComboboxOption() {
	return withPopoverScrollStub(async () => {
		await userEvent.click(page.getByRole('combobox', { name: 'Country' }));
		await userEvent.keyboard('{ArrowDown}');
		const option = page.getByRole('option', { exact: true, name: 'Australia' });
		await expect.poll(() => option.element().getAttribute('data-focused')).toBe('true');
		const popover = page.getByRole('listbox').element().parentElement;
		if (popover == null) throw new Error('Expected the popover element.');
		await waitForOverlayEnter(popover);
		return page.elementLocator(document.body);
	});
}

/**
 * Presses an option with a raw CDP mouse event instead of `userEvent.hover`/`click`. Playwright's
 * locator-level hover and click actions perform their own pre-action scroll-into-view check, which
 * closes this component's popover the same way keyboard navigation's `scrollIntoView` does (see
 * `withPopoverScrollStub`), except this scroll happens natively and cannot be stubbed from script.
 * Dispatching the mouse event directly at the option's coordinates lands `data-hovered` and
 * `data-pressed` without that pre-action scroll. Returns a callback that releases the mouse button;
 * call it after capturing so the option's real `onPress` selection behaviour still runs.
 */
async function pressComboboxOption(option: Locator): Promise<() => Promise<void>> {
	const rect = option.element().getBoundingClientRect();
	const frameElement = (window as unknown as { frameElement?: Element }).frameElement;
	const frameRect = frameElement?.getBoundingClientRect();
	const x = (frameRect?.left ?? 0) + rect.left + rect.width / 2;
	const y = (frameRect?.top ?? 0) + rect.top + rect.height / 2;

	await cdp().send('Input.dispatchMouseEvent', { button: 'none', type: 'mouseMoved', x, y });
	await cdp().send('Input.dispatchMouseEvent', {
		button: 'left',
		clickCount: 1,
		type: 'mousePressed',
		x,
		y,
	});
	await expect.poll(() => option.element().getAttribute('data-pressed')).toBe('true');

	return async () => {
		await cdp().send('Input.dispatchMouseEvent', {
			button: 'left',
			clickCount: 1,
			type: 'mouseReleased',
			x,
			y,
		});
	};
}

/**
 * Waits for the tray to finish opening before a capture. The screenshot owns the resting geometry,
 * so nothing here measures a position.
 */
async function waitForMobileTrayToSettle() {
	const dialog = page.getByRole('dialog');
	await expect.element(dialog).toBeVisible();

	const overlay = dialog.element().parentElement?.parentElement;
	if (overlay == null) throw new Error('Expected the mobile modal structure.');

	await waitForOverlayEnter(overlay);
}
