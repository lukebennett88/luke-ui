import { ComboboxField } from '@luke-ui/react/combobox-field';
import { Icon } from '@luke-ui/react/icon';
import {
	ComboboxInput,
	ComboboxInputGroup,
	ComboboxItem,
	ComboboxListBox,
	ComboboxPopover,
	ComboboxRoot,
	ComboboxTrigger,
} from '@luke-ui/react/primitives/combobox';
import { Field } from '@luke-ui/react/primitives/field';
import { createRef } from 'react';
import type { Key } from 'react-aria-components/ComboBox';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import {
	DESKTOP_SCREEN_WIDTH,
	MOBILE_SCREEN_WIDTH,
	mockScreenWidth,
} from '../test-utils/mock-screen-width.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisual, captureVisualAppearance, Stack } from '../test-utils/visual.js';
import { waitForOverlayEnter } from '../test-utils/wait-for-overlay-enter.js';

type CountryItem = {
	id: string;
	label: string;
};

const countryItems: Array<CountryItem> = [
	{ id: 'au', label: 'Australia' },
	{ id: 'ca', label: 'Canada' },
];

const sceneCountryItems: Array<CountryItem> = [
	{ id: 'au', label: 'Australia' },
	{ id: 'ca', label: 'Canada' },
	{ id: 'nz', label: 'New Zealand' },
	{ id: 'us', label: 'United States' },
	{ id: 'se', label: 'Sweden' },
];

const renderCountryItem = (item: CountryItem) => <ComboboxItem>{item.label}</ComboboxItem>;

// Luke UI widens RAC's `inputRef` to accept React Hook Form's callback ref.
test('ComboboxField resolves object and callback inputRefs, submits its value, and fires onBlur', () => {
	const inputRef = createRef<HTMLInputElement>();
	const callbackResolved: Array<HTMLElement | null> = [];
	let blurred = false;
	const { container, locator } = render(
		<>
			<ComboboxField<CountryItem>
				defaultItems={countryItems}
				description="Helpful context"
				inputRef={inputRef}
				label="Country object"
				name="country"
				onBlur={() => {
					blurred = true;
				}}
			>
				{renderCountryItem}
			</ComboboxField>
			<ComboboxField<CountryItem>
				defaultItems={countryItems}
				inputRef={(node: HTMLElement | null) => {
					callbackResolved.push(node);
				}}
				label="Country callback"
				name="country-callback"
			>
				{renderCountryItem}
			</ComboboxField>
		</>,
	);
	const objectControl = locator.getByRole('combobox', { name: 'Country object' }).element();
	const callbackControl = locator.getByRole('combobox', { name: 'Country callback' }).element();

	expect(inputRef.current).toBe(objectControl);
	expect(callbackResolved.at(-1)).toBe(callbackControl);
	expect(objectControl).toHaveAttribute('aria-describedby');
	// React Aria submits through a hidden input.
	expect(container.querySelector('input[type="hidden"][name="country"]')).not.toBeNull();

	const form = document.createElement('form');
	container.replaceWith(form);
	form.append(container);
	const namedControl = form.elements.namedItem('country');
	if (!(namedControl instanceof HTMLInputElement)) {
		throw new Error('Expected a native input named country.');
	}
	namedControl.value = 'au';
	expect(new FormData(form).get('country')).toBe('au');

	if (!(objectControl instanceof HTMLElement)) throw new Error('Expected an HTML control.');
	objectControl.focus();
	objectControl.blur();
	expect(blurred).toBe(true);

	form.remove();
});

test('the ComboboxField scene has no axe violations', async () => {
	const { container } = render(
		<Stack>
			<ComboboxField
				defaultItems={sceneCountryItems}
				label="Resting"
				name="resting"
				placeholder="Select a country..."
			>
				{renderCountryItem}
			</ComboboxField>
			<ComboboxField
				defaultItems={sceneCountryItems}
				description="Pick where you are based."
				label="With description"
				name="described"
			>
				{renderCountryItem}
			</ComboboxField>
			<ComboboxField
				defaultItems={sceneCountryItems}
				errorMessage="Choose a country."
				label="Invalid"
				name="invalid"
			>
				{renderCountryItem}
			</ComboboxField>
			<ComboboxField defaultItems={sceneCountryItems} isDisabled label="Disabled" name="disabled">
				{renderCountryItem}
			</ComboboxField>
		</Stack>,
	);

	await expectNoAxeViolations(container);
});

test('ComboboxField uses a mobile modal to search and select an option', async () => {
	mockScreenWidth(MOBILE_SCREEN_WIDTH);
	const inputRef = createRef<HTMLInputElement>();
	const { container } = render(
		<form aria-label="Country form" style={{ inlineSize: 'max-content' }}>
			<ComboboxField
				defaultItems={countryItems}
				defaultValue="au"
				inputRef={inputRef}
				label="Country"
				name="country"
			>
				{renderCountryItem}
			</ComboboxField>
		</form>,
	);
	const form = container.querySelector('form');
	if (form == null) throw new Error('Expected the form element.');

	const trigger = page.getByRole('button', { name: 'Country Australia' });
	const dialog = page.getByRole('dialog');
	const searchbox = page.getByRole('searchbox', { name: 'Country' });

	// The mobile composition renders a value button where the desktop one renders a text input.
	expect(inputRef.current).toBeNull();

	await userEvent.click(trigger);
	await expect.element(dialog).toBeVisible();
	expect(inputRef.current).toBe(searchbox.element());

	const modal = dialog.element().parentElement;
	const overlay = modal?.parentElement;
	if (modal == null || overlay == null) {
		throw new Error('Expected the mobile modal structure.');
	}

	// Measuring the tray only means anything once it has stopped sliding up.
	await waitForOverlayEnter(overlay);

	expect(getComputedStyle(overlay).top).toBe(`${window.scrollY}px`);

	// RAC's own `Modal` sets `--visual-viewport-height` from `useViewportSize`, so overriding it
	// stands in for the keyboard shrinking the visual viewport. `mobileModal` must take the shrunk
	// amount off `blockSize` and spend it on `paddingBlockEnd`, so the sheet keeps its content above
	// the keyboard. Every expectation is measured at runtime, so none pins a resolved spacing value.
	const restingViewportHeight = window.innerHeight;
	const keyboardInset = Math.round(restingViewportHeight / 2);
	overlay.style.setProperty('--visual-viewport-height', `${restingViewportHeight}px`);
	const trayTop = modal.getBoundingClientRect().top;
	const restingBlockSize = Number.parseFloat(getComputedStyle(modal).height);
	const restingPaddingBlockEnd = Number.parseFloat(getComputedStyle(modal).paddingBottom);
	// The tray's content box runs from its top offset to the bottom of the visual viewport.
	expect(restingBlockSize + trayTop).toBeCloseTo(restingViewportHeight, 1);

	overlay.style.setProperty(
		'--visual-viewport-height',
		`${restingViewportHeight - keyboardInset}px`,
	);
	expect(Number.parseFloat(getComputedStyle(modal).height) + trayTop).toBeCloseTo(
		restingViewportHeight - keyboardInset,
		1,
	);
	expect(Number.parseFloat(getComputedStyle(modal).paddingBottom)).toBeCloseTo(
		restingPaddingBlockEnd + keyboardInset,
		1,
	);

	const listbox = page.getByRole('listbox').element();
	// Programmatic `element.scrollTo()` does not exercise scroll chaining. Browser-computed
	// overscroll-behavior is the Luke UI-owned contract (`mobileListBox`).
	expect(getComputedStyle(listbox).overscrollBehavior).toBe('contain');

	await userEvent.click(page.getByRole('option', { name: 'Canada' }));

	await expect.poll(() => new FormData(form).get('country')).toBe('ca');
});

test('ComboboxField reopens the popover when the focused input is clicked again', async () => {
	const { locator } = render(
		<ComboboxField defaultItems={countryItems} label="Country">
			{renderCountryItem}
		</ComboboxField>,
	);
	const input = locator.getByRole('combobox', { name: 'Country' }).element() as HTMLElement;

	await userEvent.click(input);
	await expect.element(page.getByRole('option', { name: 'Australia' })).toBeVisible();

	await userEvent.keyboard('{Escape}');
	await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
	expect(document.activeElement).toBe(input);

	await userEvent.click(input);
	await expect.element(page.getByRole('option', { name: 'Australia' })).toBeVisible();
});

test('an unlabeled ComboboxField exposes aria-label on the combobox', () => {
	const { locator } = render(
		<ComboboxField aria-label="Country" defaultItems={countryItems}>
			{renderCountryItem}
		</ComboboxField>,
	);

	expect(locator.getByRole('combobox', { name: 'Country' }).element()).toBeTruthy();
});

test('ComboboxField clearing the tray search clears the selection', async () => {
	mockScreenWidth(MOBILE_SCREEN_WIDTH);
	const { container } = render(
		<form aria-label="Country form">
			<ComboboxField defaultItems={countryItems} defaultValue="au" label="Country" name="country">
				{renderCountryItem}
			</ComboboxField>
		</form>,
	);
	const form = container.querySelector('form');
	if (form == null) throw new Error('Expected the form element.');

	const trigger = page.getByRole('button', { name: 'Country Australia' }).element();
	await userEvent.click(trigger);
	await expect.element(page.getByRole('dialog')).toBeVisible();

	await userEvent.click(page.getByRole('button', { name: 'Clear search' }).element());
	await userEvent.keyboard('{Escape}');
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

	expect(new FormData(form).get('country')).toBe('');
	await expect.element(trigger).toHaveTextContent('');
});

test('ComboboxField leaves a consumer-controlled inputValue authoritative', async () => {
	const { locator } = render(
		<ComboboxField defaultItems={countryItems} inputValue="Aus" label="Country">
			{renderCountryItem}
		</ComboboxField>,
	);
	const input = locator.getByRole('combobox', { name: 'Country' });
	await expect.element(input).toHaveValue('Aus');

	await userEvent.click(page.getByRole('button', { name: 'Toggle options Country' }).element());
	await userEvent.click(page.getByRole('option', { name: 'Australia' }).element());
	await expect.element(input).toHaveValue('Aus');
});

test('ComboboxField clears the selection when the desktop input is emptied', async () => {
	const changes: Array<Key | null> = [];
	const { container, locator } = render(
		<form aria-label="Country form">
			<ComboboxField
				defaultItems={countryItems}
				defaultValue="au"
				label="Country"
				name="country"
				onChange={(next) => changes.push(next)}
			>
				{renderCountryItem}
			</ComboboxField>
		</form>,
	);
	const form = container.querySelector('form');
	if (form == null) throw new Error('Expected the form element.');
	const input = locator.getByRole('combobox', { name: 'Country' });
	await expect.element(input).toHaveValue('Australia');

	await userEvent.clear(input.element());
	await userEvent.keyboard('{Escape}');

	expect(new FormData(form).get('country')).toBe('');
	expect(changes).toEqual([null]);
	await expect.element(input).toHaveValue('');
});

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(
			<Stack>
				<ComboboxField
					defaultItems={sceneCountryItems}
					label="Resting"
					name="resting"
					placeholder="Select a country..."
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxField
					defaultItems={sceneCountryItems}
					defaultValue="ca"
					isDisabled
					label="Disabled"
					name="disabled"
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxField
					defaultItems={sceneCountryItems}
					defaultValue="ca"
					isReadOnly
					label="Read-only"
					name="readonly"
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxField
					defaultItems={sceneCountryItems}
					errorMessage="Choose a valid country."
					label="Invalid"
					name="invalid"
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxField
					defaultItems={sceneCountryItems}
					defaultValue="ca"
					errorMessage="Choose a different country."
					label="Invalid with a selection"
					name="invalid-with-selection"
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxRoot defaultItems={sceneCountryItems} isInvalid name="invalid-no-message">
					<Field label="Invalid, no message">
						<ComboboxInputGroup>
							<ComboboxInput placeholder="Select a country..." />
							<ComboboxTrigger aria-label="Toggle options">
								<Icon name="chevronDown" />
							</ComboboxTrigger>
						</ComboboxInputGroup>
						<ComboboxPopover offset={4}>
							<ComboboxListBox>{renderCountryItem}</ComboboxListBox>
						</ComboboxPopover>
					</Field>
				</ComboboxRoot>
				<ComboboxField
					defaultItems={sceneCountryItems}
					defaultValue="ca"
					errorMessage="Choose a different country."
					label="Invalid small"
					name="invalid-small"
					size="small"
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxField
					defaultItems={sceneCountryItems}
					label="Small"
					name="small"
					placeholder="Small"
					size="small"
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxField
					defaultItems={sceneCountryItems}
					label="Medium"
					name="medium"
					placeholder="Medium"
					size="medium"
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxRoot
					defaultItems={sceneCountryItems}
					name="small-group-medium-trigger"
					size="small"
				>
					<Field label="Small group, medium trigger">
						<ComboboxInputGroup>
							<ComboboxInput placeholder="Select a country..." />
							<ComboboxTrigger aria-label="Toggle medium trigger" size="medium">
								<Icon name="chevronDown" />
							</ComboboxTrigger>
						</ComboboxInputGroup>
						<ComboboxPopover offset={4}>
							<ComboboxListBox>{renderCountryItem}</ComboboxListBox>
						</ComboboxPopover>
					</Field>
				</ComboboxRoot>
			</Stack>,
			{ appearance },
		);
		await captureVisualAppearance(locator, 'combobox-field/kitchen-sink', appearance);
	}
});

test('open popover', { tags: ['visual'] }, async () => {
	render(
		<ComboboxField
			defaultItems={sceneCountryItems}
			defaultValue="ca"
			label="Country"
			name="country"
		>
			{renderCountryItem}
		</ComboboxField>,
	);

	await userEvent.click(page.getByRole('combobox', { name: 'Country' }));
	await captureVisual(page.elementLocator(document.body), 'combobox-field/open');
});

test('mobile tray', { tags: ['visual'] }, async () => {
	await page.viewport(MOBILE_SCREEN_WIDTH, 700);
	mockScreenWidth(MOBILE_SCREEN_WIDTH);
	try {
		render(
			<Stack>
				<ComboboxField
					defaultItems={sceneCountryItems}
					description="Select where the user is located."
					label="Country"
					name="country"
					placeholder="Select a country..."
				>
					{renderCountryItem}
				</ComboboxField>
			</Stack>,
		);
		await userEvent.click(page.getByRole('button', { name: 'Country Select a country...' }));
		await waitForMobileTrayToSettle();
		await captureVisual(page.elementLocator(document.body), 'combobox-field/tray');
	} finally {
		// Screen width resets in render-setup `beforeEach`.
		await page.viewport(DESKTOP_SCREEN_WIDTH, 800);
	}
});

async function waitForMobileTrayToSettle() {
	const dialog = page.getByRole('dialog');
	await expect.element(dialog).toBeInTheDocument();
	const modal = dialog.element().parentElement;
	const overlay = modal?.parentElement;
	if (modal == null || overlay == null) throw new Error('Expected the mobile modal structure.');

	await waitForOverlayEnter(overlay);
	await expect.element(page.elementLocator(overlay)).toBeVisible();
	expect(window.innerWidth).toBe(MOBILE_SCREEN_WIDTH);
	expect(window.innerHeight).toBe(700);
	expect(window.matchMedia('(width > 450px)').matches).toBe(false);
	expect(getComputedStyle(modal).borderEndStartRadius).toBe('0px');
	expect(getComputedStyle(modal).borderEndEndRadius).toBe('0px');
}
