import { expect, test } from 'vite-plus/test';
import type { Locator } from 'vite-plus/test/context';
import { page, userEvent } from 'vite-plus/test/context';
import { LoadingSpinner } from '../loading-spinner/index.js';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	focusViaKeyboard,
	renderVisual,
	Stack,
	visualAppearances,
} from '../test-utils/render-visual.js';
import { paperThemeClassName, tactileThemeClassName } from '../themes/index.js';
import { ComboboxField } from './index.js';
import { ComboboxItem, ComboboxLoadMoreItem } from './primitive/item.js';

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

test.each(visualAppearances)('material states: $theme $mode', async (appearance) => {
	const scene = renderVisual(
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
				label="With actions"
				name="actions"
			>
				{renderCountryItem}
			</ComboboxField>
		</Stack>,
		appearance,
	);
	await expect.element(page.getByRole('combobox', { name: 'Resting' })).toBeVisible();

	await captureVisualAppearance(scene, 'combobox-field/material-states', appearance);
});

test.each(visualAppearances)('interactive states: $theme $mode', async (appearance) => {
	const scene = renderVisual(
		<Stack>
			<ComboboxField defaultItems={countryItems} defaultValue="ca" label="Country" name="country">
				{renderCountryItem}
			</ComboboxField>
		</Stack>,
		appearance,
	);
	const input = page.getByRole('combobox', { name: 'Country' });
	const clear = page.getByRole('button', { name: 'Clear selection' });
	const trigger = page.getByRole('button', { name: 'Toggle options' });
	await expect.element(input).toBeVisible();
	const control = input.element().closest<HTMLElement>('[role="group"]');
	if (control == null) throw new Error('Expected the combobox control group.');
	const clearRect = clear.element().getBoundingClientRect();
	const triggerRect = trigger.element().getBoundingClientRect();
	const controlRect = control.getBoundingClientRect();
	expect(clearRect.width).toBe(clearRect.height);
	expect(triggerRect.width).toBe(triggerRect.height);
	expect(clearRect.width).toBeGreaterThanOrEqual(24);
	expect(triggerRect.width).toBeGreaterThanOrEqual(24);
	expect(triggerRect.left - clearRect.right).toBeGreaterThan(0);
	expect(controlRect.right - triggerRect.right).toBeGreaterThan(0);
	expect(getComputedStyle(trigger.element()).boxShadow).toBe('none');

	await captureVisualAppearance(scene, 'combobox-field/resting', appearance);
	await userEvent.hover(input);
	await captureVisualAppearance(scene, 'combobox-field/hover', appearance);
	await userEvent.unhover(input);
	await userEvent.hover(clear);
	await captureVisualAppearance(scene, 'combobox-field/clear-hover', appearance);
	await userEvent.unhover(clear);
	await userEvent.hover(trigger);
	await captureVisualAppearance(scene, 'combobox-field/trigger-hover', appearance);
	await userEvent.unhover(trigger);
	await focusViaKeyboard(input);
	await captureVisualAppearance(
		refreshVisualScene(scene),
		'combobox-field/focus-visible',
		appearance,
	);
	await userEvent.tab();
	await expect.element(clear).toHaveFocus();
	await captureVisualAppearance(
		refreshVisualScene(scene),
		'combobox-field/clear-focus-visible',
		appearance,
	);
	await userEvent.keyboard('{Space>}');
	await expect.element(clear).toHaveAttribute('data-pressed', 'true');
	await captureVisualAppearance(
		refreshVisualScene(scene),
		'combobox-field/clear-pressed',
		appearance,
	);
	await userEvent.keyboard('{/Space}');
});

test('forced-colors states', async () => {
	await emulateForcedColors('active');

	try {
		const scene = renderVisual(
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
		const control = input.element().closest<HTMLElement>('[role="group"]');
		if (control == null) throw new Error('Expected the interactive combobox control group.');
		const controlLocator = page.elementLocator(control);
		const clear = controlLocator.getByRole('button', { name: 'Clear selection' });
		const trigger = controlLocator.getByRole('button', { name: 'Toggle options' });

		await expect.element(page.getByRole('combobox', { name: 'Disabled' })).toBeDisabled();
		await expect
			.element(page.getByRole('combobox', { name: 'Read-only' }))
			.toHaveAttribute('readonly');
		await expect
			.element(page.getByRole('combobox', { name: 'Invalid' }))
			.toHaveAttribute('aria-invalid', 'true');
		await captureVisual(scene, 'combobox-field/forced-colors-resting-states');
		await userEvent.hover(trigger);
		await expect.element(trigger).toHaveAttribute('data-hovered', 'true');
		await captureVisual(refreshVisualScene(scene), 'combobox-field/forced-colors-trigger-hover');
		await userEvent.unhover(trigger);
		await focusViaKeyboard(input);
		await captureVisual(refreshVisualScene(scene), 'combobox-field/forced-colors-focus-visible');
		await userEvent.keyboard('{ArrowDown}{Home}');
		const focusedOption = page.getByRole('option', { name: 'Australia' });
		await expect.element(focusedOption).toHaveAttribute('data-focused', 'true');
		await expect
			.element(page.getByRole('option', { name: 'Canada' }))
			.toHaveAttribute('aria-selected', 'true');
		await expect
			.element(page.getByRole('option', { name: 'Sweden' }))
			.toHaveAttribute('aria-disabled', 'true');
		await captureVisual(
			page.elementLocator(document.body),
			'combobox-field/forced-colors-open-options',
		);
		await userEvent.keyboard('{Escape}');
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		await userEvent.tab();
		await expect.element(clear).toHaveFocus();
		await userEvent.keyboard('{Space>}');
		await expect.element(clear).toHaveAttribute('data-pressed', 'true');
		await captureVisual(refreshVisualScene(scene), 'combobox-field/forced-colors-clear-pressed');
		await userEvent.keyboard('{/Space}');
	} finally {
		await emulateForcedColors('none');
	}
});

test.each(visualAppearances)('open option interactions: $theme $mode', async (appearance) => {
	renderVisual(
		<Stack>
			<ComboboxField defaultItems={countryItems} label="Country" name="country">
				{renderCountryItem}
			</ComboboxField>
		</Stack>,
		appearance,
	);

	const input = page.getByRole('combobox', { name: 'Country' });
	await focusViaKeyboard(input);
	await userEvent.keyboard('{ArrowDown}');
	const keyboardFocused = page.getByRole('option', { name: 'Australia' });
	await expect.element(keyboardFocused).toHaveAttribute('data-focused', 'true');
	await captureVisualAppearance(
		page.elementLocator(document.body),
		'combobox-field/option-keyboard-focus',
		appearance,
	);

	const hovered = page.getByRole('option', { name: 'New Zealand' });
	await userEvent.hover(hovered);
	await expect.element(hovered).toHaveAttribute('data-hovered', 'true');
	await captureVisualAppearance(
		page.elementLocator(document.body),
		'combobox-field/option-hover',
		appearance,
	);
});

test.each(visualAppearances)('open selection states: $theme $mode', async (appearance) => {
	renderVisual(
		<Stack>
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
			</ComboboxField>
		</Stack>,
		appearance,
	);

	const input = page.getByRole('combobox', { name: 'Country' });
	await userEvent.click(input);
	await expect.element(input).toHaveAttribute('aria-expanded', 'true');
	await expect.element(page.getByRole('option', { name: 'Australia' })).toBeInTheDocument();
	await expect
		.element(page.getByRole('option', { name: 'Canada' }))
		.toHaveAttribute('aria-selected', 'true');
	await expect
		.element(page.getByRole('option', { name: 'Sweden' }))
		.toHaveAttribute('aria-disabled', 'true');
	await expect
		.element(page.getByRole('progressbar', { name: 'Loading more options...' }))
		.toBeVisible();
	await captureVisualAppearance(
		page.elementLocator(document.body),
		'combobox-field/open-selected-disabled-loading',
		appearance,
	);
});

test.each(visualAppearances)(
	'nested opposite mode reaches the portal: $theme $mode',
	async (appearance) => {
		const nestedMode = appearance.mode === 'light' ? 'dark' : 'light';
		renderVisual(
			<div data-color-mode={nestedMode}>
				<Stack>
					<ComboboxField
						defaultItems={countryItems}
						label="Themed country"
						name="themed-country"
						placeholder="Select a country..."
					>
						{renderCountryItem}
					</ComboboxField>
				</Stack>
			</div>,
			appearance,
		);

		await userEvent.click(page.getByRole('combobox', { name: 'Themed country' }));
		const listbox = page.getByRole('listbox');
		const portal = listbox.element().closest('[data-color-mode]');

		expect(portal).toHaveClass(
			appearance.theme === 'paper' ? paperThemeClassName : tactileThemeClassName,
		);
		expect(portal).toHaveAttribute('data-color-mode', nestedMode);
		await captureVisualAppearance(
			page.elementLocator(document.body),
			'combobox-field/nested-opposite-mode-portal',
			appearance,
		);
	},
);

test.each(visualAppearances)('mobile tray: $theme $mode', async (appearance) => {
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
		appearance,
	);

	await page.viewport(390, 700);
	try {
		await userEvent.click(page.getByRole('combobox', { name: 'Country' }));
		await expect.element(page.getByRole('option', { name: 'Australia' })).toBeInTheDocument();

		// Below the `small` breakpoint the popover renders as a bottom tray; screenshot
		// document.body (the popover portals there) to capture it pinned to the viewport edge.
		await captureVisualAppearance(
			page.elementLocator(document.body),
			'combobox-field/tray',
			appearance,
		);
	} finally {
		// Restore the viewport fixed by the visual project config (vitest.config.ts) so later
		// tests in this file/run aren't affected.
		await page.viewport(1024, 800);
	}
});

// Guards the calc-size `fit-content` goldilocks behavior: a short, 2-item tray must hug its
// content height, not stretch to fill the 12em minimum reserved for taller lists.
test.each(visualAppearances)('mobile tray short list: $theme $mode', async (appearance) => {
	renderVisual(
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
		appearance,
	);

	await page.viewport(390, 700);
	try {
		await userEvent.click(page.getByRole('combobox', { name: 'Country' }));
		await expect.element(page.getByRole('option', { name: 'Australia' })).toBeInTheDocument();

		// Below the `small` breakpoint the popover renders as a bottom tray; screenshot
		// document.body (the popover portals there) to capture it pinned to the viewport edge.
		await captureVisualAppearance(
			page.elementLocator(document.body),
			'combobox-field/tray-short',
			appearance,
		);
	} finally {
		// Restore the viewport fixed by the visual project config (vitest.config.ts) so later
		// tests in this file/run aren't affected.
		await page.viewport(1024, 800);
	}
});

test.each(visualAppearances)('sizes: $theme $mode', async (appearance) => {
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
		appearance,
	);
	const smallControl = page
		.getByRole('combobox', { name: 'Small' })
		.element()
		.closest<HTMLElement>('[role="group"]');
	const mediumControl = page
		.getByRole('combobox', { name: 'Medium' })
		.element()
		.closest<HTMLElement>('[role="group"]');
	if (smallControl == null || mediumControl == null) {
		throw new Error('Expected small and medium combobox controls.');
	}
	expect(getComputedStyle(smallControl).blockSize).not.toBe(
		getComputedStyle(mediumControl).blockSize,
	);

	await captureVisualAppearance(locator, 'combobox-field/sizes', appearance);
});

function refreshVisualScene(scene: Locator) {
	return page.elementLocator(scene.element());
}
